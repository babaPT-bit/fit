// "Exercises by movement" reels: hook -> motion -> 4 option cards -> takeaway -> next episode.
// Load after doodlekit, fixkit, studykit, splitkit.
(function (root) {
  // ---- equipment icons (centred at x, y; k = scale) ----
  function icon(type, x, y, k = 1) {
    const r = S.rc, w = 5;
    if (type === 'barbell') { r.line(x - 140 * k, y, x + 140 * k, y, ro({ strokeWidth: 9, stroke: GREY })); for (const sd of [-1, 1]) { r.rectangle(x + sd * 110 * k - 14 * k, y - 60 * k, 28 * k, 120 * k, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' })); r.rectangle(x + sd * 82 * k - 10 * k, y - 42 * k, 20 * k, 84 * k, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' })); } }
    else if (type === 'dumbbell') { for (const dx of [-55, 55]) dumbbell([x + dx * k, y], 520 * k, 0); }
    else if (type === 'cable') { r.line(x - 90 * k, y + 110 * k, x - 90 * k, y - 120 * k, ro({ strokeWidth: 10, stroke: GREY })); r.circle(x - 80 * k, y - 100 * k, 30 * k, ro({ strokeWidth: 4 })); r.line(x - 80 * k, y - 100 * k, x + 70 * k, y + 10 * k, ro({ strokeWidth: 3, stroke: GREY })); r.linearPath([[x + 50 * k, y + 10 * k], [x + 70 * k, y + 40 * k], [x + 90 * k, y + 10 * k]], ro({ strokeWidth: 6 })); }
    else if (type === 'machine') { r.rectangle(x - 110 * k, y - 110 * k, 220 * k, 220 * k, ro({ strokeWidth: w, stroke: GREY })); r.rectangle(x - 40 * k, y - 20 * k, 80 * k, 100 * k, ro({ strokeWidth: 4, fill: 'rgba(74,74,74,0.3)', fillStyle: 'solid' })); for (const sd of [-1, 1]) r.line(x + sd * 40 * k, y - 50 * k, x + sd * 110 * k, y - 50 * k, ro({ strokeWidth: 7 })); }
    else if (type === 'body') { man({ x, y: y + 110 * k, s: 140 * k }, {}); }
    else if (type === 'band') { r.ellipse(x, y, 220 * k, 90 * k, ro({ stroke: RED, strokeWidth: 9 })); }
    else if (type === 'wheel') { r.circle(x, y, 120 * k, ro({ strokeWidth: 7 })); r.line(x - 110 * k, y, x + 110 * k, y, ro({ strokeWidth: 8, stroke: GREY })); }
    else if (type === 'landmine') { r.line(x - 120 * k, y + 100 * k, x + 110 * k, y - 80 * k, ro({ strokeWidth: 9, stroke: GREY })); r.rectangle(x + 90 * k, y - 120 * k, 30 * k, 90 * k, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' })); r.circle(x - 120 * k, y + 100 * k, 26 * k, ro({ strokeWidth: 5 })); }
    else if (type === 'trapbar') { r.polygon([[x - 90 * k, y - 50 * k], [x + 90 * k, y - 50 * k], [x + 120 * k, y], [x + 90 * k, y + 50 * k], [x - 90 * k, y + 50 * k], [x - 120 * k, y]], ro({ strokeWidth: 7, stroke: GREY })); }
    else if (type === 'bench') { r.line(x - 120 * k, y + 20 * k, x + 120 * k, y - 60 * k, ro({ strokeWidth: 14, stroke: GREY })); r.line(x, y - 20 * k, x, y + 100 * k, ro({ strokeWidth: 7, stroke: GREY })); }
    else if (type === 'kettlebell') { r.circle(x, y + 20 * k, 140 * k, ro({ strokeWidth: 6, fill: INK, fillStyle: 'hachure' })); r.arc(x, y - 50 * k, 90 * k, 70 * k, Math.PI, 2 * Math.PI, false, ro({ strokeWidth: 8 })); }
  }
  // ---- 4 option cards; the one being talked about lights up ----
  const SLOTS = [[290, 700], [790, 700], [290, 1270], [790, 1270]];
  function cards(list, active) {
    list.forEach((cd, i) => {
      const [x, y] = SLOTS[i], on = i === active, seen = i <= active;
      ctx.save(); ctx.globalAlpha = seen ? 1 : 0.3;
      S.rc.rectangle(x - 225, y - 250, 450, 500, ro(on ? { stroke: RED, strokeWidth: 8, roughness: 1.6, fill: 'rgba(215,38,30,0.06)', fillStyle: 'solid' } : { stroke: SOFT, strokeWidth: 4 }));
      icon(cd.icon, x, y - 80, 0.9);
      label(cd.name, x, y + 110, on ? RED : INK, cd.name.length > 14 ? 54 : 64);
      (Array.isArray(cd.tag) ? cd.tag : [cd.tag]).forEach((tg, j) => label(tg, x, y + 175 + j * 52, INK, 46));
      ctx.restore();
    });
  }
  // which card is active: keyword position within the options voice line
  function activeCard(list, t) {
    const s = SEG.options, txt = s.line.text.toLowerCase(); let a = -1;
    list.forEach((cd, i) => { const p = txt.indexOf(cd.kw.toLowerCase()); const at = s.vo + s.line.dur * (p < 0 ? i / list.length : p / txt.length); if (t >= at - 0.15) a = i; });
    return a;
  }
  function run(cfg) {
    root.drawFrame = function (t) {
      begin(t);
      const st = segAt(t), c = rep(t, cfg.period || 2.4);
      if (st.id === 'hook') { cfg.hookScene(t, st, c); bigHook(cfg.hook, 0, t, 260); }
      else if (st.id === 'motion') { heading(cfg.motionTitle[0], cfg.motionTitle[1]); cfg.motionScene(t, st, c); }
      else if (st.id === 'options') { heading('The options', null); cards(cfg.cards, activeCard(cfg.cards, t)); }
      else if (st.id === 'take') { heading('The takeaway', null); sticky(130, 560, 820, 520, -0.02, cfg.take, fade(st.u, 0.05, 0.2)); if (cfg.takeScene) cfg.takeScene(t, st, c); }
      else { heading('Ep ' + (cfg.ep + 1), cfg.next); nextCard(cfg.nextShort || cfg.next, st.u); if (st.u > 0.35) saveStamp(800, 470); }
      if (st.id !== 'hook') flash(st.lt);
      epTag(cfg.ep);
      caption(t, cfg.key);
      return cv.toDataURL('image/png');
    };
    fontsReady();
  }
  Object.assign(root, { icon, cards, MoveRun: run });
})(window);
