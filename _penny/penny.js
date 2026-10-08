// The home timer's penny.
//
// Built to /js/penny.js by `node _penny/build.mjs`; edit this file, not that
// one. Loaded by site.js when the timer reaches zero, and only then.
//
// One WebGL canvas over the whole viewport, transparent and click-through, in
// CSS pixels: x right, y up, z out of the page towards the reader. The page is
// the plane z = 0. It catches the penny's shadow and nothing else, so the coin
// reads as sitting on the site rather than floating in front of it.
//
// The choreography: the penny comes out where the timer was, hops down onto
// the scratch plate, and scratches it open the way a person does a lottery
// ticket: a burst here, lift, a burst there. Anyone can pick it up and do it
// themselves. When the plate says it is open the penny stops, shakes, and
// pops.

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, CylinderGeometry,
  CircleGeometry, PlaneGeometry, MeshPhysicalMaterial, ShadowMaterial,
  DirectionalLight, HemisphereLight, TextureLoader, SRGBColorSpace,
  PMREMGenerator, PCFSoftShadowMap, ACESFilmicToneMapping, Euler, MathUtils,
  Color
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Face maps made by _penny/maps.py from the US Mint's image of the cent.
const MAPS = '/images/penny/';
function loadFaces(maxAniso) {
  const loader = new TextureLoader();
  const one = (url, srgb) => new Promise((ok, no) => loader.load(url, (t) => {
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = Math.min(8, maxAniso);
    ok(t);
  }, undefined, no));
  const side = (n) => Promise.all([
    one(MAPS + n + '-color.webp', true),
    one(MAPS + n + '-normal.webp', false),
    one(MAPS + n + '-rough.webp', false)
  ]).then(([map, normal, rough]) => ({ map, normal, rough }));
  return Promise.all([side('obverse'), side('reverse')]);
}

const TAU = Math.PI * 2;
const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
};

export async function run({ plate, from }) {
  if (!plate || !plate.scratch || plate.scratch.isDone()) return;
  // Fetched before anything is shown, so the coin arrives whole.
  let faces;
  try { faces = await loadFaces(16); } catch (e) { return; }
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  } catch (e) { return; }

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cvs = renderer.domElement;
  cvs.className = 'penny-stage';
  cvs.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cvs);

  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  // A camera whose z = 0 plane maps one unit to one CSS pixel, with a long
  // lens so the coin has real perspective without the page plane distorting.
  const FOV = 16;
  const camera = new PerspectiveCamera(FOV, 1, 10, 20000);

  // The site's light: a soft white room, the key high and to the upper left,
  // so the shadow falls down and to the right, short and pale.
  scene.add(new HemisphereLight(0xffffff, 0xe9e6e2, 0.55));
  const key = new DirectionalLight(0xffffff, 1.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.6;
  key.shadow.radius = 6;
  scene.add(key, key.target);

  const floor = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.2 }));
  floor.receiveShadow = true;
  scene.add(floor);

  function layout() {
    const w = W(), h = H();
    renderer.setSize(w, h, false);
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
    camera.aspect = w / h;
    const dist = (h / 2) / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.position.set(w / 2, -h / 2, dist);
    camera.near = dist * 0.2; camera.far = dist * 3;
    camera.lookAt(w / 2, -h / 2, 0);
    camera.updateProjectionMatrix();
    floor.scale.set(w * 1.5, h * 1.5, 1);
    floor.position.set(w / 2, -h / 2, 0);
    key.target.position.set(w / 2, -h / 2, 0);
    key.position.set(w / 2 - 260, -h / 2 + 420, 900);
    const c = key.shadow.camera;
    c.left = -w; c.right = w; c.top = h; c.bottom = -h; c.near = 10; c.far = 3000;
    c.updateProjectionMatrix();
  }
  layout();
  window.addEventListener('resize', layout);

  // ---- the coin ----------------------------------------------------------
  // US cent: 19.05mm across, 1.52mm thick. On screen it is sized to the
  // plate, so it reads as a coin on a ticket rather than a token in a corner.
  const box = plate.getBoundingClientRect();
  const D = Math.max(46, Math.min(70, box.width * 0.11));
  const R = D / 2;
  const T = D * (1.52 / 19.05);

  const copper = new Color('#c27a4f');
  const edgeMat = new MeshPhysicalMaterial({
    color: copper, metalness: 1, roughness: 0.34, clearcoat: 0.15, clearcoatRoughness: 0.4
  });
  const faceMat = (t) => {
    return new MeshPhysicalMaterial({
      color: 0xffffff, map: t.map, normalMap: t.normal, roughnessMap: t.rough,
      metalness: 1, roughness: 1, clearcoat: 0.15, clearcoatRoughness: 0.4
    });
  };

  const coin = new Group();
  const body = new Mesh(new CylinderGeometry(R, R, T, 96, 1, true), edgeMat);
  body.rotation.x = Math.PI / 2;
  // Lincoln faces the reader while the coin works; the shield is underneath.
  const front = new Mesh(new CircleGeometry(R, 96), faceMat(faces[0]));
  front.position.z = T / 2;
  const back = new Mesh(new CircleGeometry(R, 96), faceMat(faces[1]));
  back.position.z = -T / 2;
  back.rotation.y = Math.PI;
  for (const m of [body, front, back]) { m.castShadow = true; coin.add(m); }
  // The pivot is the coin's centre; `holder` carries position and scale.
  const holder = new Group();
  holder.add(coin);
  scene.add(holder);

  // State, in page terms: where the coin touches (client px), how high its
  // centre is above the page, how far it leans back from flat-on-the-reader,
  // its heading in the page plane, its scale, and any extra turn in flight.
  const s = { x: 0, y: 0, z: 0, tilt: 0, head: 0, roll: 0, scale: 1, flip: 0 };

  function place() {
    // Lean is a rotation about the coin's horizontal diameter; with the coin
    // leaning back by `tilt`, its lowest point sits R·sin(tilt) below centre,
    // and the centre is R·cos(tilt) from the contact point across the page,
    // in whichever direction the heading has turned it. Roll rocks the coin
    // about its upright diameter.
    const lean = s.tilt + s.flip;
    coin.quaternion.setFromEuler(new Euler(lean, s.roll, s.head, 'ZXY'));
    const off = R * Math.cos(s.tilt);
    holder.position.set(s.x - Math.sin(s.head) * off, -(s.y) + Math.cos(s.head) * off, s.z);
    holder.scale.setScalar(s.scale);
    // A shadow thins as what casts it rises: full on the page, a ghost of
    // itself at the top of the hop.
    floor.material.opacity = 0.2 * (1 - 0.75 * Math.min(1, Math.max(0, s.z - restZ) / 220));
  }

  // ---- the hand ----------------------------------------------------------
  // The coin answers its motion, the way a held coin does: it leans back
  // against a push and forward on a pull, and rocks towards whichever way it
  // slides along its edge. The heading is set per patch, across the strokes.
  const LEAN = MathUtils.degToRad(16), ROCK = MathUtils.degToRad(12);
  function lean(head, wx, wy) {
    // wx, wy: velocity in world axes (y up)
    const sp = Math.hypot(wx, wy);
    if (sp < 1) return;
    const f = Math.min(1, sp / 320);
    const push = (wx * Math.sin(head) - wy * Math.cos(head)) / sp;
    const slide = (wx * Math.cos(head) + wy * Math.sin(head)) / sp;
    s.tilt = TILT + LEAN * push * f;
    s.roll = ROCK * slide * f;
  }
  // A coin's edge has no front: of the two headings that put it at an
  // angle, take the nearer.
  function near(want, cur) {
    while (want - cur > Math.PI / 2) want -= Math.PI;
    while (want - cur < -Math.PI / 2) want += Math.PI;
    return want;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- choreography ------------------------------------------------------
  const scratch = plate.scratch;
  if (scratch.need) scratch.need(0.86);
  const TILT = MathUtils.degToRad(36);
  const restZ = R * Math.sin(TILT) + (T / 2) * Math.cos(TILT);
  const band = R * 0.95;            // half the width of the band the edge scrapes
  const pb = plate.getBoundingClientRect();
  const big = Math.min(1.8, Math.max(1, Math.sqrt(pb.width * pb.height) / 320));

  // Scratched the way a person does it: a burst of strokes in one spot, lift,
  // somewhere else, another burst. Each spot is chosen among the places still
  // covered: a few at random, and the one with the most covering round it,
  // so it wanders here and there without wasting itself on clean ground.
  function pickSpot() {
    const open = scratch.covered();
    if (!open.length) return null;
    const reach = band * 3 * big;
    let best = null, score = -1;
    for (let i = 0; i < 8; i++) {
      const c = open[Math.floor(Math.random() * open.length)];
      let n = 0;
      for (let j = 0; j < open.length; j += 2) {
        if (Math.abs(open[j][0] - c[0]) < reach && Math.abs(open[j][1] - c[1]) < reach) n++;
      }
      const sc = n * rnd(0.7, 1.3);
      if (sc > score) { score = sc; best = c; }
    }
    return best;
  }

  // One burst. Strokes run back and forth along `theta`, a direction picked
  // fresh each time, while the stroke's centre drifts across the spot. The
  // edge is a flat chord square to the stroke, so it only leaves no gaps if
  // each half-stroke moves on by less than the chord's half-width: the drift
  // is held to between 0.9 and 1.5 of `band` per stroke cycle.
  function makePatch(c) {
    const theta = rnd(0, Math.PI);
    const f = rnd(7, 9.5);
    const dur = rnd(0.8, 1.5);
    const drift = theta + Math.PI / 2 + rnd(-0.45, 0.45);
    const dv = rnd(1.1, 1.5) * band * f;
    // The centre's path bends as it goes, the way a wrist drifts in an arc,
    // walked out in small steps and centred on the spot.
    const seed = Math.random() * 100, bendA = rnd(0.5, 1.1), bendF = rnd(1.2, 2.6);
    const pts = [[0, 0]], n = 60;
    for (let i = 1; i <= n; i++) {
      const u = dur * i / n, dir = drift + bendA * Math.sin(u * bendF + seed);
      const [px, py] = pts[i - 1];
      pts.push([px + Math.cos(dir) * dv * dur / n, py + Math.sin(dir) * dv * dur / n]);
    }
    const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
    const my = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    for (const q of pts) { q[0] += c[0] - mx; q[1] += c[1] - my; }
    return { theta, f, dur, pts, seed, amp: band * rnd(1.9, 2.9) * big };
  }

  // Where the edge is at time u in a burst, and the angle it is held at.
  // Strokes run long by uneven amounts, their direction wanders a little, and
  // they ease in and out at the ends of the burst rather than starting and
  // stopping mid-swing.
  function pose(P, u) {
    const sd = P.seed;
    const k = Math.max(0, Math.min(1, u / P.dur)) * (P.pts.length - 1);
    const i = Math.min(P.pts.length - 2, Math.floor(k)), fr = k - i;
    const cx = P.pts[i][0] + (P.pts[i + 1][0] - P.pts[i][0]) * fr;
    const cy = P.pts[i][1] + (P.pts[i + 1][1] - P.pts[i][1]) * fr;
    const th = P.theta + 0.3 * Math.sin(u * 2.3 + sd * 1.7);
    // Strokes swell and shrink unevenly through the burst: its outline is
    // ragged rather than a ruled block. They never drop below the stroke the
    // drift was sized for, so nothing between them is missed.
    const a = P.amp * (1 + 0.35 * Math.max(0, Math.sin(u * 3.1 + sd))
                         + 0.2 * Math.max(0, Math.sin(u * 8.3 + sd * 2.3)));
    const w = Math.sin(TAU * P.f * u + 0.3 * Math.sin(u * 1.9 + sd));
    const env = Math.max(0, Math.min(1, u / 0.1, (P.dur - u) / 0.1));
    return { x: cx + Math.cos(th) * a * w * env, y: cy + Math.sin(th) * a * w * env, ang: th + Math.PI / 2 };
  }

  let phase = 'enter', t0 = performance.now(), prev = 0, alive = true;
  let patch = null, lastU = 0, hop = null, rest = 0;
  let revealed = false, baseHead = null;
  document.addEventListener('egg-revealed', () => { revealed = true; }, { once: true });

  // Where it starts: the timer's spot, at the timer's size, flat to the reader.
  const fr = from ? from.getBoundingClientRect() : { left: W() - 60, top: 20, width: 28, height: 28 };
  const start = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 + R };
  patch = makePatch(pickSpot() || [pb.left + pb.width / 2, pb.top + pb.height / 2]);
  const first = pose(patch, 0);

  // Lift, move to the next spot, put down: a short glide with a little
  // height, the coin turning on the way to the angle the next burst wants.
  function nextPatch(now) {
    scratch.lift();
    const c = pickSpot();
    if (!c) { phase = 'settle'; t0 = now; return; }
    patch = makePatch(c);
    const to = pose(patch, 0);
    const d = Math.hypot(to.x - s.x, to.y - s.y);
    hop = {
      x0: s.x, y0: s.y, x1: to.x, y1: to.y, h0: s.head, h1: near(-to.ang, s.head),
      dur: Math.max(0.14, Math.min(0.38, d / 1300)), lift: Math.min(34, 8 + d * 0.08),
      wait: rnd(0, 0.1)
    };
    phase = 'travel'; t0 = now;
  }

  // ---- your hand ---------------------------------------------------------
  // Press on the coin, with a finger or a mouse, and it is yours: it follows,
  // scratching wherever it is dragged, and turns and leans with the drag. Let
  // go and, after a moment, it carries on by itself.
  let held = null;
  const drag = { vx: 0, vy: 0, c2: 0, s2: 0 };
  const canHold = () => phase === 'travel' || phase === 'patch' || phase === 'rest' || phase === 'held';
  function centre() {
    const off = R * Math.cos(s.tilt) * s.scale;
    return [s.x - Math.sin(s.head) * off, s.y - Math.cos(s.head) * off];
  }
  function over(e) {
    const c = centre();
    return Math.hypot(e.clientX - c[0], e.clientY - c[1]) < R * 1.25;
  }
  function onDown(e) {
    if (!alive || held || !canHold() || !over(e)) return;
    e.preventDefault(); e.stopPropagation();
    held = { id: e.pointerId, dx: s.x - e.clientX, dy: s.y - e.clientY, tx: s.x, ty: s.y };
    drag.vx = drag.vy = 0;
    scratch.lift();
    phase = 'held';
    document.documentElement.style.cursor = 'grabbing';
  }
  function onMove(e) {
    if (held && e.pointerId === held.id) {
      e.preventDefault();
      held.tx = e.clientX + held.dx; held.ty = e.clientY + held.dy;
    } else if (!held && e.pointerType === 'mouse') {
      document.documentElement.style.cursor = canHold() && over(e) ? 'grab' : '';
    }
  }
  function onUp(e) {
    if (!held || e.pointerId !== held.id) return;
    held = null;
    document.documentElement.style.cursor = '';
    scratch.lift();
    if (phase === 'held') { phase = 'rest'; t0 = performance.now(); rest = 1.2; }
  }
  document.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  // While the coin is on the page a drag on it is a drag, not a scroll.
  const touchWas = document.documentElement.style.touchAction;
  document.documentElement.style.touchAction = 'none';

  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;
    const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));

    if (revealed && phase !== 'settle' && phase !== 'pop' && phase !== 'enter') {
      if (held) { held = null; document.documentElement.style.cursor = ''; }
      scratch.lift(); phase = 'settle'; t0 = now;
    }

    if (phase === 'enter') {
      // Out of the timer and onto the plate in one hop: grows from the
      // timer's size, turns over twice, and lands leaning on its edge.
      const dur = 1.35;
      const k = Math.min(1, t / dur);
      const e = ease.inOut(k);
      s.x = start.x + (first.x - start.x) * e;
      s.y = start.y + (first.y - start.y) * e;
      s.scale = MathUtils.lerp(fr.width / D, 1, ease.out(Math.min(1, k / 0.45)));
      s.tilt = TILT * ease.out(k);
      s.flip = (1 - ease.out(k)) * TAU * 2;
      s.z = restZ + Math.sin(Math.PI * Math.min(1, k * 1.05)) * 240 * (1 - k * 0.3);
      s.head = near(-first.ang, 0) * ease.out(k);
      if (k >= 1) { phase = 'patch'; t0 = now; lastU = 0; s.flip = 0; s.z = restZ; }
    } else if (phase === 'travel') {
      const k = Math.min(1, Math.max(0, t - hop.wait) / hop.dur);
      const e = ease.inOut(k);
      s.x = hop.x0 + (hop.x1 - hop.x0) * e;
      s.y = hop.y0 + (hop.y1 - hop.y0) * e;
      s.z = restZ + Math.sin(Math.PI * k) * hop.lift;
      s.head = hop.h0 + (hop.h1 - hop.h0) * e;
      s.tilt += (TILT - MathUtils.degToRad(8) * Math.sin(Math.PI * k) - s.tilt) * Math.min(1, dt * 12);
      s.roll *= Math.exp(-dt * 10);
      if (k >= 1) { phase = 'patch'; t0 = now; lastU = 0; }
    } else if (phase === 'patch') {
      const P = patch;
      const u = Math.min(t, P.dur);
      // Scratched along the path in small steps since the last frame, not
      // just at this frame's point: a slow frame would otherwise cut corners
      // and leave stripes. The path, not the frame rate, decides the scrape.
      for (let v = lastU + 0.003; v < u; v += 0.003) {
        const q = pose(P, v); scratch.to(q.x, q.y, band, q.ang); crumbs(q.x, q.y);
      }
      lastU = u;
      const p = pose(P, u), p2 = pose(P, u + 0.003);
      s.x = p.x; s.y = p.y; s.z = restZ;
      s.head += (near(-p.ang, s.head) - s.head) * Math.min(1, dt * 14);
      lean(s.head, (p2.x - p.x) / 0.003, -(p2.y - p.y) / 0.003);
      scratch.to(p.x, p.y, band, p.ang);
      if (t >= P.dur) nextPatch(now);
    } else if (phase === 'held') {
      // Follow the hand, scratching every few pixels of the way; the heading
      // settles square to the line of the drag, averaged over a moment so a
      // scribble does not spin it.
      const dx = held.tx - s.x, dy = held.ty - s.y, d = Math.hypot(dx, dy);
      const vx = dx / dt, vy = dy / dt, k = Math.min(1, dt * 20);
      drag.vx += (vx - drag.vx) * k; drag.vy += (vy - drag.vy) * k;
      const sp = Math.hypot(drag.vx, drag.vy);
      if (sp > 30) {
        const th = Math.atan2(drag.vy, drag.vx), a = Math.min(1, dt / 0.25);
        drag.c2 += (Math.cos(2 * th) - drag.c2) * a;
        drag.s2 += (Math.sin(2 * th) - drag.s2) * a;
        const ang = Math.atan2(drag.s2, drag.c2) / 2 + Math.PI / 2;
        s.head += (near(-ang, s.head) - s.head) * Math.min(1, dt * 10);
      }
      const n = Math.max(1, Math.ceil(d / 3));
      for (let i = 1; i <= n; i++) {
        const x = s.x + dx * i / n, y = s.y + dy * i / n;
        scratch.to(x, y, band, -s.head);
        if (i % 2 === 0) crumbs(x, y);
      }
      s.x = held.tx; s.y = held.ty; s.z = restZ;
      lean(s.head, drag.vx, -drag.vy);
      if (sp < 30) { s.tilt += (TILT - s.tilt) * Math.min(1, dt * 6); s.roll *= Math.exp(-dt * 6); }
    } else if (phase === 'rest') {
      s.tilt += (TILT - s.tilt) * Math.min(1, dt * 6);
      s.roll *= Math.exp(-dt * 6);
      if (t >= rest) nextPatch(now);
    } else if (phase === 'settle') {
      // Stops, then a short shake: side to side, dying away.
      const k = Math.min(1, t / 0.55);
      s.tilt += (TILT - s.tilt) * 0.2;
      if (baseHead === null) baseHead = s.head;
      s.roll *= 0.85;
      s.head = baseHead + MathUtils.degToRad(14) * Math.sin(t * 46) * (1 - k) * Math.min(1, t / 0.08);
      if (k >= 1) { phase = 'pop'; t0 = now; puff(); }
    } else if (phase === 'pop') {
      // A quick swell, then gone.
      const k = Math.min(1, t / 0.2);
      s.scale = k < 0.4 ? 1 + 0.2 * ease.out(k / 0.4) : 1.2 * (1 - ease.inOut((k - 0.4) / 0.6));
      if (k >= 1) { done(); return; }
    }

    drawCrumbs((now - prev) / 1000);
    prev = now;
    place();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // ---- crumbs ------------------------------------------------------------
  // Coating comes off a ticket as grit: little flakes thrown back from the
  // edge, skidding to a stop and fading. Drawn on a 2D canvas under the
  // coin's, so the coin passes over its own mess.
  const dust = document.createElement('canvas');
  dust.className = 'penny-dust';
  dust.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dust);
  const dg = dust.getContext('2d');
  function sizeDust() {
    dust.width = W() * dpr; dust.height = H() * dpr;
    dust.style.width = W() + 'px'; dust.style.height = H() + 'px';
  }
  sizeDust();
  window.addEventListener('resize', sizeDust);
  const flakes = [];
  let since = 0, cx0 = null, cy0 = null;
  function crumbs(x, y) {
    if (cx0 === null) { cx0 = x; cy0 = y; return; }
    const dx = x - cx0, dy = y - cy0, d = Math.hypot(dx, dy);
    cx0 = x; cy0 = y;
    since += d;
    if (d < 0.01) return;
    const ux = dx / d, uy = dy / d;
    while (since > 16) {
      since -= 16;
      if (flakes.length > 90) flakes.shift();
      // mostly off the ends of the edge, where a ticket sheds
      const end = Math.random() < 0.5 ? -1 : 1;
      const along = end * band * (0.55 + Math.random() * 0.45);
      const sp = 40 + Math.random() * 140;
      const a = Math.atan2(-uy, -ux) + (Math.random() - 0.5) * 1.6;
      flakes.push({
        x: x - uy * along, y: y + ux * along,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 0.5 + Math.random() * 1.0, rot: Math.random() * TAU,
        life: 0, max: 0.3 + Math.random() * 0.45,
        shade: 244 + Math.floor(Math.random() * 11)
      });
    }
  }
  function drawCrumbs(dt) {
    dg.setTransform(dpr, 0, 0, dpr, 0, 0);
    dg.clearRect(0, 0, W(), H());
    if (!(dt > 0)) dt = 0.016;
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.life += dt;
      if (f.life >= f.max) { flakes.splice(i, 1); continue; }
      const drag = Math.exp(-dt * 7);
      f.vx *= drag; f.vy *= drag;
      f.x += f.vx * dt; f.y += f.vy * dt;
      const o = 1 - Math.pow(f.life / f.max, 2);
      dg.save();
      dg.translate(f.x, f.y); dg.rotate(f.rot);
      // Flakes of the page itself: white, with just enough edge to read
      // against the white they came off.
      dg.fillStyle = `rgba(${f.shade},${f.shade},${f.shade},${o})`;
      dg.strokeStyle = `rgba(0,0,0,${0.1 * o})`;
      dg.lineWidth = 0.5;
      dg.beginPath();
      dg.moveTo(-f.r, -f.r * 0.5); dg.lineTo(f.r, -f.r * 0.2); dg.lineTo(f.r * 0.2, f.r * 0.7);
      dg.closePath();
      dg.fill(); dg.stroke();
      dg.restore();
    }
  }

  function puff() {
    const r = cvs.getBoundingClientRect();
    const cx = s.x, cy = s.y - R * Math.cos(s.tilt) * 0.5;
    const wrap = document.createElement('div');
    wrap.className = 'penny-puff';
    wrap.style.left = (cx - r.left) + 'px';
    wrap.style.top = (cy - r.top) + 'px';
    for (let i = 0; i < 9; i++) {
      const d = document.createElement('span');
      const a = (i / 9) * TAU + Math.random() * 0.4;
      const dist = R * (0.9 + Math.random() * 0.6);
      d.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
      d.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'px');
      d.style.setProperty('--sz', (3 + Math.random() * 4).toFixed(1) + 'px');
      wrap.appendChild(d);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 900);
  }

  function done() {
    alive = false;
    document.removeEventListener('pointerdown', onDown, true);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    document.documentElement.style.touchAction = touchWas;
    document.documentElement.style.cursor = '';
    window.removeEventListener('resize', layout);
    window.removeEventListener('resize', sizeDust);
    dust.remove();
    renderer.dispose();
    pmrem.dispose();
    cvs.remove();
  }

  place();
  requestAnimationFrame((now) => { t0 = now; frame(now); });
}
