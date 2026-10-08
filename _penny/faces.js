// Coin faces, drawn rather than photographed: a height map of the relief
// (rim, lettering, the shield), and from it the colour, the surface normals
// and the roughness. Raised metal is brighter and smoother, as worn copper
// is; the field is a shade darker and duller, toned in the recesses.
//
// The obverse carries its lettering but not the portrait. That wants a real
// coin: a straight-down photo becomes the height map in place of this one.

import { CanvasTexture, RepeatWrapping } from 'three';

const FONT = '"Areal", Arial, sans-serif';

export function faceTextures(side, N) {
  const h = document.createElement('canvas');
  h.width = h.height = N;
  const g = h.getContext('2d', { willReadFrequently: true });
  const c = N / 2;
  const R = c * 0.995;

  // field
  g.fillStyle = 'rgb(90,90,90)';
  g.fillRect(0, 0, N, N);
  // rim: a raised band with a bevel falling to the field
  const rimIn = R * 0.885;
  const bevel = g.createRadialGradient(c, c, rimIn * 0.965, c, c, rimIn);
  bevel.addColorStop(0, 'rgb(90,90,90)');
  bevel.addColorStop(1, 'rgb(235,235,235)');
  g.fillStyle = bevel;
  ring(g, c, rimIn * 0.965, R);
  g.fillStyle = 'rgb(235,235,235)';
  ring(g, c, rimIn, R * 0.985);
  // a soft fall-off at the very edge
  const lip = g.createRadialGradient(c, c, R * 0.985, c, c, R);
  lip.addColorStop(0, 'rgb(235,235,235)');
  lip.addColorStop(1, 'rgb(150,150,150)');
  g.fillStyle = lip;
  ring(g, c, R * 0.985, R);

  g.fillStyle = 'rgb(225,225,225)';
  if (side === 'obverse') {
    arc(g, 'IN GOD WE TRUST', c, R * 0.76, -Math.PI / 2, N * 0.07, 0.12);
    g.font = `700 ${N * 0.062}px ${FONT}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('LIBERTY', c - R * 0.52, c + R * 0.12);
    g.fillText('2025', c + R * 0.5, c + R * 0.42);
  } else {
    arc(g, 'UNITED STATES OF AMERICA', c, R * 0.77, -Math.PI / 2, N * 0.058, 0.1);
    shield(g, c, R, N);
  }

  blur(g, N, Math.max(1, Math.round(N / 512)));
  const H = g.getImageData(0, 0, N, N).data;

  // colour, normal and roughness from the one height map
  const col = mk(N), nor = mk(N), rou = mk(N);
  const C = col.g.createImageData(N, N), Nn = nor.g.createImageData(N, N), Ro = rou.g.createImageData(N, N);
  const strength = 2.4 * (N / 1024);
  const at = (x, y) => H[((Math.min(N - 1, Math.max(0, y)) * N) + Math.min(N - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      const v = at(x, y);
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength * 8;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength * 8;
      const len = Math.hypot(dx, dy, 1);
      Nn.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      Nn.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      Nn.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      Nn.data[i + 3] = 255;

      const r = Math.hypot(x - c, y - c) / R;
      const grain = hash(x, y) * 0.06 - 0.03;
      const tone = 0.8 + v * 0.3 - Math.max(0, r - 0.6) * 0.12 + grain;
      C.data[i] = clamp(194 * tone);
      C.data[i + 1] = clamp(122 * tone);
      C.data[i + 2] = clamp(79 * tone * 0.97);
      C.data[i + 3] = 255;

      const ro = 0.46 - v * 0.24 + hash(y, x) * 0.08;
      Ro.data[i] = Ro.data[i + 1] = Ro.data[i + 2] = clamp(ro * 255);
      Ro.data[i + 3] = 255;
    }
  }
  col.g.putImageData(C, 0, 0); nor.g.putImageData(Nn, 0, 0); rou.g.putImageData(Ro, 0, 0);

  const tex = (cv) => { const t = new CanvasTexture(cv); t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 4; return t; };
  return { map: tex(col.c), normal: tex(nor.c), rough: tex(rou.c) };
}

function mk(N) { const c = document.createElement('canvas'); c.width = c.height = N; return { c, g: c.getContext('2d') }; }
function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
function hash(x, y) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }

function ring(g, c, r0, r1) {
  g.beginPath(); g.arc(c, c, r1, 0, Math.PI * 2); g.arc(c, c, r0, 0, Math.PI * 2, true); g.fill();
}

// Letters set round a circle, centred on `mid`, reading clockwise, each
// placed by its own measured width plus `track` (a fraction of the size).
function arc(g, text, c, r, mid, size, track) {
  g.save();
  g.font = `700 ${size}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ws = [...text].map((ch) => g.measureText(ch).width + size * track);
  const total = ws.reduce((a, b) => a + b, 0) - size * track;
  let a = mid - total / r / 2;
  [...text].forEach((ch, i) => {
    const w = ws[i];
    const m = a + (w - size * track) / r / 2;
    g.save();
    g.translate(c + Math.cos(m) * r, c + Math.sin(m) * r);
    g.rotate(m + Math.PI / 2);
    g.fillText(ch, 0, 0);
    g.restore();
    a += w / r;
  });
  g.restore();
}

// The union shield of the 2010 reverse: a chief across the top, thirteen
// stripes below it narrowing to a point, a scroll across with ONE CENT.
function shield(g, c, R, N) {
  const w = R * 0.86, top = c - R * 0.46, chief = R * 0.2, bottom = c + R * 0.56;
  const path = () => {
    g.beginPath();
    g.moveTo(c - w / 2, top);
    g.lineTo(c + w / 2, top);
    g.lineTo(c + w / 2, top + R * 0.5);
    g.quadraticCurveTo(c + w / 2, bottom - R * 0.18, c, bottom);
    g.quadraticCurveTo(c - w / 2, bottom - R * 0.18, c - w / 2, top + R * 0.5);
    g.closePath();
  };
  g.save();
  g.fillStyle = 'rgb(170,170,170)'; path(); g.fill();
  g.clip();
  g.fillStyle = 'rgb(215,215,215)';
  g.fillRect(c - w / 2, top, w, chief);
  const n = 13, sw = w / n;
  for (let i = 0; i < n; i += 2) g.fillRect(c - w / 2 + i * sw, top + chief, sw, bottom - top);
  g.restore();
  g.lineWidth = N * 0.006; g.strokeStyle = 'rgb(235,235,235)'; path(); g.stroke();
  g.fillStyle = 'rgb(120,120,120)';
  g.font = `700 ${N * 0.032}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('E PLURIBUS UNUM', c, top + chief / 2);
  // scroll
  const sy = c + R * 0.08, sh = R * 0.2;
  g.fillStyle = 'rgb(230,230,230)';
  g.beginPath();
  g.moveTo(c - R * 0.66, sy - sh * 0.6);
  g.quadraticCurveTo(c, sy - sh * 0.9, c + R * 0.66, sy - sh * 0.6);
  g.lineTo(c + R * 0.62, sy + sh * 0.5);
  g.quadraticCurveTo(c, sy + sh * 0.2, c - R * 0.62, sy + sh * 0.5);
  g.closePath(); g.fill();
  g.fillStyle = 'rgb(130,130,130)';
  g.font = `700 ${N * 0.07}px ${FONT}`;
  g.fillText('ONE CENT', c, sy - sh * 0.05);
}

// Box blur, three passes: a bevel on every raised edge, so the normals turn
// over rounded shoulders instead of cliffs.
function blur(g, N, r) {
  const img = g.getImageData(0, 0, N, N), d = img.data, tmp = new Float32Array(N * N);
  const src = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) src[i] = d[i * 4];
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < N; y++) {
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += src[y * N + Math.min(N - 1, Math.max(0, x))];
      for (let x = 0; x < N; x++) {
        tmp[y * N + x] = acc / (2 * r + 1);
        acc += src[y * N + Math.min(N - 1, x + r + 1)] - src[y * N + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < N; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(N - 1, Math.max(0, y)) * N + x];
      for (let y = 0; y < N; y++) {
        src[y * N + x] = acc / (2 * r + 1);
        acc += tmp[Math.min(N - 1, y + r + 1) * N + x] - tmp[Math.max(0, y - r) * N + x];
      }
    }
  }
  for (let i = 0; i < N * N; i++) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = src[i];
  g.putImageData(img, 0, 0);
}
