// 2D hand-drawn explainer engine: paper textures, rough ink lines (rough.js), a stickman with
// eyes + smile, and a biceps that pops when he contracts. Four looks ("templates").
(function (root) {
  const W = 1080, H = 1920;

  // ---------- seeded random ----------
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---------- templates ----------
  const T = {
    paper: {
      name: 'Rugged paper', ink: '#1a1a1a', inkSoft: 'rgba(26,26,26,0.35)', muscle: '#d7261e', muscleFill: 'hachure',
      accent: '#d7261e', steel: '#4a4a4a', title: '700 96px Caveat', body: '400 46px "Patrick Hand"', cap: '700 70px Caveat',
      capColor: '#1a1a1a', capBg: null,
    },
    notebook: {
      name: 'Notebook', ink: '#3b3f46', inkSoft: 'rgba(59,63,70,0.35)', muscle: '#3b3f46', muscleFill: 'highlight',
      highlight: 'rgba(255,214,0,0.75)', accent: '#e23b3b', steel: '#6b7280', title: '400 90px "Patrick Hand"', body: '400 44px "Patrick Hand"', cap: '400 64px "Patrick Hand"',
      capColor: '#1e3a8a', capBg: 'rgba(255,214,0,0.55)',
    },
    chalk: {
      name: 'Chalkboard', ink: 'rgba(245,245,240,0.92)', inkSoft: 'rgba(245,245,240,0.35)', muscle: '#ff8fb1', muscleFill: 'zigzag',
      accent: '#ffd36e', steel: 'rgba(200,210,220,0.7)', title: '700 92px Caveat', body: '700 46px Caveat', cap: '700 72px Caveat',
      capColor: '#f5f5f0', capBg: null,
    },
    kraft: {
      name: 'Cut-out cards', ink: '#1a1a1a', inkSoft: 'rgba(26,26,26,0.35)', muscle: '#e0301e', muscleFill: 'cross-hatch',
      accent: '#e0301e', steel: '#4a4a4a', title: '400 84px "Permanent Marker"', body: '400 44px "Patrick Hand"', cap: '400 58px "Permanent Marker"',
      capColor: '#ffffff', capBg: '#1a1a1a',
    },
  };

  // ---------- backgrounds (built once per template, cached) ----------
  const bgCache = {};
  function background(name) {
    if (bgCache[name]) return bgCache[name];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), r = rng(7);
    const noise = (amt, alpha) => {
      const img = g.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      g.putImageData(img, 0, 0);
    };
    const blotches = (n, color, maxR, alpha) => {
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H, rad = maxR * (0.3 + r());
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, color.replace('A', alpha * (0.4 + r()))); gr.addColorStop(1, color.replace('A', 0));
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    };
    const creases = (n, dark, light) => {
      for (let i = 0; i < n; i++) {
        let x = r() * W, y = r() * H; const a = r() * Math.PI, len = 300 + r() * 900;
        const pts = []; for (let k = 0; k <= 12; k++) { pts.push([x, y]); x += Math.cos(a + (r() - 0.5) * 0.5) * len / 12; y += Math.sin(a + (r() - 0.5) * 0.5) * len / 12; }
        for (const [col, off] of [[dark, 0], [light, 1.5]]) {
          g.strokeStyle = col; g.lineWidth = 1 + r() * 1.5; g.beginPath();
          pts.forEach((p, k) => k ? g.lineTo(p[0] + off, p[1] + off) : g.moveTo(p[0] + off, p[1] + off)); g.stroke();
        }
      }
    };
    const vignette = (alpha, col = '0,0,0') => {
      const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
      v.addColorStop(0, `rgba(${col},0)`); v.addColorStop(1, `rgba(${col},${alpha})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
    };
    if (name === 'paper') {
      g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H);
      blotches(40, 'rgba(160,140,110,A)', 260, 0.06);
      creases(26, 'rgba(90,80,60,0.10)', 'rgba(255,255,255,0.55)');
      noise(18); vignette(0.22, '80,60,30');
    } else if (name === 'notebook') {
      g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(80,140,220,0.22)'; g.lineWidth = 2;
      for (let y = 140; y < H; y += 54) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.strokeStyle = 'rgba(80,140,220,0.08)'; g.lineWidth = 1;
      for (let x = 0; x < W; x += 54) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      g.strokeStyle = 'rgba(226,59,59,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(110, 0); g.lineTo(110, H); g.stroke();
      for (const y of [420, 960, 1500]) { g.fillStyle = '#e6e6e0'; g.beginPath(); g.arc(50, y, 22, 0, 7); g.fill(); }
      noise(8); vignette(0.08);
    } else if (name === 'chalk') {
      g.fillStyle = '#1f3a32'; g.fillRect(0, 0, W, H);
      blotches(60, 'rgba(255,255,255,A)', 300, 0.035);      // old smudges
      for (let i = 0; i < 25; i++) { g.strokeStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; g.lineWidth = 30 + r() * 50; g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); g.quadraticCurveTo(x + 200, y - 80, x + 420, y + 20); g.stroke(); }
      noise(14); vignette(0.45);
      g.strokeStyle = '#6b4a2b'; g.lineWidth = 30; g.strokeRect(0, 0, W, H);
    } else if (name === 'kraft') {
      g.fillStyle = '#c89f6c'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 2500; i++) { g.strokeStyle = `rgba(90,60,30,${0.05 + r() * 0.08})`; g.lineWidth = 1; const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 20, y + (r() - 0.5) * 6); g.stroke(); }
      blotches(30, 'rgba(110,70,30,A)', 300, 0.08);
      noise(16); vignette(0.3, '60,35,10');
    }
    return (bgCache[name] = c);
  }

  // torn white paper card (for the "kraft" template)
  function card(ctx, x, y, w, h, seed, tilt = 0) {
    const r = rng(seed); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt);
    const pts = []; const step = 18;
    for (let i = 0; i <= w; i += step) pts.push([-w / 2 + i, -h / 2 + (r() - 0.5) * 8]);
    for (let i = 0; i <= h; i += step) pts.push([w / 2 + (r() - 0.5) * 8, -h / 2 + i]);
    for (let i = w; i >= 0; i -= step) pts.push([-w / 2 + i, h / 2 + (r() - 0.5) * 8]);
    for (let i = h; i >= 0; i -= step) pts.push([-w / 2 + (r() - 0.5) * 8, -h / 2 + i]);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fbf8f1'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    // tape
    ctx.fillStyle = 'rgba(240,230,190,0.75)'; ctx.translate(-w / 2 + 110, -h / 2); ctx.rotate(-0.12); ctx.fillRect(-70, -20, 140, 40);
    ctx.restore();
  }

  // ---------- drawing kit bound to a template ----------
  function kit(ctx, tplName, frameSeed = 1) {
    const tp = T[tplName], rc = rough.canvas(ctx.canvas);
    const chalk = tplName === 'chalk';
    const o = (extra = {}) => Object.assign({ stroke: tp.ink, strokeWidth: 7, roughness: chalk ? 2.2 : 1.4, bowing: 1.2, seed: frameSeed, disableMultiStroke: false }, extra);
    const k = {
      tp, rc,
      view(ox, oy, s) { return p => [ox + p[0] * s, oy - p[1] * s]; },
      line(P, pts, w = 7, color) { rc.linearPath(pts.map(P), o({ strokeWidth: w, stroke: color || tp.ink })); },
      // stickman head with eyes and a smile, facing +x
      head(P, s, c, effort = 0) {
        const sc = P(c), R = 0.11 * s;
        rc.circle(sc[0], sc[1], R * 2, o({ strokeWidth: 7, fill: tplName === 'chalk' ? undefined : (tplName === 'kraft' ? '#fbf8f1' : undefined) }));
        ctx.fillStyle = tp.ink;
        const ey = sc[1] - R * 0.15;
        for (const ex of [sc[0] + R * 0.15, sc[0] + R * 0.55]) {
          ctx.beginPath(); ctx.ellipse(ex, ey, R * 0.085, R * (0.13 - 0.05 * effort), 0, 0, 7); ctx.fill();
        }
        rc.arc(sc[0] + R * 0.38, sc[1] + R * 0.18, R * 0.75, R * (0.55 - 0.15 * effort), 0.25, Math.PI - 0.6, false, o({ strokeWidth: 5 }));
      },
      // biceps that pops up with contraction c (0..1)
      biceps(P, s, S, E, hand, c) {
        const u = [E[0] - S[0], E[1] - S[1]], L = Math.hypot(...u); u[0] /= L; u[1] /= L;
        let n = [-u[1], u[0]];
        if (n[0] * (hand[0] - E[0]) + n[1] * (hand[1] - E[1]) < 0) n = [-n[0], -n[1]];
        const bulge = 0.012 + 0.055 * c;
        const ctr = [S[0] + u[0] * L * 0.55 + n[0] * bulge * 0.6, S[1] + u[1] * L * 0.55 + n[1] * bulge * 0.6];
        const sc = P(ctr), ang = Math.atan2(-u[1], u[0]);
        ctx.save(); ctx.translate(...sc); ctx.rotate(ang);
        const rx = L * 0.62 * s, ry = bulge * 2 * s;
        if (tp.muscleFill === 'highlight') {
          ctx.fillStyle = tp.highlight; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.62, ry * 0.75, 0, 0, 7); ctx.fill();
          rc.ellipse(0, 0, rx, ry, o({ strokeWidth: 5 }));
        } else {
          rc.ellipse(0, 0, rx, ry, o({ stroke: tp.muscle, strokeWidth: 5, fill: tp.muscle, fillStyle: tp.muscleFill, fillWeight: 3, hachureGap: 7 }));
        }
        ctx.restore();
        if (c > 0.55) {                                      // pop lines
          const a = Math.min(1, (c - 0.55) / 0.45), pc = [ctr[0] + n[0] * bulge * 1.3, ctr[1] + n[1] * bulge * 1.3];
          for (const da of [-0.6, 0, 0.6]) {
            const d = [n[0] * Math.cos(da) - n[1] * Math.sin(da), n[0] * Math.sin(da) + n[1] * Math.cos(da)];
            const a0 = [pc[0] + d[0] * 0.035, pc[1] + d[1] * 0.035], a1 = [pc[0] + d[0] * (0.035 + 0.06 * a), pc[1] + d[1] * (0.035 + 0.06 * a)];
            rc.line(...P(a0), ...P(a1), o({ stroke: tp.accent, strokeWidth: 6, roughness: 0.8 }));
          }
        }
        return ctr;
      },
      dumbbell(P, s, hand, ang) {
        const sc = P(hand); ctx.save(); ctx.translate(...sc); ctx.rotate(ang);
        rc.line(-0.07 * s, 0, 0.07 * s, 0, o({ stroke: tp.steel, strokeWidth: 8 }));
        for (const x of [-0.075, 0.075]) rc.rectangle(x * s - 0.022 * s, -0.055 * s, 0.044 * s, 0.11 * s, o({ stroke: tp.ink, strokeWidth: 4, fill: tp.ink, fillStyle: 'solid' }));
        ctx.restore();
      },
      // handwritten note with an arrow to a point
      note(text, x, y, to, color) {
        ctx.font = tp.body; ctx.fillStyle = color || tp.accent; ctx.textAlign = 'center'; ctx.fillText(text, x, y);
        const fromX = x + (to[0] > x ? 40 : -40), fromY = y + 14;
        rc.curve([[fromX, fromY], [(fromX + to[0]) / 2, Math.max(fromY, to[1]) + 30], [to[0], to[1]]], o({ stroke: color || tp.accent, strokeWidth: 4, roughness: 1 }));
        const ang = Math.atan2(to[1] - (Math.max(fromY, to[1]) + 30), to[0] - (fromX + to[0]) / 2);
        for (const da of [2.6, -2.6]) rc.line(to[0], to[1], to[0] + 22 * Math.cos(ang + da), to[1] + 22 * Math.sin(ang + da), o({ stroke: color || tp.accent, strokeWidth: 4, roughness: 0.6 }));
      },
      title(text, sub) {
        ctx.textAlign = 'center'; ctx.font = tp.title; ctx.fillStyle = tplName === 'kraft' ? '#1a1a1a' : tp.ink; ctx.fillText(text, W / 2, 150);
        if (sub) { ctx.font = tp.body; ctx.fillStyle = tp.accent; ctx.fillText(sub, W / 2, 215); }
        rc.line(W / 2 - 300, 240, W / 2 + 300, 236, o({ stroke: tp.accent, strokeWidth: 6, roughness: 2 }));
      },
      caption(text, y = 1800) {
        ctx.font = tp.cap; ctx.textAlign = 'center';
        const w = ctx.measureText(text).width;
        if (tp.capBg) { ctx.fillStyle = tp.capBg; ctx.save(); ctx.translate(W / 2, y - 20); ctx.rotate(-0.015); ctx.fillRect(-w / 2 - 30, -50, w + 60, 90); ctx.restore(); }
        ctx.fillStyle = tp.capColor; ctx.fillText(text, W / 2, y);
      },
    };
    return k;
  }

  // ---------- the two curl setups ----------
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s];
  const norm = v => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };

  function preacher(K, c, ox, oy, s) {
    const P = K.view(ox, oy, s), tp = K.tp;
    K.line(P, [[-0.7, 0], [0.9, 0]], 4, tp.inkSoft);
    K.line(P, [[-0.25, 0.5], [0.2, 0.5]], 10, tp.steel);
    K.line(P, [[0.0, 0.5], [0.0, 0.02]], 7, tp.steel);
    K.line(P, [[-0.15, 0.02], [0.35, 0.02]], 7, tp.steel);
    const hip = [-0.06, 0.58], sh = [0.07, 1.1], hc = [0.12, 1.3];
    K.line(P, [hip, [0.32, 0.58], [0.36, 0.04]], 8);
    K.line(P, [hip, sh, add(hc, [-0.01, -0.11])], 8);
    const uDir = norm([0.77, -0.64]), E = add(sh, uDir, 0.31);
    const padN = [uDir[1], -uDir[0]];
    const pa = add(add(sh, uDir, 0.05), padN, 0.055), pb = add(add(E, uDir, 0.07), padN, 0.055);
    K.line(P, [[pb[0] - 0.05, pb[1] - 0.03], [0.2, 0.62], [0.2, 0.02]], 7, tp.steel);
    K.line(P, [pa, pb], 16, tp.steel);
    const theta = (20 + 115 * c) * Math.PI / 180, fDir = rot(uDir, theta), hand = add(E, fDir, 0.29);
    K.line(P, [sh, E, hand], 8);
    const m = K.biceps(P, s, sh, E, hand, c);
    K.dumbbell(P, s, hand, -Math.atan2(fDir[1], fDir[0]) + Math.PI / 2);
    K.head(P, s, hc, c);
    return { muscle: P(m) };
  }
  function cableCurl(K, c, ox, oy, s) {
    const P = K.view(ox, oy, s), tp = K.tp;
    K.line(P, [[-1.0, 0], [0.9, 0]], 4, tp.inkSoft);
    const tx = -0.78;
    K.line(P, [[tx, 0], [tx, 1.3]], 9, tp.steel);
    K.line(P, [[tx - 0.15, 0.02], [tx + 0.15, 0.02]], 7, tp.steel);
    const pul = [tx + 0.04, 0.3], ps = P(pul);
    K.rc.circle(ps[0], ps[1], 30, { stroke: tp.ink, strokeWidth: 4, roughness: 1, seed: 3 });
    const hip = [0.0, 0.92], sh = [0.07, 1.42], hc = [0.12, 1.63];
    K.line(P, [hip, [0.14, 0.5], [0.24, 0.04]], 8);
    K.line(P, [hip, [-0.1, 0.48], [-0.24, 0.04]], 8, tp.inkSoft);
    K.line(P, [hip, sh, add(hc, [-0.01, -0.11])], 8);
    K.line(P, [add(sh, [-0.02, 0]), [0.05, 1.14], [0.08, 0.9]], 6, tp.inkSoft);
    const uDir = norm([-0.42, -0.91]), E = add(sh, uDir, 0.3);
    const theta = -(20 + 120 * c) * Math.PI / 180, fDir = rot(uDir, theta), hand = add(E, fDir, 0.29);
    K.line(P, [pul, hand], 3, tp.steel);
    K.line(P, [sh, E, hand], 8);
    const m = K.biceps(P, s, sh, E, hand, c);
    const hs = P(hand); K.rc.circle(hs[0], hs[1], 28, { stroke: tp.ink, strokeWidth: 4, fill: tp.steel, fillStyle: 'solid', roughness: 1, seed: 4 });
    K.head(P, s, hc, c);
    return { muscle: P(m) };
  }

  root.Doodle = { W, H, T, background, card, kit, preacher, cableCurl, rng };
})(window);
