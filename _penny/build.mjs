// Bundles _penny/penny.js, pen.js, book.js and browser.js, with the parts of three.js
// they use, into /js/penny.js, /js/pen.js, /js/book.js and /js/browser.js (the last
// two share a chunk, /js/three-*.js).
//   cd _penny && npm install && node build.mjs
import { build } from 'esbuild';
// book.js, browser.js and toy.js are loaded together on the studio wall, so they share
// one copy of three.js (a chunk) instead of each carrying their own.
await build({
  entryPoints: ['book', 'browser', 'toy'].map((n) => new URL(`./${n}.js`, import.meta.url).pathname),
  outdir: new URL('../js/', import.meta.url).pathname,
  bundle: true, format: 'esm', splitting: true, minify: true, target: 'es2019',
  chunkNames: 'three-[hash]', legalComments: 'eof'
});
for (const name of ['penny', 'pen']) {
  await build({
    entryPoints: [new URL(`./${name}.js`, import.meta.url).pathname],
    outfile: new URL(`../js/${name}.js`, import.meta.url).pathname,
    bundle: true, format: 'esm', minify: true, target: 'es2019',
    legalComments: 'eof'
  });
}
