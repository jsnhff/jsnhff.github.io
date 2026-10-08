// Bundles _penny/penny.js and the parts of three.js it uses into /js/penny.js.
//   cd _penny && npm install && node build.mjs
import { build } from 'esbuild';
await build({
  entryPoints: [new URL('./penny.js', import.meta.url).pathname],
  outfile: new URL('../js/penny.js', import.meta.url).pathname,
  bundle: true, format: 'esm', minify: true, target: 'es2019',
  legalComments: 'eof'
});
