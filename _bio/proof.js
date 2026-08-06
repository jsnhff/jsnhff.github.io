/* node proof.js — prints the bio closed, one level open, and fully open.
   Run this after any edit to bio.data.js. Read both extremes out loud. */
import { DOC } from "./src/bio.data.js";

const show = n => typeof n === "string" ? n : n.l ? "\u3008" + n.l + "\u3009" : null;

function flat(p, depth) {
  let o = "";
  (function r(a, d) {
    a.forEach(x => {
      const s = show(x);
      if (s !== null) { o += s; return; }
      o += x.w;
      if (d < depth) r(x.add || [], d + 1);
    });
  })(p, 0);
  return o;
}

let chips = 0, links = 0, deepest = 0;
(function count(a, d = 0) {
  a.forEach(x => {
    if (Array.isArray(x)) return count(x, d);
    if (typeof x !== "object") return;
    if (x.l) { links++; return; }
    chips++; deepest = Math.max(deepest, d + 1); count(x.add || [], d + 1);
  });
})(DOC);

const words = t => t.replace(/\u3008|\u3009/g, "").trim().split(/\s+/).length;
const closed = DOC.map(p => flat(p, 0)).join("\n\n");
const one    = DOC.map(p => flat(p, 1)).join("\n\n");
const open   = DOC.map(p => flat(p, 99)).join("\n\n");

console.log(`chips ${chips} | links ${links} | deepest chain ${deepest}`);
console.log(`words: ${words(closed)} closed \u2192 ${words(open)} open\n`);
console.log("=== CLOSED ===\n" + closed);
console.log("\n=== ONE LEVEL ===\n" + one);
console.log("\n=== FULLY OPEN ===\n" + open);

const trailing = [...open.matchAll(/\u3008([^\u3009]+)\u3009/g)].length;
console.log(`\n${trailing} links present in the open text.`);
