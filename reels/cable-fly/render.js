// Renders scene.html frame-by-frame and encodes an Instagram Reel (1080x1920 MP4).
//   node render.js                      -> out/cable-fly-reel.mp4 (voiceover + captions)
//                                          out/cable-fly-reel-clean.mp4 (no captions, no audio)
//                                          out/cable-fly-voiceover.m4a, out/cable-fly-captions.srt
//   node render.js --stills 2,9.5 <dir> -> preview PNGs
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out');

async function openPage(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'scene.html') + query);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function grab(page, t) {
  const url = await page.evaluate((t) => { drawFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t);
  return Buffer.from(url.split(',')[1], 'base64');
}
async function renderVideo(page, out) {
  const { DURATION, FPS } = await page.evaluate(() => ({ DURATION, FPS }));
  const n = Math.round(DURATION * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const buf = await grab(page, i / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  return DURATION;
}
const srtTime = s => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  if (args[0] === '--stills') {
    const page = await openPage(browser, '');
    for (const t of args[1].split(',').map(Number)) fs.writeFileSync(path.join(args[2] || '.', `still_${t.toFixed(1)}.png`), await grab(page, t));
    await browser.close(); return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  const page = await openPage(browser, '');
  const { VO_TIMES, CHUNKS } = await page.evaluate(() => ({ VO_TIMES, CHUNKS }));
  const silent = path.join(OUT, '_silent.mp4');
  const dur = await renderVideo(page, silent);
  const clean = await openPage(browser, '?captions=0');
  await renderVideo(clean, path.join(OUT, 'cable-fly-reel-clean.mp4'));
  await browser.close();

  // voiceover track: each line placed at its start time
  const inputs = [], filters = [];
  VO_TIMES.forEach((v, i) => {
    inputs.push('-i', path.join(__dirname, 'voice', v.file));
    const ms = Math.round(v.at * 1000);
    filters.push(`[${i}:a]adelay=${ms}|${ms},aresample=48000[a${i}]`);
  });
  const mix = VO_TIMES.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${VO_TIMES.length}:normalize=0,apad,atrim=0:${dur.toFixed(3)},loudnorm=I=-14:TP=-1.5,aresample=48000[vo]`;
  const voice = path.join(OUT, 'cable-fly-voiceover.m4a');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.concat(mix).join(';'), '-map', '[vo]', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', voice]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', voice, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', path.join(OUT, 'cable-fly-reel.mp4')]);
  fs.unlinkSync(silent);

  const srt = CHUNKS.map((c, i) => `${i + 1}\n${srtTime(c.t0)} --> ${srtTime(Math.max(c.t1, c.t0 + 0.5))}\n${c.text}\n`).join('\n');
  fs.writeFileSync(path.join(OUT, 'cable-fly-captions.srt'), srt);
  console.log(`done: ${dur.toFixed(1)}s`);
})();
