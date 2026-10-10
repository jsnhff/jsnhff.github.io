// Act three of the home page: a poem about nature writes itself, a critic
// circles the weak words in red pen and writes in the margin, the poem is
// revised, and round after round it improves until it is finished (or the
// thirty seconds are up). The finished poem goes into a log kept in this
// browser, which /poems/ reads back.
//
// The poem and the critic's part are a script: a draft, rounds of marks
// (what to strike, replace, circle or underline, and what to write in the
// margin) with the poem as it stands after each, and a last word. The
// scripts in js/poem-corpus.json were written ahead of time by Claude; a
// language model asked for the same shape can write them live later, and
// _poems/check.mjs checks either. With no script (the corpus did not load)
// the old way still works: drafts from templates of deliberately weak words,
// and a critic that is a table of rules over the same vocabulary.

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

// ---- vocabulary -----------------------------------------------------------
const NOUNS = ['moss', 'creek', 'heron', 'pine', 'frost', 'fern', 'thistle', 'moth', 'ridge', 'marsh',
  'lichen', 'owl', 'bramble', 'willow', 'hawk', 'snowmelt', 'cedar', 'fox', 'pebble', 'reed'];
// Nouns you cannot count (no "every moss"), and the verbs in both numbers:
// a fox waits, things wait.
const MASS = ['moss', 'frost', 'lichen', 'snowmelt'];
const COUNT = NOUNS.filter((x) => !MASS.includes(x));
const VERB = ['whisper', 'glow', 'bend', 'sleep', 'wait', 'drift', 'hum', 'lean'];
const VERBS = VERB.map((v) => v + 's');
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
    // the one after "every" has to be countable
    const every = rnd(COUNT), n = shuffle(NOUNS.filter((x) => x !== every));
    const lines = [
      `the ${rnd(ADJ)} ${n[0]} ${rnd(VERBS)} ${rnd(PREPS)} the ${n[1]}`,
      `${rnd(FILL)} ${rnd(ADJ)} is the ${n[2]} at ${rnd(TIMES)}`,
      `i see ${rnd(ABS)} in every ${every}`,
      `the ${n[4]} ${rnd(VERBS)} ${rnd(ADV)}, ${rnd(FILL)} ${rnd(ADJ)}`,
      `things of the ${n[5]} ${rnd(VERB)} ${rnd(PREPS)} ${rnd(ABS)}`,
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
    const used = p.lines.flat().map(bare).concat(p.proposed || []);
    // after "every", only a noun that can be counted
    const pool = p.lines[f.li][f.wi - 1] === 'every' ? COUNT : NOUNS;
    const pick = rnd(pool.filter((x) => !used.includes(x)));
    (p.proposed = p.proposed || []).push(pick);
    return pick;
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
// A person writes by hand at a few letters a second at most (sustained
// adult handwriting runs nearer one or two), unevenly: some letters quicker,
// a beat between words.
const hand = (ch) => (ch === ' ' ? 280 + Math.random() * 220 : 230 + Math.random() * 200);
// A letter coming in as ink does, from its left edge to its right, over the
// time the hand takes to form it.
function inkIn(c, ms) {
  c.classList.remove('hid');
  c.animate([{ clipPath: 'inset(-30% 100% -30% -10%)' }, { clipPath: 'inset(-30% -10% -30% -10%)' }],
    { duration: Math.max(1, ms * 0.9), easing: 'ease-out', fill: 'backwards' });
}

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
export const DURATION = 115000;

// One script from the corpus, not one this browser has seen lately.
export function choose(corpus) {
  if (!Array.isArray(corpus) || !corpus.length) return null;
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem('jh.poems.seen') || '[]'); } catch (e) {}
  let pool = corpus.filter((c) => !seen.includes(c.title));
  if (!pool.length) { seen = []; pool = corpus; }
  const pick = rnd(pool);
  try { localStorage.setItem('jh.poems.seen', JSON.stringify(seen.concat(pick.title).slice(-Math.max(1, corpus.length - 1)))); } catch (e) {}
  return pick;
}

// Words as they are compared between a line and its revision: lower case,
// without the punctuation round them.
const plain = (w) => w.toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '');
// Where a run of words starts in a line, or -1.
function findRun(line, text) {
  const a = line.map(plain), b = text.split(/\s+/).map(plain).filter(Boolean);
  for (let i = 0; i + b.length <= a.length; i++) if (b.every((w, j) => a[i + j] === w)) return [i, b.length];
  return null;
}
// Which words of a line survive into its revision: a longest common
// subsequence, as pairs of indices.
function keepPairs(a, b) {
  const A = a.map(plain), B = b.map(plain), n = A.length, m = B.length;
  const t = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = A[i] === B[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (A[i] === B[j]) { out.push([i, j]); i++; j++; } else if (t[i + 1][j] >= t[i][j + 1]) i++; else j++;
  }
  return out;
}

export function run({ wrap, after, penUrl, script, extend }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reduce ? 0.15 : 1;
  const t0 = performance.now();
  // The critic takes its time: it reads before it marks, and stops to think
  // before each mark. A poem needs room to breathe.
  let budget = DURATION;
  const left = () => budget - (performance.now() - t0);
  let dead = false;
  const nap = (ms) => sleep(ms * speed).then(() => { if (dead) throw 0; });

  // The pen is fetched while the poem is written, and shown when it is done.
  // If it cannot be (no WebGL, no network) the critic works without one.
  let pen = null;
  const penReady = penUrl ? import(penUrl).catch(() => null) : Promise.resolve(null);

  const p = script ? { title: script.title, lines: script.draft.map((l) => l.split(' ')) } : draft();
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
  // the widest line in any version of the poem, so no revision outgrows it
  const probe = document.createElement('p');
  probe.className = 'poem-line';
  probe.style.cssText = 'position:absolute;visibility:hidden';
  box.appendChild(probe);
  const versions = script ? script.rounds.flatMap((r) => r.after) : [];
  const widest = () => Math.max(title.scrollWidth, ...lineEls.map((e) => e.scrollWidth),
    ...versions.map((t) => { probe.textContent = t; return probe.scrollWidth; }));
  let fs = parseFloat(getComputedStyle(box).fontSize);
  const need = widest() * 1.06;
  if (need > room) { fs = Math.max(14, fs * room / need); box.style.fontSize = fs + 'px'; }
  box.style.width = Math.min(room, Math.ceil(widest() * 1.06)) + 'px';
  probe.remove();
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
  function ink_(pts, cls = '', dotted = false) {
    let d = '';
    if (dotted) {
      // a dotted line, the editor's "leave it": short dashes along the run
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0);
        for (let u = 0; u < L; u += 7) {
          const a = u / L, b = Math.min(1, (u + 0.8) / L);
          d += 'M' + (x0 + (x1 - x0) * a).toFixed(1) + ' ' + (y0 + (y1 - y0) * a).toFixed(1) + 'L' + (x0 + (x1 - x0) * b).toFixed(1) + ' ' + (y0 + (y1 - y0) * b).toFixed(1);
        }
      }
    } else pts.forEach((q, i) => { d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); });
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'pen' + (cls ? ' ' + cls : ''));
    path.style.strokeWidth = between(1.6, 2.2).toFixed(2);
    ink.appendChild(path);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const b = box.getBoundingClientRect();
    const ms = Math.min(700, 180 + len * 2.4);
    // Hidden until the pen starts it: a dash of no length still draws its
    // round cap, a red dot waiting where the mark will begin.
    path.style.visibility = 'hidden';
    const play = () => {
      path.style.visibility = '';
      return path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: ms * speed + 1, easing: 'linear', fill: 'forwards' });
    };
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

  async function note(li, sp, kind, said, who = pen, cls = '') {
    const n = document.createElement('span');
    n.className = 'poem-note' + (cls ? ' ' + cls : '');
    n.style.visibility = 'hidden';
    box.appendChild(n);
    // what it means to say, and failing room for that, something shorter
    const fresh = (w) => !saidPass.has(w) && !saidAll.has(w), again = (w) => !saidPass.has(w);
    const pool = shuffle(NOTES[kind] || []);
    const wants = said ? [said] : [...pool.filter(fresh), ...pool.filter(fresh).sort((a, b) => a.length - b.length),
      ...shuffle(NOTES.short).filter(fresh), ...pool.filter(again), ...NOTES.short.filter(again)];
    let text = null;
    for (const w of wants) {
      n.textContent = w;
      if (place(n, li, sp)) { text = w; break; }
    }
    if (text == null) { n.remove(); return null; }
    saidAll.add(text); saidPass.add(text);
    await handwrite(n, text, who);
    return { n, text };
  }

  // Writes `text` into n, letter by letter, the pen's tip running along
  // under it. A hand tilts a short note more than a long one; a long one
  // tilted as far would run its far end into the next line.
  async function handwrite(n, text, pen = penA()) {
    n.style.setProperty('--rot', (between(-1, 1) * Math.min(2, 160 / n.offsetWidth)).toFixed(2) + 'deg');
    const cs = letters(n, text);
    n.style.visibility = '';
    const gaps = cs.map((c) => hand(c.textContent));
    if (pen) {
      const r0 = cs[0].getBoundingClientRect();
      await pen.glide(r0.left, r0.bottom - r0.height * 0.22, 380 * speed + 1);
      if (dead) throw 0;
      for (let i = 0; i < cs.length; i++) {
        const r = cs[i].getBoundingClientRect(), base = r.bottom - r.height * 0.22, ms = gaps[i] * speed + 1;
        if (cs[i].textContent === ' ') {
          const nx = cs[i + 1] ? cs[i + 1].getBoundingClientRect().left : r.right;
          cs[i].classList.remove('hid');
          await pen.skip(nx, base, ms);
        } else {
          inkIn(cs[i], ms);
          await pen.letter(r.left, r.right, base, r.height * 0.45, ms);
        }
        if (dead) throw 0;
      }
    } else {
      for (let i = 0; i < cs.length; i++) { inkIn(cs[i], gaps[i] * speed); await nap(gaps[i]); }
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
    if (g.how) return { how: g.how, say: !!g.note };
    const one = g.fs.length === 1, k = g.fs[0].kind;
    if (one && (k === 'filler' || k === 'adverb')) return { how: 'delete', say: Math.random() < 0.2 };
    if (one && g.fs[0].rep && (k === 'vague' || k === 'abstract' || k === 'things') && Math.random() < 0.35) return { how: 'replace', say: false };
    let how = Math.random() < (one ? 0.5 : 0.35) ? 'circle' : 'underline';
    // never the same shape three times running
    if (lastHows[0] === how && lastHows[1] === how) how = how === 'circle' ? 'underline' : 'circle';
    return { how, say: Math.random() < (one ? 0.65 : 0.8) };
  }
  const lastHows = [];
  async function draw(pts, quick, how, pen = penA(), cls = '', dotted = false) {
    const m = ink_(pts, cls, dotted);
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
  // ---- a second critic --------------------------------------------------------
  // "add critic", under the poem, in the timer's grey. Pressed, a second pen
  // comes in (a green Flair, in the left hand) and from then on the two talk:
  // a greeting, a few words about each round before it is revised, and in
  // the last round the second sometimes wins a line back.
  const penA = () => pen;
  let penB = null, wantB = false, joined = false, penMod = null;
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'poem-add';
  addBtn.setAttribute('aria-label', 'add a critic');
  addBtn.addEventListener('click', () => { if (wantB) return; wantB = true; addBtn.classList.remove('on'); addBtn.disabled = true; });
  document.body.appendChild(addBtn);
  function offerB() {
    if (wantB || dead || !pen) return;
    addBtn.classList.add('on');
  }
  const HELLO = [
    [['b', 'hi. what are we reading?'], ['a', 'a first draft.'], ['b', 'oh good.']],
    [['b', 'room for one more?'], ['a', 'bring your own pen.']],
    [['b', 'hello. am i late?'], ['a', 'just in time. it\'s bad.']]
  ];
  // Speech, in the coin's bubbles, hung from the top of whichever pen says it.
  async function say(who, text) {
    const p = who === 'b' ? penB : pen;
    const el = document.createElement('div');
    el.className = 'penny-bubble talk' + (who === 'b' ? ' green' : '');
    el.textContent = text;
    document.body.appendChild(el);
    const place = () => {
      const t = p ? p.top : [window.innerWidth / 2, window.innerHeight / 2];
      // out on the pen's own side when it fits; when the pen is at the edge
      // of the screen, the other way, so the tail still points at the pen
      const w = el.offsetWidth, h = el.offsetHeight;
      let right = !p || p.side > 0;
      if (right && t[0] + 6 + w > window.innerWidth - 8) right = false;
      else if (!right && t[0] - w - 6 < 8) right = true;
      el.classList.toggle('flip', !right);
      let x = right ? t[0] + 6 : t[0] - w - 6;
      x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
      el.style.translate = `${Math.round(x)}px ${Math.round(Math.max(8, t[1] - h - 8))}px`;
    };
    place();
    const ms = (900 + text.length * 55) * speed;
    if (p) await p.hold(ms); else await nap(900 + text.length * 55);
    place();
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
    await nap(260);
  }
  async function talk(lines) {
    for (const [who, text] of lines || []) { if (dead) throw 0; await say(who, text); }
  }
  // Two hands, one page: the pens take turns. The one not working rests
  // off the poem on its own hand's side, lifted, so they never cross: in the
  // side margin when there is room, else below the poem's corner, the Bic
  // to the right, the Flair to the left, each leaning away from the other.
  function restAt(q) {
    const b = box.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    const right = q.side > 0, room = right ? vw - b.right : b.left;
    if (room >= 110) return [right ? b.right + 30 : b.left - 30, b.top + b.height * (right ? 0.4 : 0.6)];
    // on a phone: just under the poem, in from the edge so the whole pen
    // shows, above the nav
    const nav = document.querySelector('.navwrap nav');
    const floor = Math.min(vh, nav ? nav.getBoundingClientRect().top : vh) - 14;
    return [right ? vw - 64 : 60, Math.min(floor, b.bottom + 70)];
  }
  async function rest(q, ms = 650) {
    if (!q || dead) return;
    const [x, y] = restAt(q);
    await q.hover(x, y, ms * speed + 1, 34);
  }
  // Brought in at the next moment the first critic is between things.
  async function maybeJoin() {
    if (!wantB || joined || dead) return;
    joined = true;
    if (!penMod || !penMod.makePen || !pen) return;
    penB = penMod.makePen('flair');
    if (!penB) return;
    // there is more to do now: the act, and the timer, run longer
    budget += 30000;
    if (extend) extend(30000);
    // it comes in to its resting place, and the first steps back off the
    // poem to say hello
    const [x, y] = restAt(penB);
    await Promise.all([penB.enter(x, y, 900 * speed + 1), rest(pen, 700)]);
    if (dead) throw 0;
    status.textContent = status.textContent.replace(/^the critic /, 'the critics ');
    await talk(rnd(HELLO));
  }
  // The second critic's stet: a dotted line under the words the first
  // marked, "stet" beside it in green, and the line kept as it was.
  async function stet(li, text) {
    const at = findRun(p.lines[li] || [], text);
    if (!at || !penB) return [];
    const els = []; for (let k = 0; k < at[1]; k++) els.push(wordEl[key(li, at[0] + k)]);
    const sp = spanOf(els), h = sp.b - sp.t;
    // one row of dots, just under the words
    const y = sp.b - h * 0.04;
    const m = await draw([[sp.l - 2, y], [(sp.l + sp.r) / 2, y + between(-0.6, 0.6)], [sp.r + 2, y + between(-1, 1)]], false, 'stet', penB, 'green', true);
    const n = await note(li, sp, 'filler', 'stet', penB, 'green');
    return [m, n && n.n].filter(Boolean);
  }

  // The marks a script gives for a round, found in the poem as it stands.
  function scripted(round) {
    const r = script.rounds[round - 1];
    if (!r) return [];
    return r.marks.map((m) => {
      const at = findRun(p.lines[m.line] || [], m.text);
      if (!at) return null;
      const fs = [];
      for (let k = 0; k < at[1]; k++) fs.push({ li: m.line, wi: at[0] + k });
      return { li: m.line, fs, how: m.how, note: m.note, rep: m.rep };
    }).filter(Boolean);
  }
  async function critique(round) {
    saidPass.clear();
    let gs = script ? scripted(round) : marks();
    if (!gs.length) return [];
    // a critic does not catch everything at once; short of time, it stops
    // explaining and just marks
    let quick = left() < 15000;
    if (!script) gs = shuffle(gs).slice(0, quick ? 6 : 4);
    gs.sort((a, b) => a.li - b.li || a.fs[0].wi - b.fs[0].wi);
    // where the performance is: which round, of how many
    const WORDS = ['one', 'two', 'three', 'four', 'five'];
    const of = script ? ' of ' + (WORDS[script.rounds.length - 1] || script.rounds.length) : '';
    status.textContent = (joined && penB ? 'the critics' : 'the critic') + ' \u00b7 round ' + (WORDS[round - 1] || round) + of;
    status.classList.add('on');
    offerB();
    await maybeJoin();
    // the whole poem the first time; after that a line or two, now and then
    if (round === 1) await read(p.lines.map((_, i) => i), true);
    else if (!quick && Math.random() < 0.6) await read(shuffle(p.lines.map((_, i) => i)).slice(0, 1 + (Math.random() < 0.4)).sort());
    const done = [];
    for (const g of gs) {
      await maybeJoin();
      if (left() < 11000) break;
      // the clock is checked before every mark: short of time, it marks
      // without stopping to explain
      quick = quick || left() < 22000;
      // what each word becomes is settled now, so a word the critic writes
      // in is the word the poem takes
      if (!script) g.fs.forEach((f) => { f.rep = revise(p, f); });
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
        ins.textContent = script ? g.rep : bare(g.fs[0].rep);
        box.appendChild(ins);
        if (above(ins, g.li, sp)) {
          await nap(80);
          await handwrite(ins, ins.textContent);
          extra.push(ins);
          notesMade.push({ w: word.replace(/,/g, ''), n: '→ ' + ins.textContent });
        } else ins.remove();
      } else if (mv.say && !quick) {
        await nap(100);
        const n = await note(g.li, sp, g.fs.length > 1 ? 'phrase' : g.fs[0].kind, g.note);
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

  // A scripted revision: each line that changed is set again. The words it
  // keeps slide from where they were to where they now sit; the rest of
  // the old line fades as the marks do, and the new words come in after,
  // one by one, as the poet writes them.
  async function retell(next, done) {
    await nap(450);
    const plans = [];
    next.forEach((text, li) => {
      const now = text.split(' ');
      if (now.join(' ') === p.lines[li].join(' ')) return;
      plans.push({ li, now, pairs: keepPairs(p.lines[li], now) });
    });
    done.forEach((d) => { d.inks.forEach((m) => m.path.classList.add('gone')); d.extra.forEach((e) => e.classList.add('gone')); });
    plans.forEach((pl) => {
      const kept = new Set(pl.pairs.map((q) => q[0]));
      lineEls[pl.li].querySelectorAll('.pw').forEach((e, i) => { if (!kept.has(i)) e.classList.add('swap'); });
    });
    await nap(380);
    let longest = 0;
    for (const pl of plans) {
      const olds = [...lineEls[pl.li].querySelectorAll('.pw')];
      const from = new Map(pl.pairs.map(([i, j]) => [j, olds[i].getBoundingClientRect().left]));
      p.lines[pl.li] = pl.now;
      const els = render(pl.li), fresh = [];
      els.forEach((e, j) => {
        if (!from.has(j)) { e.classList.add('hid'); fresh.push(e); return; }
        const dx = from.get(j) - e.getBoundingClientRect().left;
        if (Math.abs(dx) > 0.5) e.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }],
          { duration: 420 * speed + 1, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      });
      longest = Math.max(longest, fresh.length);
      (async () => { for (const e of fresh) { await nap(between(110, 170)); e.classList.remove('hid'); } })().catch(() => {});
    }
    await nap(600 + longest * 150);
    done.forEach((d) => { d.inks.forEach((m) => m.path.remove()); d.extra.forEach((e) => e.remove()); });
    Object.keys(rows).forEach((k) => delete rows[k]);
    marginLow = -Infinity;
    status.classList.remove('on');
    return plans.map((pl) => pl.li);
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
    penMod = mod;
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
    if (script) {
      const last = script.rounds.length;
      while (round < last) {
        // short of time, the poem goes straight to how it ends
        if (left() < 15000) { await retell(script.rounds[last - 1].after, []); round = last; break; }
        await nap(between(900, 1500));
        round++;
        const done = await critique(round);
        let next = script.rounds[round - 1].after;
        if (penB && left() > 14000) {
          // the Bic steps off the poem; they talk across it
          await rest(pen);
          const d = script.duet && script.duet.rounds[round - 1];
          await talk(d ? d.talk : [['b', rnd(['fair.', 'agreed.', 'hm. ok.'])]]);
          if (d && d.alt && round === last) {
            const won = await stet(d.alt.line, script.rounds[round - 1].marks.find((m) => m.line === d.alt.line).text);
            await rest(penB);
            done.push({ inks: won.filter((x) => x.path), extra: won.filter((x) => !x.path) });
            next = next.slice(); next[d.alt.line] = d.alt.text;
          }
        }
        const changed = await retell(next, done);
        if (round < last && left() > 20000) await read(changed.sort((a, b) => a - b).slice(0, 2));
      }
    }
    while (!script && left() > 15000) {
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
    end.style.visibility = 'hidden';
    const verdict = script ? script.verdict : 'better.';
    end.textContent = verdict;
    box.appendChild(end);
    // the pen signs off, then goes
    await handwrite(end, verdict);
    addBtn.classList.remove('on');
    if (penB) {
      // the Bic has signed off and goes; the Flair ticks the verdict and
      // follows it out
      if (pen) await pen.leave(700 * speed + 1);
      const r = end.getBoundingClientRect(), b = box.getBoundingClientRect();
      const x = r.right - b.left + 10, y = r.top - b.top + r.height * 0.55;
      await draw([[x, y], [x + 4, y + 5], [x + 13, y - 9]], false, 'tick', penB, 'green');
      await penB.leave(700 * speed + 1);
    } else if (pen) await pen.leave(700 * speed + 1);
    const count = log(round);
    status.textContent = '';
    const a = document.createElement('a');
    a.href = '/poems/'; a.textContent = count ? 'added to the log (' + count + ')' : 'could not save to the log';
    status.appendChild(a);
    status.classList.add('on');
    // The verdict stands a few seconds; if the critics finished early, the
    // timer is shortened to match, so the end never just waits.
    const stand = reduce ? 4000 : 6000;
    const spare = left() - stand - 900;
    if (spare > 0 && extend) { budget -= spare; extend(-spare); }
    await nap(Math.max(stand, left() - 900));
    finish(false);
  }

  function finish(aborted) {
    if (dead) return;
    dead = true;
    if (pen) { const pp = pen; pen = null; pp.leave(500).then(() => pp.destroy(), () => pp.destroy()); }
    if (penB) { const pb = penB; penB = null; pb.leave(500).then(() => pb.destroy(), () => pb.destroy()); }
    document.querySelectorAll('.penny-bubble.talk').forEach((e) => e.remove());
    addBtn.remove();
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

// for checking the grammar of drafts and revisions outside the page
export { draft, flaws, revise };
