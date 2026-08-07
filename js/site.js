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
    var words = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    words.forEach(function (word, i) {
      var span = el('span', 'w', word);
      span.style.setProperty('--i', i);
      statement.appendChild(span);
      if (i < words.length - 1) statement.appendChild(document.createTextNode(' '));
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

  function fillSheet(html, href) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var article = doc.querySelector('.project');
    if (!article) { location.href = href; return; }
    sheetBody.innerHTML = '';
    sheetBody.appendChild(article);
    noOrphans(sheetBody);
    sheetPanel.scrollTop = 0;
    sheet.classList.add('open');
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
    var mctx = mask.getContext('2d');
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
    function paintPlate() {
      var w = canvas.width, h = canvas.height;
      if (!w || !h || !img.complete || !img.naturalWidth) return;
      ctx.clearRect(0, 0, w, h);
      var ar = img.naturalWidth / img.naturalHeight;
      var dw = w, dh = w / ar;
      if (dh < h) { dh = h; dw = h * ar; }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; paintPlate(); checkDone(); });
    }

    // Sampled on a coarse grid: this runs inside the draw loop and only needs
    // to know when the plate is essentially open.
    var done = false;
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
      if (n && open / n >= 0.97) { done = true; finish(); }
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
    }

    clear.addEventListener('click', function () {
      wrap.classList.add('is-clearing');
      clear.classList.remove('on');
      credit.classList.remove('on');
      setTimeout(function () {
        mctx.clearRect(0, 0, mask.width, mask.height);
        done = false;
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

    function stroke(pt) {
      var radius = 26 * dpr;
      mctx.globalCompositeOperation = 'source-over';
      mctx.strokeStyle = mctx.fillStyle = '#fff';
      mctx.lineWidth = radius * 2;
      if (last) {
        mctx.beginPath();
        mctx.moveTo(last[0], last[1]);
        mctx.lineTo(pt[0], pt[1]);
        mctx.stroke();
      }
      mctx.beginPath();
      mctx.arc(pt[0], pt[1], radius, 0, 7);
      mctx.fill();
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

    if (img.complete) size();
    else img.onload = size;
    window.addEventListener('resize', size);
  }

  // ---- the upcoming island ------------------------------------------------
  // Rendered only when something is actually coming up, so its absence here is
  // the normal case.
  //
  // Height is CSS's job (0fr to 1fr); width is not — there is no animating
  // from a capsule's max-content width to the open one, so both ends are
  // pinned here in pixels and the capsule travels between them.

  function initIsland(island) {
    var pill = island.querySelector('.island-pill');
    var shut = 0;

    function measure() {
      island.style.width = '';
      shut = island.getBoundingClientRect().width;
      if (!island.classList.contains('open')) island.style.width = shut + 'px';
    }

    function grown() {
      var rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      return Math.max(shut, Math.min(28 * rem, window.innerWidth - 32));
    }

    function set(open) {
      island.classList.toggle('open', open);
      pill.setAttribute('aria-expanded', open ? 'true' : 'false');
      island.style.width = (open ? grown() : shut) + 'px';
    }

    measure();

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

    window.addEventListener('resize', function () {
      if (island.classList.contains('open')) island.style.width = grown() + 'px';
      else measure();
    });
  }

  // ---- go -----------------------------------------------------------------

  // Shared so anything that writes its own prose after load — the bio on the
  // Info page rewrites its paragraphs on every tap — can re-bind its tails.
  window.noOrphans = noOrphans;

  noOrphans(document.body);
  collect(document.body);
  placeThumb(false);

  var island = document.getElementById('island');
  if (island) initIsland(island);

  // A project URL loaded cold renders as its own page; arriving at one from the
  // wall is what opens the sheet, so nothing to do here on first paint.
})();
