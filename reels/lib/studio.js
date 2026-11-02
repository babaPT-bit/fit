// Shared 3D studio for exercise reels: renderer, clay athlete with glowing muscles,
// camera shots, voice-driven timeline and burned-in captions.
import * as THREE from './three.module.min.js';
export { THREE };

export const W = 1080, H = 1920, FPS = 30;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const smooth = t => t * t * (3 - 2 * t);
export const fade = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, u) => a + (b - a) * u;

// ---------- timeline ----------
export function buildTimeline(voice, gap = 0.22, tail = 0.25) {
  const seg = {}; let t = 0;
  for (const ln of voice) { seg[ln.id] = { start: t, vo: t + gap, end: t + gap + ln.dur + tail, line: ln }; t = seg[ln.id].end; }
  return { seg, duration: t + 0.5, times: voice.map(ln => ({ file: ln.file, at: seg[ln.id].vo })) };
}
// which segment is active at time t, and progress 0..1 inside it
export function segAt(tl, t) {
  const ids = Object.keys(tl.seg);
  let id = ids[0];
  for (const k of ids) if (t >= tl.seg[k].start) id = k;
  const s = tl.seg[id];
  return { id, u: clamp((t - s.start) / (s.end - s.start)), s };
}

// ---------- stage ----------
export function createStage({ bg = ['#1b2333', '#07090e'], floor = '#121722' } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const g = document.createElement('canvas'); g.width = 8; g.height = 512;
  const gc = g.getContext('2d'), gr = gc.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); gc.fillStyle = gr; gc.fillRect(0, 0, 8, 512);
  const bgt = new THREE.CanvasTexture(g); bgt.colorSpace = THREE.SRGBColorSpace; scene.background = bgt;
  scene.fog = new THREE.Fog(new THREE.Color(bg[1]), 6, 14);

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.55));
  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(2.5, 5, 3); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -3; key.shadow.camera.right = 3;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -2; key.shadow.bias = -0.0005; key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 1.6); rim.position.set(-3, 3, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffc89a, 0.5); fill.position.set(-3, 1.5, 3); scene.add(fill);

  // floor with a soft pool of light
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  const fx = fc.getContext('2d'), rg = fx.createRadialGradient(256, 256, 10, 256, 256, 256);
  rg.addColorStop(0, '#2a3346'); rg.addColorStop(0.6, floor); rg.addColorStop(1, '#07090e');
  fx.fillStyle = rg; fx.fillRect(0, 0, 512, 512);
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const fl = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.95 }));
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  return { renderer, scene, camera, key };
}

// ---------- athlete ----------
const SKIN = new THREE.MeshStandardMaterial({ color: 0xd8cbbd, roughness: 0.62, metalness: 0.0 });
const SKIN2 = new THREE.MeshStandardMaterial({ color: 0xc9b9a8, roughness: 0.65 });
const SHORTS = new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.85 });
const HAIR = new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.9 });
const SHOE = new THREE.MeshStandardMaterial({ color: 0x2b3140, roughness: 0.7 });
const SOLE = new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.6 });
const TRIM = new THREE.MeshStandardMaterial({ color: 0xff7a45, roughness: 0.6 });
export const GLOW = 0xff5a36;
function muscleMat(base = 0xd2c0ae) {
  return new THREE.MeshStandardMaterial({ color: base, roughness: 0.55, emissive: new THREE.Color(GLOW), emissiveIntensity: 0 });
}
function mesh(geo, mat, parent) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
const SPH = new THREE.SphereGeometry(1, 40, 28);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
// limb = open cylinder + a sphere at each end, so scaling never squashes the round ends
function limbMesh(r, mat, parent) {
  const g = { cyl: mesh(CYL, mat, parent), a: mesh(SPH, mat, parent), b: mesh(SPH, mat, parent), r };
  g.a.scale.setScalar(r); g.b.scale.setScalar(r * 0.97); return g;
}
function placeLimb(m, a, b) {
  const d = new THREE.Vector3().subVectors(b, a), L = Math.max(0.001, d.length());
  m.cyl.position.copy(a).addScaledVector(d, 0.5);
  m.cyl.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  m.cyl.scale.set(m.r, L, m.r);
  m.a.position.copy(a); m.b.position.copy(b);
}
// two-bone IK: returns the middle joint
export function twoBone(a, c, L1, L2, pole) {
  const d = new THREE.Vector3().subVectors(c, a); let dist = d.length();
  const dir = d.clone().normalize();
  dist = Math.min(dist, L1 + L2 - 1e-4);
  const x = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return a.clone().addScaledVector(dir, x).addScaledVector(p, h);
}

// muscle piece: ellipsoid with radii (rx, ry, rz)
function blob(parent, mat, pos, radii, rot) {
  const m = mesh(SPH, mat, parent); m.position.set(...pos); m.scale.set(...radii);
  if (rot) m.rotation.set(...rot);
  return m;
}
// orthonormal frame for a limb segment: y along the bone, z toward ref
function segFrame(a, b, ref) {
  const y = new THREE.Vector3().subVectors(b, a).normalize();
  let z = ref.clone().sub(y.clone().multiplyScalar(ref.dot(y)));
  if (z.lengthSq() < 1e-6) z = Math.abs(y.x) < 0.9 ? V3(1, 0, 0) : V3(0, 0, 1);
  z.normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
// a group that follows a bone: local y runs 0..1 along it (scaled by length)
function boneGroup(parent) { const g = new THREE.Group(); parent.add(g); return g; }
function placeBone(g, a, b, ref) { g.position.copy(a); g.quaternion.copy(segFrame(a, b, ref)); g.userData.L = a.distanceTo(b); }
// add an ellipsoid to a bone group at fraction t along it (re-placed every frame)
function onBone(g, mat, t, off, radii, rot) {
  const m = mesh(SPH, mat, g); m.userData.bone = { t, off, radii }; if (rot) m.rotation.set(...rot); return m;
}
function layoutBone(g) {
  const L = g.userData.L || 0.3;
  for (const m of g.children) { const b = m.userData.bone; if (!b) continue;
    m.position.set(b.off[0], b.t * L, b.off[1]); m.scale.set(b.radii[0], b.radii[1] * (L / 0.3), b.radii[2]); }
}

export class Athlete {
  constructor(scene) {
    this.root = new THREE.Group(); scene.add(this.root);
    this.torso = new THREE.Group(); this.root.add(this.torso);
    const T = this.torso;
    this.parts = {};
    // every muscle piece gets its own material and a position k (0..1) along the muscle,
    // so a "rep pulse" ripple can run through it
    const M = (name, k = 0.5) => { const m = muscleMat(0xd5c6b6); (this.parts[name] = this.parts[name] || []).push({ m, k }); return m; };
    const S = SKIN;
    // ---- torso: local x = lateral, y = up from pelvis, z = chest forward ----
    this.rib = blob(T, S, [0, 0.36, -0.01], [0.17, 0.2, 0.125]);
    blob(T, S, [0, 0.17, 0.0], [0.125, 0.16, 0.098]);                         // waist
    blob(T, SHORTS, [0, 0.0, -0.005], [0.158, 0.11, 0.112]);                  // pelvis
    for (const s of [-1, 1]) blob(T, SHORTS, [s * 0.075, -0.035, -0.065], [0.088, 0.095, 0.085]); // glutes
    blob(T, TRIM, [0, 0.085, 0], [0.135, 0.016, 0.104]);                      // waistband
    // abs: 3 rows of blocks + obliques
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) blob(T, S, [s * 0.034, 0.275 - i * 0.058, 0.088 - i * 0.004], [0.032, 0.026, 0.022]);
    for (const s of [-1, 1]) blob(T, S, [s * 0.1, 0.16, 0.05], [0.045, 0.09, 0.055], [0, 0, s * -0.12]);
    // pecs: big fan plus a lower edge
    for (const s of [-1, 1]) {
      blob(T, M('pec', 0.3), [s * 0.083, 0.41, 0.083], [0.105, 0.072, 0.055], [0.1, s * 0.28, s * 0.12]);
      blob(T, M('pec', 0.8), [s * 0.075, 0.37, 0.09], [0.088, 0.04, 0.045], [0, s * 0.2, s * -0.1]);
    }
    // lats: V-taper wings
    for (const s of [-1, 1]) {
      blob(T, M('lat', 0.35), [s * 0.135, 0.31, -0.04], [0.075, 0.17, 0.075], [0, 0, s * -0.32]);
      blob(T, M('lat', 0.85), [s * 0.105, 0.21, -0.04], [0.05, 0.1, 0.05], [0, 0, s * -0.2]);
    }
    // traps: upper slopes + diamond on the back, spinal erectors
    for (const s of [-1, 1]) blob(T, M('trap', 0.2), [s * 0.075, 0.5, -0.035], [0.1, 0.05, 0.055], [0, 0, s * 0.42]);
    blob(T, M('trap', 0.8), [0, 0.39, -0.105], [0.09, 0.13, 0.03]);
    // serratus anterior: saw-tooth slips on the side of the ribs, each pointing down-forward
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      const g = mesh(SPH, M('serratus', 1 - i / 4), T);
      g.position.set(s * (0.162 - i * 0.004), 0.39 - i * 0.034, 0.03 + i * 0.012);
      g.scale.set(0.017, 0.017, 0.055 - i * 0.004);
      g.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(s * 0.25, -0.42, 0.87).normalize());
    }
    // shoulder blades (with infraspinatus on top) that glide round the ribcage
    this.scaps = [-1, 1].map(s => {
      const g = new THREE.Group(); T.add(g); g.userData.side = s;
      blob(g, M('scap', 0.3), [0, 0, 0], [0.068, 0.075, 0.022]);
      blob(g, M('scap', 0.8), [s * 0.02, -0.04, -0.005], [0.04, 0.045, 0.024]);
      return g;
    });
    // ---- head ----
    const R = this.root;
    this.neck = limbMesh(0.058, S, R);
    this.head = mesh(SPH, S, R); this.head.scale.set(0.09, 0.112, 0.102);
    this.jaw = mesh(SPH, S, R); this.jaw.scale.set(0.07, 0.05, 0.075);
    this.hair = mesh(SPH, HAIR, R); this.hair.scale.set(0.094, 0.082, 0.104);
    this.nose = mesh(SPH, S, R); this.nose.scale.set(0.016, 0.024, 0.02);
    this.ears = [0, 1].map(() => { const e = mesh(SPH, S, R); e.scale.set(0.012, 0.028, 0.018); return e; });
    // ---- limbs ----
    this.side = [-1, 1].map(() => {
      const up = boneGroup(R), fo = boneGroup(R), th = boneGroup(R), sh = boneGroup(R);
      const o = {
        up, fo, th, sh,
        delt: [mesh(SPH, M('delt', 0.1), R), mesh(SPH, M('delt', 0.5), R), mesh(SPH, M('delt', 0.9), R)],
        upperCore: limbMesh(0.045, S, R), foreCore: limbMesh(0.036, S, R),
        thighCore: limbMesh(0.07, S, R), shinCore: limbMesh(0.045, S, R),
        hand: mesh(SPH, SKIN2, R),
        foot: new THREE.Group(),
      };
      // upper arm: biceps (front), triceps (back + long head)
      onBone(up, S, 0.55, [0, 0.03], [0.048, 0.1, 0.05]);
      onBone(up, S, 0.45, [0, -0.032], [0.052, 0.12, 0.048]);
      onBone(up, S, 0.35, [0.022, -0.02], [0.038, 0.09, 0.04]);
      // forearm: brachioradialis + flexors near the elbow (the grip muscles)
      onBone(fo, M('forearm', 0.75), 0.25, [0.012, 0.012], [0.047, 0.1, 0.045]);
      onBone(fo, M('forearm', 0.25), 0.3, [-0.012, -0.012], [0.042, 0.1, 0.04]);
      // thigh: quads (front), vastus medialis teardrop, hamstrings (back), shorts over the top
      onBone(th, S, 0.55, [0.012, 0.035], [0.068, 0.17, 0.062]);
      onBone(th, S, 0.82, [-0.03, 0.03], [0.05, 0.065, 0.05]);
      onBone(th, S, 0.55, [0, -0.03], [0.066, 0.16, 0.06]);
      onBone(th, SHORTS, 0.16, [0, 0], [0.098, 0.1, 0.095]);
      // calf
      onBone(sh, S, 0.3, [0, -0.032], [0.056, 0.12, 0.058]);
      onBone(sh, S, 0.3, [0.01, -0.025], [0.05, 0.1, 0.05]);
      // sneaker: upper + white sole
      R.add(o.foot);
      const shoe = mesh(new THREE.BoxGeometry(1, 1, 1), SHOE, o.foot); shoe.scale.set(0.09, 0.075, 0.235); shoe.position.set(0, 0, 0.0);
      const sole = mesh(new THREE.BoxGeometry(1, 1, 1), SOLE, o.foot); sole.scale.set(0.095, 0.025, 0.245); sole.position.set(0, -0.045, 0.0);
      const swoosh = mesh(new THREE.BoxGeometry(1, 1, 1), TRIM, o.foot); swoosh.scale.set(0.092, 0.012, 0.11); swoosh.position.set(0, -0.005, 0.02); swoosh.rotation.x = -0.25;
      o.delt.forEach(d => d.scale.set(0.072, 0.07, 0.066));
      o.hand.scale.set(0.045, 0.06, 0.03);
      return o;
    });
    this.L = { up: 0.3, fore: 0.27, thigh: 0.44, shin: 0.43 };
  }
  // pose: { pelvis, up, fwd, protract 0..1, elevate (m), breathe 0..1, hands: [L,R], elbowPole,
  //         armRef (which way the biceps face), handDir, ankles: [L,R], kneePole, toeDir, headTilt }
  set(p) {
    const up = p.up.clone().normalize();
    const fwd = p.fwd.clone().sub(up.clone().multiplyScalar(p.fwd.dot(up))).normalize();
    const lat = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(lat, up, fwd));
    this.torso.position.copy(p.pelvis); this.torso.quaternion.copy(q);
    const W = (x, y, z) => V3(x, y, z).applyQuaternion(q).add(p.pelvis);
    const pr = p.protract ?? 0.5, el = p.elevate ?? 0, br = p.breathe ?? 0;
    this.rib.scale.set(0.17 * (1 + 0.025 * br), 0.2, 0.125 * (1 + 0.05 * br));
    this.scaps.forEach(g => {
      const s = g.userData.side;
      g.position.set(s * (0.07 + 0.05 * pr), 0.4 + el, -0.11 + 0.03 * pr);
      g.rotation.set(0, s * (0.2 + 0.5 * pr), s * 0.1);
    });
    const shoulders = [-1, 1].map(s => W(s * (0.205 + 0.02 * pr), 0.47 + el, -0.02 + 0.05 * (pr - 0.5)));
    this.shoulders = shoulders;
    const neckB = W(0, 0.5 + el * 0.3, -0.02), headUp = up.clone().applyAxisAngle(lat, p.headTilt || 0);
    const hf = new THREE.Vector3().crossVectors(lat, headUp);
    const headC = neckB.clone().addScaledVector(headUp, 0.19).addScaledVector(hf, 0.015);
    placeLimb(this.neck, neckB, neckB.clone().addScaledVector(headUp, 0.09));
    const hq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(lat, headUp, hf));
    this.head.position.copy(headC); this.head.quaternion.copy(hq);
    this.jaw.position.copy(headC).addScaledVector(headUp, -0.06).addScaledVector(hf, 0.015); this.jaw.quaternion.copy(hq);
    this.hair.position.copy(headC).addScaledVector(headUp, 0.032).addScaledVector(hf, -0.018); this.hair.quaternion.copy(hq);
    this.nose.position.copy(headC).addScaledVector(hf, 0.098).addScaledVector(headUp, -0.012);
    this.ears.forEach((e, i) => { e.position.copy(headC).addScaledVector(lat, (i ? 1 : -1) * 0.088).addScaledVector(headUp, -0.005); e.quaternion.copy(hq); });
    this.headC = headC;
    [-1, 1].forEach((s, i) => {
      const S = this.side[i], sh = shoulders[i], wr = p.hands[i];
      const pole = (p.elbowPole || fwd.clone().negate()).clone().add(lat.clone().multiplyScalar(s * 0.3));
      const elb = twoBone(sh, wr, this.L.up, this.L.fore, pole);
      const armRef = p.armRef || fwd;
      placeLimb(S.upperCore, sh, elb); placeLimb(S.foreCore, elb, wr);
      placeBone(S.up, sh, elb, armRef); layoutBone(S.up);
      placeBone(S.fo, elb, wr, armRef); layoutBone(S.fo);
      // deltoid: front, side and rear heads around the shoulder
      const ad = elb.clone().sub(sh).normalize();
      const out = lat.clone().multiplyScalar(s);
      S.delt[0].position.copy(sh).addScaledVector(fwd, 0.035).addScaledVector(ad, 0.035);
      S.delt[1].position.copy(sh).addScaledVector(out, 0.03).addScaledVector(ad, 0.03).addScaledVector(up, 0.01);
      S.delt[2].position.copy(sh).addScaledVector(fwd, -0.035).addScaledVector(ad, 0.035);
      S.delt.forEach(d => d.quaternion.copy(segFrame(sh, elb, fwd)));
      const hd = p.handDir || wr.clone().sub(elb).normalize();
      S.hand.position.copy(wr).addScaledVector(hd, 0.05); S.hand.quaternion.setFromUnitVectors(V3(0, 1, 0), hd);
      // legs
      const hip = W(s * 0.088, -0.02, 0), an = p.ankles[i];
      const knee = twoBone(hip, an, this.L.thigh, this.L.shin, p.kneePole || fwd);
      placeLimb(S.thighCore, hip, knee); placeLimb(S.shinCore, knee, an);
      placeBone(S.th, hip, knee, p.kneePole || fwd); layoutBone(S.th);
      placeBone(S.sh, knee, an, p.kneePole || fwd); layoutBone(S.sh);
      const sd = an.clone().sub(knee).normalize(), toe = p.toeDir || fwd;
      const fy = sd.clone().negate(), fz = toe.clone().sub(fy.clone().multiplyScalar(toe.dot(fy))).normalize(), fx = new THREE.Vector3().crossVectors(fy, fz);
      S.foot.position.copy(an).addScaledVector(fz, 0.06).addScaledVector(sd, 0.035);
      S.foot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fx, fy, fz));
    });
  }
  // levels: { muscle: 0..1 }; wave: { phase (-0.3..1.3), amp 0..1 } = the rep pulse
  glow(levels, wave) {
    for (const [name, list] of Object.entries(this.parts)) {
      const L = levels[name] || 0;
      for (const { m, k } of list) {
        const r = wave ? wave.amp * Math.exp(-((k - wave.phase) ** 2) / 0.025) : 0;
        m.emissiveIntensity = L * 1.6 * (0.7 + 1.1 * r);
      }
    }
  }
}

// ---------- camera ----------
// shot: { from: {pos, target, fov}, to: {...} } interpolated with ease over u
export function applyShot(camera, shot, u) {
  const e = ease(clamp(u));
  const a = shot.from, b = shot.to || shot.from;
  const P = (x, y) => [lerp(x[0], y[0], e), lerp(x[1], y[1], e), lerp(x[2], y[2], e)];
  camera.position.set(...P(a.pos, b.pos));
  camera.fov = lerp(a.fov || 32, b.fov || a.fov || 32, e); camera.updateProjectionMatrix();
  camera.lookAt(...P(a.target, b.target));
}

// ---------- captions ----------
export function makeChunks(voice, tl) {
  const out = [];
  for (const ln of voice) {
    const start = tl.seg[ln.id].vo, words = ln.text.split(' '), chunks = []; let cur = [];
    words.forEach((w, i) => { cur.push(w); if (/[.,!?]$/.test(w) || cur.length >= 4 || i === words.length - 1) { chunks.push(cur.join(' ')); cur = []; } });
    let acc = 0; const total = ln.text.length;
    for (const c of chunks) { const t0 = start + ln.dur * acc / total; acc += c.length + 1; out.push({ text: c, t0, t1: start + ln.dur * Math.min(1, acc / total) }); }
  }
  return out;
}
export function drawCaption(ctx, chunks, t, colorFn, y = 1640) {
  const c = chunks.find((c, i) => t >= c.t0 && t < (chunks[i + 1] && chunks[i + 1].t0 - c.t1 < 0.6 ? chunks[i + 1].t0 : c.t1 + 0.35));
  if (!c) return;
  const k = ease(fade(t, c.t0, c.t0 + 0.14)), words = c.text.split(' ');
  ctx.save(); ctx.font = '800 64px Inter';
  const sp = ctx.measureText(' ').width, w = words.reduce((s, x) => s + ctx.measureText(x).width, 0) + sp * (words.length - 1);
  ctx.translate(W / 2, y); ctx.scale(0.88 + 0.12 * k, 0.88 + 0.12 * k); ctx.globalAlpha = k; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  let x = -w / 2;
  for (const word of words) {
    ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(word, x, 0);
    ctx.fillStyle = colorFn(word); ctx.fillText(word, x, 0); x += ctx.measureText(word).width + sp;
  }
  ctx.restore();
}
