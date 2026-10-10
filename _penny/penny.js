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
  CircleGeometry, PlaneGeometry, MeshStandardMaterial, ShadowMaterial,
  DirectionalLight, HemisphereLight, TextureLoader, SRGBColorSpace,
  PMREMGenerator, PCFSoftShadowMap, ACESFilmicToneMapping, Euler, MathUtils,
  Color, Vector2
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


// A shadow is darkest where the thing touches the page and thins out as it
// gets away from it. The page only knows "shadowed or not", so its alpha is
// also multiplied by a falloff from the point under the object.
function fadeShadow(mat) {
  const u = { uC: { value: new Vector2() }, uR: { value: new Vector2(30, 120) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vW;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'varying vec3 vW;\nuniform vec2 uC;\nuniform vec2 uR;\nvoid main() {')
      .replace('gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );',
        'gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * ( 1.0 - smoothstep( uR.x, uR.y, distance( vW.xy, uC ) ) ) );');
  };
  return u;
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
    // On a dense screen the pixels are fine enough already; multisampling a
    // full-screen canvas there is cost with nothing to show for it.
    const sharp = (window.devicePixelRatio || 1) >= 2;
    renderer = new WebGLRenderer({ antialias: !sharp, alpha: true, premultipliedAlpha: true,
                                   powerPreference: 'high-performance' });
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
  scene.environmentIntensity = 0.6;

  // A camera whose z = 0 plane maps one unit to one CSS pixel, with a long
  // lens so the coin has real perspective without the page plane distorting.
  const FOV = 16;
  const camera = new PerspectiveCamera(FOV, 1, 10, 20000);

  // The site's light: a lamp above the top of the screen, about 50 degrees
  // up, over a dim room, so things are lit from above and shaded below and
  // their shadows fall plainly down the page.
  scene.add(new HemisphereLight(0xffffff, 0xe9e6e2, 0.32));
  const key = new DirectionalLight(0xffffff, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.6;
  key.shadow.radius = 6;
  scene.add(key, key.target);

  const floorMat = new ShadowMaterial({ opacity: 0.3 });
  const shadowFade = fadeShadow(floorMat);
  const floor = new Mesh(new PlaneGeometry(1, 1), floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  // The 3D canvas is not the whole screen. It is a square just big enough
  // for the coin and its longest shadow, and it travels with the coin; the
  // camera keeps its full-screen view and renders only that window of it
  // (setViewOffset), so the picture is identical and the pixels drawn each
  // frame are a fraction of the display's.
  let win = 0, bx = 0, by = 0;
  function layout() {
    const w = W(), h = H();
    camera.aspect = w / h;
    const dist = (h / 2) / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.position.set(w / 2, -h / 2, dist);
    camera.near = dist * 0.2; camera.far = dist * 3;
    camera.lookAt(w / 2, -h / 2, 0);
    if (win) camera.setViewOffset(w, h, bx, by, win, win);
    camera.updateProjectionMatrix();
    key.shadow.camera.near = 10; key.shadow.camera.far = 3000;
  }

  // The page under the coin, and the light's view of it, cover only the
  // patch where the coin's shadow can fall, and travel with it. Spread over
  // the whole screen, the shadow was being worked out for every pixel of the
  // display on every frame, to draw one coin's worth of it. The light comes
  // from above the top of the screen, so a point at height z throws its
  // shadow 0.83z straight down the screen. pen.js has the same light.
  const LIGHT = { x: 0, y: 580, z: 700 };
  let shadowSpan = 0;
  function followShadow(cx, cy) {
    const top = s.z + R * s.scale;
    const ox = -LIGHT.x / LIGHT.z * top, oy = -LIGHT.y / LIGHT.z * top;
    const span = Math.ceil((R * s.scale * 2.6 + Math.hypot(ox, oy)) / 8) * 8;
    const fx = cx + ox / 2, fy = cy + oy / 2;
    floor.position.set(fx, fy, 0);
    floor.scale.set(span * 1.6, span * 1.6, 1);
    key.target.position.set(fx, fy, 0);
    key.position.set(fx + LIGHT.x, fy + LIGHT.y, LIGHT.z);
    if (span !== shadowSpan) {
      shadowSpan = span;
      const c = key.shadow.camera;
      c.left = -span; c.right = span; c.top = span; c.bottom = -span;
      c.updateProjectionMatrix();
    }
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
  // Big enough for the coin, a little swell, and the shadow it throws from
  // the top of its jump (a point at height z casts 0.55z away).
  win = Math.ceil((R * 2.6 + 0.55 * 300 + 16) / 2) * 2;
  renderer.setSize(win, win, false);
  cvs.style.width = cvs.style.height = win + 'px';

  const copper = new Color('#c27a4f');
  const edgeMat = new MeshStandardMaterial({
    color: copper, metalness: 1, roughness: 0.32
  });
  const faceMat = (t) => {
    return new MeshStandardMaterial({
      color: 0xffffff, map: t.map, normalMap: t.normal, roughnessMap: t.rough,
      metalness: 1, roughness: 0.95
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
  const s = { x: 0, y: 0, z: 0, tilt: 0, head: 0, roll: 0, scale: 1, flip: 0, alpha: 1 };

  function place() {
    // Lean is a rotation about the coin's horizontal diameter; with the coin
    // leaning back by `tilt`, its lowest point sits R·sin(tilt) below centre,
    // and the centre is R·cos(tilt) from the contact point across the page,
    // in whichever direction the heading has turned it. Roll rocks the coin
    // about its upright diameter.
    const lean = s.tilt + s.flip;
    coin.quaternion.setFromEuler(new Euler(lean, s.roll, s.head, 'ZXY'));
    const off = R * Math.cos(s.tilt) * s.scale;
    holder.position.set(s.x - Math.sin(s.head) * off, -(s.y) + Math.cos(s.head) * off, s.z);
    holder.scale.setScalar(s.scale);
    // A shadow thins as what casts it rises: full on the page, a ghost of
    // itself at the top of the hop.
    floor.material.opacity = 0.2 * s.alpha * (1 - 0.75 * Math.min(1, Math.max(0, s.z - restZ) / 220));
    followShadow(holder.position.x, holder.position.y);
    // full out to about the coin's own width, gone by two and a half more,
    // and further the higher it is, since the shadow is then longer
    shadowFade.uC.value.set(holder.position.x, holder.position.y);
    const rr = R * s.scale;
    shadowFade.uR.value.set(rr * 1.3 + s.z * 0.2, rr * 4.2 + s.z * 0.9);
    // Move the window over the coin and its shadow, and render just that.
    const top = s.z + R * s.scale;
    const wx = holder.position.x + 0.29 * top / 2, wy = -holder.position.y + 0.47 * top / 2;
    const nbx = Math.round(wx - win / 2), nby = Math.round(wy - win / 2);
    if (nbx !== bx || nby !== by) {
      bx = nbx; by = nby;
      cvs.style.transform = `translate(${bx}px, ${by}px)`;
      camera.setViewOffset(W(), H(), bx, by, win, win);
      camera.updateProjectionMatrix();
    }
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
  // Nothing is filled in for it: the coin scrapes off every last bit.
  if (scratch.need) scratch.need(1);
  if (scratch.fray) scratch.fray(true);
  const TILT = MathUtils.degToRad(36);
  const restZ = R * Math.sin(TILT) + (T / 2) * Math.cos(TILT);
  const band = R * 0.95;            // half the width of the band the edge scrapes
  const pb = plate.getBoundingClientRect();
  const big = Math.min(1.8, Math.max(1, Math.sqrt(pb.width * pb.height) / 320));

  // Scratched the way a person does it: a burst of strokes in one spot, lift,
  // somewhere else, another burst. Each spot is chosen among the places still
  // covered: a few at random, and the one with the most covering round it,
  // so it wanders here and there without wasting itself on clean ground.
  //
  // At the very end, with only scraps left, it changes: it goes to the
  // nearest scrap, works it in a small tight burst, and stops leaving
  // slivers behind, so the job can actually be finished.
  let total = 0, tidy = false;
  function pickSpot(open) {
    if (!open.length) return null;
    if (tidy) {
      let best = null, bd = Infinity;
      for (let i = 0; i < 6; i++) {
        const c = open[Math.floor(Math.random() * open.length)];
        const d = Math.hypot(c[0] - s.x, c[1] - s.y);
        if (d < bd) { bd = d; best = c; }
      }
      return best;
    }
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
    const f = rnd(3, 4.2);
    const dur = tidy ? rnd(0.6, 1.0) : rnd(1.2, 2.0);
    const drift = theta + Math.PI / 2 + rnd(-0.45, 0.45);
    const dv = rnd(1.0, 1.4) * band * f;
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
    const P = { theta, f, dur, pts, seed, amp: tidy ? band * rnd(0.8, 1.2) : band * rnd(1.5, 2.3) * big };
    // Near the picture's edge it is more careful: strokes are shortened until
    // the swing stays on the plate. (pose() also holds the line, for a drift
    // that wanders out on its own.)
    const lo = band * 0.6;
    for (let k = 0; k < 8 && P.amp > lo; k++) {
      let out = false;
      for (let u = 0; u <= dur; u += 0.03) {
        const q = rawPose(P, u);
        if (q.x < pb.left + EDGE || q.x > pb.right - EDGE || q.y < pb.top + EDGE || q.y > pb.bottom - EDGE) { out = true; break; }
      }
      if (!out) break;
      P.amp = Math.max(lo, P.amp * 0.8);
    }
    return P;
  }

  // Where the edge is at time u in a burst, and the angle it is held at.
  // Strokes run long by uneven amounts, their direction wanders a little, and
  // they ease in and out at the ends of the burst rather than starting and
  // stopping mid-swing.
  const EDGE = band * 0.35;   // how far past the plate's edge the coin's contact may go
  function pose(P, u) {
    const q = rawPose(P, u);
    q.x = Math.max(pb.left - EDGE, Math.min(pb.right + EDGE, q.x));
    q.y = Math.max(pb.top - EDGE, Math.min(pb.bottom + EDGE, q.y));
    return q;
  }
  function rawPose(P, u) {
    const sd = P.seed;
    const k = Math.max(0, Math.min(1, u / P.dur)) * (P.pts.length - 1);
    const i = Math.min(P.pts.length - 2, Math.floor(k)), fr = k - i;
    const cx = P.pts[i][0] + (P.pts[i + 1][0] - P.pts[i][0]) * fr;
    const cy = P.pts[i][1] + (P.pts[i + 1][1] - P.pts[i][1]) * fr;
    const th = P.theta + 0.3 * Math.sin(u * 2.3 + sd * 1.7);
    // Strokes swell and shrink unevenly through the burst: its outline is
    // ragged rather than a ruled block. They never drop below the stroke the
    // drift was sized for, so nothing between them is missed.
    const a = P.amp * (1 + 0.3 * Math.max(0, Math.sin(u * 3.1 + sd))
                         + 0.15 * Math.max(0, Math.sin(u * 8.3 + sd * 2.3)));
    const w = Math.sin(TAU * P.f * u + 0.3 * Math.sin(u * 1.9 + sd));
    const env = Math.max(0, Math.min(1, u / 0.1, (P.dur - u) / 0.1));
    return { x: cx + Math.cos(th) * a * w * env, y: cy + Math.sin(th) * a * w * env, ang: th + Math.PI / 2 };
  }

  let phase = 'appear', t0 = performance.now(), prev = 0, alive = true;
  let patch = null, lastU = 0, hop = null, rest = 0;
  let revealed = false, baseHead = null, view = null;
  // How far someone has scratched with it by hand. A drag of any length
  // counts as helping; a tap that only picks it up does not.
  let helpedBy = 0, bubble = null;
  const HELPED = 40;
  // Standing up to look: nearly upright on its edge, face to the picture.
  const ADMIRE = MathUtils.degToRad(70);
  const zAt = (tilt) => R * Math.sin(tilt) + (T / 2) * Math.cos(tilt);
  // Where to stand to look at the finished picture: always off the plate's
  // bottom left corner, facing the plate's centre, so whatever it says has
  // the room to its right. Its face turns to the picture, so it is the
  // shield the reader sees.
  function viewSpot() {
    const b = plate.getBoundingClientRect(), m = R * 1.6;
    const x = Math.max(R * 1.5, b.left + Math.min(b.width * 0.12, R * 1.2));
    const y = Math.max(R * 2, Math.min(H() - R, b.bottom + m));
    // front face's reach across the page is (sin h, -cos h) in world axes
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    // a face has a front, so the nearest turn is taken round the full circle
    let h = Math.atan2(cx - x, cy - y);
    while (h - s.head > Math.PI) h -= TAU;
    while (h - s.head < -Math.PI) h += TAU;
    return { x0: s.x, y0: s.y, x, y, h0: s.head, h };
  }
  document.addEventListener('egg-revealed', () => { revealed = true; }, { once: true });

  // Where it starts: the timer's spot, at the timer's size, flat to the reader.
  const fr = from ? from.getBoundingClientRect() : { left: W() - 60, top: 20, width: 28, height: 28 };
  // The coin takes the timer's place exactly: same centre, same size, flat
  // to the reader. Its contact point is the bottom of that disc, which is
  // what it pivots on when it leans up.
  const s0 = fr.width / D;
  const home = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 + R * s0 };
  const smallZ = (tilt) => (R * Math.sin(tilt) + (T / 2) * Math.cos(tilt)) * s0;
  let start = null;
  const mats = [edgeMat, front.material, back.material];
  function fade(a) {
    s.alpha = a;
    for (const m of mats) {
      const see = a < 1;
      if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; }
      m.opacity = a;
    }
  }
  const open0 = scratch.covered();
  total = open0.length || 1;
  patch = makePatch(pickSpot(open0) || [pb.left + pb.width / 2, pb.top + pb.height / 2]);
  const first = pose(patch, 0);

  // Lift, move to the next spot, put down: a short glide with a little
  // height, the coin turning on the way to the angle the next burst wants.
  function nextPatch(now) {
    scratch.lift();
    const open = scratch.covered();
    if (!tidy && (open.length < total * 0.035 || open.length < 40)) {
      tidy = true;
      if (scratch.fray) scratch.fray(false);
    }
    const c = pickSpot(open);
    if (!c) { phase = 'stop'; t0 = now; return; }
    patch = makePatch(c);
    const to = pose(patch, 0);
    const d = Math.hypot(to.x - s.x, to.y - s.y);
    hop = {
      x0: s.x, y0: s.y, x1: to.x, y1: to.y, h0: s.head, h1: near(-to.ang, s.head),
      dur: Math.max(0.35, Math.min(0.9, d / 520)), lift: Math.min(34, 8 + d * 0.08),
      // a moment between bursts, the way a person stops to look
      wait: tidy ? rnd(0.1, 0.35) : rnd(0.3, 0.9)
    };
    phase = 'travel'; t0 = now;
  }

  // ---- your hand ---------------------------------------------------------
  // Press on the coin, with a finger or a mouse, and it is yours: it follows,
  // scratching wherever it is dragged, and turns and leans with the drag. Let
  // go and, after a moment, it carries on by itself.
  let held = null;
  const drag = { vx: 0, vy: 0, c2: 0, s2: 0 };
  const canHold = () => phase === 'land' || phase === 'travel' || phase === 'patch' || phase === 'rest' || phase === 'held';
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
    askTilt();
    scratch.lift();
    if (phase === 'held') { phase = 'rest'; t0 = performance.now(); rest = 1.2; }
  }
  document.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  // A finger on the coin is a grab and a drag on it is a drag: not a
  // scroll, not a zoom. Safari honours that only through its own touch
  // events, cancelled as they happen, so the page keeps every gesture
  // everywhere else, pinch-to-zoom included.
  function onTouchStart(e) {
    const t = e.touches[0];
    if (t && e.touches.length === 1 && alive && canHold() && over(t)) e.preventDefault();
  }
  function onTouchMove(e) { if (held) e.preventDefault(); }
  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
  document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });

  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;
    const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));

    if (revealed && (phase === 'land' || phase === 'travel' || phase === 'patch' || phase === 'held' || phase === 'rest')) {
      if (held) { held = null; document.documentElement.style.cursor = ''; }
      scratch.lift(); phase = 'stop'; t0 = now;
    }

    if (phase === 'appear') {
      // Fades in where the timer was, the timer's size, flat to the reader.
      const k = Math.min(1, t / 0.6);
      s.x = home.x; s.y = home.y; s.scale = s0; s.tilt = 0; s.head = 0; s.roll = 0;
      s.z = smallZ(0);
      fade(ease.inOut(k));
      if (k >= 1) { phase = 'wake'; t0 = now; }
    } else if (phase === 'wake') {
      // Leans up onto its edge, pivoting on it, a touch past and back; then
      // shakes itself awake: a quick rocking twist and two small bounces,
      // dying away; then a beat, and it goes.
      const up = Math.min(1, t / 0.55);
      s.tilt = TILT * ease.back(up);
      s.z = smallZ(s.tilt);
      const w = Math.max(0, t - 0.75);
      if (w > 0) {
        const d = Math.max(0, 1 - w / 0.7);
        s.roll = MathUtils.degToRad(16) * Math.sin(w * 30) * d;
        s.head = MathUtils.degToRad(10) * Math.sin(w * 23 + 1) * d;
        s.z += Math.abs(Math.sin(w * 9)) * 6 * s0 * d * (w < 0.7 ? 1 : 0);
      }
      if (t >= 1.75) {
        phase = 'enter'; t0 = now; s.roll = 0; s.head = 0;
        start = { x: s.x, y: s.y, z: s.z };
      }
    } else if (phase === 'enter') {
      // The jump: up and over to the plate, growing from the timer's size to
      // its own, turning over twice, and landing leaning on its edge.
      const dur = 1.35;
      const k = Math.min(1, t / dur);
      const e = ease.inOut(k);
      s.x = start.x + (first.x - start.x) * e;
      s.y = start.y + (first.y - start.y) * e;
      s.scale = MathUtils.lerp(s0, 1, ease.out(Math.min(1, k / 0.45)));
      s.tilt = TILT;
      s.flip = (1 - ease.out(k)) * TAU * 2;
      s.z = MathUtils.lerp(start.z, restZ, e) + Math.sin(Math.PI * Math.min(1, k * 1.05)) * 240 * (1 - k * 0.3);
      s.head = near(-first.ang, 0) * ease.out(k);
      if (k >= 1) { phase = 'land'; t0 = now; s.flip = 0; s.z = restZ; }
    } else if (phase === 'land') {
      // Landed on the plate. It stands a second and takes in the space before
      // it starts, which is also the chance to pick it up.
      s.x = first.x; s.y = first.y; s.z = restZ;
      s.tilt += (TILT - s.tilt) * Math.min(1, dt * 8);
      if (t >= 1) { phase = 'patch'; t0 = now; lastU = 0; }
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
        const q = pose(P, v); crumbs(q.x, q.y, q.ang); scratch.to(q.x, q.y, band, q.ang);
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
        crumbs(x, y, -s.head);
        scratch.to(x, y, band, -s.head);
      }
      helpedBy += d;
      s.x = held.tx; s.y = held.ty; s.z = restZ;
      lean(s.head, drag.vx, -drag.vy);
      if (sp < 30) { s.tilt += (TILT - s.tilt) * Math.min(1, dt * 6); s.roll *= Math.exp(-dt * 6); }
    } else if (phase === 'rest') {
      s.tilt += (TILT - s.tilt) * Math.min(1, dt * 6);
      s.roll *= Math.exp(-dt * 6);
      if (t >= rest) nextPatch(now);
    } else if (phase === 'stop') {
      // Done. It holds still a moment where it finished.
      s.tilt += (TILT - s.tilt) * Math.min(1, dt * 8);
      s.roll *= Math.exp(-dt * 8);
      if (t >= 0.5) { view = viewSpot(); phase = 'step'; t0 = now; }
    } else if (phase === 'step') {
      // A hop to just off the plate's corner, turning to face the picture.
      const k = Math.min(1, t / 0.75), e = ease.inOut(k);
      s.x = view.x0 + (view.x - view.x0) * e;
      s.y = view.y0 + (view.y - view.y0) * e;
      s.head = view.h0 + (view.h - view.h0) * e;
      s.tilt += (ADMIRE - s.tilt) * Math.min(1, dt * 6);
      s.z = zAt(s.tilt) + Math.sin(Math.PI * k) * 26;
      s.roll *= Math.exp(-dt * 8);
      if (k >= 1) { phase = 'admire'; t0 = now; }
    } else if (phase === 'admire') {
      // It looks at what it did: stands a little taller, sways slowly, and
      // gives two small bounces of satisfaction before it goes.
      s.head = view.h + MathUtils.degToRad(5) * Math.sin(t * 1.3);
      s.roll = MathUtils.degToRad(3.5) * Math.sin(t * 0.9 + 0.4);
      s.tilt = ADMIRE + MathUtils.degToRad(3) * Math.sin(t * 1.7);
      const b = t - 1.25;
      s.z = zAt(s.tilt) + (b > 0 && b < 0.5 ? Math.abs(Math.sin(b * TAU * 2)) * 7 * (1 - b / 0.5) : 0);
      // If someone lent a hand, it says so, and takes a little longer over
      // its admiring so the words can be read.
      const thanks = helpedBy > HELPED;
      if (thanks && !bubble && t > 0.5) bubble = say('Thanks for helping');
      if (bubble) placeBubble();
      if (bubble && t > 3.3 && !bubble.classList.contains('out')) bubble.classList.add('out');
      if (t >= (thanks ? 3.75 : 2.6)) {
        if (bubble) { bubble.remove(); bubble = null; }
        phase = 'settle'; t0 = now;
      }
    } else if (phase === 'settle') {
      // Stops, then a short shake: side to side, dying away.
      // It stays standing for this; it does not slump first.
      const k = Math.min(1, t / 0.55);
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

  // ---- shavings ---------------------------------------------------------
  // What comes off is what was there: black flecks where the edge goes
  // through the statement's letters, white everywhere else, and nothing at
  // all where the coating is already gone. They fly off the ends of the
  // edge, land, and lie where they fell, each with a shadow cast by the same
  // light as the coin's (down and to the right), long while a flake is in
  // the air and tight once it is down. They lie there until the coin goes.
  const dust = document.createElement('canvas');
  dust.className = 'penny-dust';
  dust.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dust);
  const dg = dust.getContext('2d');
  // Flakes that have landed and stopped are painted once onto a bed beneath
  // and forgotten; only the few still moving are drawn each frame. Redrawing
  // hundreds every frame is what made the second half stutter.
  const bed = document.createElement('canvas');
  bed.className = 'penny-dust';
  bed.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bed, dust);
  const bg = bed.getContext('2d');
  function sizeDust() {
    for (const c of [dust, bed]) {
      c.width = W() * dpr; c.height = H() * dpr;
      c.style.width = W() + 'px'; c.style.height = H() + 'px';
    }
  }
  sizeDust();
  window.addEventListener('resize', sizeDust);

  // Where the ink is: the statement's line boxes. Letters fill roughly a
  // third of a line box, so a flake from inside one is ink about that often.
  const inkBoxes = [];
  const stmt = document.querySelector('.statement');
  if (stmt) {
    const walk = document.createTreeWalker(stmt, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const b of rg.getClientRects()) inkBoxes.push(b);
    }
  }
  const inInk = (x, y) => inkBoxes.some((b) => x >= b.left && x <= b.right && y >= b.top + b.height * 0.18 && y <= b.bottom - b.height * 0.12);

  const flakes = [];
  let ex0 = null, ey0 = null, owe = [0, 0];

  // The phone's tilt. Held up in a hand, the screen is a slope: grit that
  // has landed slides down it and off the bottom edge, the loose white
  // first and the ink after, as it would off a tilted card. Flat on a table
  // it stays where it fell. `slope` is gravity's pull along the screen, in
  // screen axes, 0 flat to 1 upright.
  const slope = { x: 0, y: 0, m: 0 };
  function onTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    const b = e.beta * Math.PI / 180, g = e.gamma * Math.PI / 180;
    // toward the phone's right edge, and toward its bottom edge
    const x = Math.cos(b) * Math.sin(g), y = Math.sin(b);
    const turn = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
    slope.x = x * Math.cos(turn) + y * Math.sin(turn);
    slope.y = -x * Math.sin(turn) + y * Math.cos(turn);
    slope.m = Math.hypot(slope.x, slope.y);
  }
  // iPhones ask first, and only from a tap: the first time the coin is let
  // go. Elsewhere it is simply there.
  const Orient = window.DeviceOrientationEvent;
  const mustAsk = Orient && typeof Orient.requestPermission === 'function';
  let asked = false;
  if (Orient && !mustAsk) window.addEventListener('deviceorientation', onTilt);
  function askTilt() {
    if (!mustAsk || asked) return;
    asked = true;
    Orient.requestPermission().then((r) => { if (r === 'granted') window.addEventListener('deviceorientation', onTilt); }, () => {});
  }
  // Landed flakes are painted into the bed and kept here, so a tilt can lift
  // them out again.
  const settled = [];
  function crumbs(x, y, ang) {
    if (ex0 === null) { ex0 = x; ey0 = y; return; }
    const mx = x - ex0, my = y - ey0, d = Math.hypot(mx, my);
    ex0 = x; ey0 = y;
    if (d < 0.01) return;
    const nx = Math.cos(ang), ny = Math.sin(ang);
    for (let e = 0; e < 2; e++) {
      owe[e] += d;
      while (owe[e] > 7.5) {
        owe[e] -= 7.5;
        const sgn = e ? 1 : -1, along = sgn * band * (0.6 + Math.random() * 0.45);
        const px = x + nx * along, py = y + ny * along;
        if (!scratch.coveredAt(px, py)) continue;
        if (flakes.length > 400) flakes.shift();
        const ink = inInk(px, py) && Math.random() < 0.38;
        // white grit is finer and sparser than the ink that comes off letters
        if (!ink && Math.random() < 0.3) continue;
        // thrown back from the travel and out past the end of the edge
        const a = Math.atan2(-my, -mx) * 0.6 + Math.atan2(ny * sgn, nx * sgn) * 0.4 + (Math.random() - 0.5) * 1.2;
        const sp = 30 + Math.pow(Math.random(), 2) * 160;
        const r = (ink ? 0.45 : 0.55) + Math.pow(Math.random(), 2.2) * (ink ? 1.3 : 2.0);
        const pts = [], k = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < k; i++) {
          const t = (i / k) * TAU + Math.random() * 0.6;
          const rr = r * (0.55 + Math.random() * 0.6);
          pts.push([Math.cos(t) * rr, Math.sin(t) * rr * (0.6 + Math.random() * 0.4)]);
        }
        flakes.push({
          x: px, y: py, z: 1 + Math.random() * 4,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 20 + Math.random() * 60,
          rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 14, pts,
          shade: ink ? 18 + Math.floor(Math.random() * 30) : 242 + Math.floor(Math.random() * 13),
          ink, life: 0, still: 0, gone: 1,
          // how steep the screen must be before it slides: ink sticks more
          grip: (ink ? 0.42 : 0.3) + Math.random() * 0.18
        });
      }
    }
  }
  let fading = 0;   // > 0 once the coin has gone: the last of the dust fades with it
  let dustDrawn = false;
  function drawCrumbs(dt) {
    // Nothing in the air and nothing drawn last frame: nothing to do.
    if (!flakes.length && !dustDrawn) return;
    dustDrawn = flakes.length > 0;
    dg.setTransform(dpr, 0, 0, dpr, 0, 0);
    dg.clearRect(0, 0, W(), H());
    if (!(dt > 0)) dt = 0.016;
    dt = Math.min(dt, 0.05);
    // tipped past what holds some of the settled grit: lift those back out
    // of the bed and repaint the rest
    if (settled.length && settled.some((f) => slope.m > f.grip)) {
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.clearRect(0, 0, W(), H());
      for (let i = settled.length - 1; i >= 0; i--) {
        const f = settled[i];
        if (slope.m > f.grip) { f.still = 0; flakes.push(f); settled.splice(i, 1); } else paint(bg, f, 1);
      }
      dustDrawn = true;
    }
    const ux = slope.m ? slope.x / slope.m : 0, uy = slope.m ? slope.y / slope.m : 0;
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.life += dt;
      if (f.z > 0) {
        f.vz -= 900 * dt * Math.max(0.2, 1 - slope.m * 0.5); f.z += f.vz * dt;
        f.vx += ux * slope.m * 900 * dt; f.vy += uy * slope.m * 900 * dt;
        f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt;
        const drag = Math.exp(-dt * 3);
        f.vx *= drag; f.vy *= drag;
        if (f.z <= 0) { f.z = 0; f.vx *= 0.25; f.vy *= 0.25; f.spin = 0; }
      } else {
        // sliding once the slope beats its grip, faster the steeper
        const pull = slope.m - f.grip;
        if (pull > 0) { f.vx += ux * pull * 7000 * dt; f.vy += uy * pull * 7000 * dt; f.rot += (f.ink ? 0.4 : 1.2) * pull * dt * 10; }
        const drag = Math.exp(-dt * 14);
        f.vx *= drag; f.vy *= drag;
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.still = pull > 0 ? 0 : (Math.hypot(f.vx, f.vy) < 4 ? f.still + dt : f.still);
      }
      // off the edge of the screen: gone
      if (f.y > H() + 12 || f.y < -12 || f.x < -12 || f.x > W() + 12) { flakes.splice(i, 1); continue; }
      if (fading) f.gone = Math.min(f.gone, fading);
      if (f.gone <= 0) { flakes.splice(i, 1); continue; }
      if (f.still > 0.15 && !fading) {
        bg.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint(bg, f, 1);
        settled.push(f);
        flakes.splice(i, 1);
        continue;
      }
      paint(dg, f, Math.min(1, f.gone));
    }
  }
  function paint(g, f, o) {
    // shadow: the lamp is above the top of the screen, as it is for the coin
    const sx = 0.3, sy = 0.7 + f.z * 0.83;
    g.save();
    g.translate(f.x + sx, f.y + sy); g.rotate(f.rot);
    g.fillStyle = `rgba(0,0,0,${(f.ink ? 0.28 : 0.2) * o * Math.max(0.35, 1 - f.z / 14)})`;
    shape(g, f.pts, 1.08);
    g.restore();
    g.save();
    g.translate(f.x, f.y); g.rotate(f.rot);
    g.fillStyle = `rgba(${f.shade},${f.shade},${f.shade},${o})`;
    shape(g, f.pts, 1);
    if (!f.ink) {
      g.strokeStyle = `rgba(0,0,0,${0.07 * o})`;
      g.lineWidth = 0.4;
      g.stroke();
    }
    g.restore();
  }
  function shape(g, pts, k) {
    g.beginPath();
    g.moveTo(pts[0][0] * k, pts[0][1] * k);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * k, pts[i][1] * k);
    g.closePath();
    g.fill();
  }

  // ---- a word ------------------------------------------------------------
  // A message bubble, as a phone draws one that has been received: a grey
  // round-cornered pill with a tail curling down towards whoever sent it,
  // here the coin. It pops up out of its tail and sinks back into it.
  function say(text) {
    const el = document.createElement('div');
    el.className = 'penny-bubble';
    el.setAttribute('role', 'status');
    el.textContent = text;
    document.body.appendChild(el);
    return el;
  }
  function placeBubble() {
    // Off the coin's upper right shoulder, the tail's tip on its rim, the way
    // a message comes from whoever sent it. With no room on the right it
    // flips, tail and all, to the left shoulder.
    const c = centre(), k = s.scale;
    const w = bubble.offsetWidth, h = bubble.offsetHeight, tail = 6;
    const tipY = c[1] - R * 0.55 * k;
    let x = c[0] + R * 0.6 * k + tail;
    const flip = x + w > W() - 8;
    if (flip) x = c[0] - R * 0.6 * k - tail - w;
    bubble.classList.toggle('flip', flip);
    x = Math.max(8, Math.min(W() - w - 8, x));
    const y = Math.max(8, tipY - h);
    bubble.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
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
    if (bubble) { bubble.remove(); bubble = null; }
    document.removeEventListener('pointerdown', onDown, true);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    document.removeEventListener('touchstart', onTouchStart, true);
    document.removeEventListener('touchmove', onTouchMove, true);
    document.documentElement.style.cursor = '';
    window.removeEventListener('resize', layout);
    renderer.dispose();
    pmrem.dispose();
    cvs.remove();
    // The shavings outlast the coin by a moment, then fade.
    fading = 1;
    bed.style.transition = 'opacity 900ms ease';
    bed.style.opacity = '0';
    setTimeout(() => bed.remove(), 1000);
    let last = performance.now();
    (function settleDust(now) {
      const dt = (now - last) / 1000; last = now;
      fading = Math.max(0, fading - dt / 0.9);
      drawCrumbs(dt);
      if (fading > 0) requestAnimationFrame(settleDust);
      else { window.removeEventListener('resize', sizeDust); window.removeEventListener('deviceorientation', onTilt); dust.remove(); }
    })(last);
  }

  place();
  requestAnimationFrame((now) => { t0 = now; frame(now); });
}
