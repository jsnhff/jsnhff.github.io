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
  vague: ['vague. what kind?', 'says nothing', 'every poem says this', "show me, don't tell"],
  abstract: ['give me a leaf, not this', 'abstract. what can i touch?', 'too big', 'can you hold it?'],
  filler: ['cut', 'filler', "why 'very'?"],
  adverb: ['let the verb do this', 'cut -ly', 'lazy'],
  things: ['which things?', 'name one'],
  repeat: ['again?', 'you said this already', 'used it']
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
  return alts ? rnd(alts) : null;
}

// ---- the stage ------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SVG = 'http://www.w3.org/2000/svg';

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

export function run({ wrap, after, penUrl }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reduce ? 0.15 : 1;
  const t0 = performance.now();
  const budget = 30000;
  let dead = false;
  const nap = (ms) => sleep(ms * speed).then(() => { if (dead) throw 0; });

  // The pen is fetched while the poem is written, and shown when it is done.
  // If it cannot be (no WebGL, no network) the critic works without one.
  let pen = null;
  const penReady = penUrl ? import(penUrl).catch(() => null) : Promise.resolve(null);

  const p = draft();
  const first = p.lines.map((l) => l.join(' '));
  const notesMade = [];

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
  box.appendChild(status);
  wrap.appendChild(box);
  wrap.classList.add('is-poem');
  const narrow = () => window.innerWidth < 820;

  const wordEl = {};
  const key = (li, wi) => li + ':' + wi;
  function render(li) {
    lineEls[li].textContent = '';
    p.lines[li].forEach((w, wi) => {
      const s = document.createElement('span');
      s.className = 'pw';
      s.textContent = w;
      lineEls[li].appendChild(s);
      lineEls[li].appendChild(document.createTextNode(' '));
      wordEl[key(li, wi)] = s;
    });
  }

  async function write() {
    box.classList.add('on');
    await nap(700);
    for (let li = 0; li < p.lines.length; li++) {
      render(li);
      const ws = lineEls[li].querySelectorAll('.pw');
      ws.forEach((w) => w.classList.add('hid'));
      for (const w of ws) { w.classList.remove('hid'); await nap(110); }
      await nap(220);
    }
  }

  // A pen-drawn loop round a word, a little rough, overshooting where it started.
  function circle(el) {
    const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    const cx = r.left - b.left + r.width / 2, cy = r.top - b.top + r.height / 2;
    const rx = r.width / 2 + 8, ry = r.height / 2 + 4;
    const a0 = -2.4 + Math.random() * 0.6, turn = Math.PI * 2 * (1.12 + Math.random() * 0.08), n = 44;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = a0 + turn * u, k = 1 + 0.07 * Math.sin(u * 9 + cx) + 0.05 * u;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rx * k).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * k).toFixed(1);
    }
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'pen');
    ink.appendChild(path);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    // the same loop in viewport pixels, for the pen to follow
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([b.left + path.getPointAtLength(len * i / n).x, b.top + path.getPointAtLength(len * i / n).y]);
    const ms = 620;
    const play = () => path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: ms * speed + 1, easing: 'linear', fill: 'forwards' });
    return { path, cx, cy, rx, ry, pts, ms, play };
  }

  const slots = {};
  async function note(el, line, text, c) {
    const b = box.getBoundingClientRect(), lr = lineEls[line].getBoundingClientRect(), r = el.getBoundingClientRect();
    const n = document.createElement('span');
    n.className = 'poem-note';
    n.style.setProperty('--rot', (Math.random() * 4 - 2).toFixed(1) + 'deg');
    const used = slots[line] = (slots[line] || 0) + 1;
    if (narrow()) {
      n.style.left = Math.max(0, r.left - b.left - 4) + 'px';
      n.style.top = (lr.bottom - b.top - 6) + 'px';
    } else {
      n.style.left = (b.width + 28) + 'px';
      n.style.top = (lr.top - b.top - 3 + (used - 1) * 20) + 'px';
    }
    box.appendChild(n);
    if (pen) {
      // set the whole note (hidden) to measure it, then write it letter by letter
      const cs = letters(n, text);
      const nr = n.getBoundingClientRect();
      const y = nr.top + nr.height * 0.78;
      const gaps = cs.map((c) => hand(c.textContent));
      const total = gaps.reduce((a, g) => a + g, 0);
      await pen.glide(nr.left, y, 380 * speed + 1);
      if (dead) throw 0;
      const typing = (async () => { for (let i = 0; i < cs.length; i++) { cs[i].classList.remove('hid'); await nap(gaps[i]); } })();
      await Promise.all([typing, pen.write(nr.left, y, nr.left + nr.width, total * speed + 1)]);
      return n;
    }
    const cs = letters(n, text);
    for (const c of cs) { c.classList.remove('hid'); await nap(hand(c.textContent) * 0.8); }
    return n;
  }

  async function critique(round, all) {
    let fl = flaws(p);
    if (!fl.length) return [];
    // A critic does not catch everything at once, until time is short.
    const left = budget - (performance.now() - t0);
    const take = all || left < 9000 ? fl.length : Math.min(fl.length, 3);
    fl = shuffle(fl).slice(0, take).sort((a, b) => a.li - b.li || a.wi - b.wi);
    Object.keys(slots).forEach((k) => delete slots[k]);
    box.classList.add('critic');
    status.textContent = round === 1 ? 'the critic' : 'the critic, again';
    status.classList.add('on');
    const marks = [];
    for (const f of fl) {
      const el = wordEl[key(f.li, f.wi)];
      const c = circle(el);
      if (pen) {
        await pen.glide(c.pts[0][0], c.pts[0][1], 380 * speed + 1);
        if (dead) throw 0;
        c.play();
        await pen.stroke(c.pts, c.ms * speed + 1);
      } else {
        c.play();
        await nap(c.ms);
      }
      await nap(120);
      const text = rnd(NOTES[f.kind]);
      const n = await note(el, f.li, text, c);
      notesMade.push({ w: bare(p.lines[f.li][f.wi]), n: text });
      marks.push({ f, c, n, el });
      await nap(180);
    }
    return marks;
  }

  async function rewrite(marks) {
    await nap(500);
    // cut from the end of each line backwards so positions hold
    const cuts = [];
    for (const m of marks) {
      const rep = revise(p, m.f);
      const w = p.lines[m.f.li][m.f.wi], tail = comma(w);
      if (rep == null) cuts.push(m); else p.lines[m.f.li][m.f.wi] = rep + tail;
      m.el.classList.add('swap');
    }
    await nap(260);
    cuts.sort((a, b) => b.f.wi - a.f.wi).forEach((m) => {
      const l = p.lines[m.f.li], tail = comma(l[m.f.wi]);
      l.splice(m.f.wi, 1);
      if (tail && l.length && m.f.wi > 0) l[m.f.wi - 1] = bare(l[m.f.wi - 1]) + tail;
    });
    const touched = new Set(marks.map((m) => m.f.li));
    touched.forEach((li) => { if (p.lines[li].length) render(li); });
    marks.forEach((m) => { m.c.path.classList.add('gone'); m.n.classList.add('gone'); if (m.n._link) m.n._link.classList.add('gone'); });
    await nap(700);
    marks.forEach((m) => { m.c.path.remove(); m.n.remove(); if (m.n._link) m.n._link.remove(); });
    box.classList.remove('critic');
    status.classList.remove('on');
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
    let round = 0;
    for (;;) {
      await nap(700);
      round++;
      const last = performance.now() - t0 > budget - 6500 || round >= 4;
      const marks = await critique(round, last);
      if (!marks.length) break;
      await rewrite(marks);
      if (!flaws(p).length) break;
    }
    // finished: the critic's last word, in the margin of the title
    await nap(500);
    box.classList.add('critic');
    const end = document.createElement('span');
    end.className = 'poem-note final';
    end.style.setProperty('--rot', '-3deg');
    box.appendChild(end);
    if (pen) pen.leave(700 * speed + 1);
    const verdict = round > 1 ? 'better. print it.' : 'fine.';
    for (const c of letters(end, verdict)) { c.classList.remove('hid'); await nap(hand(c.textContent) + 15); }
    const count = log(round);
    status.classList.add('on');
    status.textContent = '';
    const a = document.createElement('a');
    a.href = '/poems/'; a.textContent = count ? 'added to the log (' + count + ')' : 'could not save to the log';
    status.appendChild(a);
    await nap(5000);
    finish(false);
  }

  function finish(aborted) {
    if (dead) return;
    dead = true;
    if (pen) { const pp = pen; pen = null; pp.leave(500).then(() => pp.destroy(), () => pp.destroy()); }
    document.removeEventListener('egg-revealed', onReveal);
    box.classList.add('out');
    wrap.classList.remove('is-poem');
    setTimeout(() => { box.remove(); if (!aborted) after(); }, 900);
  }
  const onReveal = () => finish(true);
  document.addEventListener('egg-revealed', onReveal);
  go().catch(() => {});
  return { stop: () => finish(true) };
}
