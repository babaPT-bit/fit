// Training-split explainer reels: weekly calendar, body map, next-episode card.
// Load after doodlekit.js, fixkit.js and studykit.js.
(function (root) {
  const COL = { PUSH: '#d7261e', PULL: '#2b6cb0', LEGS: '#1f8a3b', UPPER: '#7b3fb8', LOWER: '#d9822b', FULL: '#1a1a1a', REST: '#9a9a9a',
    CHEST: '#d7261e', BACK: '#2b6cb0', SHLD: '#d9822b', ARMS: '#7b3fb8' };
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // days: array of 7 labels (e.g. 'PUSH', 'REST'); reveal 0..1 fills the blocks one by one
  function calendar(cx, top, days, reveal = 1, w = 128, h = 300, highlight) {
    const x0 = cx - (7 * w) / 2;
    days.forEach((d, i) => {
      const x = x0 + i * w;
      label(DAYS[i], x + w / 2, top - 18, INK, 54);
      S.rc.rectangle(x + 6, top, w - 12, h, ro({ strokeWidth: 4, stroke: SOFT }));
      if (reveal * 7 > i) {
        const c = COL[d] || INK, rest = d === 'REST';
        S.rc.rectangle(x + 12, top + 6, w - 24, h - 12, ro(rest ? { stroke: SOFT, strokeWidth: 3, fill: 'rgba(154,154,154,0.15)', fillStyle: 'solid' } : { stroke: c, strokeWidth: 5, fill: c, fillStyle: 'hachure', hachureGap: 12, fillWeight: 2 }));
        ctx.save(); ctx.translate(x + w / 2, top + h / 2); ctx.rotate(-Math.PI / 2);
        ctx.font = `700 ${d.length > 5 ? 50 : 60}px Caveat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 8; ctx.strokeStyle = '#f4f1ea'; ctx.strokeText(d, 0, 0); ctx.fillStyle = rest ? SOFT : c; ctx.fillText(d, 0, 0); ctx.restore();
      }
      if (highlight && highlight.includes(i)) S.rc.rectangle(x, top - 8, w, h + 16, ro({ stroke: RED, strokeWidth: 7, roughness: 2 }));
    });
  }
  // front-view stickman with muscle regions coloured. regions: { chest, shoulders, arms, back, core, legs, glutes } -> colour
  function bodyMap(o, regions, title, titleCol) {
    const P = p => toS(o, p);
    const draw = (key, fn) => { if (regions[key]) fn(regions[key]); };
    man(o, { arms: { L: [35, 8], R: [35, 8] } });
    const h = c => ro({ stroke: c, strokeWidth: 4, fill: c, fillStyle: 'hachure', hachureGap: 7, fillWeight: 2.5 });
    draw('back', c => { for (const sd of [-1, 1]) S.rc.ellipse(...P([sd * 0.13, 1.18]), 0.09 * o.s, 0.32 * o.s, h(c)); });
    draw('chest', c => S.rc.ellipse(...P([0, 1.3]), 0.3 * o.s, 0.13 * o.s, h(c)));
    draw('shoulders', c => { for (const sd of [-1, 1]) S.rc.circle(...P([sd * 0.07, 1.4]), 0.11 * o.s, h(c)); });
    draw('arms', c => { for (const sd of [-1, 1]) S.rc.ellipse(...P([sd * 0.09, 1.3]), 0.13 * o.s, 0.07 * o.s, h(c)); });
    draw('core', c => S.rc.ellipse(...P([0, 1.08]), 0.14 * o.s, 0.22 * o.s, h(c)));
    draw('glutes', c => { for (const sd of [-1, 1]) S.rc.circle(...P([sd * 0.06, 0.9]), 0.1 * o.s, h(c)); });
    draw('legs', c => { for (const sd of [-1, 1]) { S.rc.ellipse(...P([sd * 0.07, 0.68]), 0.09 * o.s, 0.32 * o.s, h(c)); S.rc.ellipse(...P([sd * 0.11, 0.26]), 0.07 * o.s, 0.25 * o.s, h(c)); } });
    if (title) label(title, o.x, o.y + 70, titleCol || INK, 62);
  }
  const ALL = c => ({ chest: c, shoulders: c, arms: c, back: c, core: c, legs: c, glutes: c });
  function nextCard(text, u) {
    sticky(180, 1120, 720, 260, -0.03, [['NEXT EPISODE', 54, RED], [text, 72]], fade(u, 0.05, 0.2));
  }
  function epTag(n) { ctx.save(); ctx.translate(120, 70); ctx.rotate(-0.08); S.rc.rectangle(-80, -40, 160, 70, ro({ stroke: RED, strokeWidth: 4 })); label('EP ' + n, 0, 12, RED, 48); ctx.restore(); }

  function run(cfg) {
    root.drawFrame = function (t) {
      begin(t);
      const st = segAt(t), c = rep(t, 2.4);
      const key = st.id.startsWith('hook') ? 'hook' : st.id;
      if (key === 'hook') { cfg.scenes.hook(t, st, c); bigHook(cfg.hook, 0, t, 260); }
      else {
        if (cfg.titles[key]) heading(...cfg.titles[key]);
        cfg.scenes[key](t, st, c);
        if (key === 'out' && st.u > 0.35) saveStamp(800, 470);
        flash(st.lt);
      }
      if (cfg.ep) epTag(cfg.ep);
      caption(t, cfg.key);
      return cv.toDataURL('image/png');
    };
    fontsReady();
  }
  Object.assign(root, { COL, calendar, bodyMap, ALL, nextCard, epTag, SplitRun: run });
})(window);
