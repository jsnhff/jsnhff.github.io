import {
  B as $e,
  C as we,
  D as et,
  a as Q,
  c as je,
  d as Ye,
  e as Z,
  f as qe,
  g as he,
  h as Ne,
  j as _,
  k as Ue,
  l as G,
  m as He,
  n as Re,
  o as Ve,
  p as Je,
  q as Ke,
  r as Qe,
  s as me,
  u as Ze,
  v as _e,
  z as T,
} from "./three-MD272M3B.js";
var m = Math.PI;

// ---- the leaves -----------------------------------------------------------
// The page block, as the regender.xyz store draws it (snippets/
// regender-o11-book3d.liquid). Each leaf is its own line of slightly uneven
// paper white with a hairline of shade where it meets the next, so at reading
// distance the edge resolves as fine grain rather than as wide stripes. The
// texture's mipmaps do the averaging as the book gets small, so a thin zine
// and a thick novel are drawn the same way. The store counts leaves from the
// page count; a book here carries its depth instead, so the count comes from
// the Regender book's own ratio (586 pages at 0.3236 of the width).
// Canvases are made once per count and shared; each book gets its own
// texture on them.
var leafCanvases = {};

function rand(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function paint(g, x, y, w, h, t) {
  // t in 0..1: 0 is the shade between leaves, 1 the brightest paper
  let r = Math.round(214 + 34 * t),
    gg = Math.round(206 + 33 * t),
    b = Math.round(186 + 32 * t);
  g.fillStyle = "rgb(" + r + "," + gg + "," + b + ")";
  g.fillRect(x, y, w, h);
}

// along "u" lays the leaves across the texture's width (the fore edge), "v"
// down its height (head and tail). spineShade darkens the side of the other
// axis that meets the spine.
function leafCanvas(pages, along, spineShade) {
  let key = pages + along;
  if (leafCanvases[key]) return leafCanvases[key];
  let leaves = Math.max(40, Math.round(pages / 2)),
    N = 2048,
    M = spineShade ? 256 : 8,
    c = document.createElement("canvas");
  c.width = along === "u" ? N : M;
  c.height = along === "u" ? M : N;
  let g = c.getContext("2d"),
    rnd = rand(pages * 7919 + (along === "u" ? 1 : 2)),
    step = N / leaves,
    pos = 0;
  for (let i = 0; i < leaves; i++) {
    let a = Math.round(pos),
      z = Math.round(pos + step),
      tone = 0.72 + rnd() * 0.24; // uneven paper
    if (rnd() < 0.06) tone -= 0.12; // the odd darker leaf
    let gap = Math.max(1, Math.round(step * 0.22));
    if (along === "u") {
      paint(g, a, 0, z - a, M, tone);
      paint(g, z - gap, 0, gap, M, 0.25 + rnd() * 0.2);
    } else {
      paint(g, 0, a, M, z - a, tone);
      paint(g, 0, z - gap, M, gap, 0.25 + rnd() * 0.2);
    }
    pos += step;
  }
  // the leaves bunch and shade where they meet the boards
  let edge = g.createLinearGradient(0, 0, along === "u" ? N : 0, along === "u" ? 0 : N);
  edge.addColorStop(0, "rgba(60,50,35,0.30)");
  edge.addColorStop(0.06, "rgba(60,50,35,0)");
  edge.addColorStop(0.94, "rgba(60,50,35,0)");
  edge.addColorStop(1, "rgba(60,50,35,0.30)");
  g.fillStyle = edge;
  g.fillRect(0, 0, c.width, c.height);
  // head and tail: a soft fall toward the spine, where the glue and the fold
  // pull the pages tight and the light can't reach
  if (spineShade) {
    let s = g.createLinearGradient(0, 0, along === "u" ? 0 : M, along === "u" ? M : 0);
    s.addColorStop(0, "rgba(40,32,22,0.42)");
    s.addColorStop(0.28, "rgba(40,32,22,0.10)");
    s.addColorStop(0.6, "rgba(40,32,22,0)");
    g.fillStyle = s;
    g.fillRect(0, 0, c.width, c.height);
  }
  return (leafCanvases[key] = c);
}

function tt(pages, along, spineShade, an) {
  let t = new Ze(leafCanvas(pages, along, spineShade));
  t.colorSpace = Z;
  t.anisotropy = an;
  return t;
}
function pt(n, a, t) {
  let s = [],
    d = 0;
  function u(c, l, h, i) {
    if (s.length) {
      let x = s[s.length - 1];
      d += Math.hypot(c - x.x, l - x.z);
    }
    s.push({ x: c, z: l, nx: h, nz: i, l: d });
  }
  let w = n / 2,
    r = a / 2,
    p = 10;
  u(w, -r, 0, -1), u(-w + t, -r, 0, -1);
  for (let c = 1; c <= p; c++) {
    let l = -m / 2 - (c / p) * (m / 2);
    u(
      -w + t + t * Math.cos(l),
      -r + t + t * Math.sin(l),
      Math.cos(l),
      Math.sin(l),
    );
  }
  u(-w, r - t, -1, 0);
  for (let c = 1; c <= p; c++) {
    let l = m + (c / p) * (m / 2);
    u(
      -w + t + t * Math.cos(l),
      r - t - t * Math.sin(l),
      Math.cos(l),
      -Math.sin(l),
    );
  }
  return u(w, r, 0, 1), { pts: s, len: d };
}
function ht(n, a, t, s) {
  let { pts: d, len: u } = pt(n, t, s),
    w = a / 2,
    r = [],
    p = [],
    c = [],
    l = [];
  for (let i of d) {
    let x = i.l / u;
    r.push(i.x, -w, i.z, i.x, w, i.z),
      p.push(i.nx, 0, i.nz, i.nx, 0, i.nz),
      c.push(x, 0, x, 1);
  }
  for (let i = 0; i < d.length - 1; i++) {
    let x = i * 2,
      A = x + 1,
      F = x + 2,
      M = x + 3;
    l.push(x, F, A, A, F, M);
  }
  let h = new Ue();
  return (
    h.setAttribute("position", new _(r, 3)),
    h.setAttribute("normal", new _(p, 3)),
    h.setAttribute("uv", new _(c, 2)),
    h.setIndex(l),
    h
  );
}
function mt(n) {
  let a = new me();
  a.background = new he(789518);
  function t(u, w, r, p, c, l) {
    let h = new G(new Ve(u, w), new Ne({ color: new he(l, l, l), side: Q }));
    h.position.set(r, p, c), h.lookAt(0, 0, 0), a.add(h);
  }
  t(16, 4, 0, 9, 0, 9),
    t(3, 15, -9, 0, 3, 6),
    t(3, 15, 9, 1, -3, 5),
    t(12, 12, 0, 0, 10, 0.42),
    t(8, 3, 0, -8, 1, 0.7);
  let s = new Je(n),
    d = s.fromScene(a, 0.02).texture;
  return s.dispose(), d;
}
function wt(n) {
  let a = 2166136261;
  for (let t of String(n || ""))
    (a ^= t.charCodeAt(0)), (a = Math.imul(a, 16777619));
  return function () {
    a += 1831565813;
    let t = a;
    return (
      (t = Math.imul(t ^ (t >>> 15), t | 1)),
      (t ^= t + Math.imul(t ^ (t >>> 7), t | 61)),
      ((t ^ (t >>> 14)) >>> 0) / 4294967296
    );
  };
}
function nt(n, a, t) {
  return n.loadAsync(a).then((s) => ((s.colorSpace = t), s));
}
function xt(n) {
  let a = n.el,
    t = 1,
    s = n.h,
    d = n.d,
    u = Math.min(0.004, d * 0.3),
    w = Math.max(1, Math.max(s, t) / 1.617),
    r;
  try {
    r = new Qe({ antialias: !0, alpha: !0 });
  } catch (i) {
    return Promise.reject(i);
  }
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2)),
    (r.outputColorSpace = Z);
  let p = new me(),
    c = new Re(24, 1, 0.1, 100);
  c.position.set(0, 0, 5.3 * w);
  let l = new $e();
  l.setCrossOrigin("anonymous");
  let h = [nt(l, n.wrap, Z)];
  return (
    n.foil && h.push(nt(l, n.foil, Ye)),
    Promise.all(h)
      .then(function (i) {
        let x = i[0],
          A = i[1],
          F = r.capabilities.getMaxAnisotropy();
        i.forEach((e) => {
          e.anisotropy = F;
        });
        let M = new Ke();
        p.add(M);
        // the store's card: a little more sheen than the old 0.9
        let Me = new T({ map: x, roughness: 0.74, metalness: 0, side: Q }),
          xe = ht(t, s, d, u);
        M.add(new G(xe, Me));
        let j = A || n.staples ? mt(r) : null,
          Y = null;
        A &&
          ((Y = new T({
            color: 13817306,
            metalness: 1,
            roughness: 0.3,
            side: Q,
            alphaMap: A,
            transparent: !0,
            depthWrite: !1,
            polygonOffset: !0,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            envMap: j,
            envMapIntensity: 1,
          })),
          M.add(new G(xe, Y)));
        let q = null,
          $ = null;
        if (n.staples) {
          (q = new T({
            color: 14672614,
            metalness: 1,
            roughness: 0.24,
            envMap: j,
            envMapIntensity: 1.15,
          })),
            ($ = new _e(0.0032, 0.0032, 0.12, 10));
          let e = n.staples,
            f = -t / 2 - 0.0016;
          for (let g = 0; g < e; g++) {
            let y = new G($, q);
            y.position.set(f, s * (e === 1 ? 0 : (g / (e - 1) - 0.5) * 0.5), 0),
              M.add(y);
          }
        }
        let pages = Math.max(1, Math.round((586 * d) / 0.3236)),
          an = Math.min(8, F),
          te = tt(pages, "u", !1, an),
          ne = tt(pages, "v", !0, an),
          oe = new T({ color: 16777215, roughness: 0.95 }),
          se = (e) => new T({ map: e, roughness: 0.95 }),
          ot = new G(new He(t * 0.998, s * 0.998, d * 0.985), [
            se(te),
            oe,
            se(ne),
            se(ne),
            oe,
            oe,
          ]);
        M.add(ot), p.add(new et(16777215, 0.42 * m));
        // the store's key: one soft light from above and to the left that
        // lands a face turned to it at about its own colour
        let ye = new we(16777215, 0.8 * m);
        ye.position.set(-3.2, 5.2, 4.4), p.add(ye);
        let be = new we(12570854, 0.18 * m);
        be.position.set(3.6, -1.4, -3), p.add(be);
        let re = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // Arriving (n.enter), as on regender.xyz, after the Twombly motion
        // study: the book starts tipped back 20 degrees and stands up into
        // place while the page fades, lifts and focuses its stage (CSS, keyed
        // to classes site.js sets). The lean is turned in the scene, so the
        // book itself tips rather than the picture of it. It holds the lean
        // until arrive(delay); with reduced motion it is simply there.
        let LEAN = 0.35,
          entering = !!n.enter && !re,
          leanStart = 0;
        function lean() {
          if (!entering) return 0;
          if (!leanStart) return LEAN;
          let q = (performance.now() - leanStart) / 1e3;
          if (q <= 0) return LEAN;
          if (q >= 1) return (entering = !1), 0;
          return LEAN * Math.pow(2, -10 * q);
        }
        let
          W = wt(n.seed),
          st = n.period || 44 + W() * 48,
          ve = re ? 0 : n.sway === void 0 ? 0.22 + W() * 0.26 : n.sway,
          ie = (2 * m) / st,
          rt = W() * 2 * m,
          it = W() * 2 * m,
          at = W() * 2 * m,
          ct = -0.1,
          X = 0,
          b = n.ry || 0,
          E = 0,
          P = b,
          I = 0,
          v = 0,
          L = 0,
          D = 0,
          Le = (e) => e - Math.round(e / (2 * m)) * 2 * m,
          Se = () => {
            let e = Math.min(1, X / 6);
            return e * e * (3 - 2 * e);
          },
          Ee = () =>
            ve *
            Se() *
            (0.82 * Math.sin(ie * X + rt) + 0.18 * Math.sin(ie * 1.9 * X + it)),
          lt = () => (re ? 0 : 0.03 * Se() * Math.sin(ie * 0.7 * X + at)),
          Ce = () => ct * (1 - Math.pow(1 - D, 3)) + lt(),
          z = !1,
          N = 0,
          Ae = !0,
          C = !0,
          Pe = !1,
          ae = 0,
          ce = !n.hold,
          le = 0,
          U = 0,
          H = 0,
          Ie = 0,
          ze = 0,
          S = r.domElement,
          o = n.pointerEl || S,
          de = n.drag !== !1;
        (S.style.cssText =
          "width:100%;height:100%;display:block;pointer-events:none"),
          de &&
            ((o.style.touchAction = "pan-y"),
            (o.style.userSelect = o.style.webkitUserSelect = "none"),
            (o.draggable = !1)),
          a.appendChild(S);
        function ke() {
          let e = a.clientWidth || 1,
            f = a.clientHeight || 1;
          (c.aspect = e / f),
            c.updateProjectionMatrix(),
            r.setSize(e, f, !1),
            (C = !0);
        }
        let O = new qe(),
          dt = Math.tan((12 * m) / 180);
        function fe() {
          (M.position.x = 0),
            (M.rotation.y = P),
            (M.rotation.x = I - lean()),
            M.updateMatrixWorld(!0);
          let e = 1 / 0,
            f = -1 / 0;
          for (let g of [-t / 2, t / 2])
            for (let y of [-s / 2, s / 2])
              for (let J of [-d / 2, d / 2])
                O.set(g, y, J).applyMatrix4(M.matrixWorld).project(c),
                  O.x < e && (e = O.x),
                  O.x > f && (f = O.x);
          (M.position.x = -((e + f) / 2) * dt * c.position.z * c.aspect),
            r.render(p, c),
            (C = !1);
        }
        let k = 0,
          B = !1,
          Ge = 8;
        function Te(e) {
          e.preventDefault();
        }
        function We(e) {
          (ce = !0),
            (z = !0),
            (B = !1),
            (U = e.clientX),
            (H = e.clientY),
            (Ie = P),
            (ze = I),
            (v = 0),
            (L = 0),
            (le = e.timeStamp || performance.now()),
            o.classList.add("is-grabbed");
          try {
            o.setPointerCapture(e.pointerId);
          } catch {}
        }
        function Xe(e) {
          if (!(e.pointerType === "mouse" && e.button !== 0)) {
            if (
              ((k = 0), (o.dataset.dragged = ""), e.pointerType === "touch")
            ) {
              (B = !0), (U = e.clientX), (H = e.clientY);
              return;
            }
            We(e);
          }
        }
        function De(e) {
          if (B) {
            let ue = Math.abs(e.clientX - U),
              pe = Math.abs(e.clientY - H);
            if (pe > Ge && pe >= ue) {
              B = !1;
              return;
            }
            ue > Ge && ue > pe * 1.2 && (We(e), (k = 6));
            return;
          }
          if (!z) return;
          let f = e.clientX - U,
            g = e.clientY - H;
          if (((k = Math.max(k, Math.abs(f) + Math.abs(g))), k < 6)) return;
          let y = Ie + f * 0.009,
            J = ze + g * 0.006,
            Fe = e.timeStamp || performance.now(),
            K = (Fe - le) / 1e3;
          K > 0.001 &&
            K < 0.2 &&
            ((v = v * 0.6 + ((y - P) / K) * 0.4),
            (L = L * 0.6 + ((J - I) / K) * 0.4)),
            (le = Fe),
            (P = y),
            (I = J),
            (C = !0);
        }
        function R(e) {
          if (((B = !1), !!z)) {
            (z = !1),
              o.classList.remove("is-grabbed"),
              e.type === "pointercancel" && ((v = 0), (L = 0)),
              k >= 6 &&
                ((o.dataset.dragged = "1"),
                setTimeout(() => {
                  o.dataset.dragged = "";
                }, 400));
            try {
              o.releasePointerCapture(e.pointerId);
            } catch {}
          }
        }
        function ft(e) {
          e.preventDefault(), n.onLost && n.onLost();
        }
        function ut() {
          C = !0;
        }
        de &&
          (o.addEventListener("pointerdown", Xe),
          o.addEventListener("pointermove", De),
          o.addEventListener("pointerup", R),
          o.addEventListener("pointercancel", R),
          o.addEventListener("dragstart", Te)),
          S.addEventListener("webglcontextlost", ft),
          S.addEventListener("webglcontextrestored", ut);
        let V = null;
        window.IntersectionObserver &&
          ((V = new IntersectionObserver(
            (e) => {
              Ae = e[0].isIntersecting;
            },
            { rootMargin: "150px" },
          )),
          V.observe(a));
        let Oe = () => ke();
        window.addEventListener("resize", Oe), ke();
        function Be(e) {
          if (Pe) return;
          if (((ae = requestAnimationFrame(Be)), !N)) {
            N = e;
            return;
          }
          let f = Math.min((e - N) / 1e3, 0.1);
          if (((N = e), !!Ae)) {
            entering && (C = !0);
            if (!ce) {
              C && fe();
              return;
            }
            if (((X += f), !re && D < 1 && (D = Math.min(1, D + f / 1.4)), z))
              (b = Le(P - Ee())), (E = I - Ce());
            else {
              (b += v * f), (E += L * f);
              let g = Math.pow(0.22, f);
              (v *= g),
                (L *= g),
                Math.abs(v) < 0.001 && (v = 0),
                Math.abs(L) < 0.001 && (L = 0);
              let y = Math.exp(-f * 0.75);
              (b = Le(b) * y),
                (E *= y),
                Math.abs(b) < 5e-4 && (b = 0),
                Math.abs(E) < 5e-4 && (E = 0),
                (P = Ee() + b),
                (I = Ce() + E);
            }
            (ve || D < 1 || b || E || v || L || z) && (C = !0), C && fe();
          }
        }
        return (
          fe(),
          (ae = requestAnimationFrame(Be)),
          {
            start() {
              ce = !0;
            },
            arrive(delay) {
              if (!entering || leanStart) return;
              leanStart = performance.now() + (delay === void 0 ? 120 : delay);
              C = !0;
            },
            destroy() {
              (Pe = !0),
                cancelAnimationFrame(ae),
                window.removeEventListener("resize", Oe),
                o.removeEventListener("pointerdown", Xe),
                o.removeEventListener("pointermove", De),
                o.removeEventListener("pointerup", R),
                o.removeEventListener("pointercancel", R),
                o.removeEventListener("dragstart", Te),
                o.classList.remove("is-grabbed"),
                de &&
                  ((o.style.touchAction = ""),
                  (o.style.userSelect = o.style.webkitUserSelect = "")),
                V && V.disconnect(),
                i.forEach((e) => e.dispose()),
                te && (te.dispose(), ne.dispose()),
                j && j.dispose(),
                Y && Y.dispose(),
                q && (q.dispose(), $.dispose()),
                Me.dispose(),
                r.dispose(),
                r.forceContextLoss && r.forceContextLoss(),
                S.parentNode && S.parentNode.removeChild(S);
            },
          }
        );
      })
      .catch(function (i) {
        throw (r.dispose(), i);
      })
  );
}
export { xt as build };
