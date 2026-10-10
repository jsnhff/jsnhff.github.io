// Act three of the home page: a poem about nature writes itself, a critic
// circles the weak words in red pen and writes in the margin, the poem is
// revised, and round after round it improves until it is finished (or the
// thirty seconds are up). The finished poem goes into a log kept in this
// browser, which /poems/ reads back.
//
// Nothing here is a language model. The drafts come from templates filled
// with deliberately weak words; the critic is a table of rules over the same
// vocabulary. It is a prototype of the mechanism, not of the poems.

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

// ---- vocabulary -----------------------------------------------------------
const NOUNS = ['moss', 'creek', 'heron', 'pine', 'frost', 'fern', 'thistle', 'moth', 'ridge', 'marsh',
  'lichen', 'owl', 'bramble', 'willow', 'hawk', 'snowmelt', 'cedar', 'fox', 'pebble', 'reed'];
const VERBS = ['whispers', 'glows', 'bends', 'sleeps', 'waits', 'drifts', 'hums', 'leans'];
const PREPS = ['beside', 'above', 'beneath', 'among'];
const TIMES = ['dawn', 'dusk', 'noon', 'midnight'];

// A weak word, what the critic says about it, and what it is revised to.
const WEAK = {
  beautiful: ['vague', ['wet', 'split', 'cold']],
  nice: ['vague', ['cold', 'bitter', 'low']],
  majestic: ['vague', ['hunched', 'bare']],
  sparkling: ['vague', ['chipped', 'slick']],
  amazing: ['vague', ['stubborn', 'slow']],
  peaceful: ['vague', ['still', 'slack']],
  nature: ['abstract', ['moss', 'bark', 'mud']],
  beauty: ['abstract', ['frost', 'salt']],
  peace: ['abstract', ['gravel', 'ash']],
  serenity: ['abstract', ['silt', 'sleet']],
  magic: ['abstract', ['mold', 'static']],
  very: ['filler', null], really: ['filler', null], truly: ['filler', null],
  gently: ['adverb', null], softly: ['adverb', null], quietly: ['adverb', null], beautifully: ['adverb', null],
  things: ['things', ['stones', 'husks', 'feathers']]
};
const NOTES = {
  // the full remarks, and the shorthand editors use in the margin:
  // wc word choice, awk awkward, wdy wordy, rep repetition, del delete
  vague: ['vague. what kind?', 'says nothing', 'every poem says this', "show me, don't tell", 'wc', 'wc?'],
  abstract: ['abstract', 'name a real thing', 'what does it look like?', 'can you touch it?', 'too big', 'show it', 'make it concrete'],
  filler: ['cut', 'filler', "why 'very'?", 'del'],
  adverb: ['let the verb do this', 'cut -ly', 'lazy'],
  things: ['which things?', 'name one'],
  repeat: ['again?', 'you said this already', 'rep'],
  phrase: ['all of this', 'too much', 'say it plainer', 'overwritten', 'awk', 'wdy'],
  // when there is no room left on the line for the note it meant to write
  short: ['this too', 'same', 'and this']
};
const ADJ = ['beautiful', 'nice', 'majestic', 'sparkling', 'amazing', 'peaceful'];
const ABS = ['nature', 'beauty', 'peace', 'serenity', 'magic'];
const FILL = ['very', 'really', 'truly'];
const ADV = ['gently', 'softly', 'quietly', 'beautifully'];

// ---- drafting -------------------------------------------------------------
function draft() {
  for (;;) {
    const n = shuffle(NOUNS);
    const lines = [
      `the ${rnd(ADJ)} ${n[0]} ${rnd(VERBS)} ${rnd(PREPS)} the ${n[1]}`,
      `${rnd(FILL)} ${rnd(ADJ)} is the ${n[2]} at ${rnd(TIMES)}`,
      `i see ${rnd(ABS)} in every ${n[3]}`,
      `the ${n[4]} ${rnd(VERBS)} ${rnd(ADV)}, ${rnd(FILL)} ${rnd(ADJ)}`,
      `things of ${n[5]} ${rnd(VERBS)} ${rnd(PREPS)} ${rnd(ABS)}`,
      `oh ${rnd(ABS)}, you ${rnd(ADV)} ${rnd(['hold', 'warm', 'bless'])} the ${n[6]}`
    ].map((l) => l.split(' '));
    const flaws = lines.flat().filter((w) => WEAK[w.replace(/,$/, '')]).length;
    if (flaws >= 8 && flaws <= 12) return { title: `${rnd(['ode to', 'on', 'notes toward'])} ${n[7]}`, lines };
  }
}
const bare = (w) => w.replace(/,$/, '');
const comma = (w) => (w.endsWith(',') ? ',' : '');

// What the critic has against the poem as it stands: a list of {li, wi, kind}.
function flaws(p) {
  const out = [], seen = {};
  p.lines.forEach((l, li) => l.forEach((w, wi) => {
    const b = bare(w);
    if (WEAK[b]) out.push({ li, wi, kind: WEAK[b][0] });
    else if (NOUNS.includes(b)) { if (seen[b]) out.push({ li, wi, kind: 'repeat' }); seen[b] = 1; }
  }));
  return out;
}
// The revision for one circled word: a replacement, or null to cut it.
function revise(p, f) {
  const w = bare(p.lines[f.li][f.wi]);
  if (f.kind === 'repeat') {
    const used = p.lines.flat().map(bare);
    return rnd(NOUNS.filter((x) => !used.includes(x)));
  }
  const alts = WEAK[w][1];
  if (!alts) return null;
  // not a word the poem already has, or that has already been proposed
  const used = p.lines.flat().map(bare).concat(p.proposed || []);
  const pick = rnd(alts.filter((x) => !used.includes(x)).length ? alts.filter((x) => !used.includes(x)) : alts);
  (p.proposed = p.proposed || []).push(pick);
  return pick;
}

// ---- the stage ------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SVG = 'http://www.w3.org/2000/svg';
const between = (a, b) => a + Math.random() * (b - a);

// Handwriting: every letter its own span, set a hair off the line and off the
// vertical, hidden until the pen gets to it. Returns the letters.
function letters(node, text) {
  node.textContent = '';
  return [...text].map((ch) => {
    const c = document.createElement('span');
    c.className = 'c hid';
    c.textContent = ch;
    c.style.transform = `translateY(${(Math.random() * 2.4 - 1.2).toFixed(1)}px) rotate(${(Math.random() * 6 - 3).toFixed(1)}deg)`;
    node.appendChild(c);
    return c;
  });
}
// A person writes unevenly: quick inside a word, a beat between words.
const hand = (ch) => (ch === ' ' ? 70 + Math.random() * 60 : 22 + Math.random() * 38);

// The marks a red pen makes, as polylines in the poem's own pixels, given the
// box (l, t, r, b) round what is marked. No two come out the same.
function loop(l, t, r, b) {
  const cx = (l + r) / 2 + between(-2, 2), cy = (t + b) / 2 + between(-1.5, 1.5);
  const rx = (r - l) / 2 + between(3, 7), ry = (b - t) / 2 + between(1, 5);
  const tilt = between(-0.16, 0.16), c = Math.cos(tilt), sn = Math.sin(tilt);
  // mostly a loop and a bit, now and then round twice
  const turn = Math.PI * 2 * (Math.random() < 0.15 ? between(1.6, 1.85) : between(1.04, 1.3));
  const a0 = between(-2.9, -1.9), amp = between(0.02, 0.09), freq = between(5, 11), drift = between(-0.04, 0.1);
  const n = 48, pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = a0 + turn * u, k = 1 + amp * Math.sin(u * freq + cx) + drift * u;
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * c - y * sn, cy + x * sn + y * c]);
  }
  return pts;
}
// Under a phrase: a quick line, a little off level and not quite straight,
// sometimes back again underneath, sometimes with a flick at the end.
function underline(l, r, base) {
  const x0 = l - between(2, 6), x1 = r + between(2, 8), slope = between(-2, 2), wave = between(0.4, 1.3);
  const y = (x) => base + slope * (x - x0) / (x1 - x0) + Math.sin(x / 9 + x0) * wave;
  const pts = [];
  for (let i = 0; i <= 24; i++) { const x = x0 + (x1 - x0) * i / 24; pts.push([x, y(x)]); }
  if (Math.random() < 0.3) {
    for (let i = 1; i <= 18; i++) { const x = x1 - (x1 - x0) * 0.9 * i / 18; pts.push([x, y(x) + 3.2]); }
  } else if (Math.random() < 0.35) {
    pts.push([x1 + 3, y(x1) - 3], [x1 + 5, y(x1) - 7]);
  }
  return pts;
}
// Through a word that is to go: struck out, sometimes with a curl after it.
function strike(l, r, mid) {
  const x0 = l - between(2, 5), x1 = r + between(2, 6), slope = between(-1.5, 1.5);
  const pts = [];
  for (let i = 0; i <= 16; i++) { const x = x0 + (x1 - x0) * i / 16; pts.push([x, mid + slope * i / 16 + between(-0.4, 0.4)]); }
  return pts;
}
// The proofreader's delete: struck through, and the line carried on up into
// the deleatur, a small loop with a tail, the old "d" for "take it out".
function deleatur(l, r, mid) {
  const pts = strike(l, r, mid), [ex, ey] = pts[pts.length - 1];
  // up and clear of the letters, into the space above the line
  const s = between(0.85, 1.15), cx = ex + 5 * s, cy = ey - 17 * s, rr = between(3.4, 4.4) * s;
  pts.push([ex + 2 * s, ey - 7 * s], [ex + 3 * s, ey - 12 * s]);
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * 0.75 + i / 16 * Math.PI * 2.1;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  pts.push([cx + rr * 0.9, cy + rr * 1.6], [cx + rr * 1.6, cy + rr * 2.3]);
  return pts;
}

// How long the act runs, start to finish, so the home timer can count it
// down: the poem ends as the timer runs out, never before or after.
export const DURATION = 95000;

export function run({ wrap, after, penUrl }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reduce ? 0.15 : 1;
  const t0 = performance.now();
  // The critic takes its time: it reads before it marks, and stops to think
  // before each mark. A poem needs room to breathe.
  const budget = DURATION;
  const left = () => budget - (performance.now() - t0);
  let dead = false;
  const nap = (ms) => sleep(ms * speed).then(() => { if (dead) throw 0; });

  // The pen is fetched while the poem is written, and shown when it is done.
  // If it cannot be (no WebGL, no network) the critic works without one.
  let pen = null;
  const penReady = penUrl ? import(penUrl).catch(() => null) : Promise.resolve(null);

  const p = draft();
  const first = p.lines.map((l) => l.join(' '));
  const notesMade = [];
  // A critic does not repeat itself: no note twice in a pass, and none it
  // has already written on this poem while it still has something new.
  const saidAll = new Set(), saidPass = new Set();

  const box = document.createElement('div');
  box.className = 'poem';
  const title = document.createElement('p');
  title.className = 'poem-title';
  title.textContent = p.title;
  box.appendChild(title);
  const lineEls = p.lines.map(() => {
    const e = document.createElement('p'); e.className = 'poem-line'; box.appendChild(e); return e;
  });
  const ink = document.createElementNS(SVG, 'svg');
  ink.setAttribute('class', 'poem-ink');
  ink.setAttribute('aria-hidden', 'true');
  box.appendChild(ink);
  const status = document.createElement('p');
  status.className = 'poem-status';
  status.textContent = ' ';
  box.appendChild(status);
  wrap.appendChild(box);
  wrap.classList.add('is-poem');

  const wordEl = {};
  const key = (li, wi) => li + ':' + wi;
  function render(li) {
    lineEls[li].textContent = '';
    const out = [];
    p.lines[li].forEach((w, wi) => {
      const s = document.createElement('span');
      s.className = 'pw';
      s.textContent = w;
      lineEls[li].appendChild(s);
      lineEls[li].appendChild(document.createTextNode(' '));
      wordEl[key(li, wi)] = s;
      out.push(s);
    });
    return out;
  }

  // ---- the page is set once, before a word shows, and never moves ----------
  // Every line is laid out (unseen) to find the longest; the type comes down
  // until that one fits with room to spare for a longer revision, and the
  // poem keeps that size and width to the end, so nothing is ever rewrapped
  // or recentred. It is set double-spaced, as a manuscript is for an editor:
  // a word struck out gets its replacement written in the space above it,
  // and where there is no margin the notes go in the space under the line.
  p.lines.forEach((_, li) => render(li).forEach((w) => w.classList.add('hid')));
  const vw = window.innerWidth;
  const room = Math.min(624, vw - 32);
  const widest = () => Math.max(title.scrollWidth, ...lineEls.map((e) => e.scrollWidth));
  let fs = parseFloat(getComputedStyle(box).fontSize);
  const need = widest() * 1.06;
  if (need > room) { fs = Math.max(14, fs * room / need); box.style.fontSize = fs + 'px'; }
  box.style.width = Math.min(room, Math.ceil(widest() * 1.06)) + 'px';
  box.classList.add('ms');
  const margin = (vw - box.offsetWidth) / 2 - 28 >= 190;

  async function write() {
    box.classList.add('on');
    await nap(700);
    for (let li = 0; li < p.lines.length; li++) {
      for (const w of lineEls[li].querySelectorAll('.pw')) { w.classList.remove('hid'); await nap(between(130, 210)); }
      await nap(between(420, 700));
    }
  }

  // Where a set of words sits, in the poem's own pixels.
  function spanOf(els) {
    const b = box.getBoundingClientRect();
    const rs = els.map((e) => e.getBoundingClientRect());
    return { l: Math.min(...rs.map((r) => r.left)) - b.left, r: Math.max(...rs.map((r) => r.right)) - b.left,
      t: Math.min(...rs.map((r) => r.top)) - b.top, b: Math.max(...rs.map((r) => r.bottom)) - b.top, bx: b };
  }

  // Draws a polyline in red, and gives back how to animate it and where the
  // pen's tip goes on the screen.
  function ink_(pts) {
    let d = '';
    pts.forEach((q, i) => { d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); });
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'pen');
    path.style.strokeWidth = between(1.6, 2.2).toFixed(2);
    ink.appendChild(path);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const b = box.getBoundingClientRect();
    const ms = Math.min(700, 180 + len * 2.4);
    const play = () => path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: ms * speed + 1, easing: 'linear', fill: 'forwards' });
    return { path, pts: pts.map((q) => [b.left + q[0], b.top + q[1]]), ms, play };
  }

  // ---- notes ------------------------------------------------------------------
  // Each line's note row (or the margin) knows what is already written in it,
  // and a note goes only where it fits whole and on the screen.
  const rows = {};
  let marginLow = -Infinity;
  function place(n, li, sp) {
    const b = box.getBoundingClientRect(), lr = lineEls[li].getBoundingClientRect();
    const nw = n.offsetWidth, nh = n.offsetHeight;
    if (margin) {
      const y = Math.max(lr.top - b.top - 2, marginLow + 4);
      const x = b.width + 28;
      if (b.left + x + nw > vw - 12) return false;
      marginLow = y + nh;
      n.style.left = x + 'px'; n.style.top = y + 'px';
      return true;
    }
    // under the line, starting under the marked words
    return inRow(n, li, sp.b + fs * 0.08, sp.l - 2);
  }
  // Above the line, centred over the marked words: where a replacement goes.
  function above(n, li, sp) {
    const b = box.getBoundingClientRect(), lr = lineEls[li].getBoundingClientRect();
    return inRow(n, li - 1, lr.top - b.top - n.offsetHeight + fs * 0.14, (sp.l + sp.r) / 2 - n.offsetWidth / 2);
  }
  // The space under line `gap` (-1 is under the title): put n at height y,
  // as near x as it fits without touching what is there, on the screen.
  function inRow(n, gap, y, x0) {
    const b = box.getBoundingClientRect(), nw = n.offsetWidth;
    const lo = 10 - b.left, hi = vw - 10 - b.left - nw;
    if (hi < lo) return false;
    const taken = rows[gap] || (rows[gap] = []);
    const free = (x) => taken.every((t) => x + nw + 10 <= t[0] || x >= t[1] + 10);
    const want = Math.max(lo, Math.min(hi, x0));
    const tries = [want];
    taken.forEach((t) => { tries.push(t[1] + 10, t[0] - 10 - nw); });
    let x = null;
    for (const c of tries.sort((a, z) => Math.abs(a - want) - Math.abs(z - want))) {
      if (c >= lo && c <= hi && free(c)) { x = c; break; }
    }
    if (x == null) return false;
    taken.push([x, x + nw]);
    n.style.left = x + 'px'; n.style.top = y + 'px';
    return true;
  }

  async function note(li, sp, kind) {
    const n = document.createElement('span');
    n.className = 'poem-note';
    n.style.visibility = 'hidden';
    box.appendChild(n);
    // what it means to say, and failing room for that, something shorter
    const fresh = (w) => !saidPass.has(w) && !saidAll.has(w), again = (w) => !saidPass.has(w);
    const pool = shuffle(NOTES[kind]);
    const wants = [...pool.filter(fresh), ...pool.filter(fresh).sort((a, b) => a.length - b.length),
      ...shuffle(NOTES.short).filter(fresh), ...pool.filter(again), ...NOTES.short.filter(again)];
    let text = null;
    for (const w of wants) {
      n.textContent = w;
      if (place(n, li, sp)) { text = w; break; }
    }
    if (text == null) { n.remove(); return null; }
    saidAll.add(text); saidPass.add(text);
    await handwrite(n, text);
    return { n, text };
  }

  // Writes `text` into n, letter by letter, the pen's tip running along
  // under it. A hand tilts a short note more than a long one; a long one
  // tilted as far would run its far end into the next line.
  async function handwrite(n, text) {
    n.style.setProperty('--rot', (between(-1, 1) * Math.min(2, 160 / n.offsetWidth)).toFixed(2) + 'deg');
    const cs = letters(n, text);
    n.style.visibility = '';
    if (pen) {
      const nr = n.getBoundingClientRect();
      const y = nr.top + nr.height * 0.78;
      const gaps = cs.map((c) => hand(c.textContent));
      const total = gaps.reduce((a, g) => a + g, 0);
      await pen.glide(nr.left, y, 380 * speed + 1);
      if (dead) throw 0;
      const typing = (async () => { for (let i = 0; i < cs.length; i++) { cs[i].classList.remove('hid'); await nap(gaps[i]); } })();
      await Promise.all([typing, pen.write(nr.left, y, nr.left + nr.width, total * speed + 1)]);
    } else {
      for (const c of cs) { c.classList.remove('hid'); await nap(hand(c.textContent) * 0.8); }
    }
  }

  // ---- the critic ----------------------------------------------------------------
  // What is wrong, gathered into marks: next-door words that are both weak
  // are one phrase.
  function marks() {
    const out = [];
    flaws(p).forEach((f) => {
      const g = out[out.length - 1];
      if (g && g.li === f.li && g.fs[g.fs.length - 1].wi === f.wi - 1 && f.kind !== 'repeat' && g.fs[0].kind !== 'repeat') g.fs.push(f);
      else out.push({ li: f.li, fs: [f] });
    });
    return out;
  }
  // What the pen does about it, in the editor's grammar:
  //   delete   struck through with the deleatur's curl; that is the whole
  //            message, so it mostly goes without a note
  //   replace  struck through, the better word written in above it
  //   circle / underline   look at this; a remark or shorthand in the
  //            margin, or nothing, for the poet to work out
  function move(g) {
    const one = g.fs.length === 1, k = g.fs[0].kind;
    if (one && (k === 'filler' || k === 'adverb')) return { how: 'delete', say: Math.random() < 0.2 };
    if (one && g.fs[0].rep && (k === 'vague' || k === 'abstract' || k === 'things') && Math.random() < 0.35) return { how: 'replace', say: false };
    let how = Math.random() < (one ? 0.5 : 0.35) ? 'circle' : 'underline';
    // never the same shape three times running
    if (lastHows[0] === how && lastHows[1] === how) how = how === 'circle' ? 'underline' : 'circle';
    return { how, say: Math.random() < (one ? 0.65 : 0.8) };
  }
  const lastHows = [];
  async function draw(pts, quick, how) {
    const m = ink_(pts);
    m.path.dataset.how = how;
    if (pen) {
      await pen.glide(m.pts[0][0], m.pts[0][1], (quick ? 240 : 360) * speed + 1);
      if (dead) throw 0;
      m.play();
      await pen.stroke(m.pts, m.ms * speed + 1);
    } else {
      m.play();
      await nap(m.ms);
    }
    return m;
  }
  // Reading: the pen held just off the page, drifting slowly under a line
  // the way a finger keeps the place. It does not trace everything: some
  // lines it follows most of the way, some it trails off from, and now and
  // then it skips one on its way down. Without a pen, the same time passes.
  function lineSpan(li) {
    const ws = [...lineEls[li].querySelectorAll('.pw')];
    if (!ws.length) return null;
    const a = ws[0].getBoundingClientRect(), z = ws[ws.length - 1].getBoundingClientRect();
    return { x0: a.left, x1: z.right, y: a.bottom + 2 };
  }
  async function read(lis, skim) {
    for (let i = 0; i < lis.length; i++) {
      const sp = lineSpan(lis[i]);
      if (!sp) continue;
      // on a long read, a line now and then gets only a glance on the way past
      if (skim && i > 0 && i < lis.length - 1 && Math.random() < 0.25) continue;
      const w = sp.x1 - sp.x0, reach = sp.x0 + w * (Math.random() < 0.65 ? between(0.85, 1) : between(0.45, 0.75));
      if (pen) {
        // back to the start of the line, quicker, as eyes return
        await pen.drift([[sp.x0 + between(-6, 10), sp.y + between(-2, 3)]], 420 * (1 / speed), 22);
        if (dead) throw 0;
        // then slowly along it, the line not quite level
        const mid = [(sp.x0 + reach) / 2, sp.y + between(-3, 3)];
        await pen.drift([mid, [reach, sp.y + between(-3, 4)]], between(95, 130) / speed, 18);
        if (dead) throw 0;
      } else await nap((reach - sp.x0) / 110 * 1000);
      await nap(between(150, 400));
    }
  }
  // Considering: over the word, still, then a small lift away while it
  // makes up its mind.
  async function consider(sp, quick) {
    const b = box.getBoundingClientRect();
    const x = b.left + (sp.l + sp.r) / 2, y = b.top + sp.b;
    const ms = quick ? between(250, 500) : between(700, 1500);
    if (pen) {
      await pen.hover(x, y, 380 * speed + 1, 24);
      if (dead) throw 0;
      await pen.hold(ms * 0.65 * speed + 1);
      if (dead) throw 0;
      if (!quick && Math.random() < 0.5) {
        await pen.hover(x + between(14, 40), y - between(10, 30), 300 * speed + 1, 40);
        if (dead) throw 0;
        await pen.hold(ms * 0.35 * speed + 1);
      }
    } else await nap(ms);
  }
  async function critique(round) {
    saidPass.clear();
    let gs = marks();
    if (!gs.length) return [];
    // a critic does not catch everything at once; short of time, it stops
    // explaining and just marks
    const quick = left() < 15000;
    gs = shuffle(gs).slice(0, quick ? 6 : 4).sort((a, b) => a.li - b.li || a.fs[0].wi - b.fs[0].wi);
    status.textContent = round === 1 ? 'the critic' : 'the critic, again';
    status.classList.add('on');
    // the whole poem the first time; after that a line or two, now and then
    if (round === 1) await read(p.lines.map((_, i) => i), true);
    else if (!quick && Math.random() < 0.6) await read(shuffle(p.lines.map((_, i) => i)).slice(0, 1 + (Math.random() < 0.4)).sort());
    const done = [];
    for (const g of gs) {
      if (left() < 11000) break;
      // what each word becomes is settled now, so a word the critic writes
      // in is the word the poem takes
      g.fs.forEach((f) => { f.rep = revise(p, f); });
      const els = g.fs.map((f) => wordEl[key(f.li, f.wi)]);
      const sp = spanOf(els), word = els.map((e) => e.textContent).join(' ');
      // over the word first, and a while there before deciding
      await consider(sp, quick);
      const h = sp.b - sp.t, mv = move(g);
      lastHows.unshift(mv.how); lastHows.length = 2;
      const inks = [];
      if (mv.how === 'delete') inks.push(await draw(deleatur(sp.l, sp.r, sp.t + h * 0.56), quick, 'delete'));
      else if (mv.how === 'replace') inks.push(await draw(strike(sp.l, sp.r, sp.t + h * 0.56), quick, 'replace'));
      else if (mv.how === 'circle') inks.push(await draw(loop(sp.l, sp.t, sp.r, sp.b), quick, 'circle'));
      else inks.push(await draw(underline(sp.l, sp.r, sp.b - h * 0.12), quick, 'underline'));
      const extra = [];
      if (mv.how === 'replace' && !quick) {
        const ins = document.createElement('span');
        ins.className = 'poem-note';
        ins.style.visibility = 'hidden';
        ins.textContent = bare(g.fs[0].rep);
        box.appendChild(ins);
        if (above(ins, g.li, sp)) {
          await nap(80);
          await handwrite(ins, ins.textContent);
          extra.push(ins);
          notesMade.push({ w: word.replace(/,/g, ''), n: '→ ' + ins.textContent });
        } else ins.remove();
      } else if (mv.say && !quick) {
        await nap(100);
        const n = await note(g.li, sp, g.fs.length > 1 ? 'phrase' : g.fs[0].kind);
        if (n) { extra.push(n.n); notesMade.push({ w: word.replace(/,/g, ''), n: n.text }); }
      }
      done.push({ g, inks, extra });
      await nap(quick ? 80 : 160);
    }
    return done;
  }

  // The poem as revised: marks and old words fade together, the line is set
  // again with its new words popping in where the old ones were, and the
  // words that stay slide over to where they now belong.
  async function rewrite(done) {
    await nap(450);
    const byLine = {};
    done.forEach((d) => d.g.fs.forEach((f) => { (byLine[f.li] = byLine[f.li] || []).push(f); }));
    done.forEach((d) => { d.inks.forEach((m) => m.path.classList.add('gone')); d.extra.forEach((e) => e.classList.add('gone')); });
    Object.values(byLine).flat().forEach((f) => wordEl[key(f.li, f.wi)].classList.add('swap'));
    await nap(320);
    for (const li of Object.keys(byLine).map(Number)) {
      const line = p.lines[li], fsx = byLine[li].sort((a, b) => a.wi - b.wi);
      const olds = [...lineEls[li].querySelectorAll('.pw')];
      const marked = new Set(fsx.map((f) => f.wi));
      const keepOld = olds.filter((_, i) => !marked.has(i)).map((e) => e.getBoundingClientRect().left);
      const reps = new Map(), cuts = [];
      fsx.forEach((f) => { const r = f.rep === undefined ? revise(p, f) : f.rep; if (r == null) cuts.push(f.wi); else reps.set(f.wi, r); });
      reps.forEach((r, wi) => { line[wi] = r + comma(line[wi]); });
      const fresh = new Set();
      reps.forEach((_, wi) => fresh.add(wi - cuts.filter((c) => c < wi).length));
      cuts.sort((a, b) => b - a).forEach((wi) => {
        const tail = comma(line[wi]);
        line.splice(wi, 1);
        if (tail && wi > 0 && line.length) line[wi - 1] = bare(line[wi - 1]) + tail;
      });
      const now = render(li);
      const keepNew = now.filter((_, i) => !fresh.has(i));
      keepNew.forEach((e, i) => {
        const dx = (keepOld[i] ?? e.getBoundingClientRect().left) - e.getBoundingClientRect().left;
        if (Math.abs(dx) > 0.5) e.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }],
          { duration: 380 * speed + 1, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      });
      now.forEach((e, i) => { if (fresh.has(i)) e.classList.add('hid'); });
      (async () => { for (const [i, e] of now.entries()) if (fresh.has(i)) { await nap(60); e.classList.remove('hid'); } })().catch(() => {});
    }
    await nap(600);
    done.forEach((d) => { d.inks.forEach((m) => m.path.remove()); d.extra.forEach((e) => e.remove()); });
    Object.keys(rows).forEach((k) => delete rows[k]);
    marginLow = -Infinity;
    status.classList.remove('on');
    return Object.keys(byLine).map(Number);
  }

  function log(rounds) {
    const entry = { at: new Date().toISOString(), title: p.title, first, final: p.lines.map((l) => l.join(' ')), rounds, notes: notesMade };
    try {
      const k = 'jh.poems', all = JSON.parse(localStorage.getItem(k) || '[]');
      all.unshift(entry);
      localStorage.setItem(k, JSON.stringify(all.slice(0, 300)));
      return all.length;
    } catch (e) { return 0; }
  }

  async function go() {
    await write();
    // the critic's handwriting must be in before anything is measured
    try { await document.fonts.load('1em "Critic Hand"'); } catch (e) {}
    // a breath with the poem whole before the critic comes
    await nap(2200);
    // the critic's pen shows up
    const mod = await penReady;
    if (dead) return;
    if (mod && mod.makePen) {
      pen = mod.makePen();
      if (pen) {
        const b = box.getBoundingClientRect();
        await pen.enter(b.left + b.width * 0.7, b.top - 30, 900 * speed + 1);
      }
    }
    // the poem left alone a moment before anyone touches it
    await nap(1600);
    let round = 0;
    while (left() > 15000) {
      await nap(between(900, 1500));
      round++;
      const done = await critique(round);
      if (!done.length) break;
      const changed = await rewrite(done);
      // checks what was changed, if there is time to
      if (left() > 20000) await read(changed.sort((a, b) => a - b).slice(0, 2));
      if (!flaws(p).length) break;
    }
    // finished, or out of time: the critic's last word, under the poem
    await nap(400);
    const end = document.createElement('span');
    end.className = 'poem-note final';
    end.style.setProperty('--rot', '-3deg');
    box.appendChild(end);
    if (pen) pen.leave(700 * speed + 1);
    const verdict = flaws(p).length ? 'out of time. print it.' : round > 1 ? 'better. print it.' : 'fine.';
    for (const c of letters(end, verdict)) { c.classList.remove('hid'); await nap(hand(c.textContent) + 15); }
    const count = log(round);
    status.textContent = '';
    const a = document.createElement('a');
    a.href = '/poems/'; a.textContent = count ? 'added to the log (' + count + ')' : 'could not save to the log';
    status.appendChild(a);
    status.classList.add('on');
    // the verdict stands until the time is up
    await nap(reduce ? 4000 : Math.max(4000, left() - 900));
    finish(false);
  }

  function finish(aborted) {
    if (dead) return;
    dead = true;
    if (pen) { const pp = pen; pen = null; pp.leave(500).then(() => pp.destroy(), () => pp.destroy()); }
    document.removeEventListener('egg-revealed', onReveal);
    box.classList.add('out');
    // the statement comes back only once the poem has gone, never under it
    setTimeout(() => { box.remove(); wrap.classList.remove('is-poem'); if (!aborted) after(); }, 900);
  }
  const onReveal = () => finish(true);
  document.addEventListener('egg-revealed', onReveal);
  go().catch(() => {});
  return { stop: () => finish(true) };
}
