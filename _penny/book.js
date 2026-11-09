// The book, as geometry: the same model as the Regender product page
// (regender-o11-book3d.liquid), here taking the book's own proportions.
//
// The cover is a ribbon traced across the back, round the fold, down the
// spine, round the other fold and across the front, so the wrap texture
// (back | spine | front, in that order) runs over the folds without a seam.
// The page block is a separate box inside it. Foil, where a book has it, is
// a metal layer laid over the cover through a mask, lit by a small studio of
// light boxes so it catches as the book turns. It is a layer of its own so the
// studio lights only the foil: lit through the paper's material they would
// wash the whole cover out.
//
// Bundled with the parts of three.js it uses into /js/book.js:
//   cd _penny && npm install && node build.mjs
import {
  AmbientLight, BoxGeometry, BufferGeometry, CanvasTexture, Color, DirectionalLight,
  DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  NoColorSpace, PerspectiveCamera, PMREMGenerator, PlaneGeometry, RepeatWrapping, Scene,
  SRGBColorSpace, TextureLoader, WebGLRenderer
} from 'three';

// The product page's lights were set for three r152, which scaled them by pi.
const PI = Math.PI;

function stripe(vertical, repeat) {
  const c = document.createElement('canvas');
  c.width = vertical ? 64 : 8;
  c.height = vertical ? 8 : 64;
  const g = c.getContext('2d');
  for (let i = 0; i < 64; i += 2) {
    g.fillStyle = (i % 4 === 0) ? '#f2ece0' : '#d5cbb4';
    if (vertical) g.fillRect(i, 0, 2, 8); else g.fillRect(0, i, 8, 2);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.repeat.set(vertical ? repeat : 1, vertical ? 1 : repeat);
  return t;
}

// The cover path in the book's cross-section. u is distance along it.
function coverPath(W, D, R) {
  const p = [];
  let len = 0;
  function push(x, z, nx, nz) {
    if (p.length) {
      const q = p[p.length - 1];
      len += Math.hypot(x - q.x, z - q.z);
    }
    p.push({ x, z, nx, nz, l: len });
  }
  const hw = W / 2, hd = D / 2, STEPS = 10;
  push(hw, -hd, 0, -1);
  push(-hw + R, -hd, 0, -1);
  for (let i = 1; i <= STEPS; i++) {
    const a = -PI / 2 - (i / STEPS) * (PI / 2);
    push(-hw + R + R * Math.cos(a), -hd + R + R * Math.sin(a), Math.cos(a), Math.sin(a));
  }
  push(-hw, hd - R, -1, 0);
  for (let i = 1; i <= STEPS; i++) {
    const a = PI + (i / STEPS) * (PI / 2);
    push(-hw + R + R * Math.cos(a), hd - R - R * Math.sin(a), Math.cos(a), -Math.sin(a));
  }
  push(hw, hd, 0, 1);
  return { pts: p, len };
}

function coverGeometry(W, H, D, R) {
  const { pts, len } = coverPath(W, D, R);
  const hh = H / 2, pos = [], nor = [], uv = [], idx = [];
  for (const q of pts) {
    const u = q.l / len;
    pos.push(q.x, -hh, q.z, q.x, hh, q.z);
    nor.push(q.nx, 0, q.nz, q.nx, 0, q.nz);
    uv.push(u, 0, u, 1);
  }
  for (let j = 0; j < pts.length - 1; j++) {
    const a = j * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// A few light boxes in a dark room. Reflected in foil they are what makes it
// flash: the book turns, and a letter goes from dark to white and back.
function studio(renderer) {
  const room = new Scene();
  room.background = new Color(0x0c0c0e);
  function box(w, h, x, y, z, v) {
    const m = new Mesh(new PlaneGeometry(w, h),
      new MeshBasicMaterial({ color: new Color(v, v, v), side: DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    room.add(m);
  }
  box(16, 4, 0, 9, 0, 9);       // overhead
  box(3, 15, -9, 0, 3, 6);      // tall, left
  box(3, 15, 9, 1, -3, 5);      // tall, right
  box(12, 12, 0, 0, 10, 0.42);  // dim fill behind the viewer
  box(8, 3, 0, -8, 1, 0.7);
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(room, 0.02).texture;
  pm.dispose();
  return tex;
}

function load(loader, url, space) {
  return loader.loadAsync(url).then((t) => { t.colorSpace = space; return t; });
}

// opts: el (the stage), wrap, foil (optional), w/h/d (the book's proportions,
// width = 1), drag (default true; off where the book sits inside a link), onLost. Resolves once the first frame is on the canvas; rejects
// if there is no WebGL or a texture will not load, so the caller can keep the
// still it is showing.
export function build(opts) {
  const host = opts.el;
  const W = 1, H = opts.h, D = opts.d;
  const R = Math.min(0.004, D * 0.3);
  // Framed so a book as tall as the Regender one fills about three quarters of
  // the stage; a taller one backs the camera off to fit.
  const fit = Math.max(1, Math.max(H, W) / 1.617);

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
  const jobs = [load(loader, opts.wrap, SRGBColorSpace)];
  if (opts.foil) jobs.push(load(loader, opts.foil, NoColorSpace));

  return Promise.all(jobs).then(function (tex) {
    const wrap = tex[0], foil = tex[1];
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    tex.forEach((t) => { t.anisotropy = maxAniso; });

    const book = new Group();
    scene.add(book);

    const mat = new MeshStandardMaterial({ map: wrap, roughness: 0.74, metalness: 0, side: DoubleSide });
    const geo = coverGeometry(W, H, D, R);
    book.add(new Mesh(geo, mat));
    let foilMat = null;
    if (foil) {
      foilMat = new MeshStandardMaterial({
        color: 0xd2d5da, metalness: 1, roughness: 0.3, side: DoubleSide,
        alphaMap: foil, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        envMap: studio(renderer), envMapIntensity: 1
      });
      book.add(new Mesh(geo, foilMat));
    }

    // the leaves, just inside the card
    // A thick book shows its leaves as fine lines. A saddle-stitched one is
    // too thin for them to be anything but moire, so it gets plain paper.
    const thin = D < 0.04;
    const rep = Math.max(3, Math.round(26 * D / 0.324));
    const edge = thin ? null : stripe(true, rep), face = thin ? null : stripe(false, rep);
    const paper = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    const rough = (map) => new MeshStandardMaterial(
      thin ? { color: 0xece4d2, roughness: 0.95 } : { map, roughness: 0.95 });
    const block = new Mesh(new BoxGeometry(W * 0.998, H * 0.998, D * 0.985),
      [rough(edge), paper, rough(face), rough(face), paper, paper]);
    book.add(block);

    scene.add(new AmbientLight(0xffffff, 0.42 * PI));
    const key = new DirectionalLight(0xffffff, 0.80 * PI);
    key.position.set(-3.2, 5.2, 4.4);
    scene.add(key);
    const rim = new DirectionalLight(0xbfd0e6, 0.18 * PI);
    rim.position.set(3.6, -1.4, -3.0);
    scene.add(rim);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const drift = reduce ? 0 : (opts.drift === undefined ? 0.12 : opts.drift);
    // It starts face-on, exactly where the still it replaces is, then settles
    // into a slight tilt and begins to turn.
    const RX = -0.1;
    let ry = opts.ry || 0, rx = 0, vy = 0, vx = 0, settle = 0;
    let dragging = false, last = 0, visible = true, dirty = true, dead = false, raf = 0;
    let lastT = 0, sx = 0, sy = 0, by = 0, bx = 0;

    const el = renderer.domElement;
    el.style.cssText = 'width:100%;height:100%;display:block;' +
      (opts.drag !== false ? 'touch-action:pan-y;cursor:grab' : 'pointer-events:none');
    host.appendChild(el);

    function size() {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      dirty = true;
    }
    function render() {
      book.rotation.y = ry; book.rotation.x = rx;
      renderer.render(scene, camera);
      dirty = false;
    }

    function down(e) {
      dragging = true; sx = e.clientX; sy = e.clientY; by = ry; bx = rx; vy = 0; vx = 0;
      lastT = e.timeStamp || performance.now();
      el.style.cursor = 'grabbing';
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    }
    function move(e) {
      if (!dragging) return;
      const nry = by + (e.clientX - sx) * 0.009, nrx = bx + (e.clientY - sy) * 0.006;
      const now = e.timeStamp || performance.now(), dt = (now - lastT) / 1000;
      if (dt > 0.001 && dt < 0.2) {
        vy = vy * 0.6 + ((nry - ry) / dt) * 0.4;
        vx = vx * 0.6 + ((nrx - rx) / dt) * 0.4;
      }
      lastT = now; ry = nry; rx = nrx; dirty = true;
    }
    function up(e) {
      if (!dragging) return;
      dragging = false; el.style.cursor = 'grab';
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    }
    function lost(e) { e.preventDefault(); if (opts.onLost) opts.onLost(); }
    function restored() { dirty = true; }
    const drag = opts.drag !== false;
    if (drag) {
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
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
      if (!dragging) {
        if (!reduce && settle < 1) {
          settle = Math.min(1, settle + dt / 1.4);
          rx = RX * (1 - Math.pow(1 - settle, 3)); dirty = true;
        }
        const k = Math.pow(0.22, dt);
        if (drift || vy || vx) {
          ry += (drift + vy) * dt; rx += vx * dt;
          vy *= k; vx *= k;
          if (Math.abs(vy) < 0.001) vy = 0;
          if (Math.abs(vx) < 0.001) vx = 0;
          dirty = true;
        }
      }
      if (dirty) render();
    }

    // the first frame, drawn before anything is told it is ready
    render();
    raf = requestAnimationFrame(loop);

    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        if (io) io.disconnect();
        tex.forEach((t) => t.dispose());
        if (edge) { edge.dispose(); face.dispose(); }
        if (foilMat) { foilMat.envMap.dispose(); foilMat.dispose(); }
        mat.dispose();
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
