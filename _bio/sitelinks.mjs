/* Every outbound href in the built site, traced back to the source file that
   produced it. The bio review covered _bio only; this covers everything. */
import fs from "node:fs";
import path from "node:path";

const SITE = "/home/user/jsnhff.github.io/_site";
const SRC  = "/home/user/jsnhff.github.io";

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? walk(p) : (p.endsWith(".html") ? [p] : []);
});

const pages = walk(SITE);
const found = new Map();          // url -> Set(page)

for (const f of pages) {
  const html = fs.readFileSync(f, "utf8");
  // Redirect stubs are generated, not authored — their target is not a citation.
  if (/name="robots" content="noindex"/.test(html) && /Redirecting/.test(html)) continue;
  const rel = f.replace(SITE, "") || "/";
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (!found.has(u)) found.set(u, new Set());
    found.get(u).add(rel.replace(/\/index\.html$/, "/"));
  }
}

// Where does each URL live in the source? That is what actually gets edited.
const srcFiles = [];
for (const dir of ["_updates", "_posts", "_projects", "_pages", "_layouts", "_data", "_includes"]) {
  const d = path.join(SRC, dir);
  if (!fs.existsSync(d)) continue;
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    if (fs.statSync(p).isFile()) srcFiles.push([dir + "/" + e, fs.readFileSync(p, "utf8")]);
  }
}
srcFiles.push(["index.html", fs.readFileSync(path.join(SRC, "index.html"), "utf8")]);
for (const f of ["src/bio.data.js", "src/lists.data.js"]) {
  srcFiles.push(["_bio/" + f, fs.readFileSync(path.join(SRC, "_bio", f), "utf8")]);
}

const rows = [...found.entries()].map(([url, set]) => {
  const owners = srcFiles.filter(([, body]) => body.includes(url)).map(([n]) => n);
  return { url, pages: [...set], owners, internal: /(^https?:\/\/(www\.)?jason-huff\.com)/.test(url) };
}).sort((a, b) => a.url.localeCompare(b.url));

fs.writeFileSync("/tmp/claude-0/-home-user-jsnhff-github-io/f9089c9b-a8cc-5500-9318-0c23661ba1b8/scratchpad/sitelinks.json", JSON.stringify(rows, null, 1));
console.log(`${rows.length} distinct outbound URLs across ${pages.length} built pages`);
console.log(`  internal (jason-huff.com): ${rows.filter(r => r.internal).length}`);
console.log(`  external:                  ${rows.filter(r => !r.internal).length}`);
console.log(`  no source file matched:    ${rows.filter(r => !r.owners.length).length}`);
