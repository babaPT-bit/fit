// Supplement reels: hook (myth shouted) -> calm narrator -> what -> help -> how -> verdict.
// Load after doodlekit, fixkit, studykit.
(function (root) {
  const G = '#4a4a4a';
  // ---- product doodles ----
  function tub(x, y, k, text, col = RED) {
    S.rc.rectangle(x - 110 * k, y - 150 * k, 220 * k, 270 * k, ro({ strokeWidth: 6, fill: '#fbf9f3', fillStyle: 'solid' }));
    S.rc.rectangle(x - 120 * k, y - 190 * k, 240 * k, 50 * k, ro({ strokeWidth: 6, fill: INK, fillStyle: 'solid' }));
    S.rc.rectangle(x - 90 * k, y - 90 * k, 180 * k, 120 * k, ro({ strokeWidth: 4, stroke: col, fill: col, fillStyle: 'hachure', hachureGap: 12 }));
    label(text, x, y - 15 * k, INK, 46 * k);
  }
  function bottle(x, y, k, text, col = RED) {
    S.rc.rectangle(x - 80 * k, y - 120 * k, 160 * k, 240 * k, ro({ strokeWidth: 6, fill: '#fbf9f3', fillStyle: 'solid' }));
    S.rc.rectangle(x - 60 * k, y - 170 * k, 120 * k, 50 * k, ro({ strokeWidth: 6, fill: col, fillStyle: 'solid' }));
    label(text, x, y + 15 * k, col, (text.length > 6 ? 34 : 44) * k);
  }
  function pill(x, y, k, col = RED, ang = 0.4) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    S.rc.ellipse(0, 0, 120 * k, 50 * k, ro({ strokeWidth: 4, fill: '#fbf9f3', fillStyle: 'solid' }));
    S.rc.ellipse(-30 * k, 0, 60 * k, 50 * k, ro({ strokeWidth: 3, stroke: col, fill: col, fillStyle: 'solid' }));
    ctx.restore();
  }
  function scoop(x, y, k, col = '#d9c39a') {
    S.rc.arc(x, y, 160 * k, 120 * k, 0, Math.PI, false, ro({ strokeWidth: 6, fill: col, fillStyle: 'solid' }));
    S.rc.line(x + 80 * k, y, x + 200 * k, y - 50 * k, ro({ strokeWidth: 10 }));
  }
  function shaker(x, y, k) {
    S.rc.linearPath([[x - 70 * k, y - 160 * k], [x - 55 * k, y + 120 * k], [x + 55 * k, y + 120 * k], [x + 70 * k, y - 160 * k]], ro({ strokeWidth: 6 }));
    S.rc.rectangle(x - 78 * k, y - 210 * k, 156 * k, 50 * k, ro({ strokeWidth: 6, fill: INK, fillStyle: 'solid' }));
    S.rc.rectangle(x - 58 * k, y - 40 * k, 112 * k, 150 * k, ro({ strokeWidth: 3, stroke: '#d9c39a', fill: '#d9c39a', fillStyle: 'hachure', hachureGap: 9 }));
  }
  function sun(x, y, k, t) { S.rc.circle(x, y, 160 * k, ro({ strokeWidth: 6, stroke: '#e0a800', fill: 'rgba(255,214,0,0.5)', fillStyle: 'solid' })); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + t * 0.4; S.rc.line(x + Math.cos(a) * 110 * k, y + Math.sin(a) * 110 * k, x + Math.cos(a) * 160 * k, y + Math.sin(a) * 160 * k, ro({ strokeWidth: 5, stroke: '#e0a800' })); } }
  function fish(x, y, k) { S.rc.ellipse(x, y, 260 * k, 120 * k, ro({ strokeWidth: 6, stroke: '#2b6cb0', fill: 'rgba(43,108,176,0.25)', fillStyle: 'hachure' })); S.rc.polygon([[x + 120 * k, y], [x + 200 * k, y - 60 * k], [x + 200 * k, y + 60 * k]], ro({ strokeWidth: 6, stroke: '#2b6cb0' })); S.rc.circle(x - 70 * k, y - 15 * k, 18 * k, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' })); }
  function cup(x, y, k) { S.rc.rectangle(x - 80 * k, y - 100 * k, 160 * k, 180 * k, ro({ strokeWidth: 6, fill: 'rgba(122,74,26,0.35)', fillStyle: 'solid' })); S.rc.arc(x + 80 * k, y - 10 * k, 80 * k, 90 * k, -Math.PI / 2, Math.PI / 2, false, ro({ strokeWidth: 6 })); for (const d of [-30, 10, 50]) S.rc.curve([[x + d * k - 20, y - 130 * k], [x + d * k, y - 170 * k], [x + d * k - 20, y - 210 * k]], ro({ strokeWidth: 3, stroke: SOFT })); }
  function kidney(x, y, k, ok) { S.rc.ellipse(x, y, 140 * k, 220 * k, ro({ strokeWidth: 6, stroke: '#8a3b2b', fill: 'rgba(160,70,50,0.35)', fillStyle: 'solid' })); S.rc.circle(x + 40 * k, y, 50 * k, ro({ strokeWidth: 4, fill: '#f4f1ea', fillStyle: 'solid' })); }
  function draw(item, x, y, k, t) {
    const [type, txt, col] = item;
    if (type === 'tub') tub(x, y, k, txt, col); else if (type === 'bottle') bottle(x, y, k, txt, col);
    else if (type === 'pills') { for (let i = 0; i < 4; i++) pill(x - 90 * k + i * 60 * k, y + Math.sin(i * 2) * 40 * k, k, col || RED, 0.3 + i * 0.5); }
    else if (type === 'scoop') scoop(x, y, k, col); else if (type === 'shaker') shaker(x, y, k);
    else if (type === 'sun') sun(x, y, k, t); else if (type === 'fish') fish(x, y, k); else if (type === 'cup') cup(x, y, k);
    else if (type === 'kidney') kidney(x, y, k); else if (type === 'man') man({ x, y: y + 200 * k, s: 260 * k }, { arms: { L: [80, 100], R: [80, 100] }, flex: 0.8, flexSide: 'LR' });
    if (txt && (type === 'sun' || type === 'fish' || type === 'cup' || type === 'pills' || type === 'scoop' || type === 'shaker' || type === 'kidney' || type === 'man')) label(txt, x, y + 230 * k, col || INK, 52 * k);
  }
  // verdict stamp: 'yes' | 'maybe' | 'no'
  function verdict(kind, x, y, u) {
    const a = ease(fade(u, 0.05, 0.25)); if (a <= 0) return;
    const [txt, col] = { yes: ['WORTH IT', GREEN], maybe: ['OPTIONAL', '#d9822b'], no: ['SKIP IT', RED], info: ['KNOW THIS', INK] }[kind];
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-0.12); ctx.scale(1.4 - 0.4 * a, 1.4 - 0.4 * a);
    S.rc.rectangle(-270, -90, 540, 170, ro({ stroke: col, strokeWidth: 10, roughness: 2 }));
    label(txt, 0, 30, col, 110); ctx.restore();
  }
  function doctorNote(text, y = 1500) { const lines = Array.isArray(text) ? text : [text]; sticky(130, y - 80, 820, 110 + lines.length * 64, 0.02, lines.map((l, i) => [(i ? '' : '⚕ ') + l, 52, RED]), 1); }
  // generic panel: up to 3 items with labels
  function panel(items, t) {
    const n = items.length;
    items.forEach((it, i) => { const x = n === 1 ? 540 : 200 + i * (680 / (n - 1)); draw(it, x, 1000, n === 1 ? 1.5 : 1, t); });
  }
  function notes(lines, u, y = 560) { sticky(130, y, 820, 120 + lines.length * 82, -0.02, lines, fade(u, 0.05, 0.2)); }

  function run(cfg) {
    root.drawFrame = function (t) {
      begin(t);
      const st = segAt(t), id = st.id;
      if (id === 'hook1' || id === 'hook2') {
        const talk = speaking('hook1', t), calm = id === 'hook2';
        if (cfg.speaker === 'bro') bro({ x: 300, y: 1650, s: 420 }, t, talk, { arms: { L: [20, 10], R: [80, 0] } });
        else man({ x: 300, y: 1650, s: 420 }, { face: talk ? 'shout' : 'smile', mouth: 0.4 + 0.6 * Math.abs(Math.sin(t * 16)), arms: { L: [150, 20], R: [150, 20] } });
        draw(cfg.hookProp, 800, 1350, 1, t);
        if (t > SEG.hook1.vo - 0.1 && !calm) say(560, 700, 700, cfg.bubble, [380, 960], 54);
        if (calm) { ctx.globalAlpha = 0.35; say(560, 700, 700, cfg.bubble, [380, 960], 54); ctx.globalAlpha = 1; label('really?', 800, 1050, RED, 80); }
        bigHook(cfg.hook, 0, t, 230);
      } else {
        const sc = cfg[id];
        heading(...sc.title);
        if (sc.items) panel(sc.items, t);
        if (sc.notes) notes(sc.notes, st.u, sc.notesY || 1250);
        if (sc.bars) bars(540, 1350, sc.bars, 560, 200, 90);
        if (sc.extra) sc.extra(t, st);
        if (id === 'out') { verdict(cfg.verdict, 540, 800, st.u); if (cfg.doctor) doctorNote(cfg.doctor, 1300); if (st.u > 0.5) saveStamp(820, 1620); }
        flash(st.lt);
      }
      label('SUPPLEMENTS ' + cfg.ep, 150, 75, RED, 40);
      caption(t, cfg.key);
      return cv.toDataURL('image/png');
    };
    fontsReady();
  }
  Object.assign(root, { tub, bottle, pill, scoop, shaker, sun, fish, cup, kidney, draw, verdict, doctorNote, panel, notes, SupRun: run });
})(window);
