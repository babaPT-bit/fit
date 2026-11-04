// "Problem -> cause -> step 1 (form) -> step 2 (corrective) -> out" reels.
// Reusable doodle drawings + a runner. Load after doodlekit.js.
(function (root) {
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const pol = (deg, k = 1) => [Math.cos(rad(deg)) * k, Math.sin(rad(deg)) * k];      // 0 right, 90 up
  const toS = (o, p) => [o.x + p[0] * o.s, o.y - p[1] * o.s];
  const GREY = '#4a4a4a';

  function arrow(x1, y1, x2, y2, col = RED, w = 6) {
    S.rc.line(x1, y1, x2, y2, ro({ stroke: col, strokeWidth: w, roughness: 1 }));
    const a = Math.atan2(y2 - y1, x2 - x1);
    for (const da of [2.6, -2.6]) S.rc.line(x2, y2, x2 + 24 * Math.cos(a + da), y2 + 24 * Math.sin(a + da), ro({ stroke: col, strokeWidth: w, roughness: 0.6 }));
  }
  function spark(x, y, t, r = 60) {
    const k = 0.7 + 0.3 * Math.sin(t * 12);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; S.rc.line(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35, x + Math.cos(a) * r * k, y + Math.sin(a) * r * k, ro({ stroke: RED, strokeWidth: 6, roughness: 0.6 })); }
  }
  function zoom(cx, cy, r, scale, draw, from) {
    lens(cx, cy, r, from); ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, 7); ctx.clip();
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy); draw(cx, cy); ctx.restore(); lensRing(cx, cy, r);
  }
  function label(text, x, y, col = INK, size = 56, align = 'center') { ctx.font = `700 ${size}px Caveat`; ctx.fillStyle = col; ctx.textAlign = align; ctx.fillText(text, x, y); }
  function physio() { label('Sharp or lasting pain? See a physio.', 540, 1730, INK, 46); }

  // ---------- figures ----------
  // overhead press, front view
  function ohp(o, c, opts = {}) {
    const hy = 1.5 + 0.62 * c;
    const m = man(o, Object.assign({ hands: { L: [-0.3, hy], R: [0.3, hy] } }, opts));
    S.rc.line(...toS(o, [-0.55, hy]), ...toS(o, [0.55, hy]), ro({ strokeWidth: 9, stroke: GREY }));
    for (const sd of [-1, 1]) S.rc.rectangle(...toS(o, [sd * 0.48 - 0.03, hy + 0.16]), 0.06 * o.s, 0.32 * o.s, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' }));
    return { m, shoulderR: toS(o, [0.17, 1.4]) };
  }
  // bench press seen from above. angle = elbow angle from the torso, p = press 0..1
  function benchTop(o, angle, p) {
    const s = o.s, P = (x, y) => [o.x + x * s, o.y + y * s];
    S.rc.rectangle(o.x - 0.2 * s, o.y - 0.3 * s, 0.4 * s, 1.2 * s, ro({ strokeWidth: 5, stroke: GREY, fill: 'rgba(74,74,74,0.12)', fillStyle: 'solid' }));
    S.rc.linearPath([P(0, 0), P(0, 0.5)], ro());
    for (const sd of [-1, 1]) S.rc.linearPath([P(0, 0.5), P(sd * 0.2, 0.92), P(sd * 0.26, 1.32)], ro());
    S.rc.line(...P(-0.2, 0), ...P(0.2, 0), ro());
    const hp = P(0, -0.17), R = 0.11 * s;
    S.rc.circle(...hp, R * 2, ro({ fill: '#f4f1ea', fillStyle: 'solid' }));
    ctx.fillStyle = INK; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hp[0] + sd * R * 0.35, hp[1] - R * 0.1, R * 0.09, R * 0.13, 0, 0, 7); ctx.fill(); }
    S.rc.arc(hp[0], hp[1] + R * 0.25, R * 0.8, R * 0.5, 0.35, Math.PI - 0.35, false, ro({ strokeWidth: 5 }));
    const L = 0.3 * (1 - 0.55 * p), a = rad(angle); let ey = 0;
    for (const sd of [-1, 1]) {
      const E = [sd * 0.2 + sd * Math.sin(a) * L, Math.cos(a) * L]; ey = E[1];
      S.rc.line(...P(sd * 0.2, 0), ...P(...E), ro({ strokeWidth: 8 }));
      S.rc.circle(...P(...E), 22, ro({ strokeWidth: 5, fill: '#f4f1ea', fillStyle: 'solid' }));
    }
    const k = 1 + 0.1 * p;
    S.rc.line(...P(-0.62 * k, ey), ...P(0.62 * k, ey), ro({ strokeWidth: 10, stroke: GREY }));
    for (const sd of [-1, 1]) S.rc.rectangle(...P(sd * 0.55 * k - 0.03, ey - 0.16 * k), 0.06 * s, 0.32 * k * s, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' }));
    const sh = P(0.2, 0), r = 100;
    ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(sh[0], sh[1], r, Math.PI / 2 - a, Math.PI / 2); ctx.stroke();
    label(angle + '°', sh[0] + 40, sh[1] + r + 60, RED, 60, 'left');
  }
  // upper back from behind; spread 0 = blades squeezed together, 1 = drifted apart/forward
  function scapMap(cx, cy, spread, arrows) {
    S.rc.linearPath([[cx - 220, cy - 200], [cx + 220, cy - 200], [cx + 160, cy + 230], [cx - 160, cy + 230], [cx - 220, cy - 200]], ro({ strokeWidth: 5 }));
    S.rc.line(cx, cy - 220, cx, cy + 240, ro({ strokeWidth: 4, stroke: SOFT }));
    const dx = 50 + 90 * spread;
    for (const sd of [-1, 1]) S.rc.polygon([[cx + sd * dx, cy - 140], [cx + sd * (dx + 110), cy - 120], [cx + sd * (dx + 10), cy + 90]], ro(spread > 0.5 ? pencil() : hatch(RED, 8)));
    if (arrows === 'out') for (const sd of [-1, 1]) arrow(cx + sd * (dx + 60), cy - 20, cx + sd * (dx + 150), cy - 20);
    if (arrows === 'in') for (const sd of [-1, 1]) arrow(cx + sd * 200, cy + 150, cx + sd * 70, cy + 150, GREEN);
  }
  // deadlift, side view, facing right. p 0 = bottom, 1 = standing
  function deadJ(p) {
    const ankle = [0, 0.07], knee = add(ankle, pol(90 - 25 * (1 - p)), 0.45);
    const hip = add(knee, pol(90 + 10 + 70 * (1 - p)), 0.45);
    const sh = add(hip, pol(90 - 8 - 62 * (1 - p)), 0.52);
    const hand = [sh[0] + 0.02, sh[1] - 0.57], elb = [sh[0] + 0.01, sh[1] - 0.3];
    return { ankle, knee, hip, sh, elb, hand };
  }
  function deadlift(o, p, rounded) {
    const J = deadJ(p);
    S.rc.circle(...toS(o, J.hand), 0.3 * o.s, ro({ strokeWidth: 5, stroke: GREY, fill: 'rgba(26,26,26,0.3)', fillStyle: 'hachure', hachureGap: 12 }));
    const f = sideFig(o, J);
    if (rounded) {
      const a = toS(o, J.hip), b = toS(o, J.sh), mid = [(a[0] + b[0]) / 2 - 40 * (1 - p) * 0, (a[1] + b[1]) / 2 - 60 * (1 - p)];
      S.rc.curve([a, mid, b], ro({ stroke: RED, strokeWidth: 9 }));
    }
    return { f, J, lowBack: toS(o, add(J.hip, add(J.sh, J.hip, -1), 0.25)), belly: (() => { const d = add(J.sh, J.hip, -1), L = Math.hypot(...d), u = [d[0] / L, d[1] / L]; return toS(o, add(add(J.hip, u, 0.18), [u[1], -u[0]], 0.11)); })() };
  }
  function spineMap(cx, cy, rounded) {
    const pts = rounded ? [[cx - 180, cy + 120], [cx - 60, cy - 60], [cx + 80, cy - 90], [cx + 190, cy + 40]] : [[cx - 190, cy + 60], [cx - 60, cy + 10], [cx + 60, cy - 30], [cx + 190, cy - 80]];
    for (let i = 0; i < 4; i++) { const k = i / 3, x = pts[0][0] + (pts[3][0] - pts[0][0]) * k; }
    S.rc.curve(pts, ro({ strokeWidth: 12, stroke: rounded ? RED : INK }));
    for (const [x, y] of pts) S.rc.circle(x, y, 40, ro({ strokeWidth: 4, fill: '#f4f1ea', fillStyle: 'solid' }));
  }
  // lying on the back, head on the left (face up)
  const LYING = { lookDeg: 90, upDeg: 180 };
  function bridgeJ(p) {
    const sh = [-0.5, 0.12], hip = [0.0, 0.12 + 0.3 * p], knee = [0.32, 0.46], ankle = [0.45, 0.07];
    return { sh, hip, knee, ankle, elb: [-0.28, 0.06], hand: [-0.05, 0.06], head: [-0.7, 0.13], toe: [0.58, 0.05] };
  }
  function deadBugJ(p) {
    const sh = [-0.52, 0.12], hip = [0.0, 0.12];
    const elb = add(sh, pol(90 + 70 * p), 0.3), hand = add(elb, pol(90 + 70 * p), 0.28);
    const knee = add(hip, pol(90 - 70 * p), 0.45), ankle = add(knee, pol(0 - 20 * p), 0.43);
    return { sh, hip, elb, hand, knee, ankle, elb2: add(sh, pol(90), 0.3), hand2: add(sh, pol(90), 0.58), knee2: add(hip, pol(90), 0.45), ankle2: add(add(hip, pol(90), 0.45), pol(0), 0.43), head: [-0.72, 0.13], toe: add(ankle, pol(70 - 20 * p), 0.1) };
  }
  function floorLine(o, x0 = -0.9, x1 = 0.9) { S.rc.line(...toS(o, [x0, 0]), ...toS(o, [x1, 0]), ro({ strokeWidth: 5, stroke: SOFT })); }
  // squat front view
  function squatFront(o, d, valgus) {
    const m = man(o, { squat: d, valgus, arms: { L: [80, 70], R: [80, 70] } });
    const kneeY = o.y - (0.47 - 0.1 * d) * o.s;
    return { m, kneeL: [o.x - ((0.1 + 0.2 * d) * (1 - valgus) + 0.03 * valgus) * o.s, kneeY], kneeR: [o.x + ((0.1 + 0.2 * d) * (1 - valgus) + 0.03 * valgus) * o.s, kneeY] };
  }
  function gluteMap(cx, cy, on) {
    S.rc.linearPath([[cx - 200, cy - 120], [cx + 200, cy - 120], [cx + 160, cy + 120], [cx - 160, cy + 120], [cx - 200, cy - 120]], ro({ strokeWidth: 5 }));
    for (const sd of [-1, 1]) S.rc.ellipse(cx + sd * 150, cy - 40, 110, 170, ro(on ? hatch(RED, 8) : pencil()));
    label(on ? 'side glutes ON' : 'side glutes… zzz', cx, cy + 210, on ? RED : INK, 58);
  }
  function upperBackMap(cx, cy) {
    S.rc.linearPath([[cx - 220, cy - 180], [cx + 220, cy - 180], [cx + 160, cy + 220], [cx - 160, cy + 220], [cx - 220, cy - 180]], ro({ strokeWidth: 5 }));
    for (const sd of [-1, 1]) S.rc.circle(cx + sd * 210, cy - 150, 110, ro(hatch(RED, 8)));
    S.rc.polygon([[cx - 140, cy - 160], [cx + 140, cy - 160], [cx, cy + 120]], ro(hatch(RED, 10)));
    label('rear delts + mid back', cx, cy + 250, RED, 56);
  }

  // ---------- runner ----------
  function run(cfg) {
    root.drawFrame = function (t) {
      begin(t);
      const st = segAt(t), c = rep(t, cfg.period || 2.6);
      const sc = cfg.scenes[st.id];
      if (st.id === 'hook') { sc(t, st, c); bigHook(cfg.hook, st.s.start, t, 280); }
      else {
        if (cfg.titles && cfg.titles[st.id]) heading(...cfg.titles[st.id]);
        sc(t, st, c);
        if (st.id === 'out') { if (cfg.physio !== false) physio(); if (st.u > 0.3) saveStamp(800, 470); }
        flash(st.lt);
      }
      caption(t, cfg.key);
      return cv.toDataURL('image/png');
    };
    fontsReady();
  }

  Object.assign(root, { add, pol, toS, GREY, arrow, spark, zoom, label, physio, ohp, benchTop, scapMap, deadJ, deadlift, spineMap, LYING, bridgeJ, deadBugJ, floorLine, squatFront, gluteMap, upperBackMap, FixRun: run });
})(window);
