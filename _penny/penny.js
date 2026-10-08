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
// the scratch plate, stands on its edge and scratches it open in rows, the way
// a lottery ticket gets done. When the plate says it is open the penny stops,
// shakes, and pops.

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, CylinderGeometry,
  CircleGeometry, PlaneGeometry, MeshPhysicalMaterial, ShadowMaterial,
  DirectionalLight, HemisphereLight, CanvasTexture, SRGBColorSpace,
  PMREMGenerator, PCFSoftShadowMap, ACESFilmicToneMapping, Euler, MathUtils,
  Color
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { faceTextures } from './faces.js';

const TAU = Math.PI * 2;
const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
};

export async function run({ plate, from }) {
  if (!plate || !plate.scratch || plate.scratch.isDone()) return;
  // The lettering is set in the site's bold before it is pressed into the
  // height maps; drawn early, it would be Arial.
  try { await document.fonts.load('700 40px "Areal"'); } catch (e) {}
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
  const faceMat = (side) => {
    const t = faceTextures(side, renderer.capabilities.maxTextureSize >= 2048 ? 1024 : 512);
    t.map.colorSpace = SRGBColorSpace;
    return new MeshPhysicalMaterial({
      color: 0xffffff, map: t.map, normalMap: t.normal, roughnessMap: t.rough,
      metalness: 1, roughness: 1, clearcoat: 0.15, clearcoatRoughness: 0.4
    });
  };

  const coin = new Group();
  const body = new Mesh(new CylinderGeometry(R, R, T, 96, 1, true), edgeMat);
  body.rotation.x = Math.PI / 2;
  // The shield side faces the reader while the coin works. The obverse is the
  // one that wants a photographed portrait; until then it only flashes past.
  const front = new Mesh(new CircleGeometry(R, 96), faceMat('reverse'));
  front.position.z = T / 2;
  const back = new Mesh(new CircleGeometry(R, 96), faceMat('obverse'));
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
  const s = { x: 0, y: 0, z: 0, tilt: 0, head: 0, scale: 1, flip: 0 };

  function place() {
    // Lean is a rotation about the coin's horizontal diameter; with the coin
    // leaning back by `tilt`, its lowest point sits R·sin(tilt) below centre,
    // and the centre is R·cos(tilt) above (in y) the contact point.
    const lean = s.tilt + s.flip;
    coin.quaternion.setFromEuler(new Euler(lean, 0, s.head, 'ZXY'));
    const cy = R * Math.cos(s.tilt);
    holder.position.set(s.x, -(s.y) + cy, s.z);
    holder.scale.setScalar(s.scale);
  }

  // ---- choreography ------------------------------------------------------
  const scratch = plate.scratch;
  const TILT = MathUtils.degToRad(40);
  const restZ = R * Math.sin(TILT) + (T / 2) * Math.cos(TILT);
  const band = R * 0.62;            // radius of the scratch the edge leaves

  // Rows across the plate, top to bottom, alternating direction. In each row
  // the coin works up and down in quick strokes while it travels, and every
  // half-stroke advances by less than the band is wide so nothing is skipped.
  function plan() {
    const b = plate.getBoundingClientRect();
    const rowH = Math.min(110, Math.max(70, b.height / 4));
    const rows = Math.max(1, Math.ceil(b.height / rowH));
    const step = b.height / rows;
    const pad = band * 0.4;
    const speed = Math.max(260, b.width / 2.2);        // px/s along the row
    const half = band * 1.25;                          // advance per half-stroke
    const freq = speed / (2 * half);
    const legs = [];
    for (let i = 0; i < rows; i++) {
      const y = b.top + step * (i + 0.5);
      const ltr = i % 2 === 0;
      const x0 = ltr ? b.left - pad : b.right + pad;
      const x1 = ltr ? b.right + pad : b.left - pad;
      legs.push({ x0, x1, y, amp: step / 2 + band * 0.15, dur: Math.abs(x1 - x0) / speed, freq });
    }
    return legs;
  }

  // Where the coin is at time t within a leg: travelling, and stroking.
  function along(leg, t) {
    const k = Math.min(1, t / leg.dur);
    const x = leg.x0 + (leg.x1 - leg.x0) * k;
    const ph = t * leg.freq * TAU;
    const y = leg.y + Math.sin(ph) * leg.amp;
    return { x, y, vy: Math.cos(ph) };
  }

  let phase = 'enter', t0 = performance.now(), legs = plan(), leg = 0;
  let target = null, sweep = null, lastT = 0, prev = 0, alive = true;
  let revealed = false;
  document.addEventListener('egg-revealed', () => { revealed = true; }, { once: true });

  // Where it starts: the timer's spot, at the timer's size, flat to the reader.
  const fr = from ? from.getBoundingClientRect() : { left: W() - 60, top: 20, width: 28, height: 28 };
  const start = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 + R };
  const first = along(legs[0], 0);

  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;

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
      s.head = 0;
      if (k >= 1) { phase = 'scratch'; t0 = now; lastT = 0; s.flip = 0; s.z = restZ; }
    } else if (phase === 'scratch') {
      const L = legs[leg];
      const p = along(L, Math.min(t, L.dur));
      // Scratched along the path in small steps since the last frame, not
      // just at this frame's point: a slow frame would otherwise cut the
      // corners off the strokes and leave the plate striped.
      for (let u = lastT + 0.004; u < Math.min(t, L.dur); u += 0.004) {
        const q = along(L, u); scratch.to(q.x, q.y, band);
      }
      lastT = Math.min(t, L.dur);
      // Small lean into each stroke and a little heading wobble: a hand,
      // not a plotter.
      s.x = p.x; s.y = p.y; s.z = restZ;
      s.tilt = TILT + MathUtils.degToRad(5) * p.vy;
      s.head = MathUtils.degToRad(7) * Math.sin(t * 2.3 + leg);
      scratch.to(p.x, p.y, band);
      if (revealed) { phase = 'settle'; t0 = now; scratch.lift(); }
      else if (t >= L.dur) {
        scratch.lift(); lastT = 0;
        if (++leg >= legs.length) {
          // A last pass over whatever the rows missed, nearest first.
          sweep = scratch.covered();
          phase = sweep.length ? 'sweep' : 'settle';
        }
        t0 = now;
      }
    } else if (phase === 'sweep') {
      // Straight to whatever is still covered, nearest first, scratching the
      // whole way at a brisk 900px/s.
      const dt = Math.min(0.05, (now - prev) / 1000);
      let budget = dt * 900;
      while (budget > 0 && !revealed) {
        if (!target) {
          if (!sweep.length) sweep = scratch.covered();
          if (!sweep.length) break;
          sweep.sort((a, b) => Math.hypot(a[0] - s.x, a[1] - s.y) - Math.hypot(b[0] - s.x, b[1] - s.y));
          target = sweep.shift();
        }
        const dx = target[0] - s.x, dy = target[1] - s.y, d = Math.hypot(dx, dy);
        const m = Math.min(d, budget, 4);
        if (d > 0) { s.x += dx / d * m; s.y += dy / d * m; }
        budget -= Math.max(m, 0.5);
        scratch.to(s.x, s.y, band);
        if (d <= 4) target = null;
      }
      s.tilt = TILT + MathUtils.degToRad(5) * Math.sin(t * 30);
      if (revealed || (!target && !sweep.length && !scratch.covered().length)) {
        phase = 'settle'; t0 = now; scratch.lift();
      }
    } else if (phase === 'settle') {
      // Stops, then a short shake: side to side, dying away.
      const k = Math.min(1, t / 0.55);
      s.tilt += (TILT - s.tilt) * 0.2;
      s.head = MathUtils.degToRad(14) * Math.sin(t * 46) * (1 - k) * Math.min(1, t / 0.08);
      if (k >= 1) { phase = 'pop'; t0 = now; puff(); }
    } else if (phase === 'pop') {
      // A quick swell, then gone.
      const k = Math.min(1, t / 0.2);
      s.scale = k < 0.4 ? 1 + 0.2 * ease.out(k / 0.4) : 1.2 * (1 - ease.inOut((k - 0.4) / 0.6));
      if (k >= 1) { done(); return; }
    }

    prev = now;
    place();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
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
    window.removeEventListener('resize', layout);
    renderer.dispose();
    pmrem.dispose();
    cvs.remove();
  }

  place();
  requestAnimationFrame((now) => { t0 = now; frame(now); });
}
