// Renders a 3D reel folder (scene.html + voice/) into ONE mp4 with voiceover and captions.
// usage: node lib/render3d.js <reel-folder> [--stills t1,t2 <dir>]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

(async () => {
  const [reel, flag, list, outDir] = process.argv.slice(2);
  const server = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/${reel}/scene.html`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const grab = async t => Buffer.from((await page.evaluate(t => window.drawFrame(t), t)).split(',')[1], 'base64');

  if (flag === '--stills') {
    for (const t of list.split(',').map(Number)) fs.writeFileSync(path.join(outDir, `still_${t.toFixed(1)}.png`), await grab(t));
  } else {
    const { duration, times } = await page.evaluate(() => ({ duration: window.DURATION, times: window.VO_TIMES }));
    const dir = path.join(ROOT, reel), out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
    const name = path.basename(reel);
    const silent = path.join(out, '_silent.mp4');
    const n = Math.round(duration * 30);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', silent], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let i = 0; i < n; i++) {
      const buf = await grab(i / 30);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`frame ${i}/${n}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    const inputs = [], filters = [];
    times.forEach((v, i) => { inputs.push('-i', path.join(dir, 'voice', v.file)); const ms = Math.round(v.at * 1000); filters.push(`[${i}:a]adelay=${ms}|${ms},aresample=48000[a${i}]`); });
    const mix = times.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${times.length}:normalize=0,apad,atrim=0:${duration.toFixed(3)},loudnorm=I=-14:TP=-1.5[vo]`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, ...inputs, '-filter_complex', filters.map(f => f.replace(/\[(\d+):a\]/, (m, k) => `[${+k + 1}:a]`)).concat(mix).join(';'),
      '-map', '0:v', '-map', '[vo]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(out, `${name}.mp4`)]);
    fs.unlinkSync(silent);
    console.log(`wrote ${path.join(out, name + '.mp4')} (${duration.toFixed(1)}s)`);
  }
  await browser.close(); server.close();
})();
