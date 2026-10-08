/**
 * jason-huff.com
 *
 * Real pages, not a single-page app: every view has its own URL and renders
 * without JavaScript. This file adds the things that only make sense once the
 * page is live —
 *
 *   the two shader grounds, cross-faded by ground colour
 *   rows rolling in as they reach the fold
 *   a selected chip in the nav that travels between items
 *   projects opening in a sheet over the wall, with the URL kept honest
 *   the scratch plate on the home page
 *   a last-two-words bind so no paragraph ends on an orphan
 *
 * Nothing here is load-bearing for content. With JS off you get the same pages,
 * statically.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  // The build's timestamp, from this script's own tag; files fetched later
  // carry it so they are never served stale across a deploy.
  var buildStamp = (document.currentScript && document.currentScript.getAttribute('data-v')) || '';
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // ---- background ---------------------------------------------------------
  // Both grounds are mounted and cross-faded by opacity, so a page that is
  // already dark simply starts with the night field on top.

  if (window.BGShader) {
    window.BGShader.mount({
      canvas: document.getElementById('paper'),
      variant: 'paper', speed: 0, animateGrain: false
    });
    window.BGShader.mount({
      canvas: document.getElementById('night'),
      variant: 'nightfield', grain: 0.5, speed: 0, animateGrain: false
    });
  }

  // ---- no orphans ---------------------------------------------------------
  // `text-wrap: pretty` is a best-effort optimiser and still leaves a lone word
  // on the last line often enough to notice. Binding the final two words with a
  // non-breaking space is the guarantee. The home statement is excluded: its
  // words are separate spans driving the entrance, and joining them breaks it.

  function noOrphans(scope) {
    var blocks = scope.querySelectorAll('p, li, h1, h2, h3, blockquote, figcaption');
    [].forEach.call(blocks, function (node) {
      if (node.closest('.sr-only') || node.closest('.statement')) return;
      var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
      for (var i = nodes.length - 1; i >= 0; i--) {
        var raw = nodes[i].nodeValue;
        var body = raw.replace(/\s+$/, '');
        var tail = raw.slice(body.length);
        var at = body.lastIndexOf(' ');
        if (at > 0) {
          nodes[i].nodeValue = body.slice(0, at) + ' ' + body.slice(at + 1) + tail;
          return;
        }
      }
    });
  }

  // ---- roll rows in as they reach the fold --------------------------------
  // Revealed once a row's top rises above the fold line, so jump-scrolling
  // reveals what it skipped instead of leaving those rows invisible.

  var pending = [];
  var initial = true;
  var ticking = false;

  function collect(scope) {
    pending = [].slice.call(scope.querySelectorAll('.row'));
    initial = true;
    if (reduce) {
      pending.forEach(function (r) { r.classList.add('in'); });
      pending = [];
      return;
    }
    sweep();
  }

  function sweep() {
    if (!pending.length) return;
    var fold = window.innerHeight * 0.92;
    var n = 0;
    var still = [];
    pending.forEach(function (node) {
      if (node.getBoundingClientRect().top < fold) {
        node.style.setProperty('--i', initial ? n++ : Math.min(n++, 3));
        node.classList.add('in');
      } else {
        still.push(node);
      }
    });
    pending = still;
    initial = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; sweep(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ---- home statement -----------------------------------------------------
  // Split into words here rather than in the template so the markup stays a
  // plain paragraph for anything that does not run scripts.

  var statement = document.querySelector('.statement');
  if (statement && !reduce) {
    // Split on ordinary whitespace only. A non-breaking space in the statement
    // is a deliberate bind — "Los Angeles" is one thing and must not be dealt
    // across two lines — so it has to survive into a single span.
    var words = statement.textContent.trim().split(/[^\S ]+/);
    statement.textContent = '';
    words.forEach(function (word, i) {
      var span = el('span', 'w', word);
      span.style.setProperty('--i', i);
      statement.appendChild(span);
      if (i < words.length - 1) statement.appendChild(document.createTextNode(' '));
    });

    // The island waits for the sentence to finish arriving, so it lands on a
    // still page and is actually noticed. Read off the last word rather than
    // recomputing the stagger here: the timing lives in the stylesheet, and a
    // second copy of it in JS would drift the moment either changed.
    var all = statement.querySelectorAll('.w');
    var last = all[all.length - 1];
    if (last) {
      var t = getComputedStyle(last);
      var ms = function (v) { return parseFloat(v) * (/\dms$/.test(v) ? 1 : 1000); };
      var settled = ms(t.animationDelay) + ms(t.animationDuration);
      root.style.setProperty('--island-delay', Math.round(settled + 160) + 'ms');
    }
  }

  // ---- home timer ---------------------------------------------------------
  // The countdown itself is the stylesheet's; this only says when it is over,
  // for whatever wants to happen at the end.
  // At zero a penny comes out and scratches the plate open. Its code and the
  // 3D library under it are fetched only near the end of the countdown, so
  // the home page itself costs nothing extra. Skipped for reduced motion,
  // where the timer is hidden too, and when the plate is already open.
  var timerPie = document.querySelector('.timer-pie');
  if (timerPie) {
    // Stamped with the build, as site.js itself is, so a new deploy is never
    // answered from a cached copy of the old penny.
    var pennyUrl = '/js/penny.js?v=' + buildStamp;
    // ?penny: the last four seconds only, for trying it out.
    var quick = /[?&]penny\b/.test(location.search);
    if (quick) timerPie.getAnimations().forEach(function (a) { a.currentTime = 26000; });
    timerPie.addEventListener('animationstart', function () {
      setTimeout(function () {
        var l = document.createElement('link');
        l.rel = 'modulepreload'; l.href = pennyUrl;
        document.head.appendChild(l);
        // Warmed into the cache; the penny's own loader picks them up.
        ['obverse', 'reverse'].forEach(function (side) {
          ['color', 'normal', 'rough'].forEach(function (kind) {
            new Image().src = '/images/penny/' + side + '-' + kind + '.webp';
          });
        });
      }, quick ? 0 : 20000);
    });
    timerPie.addEventListener('animationend', function () {
      document.dispatchEvent(new CustomEvent('home-timer-done'));
      var egg = document.querySelector('.egg-canvas');
      if (reduce || !egg || !egg.scratch || egg.scratch.isDone()) return;
      import(pennyUrl).then(function (m) {
        m.run({ plate: egg, from: document.getElementById('timer') });
      }).catch(function () {});
    });
  }

  // ---- nav ----------------------------------------------------------------
  // The selected chip is one element that travels, placed from the live
  // geometry of the current link so it survives resizes and the
  // viewport-relative sizing without repeating any of that maths here.

  var thumb = document.querySelector('.nav-thumb');
  var navBar = document.querySelector('nav');

  function placeThumb(animate) {
    if (!thumb || !navBar) return;
    var cur = navBar.querySelector('a[aria-current="page"]');
    if (!cur) { thumb.classList.remove('on'); return; }
    var jump = !animate || !thumb.classList.contains('on');
    if (jump) thumb.classList.add('no-anim');
    var base = navBar.getBoundingClientRect();
    var box = cur.getBoundingClientRect();
    thumb.style.width = box.width + 'px';
    thumb.style.transform = 'translateX(' + (box.left - base.left) + 'px)';
    thumb.classList.add('on');
    if (jump) { void thumb.offsetWidth; thumb.classList.remove('no-anim'); }
  }
  window.addEventListener('resize', function () { placeThumb(false); });

  // ---- project sheet ------------------------------------------------------
  // A project rides over the wall instead of replacing it, so the wall keeps
  // its scroll position and the nav keeps its meaning. The URL is pushed so the
  // page is still linkable and the back button still works; a cold load of that
  // same URL renders the project as its own page.

  var sheet = document.getElementById('sheet');
  var sheetBody = document.getElementById('sheet-body');
  var sheetPanel = document.getElementById('sheet-panel');
  var openHref = null;
  var restoreFocus = null;
  var cache = {};

  // A looping turntable is motion like any other: where the system has asked
  // for less of it, the video holds on its poster frame and grows the controls
  // to play it by hand.
  function holdVideo(scope) {
    if (!reduce) return;
    [].forEach.call(scope.querySelectorAll('video[autoplay]'), function (v) {
      v.autoplay = false;
      v.controls = true;
      v.pause();
    });
  }

  function fillSheet(html, href) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var article = doc.querySelector('.project');
    if (!article) { location.href = href; return; }
    sheetBody.innerHTML = '';
    sheetBody.appendChild(article);
    noOrphans(sheetBody);
    sheetPanel.scrollTop = 0;
    sheet.classList.add('open');
    holdVideo(sheetBody);
    [].forEach.call(sheetBody.querySelectorAll('.row'), function (r, i) {
      r.style.setProperty('--i', Math.min(i, 6));
      r.classList.add('in');
    });
    restoreFocus = document.activeElement;
    // Focus the panel, not the close button: moving focus to a control draws a
    // focus ring on open, which reads as a mistake when nobody pressed a key.
    sheetPanel.focus({ preventScroll: true });
  }

  function openSheet(href, push) {
    if (openHref === href) return;
    openHref = href;
    if (push) history.pushState({ sheet: href }, '', href);
    if (cache[href]) { fillSheet(cache[href], href); return; }
    fetch(href, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (html) { cache[href] = html; if (openHref === href) fillSheet(html, href); })
      .catch(function () { location.href = href; });
  }

  function closeSheet() {
    if (!openHref) return;
    openHref = null;
    sheet.classList.remove('open');
    sheetPanel.style.transform = '';
    setTimeout(function () { if (!openHref) sheetBody.innerHTML = ''; }, reduce ? 0 : 480);
    if (restoreFocus && restoreFocus.focus) restoreFocus.focus({ preventScroll: true });
    restoreFocus = null;
  }

  // ---- pull the sheet down to dismiss -------------------------------------
  // The grip is always a handle; the panel itself only becomes one when it is
  // already scrolled to the top, so dragging never fights the content's scroll.

  function initDrag() {
    var grip = sheetPanel.querySelector('.sheet-grip');
    var startY = 0, startScroll = 0, dy = 0, dragging = false, id = null;

    var fromGrip = false;

    function from(e) {
      // A pull that begins on the grip always drags, wherever the panel happens
      // to be scrolled to. Elsewhere it only drags once there is nothing left
      // to scroll up into, so the gesture never fights the content.
      if (e.target.closest('.sheet-close')) return false;
      fromGrip = !!(grip && grip.contains(e.target));
      return fromGrip || sheetPanel.scrollTop <= 0;
    }

    sheetPanel.addEventListener('pointerdown', function (e) {
      if (!openHref || e.button !== 0 || !from(e)) return;
      dragging = true; id = e.pointerId;
      startY = e.clientY; startScroll = sheetPanel.scrollTop; dy = 0;
      sheetPanel.classList.add('dragging');
    });

    sheetPanel.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== id) return;
      dy = e.clientY - startY;
      // Upward drags do nothing. A pull from the body is also ignored if it
      // began part-way down — but a pull from the grip is always a pull.
      if (dy < 0 || (!fromGrip && startScroll > 0)) { dy = 0; return; }
      e.preventDefault();
      sheetPanel.setPointerCapture(id);
      sheetPanel.style.transform = 'translate(-50%, ' + dy + 'px)';
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      sheetPanel.classList.remove('dragging');
      sheetPanel.style.transform = '';
      // Far enough, or flicked hard enough, and it goes.
      if (dy > Math.min(160, sheetPanel.offsetHeight * 0.22)) history.back();
      dy = 0;
    }
    sheetPanel.addEventListener('pointerup', release);
    sheetPanel.addEventListener('pointercancel', release);
  }

  if (sheet) {
    // Only the wall opens sheets. Anywhere else, a project link is a link.
    if (document.querySelector('.gallery')) {
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a.gal-link[href^="/projects/"]');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        openSheet(a.getAttribute('href'), true);
      });
    }
    document.getElementById('sheet-close').addEventListener('click', function () {
      history.back();
    });
    document.getElementById('sheet-scrim').addEventListener('click', function () {
      history.back();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openHref) history.back();
    });
    initDrag();
    window.addEventListener('popstate', function () {
      if (history.state && history.state.sheet) openSheet(history.state.sheet, false);
      else closeSheet();
    });
  }

  // ---- scratch plate ------------------------------------------------------

  var plate = document.querySelector('.egg-canvas');
  if (plate) initScratch(plate);

  function initScratch(canvas) {
    var srcUrl = canvas.getAttribute('data-src');
    if (!srcUrl) { canvas.style.display = 'none'; return; }
    var img = new Image();
    img.src = srcUrl;

    var wrap = canvas.parentNode;
    var credit = el('p', 'egg-credit', canvas.getAttribute('data-credit') || '');
    wrap.appendChild(credit);

    var clear = el('button', 'egg-clear',
      '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="square">' +
      '<path d="M4.5 4.5 19.5 19.5"/><path d="M19.5 4.5 4.5 19.5"/></svg>');
    clear.type = 'button';
    clear.setAttribute('aria-label', 'Cover the picture again');
    wrap.appendChild(clear);

    var mask = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    // Read back on every stroke to tell when the plate is open.
    var mctx = mask.getContext('2d', { willReadFrequently: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var queued = false;


    function size() {
      var stmt = wrap.querySelector('.statement');
      var w = Math.min((stmt ? stmt.offsetWidth : 560) + 40, window.innerWidth * 0.92);
      var h = Math.min(w / 1.5, window.innerHeight * 0.78);
      w = Math.min(w, h * 1.5);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = mask.width = Math.round(w * dpr);
      canvas.height = mask.height = Math.round(h * dpr);
      mctx.lineCap = mctx.lineJoin = 'round';
      credit.style.marginTop = (h / 2 + 14) + 'px';
      placeClear();
      paintPlate();
    }

    function placeClear() {
      var w = parseFloat(canvas.style.width) || 0;
      var h = parseFloat(canvas.style.height) || 0;
      // Equal inset from the top and right edges of the plate, measured from
      // the button's own box rather than guessed.
      var pad = 10;
      var side = clear.offsetWidth || 42;
      clear.style.left = 'calc(50% + ' + (w / 2 - side - pad) + 'px)';
      clear.style.top = 'calc(50% - ' + (h / 2 - pad) + 'px)';
    }

    // Draw the photo, then keep only the parts that have been scratched.
    // The whole plate, from scratch: the photo, kept only where the mask is
    // open. Only needed when the plate is sized, reset or finished; between
    // those, each mark paints its own patch of the photo (see put).
    var photo = null, patt = null;
    function paintPlate() {
      var w = canvas.width, h = canvas.height;
      if (!w || !h || !img.complete || !img.naturalWidth) return;
      if (!photo || photo.width !== w || photo.height !== h) {
        photo = document.createElement('canvas');
        photo.width = w; photo.height = h;
        var ar = img.naturalWidth / img.naturalHeight;
        var dw = w, dh = w / ar;
        if (dh < h) { dh = h; dw = h * ar; }
        photo.getContext('2d').drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        patt = ctx.createPattern(photo, 'no-repeat');
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(photo, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Every mark goes to two places: the mask, in white, which is what the
    // plate reads to know how much is open; and the picture, filled with the
    // photo itself, so a scrape paints only the patch it opens. Recomposing
    // the whole plate through the mask on every frame meant sending a
    // plate-sized image to the graphics chip sixty times a second.
    function put(path, op, width) {
      for (var i = 0; i < 2; i++) {
        var g = i ? ctx : mctx, paint = i ? patt : '#fff';
        if (i && !patt) break;
        g.globalCompositeOperation = op;
        if (width) {
          g.lineWidth = width; g.lineCap = g.lineJoin = 'round';
          g.strokeStyle = paint; g.stroke(path);
        } else {
          g.fillStyle = paint; g.fill(path);
        }
        g.globalCompositeOperation = 'source-over';
      }
    }

    // The check for whether it is all open reads the whole mask back, so it
    // runs at most five times a second, and always once more after the last
    // stroke.
    var checkTimer = null;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        if (!checkTimer) checkTimer = setTimeout(function () { checkTimer = null; checkDone(); }, 200);
      });
    }

    // Sampled on a coarse grid: this runs inside the draw loop and only needs
    // to know when the plate is essentially open.
    var done = false, need = 0.97;
    function checkDone() {
      if (done || !mask.width) return;
      var step = 12;
      var d = mctx.getImageData(0, 0, mask.width, mask.height).data;
      var open = 0, n = 0;
      for (var y = 0; y < mask.height; y += step) {
        for (var x = 0; x < mask.width; x += step) {
          if (d[(y * mask.width + x) * 4 + 3] > 24) open++;
          n++;
        }
      }
      if (n && open / n >= need) { done = true; finish(); }
    }

    // Past the threshold the last unscratched slivers are just noise, so they
    // are filled in over the same beat the credit arrives on.
    function finish() {
      var t0 = null;
      var from = mctx.getImageData(0, 0, mask.width, mask.height);
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 420);
        mctx.globalCompositeOperation = 'source-over';
        mctx.putImageData(from, 0, 0);
        mctx.globalAlpha = k;
        mctx.fillStyle = '#fff';
        mctx.fillRect(0, 0, mask.width, mask.height);
        mctx.globalAlpha = 1;
        paintPlate();
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      credit.classList.add('on');
      clear.classList.add('on');
      placeClear();
      document.dispatchEvent(new CustomEvent('egg-revealed'));
    }

    clear.addEventListener('click', function () {
      wrap.classList.add('is-clearing');
      clear.classList.remove('on');
      credit.classList.remove('on');
      setTimeout(function () {
        mctx.clearRect(0, 0, mask.width, mask.height);
        done = false;
        need = 0.97;
        fray = 1;
        last = null;
        paintPlate();
        wrap.classList.remove('is-clearing');
      }, 340);
    });

    var drawing = false, last = null;

    function at(e) {
      var r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width),
              (e.clientY - r.top) * (canvas.height / r.height)];
    }

    // The coin's edge: a chord at the angle the coin is held (radians, on the
    // screen, clockwise from horizontal), stamped every couple of pixels. A
    // real edge does not chip the same way twice, and its tears come in
    // runs: so the two ends of the chord wander on slow noise of their own
    // along the distance travelled, biting deep now and then and falling
    // short now and then, and the fibres torn past them come in clusters,
    // mostly short, a few long, some bent, with the odd ragged chunk. While
    // `fray` is on, a little coating is also left hanging into the band for
    // a later pass; the penny turns that off for its last clean-up.
    var travelled = 0, fray = 1;
    function hash1(i, s) { var v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); }
    function noise1(x, s) {
      var i = Math.floor(x), f = x - i;
      f = f * f * (3 - 2 * f);
      return hash1(i, s) + (hash1(i + 1, s) - hash1(i, s)) * f;
    }
    // how far one end reaches, as a fraction of the half-chord
    function reach(d, s) {
      var n = noise1(d * 0.045, s), deep = noise1(d * 0.018, s + 7);
      var v = 0.8 + 0.2 * n;
      if (deep > 0.8) v += (deep - 0.8) / 0.2 * 0.45;      // a bite
      else if (deep < 0.14) v -= (0.14 - deep) / 0.14 * 0.12; // falls short
      return v;
    }
    function scrape(pt, r, ang) {
      var half = r * dpr;
      if (!last) { last = pt; return; }
      var dx = pt[0] - last[0], dy = pt[1] - last[1], len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      var nx = Math.cos(ang), ny = Math.sin(ang);
      // the chord's thickness runs across it, not along the travel
      var ux = -ny, uy = nx;
      var stepPx = 1.5 * dpr, n = Math.max(1, Math.ceil(len / stepPx));
      for (var i = 1; i <= n; i++) {
        var cx = last[0] + dx * i / n, cy = last[1] + dy * i / n;
        travelled += len / n / dpr;
        var d = travelled;
        var a = half * reach(d, 1), b = half * reach(d, 2);
        var th = (1.3 + 2.4 * noise1(d * 0.21, 5)) * dpr;
        var q = new Path2D();
        q.moveTo(cx - nx * a - ux * th, cy - ny * a - uy * th);
        q.lineTo(cx + nx * b - ux * th, cy + ny * b - uy * th);
        q.lineTo(cx + nx * b + ux * th, cy + ny * b + uy * th);
        q.lineTo(cx - nx * a + ux * th, cy - ny * a + uy * th);
        q.closePath();
        put(q, 'source-over');
        // clusters: each end has its own run of tearing and quiet
        var ca = noise1(d * 0.07, 11), cb = noise1(d * 0.07, 12);
        if (Math.random() < 0.6 * ca * ca * ca) fibre(cx, cy, nx, ny, -a, half, 'source-over');
        if (Math.random() < 0.6 * cb * cb * cb) fibre(cx, cy, nx, ny, b, half, 'source-over');
        if (Math.random() < 0.035 * ca) chunk(cx, cy, nx, ny, -a, half);
        if (Math.random() < 0.035 * cb) chunk(cx, cy, nx, ny, b, half);
        if (fray && Math.random() < 0.05 * Math.max(ca, cb)) {
          fibre(cx, cy, nx, ny, (Math.random() < 0.5 ? -a : b) * 0.95, -half * 0.6, 'destination-out');
        }
      }
      if (fray && Math.random() < 0.04) {
        var o = (Math.random() * 2 - 1) * half * 0.8, hole = new Path2D();
        hole.arc(pt[0] + nx * o - ux * half * 0.6, pt[1] + ny * o - uy * half * 0.6,
                 (0.6 + Math.pow(Math.random(), 2) * 2.4) * dpr, 0, 7);
        put(hole, 'destination-out');
      }
      last = pt;
      schedule();
    }

    // A torn fibre from the chord's end at `from` (signed, along the chord),
    // running out by up to `span`, mostly short and now and then long, bent
    // a little: revealed when drawn, coating left behind when cut out (a
    // negative span runs it back into the band).
    function fibre(cx, cy, nx, ny, from, span, op) {
      var sgn = from < 0 ? -1 : 1, dir = span < 0 ? -sgn : sgn;
      var len = Math.abs(span) * (0.06 + 0.5 * Math.pow(Math.random(), 2.5));
      var sx = cx + nx * from, sy = cy + ny * from;
      var bend = (Math.random() - 0.5) * 1.1;
      var ex = sx + (nx * Math.cos(bend) - ny * Math.sin(bend)) * len * dir;
      var ey = sy + (ny * Math.cos(bend) + nx * Math.sin(bend)) * len * dir;
      var k = (Math.random() - 0.5) * len * 0.5;
      var f = new Path2D();
      f.moveTo(sx, sy);
      f.quadraticCurveTo((sx + ex) / 2 - ny * k, (sy + ey) / 2 + nx * k, ex, ey);
      put(f, op, (0.6 + Math.pow(Math.random(), 1.5) * 2.2) * dpr);
    }

    // A ragged chunk torn out past the end of the chord: a few jagged points
    // fanning outward, revealed all at once.
    function chunk(cx, cy, nx, ny, from, half) {
      var sgn = from < 0 ? -1 : 1;
      var sx = cx + nx * from, sy = cy + ny * from;
      var size = half * (0.12 + Math.random() * 0.3), pts = 3 + Math.floor(Math.random() * 3);
      var c = new Path2D();
      c.moveTo(sx - ny * size * 0.6, sy + nx * size * 0.6);
      for (var i = 0; i <= pts; i++) {
        var t = i / pts, w = (t - 0.5) * 1.6 + (Math.random() - 0.5) * 0.5;
        var out = size * (0.4 + Math.random() * 0.9) * Math.sin(Math.PI * t);
        c.lineTo(sx + nx * out * sgn - ny * w * size * 0.6, sy + ny * out * sgn + nx * w * size * 0.6);
      }
      c.lineTo(sx + ny * size * 0.6, sy - nx * size * 0.6);
      c.closePath();
      put(c, 'source-over');
    }

    function stroke(pt, r) {
      var radius = (r || 26) * dpr;
      if (last) {
        var line = new Path2D();
        line.moveTo(last[0], last[1]);
        line.lineTo(pt[0], pt[1]);
        put(line, 'source-over', radius * 2);
      }
      var dot = new Path2D();
      dot.arc(pt[0], pt[1], radius, 0, 7);
      put(dot, 'source-over');
      last = pt;
      schedule();
    }

    canvas.addEventListener('pointerdown', function (e) {
      drawing = true; last = null;
      canvas.setPointerCapture(e.pointerId);
      stroke(at(e));
    });
    canvas.addEventListener('pointermove', function (e) {
      if (drawing) stroke(at(e));
    });
    // No auto-complete below the threshold. The picture arrives by hand.
    function end() { drawing = false; last = null; }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', end);

    // The same scratch, for something other than a hand to drive: the home
    // timer's penny. Points are viewport coordinates; r is in CSS pixels.
    canvas.scratch = {
      to: function (x, y, r, edge) {
        var b = canvas.getBoundingClientRect();
        var pt = [(x - b.left) * (canvas.width / b.width),
                  (y - b.top) * (canvas.height / b.height)];
        if (edge !== undefined && edge !== false) scrape(pt, r, +edge || 0); else stroke(pt, r);
      },
      rect: function () { return canvas.getBoundingClientRect(); },
      lift: function () { last = null; },
      // Viewport points of the sample grid still covered.
      covered: function () {
        var out = [], b = canvas.getBoundingClientRect();
        if (!mask.width) return out;
        // The very grid checkDone samples, so an empty list means done.
        var step = 12;
        var d = mctx.getImageData(0, 0, mask.width, mask.height).data;
        for (var y = 0; y < mask.height; y += step) {
          for (var x = 0; x < mask.width; x += step) {
            if (d[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] <= 24) {
              out.push([b.left + x * b.width / mask.width, b.top + y * b.height / mask.height]);
            }
          }
        }
        return out;
      },
      isDone: function () { return done; },
      // Is the coating still on at this viewport point?
      coveredAt: function (x, y) {
        var b = canvas.getBoundingClientRect();
        var px = Math.floor((x - b.left) * (mask.width / b.width));
        var py = Math.floor((y - b.top) * (mask.height / b.height));
        if (px < 0 || py < 0 || px >= mask.width || py >= mask.height) return false;
        return mctx.getImageData(px, py, 1, 1).data[3] <= 24;
      },
      // Whether scraping leaves slivers of coating behind for later passes.
      fray: function (on) { fray = on ? 1 : 0; },
      // How much must be scratched before the plate finishes itself. A hand
      // gets the last slivers filled in at 97%; the penny, which would
      // otherwise spend its last seconds hunting specks, at less.
      need: function (v) { need = v; schedule(); }
    };

    if (img.complete) size();
    else img.onload = size;
    window.addEventListener('resize', size);
  }

  // ---- the upcoming island ------------------------------------------------
  // Rendered only when something is actually coming up, so its absence here is
  // the normal case.
  //
  // Nothing inside the capsule is animated. The frame is laid out once at the
  // open width and stays there; the capsule is a window over it, and opening is
  // that window travelling between two measured sizes. Animating the layout
  // instead — a width the text reflows into, rows going 0fr to 1fr — meant
  // every line re-wrapped on every frame, which is what the judder was.
  //
  // Which makes the measurements load-bearing, so they are taken from the
  // header itself (sized to its own label, independent of the frame around it)
  // and retaken whenever anything that feeds them moves: the viewport, and the
  // fonts, which settle after first paint and shift the label's width with them.

  function initIsland(island) {
    var pill = island.querySelector('.island-pill');
    var frame = island.querySelector('.island-frame');
    var panel = island.querySelector('.island-panel');
    var queued = false;

    // A measurement that came out as nothing, or as a number CSS cannot use, is
    // dropped rather than written: the stylesheet's own fallback is a better
    // capsule than one sized NaN.
    function pin(name, value) {
      if (isFinite(value) && value > 0) island.style.setProperty(name, value + 'px');
    }

    function measure() {
      // Only the shut size: the open one is the column CSS already gives the
      // capsule, and a width the script has to supply is a width the script can
      // get wrong.
      var head = pill.getBoundingClientRect();
      // Sub-pixel widths round down to a clipped final letter; always up.
      pin('--shut-w', Math.ceil(head.width));
      pin('--shut-h', Math.ceil(head.height));
      // Read after the frame has settled, or the height belongs to the previous
      // layout. Capped at what is on screen: enough entries and the list is
      // taller than the viewport, and an uncapped capsule would put the last of
      // them below the bottom edge with no way to reach them.
      requestAnimationFrame(function () {
        var room = window.innerHeight - island.getBoundingClientRect().top - 16;
        pin('--open-h', Math.min(Math.ceil(frame.scrollHeight), Math.floor(room)));
      });
    }

    // Re-measuring is not a state change, so it must not look like one: the
    // capsule would otherwise animate itself every time the window moved.
    function remeasure() {
      if (queued) return;
      queued = true;
      island.classList.add('no-anim');
      requestAnimationFrame(function () {
        measure();
        requestAnimationFrame(function () {
          queued = false;
          island.classList.remove('no-anim');
        });
      });
    }

    function set(open) {
      island.classList.toggle('open', open);
      pill.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.toggleAttribute('inert', !open);
    }

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    pill.addEventListener('click', function () {
      set(!island.classList.contains('open'));
    });

    // Open, it is the thing in front of you: anywhere else, and Escape, shuts it.
    document.addEventListener('pointerdown', function (e) {
      if (island.classList.contains('open') && !island.contains(e.target)) set(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && island.classList.contains('open')) {
        set(false);
        pill.focus();
      }
    });

    window.addEventListener('resize', remeasure);
  }

  // ---- go -----------------------------------------------------------------

  // Shared so anything that writes its own prose after load — the bio on the
  // Info page rewrites its paragraphs on every tap — can re-bind its tails.
  window.noOrphans = noOrphans;

  noOrphans(document.body);
  holdVideo(document);
  collect(document.body);
  placeThumb(false);

  var island = document.getElementById('island');
  if (island) initIsland(island);

  // A project URL loaded cold renders as its own page; arriving at one from the
  // wall is what opens the sheet, so nothing to do here on first paint.
})();
