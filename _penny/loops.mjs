// Records a short, seamless loop of a real website, to play on the screen of its
// 3D browser on the studio wall (see browser.js). Headless Chrome is driven over
// its debugging protocol; ffmpeg joins what it sees into a clip whose end is
// dissolved into its beginning, so the loop shows no cut.
//
// A site that moves by itself is recorded in real time, frame by frame, as it
// runs. A site that is only a page (it has `scroll`) is photographed once, whole,
// and ffmpeg drifts down the picture: a page scrolled live tears as it repaints,
// and a loop shows every flaw twice a minute.
//
//   node loops.mjs <slug>            record one site (see SITES below)
//   node loops.mjs <slug> --probe    record a short sample and leave a contact sheet in /tmp
//   node loops.mjs <slug> --still    only remake the window chrome and the still, from the clip already made
//
// Needs Chrome (set CHROME to override the macOS default), ffmpeg and Node 22.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../images/browser3d/', import.meta.url).pathname;
const W = 1280, H = 800;
const BAR = 56; // the window chrome's height at that width; browser.js's CHROME_H is BAR / W

// What to record. `seconds` is the length of the loop that results; `settle` is
// time given to the page before the recording starts, so a loader is not in it.
// vw is the width the page is laid out at (the clip is always W x H, so a smaller
// vw is a closer crop: small type reads at the size a browser is on the wall).
// `scroll` is how far, in CSS pixels, to drift down the page over the loop.
const SITES = {
  'willhappinessfind-me': { host: 'willhappinessfind.me', url: 'https://willhappinessfind.me/', seconds: 14, settle: 2500, vw: 640 },
  'work-life-tips': { host: 'work-life.tips', url: 'http://www.work-life.tips', seconds: 12, settle: 2500 },
  'real-beauty-pics': { host: 'real-beauty.pics', url: 'http://www.real-beauty.pics', seconds: 22, settle: 3500, start: 1.8 },
  // the blog, since 2026 a static site of its own (github.com/jsnhff/themechanicalturkdiaries)
  'mechanical-turk-diaries': { host: 'themechanicalturkdiaries.com', url: 'https://themechanicalturkdiaries.com/', seconds: 50, settle: 4000, vw: 900, scroll: 1500 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpSession(port) {
  let tries = 0, list;
  while (!list) {
    try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); }
    catch (e) { if (++tries > 80) throw e; await sleep(150); }
  }
  const target = list.find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map(), handlers = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method && handlers.has(msg.method)) handlers.get(msg.method)(msg.params);
  };
  return {
    send: (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); }),
    on: (method, fn) => handlers.set(method, fn),
    close: () => ws.close(),
  };
}

const ffmpeg = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args]);

export async function record(slug, { probe = false } = {}) {
  const site = SITES[slug];
  if (!site) throw new Error('unknown site: ' + slug + ' (known: ' + Object.keys(SITES).join(', ') + ')');
  const work = mkdtempSync(join(tmpdir(), 'loop-'));
  const frames = join(work, 'frames');
  mkdirSync(frames);
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1',
    `--window-size=${W},${H}`, `--remote-debugging-port=${port}`,
    `--user-data-dir=${join(work, 'profile')}`, 'about:blank',
  ], { stdio: 'ignore' });
  try {
    const cdp = await cdpSession(port);
    await cdp.send('Page.enable');
    const vw = site.vw || W, vh = Math.round(vw * H / W), k = W / vw;
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: k, mobile: false });
    await cdp.send('Page.navigate', { url: site.url });
    await sleep(site.settle);

    // The clip is recorded a little long: the extra is what the loop's end dissolves into.
    const fade = 2;
    const length = probe ? 12 : site.seconds + fade;
    const raw = join(work, 'raw.mp4');
    let span;

    if (site.scroll) {
      // one clean photograph of the page, as tall as the drift needs, then a pan down it
      const h = vh + site.scroll;
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: vw, height: h, scale: 1 } }); // the device scale factor already makes it k
      cdp.close();
      writeFileSync(join(work, 'tall.png'), Buffer.from(shot.result.data, 'base64'));
      const D = Math.round(site.scroll * k), T = length;
      ffmpeg(['-loop', '1', '-framerate', '30', '-i', join(work, 'tall.png'), '-t', String(T),
        '-vf', `crop=${W}:${H}:0:'${D}*(3*pow(t/${T},2)-2*pow(t/${T},3))'`,
        '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', raw]);
      span = T;
    } else {
      const got = [];
      cdp.on('Page.screencastFrame', (p) => {
        const n = got.length;
        writeFileSync(join(frames, `f${String(n).padStart(5, '0')}.jpg`), Buffer.from(p.data, 'base64'));
        got.push(p.metadata.timestamp);
        cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId });
      });
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
      await sleep(length * 1000);
      await cdp.send('Page.stopScreencast');
      cdp.close();
      if (got.length < 4) throw new Error('only ' + got.length + ' frames came off the page');
      // Frames arrive when the page paints, not on a clock: give each the time it was on screen.
      const list = [];
      for (let i = 0; i < got.length; i++) {
        const dur = i < got.length - 1 ? got[i + 1] - got[i] : 1 / 30;
        list.push(`file 'frames/f${String(i).padStart(5, '0')}.jpg'`, `duration ${Math.max(dur, 1 / 60).toFixed(4)}`);
      }
      list.push(`file 'frames/f${String(got.length - 1).padStart(5, '0')}.jpg'`);
      writeFileSync(join(work, 'list.txt'), list.join('\n'));
      span = got[got.length - 1] - got[0];
      console.log(`${slug}: ${got.length} frames over ${span.toFixed(1)} s`);
      ffmpeg(['-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'),
        '-vf', `fps=30,scale=${W}:${H}`, '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', raw]);
    }

    if (probe) {
      const sheet = `/tmp/probe-${slug}.png`;
      ffmpeg(['-i', raw, '-vf', 'fps=0.5,scale=420:-1,tile=3x3', '-frames:v', '1', sheet]);
      console.log('contact sheet: ' + sheet);
      return;
    }
    // Loop: the last `fade` seconds dissolve into the first `fade`, and the clip starts
    // where that dissolve ends, so the join is the same picture on both sides.
    const L = span, X = fade;
    mkdirSync(OUT, { recursive: true });
    const out = join(OUT, slug + '.mp4');
    ffmpeg(['-i', raw, '-filter_complex',
      `[0]trim=start=${X}:end=${L},setpts=PTS-STARTPTS,fps=30[a];[0]trim=start=0:end=${X},setpts=PTS-STARTPTS,fps=30[b];` +
      `[a][b]xfade=transition=fade:duration=${X}:offset=${(L - X - X).toFixed(3)},format=yuv420p[v]`,
      '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', out]);
    if (site.start) {
      // the loop has no seam, so it can begin anywhere: begin where the picture is best
      const r = site.start, rot = join(work, 'rot.mp4');
      ffmpeg(['-i', out, '-filter_complex', `[0]trim=start=${r},setpts=PTS-STARTPTS[a];[0]trim=end=${r},setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]`,
        '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', rot]);
      copyFileSync(rot, out);
    }
    // the clip's first frame: the browser's still on the wall, before it wakes, and its poster
    ffmpeg(['-i', out, '-frames:v', '1', join(OUT, slug + '-poster.png')]);
    console.log('wrote ' + out);
  } finally {
    chrome.kill();
    await sleep(600); // Chrome is still writing its profile as it exits
    rmSync(work, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
  }
}


// The browser's window chrome (the bar across the top: traffic lights and the
// address) as a picture, and the still the wall shows before the browser wakes:
// that bar stacked over the loop's first frame. The 3D model wears the same two
// pictures, so flat on to the viewer it is the still, pixel for pixel.
export async function makeStill(slug) {
  const site = SITES[slug];
  // A compact Safari toolbar, as quiet as it gets: the traffic lights, and one soft address field with
  // its host in the middle. Nothing else: no icons.
  const html = `<!doctype html><meta charset=utf-8><style>
    html,body{margin:0;background:#2a2a2d}
    .bar{width:${W}px;height:${BAR}px;position:relative;background:linear-gradient(#333336,#2a2a2d);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 -1px 0 #151517;color:#8e8e95;font:500 15px -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
    .bar>*{position:absolute;display:block}
    .dots{left:22px;top:22px;display:flex;gap:8px}
    .dots i{width:12px;height:12px;border-radius:50%;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.3)}
    .url{left:50%;top:12px;transform:translateX(-50%);width:520px;height:32px;border-radius:8px;background:rgba(255,255,255,.085);color:#e8e8eb;text-align:center;line-height:32px;letter-spacing:.01em}
  </style><div class=bar>
    <div class=dots><i style="background:#ee6a5e"></i><i style="background:#f5bf4f"></i><i style="background:#62c655"></i></div>
    <div class=url>${site.host}</div>
  </div>`;
  const work = mkdtempSync(join(tmpdir(), 'chrome-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${join(work, 'profile')}`, 'about:blank'], { stdio: 'ignore' });
  try {
    const cdp = await cdpSession(port);
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: BAR, deviceScaleFactor: 2, mobile: false });
    await cdp.send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') });
    await sleep(700);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: BAR, scale: 1 } }); // device scale 2 already
    cdp.close();
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, slug + '-chrome.png'), Buffer.from(shot.result.data, 'base64'));
  } finally {
    chrome.kill();
    await sleep(600);
    rmSync(work, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
  }
  if (!existsSync(join(OUT, slug + '-poster.png'))) ffmpeg(['-i', join(OUT, slug + '.mp4'), '-frames:v', '1', join(OUT, slug + '-poster.png')]);
  ffmpeg(['-i', join(OUT, slug + '-chrome.png'), '-i', join(OUT, slug + '-poster.png'),
    '-filter_complex', `[0:v]scale=${W}:${BAR}[c];[c][1:v]vstack`, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '88', join(OUT, slug + '-front.webp')]);
  // the model wears the chrome and the poster as WebP; the PNGs were only a way there
  ffmpeg(['-i', join(OUT, slug + '-chrome.png'), '-c:v', 'libwebp', '-lossless', '1', join(OUT, slug + '-chrome.webp')]);
  ffmpeg(['-i', join(OUT, slug + '-poster.png'), '-c:v', 'libwebp', '-quality', '90', join(OUT, slug + '-poster.webp')]);
  rmSync(join(OUT, slug + '-chrome.png')); rmSync(join(OUT, slug + '-poster.png'));
  console.log('wrote ' + slug + '-chrome.webp, -poster.webp and -front.webp');
}

const [slug, flag] = process.argv.slice(2);
if (slug) {
  const run = flag === '--still' ? makeStill(slug) : record(slug, { probe: flag === '--probe' }).then(() => (flag === '--probe' ? null : makeStill(slug)));
  run.catch((e) => { console.error(e.message); process.exit(1); });
}
