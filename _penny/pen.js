// The critics' pens, for act three of the home page. Built to /js/pen.js by
// `node _penny/build.mjs`; edit this file, not that one. Loaded by poem.js
// when the poem is finished, and only then.
//
// Two pens, two hands: a Bic Cristal in red, held in the right hand, and a
// Paper Mate Flair felt-tip in green, held in the left. They share one stage
// (one canvas, one light, one shadow on the page), so a second pen costs
// only its own geometry.
//
// The same stage as the penny: one transparent, click-through WebGL canvas
// over the viewport in CSS pixels, x right, y up, the page the plane z = 0,
// a soft key light up and to the left, and a shadow on the page. The pen's
// tip is the point it is placed by, so a caller says where the ink goes and
// the pen is wherever that puts it.

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, CylinderGeometry, BoxGeometry,
  PlaneGeometry, SphereGeometry, LatheGeometry, Vector2, CanvasTexture, DoubleSide, MeshStandardMaterial, ShadowMaterial, DirectionalLight, HemisphereLight,
  SRGBColorSpace, PMREMGenerator, PCFSoftShadowMap, ACESFilmicToneMapping, MathUtils,
  Quaternion, Vector3
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';


// A shadow is darkest where the thing touches the page and thins out as it
// gets away from it. The page only knows "shadowed or not", so its alpha is
// also multiplied by a falloff from the point under the object.
function fadeShadow(mat) {
  const u = {
    uC0: { value: new Vector2() }, uR0: { value: new Vector2(30, 120) },
    uC1: { value: new Vector2() }, uR1: { value: new Vector2(30, 120) },
    uW: { value: new Vector2() }
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vW;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'varying vec3 vW;\nuniform vec2 uC0, uR0, uC1, uR1, uW;\nvoid main() {')
      .replace('gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );',
        'float f = max( uW.x * ( 1.0 - smoothstep( uR0.x, uR0.y, distance( vW.xy, uC0 ) ) ), uW.y * ( 1.0 - smoothstep( uR1.x, uR1.y, distance( vW.xy, uC1 ) ) ) );\n' +
        'gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) * f );');
  };
  return u;
}

const FOV = 16;
const LIGHT = { x: -260, y: 420, z: 900 };
const ease = { inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
const frame = () => new Promise((r) => requestAnimationFrame(r));


// ---- the stage, shared by every pen on the page -----------------------------
let stage = null;
function getStage() {
  if (stage) return stage;
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  } catch (e) { return null; }
  const W = () => window.innerWidth, H = () => window.innerHeight;
  const cvs = renderer.domElement;
  cvs.className = 'penny-stage pen-stage';
  cvs.setAttribute('aria-hidden', 'true');
  cvs.style.cssText = 'right:0;bottom:0;width:100%;height:100%';
  document.body.appendChild(cvs);
  // full resolution: at less, a phone scales the canvas up and the pens'
  // edges against the page go jagged
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  const camera = new PerspectiveCamera(FOV, 1, 10, 20000);
  scene.add(new HemisphereLight(0xffffff, 0xe9e6e2, 0.55));
  const key = new DirectionalLight(0xffffff, 1.9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.6;
  key.shadow.radius = 5;
  scene.add(key, key.target);
  const floorMat = new ShadowMaterial({ opacity: 0.2 });
  const fade = fadeShadow(floorMat);
  const floor = new Mesh(new PlaneGeometry(1, 1), floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  function layout() {
    const w = W(), h = H();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = (h / 2) / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.position.set(w / 2, -h / 2, dist);
    camera.near = dist * 0.2; camera.far = dist * 3;
    camera.lookAt(w / 2, -h / 2, 0);
    camera.updateProjectionMatrix();
    floor.scale.set(w * 1.6, h * 1.6, 1);
    floor.position.set(w / 2, -h / 2, 0);
  }
  layout();
  window.addEventListener('resize', layout);

  const pens = [];
  let span = 0;
  // One light for every pen, aimed between them, its shadow wide enough to
  // take them all in; each pen's shadow fades out from the point under it.
  function frameAll() {
    if (!stage) return;
    const live = pens.filter((p) => p.s.a > 0.01);
    let cx = W() / 2, cy = H() / 2, need = 380;
    if (live.length) {
      cx = live.reduce((a, p) => a + p.s.x, 0) / live.length;
      cy = live.reduce((a, p) => a + p.s.y, 0) / live.length;
      live.forEach((p) => { need = Math.max(need, Math.abs(p.s.x - cx) + 300, Math.abs(p.s.y - cy) + 300); });
    }
    need = Math.ceil(need / 40) * 40;
    if (need !== span) {
      span = need;
      const c = key.shadow.camera;
      c.left = -span; c.right = span; c.top = span; c.bottom = -span; c.near = 10; c.far = 3000;
      c.updateProjectionMatrix();
    }
    key.target.position.set(cx + 70, -cy - 70, 0);
    key.position.set(cx + 70 + LIGHT.x, -cy - 70 + LIGHT.y, LIGHT.z);
    const slot = (i) => pens[i];
    for (let i = 0; i < 2; i++) {
      const p = slot(i), C = fade['uC' + i], R = fade['uR' + i];
      if (!p) { fade.uW.value.setComponent(i, 0); continue; }
      p.place();
      C.value.set(p.s.x, -p.s.y);
      R.value.set(14 + p.s.z * 0.2, 150 + p.s.z * 0.6);
      // the shadow thins as the pen lifts, and goes with it when it leaves
      fade.uW.value.setComponent(i, p.s.a * (1 - 0.6 * Math.min(1, p.s.z / 120)));
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frameAll);
  }
  stage = { renderer, scene, camera, pens, W, H, cvs, layout };
  requestAnimationFrame(frameAll);
  return stage;
}
function leaveStage(pen) {
  if (!stage) return;
  const i = stage.pens.indexOf(pen);
  if (i >= 0) stage.pens.splice(i, 1);
  stage.scene.remove(pen.holder);
  if (!stage.pens.length) {
    const st = stage;
    stage = null;
    window.removeEventListener('resize', st.layout);
    st.renderer.dispose();
    st.cvs.remove();
  }
}

const mat = (o) => new MeshStandardMaterial(o);
// Printing on a barrel: words along its length, on the face toward the reader.
function printed(words, r, h, segments, y) {
  const c = document.createElement('canvas');
  c.width = 32 * segments; c.height = 1024;
  const g = c.getContext('2d');
  for (const face of words.faces) {
    g.save();
    g.translate(face * 32 + 16, 1000);
    g.rotate(-Math.PI / 2);
    g.textBaseline = 'middle';
    for (const [text, x, font, color] of words.runs) { g.font = font; g.fillStyle = color; g.fillText(text, x, 0); }
    g.restore();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  const m = new Mesh(new CylinderGeometry(r, r, h, segments, 1, true),
    new MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  m.position.y = y; m.renderOrder = 3;
  return m;
}

// ---- the pens: tip at the origin, length along +y, about 160px long ---------
function bic() {
  // A clear hexagonal barrel with the dark ink tube and its red plug showing
  // through, a brass point with a steel ball, and a red cap on the end with
  // its collar. About 160px from the ball to the top of the cap.
  const redGloss = mat({ color: '#d42a20', metalness: 0, roughness: 0.22 });
  const brass = mat({ color: '#c79a52', metalness: 0.9, roughness: 0.3 });
  const amber = mat({ color: '#a9722f', metalness: 0.1, roughness: 0.4 });
  const steel = mat({ color: '#d4d6da', metalness: 1, roughness: 0.18 });
  const inkTube = mat({ color: '#241a1a', metalness: 0, roughness: 0.35 });
  const inkRed = mat({ color: '#cc2a22', metalness: 0, roughness: 0.3 });
  const clear = new MeshStandardMaterial({
    color: '#ffffff', metalness: 0, roughness: 0.06, transparent: true, opacity: 0.2,
    side: DoubleSide, depthWrite: false
  });
  const pen = new Group();
  const add = (geo, m, y, shadow = true) => {
    const e = new Mesh(geo, m); e.position.y = y; e.castShadow = shadow; pen.add(e); return e;
  };
  // the point: brass cone, the ball in its end, the amber nose
  const ball = add(new SphereGeometry(0.95, 16, 12), steel, 0.9);
  add(new CylinderGeometry(2.3, 0.9, 10, 24), brass, 5.6);
  add(new CylinderGeometry(3.5, 2.3, 14, 24), amber, 17);
  // inside the barrel: the ink tube, and the red plug at its top end
  add(new CylinderGeometry(1.6, 1.6, 100, 16), inkTube, 74);
  add(new CylinderGeometry(1.75, 1.75, 22, 16), inkRed, 118);
  // the barrel itself: clear, hexagonal, drawn last so the inside shows through
  const barrel = add(new CylinderGeometry(4.2, 4.2, 118, 6, 1, true), clear, 83, false);
  barrel.renderOrder = 2;
  // "BIC Cristal M" in red and plum along two of its faces
  {
    const c = document.createElement('canvas');
    c.width = 192; c.height = 1024;
    const g = c.getContext('2d');
    for (const face of [0, 3]) {
      g.save();
      g.translate(face * 32 + 16, 1000);
      g.rotate(-Math.PI / 2);
      g.textBaseline = 'middle';
      g.font = '700 21px Arial, Helvetica, sans-serif';
      g.fillStyle = '#c4261f';
      g.fillText('BIC', 0, 0);
      g.font = '700 19px Arial, Helvetica, sans-serif';
      g.fillStyle = '#7c1f4a';
      g.fillText('Cristal', 64, 0);
      g.fillStyle = '#4b1a3a';
      g.fillText('M', 160, 0);
      g.restore();
    }
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    const print = new Mesh(new CylinderGeometry(4.24, 4.24, 118, 6, 1, true),
      new MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    print.position.y = 83; print.renderOrder = 3;
    pen.add(print);
  }
  // the cap: a lathe, collar at the bottom rising to a rounded top
  {
    const prof = [[5.4, 0], [5.4, 3], [4.7, 3.4], [4.7, 6], [4.55, 26], [4.0, 31], [3.0, 33.4], [1.6, 34.6], [0, 35]]
      .map((p) => new Vector2(p[0], p[1]));
    const cap = new Mesh(new LatheGeometry(prof, 32), redGloss);
    cap.position.y = 127; cap.castShadow = true;
    pen.add(cap);
    const clip = new Mesh(new BoxGeometry(1.2, 22, 2.6), redGloss);
    clip.position.set(4.6, 147, 0); clip.castShadow = true;
    pen.add(clip);
  }
  return pen;
}

// A Paper Mate Flair, from the photograph: all one green, matte. A dark
// felt point in a short green cone; a collar; a long nose widening to the
// barrel; the barrel with "Paper♥Mate® FLAIR M" in silver; and the cap
// posted over the back third, a step wider than the barrel, tapering a
// little to a flat end, with a long silver clip that curls in at its foot.
// Felt pens are held more upright, and this one is in the left hand.
function flair() {
  // Measured off the photograph along the pen, corrected for its
  // perspective, tip to end out of 160: felt 0-6, cone to 13.6, collar to
  // 18, nose to 44.5, barrel to 89, cap to 160, clip 105-157. Radii in the
  // same units: cone 1.9-2.45, collar 3.4, nose 3.3-4.2, barrel 4.9, cap
  // 5.7 tapering to 4.7.
  // a saturated green plastic with a soft sheen, lit like the Bic
  const green = mat({ color: '#008a48', metalness: 0, roughness: 0.38 });
  const felt = mat({ color: '#063d1d', metalness: 0, roughness: 0.9 });
  const silver = mat({ color: '#e3e6ea', metalness: 0.95, roughness: 0.16 });
  const pen = new Group();
  // Turned from a profile. Split at every corner (a step, a shoulder) so
  // each face keeps its own normals: smoothed across a step, the barrel's
  // normals would tilt along the pen and it would light flat.
  const lathe = (prof, m) => {
    const runs = [[prof[0]]];
    for (let i = 1; i < prof.length; i++) {
      const run = runs[runs.length - 1];
      run.push(prof[i]);
      const a = prof[i - 1], b = prof[i], c = prof[i + 1];
      if (!c) break;
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      let d = Math.abs(t2 - t1); if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > 0.5) runs.push([b]);
    }
    for (const run of runs) {
      const e = new Mesh(new LatheGeometry(run.map((q) => new Vector2(q[0], q[1])), 40), m);
      e.castShadow = true; pen.add(e);
    }
  };
  lathe([[0, 0], [0.55, 0.2], [0.9, 1.2], [1.5, 6]], felt);
  lathe([[1.5, 6], [1.9, 6], [2.45, 13.4], [2.6, 13.6], [3.4, 13.6], [3.4, 17.9],
    [3.25, 18.1], [3.3, 20], [4.2, 44.3], [4.9, 44.5], [4.9, 89]], green);
  // the cap, posted over the back of the barrel
  lathe([[4.9, 89], [5.7, 89.2], [5.7, 135], [5.4, 146], [4.9, 155], [4.7, 159.6], [4.4, 160], [0, 160]], green);
  // the print, in silver along the barrel, from the nose toward the cap, on
  // the face toward the reader: about 2.6 tall, 51 to 87
  {
    const R = 4.93, H = 44.5, segs = 32;
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const g = c.getContext('2d');
    const around = c.width / (2 * Math.PI * R), along = c.height / H;  // px per unit
    g.save();
    // centred on the face at u = 1/12 (where the pen turns to the reader)
    g.translate(c.width / 12, c.height * (1 - (52 - 44.5) / H));
    g.rotate(-Math.PI / 2);
    g.scale(along / around, 1);
    g.textBaseline = 'middle';
    g.fillStyle = '#eef0f2';
    const runs = [
      ['Paper', 'italic 600 144px Georgia, "Times New Roman", serif', 0, 0],
      ['\u2665', '600 84px Arial, Helvetica, sans-serif', 4, 6],
      ['Mate', 'italic 600 144px Georgia, "Times New Roman", serif', 2, 0],
      ['\u00ae', '600 56px Arial, Helvetica, sans-serif', 6, -22],
      ['FLAIR', '700 128px Arial, Helvetica, sans-serif', 30, 0],
      ['M', '700 128px Arial, Helvetica, sans-serif', 44, 0]
    ];
    // set it, then squeeze it to 34 along the barrel
    const width = () => runs.reduce((x, [text, font, gap]) => { g.font = font; return x + gap + g.measureText(text).width; }, 0);
    g.scale(34 * around / width(), 1);
    let x = 0;
    for (const [text, font, gap, dy] of runs) {
      g.font = font; x += gap; g.fillText(text, x, dy); x += g.measureText(text).width;
    }
    g.restore();
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    const print = new Mesh(new CylinderGeometry(R, R, H, segs, 1, true),
      new MeshStandardMaterial({ map: tex, transparent: true, metalness: 0.6, roughness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    print.position.y = 44.5 + H / 2; print.renderOrder = 3;
    pen.add(print);
  }
  // the clip: a long silver bar standing off the cap, rising from its root
  // near the end, curling in at its foot
  {
    // a quarter turn from the print, on the side the letters stand toward
    const clip = new Group();
    clip.rotation.y = -Math.PI * 5 / 6 + 0.35;
    pen.add(clip);
    const add = (geo, x, y, s) => {
      const e = new Mesh(geo, silver); e.position.set(x, y, 0); if (s) e.scale.set(...s);
      e.castShadow = true; clip.add(e); return e;
    };
    add(new BoxGeometry(1.1, 47, 2.8), 7.0, 131);
    add(new BoxGeometry(1.8, 4, 2.6), 6.3, 155);
    add(new SphereGeometry(1.3, 12, 8), 6.3, 108.2, [1, 1.6, 1.15]);
  }
  return pen;
}

const KINDS = {
  // right hand: leaning up and to the right
  bic: { build: bic, lean: 57, az: 62, side: 1 },
  // left hand: leaning up and to the left, a felt pen held a little more upright
  flair: { build: flair, lean: 50, az: 118, side: -1 }
};

export function makePen(kind = 'bic') {
  const st = getStage();
  if (!st) return null;
  const { W, H } = st;
  const K = KINDS[kind] || KINDS.bic;
  const pen = K.build();
  const holder = new Group();
  holder.add(pen);
  st.scene.add(holder);

  const lean = MathUtils.degToRad(K.lean), az = MathUtils.degToRad(K.az);
  const dir = new Vector3(Math.sin(lean) * Math.cos(az), Math.sin(lean) * Math.sin(az), Math.cos(lean));
  const q0 = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
  // Turn the pen on its own axis until the printed face looks at the reader.
  let facing = 0;
  {
    const f = new Vector3(0.5, 0, 0.866);
    let best = -2;
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      const v = f.clone().applyAxisAngle(new Vector3(0, 1, 0), a).applyQuaternion(q0);
      if (v.z > best) { best = v.z; facing = a; }
    }
  }
  const SCALE = 0.95;
  const s = { x: -200, y: -200, z: 90, roll: 0, a: 0, busy: 0, want: 0, px: -200, py: -200, vx: 0, vy: 0 };

  // A hand is never still. The pen sways a little at rest and more while it
  // writes, the wrist turning as the letters form, and it leans into the way
  // the tip is going. Small: a few degrees of lean, a little more of turn.
  const tilt = new Vector3(), qNow = new Quaternion(), UP = new Vector3(0, 1, 0);
  let last = performance.now();
  function wrist() {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000), t = now / 1000;
    last = now;
    s.busy += (s.want - s.busy) * Math.min(1, dt * 5);
    // the tip's velocity, smoothed, in px/s
    const k = Math.min(1, dt * 8);
    s.vx += ((s.x - s.px) / Math.max(dt, 1e-3) - s.vx) * k;
    s.vy += ((s.y - s.py) / Math.max(dt, 1e-3) - s.vy) * k;
    s.px = s.x; s.py = s.y;
    const b = s.busy, deg = MathUtils.degToRad;
    const into = Math.max(-1, Math.min(1, s.vx / 400));
    const dl = deg((1.2 + 2.6 * b) * Math.sin(t * 1.7) + 1.6 * b * Math.sin(t * 8.3) - 3 * into);
    const da = deg((2.5 + 5 * b) * Math.sin(t * 1.1 + 1) + 3 * b * Math.sin(t * 6.1) + 4 * Math.max(-1, Math.min(1, s.vy / 400)));
    const l = lean + dl, z = az + da;
    tilt.set(Math.sin(l) * Math.cos(z), Math.sin(l) * Math.sin(z), Math.cos(l));
    return qNow.setFromUnitVectors(UP, tilt);
  }

  function place() {
    holder.quaternion.copy(wrist());
    pen.rotation.y = facing + s.roll;
    holder.scale.setScalar(SCALE);
    holder.position.set(s.x, -s.y, s.z);
    holder.visible = s.a > 0.01;
  }
  const self = { s, holder, place };
  st.pens.push(self);

  // A move in time: `at(k)` gives the tip's x, y, z at k in 0..1.
  async function move(ms, at, fade) {
    const t0 = performance.now();
    for (;;) {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
      const p = at(k);
      s.x = p[0]; s.y = p[1]; s.z = p[2];
      if (fade) s.a = fade(k);
      if (k >= 1) return;
      await frame();
    }
  }
  // off the page on its own hand's side
  const OFF = () => [K.side > 0 ? W() + 160 : -160, H() * 0.55, 140];
  s.x = OFF()[0]; s.y = OFF()[1]; s.z = 140; s.a = 0;

  const api = {
    // Lift off and glide to a point, arcing over the page.
    async glide(x, y, ms = 600) {
      s.want = 0.35;
      const x0 = s.x, y0 = s.y, z0 = s.z, hop = Math.min(46, 10 + Math.hypot(x - x0, y - y0) * 0.1);
      await move(ms, (k) => { const e = ease.inOut(k); return [x0 + (x - x0) * e, y0 + (y - y0) * e, z0 * (1 - e) + Math.sin(Math.PI * k) * hop]; });
    },
    // Come in from beyond its own edge, fading up as it arrives.
    async enter(x, y, ms = 900) {
      const a = OFF();
      s.x = a[0]; s.y = a[1]; s.z = a[2]; s.a = 0;
      await move(ms, (k) => { const e = ease.inOut(k); return [a[0] + (x - a[0]) * e, a[1] + (y - a[1]) * e, a[2] * (1 - e) + Math.sin(Math.PI * k) * 30]; },
        (k) => Math.min(1, k * 3));
    },
    // The tip on the page, following a polyline over `ms`, a little noise in the wrist.
    async stroke(pts, ms) {
      s.want = 1;
      const n = pts.length - 1, seed = Math.random() * 9;
      await move(ms, (k) => {
        const f = k * n, i = Math.min(n - 1, Math.floor(f)), r = f - i;
        s.roll = 0.5 * Math.sin(k * 7 + seed);
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r, 0];
      });
    },
    // The tip scribbling along a baseline while the margin note is written.
    async write(x0, y0, x1, ms) {
      s.want = 1;
      const seed = Math.random() * 9;
      await move(ms, (k) => [x0 + (x1 - x0) * k + Math.sin(k * 40 + seed) * 2, y0 + Math.sin(k * 23 + seed) * 3 + Math.sin(k * 95) * 1, 0]);
    },
    // Hover: glide to a point and stay a little above the page there, as a
    // hand does over a word it is weighing.
    async hover(x, y, ms = 500, z = 22) {
      s.want = 0.2;
      const x0 = s.x, y0 = s.y, z1 = s.z;
      await move(ms, (k) => { const e = ease.inOut(k); return [x0 + (x - x0) * e, y0 + (y - y0) * e, z1 + (z - z1) * e]; });
    },
    // Stay where it is for a while, the hand still breathing.
    async hold(ms) {
      s.want = 0.1;
      const x = s.x, y = s.y, z = s.z, seed = Math.random() * 9;
      await move(ms, (k) => [x + Math.sin(k * 3 + seed) * 1.5, y + Math.sin(k * 2.3 + seed) * 1.2, z + Math.sin(k * 4 + seed) * 2]);
    },
    // Drift: a slow, smooth pass just off the page along a curve through
    // `pts`, at `speed` px/s, easing in and out, the hand breathing a little
    // as it goes. How a reader's pen follows a line, or wanders down a page.
    async drift(pts, speed = 120, z = 20) {
      s.want = 0.15;
      const all = [[s.x, s.y], ...pts];
      if (all.length < 2) return;
      // a Catmull-Rom curve through the points, sampled finely
      const P = (i) => all[Math.max(0, Math.min(all.length - 1, i))], dense = [];
      for (let i = 0; i < all.length - 1; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        for (let k = 0; k < 12; k++) {
          const t = k / 12, t2 = t * t, t3 = t2 * t;
          const c = (a, b, c2, d) => 0.5 * ((2 * b) + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
          dense.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
        }
      }
      dense.push(all[all.length - 1]);
      const len = [0];
      for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
      const L = len[len.length - 1], z0 = s.z, seed = Math.random() * 9;
      let j = 1;
      await move(Math.max(200, L / speed * 1000), (k) => {
        const d = ease.inOut(k) * L;
        while (j < len.length - 1 && len[j] < d) j++;
        const f = (d - len[j - 1]) / Math.max(1e-6, len[j] - len[j - 1]);
        const a = dense[j - 1], b = dense[j];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(k * 9 + seed) * 1.2,
          z0 + (z - z0) * Math.min(1, k * 4) + Math.sin(k * 5 + seed) * 2];
      });
    },
    // Read along a line, held just off the page: from stop to stop (a word
    // at a time, as eyes go), with a short rest on each.
    async scan(stops, step = 150, rest = 200) {
      s.want = 0.25;
      for (const [x, y] of stops) {
        const x0 = s.x, y0 = s.y, z0 = s.z;
        await move(step, (k) => { const e = ease.inOut(k); return [x0 + (x - x0) * e, y0 + (y - y0) * e, z0 + (18 - z0) * e]; });
        await move(rest * (0.6 + Math.random() * 0.8), (k) => [x, y, 18 + Math.sin(k * 3) * 1.5]);
      }
    },
    // One letter, written: the tip on the page, moving across the letter's
    // width while it loops up and down through its height, a stroke or two,
    // as a hand forms a letter rather than sliding under it.
    async letter(x0, x1, y, h, ms) {
      s.want = 1;
      const loops = 1 + Math.floor(Math.random() * 2), seed = Math.random() * 6;
      await move(ms, (k) => [
        x0 + (x1 - x0) * k + Math.sin(k * Math.PI * 2 * loops + seed) * Math.min(3, (x1 - x0) * 0.3),
        y - h * 0.5 * (1 - Math.cos(k * Math.PI * 2 * loops)) + Math.sin(k * 13 + seed) * 0.6,
        0
      ]);
    },
    // Between words: off the page a moment and across to the next.
    async skip(x, y, ms) {
      s.want = 0.5;
      const x0 = s.x, y0 = s.y;
      await move(ms, (k) => { const e = ease.inOut(k); return [x0 + (x - x0) * e, y0 + (y - y0) * e, Math.sin(Math.PI * k) * 6]; });
    },
    // Hold the tip up a little, off the page.
    async lift(ms = 200) { const z0 = s.z, x = s.x, y = s.y; await move(ms, (k) => [x, y, z0 + 16 * ease.inOut(k)]); },
    async leave(ms = 800) {
      s.want = 0;
      const x0 = s.x, y0 = s.y, z0 = s.z, a = OFF();
      await move(ms, (k) => { const e = ease.inOut(k); return [x0 + (a[0] - x0) * e, y0 + (a[1] - y0) * e, z0 + (a[2] - z0) * e]; }, (k) => 1 - Math.max(0, (k - 0.4) / 0.6));
    },
    get tip() { return [s.x, s.y]; },
    // Where the pen's top end is on the screen, for a speech bubble to hang
    // from: its own hand's side, up from the tip.
    get top() {
      holder.updateMatrixWorld(true);
      const v = new Vector3(0, 150, 0).applyMatrix4(pen.matrixWorld).project(st.camera);
      return [(v.x + 1) / 2 * W(), (1 - v.y) / 2 * H()];
    },
    side: K.side,
    destroy() { leaveStage(self); }
  };
  return api;
}
