// Biomechanics model for cable fly variants (right arm; left is mirrored).
// Coordinates in metres: x = lateral (out to the right), y = forward, z = up.
(function (root) {
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; },
  };
  function slerp(a, b, t) {
    const d = Math.min(1, Math.max(-1, V.dot(a, b)));
    const th = Math.acos(d);
    if (th < 1e-6) return a;
    const s = Math.sin(th);
    return V.add(V.mul(a, Math.sin((1 - t) * th) / s), V.mul(b, Math.sin(t * th) / s));
  }

  const SHOULDER = [0.2, 0, 1.45];
  const ARM = 0.62; // shoulder -> handle, slight elbow bend
  const TOWER_X = 1.0, TOWER_Y = -0.35;

  // Torque axis each muscle produces about the right shoulder.
  //   +z = horizontal adduction, +x = flexion, +y = adduction (arm toward side).
  const MUSCLES = [
    { key: 'upper', name: 'Upper chest', sub: 'clavicular', color: '#f5a524', axis: V.norm([0.75, -0.1, 1]) },
    { key: 'mid',   name: 'Mid chest',   sub: 'sternal',    color: '#ef4444', axis: V.norm([0, 0.3, 1]) },
    { key: 'lower', name: 'Lower chest', sub: 'costal',     color: '#a78bfa', axis: V.norm([-0.5, 0.9, 0.8]) },
    { key: 'delt',  name: 'Front delt',  sub: 'anterior',   color: '#60a5fa', axis: V.norm([1, 0, 0.3]) },
  ];

  const VARIANTS = [
    { key: 'h2l', title: 'HIGH → LOW', target: 'Lower chest', pulleyZ: 2.15,
      start: [0.85, -0.06, 0.62], end: [0.02, 0.36, 0.98] },
    { key: 'mid', title: 'MID', target: 'Mid chest', pulleyZ: 1.45,
      start: [0.95, -0.08, 0.0], end: [0.02, 0.62, 1.42] },
    { key: 'l2h', title: 'LOW → HIGH', target: 'Upper chest', pulleyZ: 0.3,
      start: [0.85, -0.06, -0.6], end: [0.02, 0.48, 1.66] },
  ];

  const SHARP = 3; // how strongly fibre alignment favours a region

  function build(v) {
    const P = [TOWER_X, TOWER_Y, v.pulleyZ];
    const d0 = V.norm(v.start);
    const d1 = V.norm(V.sub(v.end, SHOULDER));
    const N = 200;
    const samples = [];
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      const dir = slerp(d0, d1, p);
      const H = V.add(SHOULDER, V.mul(dir, ARM));
      const u = V.norm(V.sub(P, H));           // cable pull direction at the hand
      const r = V.sub(H, SHOULDER);
      const moment = V.len(V.cross(r, u));     // moment arm (m) about the shoulder
      // torque the muscles must produce = opposite of the cable's torque
      const need = V.norm(V.mul(V.cross(r, u), -1));
      const scores = MUSCLES.map(m => Math.pow(Math.max(0, V.dot(need, m.axis)), SHARP));
      const sum = scores.reduce((a, b) => a + b, 0) || 1;
      const share = scores.map(s => s / sum);
      samples.push({ p, H, moment, share, load: share.map(s => s * moment) });
    }
    // totals across the rep
    const tot = MUSCLES.map((_, k) => samples.reduce((a, s) => a + s.load[k], 0));
    const T = tot.reduce((a, b) => a + b, 0);
    const peak = samples.reduce((a, s) => (s.moment > a.moment ? s : a), samples[0]);
    return { ...v, P, samples, totals: tot.map(x => x / T), peak };
  }

  const data = VARIANTS.map(build);
  const maxLoad = Math.max(...data.flatMap(d => d.samples.flatMap(s => s.load)));
  const maxMoment = Math.max(...data.flatMap(d => d.samples.map(s => s.moment)));
  function sampleAt(d, p) {
    const i = Math.max(0, Math.min(d.samples.length - 1, Math.round(p * (d.samples.length - 1))));
    return d.samples[i];
  }
  const api = { V, SHOULDER, ARM, TOWER_X, TOWER_Y, MUSCLES, data, maxLoad, maxMoment, sampleAt };
  if (typeof module !== 'undefined') module.exports = api; else root.FlyModel = api;
})(this);
