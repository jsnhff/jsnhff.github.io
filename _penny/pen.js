// The critic's pen, for act three of the home page. Built to /js/pen.js by
// `node _penny/build.mjs`; edit this file, not that one. Loaded by poem.js
// when the poem is finished, and only then.
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

const FOV = 16;
const LIGHT = { x: -260, y: 420, z: 900 };
const ease = { inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
const frame = () => new Promise((r) => requestAnimationFrame(r));

export function makePen() {
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
  const SPAN = 380;
  { const c = key.shadow.camera; c.left = -SPAN; c.right = SPAN; c.top = SPAN; c.bottom = -SPAN; c.near = 10; c.far = 3000; c.updateProjectionMatrix(); }
  const floorMat = new ShadowMaterial({ opacity: 0.2 });
  const fade = fadeShadow(floorMat);
  const floor = new Mesh(new PlaneGeometry(SPAN * 3, SPAN * 3), floorMat);
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
  }
  layout();
  window.addEventListener('resize', layout);

  // ---- the pen: a Bic Cristal, tip at the origin, length along +y ----------
  // A clear hexagonal barrel with the dark ink tube and its red plug showing
  // through, a brass point with a steel ball, and a red cap on the end with
  // its collar. About 160px from the ball to the top of the cap.
  const mat = (o) => new MeshStandardMaterial(o);
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
  const holder = new Group();
  holder.add(pen);
  scene.add(holder);

  // Leaned the way a right hand holds one: up and to the right, back to the reader.
  const lean = MathUtils.degToRad(57), az = MathUtils.degToRad(62);
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
  const s = { x: -200, y: -200, z: 90, roll: 0, a: 0 };

  function place() {
    holder.quaternion.copy(q0);
    pen.rotation.y = facing + s.roll;
    holder.scale.setScalar(SCALE);
    holder.position.set(s.x, -s.y, s.z);
    floor.position.set(s.x + 70, -s.y - 70, 0);
    key.target.position.copy(floor.position);
    key.position.set(floor.position.x + LIGHT.x, floor.position.y + LIGHT.y, LIGHT.z);
    fade.uC.value.set(s.x, -s.y);
    fade.uR.value.set(14 + s.z * 0.2, 150 + s.z * 0.6);
    // the shadow thins as the pen lifts, and goes with it when it leaves
    floor.material.opacity = 0.2 * s.a * (1 - 0.6 * Math.min(1, s.z / 120));
    holder.visible = s.a > 0.01;
    renderer.render(scene, camera);
  }
  let alive = true;
  (function loop() { if (!alive) return; place(); requestAnimationFrame(loop); })();

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
  const OFF = () => [W() + 160, H() * 0.55, 140];
  s.x = OFF()[0]; s.y = OFF()[1]; s.z = 140; s.a = 0;

  const api = {
    // Lift off and glide to a point, arcing over the page.
    async glide(x, y, ms = 600) {
      const x0 = s.x, y0 = s.y, z0 = s.z, hop = Math.min(46, 10 + Math.hypot(x - x0, y - y0) * 0.1);
      await move(ms, (k) => { const e = ease.inOut(k); return [x0 + (x - x0) * e, y0 + (y - y0) * e, z0 * (1 - e) + Math.sin(Math.PI * k) * hop]; });
    },
    // Come in from beyond the right edge, fading up as it arrives.
    async enter(x, y, ms = 900) {
      const a = OFF();
      s.x = a[0]; s.y = a[1]; s.z = a[2]; s.a = 0;
      await move(ms, (k) => { const e = ease.inOut(k); return [a[0] + (x - a[0]) * e, a[1] + (y - a[1]) * e, a[2] * (1 - e) + Math.sin(Math.PI * k) * 30]; },
        (k) => Math.min(1, k * 3));
    },
    // The tip on the page, following a polyline over `ms`, a little noise in the wrist.
    async stroke(pts, ms) {
      const n = pts.length - 1, seed = Math.random() * 9;
      await move(ms, (k) => {
        const f = k * n, i = Math.min(n - 1, Math.floor(f)), r = f - i;
        s.roll = 0.5 * Math.sin(k * 7 + seed);
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r, 0];
      });
    },
    // The tip scribbling along a baseline while the margin note is written.
    async write(x0, y0, x1, ms) {
      const seed = Math.random() * 9;
      await move(ms, (k) => [x0 + (x1 - x0) * k + Math.sin(k * 40 + seed) * 2, y0 + Math.sin(k * 23 + seed) * 3 + Math.sin(k * 95) * 1, 0]);
    },
    // Hold the tip up a little, off the page.
    async lift(ms = 200) { const z0 = s.z, x = s.x, y = s.y; await move(ms, (k) => [x, y, z0 + 16 * ease.inOut(k)]); },
    async leave(ms = 800) {
      const x0 = s.x, y0 = s.y, z0 = s.z, a = OFF();
      await move(ms, (k) => { const e = ease.inOut(k); return [x0 + (a[0] - x0) * e, y0 + (a[1] - y0) * e, z0 + (a[2] - z0) * e]; }, (k) => 1 - Math.max(0, (k - 0.4) / 0.6));
    },
    get tip() { return [s.x, s.y]; },
    destroy() {
      alive = false;
      window.removeEventListener('resize', layout);
      renderer.dispose();
      cvs.remove();
    }
  };
  return api;
}
