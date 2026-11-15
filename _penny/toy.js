// The OWS 10th Anniversary Deal Toy, as an object: six Occupy protesters in gold on a plinth, under a cube of
// glass, on a block of black marble engraved with the date. For the studio wall, what book.js is for the books.
//
// The gold is the sculpt itself (the print file, prepared by toy_prep.py: 200,000 triangles, nearly all of them
// spent on the figures). The marble, the glass and the plinth's sides are simple shapes with smooth edges, because
// that is what they are. Everything is built in millimetres, to the object's own dimensions, and scaled to a
// marble block one unit wide at the end.
//
// Same manners as book.js: it holds the still's pose until told to go, sways a little either side of its front,
// can be grabbed and turned, and settles back; it is only drawn while it is in view; and if there is no WebGL, or
// a file will not load, it rejects, so the caller keeps the still.
//
// Bundled with the parts of three.js it uses into /js/toy.js:
//   cd _penny && npm install && node build.mjs
import {
  AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, Color, DirectionalLight, DoubleSide, ExtrudeGeometry, Group, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, RepeatWrapping, Scene, Shape, SRGBColorSpace, TextureLoader, Vector3, WebGLRenderer
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const PI = Math.PI;

// The object, in millimetres, measured from the photographs. y is up; the marble sits on y = 0.
const MARBLE = { w: 136, h: 118, d: 136 };
// The acrylic is one solid piece: a block with a single plane sloping up towards the back, the shape of a lean-to
// roof. Its front is 112 mm tall, its back 164.
const GLASS = { w: 111, d: 111, front: 112, rise: 52 };
const TOTAL_H = MARBLE.h + GLASS.front + GLASS.rise;       // 282, to the top of the back edge
const FIG_LIFT = MARBLE.h + 25.2;                 // the plinth's underside (z = -25.2 in the print file) rests on the stone

// The light boxes. A room of softboxes that the object reflects and the viewer never sees: they exist only in the
// reflection map the surfaces look at, never in the picture, and the canvas behind the object stays clear. What
// reads as polish is how crisp their edges are in the surface, so they are large, bright and hard-edged, in a
// dark room; their placement is what puts a bright plane on the roof, a black one on the sides, a bar of light
// on a marble edge. Directions: +z is towards the viewer, +y up.
function studio(renderer) {
  const room = new Scene();
  room.background = new Color(0x050506);
  function box(w, h, x, y, z, r, g, b) {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(r, g, b), side: DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    room.add(m);
  }
  // The roof looks up and back (about 27 degrees, tilted as the piece sits), so that is where its light is: one box, no bigger than the roof's
  // reach. The sides are seen at a grazing angle, where glass mirrors almost perfectly, and look towards the back
  // of the room, so the back of the room is mostly dark with a pair of narrow strips: a bar down the right-hand
  // face, a fainter one down the left. Nothing stands to either side of the object.
  box(24, 8, 0, 5.4, -8.4, 0.85, 0.84, 0.82);       // what the sloped roof reflects: it looks up about 27 degrees at the back once the piece is tilted
  box(2, 18, 7, 1.5, -9, 4.4, 4.5, 4.8);          // strip, behind right, a touch cool
  box(2, 18, -8, 1, -8, 1.8, 1.7, 1.6);           // strip, behind left, fainter and warmer
  box(20, 7, 0, 11, 4, 1.6, 1.55, 1.5);            // a softbox over the viewer: the top of the marble, the gold
  box(16, 4, 0, -8, 5, 1.2, 1.1, 1.0);            // the floor's bounce
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(room, 0).texture;
  pm.dispose();
  return tex;
}

// A small seeded generator, so a piece always sways the same way and no two sway alike.
function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed || '')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return function () {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function load(loader, url) {
  return loader.loadAsync(url).then((t) => { t.colorSpace = SRGBColorSpace; return t; });
}

// The sculpt: a gzipped file of quantized positions and 32-bit indices (see toy_prep.py), in the print file's
// own frame (z up, the front towards -y), turned here to y up with the front towards the viewer.
async function loadFigures(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('figures: ' + res.status);
  const raw = typeof DecompressionStream === 'function'
    ? await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : (() => { throw new Error('no DecompressionStream'); })();
  const dv = new DataView(raw);
  if (dv.getUint32(0, false) !== 0x4f575331) throw new Error('figures: not an OWS1 file');    // "OWS1"
  const V = dv.getUint32(4, true), T = dv.getUint32(8, true);
  const lo = [0, 1, 2].map((i) => dv.getFloat32(12 + i * 4, true));
  const hi = [0, 1, 2].map((i) => dv.getFloat32(24 + i * 4, true));
  const q = new Uint16Array(raw.slice(36, 36 + V * 6));
  const idx = new Uint32Array(raw.slice(36 + V * 6, 36 + V * 6 + T * 12));
  const pos = new Float32Array(V * 3);
  const sx = (hi[0] - lo[0]) / 65535, sy = (hi[1] - lo[1]) / 65535, sz = (hi[2] - lo[2]) / 65535;
  for (let i = 0; i < V; i++) {
    const x = lo[0] + q[i * 3] * sx, y = lo[1] + q[i * 3 + 1] * sy, z = lo[2] + q[i * 3 + 2] * sz;
    pos[i * 3] = x; pos[i * 3 + 1] = z + FIG_LIFT; pos[i * 3 + 2] = -y;     // (x, y, z) -> (x, z, -y): a turn, not a mirror
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

// opts: el (the stage), model (the sculpt), marble and front (the stone, and the stone with its engraving),
// h/d (proportions, width = 1), hold (stay exactly in the pose of the still it replaces, until start() is called,
// or the piece is grabbed), pointerEl (what is dragged to turn it: on the wall, the whole tile), drag (default
// true), seed (a string: each sways in its own way), sway (radians) and period (seconds) to override, ry/rx (an
// opening pose, for looking), onLost. Resolves once the first frame is on the canvas.
export function build(opts) {
  const host = opts.el;
  const S = 1 / MARBLE.w;                       // the marble is one unit wide
  const W = 1, H = TOTAL_H * S;
  const fit = opts.fit || Math.max(1, Math.max(H, W) / 1.617);

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { return Promise.reject(e); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 5.3 * fit);

  const loader = new TextureLoader();
  loader.setCrossOrigin('anonymous');

  return Promise.all([loadFigures(opts.model), load(loader, opts.marble), load(loader, opts.front)]).then(function (got) {
    const figGeo = got[0], stone = got[1], front = got[2];
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    stone.anisotropy = front.anisotropy = maxAniso;
    stone.wrapS = stone.wrapT = RepeatWrapping;

    const env = studio(renderer);
    scene.environment = env;

    // Everything is built in millimetres about the middle of the whole piece, and scaled once at the end.
    const piece = new Group();
    const body = new Group();
    body.position.y = -(TOTAL_H / 2) * S;        // the group's own position is in scene units; its children are in mm
    body.scale.setScalar(S);
    piece.add(body);
    scene.add(piece);

    // the stone: a block with a soft polished edge. Faces are +x, -x, +y, -y, +z, -z: only the front is engraved
    const face = (ox, oy, rep) => {
      const t = stone.clone();
      t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(rep, rep); t.offset.set(ox, oy); t.needsUpdate = true;
      return new MeshPhysicalMaterial({ map: t, roughness: 0.42, metalness: 0, clearcoat: 0.32, clearcoatRoughness: 0.06, envMapIntensity: 0.12 });
    };
    const stoneMats = [face(0.31, 0.12, 0.8), face(0.66, 0.5, 0.8), face(0.5, 0.88, 0.8), face(0.2, 0.3, 0.8),
      new MeshPhysicalMaterial({ map: front, roughness: 0.42, metalness: 0, clearcoat: 0.32, clearcoatRoughness: 0.06, envMapIntensity: 0.12 }),
      face(0.12, 0.62, 0.8)];
    const stoneGeo = new RoundedBoxGeometry(MARBLE.w, MARBLE.h, MARBLE.d, 5, 1.6);
    const stoneMesh = new Mesh(stoneGeo, stoneMats);
    stoneMesh.position.y = MARBLE.h / 2;
    body.add(stoneMesh);

    // The glass: one solid piece. Its profile is a quadrilateral (front edge low, back edge high), extruded the
    // width of the piece, with its edges rounded where polished acrylic is. Built about its own middle, then turned
    // so the profile runs front to back.
    const gw = GLASS.w, bev = 1.6;
    const prof = new Shape();
    const u0 = -GLASS.d / 2 + bev, u1 = GLASS.d / 2 - bev, v0 = bev;
    prof.moveTo(u0, v0);
    prof.lineTo(u1, v0);
    prof.lineTo(u1, GLASS.front - bev);                                  // up the front
    prof.lineTo(u0, GLASS.front + GLASS.rise - bev);                     // along the roof, rising away
    prof.lineTo(u0, v0);                                                 // down the back
    const glassGeo = new ExtrudeGeometry(prof, { depth: gw - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 8 });
    glassGeo.translate(0, 0, -(gw - 2 * bev) / 2);
    // Acrylic of this thickness is clear but not invisible: it takes a little light out of whatever is behind it
    // (the tint), and gives back the room (the reflection). Two layers say that: a faint dark veil, and a layer
    // that adds only what the surface reflects. Reflected light is not scaled by the veil's opacity, which it
    // would be if both were one material. Back faces are drawn as well, so the far side of the block shows too.
    const veilMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false, side: DoubleSide });
    const sheenMat = new MeshPhysicalMaterial({
      color: 0x000000, metalness: 0, roughness: 0.015, ior: 1.52, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.01,
      envMapIntensity: 1.0, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide
    });
    const glassGroup = new Group();
    const veil = new Mesh(glassGeo, veilMat), sheen = new Mesh(glassGeo, sheenMat);
    veil.renderOrder = 2; sheen.renderOrder = 3;
    glassGroup.add(veil, sheen);
    glassGroup.rotation.y = -PI / 2;                                     // the profile's u runs +z, towards the viewer
    glassGroup.position.y = MARBLE.h;
    body.add(glassGroup);

    // the gold
    const goldMat = new MeshStandardMaterial({ color: 0xe6a47c, metalness: 1, roughness: 0.2, envMapIntensity: 1.55 });
    body.add(new Mesh(figGeo, goldMat));

    scene.add(new AmbientLight(0xffffff, 0.25 * PI));
    const key = new DirectionalLight(0xfff1e0, 0.8 * PI);
    key.position.set(-1.6, 4.2, 5.4);
    scene.add(key);
    const rim = new DirectionalLight(0xbfd0e6, 0.35 * PI);
    rim.position.set(3.6, 1.4, -3.0);
    scene.add(rim);

    // It does not go round: it sways a little either side of its front, very slowly, with a second wobble across
    // the first, each in its own way. It settles into a gentle look down on it from where the still holds it flat.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rnd = rng(opts.seed);
    const period = opts.period || 46 + rnd() * 48;
    const reach = reduce ? 0 : (opts.sway === undefined ? 0.2 + rnd() * 0.2 : opts.sway);
    const omega = (2 * PI) / period;
    const phi = rnd() * 2 * PI, phi2 = rnd() * 2 * PI, phiX = rnd() * 2 * PI;
    const RX = opts.rx === undefined ? -0.2 : opts.rx;
    let t = 0, off = opts.ry || 0, offx = 0, ry = off, rx = opts.rx !== undefined ? opts.rx : 0, vy = 0, vx = 0, settle = opts.rx !== undefined ? 1 : 0;
    const shortWay = (a) => a - Math.round(a / (2 * PI)) * 2 * PI;
    const arrive = () => { const x = Math.min(1, t / 6); return x * x * (3 - 2 * x); };
    const swayY = () => reach * arrive() * (0.82 * Math.sin(omega * t + phi) + 0.18 * Math.sin(omega * 1.9 * t + phi2));
    const swayX = () => (reduce ? 0 : 0.03 * arrive() * Math.sin(omega * 0.7 * t + phiX));
    const baseX = () => RX * (1 - Math.pow(1 - settle, 3)) + swayX();
    let dragging = false, last = 0, visible = true, dirty = true, dead = false, raf = 0;
    let started = !opts.hold;
    let lastT = 0, sx = 0, sy = 0, by = 0, bx = 0;

    const el = renderer.domElement;
    const pe = opts.pointerEl || el;
    const drag = opts.drag !== false;
    el.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none';
    if (drag) {
      pe.style.touchAction = 'pan-y';
      pe.style.userSelect = pe.style.webkitUserSelect = 'none';
      pe.draggable = false;
    }
    host.appendChild(el);

    function size() {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      dirty = true;
    }
    // Turning about its middle slides what is drawn sideways; each frame the middle of what is drawn is put back at
    // the middle of the stage, where its label sits. Flat on, where the still is, it is a no-op.
    const corner = new Vector3();
    const halfView = Math.tan((12 * PI) / 180);
    function render() {
      piece.position.x = 0;
      piece.rotation.y = ry; piece.rotation.x = rx;
      piece.updateMatrixWorld(true);
      let lo = Infinity, hi = -Infinity;
      for (const x of [-W / 2, W / 2]) for (const y of [-H / 2, H / 2]) for (const z of [-W / 2, W / 2]) {
        corner.set(x, y, z).applyMatrix4(piece.matrixWorld).project(camera);
        if (corner.x < lo) lo = corner.x;
        if (corner.x > hi) hi = corner.x;
      }
      piece.position.x = -((lo + hi) / 2) * halfView * camera.position.z * camera.aspect;
      renderer.render(scene, camera);
      dirty = false;
    }

    let moved = 0;
    function noDrag(e) { e.preventDefault(); }
    function down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      started = true;
      dragging = true; moved = 0; sx = e.clientX; sy = e.clientY; by = ry; bx = rx; vy = 0; vx = 0;
      lastT = e.timeStamp || performance.now();
      pe.dataset.dragged = '';
      pe.classList.add('is-grabbed');
      try { pe.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    }
    function move(e) {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      if (moved < 6) return;
      const nry = by + dx * 0.009, nrx = bx + dy * 0.006;
      const now = e.timeStamp || performance.now(), dt = (now - lastT) / 1000;
      if (dt > 0.001 && dt < 0.2) {
        vy = vy * 0.6 + ((nry - ry) / dt) * 0.4;
        vx = vx * 0.6 + ((nrx - rx) / dt) * 0.4;
      }
      lastT = now; ry = nry; rx = nrx; dirty = true;
    }
    function up(e) {
      if (!dragging) return;
      dragging = false;
      pe.classList.remove('is-grabbed');
      if (moved >= 6) {
        pe.dataset.dragged = '1';
        setTimeout(() => { pe.dataset.dragged = ''; }, 400);
      }
      try { pe.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    }
    function lost(e) { e.preventDefault(); if (opts.onLost) opts.onLost(); }
    function restored() { dirty = true; }
    if (drag) {
      pe.addEventListener('pointerdown', down);
      pe.addEventListener('pointermove', move);
      pe.addEventListener('pointerup', up);
      pe.addEventListener('pointercancel', up);
      pe.addEventListener('dragstart', noDrag);
    }
    el.addEventListener('webglcontextlost', lost);
    el.addEventListener('webglcontextrestored', restored);

    let io = null;
    if (window.IntersectionObserver) {
      io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '150px' });
      io.observe(host);
    }
    const onResize = () => size();
    window.addEventListener('resize', onResize);
    size();

    function loop(now) {
      if (dead) return;
      raf = requestAnimationFrame(loop);
      if (!last) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      if (!visible) return;
      if (!started) { if (dirty) render(); return; }
      t += dt;
      if (!reduce && settle < 1) settle = Math.min(1, settle + dt / 1.4);
      if (dragging) {
        off = shortWay(ry - swayY()); offx = rx - baseX();
      } else {
        off += vy * dt; offx += vx * dt;
        const k = Math.pow(0.22, dt);
        vy *= k; vx *= k;
        if (Math.abs(vy) < 0.001) vy = 0;
        if (Math.abs(vx) < 0.001) vx = 0;
        const back = Math.exp(-dt * 0.75);
        off = shortWay(off) * back; offx *= back;
        if (Math.abs(off) < 0.0005) off = 0;
        if (Math.abs(offx) < 0.0005) offx = 0;
        ry = swayY() + off; rx = baseX() + offx;
      }
      if (reach || settle < 1 || off || offx || vy || vx || dragging) dirty = true;
      if (dirty) render();
    }

    render();
    raf = requestAnimationFrame(loop);

    return {
      start() { started = true; },
      debug: { scene, camera, piece, renderer },
      // for looking at it: put it in a pose and draw once
      pose(y, x) { ry = y; rx = x; render(); },
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        pe.removeEventListener('pointerdown', down);
        pe.removeEventListener('pointermove', move);
        pe.removeEventListener('pointerup', up);
        pe.removeEventListener('pointercancel', up);
        pe.removeEventListener('dragstart', noDrag);
        pe.classList.remove('is-grabbed');
        if (drag) { pe.style.touchAction = ''; pe.style.userSelect = pe.style.webkitUserSelect = ''; }
        if (io) io.disconnect();
        stone.dispose(); front.dispose(); env.dispose();
        stoneMats.forEach((m) => { if (m.map && m.map !== front) m.map.dispose(); m.dispose(); });
        stoneGeo.dispose(); glassGeo.dispose(); veilMat.dispose(); sheenMat.dispose();
        figGeo.dispose(); goldMat.dispose();
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    };
  }).catch(function (e) {
    renderer.dispose();
    throw e;
  });
}
