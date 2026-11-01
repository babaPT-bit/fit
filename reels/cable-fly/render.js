// Renders scene.html frame-by-frame and encodes an Instagram Reel (1080x1920 MP4).
// Usage: node render.js [out.mp4]          (preview stills: node render.js --stills 2.0,4.1)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'scene.html'));
  await page.evaluate(() => document.fonts.ready);
  const grab = async (t) => {
    const url = await page.evaluate((t) => { drawFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  if (args[0] === '--stills') {
    for (const t of args[1].split(',').map(Number)) {
      require('fs').writeFileSync(path.join(args[2] || '.', `still_${t.toFixed(1)}.png`), await grab(t));
    }
    await browser.close(); return;
  }
  const out = args[0] || path.join(__dirname, 'out', 'cable-fly-reel.mp4');
  require('fs').mkdirSync(path.dirname(out), { recursive: true });
  const { DURATION, FPS } = await page.evaluate(() => ({ DURATION, FPS }));
  const n = Math.round(DURATION * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const buf = await grab(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`wrote ${out} (${n} frames, ${DURATION.toFixed(1)}s)`);
})();
