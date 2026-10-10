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
    // For trying the acts out: ?penny skips to the last four seconds of the
    // timer, just before the penny comes out; ?poem skips straight to the
    // poem. Either case works, ?Penny as well as ?penny.
    var quick = /[?&]penny\b/i.test(location.search);
    var toPoem = /[?&]poem\b/i.test(location.search);
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
    // Once the picture is open the timer runs again, for a while in the
    // gallery. When that runs out the plate covers itself back over, and the
    // timer's spot holds a loop: tapped, it all starts again from the top,
    // the timer winding down and then the penny.
    var egg = document.querySelector('.egg-canvas');
    var timer = document.getElementById('timer');
    var again = document.getElementById('timer-again');
    // Act three: the gallery has faded, and a poem about nature writes itself
    // word by word; then the critic's pen shows up. See poem.js. `after` runs
    // when it is over. The code is fetched when it is needed, and if it cannot
    // be, the loop is offered at once.
    function poem(after) {
      import('/js/poem.js?v=' + buildStamp).then(function (m) {
        m.run({ wrap: egg.parentNode, after: after, penUrl: '/js/pen.js?v=' + buildStamp });
      }).catch(function () { egg.parentNode.classList.remove('is-poem'); after(); });
    }
    function sendPenny() {
      import(pennyUrl).then(function (m) {
        m.run({ plate: egg, from: timer });
      }).catch(function () {});
    }
    function offerAgain() {
      if (!again) return;
      again.hidden = false;
      again.disabled = false;
      requestAnimationFrame(function () { again.classList.add('on'); });
    }
    if (again) again.addEventListener('click', function () {
      if (again.disabled) return;
      again.disabled = true;
      // the timer comes back, full, as the loop goes
      again.classList.remove('on');
      setTimeout(function () { again.hidden = true; }, 500);
      rewind();
    });
    function rewind() {
      timer.style.visibility = '';
      timerPie.getAnimations().forEach(function (a) {
        a.cancel();
        a.currentTime = 0;
        a.play();
      });
      timer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease' });
    }
    document.addEventListener('egg-revealed', function () {
      if (again && !again.hidden) {
        again.disabled = true;
        again.classList.remove('on');
        setTimeout(function () { again.hidden = true; }, 500);
      }
      if (!reduce) setTimeout(rewind, 600);
    });
    timerPie.addEventListener('animationend', function () {
      document.dispatchEvent(new CustomEvent('home-timer-done'));
      if (reduce || !egg || !egg.scratch) return;
      if (egg.scratch.isDone()) {
        // The statement goes now, under the picture, so the picture fades
        // to an empty page and never to the statement; the poem comes in as
        // the last of the picture goes.
        egg.parentNode.classList.add('is-poem');
        egg.scratch.reset();
        setTimeout(function () { poem(offerAgain); }, 700);
        return;
      }
      sendPenny();
    });
    if (toPoem && !reduce && egg) {
      timerPie.getAnimations().forEach(function (a) { a.cancel(); });
      timer.style.visibility = 'hidden';
      egg.parentNode.classList.add('is-poem');
      setTimeout(function () {
        poem(offerAgain);
      }, 500);
    }
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
    var credit = el('p', 'egg-credit', '');
    // Once the plate is open it becomes a small show: the picture it
    // revealed, then the rest, switched by a row of dots under the credit, a
    // tap on the picture, a swipe, or the arrow keys. All of them, the first
    // included, come from data-slides; data-src is the first, to start
    // fetching before anything else is read.
    var slides = [];
    try {
      JSON.parse(canvas.getAttribute('data-slides') || '[]').forEach(function (d) {
        slides.push({ src: d.src, artist: d.artist, title: d.title, year: d.year, link: d.wiki,
                      fit: d.fit || 'cover', img: null });
      });
    } catch (e) {}
    if (!slides.length || slides[0].src !== srcUrl) slides.unshift({ src: srcUrl, artist: '', title: '', year: '', fit: 'cover' });
    slides[0].fit = 'cover';
    slides[0].img = img;
    // As a label reads: the artist, linked to more about them when there is
    // somewhere to go, the work's title in italics, the year. Built from
    // text, so nothing in it is ever read as markup.
    function plain(sl) { return [sl.artist, sl.title, sl.year].filter(Boolean).join(', '); }
    function setCredit(node, sl) {
      node.textContent = '';
      var name = document.createTextNode(sl.artist);
      if (sl.link && node === credit) {
        name = document.createElement('a');
        name.href = sl.link; name.target = '_blank'; name.rel = 'noopener';
        name.textContent = sl.artist;
      }
      node.appendChild(name);
      if (sl.title) {
        node.appendChild(document.createTextNode(', '));
        var t = document.createElement('i'); t.textContent = sl.title; node.appendChild(t);
      }
      if (sl.year) node.appendChild(document.createTextNode(', ' + sl.year));
    }
    setCredit(credit, slides[0]);
    wrap.appendChild(credit);

    var cur = 0, showing = false;
    var dots = el('div', 'egg-dots');
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Pictures');
    slides.forEach(function (sl, i) {
      var d = el('button', 'egg-dot');
      d.type = 'button';
      d.setAttribute('aria-label', (i + 1) + ' of ' + slides.length + ': ' + plain(sl));
      d.addEventListener('click', function () { show(i); });
      dots.appendChild(d);
    });
    if (slides.length > 1) wrap.appendChild(dots);

    var mask = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    // Drawn into and composited whole, never read back during scratching:
    // how much is open is kept in the coverage grid below.
    var mctx = mask.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var queued = false;


    function size() {
      var stmt = wrap.querySelector('.statement');
      var w = Math.min((stmt ? stmt.offsetWidth : 560) + 40, window.innerWidth * 0.92);
      var h = Math.min(w / 1.5, window.innerHeight * 0.78);
      w = Math.min(w, h * 1.5);
      // Safari calls a toolbar sliding in or out a resize. Setting a
      // canvas's size wipes it, even to the size it already is, so a plate
      // that has not changed size is left alone.
      if (Math.round(w * dpr) === canvas.width && Math.round(h * dpr) === canvas.height) return;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = mask.width = Math.round(w * dpr);
      canvas.height = mask.height = Math.round(h * dpr);
      mctx.lineCap = mctx.lineJoin = 'round';
      resetGrid();
      credit.style.marginTop = (h / 2 + 14) + 'px';
      credit.style.width = w + 'px';
      placeDots();
      photos = {};
      // an open plate stays open at its new size
      if (done) {
        mctx.fillStyle = '#fff';
        mctx.fillRect(0, 0, mask.width, mask.height);
        for (var g = 0; g < grid.length; g++) setPt(g, 1);
      }
      paintPlate();
    }


    // Draw the photo, then keep only the parts that have been scratched.
    // The whole plate, from scratch: the photo, kept only where the mask is
    // open. Only needed when the plate is sized, reset or finished; between
    // those, each mark paints its own patch of the photo (see put).
    var photos = {}, patt = null;
    // A slide drawn to the plate's size: the first fills it, the others are
    // fitted whole inside it, so no artwork loses an edge to the crop.
    function photoFor(i) {
      var sl = slides[i], im = sl.img, w = canvas.width, h = canvas.height;
      if (photos[i]) return photos[i];
      if (!w || !h || !im || !im.complete || !im.naturalWidth) return null;
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var ar = im.naturalWidth / im.naturalHeight, dw = w, dh = w / ar;
      if (sl.fit === 'contain' ? dh > h : dh < h) { dh = h; dw = h * ar; }
      // Every picture gets the plate's own small rounded corners, however
      // much of the plate it fills.
      var g = c.getContext('2d'), x = (w - dw) / 2, y = (h - dh) / 2;
      var cw = Math.min(w, dw), ch = Math.min(h, dh), rr = 4 * dpr;
      g.beginPath();
      if (g.roundRect) g.roundRect((w - cw) / 2, (h - ch) / 2, cw, ch, rr);
      else g.rect((w - cw) / 2, (h - ch) / 2, cw, ch);
      g.clip();
      g.drawImage(im, x, y, dw, dh);
      return (photos[i] = c);
    }
    function paintPlate() {
      flush();
      var w = canvas.width, h = canvas.height;
      var photo = photoFor(cur);
      if (!photo) return;
      patt = ctx.createPattern(photo, 'no-repeat');
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(photo, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Every mark goes to two places: the mask, in white, which is the plate's
    // record for repainting it whole; and the picture, filled with the photo
    // itself, so a scrape paints only the patch it opens. Marks are gathered
    // through a frame and drawn in one go per canvas: dozens of small fills a
    // frame, each its own draw, was what made heavy scratching stutter.
    // Quads, dots and holes each share one path, since each kind winds the
    // same way; chunks and fibres, which may not, are drawn on their own.
    var batch = { quads: null, dots: null, holes: null, own: [] };
    function flush() {
      if (!batch.quads && !batch.dots && !batch.holes && !batch.own.length) return;
      for (var i = 0; i < 2; i++) {
        var g = i ? ctx : mctx, paint = i ? patt : '#fff';
        if (i && !patt) break;
        g.fillStyle = g.strokeStyle = paint;
        g.lineCap = g.lineJoin = 'round';
        g.globalCompositeOperation = 'source-over';
        if (batch.quads) g.fill(batch.quads);
        if (batch.dots) g.fill(batch.dots);
        for (var j = 0; j < batch.own.length; j++) {
          var o = batch.own[j];
          g.globalCompositeOperation = o.op;
          if (o.width) { g.lineWidth = o.width; g.stroke(o.path); } else g.fill(o.path);
        }
        if (batch.holes) { g.globalCompositeOperation = 'destination-out'; g.fill(batch.holes); }
        g.globalCompositeOperation = 'source-over';
      }
      batch.quads = batch.dots = batch.holes = null;
      batch.own.length = 0;
    }

    // ---- coverage ---------------------------------------------------------
    // One sample point every 12 mask pixels, open or covered. Each mark opens
    // the points inside its shape, worked out from the shape itself, so
    // knowing how much is open, where is still covered and whether a point
    // has coating on it never means copying the mask back out of the canvas.
    // (That copy, a megabyte at a time, was most of the cost of scratching.)
    var STEP = 12, gw = 0, gh = 0, grid = new Uint8Array(0), openCount = 0;
    function resetGrid() {
      gw = Math.ceil(mask.width / STEP); gh = Math.ceil(mask.height / STEP);
      grid = new Uint8Array(gw * gh); openCount = 0;
    }
    function setPt(i, v) { if (grid[i] !== v) { grid[i] = v; openCount += v ? 1 : -1; } }
    function span(lo, hi, n) { return [Math.max(0, Math.ceil(lo / STEP)), Math.min(n - 1, Math.floor(hi / STEP))]; }
    // a convex polygon, as a flat list of corners
    function openPoly(p) {
      var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity, k, n = p.length;
      for (k = 0; k < n; k += 2) {
        if (p[k] < minx) minx = p[k]; if (p[k] > maxx) maxx = p[k];
        if (p[k + 1] < miny) miny = p[k + 1]; if (p[k + 1] > maxy) maxy = p[k + 1];
      }
      var xs = span(minx, maxx, gw), ys = span(miny, maxy, gh);
      for (var gy = ys[0]; gy <= ys[1]; gy++) {
        for (var gx = xs[0]; gx <= xs[1]; gx++) {
          var x = gx * STEP, y = gy * STEP, side = 0, inside = true;
          for (k = 0; k < n; k += 2) {
            var ax = p[k], ay = p[k + 1], bx = p[(k + 2) % n], by = p[(k + 3) % n];
            var c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
            if (c !== 0) { var sg = c > 0 ? 1 : -1; if (!side) side = sg; else if (sg !== side) { inside = false; break; } }
          }
          if (inside) setPt(gy * gw + gx, 1);
        }
      }
    }
    function setDisc(cx, cy, r, v) {
      var xs = span(cx - r, cx + r, gw), ys = span(cy - r, cy + r, gh), rr = r * r;
      for (var gy = ys[0]; gy <= ys[1]; gy++) {
        for (var gx = xs[0]; gx <= xs[1]; gx++) {
          var dx = gx * STEP - cx, dy = gy * STEP - cy;
          if (dx * dx + dy * dy <= rr) setPt(gy * gw + gx, v);
        }
      }
    }
    function openCapsule(ax, ay, bx, by, r) {
      var xs = span(Math.min(ax, bx) - r, Math.max(ax, bx) + r, gw);
      var ys = span(Math.min(ay, by) - r, Math.max(ay, by) + r, gh);
      var vx = bx - ax, vy = by - ay, vv = vx * vx + vy * vy || 1, rr = r * r;
      for (var gy = ys[0]; gy <= ys[1]; gy++) {
        for (var gx = xs[0]; gx <= xs[1]; gx++) {
          var px = gx * STEP - ax, py = gy * STEP - ay;
          var t = Math.max(0, Math.min(1, (px * vx + py * vy) / vv));
          var dx = px - vx * t, dy = py - vy * t;
          if (dx * dx + dy * dy <= rr) setPt(gy * gw + gx, 1);
        }
      }
    }

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; flush(); checkDone(); });
    }

    // Sampled on a coarse grid: only needs to know when the plate is open.
    var done = false, need = 0.97;
    function checkDone() {
      if (done || !grid.length) return;
      if (openCount / grid.length >= need) { done = true; finish(); }
    }

    // Past the threshold the last unscratched slivers are just noise, so they
    // are filled in over the same beat the credit arrives on.
    function finish() {
      flush();
      for (var g = 0; g < grid.length; g++) setPt(g, 1);
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
        else startShow();
      }
      requestAnimationFrame(step);
      credit.classList.add('on');
      document.dispatchEvent(new CustomEvent('egg-revealed'));
    }


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
        var q = [cx - nx * a - ux * th, cy - ny * a - uy * th,
                 cx + nx * b - ux * th, cy + ny * b - uy * th,
                 cx + nx * b + ux * th, cy + ny * b + uy * th,
                 cx - nx * a + ux * th, cy - ny * a + uy * th];
        var qp = batch.quads || (batch.quads = new Path2D());
        qp.moveTo(q[0], q[1]); qp.lineTo(q[2], q[3]); qp.lineTo(q[4], q[5]); qp.lineTo(q[6], q[7]);
        qp.closePath();
        openPoly(q);
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
        var o = (Math.random() * 2 - 1) * half * 0.8;
        var hx = pt[0] + nx * o - ux * half * 0.6, hy = pt[1] + ny * o - uy * half * 0.6;
        var hr = (0.6 + Math.pow(Math.random(), 2) * 2.4) * dpr;
        var hp = batch.holes || (batch.holes = new Path2D());
        hp.moveTo(hx + hr, hy); hp.arc(hx, hy, hr, 0, 7);
        setDisc(hx, hy, hr, 0);
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
      batch.own.push({ path: f, op: op, width: (0.6 + Math.pow(Math.random(), 1.5) * 2.2) * dpr });
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
      batch.own.push({ path: c, op: 'source-over', width: 0 });
      setDisc(sx + nx * sgn * size * 0.4, sy + ny * sgn * size * 0.4, size * 0.45, 1);
    }

    function stroke(pt, r) {
      var radius = (r || 26) * dpr;
      if (last) {
        var line = new Path2D();
        line.moveTo(last[0], last[1]);
        line.lineTo(pt[0], pt[1]);
        batch.own.push({ path: line, op: 'source-over', width: radius * 2 });
        openCapsule(last[0], last[1], pt[0], pt[1], radius);
      }
      var dp = batch.dots || (batch.dots = new Path2D());
      dp.moveTo(pt[0] + radius, pt[1]); dp.arc(pt[0], pt[1], radius, 0, 7);
      setDisc(pt[0], pt[1], radius, 1);
      last = pt;
      schedule();
    }

    // ---- the show --------------------------------------------------------
    function startShow() {
      if (showing || slides.length < 2) return;
      showing = true;
      wrap.classList.add('is-show');
      placeDots();
      mark();
      // fetch the rest now, so a switch never waits on the network
      slides.forEach(function (sl) {
        if (sl.img) return;
        sl.img = new Image();
        sl.img.src = sl.src;
      });
    }
    // Under the credit, at the depth of the longest one, so switching to a
    // title that wraps differently never moves them.
    var probe = null;
    function placeDots() {
      var h = parseFloat(canvas.style.height) || 0;
      if (!probe) {
        probe = el('p', 'egg-credit', '');
        probe.setAttribute('aria-hidden', 'true');
        probe.style.visibility = 'hidden';
        wrap.appendChild(probe);
      }
      probe.style.width = credit.style.width;
      var tall = 0;
      slides.forEach(function (sl) {
        setCredit(probe, sl);
        tall = Math.max(tall, probe.offsetHeight);
      });
      dots.style.marginTop = (h / 2 + 14 + tall + 8) + 'px';
    }
    function mark() {
      Array.prototype.forEach.call(dots.children, function (d, i) {
        if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    // Cross-fades the plate to slide i and swaps the credit under it.
    var fading = false;
    function show(i) {
      i = (i + slides.length) % slides.length;
      if (!showing || i === cur || fading) return;
      var sl = slides[i];
      if (!sl.img) { sl.img = new Image(); sl.img.src = sl.src; }
      var go = function () {
        var to = photoFor(i);
        if (!to) return;
        var from = document.createElement('canvas');
        from.width = canvas.width; from.height = canvas.height;
        from.getContext('2d').drawImage(canvas, 0, 0);
        cur = i; mark(); fading = true;
        // The title runs on the picture's own clock: out over the first
        // half of the cross-fade, swapped while it is gone, back in over the
        // second, so the two finish together.
        var swapped = false;
        credit.style.transition = 'none';
        function release() { credit.style.opacity = ''; credit.style.transition = ''; }
        var t0 = null;
        (function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 440);
          var e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
          // Added, not laid over: the two weights always sum to one, so the
          // plate never thins to the page halfway through.
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - e; ctx.drawImage(from, 0, 0);
          ctx.globalAlpha = e; ctx.drawImage(to, 0, 0);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          // the show may have been put away in the meantime
          if (!showing) release();
          else {
            if (e >= 0.5 && !swapped) { swapped = true; setCredit(credit, sl); }
            credit.style.opacity = String(Math.abs(1 - 2 * e));
          }
          if (k < 1) requestAnimationFrame(step);
          else { fading = false; release(); paintPlate(); }
        })(performance.now());
      };
      if (sl.img.complete && sl.img.naturalWidth) go();
      else sl.img.onload = go;
    }
    document.addEventListener('keydown', function (e) {
      if (!showing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') show(cur + 1);
      else if (e.key === 'ArrowLeft') show(cur - 1);
    });
    // On the open plate a tap goes on to the next picture and a swipe goes
    // either way; there is nothing left to scratch.
    var swipe = null;

    canvas.addEventListener('pointerdown', function (e) {
      if (clearing) return;
      if (showing) { swipe = [e.clientX, e.clientY]; return; }
      drawing = true; last = null;
      canvas.setPointerCapture(e.pointerId);
      stroke(at(e));
    });
    canvas.addEventListener('pointermove', function (e) {
      if (drawing) stroke(at(e));
    });
    // No auto-complete below the threshold. The picture arrives by hand.
    function end() { drawing = false; last = null; }
    canvas.addEventListener('pointerup', function (e) {
      if (showing && swipe) {
        var dx = e.clientX - swipe[0], dy = e.clientY - swipe[1];
        swipe = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
        else if (Math.hypot(dx, dy) < 10) show(cur + 1);
        return;
      }
      end();
    });
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
        for (var gy = 0; gy < gh; gy++) {
          for (var gx = 0; gx < gw; gx++) {
            if (!grid[gy * gw + gx]) {
              out.push([b.left + gx * STEP * b.width / mask.width, b.top + gy * STEP * b.height / mask.height]);
            }
          }
        }
        return out;
      },
      isDone: function () { return done; },
      // Is the coating still on at this viewport point?
      coveredAt: function (x, y) {
        var b = canvas.getBoundingClientRect();
        var gx = Math.round((x - b.left) * (mask.width / b.width) / STEP);
        var gy = Math.round((y - b.top) * (mask.height / b.height) / STEP);
        if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return false;
        return !grid[gy * gw + gx];
      },
      // Whether scraping leaves slivers of coating behind for later passes.
      fray: function (on) { fray = on ? 1 : 0; },
      // How much must be scratched before the plate finishes itself. A hand
      // gets the last slivers filled in at 97%; the penny, which would
      // otherwise spend its last seconds hunting specks, at less.
      need: function (v) { need = v; schedule(); },
      // Covers the picture again: the open plate fades away to the statement
      // under it, and comes back as fresh coating, the show put away.
      reset: reset
    };

    var clearing = false;
    function reset() {
      if (!done || clearing) return;
      // Put away at once, so a tap during the fade cannot switch a slide in.
      showing = false; swipe = null; clearing = true;
      wrap.classList.add('is-clearing');
      wrap.classList.remove('is-show');
      credit.classList.remove('on');
      setTimeout(function () {
        fading = false; cur = 0; clearing = false;
        setCredit(credit, slides[0]);
        credit.classList.remove('on');
        mark();
        mctx.clearRect(0, 0, mask.width, mask.height);
        batch.quads = batch.dots = batch.holes = null; batch.own.length = 0;
        resetGrid();
        done = false; need = 0.97; fray = 1; last = null; drawing = false;
        paintPlate();
        placeDots();
        // the canvas is clear now, so showing it again shows nothing
        wrap.classList.remove('is-clearing');
      }, 900);
    }

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
      // The home timer sits level with the shut capsule, centre on centre.
      if (head.height > 0) root.style.setProperty('--island-h', Math.ceil(head.height) + 'px');
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
