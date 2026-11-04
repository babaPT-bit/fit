// Shared helpers for the doodle (paper stickman) reels: voice timeline, captions, front-view
// stickman rig, speech bubbles, sticky notes, the big hook title and the "Save this" stamp.
// Load after rough.js, doodle.js and voice/lines.js. Exposes globals.
(function (root) {
  const W = 1080, H = 1920, INK = '#1a1a1a', RED = '#d7261e', SOFT = 'rgba(26,26,26,0.35)', GREEN = '#1f8a3b';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const fade = (t, a, b) => clamp((t - a) / (b - a));
  const rad = d => d * Math.PI / 180;
  const S = { rc: null, seed: 1 };
  const ro = (e = {}) => Object.assign({ stroke: INK, strokeWidth: 7, roughness: 1.4, bowing: 1.2, seed: S.seed }, e);

  // ---------- brisk voice timeline ----------
  const VO = root.VOICE, SEG = {}; let tc = 0;
  // pacing: a page can set window.TIMING = { pre, post }; a voice line can add its own "post" pause
  const TM = root.TIMING || {}, PRE = TM.pre ?? 0.08, POST = TM.post ?? 0.12;
  for (const ln of VO) { const post = ln.post ?? POST; SEG[ln.id] = { start: tc, vo: tc + PRE, end: tc + PRE + ln.dur + post, line: ln }; tc = SEG[ln.id].end; }
  root.DURATION = tc + 0.35; root.VO_TIMES = VO.map(ln => ({ file: ln.file, at: SEG[ln.id].vo }));
  function segAt(t) { let id = VO[0].id; for (const ln of VO) if (t >= SEG[ln.id].start) id = ln.id; const s = SEG[id]; return { id, s, u: clamp((t - s.start) / (s.end - s.start)), lt: t - s.start }; }
  const speaking = (id, t) => SEG[id] && t >= SEG[id].vo && t <= SEG[id].vo + SEG[id].line.dur;
  const rep = (t, period = 1.8) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / period);

  // ---------- captions ----------
  const CH = [];
  for (const ln of VO) {
    const words = ln.text.split(' '), cs = []; let cur = [];
    words.forEach((w, i) => { cur.push(w); if (/[.,!?]$/.test(w) || cur.length >= 4 || i === words.length - 1) { cs.push(cur.join(' ')); cur = []; } });
    let acc = 0; const total = ln.text.length, st = SEG[ln.id].vo;
    for (const c of cs) { const t0 = st + ln.dur * acc / total; acc += c.length + 1; CH.push({ text: c, t0, t1: st + ln.dur * Math.min(1, acc / total) }); }
  }
  function caption(t, keyRe) {
    const c = CH.find((c, i) => t >= c.t0 && t < (CH[i + 1] && CH[i + 1].t0 - c.t1 < 0.6 ? CH[i + 1].t0 : c.t1 + 0.25));
    if (!c) return;
    const words = c.text.split(' ');
    ctx.font = '700 82px Caveat';
    const sp = ctx.measureText(' ').width, w = words.reduce((s, x) => s + ctx.measureText(x).width, 0) + sp * (words.length - 1);
    ctx.fillStyle = 'rgba(244,241,234,0.9)'; ctx.fillRect(540 - w / 2 - 30, 1792, w + 60, 100);
    let x = 540 - w / 2; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const word of words) { ctx.fillStyle = keyRe && keyRe.test(word.replace(/[^\w½⅓⅔%°-]/g, '')) ? RED : INK; ctx.fillText(word, x, 1842); x += ctx.measureText(word).width + sp; }
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- frame scaffolding ----------
  function begin(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.drawImage(Doodle.background('paper'), 0, 0);
    S.seed = 1 + Math.floor(t * 8); S.rc = Doodle.kit(ctx, 'paper', S.seed).rc;
  }
  function flash(since) { if (since >= 0 && since < 0.1) { ctx.fillStyle = `rgba(244,241,234,${1 - since / 0.1})`; ctx.fillRect(0, 0, W, H); } }

  // ---------- big hook: huge handwritten red text that pops in ----------
  function bigHook(lines, t0, t, y = 360) {
    const a = ease(fade(t, t0, t0 + 0.25)), k = 0.6 + 0.4 * a + 0.03 * Math.sin(t * 9);
    ctx.save(); ctx.translate(540, y); ctx.rotate(-0.04); ctx.scale(k, k); ctx.globalAlpha = a;
    let yy = 0;
    for (const [txt, size, col] of lines) {
      ctx.font = `700 ${size}px Caveat`; ctx.textAlign = 'center';
      ctx.lineWidth = 14; ctx.strokeStyle = '#f4f1ea'; ctx.lineJoin = 'round'; ctx.strokeText(txt, 0, yy);
      ctx.fillStyle = col || RED; ctx.fillText(txt, 0, yy); yy += size * 0.95;
    }
    const w = 420; S.rc.line(-w, yy - 50, w, yy - 62, ro({ stroke: RED, strokeWidth: 9, roughness: 2.5 }));
    S.rc.line(-w + 40, yy - 30, w - 60, yy - 38, ro({ stroke: RED, strokeWidth: 6, roughness: 2.5 }));
    ctx.restore();
  }
  function heading(a, b, y = 150) {
    ctx.textAlign = 'center'; ctx.font = '700 96px Caveat'; ctx.fillStyle = INK; ctx.fillText(a, 540, y);
    if (b) { ctx.font = '700 64px Caveat'; ctx.fillStyle = RED; ctx.fillText(b, 540, y + 72); }
  }
  function saveStamp(x = 830, y = 330) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12);
    S.rc.rectangle(-170, -70, 340, 120, ro({ stroke: RED, strokeWidth: 6, roughness: 2 }));
    ctx.font = '700 72px Caveat'; ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.fillText('Save this!', 0, 18); ctx.restore();
  }
  function mark(ok, x, y, size = 90) {
    if (ok) S.rc.linearPath([[x - size * 0.5, y], [x - size * 0.1, y + size * 0.4], [x + size * 0.6, y - size * 0.5]], ro({ stroke: GREEN, strokeWidth: 12, roughness: 1 }));
    else { S.rc.line(x - size / 2, y - size / 2, x + size / 2, y + size / 2, ro({ stroke: RED, strokeWidth: 12 })); S.rc.line(x + size / 2, y - size / 2, x - size / 2, y + size / 2, ro({ stroke: RED, strokeWidth: 12 })); }
  }
  function question(x, y, t, size = 110) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.18 * Math.sin(t * 4));
    ctx.font = `700 ${size}px Caveat`; ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.fillText('?', 0, 0); ctx.restore();
  }
  function bubble(x, y, w, h, tail, text, col = INK, size = 60) {
    S.rc.ellipse(x, y, w, h, ro({ stroke: col, strokeWidth: 5, fill: '#fbf9f3', fillStyle: 'solid' }));
    S.rc.linearPath([[x - 20, y + h / 2 - 8], tail, [x + 20, y + h / 2 - 8]], ro({ stroke: col, strokeWidth: 5 }));
    ctx.font = `700 ${size}px Caveat`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 4); ctx.textBaseline = 'alphabetic';
  }
  function sticky(x, y, w, h, rot, lines, appear = 1) {
    if (appear <= 0) return;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.globalAlpha = appear; ctx.scale(0.9 + 0.1 * appear, 0.9 + 0.1 * appear);
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#fff3a6'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(240,230,190,0.8)'; ctx.fillRect(-60, -h / 2 - 16, 120, 32);
    let yy = -h / 2 + 72;
    for (const [txt, size, col] of lines) { ctx.font = `700 ${size}px Caveat`; ctx.fillStyle = col || INK; ctx.textAlign = 'center'; ctx.fillText(txt, 0, yy); yy += size * 1.05; }
    ctx.restore();
  }
  function lens(cx, cy, r, from) {
    if (from) {
      const [fx, fy, fr] = from, ang = Math.atan2(cy - fy, cx - fx), p = ang + Math.PI / 2;
      for (const sg of [-1, 1]) S.rc.line(fx + Math.cos(p) * fr * sg, fy + Math.sin(p) * fr * sg, cx + Math.cos(p) * r * sg, cy + Math.sin(p) * r * sg, ro({ stroke: SOFT, strokeWidth: 3 }));
      S.rc.circle(fx, fy, fr * 2, ro({ stroke: RED, strokeWidth: 5 }));
    }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = '#fbf9f3'; ctx.fill(); ctx.restore();
  }
  function lensRing(cx, cy, r) { S.rc.circle(cx, cy, r * 2, ro({ strokeWidth: 9 })); }
  const hatch = (col = RED, gap = 8) => ({ stroke: col, strokeWidth: 5, fill: col, fillStyle: 'hachure', hachureGap: gap, fillWeight: 3 });
  const pencil = () => ({ stroke: INK, strokeWidth: 4, fill: 'rgba(26,26,26,0.25)', fillStyle: 'hachure', hachureGap: 15, fillWeight: 1.5, hachureAngle: 40 });

  // ---------- front-view stickman ----------
  function man(o, pose = {}) {
    const rc = S.rc, P = p => [o.x + p[0] * o.s, o.y - p[1] * o.s];
    const sq = pose.squat || 0;
    const hip = [0, 0.92 - 0.36 * sq], neck = [0, hip[1] + 0.56], sh = [0, hip[1] + 0.5], head = [0, hip[1] + 0.71];
    const line = (pts, w = 7, col = INK) => rc.linearPath(pts.map(P), ro({ strokeWidth: w, stroke: col }));
    if (!pose.noLegs) for (const s of [-1, 1]) {
      const vg = pose.valgus || 0, foot = [s * (0.15 + 0.07 * sq), 0], knee = [s * ((0.1 + 0.2 * sq) * (1 - vg) + 0.03 * vg), 0.47 - 0.1 * sq];
      line([hip, knee, foot]); line([foot, [foot[0] + s * 0.07, 0]]);
    }
    line([hip, neck]);
    const out = { sh: P(sh) };
    for (const [side, s] of [['L', -1], ['R', 1]]) {
      let E, Hd;
      if (pose.hands && pose.hands[side]) { Hd = pose.hands[side]; E = [(sh[0] + Hd[0]) / 2 + s * 0.08, (sh[1] + Hd[1]) / 2 - 0.08]; }
      else {
        const [a1, a2] = (pose.arms && pose.arms[side]) || [12, 6];
        const u = [s * Math.sin(rad(a1)), -Math.cos(rad(a1))], f = [s * Math.sin(rad(a1 + a2)), -Math.cos(rad(a1 + a2))];
        E = [sh[0] + u[0] * 0.3, sh[1] + u[1] * 0.3]; Hd = [E[0] + f[0] * 0.28, E[1] + f[1] * 0.28];
      }
      line([sh, E, Hd]);
      out[side] = { E: P(E), H: P(Hd) };
      const fl = pose.flex && (pose.flexSide || 'R').includes(side) ? pose.flex : 0;
      if (fl) {
        const m = [(sh[0] + E[0]) / 2 + s * 0.03, (sh[1] + E[1]) / 2 + 0.02], mp = P(m), ang = Math.atan2(-(E[1] - sh[1]), E[0] - sh[0]);
        ctx.save(); ctx.translate(...mp); ctx.rotate(ang);
        rc.ellipse(0, 0, (0.2 + 0.08 * fl) * o.s, (0.05 + 0.12 * fl) * o.s, ro(hatch(RED, 7)));
        ctx.restore();
      }
    }
    const hp = P(head), R = 0.12 * o.s, look = (pose.look || 0) * R * 0.3, face = pose.face || 'smile';
    rc.circle(hp[0], hp[1], R * 2, ro({ fill: '#f4f1ea', fillStyle: 'solid' }));
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hp[0] + s * R * 0.35 + look, hp[1] - R * 0.15, R * 0.09, R * (face === 'shout' || face === 'shock' ? 0.09 : 0.14), 0, 0, 7); ctx.fill(); }
    if (face === 'shout' || face === 'shock') {
      if (face === 'shout') for (const s of [-1, 1]) rc.line(hp[0] + s * R * 0.55 + look, hp[1] - R * 0.5, hp[0] + s * R * 0.15 + look, hp[1] - R * 0.32, ro({ strokeWidth: 4, roughness: 0.6 }));
      const open = pose.mouth ?? 1;
      ctx.beginPath(); ctx.ellipse(hp[0] + look, hp[1] + R * 0.42, R * (face === 'shock' ? 0.18 : 0.28), R * (0.08 + 0.22 * open), 0, 0, 7); ctx.fill();
    } else if (face === 'sad' || face === 'confused') {
      if (face === 'sad') rc.arc(hp[0] + look, hp[1] + R * 0.62, R * 0.7, R * 0.45, Math.PI + 0.4, 2 * Math.PI - 0.4, false, ro({ strokeWidth: 5 }));
      else rc.curve([[hp[0] - R * 0.35 + look, hp[1] + R * 0.45], [hp[0] - R * 0.1 + look, hp[1] + R * 0.35], [hp[0] + R * 0.1 + look, hp[1] + R * 0.5], [hp[0] + R * 0.35 + look, hp[1] + R * 0.4]], ro({ strokeWidth: 4, roughness: 0.6 }));
    } else rc.arc(hp[0] + look, hp[1] + R * 0.2, R * 0.9, R * 0.6, 0.35, Math.PI - 0.35, false, ro({ strokeWidth: 5 }));
    out.head = hp; out.headR = R;
    return out;
  }
  function dumbbell(p, s, ang = 0) {
    ctx.save(); ctx.translate(...p); ctx.rotate(ang);
    S.rc.line(-0.08 * s, 0, 0.08 * s, 0, ro({ stroke: '#4a4a4a', strokeWidth: 8 }));
    for (const x of [-0.085, 0.085]) S.rc.rectangle(x * s - 0.025 * s, -0.06 * s, 0.05 * s, 0.12 * s, ro({ strokeWidth: 4, fill: INK, fillStyle: 'solid' }));
    ctx.restore();
  }
  // side-view stickman from explicit joint points (units, y up). J: ankle, knee, hip, sh, elb, hand,
  // optional far limbs ankle2/knee2/elb2/hand2 (drawn soft). face: +1 looks right, -1 left.
  function sideFig(o, J, opts = {}) {
    const P = p => [o.x + p[0] * o.s, o.y - p[1] * o.s], rc = S.rc;
    const ln = (pts, w = 7, c = INK) => rc.linearPath(pts.map(P), ro({ strokeWidth: w, stroke: c }));
    const dir = opts.face ?? 1;
    if (J.knee2) ln([J.hip, J.knee2, J.ankle2], 7, SOFT);
    if (J.elb2) ln([J.sh, J.elb2, J.hand2], 7, SOFT);
    ln([J.hip, J.knee, J.ankle]);
    const toe = J.toe || [J.ankle[0] + dir * 0.13, J.ankle[1] - 0.04];
    ln([J.ankle, toe]);
    ln([J.hip, J.sh]);
    const td = [J.sh[0] - J.hip[0], J.sh[1] - J.hip[1]], tl = Math.hypot(...td);
    const hc = J.head || [J.sh[0] + td[0] / tl * 0.2, J.sh[1] + td[1] / tl * 0.2];
    if (J.elb) ln([J.sh, J.elb, J.hand]);
    if (J.head) { const hv = [hc[0] - J.sh[0], hc[1] - J.sh[1]], hl = Math.hypot(...hv); if (hl > 0.12) ln([J.sh, [J.sh[0] + hv[0] / hl * (hl - 0.1), J.sh[1] + hv[1] / hl * (hl - 0.1)]]); }
    const hp = P(hc), R = 0.11 * o.s;
    rc.circle(hp[0], hp[1], R * 2, ro({ fill: '#f4f1ea', fillStyle: 'solid' }));
    // face: lookDeg = where the face points, upDeg = where the top of the head points (0 right, 90 up)
    const la = rad(opts.lookDeg ?? (dir > 0 ? 0 : 180)), ua = rad(opts.upDeg ?? 90);
    const f = [Math.cos(la), -Math.sin(la)], up = [Math.cos(ua), -Math.sin(ua)];
    ctx.save(); ctx.transform(f[0], f[1], -up[0], -up[1], hp[0], hp[1]);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(R * 0.45, -R * 0.15, R * 0.09, R * 0.14, 0, 0, 7); ctx.fill();
    if (opts.mood === 'sad') rc.arc(R * 0.45, R * 0.6, R * 0.6, R * 0.4, Math.PI + 0.5, 2 * Math.PI - 0.5, false, ro({ strokeWidth: 5 }));
    else rc.arc(R * 0.45, R * 0.25, R * 0.6, R * 0.45, 0.4, Math.PI - 0.4, false, ro({ strokeWidth: 5 }));
    ctx.restore();
    const out = {}; for (const k in J) out[k] = P(J[k]); out.head = hp; out.P = P; return out;
  }
  // vertical tension meter
  function meter(x, y, h, v, label) {
    S.rc.rectangle(x - 26, y - h, 52, h, ro({ strokeWidth: 5 }));
    const f = Math.max(0.02, Math.min(1, v));
    S.rc.rectangle(x - 22, y - h * f, 44, h * f, ro(hatch(RED, 7)));
    ctx.font = '700 46px Caveat'; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(label || 'tension', x, y + 50);
  }
  function fontsReady() { return document.fonts.load('700 40px Caveat').then(() => { root.ready = true; }); }

  Object.assign(root, { W, H, INK, RED, SOFT, GREEN, cv, ctx, clamp, ease, fade, rad, S, ro, SEG, segAt, speaking, rep, caption, begin, flash,
    bigHook, heading, saveStamp, mark, question, bubble, sticky, lens, lensRing, hatch, pencil, man, dumbbell, fontsReady, sideFig, meter });
})(window);
