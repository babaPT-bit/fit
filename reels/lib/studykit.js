// "Study shows" reels: hook (gym bro myth) -> myth -> study -> result -> takeaway.
// Load after doodlekit.js and fixkit.js.
(function (root) {
  // gym bro: red headband, flexed arms
  function bro(o, t, talking, pose = {}) {
    const m = man(o, Object.assign({ face: talking ? 'shout' : 'smile', mouth: 0.4 + 0.6 * Math.abs(Math.sin(t * 16)), flex: 0.8, flexSide: 'LR', arms: { L: [80, 100], R: [80, 100] } }, pose));
    S.rc.line(m.head[0] - m.headR, m.head[1] - m.headR * 0.55, m.head[0] + m.headR, m.head[1] - m.headR * 0.55, ro({ stroke: RED, strokeWidth: 9, roughness: 0.6 }));
    return m;
  }
  // speech bubble with wrapped text
  function say(x, y, w, text, tail, size = 50, col = INK) {
    ctx.font = `700 ${size}px Caveat`;
    const words = text.split(' '), lines = []; let cur = '';
    for (const wd of words) { const tt = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tt).width > w - 60 && cur) { lines.push(cur); cur = wd; } else cur = tt; }
    lines.push(cur);
    const h = lines.length * size * 1.05 + 50;
    S.rc.ellipse(x, y, w + 40, h + 30, ro({ strokeWidth: 5, stroke: col, fill: '#fbf9f3', fillStyle: 'solid' }));
    if (tail) S.rc.linearPath([[x - 25, y + h / 2], tail, [x + 25, y + h / 2]], ro({ strokeWidth: 5, stroke: col }));
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x, y - (lines.length - 1) * size * 0.525 + i * size * 1.05));
    ctx.textBaseline = 'alphabetic';
  }
  // scientist: lab coat + glasses + clipboard
  function scientist(o, t) {
    const m = man(o, { arms: { L: [20, 10], R: [35, -80] } });
    const P = p => toS(o, p);
    for (const sd of [-1, 1]) S.rc.linearPath([P([sd * 0.05, 1.42]), P([sd * 0.2, 1.1]), P([sd * 0.25, 0.75])], ro({ strokeWidth: 5, stroke: SOFT }));
    for (const sd of [-1, 1]) S.rc.circle(m.head[0] + sd * m.headR * 0.38, m.head[1] - m.headR * 0.15, m.headR * 0.55, ro({ strokeWidth: 3 }));
    S.rc.rectangle(m.R.H[0] - 30, m.R.H[1] - 60, 70, 95, ro({ strokeWidth: 4, fill: '#fbf9f3', fillStyle: 'solid' }));
    for (let i = 0; i < 3; i++) S.rc.line(m.R.H[0] - 18, m.R.H[1] - 35 + i * 22, m.R.H[0] + 28, m.R.H[1] - 35 + i * 22, ro({ strokeWidth: 2 }));
    return m;
  }
  // a small group of stickmen
  function group(cx, baseY, s, n, pose, t) {
    const out = [];
    for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * 0.55 * s; const p = typeof pose === 'function' ? pose(i, t) : pose || {}; out.push(man({ x, y: baseY + (i % 2) * 10, s }, p)); }
    return out;
  }
  // bars: items [{ label, v (0..1), on, value }]
  function bars(cx, baseY, items, maxH = 420, w = 130, gap = 70) {
    const total = items.length * w + (items.length - 1) * gap; let x = cx - total / 2;
    S.rc.line(x - 30, baseY, x + total + 30, baseY, ro({ strokeWidth: 5 }));
    for (const it of items) {
      const h = Math.max(6, maxH * it.v);
      S.rc.rectangle(x, baseY - h, w, h, ro(it.on ? hatch(RED, 9) : pencil()));
      label(it.label, x + w / 2, baseY + 60, INK, 50);
      if (it.value) label(it.value, x + w / 2, baseY - h - 22, it.on ? RED : INK, 62);
      x += w + gap;
    }
  }
  function cite(text, y = 1730) { label(text, 540, y, SOFT, 44); }
  function bigText(lines, y, t, t0) {
    const a = ease(fade(t, t0, t0 + 0.3));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(540, y); ctx.rotate(-0.04);
    let yy = 0; for (const [txt, size, col] of lines) { ctx.font = `700 ${size}px Caveat`; ctx.textAlign = 'center'; ctx.fillStyle = col || RED; ctx.fillText(txt, 0, yy); yy += size; }
    ctx.restore();
  }
  function cross(x, y, w, h) { S.rc.line(x - w / 2, y + h / 2, x + w / 2, y - h / 2, ro({ stroke: RED, strokeWidth: 12 })); }

  function run(cfg) {
    root.drawFrame = function (t) {
      begin(t);
      const st = segAt(t), c = rep(t, cfg.period || 2.4);
      const key = st.id.startsWith('hook') ? 'hook' : st.id;
      if (key === 'hook') { cfg.scenes.hook(t, st, c); bigHook(cfg.hook, 0, t, 230); }
      else {
        const H = { myth: ['The myth', null], study: ['The study', null], result: ['The result', null], out: ['So…', null] }[key];
        heading(...((cfg.titles && cfg.titles[key]) || H));
        cfg.scenes[key](t, st, c);
        if (key === 'result' && cfg.cite) cite(cfg.cite);
        if (key === 'out' && st.u > 0.3) saveStamp(800, 470);
        if (st.id !== 'hook2') flash(st.lt);
      }
      caption(t, cfg.key);
      return cv.toDataURL('image/png');
    };
    fontsReady();
  }
  Object.assign(root, { bro, say, scientist, group, bars, cite, bigText, cross, StudyRun: run });
})(window);
