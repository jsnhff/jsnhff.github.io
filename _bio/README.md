# Expanding bio — build brief

Drop this folder in the repo and hand this file to Claude Code.

The interactive bio is built and working. What's left is integrating it into
jason-huff.com and building four static lists underneath it.

---

## What this is

A bio that starts at 74 words and expands to about 750. Highlighted phrases
open in place; outbound links are outlined mono pills. Closed state:

> Jason Huff (b. 1981) is an artist, writer, and designer living and working in **Los Angeles**. He makes **books**. And he **writes**.
>
> His books are held in **museums**. They appear in **anthologies**. The work has been exhibited in **galleries**. It has been written about in **academic journals**.
>
> He has taught in **classrooms**. He has spent years **making space for other artists**. He spends his days **leading design teams**.
>
> He holds an MFA in Digital+Media from ⟨RISD↗⟩ and a BFA in New Media from the ⟨UNIVERSITY OF GEORGIA↗⟩. He can be reached by ⟨EMAIL↗⟩ or ⟨INSTAGRAM↗⟩.

25 chips, 36 links, four levels deep at the deepest.

---

## Files

```
src/bio.data.js     the entire bio. Edit this, nothing else.
src/glyphs.js       22 inline SVG marks, one per chip
src/bio.js          renderer — static HTML first, then interactive
src/bio.css         scoped to .bio-block
src/lists.data.js   press / collections / anthologies / writing / scholarship
proof.js            prints the closed and fully-open text. Run before shipping.
demo.html           standalone, open it in a browser
```

---

## Task 1 — render the bio as HTML, not JavaScript

**This is the important one.** The current build renders the whole bio from
JS, so a crawler sees an empty `<div>`. That page has already had a robots
block and still declares the homepage as its canonical URL, so there is no
margin for another reason not to be indexed.

`bio.js` exports `renderStatic()`, which returns the **fully open** bio as
plain HTML with real `<a href>` tags. Call it at build time and put the
result in the page source. Then `enhance()` swaps in the collapsed
interactive version on load.

Result: crawlers and no-JS visitors get every word and every link; everyone
else gets the toy.

1. Detect the site's generator (Jekyll, Eleventy, Astro, hand-rolled — check
   for `_config.yml`, `.eleventy.js`, `astro.config.*`, or a build script).
2. Wire `renderStatic()` into that build step. If there is no build step, run
   `node -e 'import("./src/bio.js").then(m=>console.log(m.renderStatic()))'`
   and paste the output into the page, with a note in the file saying it is
   generated and where from.
3. Markup shape:

```html
<section class="bio-block">
  <div class="wrap">
    <div class="bio"><!-- renderStatic() output --></div>
    <p class="colophon" data-colophon></p>
    <div class="foot">
      <span class="dot" data-dot></span>
      <span class="tally" data-tally></span>
      <button class="reset" data-reset>Start over</button>
    </div>
  </div>
</section>
```

4. On load: `enhance(document.querySelector('.bio-block'))` and
   `colophon(document.querySelector('[data-colophon]'))`.

## Task 2 — the four lists below the bio

Data is in `src/lists.data.js`. Render as **static HTML**, no JS. Order:

1. **Collections** — MoMA, Whitney, Bavarian State Library
2. **Anthologies** — reverse chronological, with publisher and page number
3. **Writing** — reverse chronological, with outlet
4. **Press** — reverse chronological, with author
5. **Scholarship** — writing *about* the work, kept separate from press

Design constraints:

- Same pill style for links. Same `--paper` / `--ink` variables.
- Year in the left column, mono, muted. Title, then outlet or note.
- These are lists, not prose. No expanding, no chips. The bio is the toy; the
  lists are the record.
- Entries without a `href` render as plain text. Don't invent URLs.
- Anything marked `TODO` in the data stays out of the build until it's filled.

## Task 3 — fix the page's SEO plumbing while you're in there

- `/index/` declares `<link rel="canonical" href="http://jason-huff.com/">`,
  which tells search engines this page is a duplicate of the homepage. Point
  it at itself, and use `https`.
- The meta description says "design manager." The H1 says design director.
- Confirm `robots.txt` allows crawling (it was blocked until recently).
- `/projects/american-pyscho/` has a typo in the URL and Wikipedia links to
  it that way. Add a redirect from the correct spelling; don't rename.

---

## Constraints

**Fonts.** Newsreader (body) and IBM Plex Mono (pills), both Google Fonts.
If the site already loads faces, use those and update the colophon string in
`colophon()` to match.

**No dependencies.** Vanilla ES modules. Don't add a framework.

**Accessibility.** Chips are `<button>`. Keep visible focus rings. The
`prefers-reduced-motion` block is already there — keep it.

**Chips are one-way.** Tapping opens; it never closes. That's deliberate — it
matches the reference and keeps the reading order stable. "Start over" is the
only way back, and it only appears after the first tap.

---

## Editing the bio later

Everything is in `src/bio.data.js`. Four rules, all learned by breaking them:

1. Every reveal must read as a grammatical continuation of the phrase before
   it. Run `node proof.js` and read both states out loud.
2. Chips go at the end of a sentence. Sibling chips each get their own short
   sentence ("The first was X. Then Y.") so any one can open without pushing
   the others down the page.
3. A link's label is the noun the sentence needs. If the label repeats the
   word beside it, delete the word and let the pill be it.
4. Nothing goes in that can't be traced to a source.

---

## Before it goes live

- [ ] `node proof.js` — both states read as prose
- [ ] View source: the full bio is in the HTML, links included
- [ ] JS off: the page is still complete and readable
- [ ] Every pill opens the right page (36 of them)
- [ ] Mobile: the long "Beyond the Surface" pill wraps and keeps its border
- [ ] Keyboard: tab through the chips, focus is visible, Enter opens
- [ ] Canonical points at `/index/` over https
- [ ] Lighthouse SEO 100
