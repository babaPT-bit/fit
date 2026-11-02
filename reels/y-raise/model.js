// Y-raise biomechanics. Body frame (metres, origin = shoulder):
//   x = forward, y = lateral (out), z = up along the torso.
(function (root) {
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(...a);
  const norm = a => mul(a, 1 / len(a));
  function slerp(a, b, t) {
    const th = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
    if (th < 1e-6) return a;
    const s = Math.sin(th);
    return add(mul(a, Math.sin((1 - t) * th) / s), mul(b, Math.sin(t * th) / s));
  }
  const ARM = 0.62;
  const Y_TOP = norm([0.15, 0.6, 0.78]); // arms up and out in a "Y", in the scapular plane
  const rad = d => d * Math.PI / 180;
  // world down expressed in the body frame when the torso leans forward by theta
  const downBody = th => [Math.sin(th), 0, -Math.cos(th)];

  const VARIANTS = [
    { key: 'bench', title: 'BENCH', sub: 'chest-supported, 45°', lean: 45, tool: 'gravity', level: 1, note: 'Supported → strict form' },
    { key: 'db', title: 'DUMBBELL', sub: 'bent over, ~70°', lean: 70, tool: 'gravity', level: 2, note: 'Hardest at the top' },
    { key: 'cable', title: 'CABLE', sub: 'low pulleys, crossed', lean: 8, tool: 'cable', level: 3, note: 'Tension from the bottom' },
  ];
  // cable pulley (opposite side, low, slightly in front) relative to the shoulder, body frame
  const PULLEY = [0.3, -0.45, -1.32];

  function build(v) {
    const th = rad(v.lean);
    const g = downBody(th);
    const start = v.tool === 'cable' ? norm([0.18, -0.22, -1]) : g;
    const N = 200, samples = [];
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      const dir = slerp(start, Y_TOP, p);
      const H = mul(dir, ARM);
      const u = v.tool === 'cable' ? norm(sub(PULLEY, H)) : g;
      const moment = len(cross(H, u)); // m, per unit load
      samples.push({ p, dir, H, moment });
    }
    const peak = samples.reduce((a, s) => (s.moment > a.moment ? s : a), samples[0]);
    return { ...v, th, g, start, samples, peak };
  }
  const data = VARIANTS.map(build);
  const maxMoment = Math.max(...data.flatMap(d => d.samples.map(s => s.moment)));
  const sampleAt = (d, p) => d.samples[Math.max(0, Math.min(d.samples.length - 1, Math.round(p * (d.samples.length - 1))))];
  // body frame -> world side view (x forward, z up) for a torso leaning forward by th
  const toWorld = (b, th) => [b[0] * Math.cos(th) + b[2] * Math.sin(th), -b[0] * Math.sin(th) + b[2] * Math.cos(th)];
  const api = { data, maxMoment, sampleAt, toWorld, PULLEY, ARM, rad, norm };
  if (typeof module !== 'undefined') module.exports = api; else root.YModel = api;
})(this);
