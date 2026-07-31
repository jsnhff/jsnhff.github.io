/**
 * Background texture shaders.
 *
 * Replaces the tiled background_static_small.png with a fullscreen WebGL
 * fragment shader. Three variants:
 *
 *   darkroom  — near-black paper with animated filmic grain and a soft vignette
 *   nightfield — drifting parallax dust motes over a faint nebular haze
 *   gallery   — a black wall lit by one soft key and a cool fill, under grain
 *   paper     — nightfield inverted onto white: fibre mottle, flecks, grain
 *
 * Pick one with any of these, in order of precedence:
 *   ?bg=nightfield&grain=0.5 in the URL   (handy for side-by-side comparison)
 *   data-variant / data-grain attributes on this file's script tag
 *   window.BG_VARIANT / window.BG_GRAIN   (set before this file loads)
 *
 * If WebGL is unavailable the script does nothing and the PNG stays put.
 */
(function () {
  'use strict';

  // Some pages end up with head.html in the output more than once (404.html
  // includes it itself and is then wrapped in a layout that renders the page
  // body twice). Each copy would execute this file again and open its own
  // WebGL context, so only the first one through does any work.
  if (window.BGShader) return;

  var VARIANTS = { darkroom: 0, nightfield: 1, gallery: 2, paper: 3 };
  var DEFAULT_VARIANT = 'darkroom';
  var DEFAULT_GRAIN = 1;

  var FPS = 30;          // filmic, and a third of the GPU work of 90fps
  var DPR_CAP = 1.5;     // grain is sized in CSS px, so more DPR only buys crispness

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',

    'uniform vec2  uRes;',      // logical size of the background, device px
    'uniform vec2  uViewport;', // size of the buffer actually being drawn
    'uniform vec2  uOrigin;',   // point of uRes at the centre of the viewport
    'uniform float uZoom;',     // >1 magnifies, for the loupe
    'uniform float uTime;',
    'uniform float uSeed;',
    'uniform float uDpr;',
    'uniform float uGrain;',
    'uniform float uMotes;',   // paper only: fleck strength
    'uniform float uMottle;',  // paper only: fibre mottle strength
    'uniform float uWarm;',    // paper only: how far off neutral the sheet sits

    'float h21(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',

    'float h31(vec3 p){',
    '  return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453123);',
    '}',

    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x),',
    '             mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',

    'float fbm(vec2 p){',
    '  float s = 0.0, a = 0.5;',
    '  for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }',
    '  return s;',
    '}',

    // Grain cells are quantised in CSS pixels, so the texture keeps the same
    // physical size on a retina display instead of dissolving into nothing.
    'float grain(vec2 fc, float cell, float seed){',
    '  return h31(vec3(floor(fc / (uDpr * cell)), seed));',
    '}',

    '#if VARIANT == 0',
    // Darkroom: a sheet of unexposed photographic paper.
    'vec3 render(vec2 fc, vec2 uv){',
    '  float base = 0.026 + 0.014 * (1.0 - uv.y);',
    '  vec2 c = uv - 0.5; c.x *= uRes.x / uRes.y;',
    '  base *= 1.0 - 0.42 * dot(c, c);',
    '  float g1 = grain(fc, 1.0, uSeed) - 0.5;',
    '  float g2 = grain(fc, 3.0, uSeed + 7.0) - 0.5;',
    '  float v = base + (g1 * 0.070 + g2 * 0.024) * uGrain;',
    '  return vec3(v) * vec3(0.970, 0.985, 1.0);',  // silver tone, barely cool
    '}',
    '#endif',

    // Sparse twinkling motes on a jittered grid. Shared by nightfield and its
    // light counterpart, paper.
    'float motes(vec2 p, float dens, float t, float sd){',
    '  vec2 g = p * dens;',
    '  vec2 id = floor(g);',
    '  vec2 f = fract(g) - 0.5;',
    '  float h = h21(id + sd);',
    '  float on = step(h, 0.20);',
    '  vec2 off = (vec2(h21(id + sd + 1.7), h21(id + sd + 3.1)) - 0.5) * 0.72;',
    '  float d = length(f - off);',
    '  float tw = 0.5 + 0.5 * sin(t * (0.35 + h * 1.4) + h * 57.0);',
    '  return on * smoothstep(0.055, 0.0, d) * (0.25 + h * 3.0) * (0.45 + 0.55 * tw);',
    '}',

    // Three parallax mote layers, drifting. Returns accumulated brightness.
    'float moteField(vec2 p, float t){',
    '  float s = 0.0;',
    '  s += motes(p + vec2(t * 0.0045, -t * 0.0016),  46.0, t,  0.0) * 0.55;',
    '  s += motes(p + vec2(t * 0.0090, -t * 0.0032),  78.0, t,  9.3) * 0.34;',
    '  s += motes(p + vec2(t * 0.0150, -t * 0.0054), 130.0, t, 21.7) * 0.20;',
    '  return s;',
    '}',

    '#if VARIANT == 1',
    // Night field: the current starfield, but continuous and with depth.
    'vec3 render(vec2 fc, vec2 uv){',
    '  float t = uTime;',
    '  vec2 p = vec2(uv.x * (uRes.x / uRes.y), uv.y);',
    '  float haze = fbm(p * 2.4 + vec2(t * 0.008, t * 0.004));',
    '  vec3 col = vec3(0.021, 0.023, 0.029)',
    '           + vec3(0.030, 0.034, 0.055) * pow(haze, 2.2) * 0.55;',
    '  col += vec3(0.92, 0.95, 1.0) * moteField(p, t);',
    '  col += (grain(fc, 1.0, uSeed) - 0.5) * 0.048 * uGrain;',
    '  return col;',
    '}',
    '#endif',

    '#if VARIANT == 2',
    // Gallery: the Editions lighting model on a black wall. One soft key up and
    // left, a cool fill opposite, falloff smooth enough that the grain is the
    // only thing giving the surface any tooth.
    'float lamp(vec2 p, vec2 c, vec2 r){',
    '  float d = length((p - c) / r);',
    '  return exp(-d * d * 1.15);',
    '}',
    'vec3 render(vec2 fc, vec2 uv){',
    '  float t = uTime * 0.05;',
    '  vec2 p = vec2((uv.x - 0.5) * (uRes.x / uRes.y), uv.y - 0.5);',
    // The wall drifts a hair so the light never sits in exactly one place.
    '  vec2 key  = vec2(-0.34 + 0.045 * sin(t * 0.7),  0.30 + 0.030 * cos(t * 0.5));',
    '  vec2 fill = vec2( 0.44 + 0.040 * cos(t * 0.4), -0.34 + 0.035 * sin(t * 0.6));',
    '  vec3 col = vec3(0.017, 0.017, 0.020);',
    '  col += vec3(0.42, 0.39, 0.35) * lamp(p, key,  vec2(0.90, 0.62)) * 0.135;',  // warm key
    '  col += vec3(0.16, 0.22, 0.34) * lamp(p, fill, vec2(0.78, 0.70)) * 0.085;',  // cool fill
    // A slow, very large-scale unevenness. Real walls are never a clean gradient.
    '  col *= 0.86 + 0.30 * fbm(p * 1.15 + vec2(t * 0.22, t * 0.11));',
    '  float g1 = grain(fc, 1.0, uSeed) - 0.5;',
    '  float g2 = grain(fc, 2.0, uSeed + 4.0) - 0.5;',
    '  col += (g1 * 0.052 + g2 * 0.020) * uGrain;',
    '  return col;',
    '}',
    '#endif',

    '#if VARIANT == 3',
    // Paper: nightfield inverted onto white. Same three ingredients — haze,
    // motes, grain — but subtracted from the sheet instead of added to the
    // void, and at roughly a fifth the amplitude. Dark specks on white read
    // far louder than bright specks on black, so the numbers cannot carry
    // over unchanged.
    'vec3 render(vec2 fc, vec2 uv){',
    '  float t = uTime;',
    '  vec2 p = vec2(uv.x * (uRes.x / uRes.y), uv.y);',
    '  vec3 col = vec3(1.0);',
    // Warmth works by taking more blue out than red, which is what leaves a
    // sheet reading cream rather than grey.
    '  float haze = fbm(p * 2.4 + vec2(t * 0.008, t * 0.004));',
    '  vec3 mottle = vec3(0.022 - 0.004 * uWarm, 0.022, 0.022 + 0.008 * uWarm);',
    '  col -= mottle * pow(haze, 2.2) * 0.9 * uMottle;',
    // Flecks in the pulp.
    '  vec3 fleck = vec3(0.145 - 0.010 * uWarm, 0.145, 0.145 + 0.015 * uWarm);',
    '  col -= fleck * moteField(p, t) * 0.17 * uMotes;',
    '  col -= (grain(fc, 1.0, uSeed) - 0.5) * 0.026 * uGrain;',
    '  return col;',
    '}',
    '#endif',

    'void main(){',
    '  vec2 fc = uOrigin + (gl_FragCoord.xy - 0.5 * uViewport) / uZoom;',
    '  gl_FragColor = vec4(render(fc, fc / uRes), 1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('bg-shader:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function build(gl, variantIndex) {
    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, '#define VARIANT ' + variantIndex + '\n' + FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('bg-shader:', gl.getProgramInfoLog(prog));
      return null;
    }

    // One oversized triangle covers the clip volume with no index buffer.
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var u = {};
    ['uRes', 'uViewport', 'uOrigin', 'uZoom', 'uTime', 'uSeed', 'uDpr', 'uGrain',
     'uMotes', 'uMottle', 'uWarm']
      .forEach(function (name) { u[name] = gl.getUniformLocation(prog, name); });

    return { program: prog, buffer: buf, uniforms: u };
  }

  function resolveVariant(script) {
    var q = /[?&]bg=([a-z]+)/i.exec(window.location.search);
    var name = (q && q[1]) ||
      (script && script.getAttribute('data-variant')) ||
      window.BG_VARIANT ||
      DEFAULT_VARIANT;
    name = String(name).toLowerCase();
    return VARIANTS.hasOwnProperty(name) ? name : DEFAULT_VARIANT;
  }

  function resolveGrain(script) {
    var q = /[?&]grain=([0-9.]+)/i.exec(window.location.search);
    var n = parseFloat((q && q[1]) ||
      (script && script.getAttribute('data-grain')) ||
      window.BG_GRAIN);
    return (isFinite(n) && n >= 0) ? n : DEFAULT_GRAIN;
  }

  /**
   * Mounts a shader background. Returns a controller, or null if WebGL is out.
   *
   * opts.canvas   — render into this canvas instead of a new fixed one
   * opts.variant  — variant name, overrides URL/attribute detection
   * opts.grain    — grain multiplier, default 1
   * opts.motes    — paper only: fleck strength, default 1
   * opts.mottle   — paper only: fibre mottle strength, default 1
   * opts.warm     — paper only: warmth off neutral, default 1
   * opts.zoom     — magnification, default 1 (the loupe uses 4)
   * opts.source   — controller whose size/time this one mirrors (for the loupe)
   */
  function mount(opts) {
    opts = opts || {};

    var canvas = opts.canvas;
    var owned = !canvas;
    if (owned) {
      canvas = document.createElement('canvas');
      canvas.className = 'bg-shader-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'z-index:-1;pointer-events:none;display:block;background:#050505';
    }

    var gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power'
    }) || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    var variant = opts.variant || resolveVariant(opts.script);
    var built = build(gl, VARIANTS[variant]);
    if (!built) return null;

    if (owned) document.body.appendChild(canvas);
    gl.useProgram(built.program);

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var ctl = {
      canvas: canvas,
      variant: variant,
      grain: opts.grain == null ? resolveGrain(opts.script) : opts.grain,
      motes: opts.motes == null ? 1 : opts.motes,
      mottle: opts.mottle == null ? 1 : opts.mottle,
      warm: opts.warm == null ? 1 : opts.warm,
      zoom: opts.zoom || 1,
      origin: null,          // null = centre of the field
      logical: [1, 1],       // uRes: the field the shader thinks it is filling
      viewport: [1, 1],
      dpr: 1,
      seed: 0,
      time: 0,
      running: false
    };

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctl.dpr = dpr;
      ctl.viewport = [w, h];
      // A loupe borrows the source's field so it magnifies the same pixels.
      ctl.logical = opts.source ? opts.source.logical : [w, h];
      gl.viewport(0, 0, w, h);
    }

    function draw() {
      var u = built.uniforms;
      gl.useProgram(built.program);
      gl.uniform2f(u.uRes, ctl.logical[0], ctl.logical[1]);
      gl.uniform2f(u.uViewport, ctl.viewport[0], ctl.viewport[1]);
      var o = ctl.origin || [ctl.logical[0] * 0.5, ctl.logical[1] * 0.5];
      gl.uniform2f(u.uOrigin, o[0], o[1]);
      gl.uniform1f(u.uZoom, ctl.zoom);
      gl.uniform1f(u.uTime, opts.source ? opts.source.time : ctl.time);
      gl.uniform1f(u.uSeed, opts.source ? opts.source.seed : ctl.seed);
      gl.uniform1f(u.uDpr, ctl.dpr);
      gl.uniform1f(u.uGrain, ctl.grain);
      gl.uniform1f(u.uMotes, ctl.motes);
      gl.uniform1f(u.uMottle, ctl.mottle);
      gl.uniform1f(u.uWarm, ctl.warm);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    ctl.resize = function () { resize(); draw(); };
    ctl.draw = draw;

    var raf = 0;
    var last = 0;
    var start = 0;
    var interval = 1000 / FPS;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < interval) return;
      last = now;
      if (!start) start = now;
      ctl.time = (now - start) / 1000;
      ctl.seed = (ctl.seed + 1) % 1024;
      draw();
    }

    ctl.play = function () {
      if (ctl.running || reduceMotion) return;
      ctl.running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    ctl.pause = function () {
      ctl.running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    ctl.destroy = function () {
      ctl.pause();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);

      gl.deleteProgram(built.program);
      gl.deleteBuffer(built.buffer);

      // Only tear the context down when this canvas was ours to begin with.
      // A borrowed canvas gets remounted (switching variants does exactly
      // that) and killing its context would leave nothing to draw into.
      if (owned) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    };

    var resizePending = false;
    function onResize() {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(function () { resizePending = false; ctl.resize(); });
    }

    function onVisibility() {
      if (document.hidden) ctl.pause();
      else ctl.play();
    }

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    draw();
    ctl.play();

    return ctl;
  }

  window.BGShader = { mount: mount, variants: Object.keys(VARIANTS) };

  // Auto-mount as the page background unless the host page opts out.
  var script = document.currentScript;
  if (!(script && script.hasAttribute('data-manual'))) {
    var boot = function () {
      var ctl = mount({ script: script });
      if (ctl) {
        window.BGShader.current = ctl;
        document.documentElement.classList.add('bg-shader-on');
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})();
