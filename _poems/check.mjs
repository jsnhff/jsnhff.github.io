// Checks act three's poem scripts: the hand-written corpus in
// js/poem-corpus.json now, and the same shape from a language model later.
//   node _poems/check.mjs [file]
// A script is a draft, rounds of marks with the poem as it stands after
// each, and a last word. Every mark has to point at words that are in its
// line at that moment, so the page can find them and the pen can mark them.
import fs from 'fs';

export const LIMITS = { line: 44, note: 24, verdict: 26, marks: 4, talk: 30 };
const HOWS = ['delete', 'replace', 'circle', 'underline'];
export const words = (s) => s.toLowerCase().split(/\s+/).map((w) => w.replace(/^[^\w']+|[^\w']+$/g, '')).filter(Boolean);
export function find(line, text) {
  const a = words(line), b = words(text);
  for (let i = 0; i + b.length <= a.length; i++) if (b.every((w, j) => a[i + j] === w)) return i;
  return -1;
}

export function check(poem) {
  const bad = [], say = (m) => bad.push(m);
  if (!poem.title || !Array.isArray(poem.draft) || !poem.draft.length) return ['no title or draft'];
  let lines = poem.draft;
  lines.forEach((l, i) => { if (l.length > LIMITS.line) say(`draft line ${i} too long (${l.length})`); });
  (poem.rounds || []).forEach((r, ri) => {
    if (!r.marks?.length) say(`round ${ri + 1} has no marks`);
    if ((r.marks || []).length > LIMITS.marks) say(`round ${ri + 1} has ${r.marks.length} marks`);
    if (!Array.isArray(r.after) || r.after.length !== lines.length) { say(`round ${ri + 1}: after has a different number of lines`); return; }
    (r.marks || []).forEach((m, mi) => {
      const at = `round ${ri + 1} mark ${mi + 1}`;
      if (!HOWS.includes(m.how)) say(`${at}: how '${m.how}'`);
      if (lines[m.line] == null) { say(`${at}: no line ${m.line}`); return; }
      if (find(lines[m.line], m.text) < 0) say(`${at}: '${m.text}' not in "${lines[m.line]}"`);
      if (m.how === 'replace' && (!m.rep || find(r.after[m.line], m.rep) < 0)) say(`${at}: replacement '${m.rep}' not in the revised line`);
      if (m.note && m.note.length > LIMITS.note) say(`${at}: note too long (${m.note.length})`);
      if (r.after[m.line] === lines[m.line]) say(`${at}: line ${m.line} marked but not revised`);
    });
    r.after.forEach((l, i) => {
      if (l.length > LIMITS.line) say(`round ${ri + 1} line ${i} too long (${l.length})`);
      // every change answers a mark: a line no mark touched stays as it was
      if (l !== lines[i] && !(r.marks || []).some((m) => m.line === i)) say(`round ${ri + 1}: line ${i} revised without a mark`);
    });
    lines = r.after;
  });
  if (!poem.verdict || poem.verdict.length > LIMITS.verdict) say('verdict missing or too long');
  // With a second critic: what the two say each round, and in the last round
  // perhaps a line the second wins back (stet: it stays as it was).
  if (poem.duet) {
    const R = poem.rounds || [], D = poem.duet.rounds || [];
    if (D.length !== R.length) say('duet has a different number of rounds');
    D.forEach((d, ri) => {
      (d.talk || []).forEach(([who, text], ti) => {
        if (who !== 'a' && who !== 'b') say(`duet round ${ri + 1} line ${ti + 1}: speaker '${who}'`);
        if (!text || text.length > LIMITS.talk) say(`duet round ${ri + 1} line ${ti + 1}: too long (${text && text.length})`);
      });
      if (d.alt) {
        if (ri !== R.length - 1) say(`duet round ${ri + 1}: a win only in the last round`);
        const before = (R[ri - 1] || { after: poem.draft }).after;
        if (!(R[ri].marks || []).some((m) => m.line === d.alt.line)) say(`duet round ${ri + 1}: wins a line the first critic did not mark`);
        if (d.alt.how === 'stet' && d.alt.text !== before[d.alt.line]) say(`duet round ${ri + 1}: stet has to keep the line as it was`);
      }
    });
  }
  return bad;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2] || new URL('../js/poem-corpus.json', import.meta.url).pathname;
  const corpus = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  corpus.forEach((p) => { const b = check(p); if (b.length) { n += b.length; console.log(`${p.title}:\n  ` + b.join('\n  ')); } });
  console.log(`${corpus.length} poems, ${n} problems`);
  process.exit(n ? 1 : 0);
}
