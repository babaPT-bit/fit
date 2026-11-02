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

export class Athlete {
  constructor(scene) {
    this.root = new THREE.Group(); scene.add(this.root);
    this.torso = new THREE.Group(); this.root.add(this.torso);
    const T = this.torso;
    this.muscles = {};
    const M = (name, base) => (this.muscles[name] = this.muscles[name] || muscleMat(base));
    // torso (local: x lateral, y up from pelvis, z = chest forward)
    this.rib = mesh(SPH, SKIN, T); this.rib.position.set(0, 0.37, -0.005); this.rib.scale.set(0.185, 0.2, 0.125);
    const ab = mesh(SPH, SKIN, T); ab.position.set(0, 0.18, 0.0); ab.scale.set(0.145, 0.17, 0.105);
    const pel = mesh(SPH, SHORTS, T); pel.position.set(0, 0.01, -0.005); pel.scale.set(0.168, 0.115, 0.115);
    this.pecs = [-1, 1].map(s => { const p = mesh(SPH, M('pec'), T); p.position.set(s * 0.085, 0.42, 0.075); p.scale.set(0.095, 0.07, 0.055); p.rotation.z = s * 0.25; return p; });
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const a = mesh(SPH, SKIN2, T); a.position.set(s * 0.04, 0.27 - i * 0.065, 0.09); a.scale.set(0.035, 0.026, 0.02); }
    this.lats = [-1, 1].map(s => { const l = mesh(SPH, M('lat'), T); l.position.set(s * 0.13, 0.3, -0.06); l.scale.set(0.075, 0.17, 0.065); l.rotation.z = s * -0.25; return l; });
    this.serratus = [];
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const g = mesh(SPH, M('serratus'), T); g.position.set(s * 0.172, 0.43 - i * 0.042, 0.04 - i * 0.004);
      g.scale.set(0.02, 0.018, 0.05); g.rotation.set(0.0, s * 0.5, s * 0.55); this.serratus.push(g);
    }
    this.traps = mesh(SPH, M('trap'), T); this.traps.position.set(0, 0.5, -0.06); this.traps.scale.set(0.15, 0.06, 0.06);
    this.scaps = [-1, 1].map(s => {
      const g = new THREE.Group(); T.add(g);
      const geo = new THREE.CylinderGeometry(1, 1, 1, 3); const m = mesh(geo, M('scap', 0xcdbba9), g);
      m.scale.set(0.085, 0.012, 0.085); m.rotation.set(Math.PI / 2, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2 ); m.rotation.z = Math.PI;
      g.userData.side = s; return g;
    });
    // limbs
    const R = this.root;
    this.neck = limbMesh(0.05, SKIN2, R);
    this.head = mesh(SPH, SKIN, R); this.head.scale.set(0.095, 0.115, 0.105);
    this.hair = mesh(SPH, HAIR, R); this.hair.scale.set(0.1, 0.085, 0.108);
    this.nose = mesh(SPH, SKIN, R); this.nose.scale.set(0.018, 0.024, 0.02);
    this.side = [-1, 1].map(() => ({
      delt: mesh(SPH, M('delt'), R),
      upper: limbMesh(0.05, SKIN, R), bicep: mesh(SPH, SKIN, R),
      fore: limbMesh(0.04, SKIN, R), foreM: mesh(SPH, M('forearm'), R),
      hand: mesh(SPH, SKIN2, R),
      thigh: limbMesh(0.072, SHORTS, R), thighS: limbMesh(0.068, SKIN, R), shin: limbMesh(0.052, SKIN, R), calf: mesh(SPH, SKIN, R),
      foot: mesh(new THREE.BoxGeometry(1, 1, 1), SHOE, R),
    }));
    for (const s of this.side) {
      s.delt.scale.set(0.078, 0.075, 0.08); s.bicep.scale.set(0.05, 0.085, 0.052); s.foreM.scale.set(0.047, 0.09, 0.047);
      s.hand.scale.set(0.045, 0.06, 0.03); s.calf.scale.set(0.055, 0.1, 0.06);
    }
    this.L = { up: 0.3, fore: 0.27, thigh: 0.44, shin: 0.43 };
  }
  // pose: { pelvis: V3, up: V3, fwd: V3, protract 0..1, elevate (m), breathe 0..1,
  //         hands: [L,R] wrist targets, elbowPole, ankles: [L,R], kneePole, headTilt, handFwd }
  set(p) {
    const up = p.up.clone().normalize();
    const fwd = p.fwd.clone().sub(up.clone().multiplyScalar(p.fwd.dot(up))).normalize();
    const lat = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const basis = new THREE.Matrix4().makeBasis(lat, up, fwd);
    const q = new THREE.Quaternion().setFromRotationMatrix(basis);
    this.torso.position.copy(p.pelvis); this.torso.quaternion.copy(q);
    const W = (x, y, z) => V3(x, y, z).applyQuaternion(q).add(p.pelvis);
    const pr = p.protract ?? 0.5, el = p.elevate ?? 0, br = p.breathe ?? 0;
    this.rib.scale.set(0.185 * (1 + 0.03 * br), 0.2, 0.125 * (1 + 0.06 * br));
    // scapulae slide around the ribcage
    this.scaps.forEach(g => {
      const s = g.userData.side;
      g.position.set(s * (0.075 + 0.05 * pr), 0.405 + el, -0.118 + 0.025 * pr);
      g.rotation.set(0, s * (0.15 + 0.45 * pr), s * (-0.1 + 0.15 * el * 10) * 0.5);
    });
    this.traps.position.y = 0.5 + el * 0.8;
    const shoulders = [-1, 1].map(s => W(s * (0.19 + 0.02 * pr), 0.47 + el, -0.02 + 0.05 * (pr - 0.5)));
    this.shoulders = shoulders;
    const neckB = W(0, 0.52 + el * 0.3, -0.015), headUp = up.clone().applyAxisAngle(lat, p.headTilt || 0);
    const headC = neckB.clone().addScaledVector(headUp, 0.17).addScaledVector(fwd, 0.015);
    placeLimb(this.neck, neckB, neckB.clone().addScaledVector(headUp, 0.07));
    const hq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(lat, headUp, new THREE.Vector3().crossVectors(lat, headUp)));
    this.head.position.copy(headC); this.head.quaternion.copy(hq);
    const hf = new THREE.Vector3().crossVectors(lat, headUp);
    this.hair.position.copy(headC).addScaledVector(headUp, 0.03).addScaledVector(hf, -0.015); this.hair.quaternion.copy(hq);
    this.nose.position.copy(headC).addScaledVector(hf, 0.1).addScaledVector(headUp, -0.01);
    this.headC = headC;
    [-1, 1].forEach((s, i) => {
      const S = this.side[i], sh = shoulders[i];
      const wr = p.hands[i];
      const pole = (p.elbowPole || fwd.clone().negate()).clone().add(lat.clone().multiplyScalar(s * 0.3));
      const elb = twoBone(sh, wr, this.L.up, this.L.fore, pole);
      S.delt.position.copy(sh); S.delt.quaternion.copy(q);
      placeLimb(S.upper, sh, elb); placeLimb(S.fore, elb, wr);
      const ud = elb.clone().sub(sh).normalize(), fd = wr.clone().sub(elb).normalize();
      S.bicep.position.copy(sh).lerp(elb, 0.55).addScaledVector(fwd, 0.012); S.bicep.quaternion.setFromUnitVectors(V3(0, 1, 0), ud);
      S.foreM.position.copy(elb).lerp(wr, 0.32); S.foreM.quaternion.setFromUnitVectors(V3(0, 1, 0), fd);
      S.hand.position.copy(wr).addScaledVector(p.handDir ? p.handDir : fd, 0.05); S.hand.quaternion.setFromUnitVectors(V3(0, 1, 0), p.handDir || fd);
      const hip = W(s * 0.09, -0.02, 0), an = p.ankles[i];
      const knee = twoBone(hip, an, this.L.thigh, this.L.shin, p.kneePole || fwd);
      placeLimb(S.thigh, hip, hip.clone().lerp(knee, 0.45)); placeLimb(S.thighS, hip.clone().lerp(knee, 0.4), knee); placeLimb(S.shin, knee, an);
      const sd = an.clone().sub(knee).normalize();
      S.calf.position.copy(knee).lerp(an, 0.3).addScaledVector(fwd, -0.02); S.calf.quaternion.setFromUnitVectors(V3(0, 1, 0), sd);
      const toe = p.toeDir || fwd;
      S.foot.position.copy(an).addScaledVector(toe, 0.07).addScaledVector(sd, 0.03);
      const fy = sd.clone().negate(), fz = toe.clone().sub(fy.clone().multiplyScalar(toe.dot(fy))).normalize(), fx = new THREE.Vector3().crossVectors(fy, fz);
      S.foot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fx, fy, fz));
      S.foot.scale.set(0.09, 0.07, 0.24);
    });
  }
  glow(levels) { for (const [k, m] of Object.entries(this.muscles)) m.emissiveIntensity = (levels[k] || 0) * 1.6; }
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
