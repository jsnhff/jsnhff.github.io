/* ---------------------------------------------------------------
   bio.js — renders the expanding bio.

   Progressive enhancement, and this is the point of the whole file:

   renderStatic() produces the FULLY OPEN bio as plain HTML with real
   <a> tags. That is what ships in the page source, so crawlers, feed
   readers, and anyone without JS get the entire bio and every link.

   On load, enhance() replaces it with the collapsed interactive
   version. Nobody with JS sees the static one for more than a frame.

   If you render this at build time instead (recommended — see
   README), call renderStatic() in your build step and let enhance()
   take over in the browser.
--------------------------------------------------------------- */

import { DOC } from "./bio.data.js";
import { mark } from "./glyphs.js";

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const link = n =>
  `<a class="pill" href="${n.h}"${n.h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>`
  + esc(n.l) + `<span class="arw" aria-hidden="true">\u2197</span></a>`;

/* ---- ids, assigned once, in document order ---- */
let TOTAL = 0;
(function seed(nodes, n = { i: 0 }) {
  nodes.forEach(x => {
    if (Array.isArray(x)) return seed(x, n);
    if (typeof x === "object" && !x.l) { x.id = "c" + (++n.i); TOTAL++; seed(x.add || [], n); }
  });
})(DOC);

/* ---- 1. static: everything open, real links, no JS needed ---- */
export function renderStatic() {
  const walk = nodes => nodes.map(n => {
    if (typeof n === "string") return esc(n);
    if (n.l) return link(n);
    return `<span class="spent">${esc(n.w)}${mark(n.m)}</span>` + walk(n.add || []);
  }).join("");
  return DOC.map(p => "<p>" + walk(p) + "</p>").join("");
}

/* ---- 2. interactive ---- */
export function enhance(root) {
  const el = root.querySelector(".bio");
  const tallyEl = root.querySelector("[data-tally]");
  const dotEl = root.querySelector("[data-dot]");
  const resetEl = root.querySelector("[data-reset]");
  const spent = new Set();
  let last = null;

  const walk = nodes => nodes.map(n => {
    if (typeof n === "string") return esc(n);
    if (n.l) return link(n);
    if (spent.has(n.id)) {
      const body = `<span class="spent">${esc(n.w)}${mark(n.m)}</span>` + walk(n.add || []);
      return n.id === last ? `<span class="fresh">${body}</span>` : body;
    }
    return `<button class="chip" data-id="${n.id}">${esc(n.w)}${mark(n.m)}</button>`;
  }).join("");

  function paint() {
    el.innerHTML = DOC.map(p => "<p>" + walk(p) + "</p>").join("");

    const left = TOTAL - spent.size;
    if (tallyEl) {
      tallyEl.textContent = spent.size === 0 ? TOTAL + " things to find"
                          : left === 0       ? "that's all of it"
                                             : left + " left";
      tallyEl.classList.toggle("done", left === 0);
    }
    if (dotEl) dotEl.style.background = left === 0 ? "var(--ink)" : "var(--faint)";
    if (resetEl) resetEl.classList.toggle("on", spent.size > 0);

    el.querySelectorAll(".chip").forEach(b =>
      b.addEventListener("click", () => { last = b.dataset.id; spent.add(last); paint(); }));
  }

  if (resetEl) resetEl.addEventListener("click", () => {
    spent.clear(); last = null; paint(); resetEl.blur();
  });

  paint();
}

/* ---- 3. colophon greeting ---- */
export function colophon(el, typefaces = "Newsreader and IBM Plex Mono") {
  const h = new Date().getHours();
  const [greet, orb] = h < 12 ? ["Good morning", "\u263C"]
                     : h < 18 ? ["Good afternoon", "\u263C"]
                              : ["Good evening", "\u263E"];
  el.textContent = `This page is typeset in ${typefaces}. ${greet} ${orb}`;
}

export { TOTAL };
