// Bundles _penny/penny.js, pen.js and book.js, with the parts of three.js they
// use, into /js/penny.js, /js/pen.js and /js/book.js.
//   cd _penny && npm install && node build.mjs
import { build } from 'esbuild';
for (const name of ['penny', 'pen', 'book']) {
  await build({
    entryPoints: [new URL(`./${name}.js`, import.meta.url).pathname],
    outfile: new URL(`../js/${name}.js`, import.meta.url).pathname,
    bundle: true, format: 'esm', minify: true, target: 'es2019',
    legalComments: 'eof'
  });
}
