// A browser window, as an object: for the websites on the studio wall, what
// book.js is for the books. A slim slab with a rim of dark metal, a bar of
// window chrome across the top, and a screen that plays a short loop of the
// site itself (recorded by loops.mjs).
//
// The chrome and the screen are unlit, so they are exactly the colours of the
// pictures they were made from, and a browser flat on to the viewer is the same
// picture as the still it replaces. Only the rim is lit: it is what catches the
// light as the browser sways. A faint sheen crosses the glass as it turns, and
// is nothing at rest, where the still has none.
//
// Same manners as book.js: it holds the still's pose until told to go, then
// sways a little either side of its front, each in its own way; it can be
// grabbed and turned, and settles back; it plays its loop only while it is in
// view; and if there is no WebGL, or a picture will not load, it rejects, so
// the caller keeps the still.
//
// Bundled with the parts of three.js it uses into /js/browser.js:
//   cd _penny && npm install && node build.mjs
import {
  AdditiveBlending, AmbientLight, CanvasTexture, Color, DirectionalLight, DoubleSide, ExtrudeGeometry,
  Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera,
  PlaneGeometry, PMREMGenerator, Scene, Shape, ShapeGeometry, SRGBColorSpace, TextureLoader,
  Vector3, VideoTexture, WebGLRenderer
} from 'three';

const PI = Math.PI;
const BS = 0.0025;          // the rim: how far the metal shows round the window (a hairline)
const RADIUS = 0.022;       // the slab's corner, outside
const CHROME_H = 0.04375;   // the bar across the top: 56 px of a 1280 px window

// A rectangle from (x0, y0) to (x1, y1) with its top and bottom corners rounded
// by their own amounts, as a flat shape whose UVs run 0..1 across it.
function panel(x0, y0, x1, y1, rTop, rBottom) {
  const s = new Shape();
  s.moveTo(x0 + rBottom, y0);
  s.lineTo(x1 - rBottom, y0);
  if (rBottom) s.absarc(x1 - rBottom, y0 + rBottom, rBottom, -PI / 2, 0, false);
  s.lineTo(x1, y1 - rTop);
  if (rTop) s.absarc(x1 - rTop, y1 - rTop, rTop, 0, PI / 2, false);
  s.lineTo(x0 + rTop, y1);
  if (rTop) s.absarc(x0 + rTop, y1 - rTop, rTop, PI / 2, PI, false);
  s.lineTo(x0, y0 + rBottom);
  if (rBottom) s.absarc(x0 + rBottom, y0 + rBottom, rBottom, PI, PI * 1.5, false);
  const g = new ShapeGeometry(s, 10);
  const pos = g.attributes.position, uv = [];
  for (let i = 0; i < pos.count; i++) uv.push((pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) - y0) / (y1 - y0));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return g;
}

// A few light boxes in a dark room, for the rim to reflect.
function studio(renderer) {
  const room = new Scene();
  room.background = new Color(0x0c0c0e);
  function box(w, h, x, y, z, v) {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(v, v, v), side: DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    room.add(m);
  }
  box(16, 4, 0, 9, 0, 9);
  box(3, 15, -9, 0, 3, 6);
  box(3, 15, 9, 1, -3, 5);
  box(12, 12, 0, 0, 10, 0.42);
  box(8, 3, 0, -8, 1, 0.7);
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(room, 0.02).texture;
  pm.dispose();
  return tex;
}

// The glass's sheen: a soft diagonal band, brightest in the middle.
function sheen() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 8;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#000'); grad.addColorStop(0.38, '#000');
  grad.addColorStop(0.5, '#fff'); grad.addColorStop(0.62, '#000'); grad.addColorStop(1, '#000');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 8);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.repeat.set(0.6, 1);
  return t;
}

// A small seeded generator, so a browser always sways the same way and no two sway alike.
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

// opts: el (the stage), chrome (the bar's picture), poster (the screen's first
// frame), video (the loop), h/d (proportions, width = 1), hold (stay in the
// still's pose until start() is called, or the browser is grabbed), pointerEl
// (what is dragged to turn it: on the wall, the whole tile), drag (default
// true), fit (camera distance as a multiple of the book's; the wall sets it), seed (a string: each sways in its own way), sway (radians) and period
// (seconds) to override, onLost. Resolves once the first frame is on the canvas.
export function build(opts) {
  const host = opts.el;
  const W = 1, H = opts.h, D = opts.d;
  // A window is wide and short, so unlike a book it can bring the camera in: opts.fit < 1 does.
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

  return Promise.all([load(loader, opts.chrome), load(loader, opts.poster)]).then(function (tex) {
    const chromeTex = tex[0], posterTex = tex[1];
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    tex.forEach((t) => { t.anisotropy = maxAniso; });

    const group = new Group();
    scene.add(group);

    // The slab. Its outline is the window plus the rim; ExtrudeGeometry's bevel is the rim.
    const shape = (function () {
      const w = W, h = H, r = RADIUS - BS, x = -w / 2, y = -h / 2, s = new Shape();
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
      s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, PI / 2, false);
      s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, PI / 2, PI, false);
      s.lineTo(x, y + r); s.absarc(x + r, y + r, r, PI, PI * 1.5, false);
      return s;
    })();
    const depth = Math.max(0.002, D - 2 * BS);
    const slabGeo = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: BS, bevelSize: BS, bevelSegments: 3, curveSegments: 12 });
    slabGeo.translate(0, 0, -depth / 2);
    const env = studio(renderer);
    const slabMat = new MeshStandardMaterial({ color: 0x34353a, metalness: 0.3, roughness: 0.55, envMap: env, envMapIntensity: 0.45 });
    group.add(new Mesh(slabGeo, slabMat));

    // The window, on the front of the slab: the chrome bar over the screen.
    const zf = D / 2 + 0.0004, rf = RADIUS - BS;
    const x0 = -W / 2, x1 = W / 2, yT = H / 2, yB = -H / 2, yS = yT - CHROME_H * W;
    const chromeMat = new MeshBasicMaterial({ map: chromeTex });
    const chromeMesh = new Mesh(panel(x0, yS, x1, yT, rf, 0), chromeMat);
    chromeMesh.position.z = zf;
    group.add(chromeMesh);
    // The screen is two layers of the same loop. At the seam one rises over the other, so the loop
    // is a dissolve the player makes itself, and never a restart or a seek the viewer could catch.
    const screenGeo = panel(x0, yB, x1, yS, 0, rf);
    const screenMat = new MeshBasicMaterial({ map: posterTex, transparent: true, depthWrite: false });
    const screenMesh = new Mesh(screenGeo, screenMat);
    screenMesh.position.z = zf;
    group.add(screenMesh);
    const screenMatB = new MeshBasicMaterial({ map: posterTex, transparent: true, opacity: 0, depthWrite: false });
    const screenMeshB = new Mesh(screenGeo, screenMatB);
    screenMeshB.position.z = zf + 0.0002;
    screenMeshB.visible = false;
    group.add(screenMeshB);

    // the glass
    const sheenTex = sheen();
    const sheenMat = new MeshBasicMaterial({ map: sheenTex, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    const sheenMesh = new Mesh(panel(x0, yB, x1, yS, 0, rf), sheenMat);
    sheenMesh.position.z = zf + 0.0004;
    group.add(sheenMesh);

    scene.add(new AmbientLight(0xffffff, 0.42 * PI));
    const key = new DirectionalLight(0xffffff, 0.74 * PI);
    key.position.set(-1.4, 4.4, 5.2);
    scene.add(key);
    const rim = new DirectionalLight(0xbfd0e6, 0.18 * PI);
    rim.position.set(3.6, -1.4, -3.0);
    scene.add(rim);

    // The loop. It is paused on its first frame, which is the poster, until the
    // browser is let go; then it plays, and only while the browser is in view.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const FADE = 1.4;                                   // seconds the two layers overlap at the seam
    const mkVideo = () => {
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = false; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      v.crossOrigin = 'anonymous';
      v.preload = 'auto';
      v.src = opts.video;
      return v;
    };
    const vids = [mkVideo(), mkVideo()];                // the second waits at frame one until the seam
    const vtex = [null, null];
    const mats = [screenMat, screenMatB], meshes = [screenMesh, screenMeshB];
    let cur = 0, fading = false, playing = false, wantPlay = false;
    function play() {
      if (reduce || dead) return;
      wantPlay = true;
      const a = vids[cur], p = a.play();
      if (p && p.then) {
        p.then(function () {
          if (dead || !wantPlay) { a.pause(); return; }
          for (let i = 0; i < 2; i++) {
            if (!vtex[i]) { vtex[i] = new VideoTexture(vids[i]); vtex[i].colorSpace = SRGBColorSpace; }
          }
          // The screen keeps its poster until the loop has a frame to show (see
          // useFrames): a texture with nothing in it yet draws as nothing, and
          // the grey slab behind showed through it as a flash.
          meshes[cur].visible = true; mats[cur].opacity = 1; meshes[cur].renderOrder = 0;
          if (!fading) meshes[1 - cur].visible = false;
          playing = true; dirty = true;
        }, function () { /* autoplay refused: the poster stays */ });
      }
    }
    // A layer goes over from the poster to its video only once the video has
    // handed over a frame: the texture's version goes up when it does. Until
    // then the poster, which is the loop's first frame, stands in, so a slow
    // phone or a slow connection goes on seeing the picture, never a hole.
    // Where there is no requestVideoFrameCallback, three only marks a texture
    // that is being drawn, so it is marked here once the player has a frame.
    const rvfc = typeof HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
    function useFrames() {
      for (let i = 0; i < 2; i++) {
        const tx = vtex[i];
        if (!tx || mats[i].map === tx) continue;
        const v = vids[i];
        if (!rvfc && v.readyState >= 2 && v.currentTime > 0) tx.needsUpdate = true;
        if (tx.version > 0) { mats[i].map = tx; mats[i].needsUpdate = true; }
      }
    }
    function pause() { wantPlay = false; playing = false; vids[0].pause(); vids[1].pause(); }
    function resume() {
      vids[cur].play().catch(function () {});
      if (fading) vids[1 - cur].play().catch(function () {});
    }
    // each frame: when the showing layer is FADE seconds from its end, the other starts from the top and
    // rises over it as it plays its first FADE seconds; when it is fully up, the old layer is put back at
    // frame one to wait, and they change places
    function tickLoop() {
      const a = vids[cur], o = 1 - cur, d = a.duration;
      if (!isFinite(d) || d < FADE * 3) { a.loop = true; return; }     // too short to dissolve: let the player loop it
      if (!fading && a.currentTime >= d - FADE) {
        fading = true;
        meshes[o].visible = true; meshes[o].renderOrder = 1; mats[o].opacity = 0;
        meshes[cur].renderOrder = 0; mats[cur].opacity = 1;
        vids[o].play().catch(function () {});
      }
      if (fading) {
        const k = Math.min(1, Math.max(0, vids[o].currentTime / FADE));
        mats[o].opacity = k * k * (3 - 2 * k);
        if (k >= 1 || a.ended) {
          a.pause(); a.currentTime = 0;
          meshes[cur].visible = false;
          cur = o; fading = false; mats[cur].opacity = 1; meshes[cur].renderOrder = 0;
        }
      }
    }

    // A browser does not go round: it sways a little either side of its front,
    // very slowly, never swinging through the edge-on views that flatten it to a
    // sliver. The same rules as a book's, a touch gentler.
    const rnd = rng(opts.seed);
    const period = opts.period || 44 + rnd() * 48;
    const reach = reduce ? 0 : (opts.sway === undefined ? 0.17 + rnd() * 0.2 : opts.sway);
    const omega = (2 * PI) / period;
    const phi = rnd() * 2 * PI, phi2 = rnd() * 2 * PI, phiX = rnd() * 2 * PI;
    const RX = -0.07;
    let t = 0, off = opts.ry || 0, offx = 0, ry = off, rx = 0, vy = 0, vx = 0, settle = 0;
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
    // Turning about its middle slides what is drawn sideways; each frame the
    // middle of what is drawn is put back at the middle of the stage, where its
    // label sits. At the front, where the still is, it is a no-op.
    const corner = new Vector3();
    const halfView = Math.tan((12 * PI) / 180);
    const OW = W + 2 * BS, OH = H + 2 * BS;
    function render() {
      group.position.x = 0;
      group.rotation.y = ry; group.rotation.x = rx;
      group.updateMatrixWorld(true);
      let lo = Infinity, hi = -Infinity;
      for (const x of [-OW / 2, OW / 2]) for (const y of [-OH / 2, OH / 2]) for (const z of [-D / 2, D / 2]) {
        corner.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
        if (corner.x < lo) lo = corner.x;
        if (corner.x > hi) hi = corner.x;
      }
      group.position.x = -((lo + hi) / 2) * halfView * camera.position.z * camera.aspect;
      // the glass catches the light a little more the further it is turned, and not at all at rest
      const turn = Math.min(1, Math.abs(shortWay(ry)) / 0.5);
      sheenMat.opacity = 0.2 * turn;
      sheenTex.offset.x = 0.2 - Math.max(-1, Math.min(1, shortWay(ry) / 0.5)) * 0.5;
      renderer.render(scene, camera);
      dirty = false;
    }

    // A mouse grabs the moment it is pressed. A finger is let decide first,
    // because on a phone most fingers on a book are on their way down the page:
    // until it has gone a little way sideways, more sideways than up or down,
    // the page has it, and the book is not touched. Once the page has started
    // scrolling the browser cancels the pointer, and a cancelled touch is
    // dropped, not thrown, so a scroll never sets a book spinning.
    let moved = 0, pending = false;
    const SLOP = 8;
    function noDrag(e) { e.preventDefault(); }
    function grab(e) {
      started = true;
      if (!playing) play();
      dragging = true; pending = false; sx = e.clientX; sy = e.clientY; by = ry; bx = rx; vy = 0; vx = 0;
      lastT = e.timeStamp || performance.now();
      pe.classList.add('is-grabbed');
      try { pe.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    }
    function down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      moved = 0;
      pe.dataset.dragged = '';
      if (e.pointerType === 'touch') { pending = true; sx = e.clientX; sy = e.clientY; return; }
      grab(e);
    }
    function move(e) {
      if (pending) {
        const ax = Math.abs(e.clientX - sx), ay = Math.abs(e.clientY - sy);
        if (ay > SLOP && ay >= ax) { pending = false; return; }   // a scroll: leave it to the page
        if (ax > SLOP && ax > ay * 1.2) { grab(e); moved = 6; }  // a turn: from here, with no jump
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      // a tap wobbles; it only becomes a drag once it has gone a little way
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
      pending = false;
      if (!dragging) return;
      dragging = false;
      pe.classList.remove('is-grabbed');
      // taken away by the browser: let it lie where it is, with no throw
      if (e.type === 'pointercancel') { vy = 0; vx = 0; }
      // the click that follows a drag is not a tap: whoever listens for clicks
      // on the tile reads this and lets it go
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
      io = new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        // out of sight it stops playing, so a wall of browsers is never decoding video no one can see
        if (!visible) { if (playing) { vids[0].pause(); vids[1].pause(); } } else if (started && wantPlay) { resume(); }
      }, { rootMargin: '150px' });
      io.observe(host);
    }
    const onResize = () => size();
    const onHide = () => { if (document.hidden) { vids[0].pause(); vids[1].pause(); } else if (started && wantPlay && visible) resume(); };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onHide);
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
      if (playing) { useFrames(); tickLoop(); }
      if (reach || settle < 1 || off || offx || vy || vx || dragging || playing) dirty = true;
      if (dirty) render();
    }

    render();
    raf = requestAnimationFrame(loop);

    return {
      start() { started = true; play(); },
      state() { return { cur, fading, playing, d: vids[cur].duration, t: [vids[0].currentTime, vids[1].currentTime], rise: mats[1 - cur].opacity }; },
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        pause();
        for (const v of vids) { v.removeAttribute('src'); v.load(); }
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onHide);
        pe.removeEventListener('pointerdown', down);
        pe.removeEventListener('pointermove', move);
        pe.removeEventListener('pointerup', up);
        pe.removeEventListener('pointercancel', up);
        pe.removeEventListener('dragstart', noDrag);
        pe.classList.remove('is-grabbed');
        if (drag) { pe.style.touchAction = ''; pe.style.userSelect = pe.style.webkitUserSelect = ''; }
        if (io) io.disconnect();
        tex.forEach((x) => x.dispose());
        for (const t of vtex) if (t) t.dispose();
        sheenTex.dispose(); env.dispose();
        slabGeo.dispose(); slabMat.dispose();
        chromeMesh.geometry.dispose(); screenGeo.dispose(); sheenMesh.geometry.dispose();
        chromeMat.dispose(); screenMat.dispose(); screenMatB.dispose(); sheenMat.dispose();
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
