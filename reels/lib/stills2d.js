// Saves template preview stills: node lib/stills2d.js <page relative to reels/> <out.png> [t] [c]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
(async () => {
  const [pg, out, t = '0.4', c = '1'] = process.argv.slice(2);
  const server = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/${pg}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  const url = await page.evaluate(([t, c]) => window.drawFrame(t, c), [+t, +c]);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close(); server.close();
})();
