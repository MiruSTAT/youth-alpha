// Interactive 3D Christmas scene (Three.js). Drag to spin the tree, tap for sparkles.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

let renderer, scene, camera, tree, star, snow, gifts = [], ornaments = [], sparks = null, sparkPos, sparkCol, sparkVel, sparkLife, sparkNext = 0;
let running = false, want = false, covered = false, quality = 0, qAcc = 0, qN = 0, qWarm = 0, skipFrame = false, raf = 0, spinVel = 0.004, dragging = false, lastX = 0, litCount = 0;
let festive = false, flash = 0, camKick = 0, baseZ = 11, party = [], partyLight = null;
let canvas;
const clock = new THREE.Clock();

export function initScene(el) {
  canvas = el;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { document.body.classList.add('no-webgl'); return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 3.2, 10.5);
  camera.lookAt(0, 2.4, 0);

  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a1030, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 8, 6); scene.add(key);
  const warm = new THREE.PointLight(0xffb347, 30, 12); warm.position.set(-2, 3, 3); scene.add(warm);

  // ground (snow)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(7, 48),
    new THREE.MeshStandardMaterial({ color: 0xe8f0ff, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // tree
  tree = new THREE.Group(); scene.add(tree);
  const green = new THREE.MeshStandardMaterial({ color: 0x1f8a4c, roughness: 0.6, flatShading: true });
  const green2 = new THREE.MeshStandardMaterial({ color: 0x27a55c, roughness: 0.6, flatShading: true });
  [[2.3, 2.0, 1.4], [1.8, 1.8, 2.5], [1.3, 1.6, 3.5], [0.8, 1.3, 4.3]].forEach(([r, hgt, y], i) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, hgt, 9), i % 2 ? green2 : green);
    c.position.y = y; tree.add(c);
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.8, 10),
    new THREE.MeshStandardMaterial({ color: 0x7a4a2a }));
  trunk.position.y = 0.4; tree.add(trunk);

  // star
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.22 : 0.5;
    i ? shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  star = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xffb400, emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.3 }));
  star.position.y = 5.25; star.geometry.center(); tree.add(star);

  // ornaments (light up as points grow)
  const colors = [0xf6c445, 0xd93a4a, 0xffffff];
  const levels = [[2.0, 1.0], [1.55, 2.1], [1.12, 3.1], [0.72, 3.95]];
  let n = 0;
  levels.forEach(([r, y], li) => {
    const count = 10 - li * 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + li * 0.5;
      const col = colors[n % colors.length];
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0, metalness: 0.5, roughness: 0.25 }));
      m.position.set(Math.cos(a) * r, y + (i % 2) * 0.15, Math.sin(a) * r);
      m.userData.color = col; ornaments.push(m); tree.add(m); n++;
    }
  });

  // gifts
  // presents: every box shares the same few shapes and colours, so the special mode can add
  // many more of them without the phone having to build anything new (no stutter)
  GIFT_COLS.forEach(([c1, c2]) => GIFT_MATS.push([new THREE.MeshStandardMaterial({ color: c1, roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: c2, roughness: 0.3, metalness: 0.3 })]));
  [[-2.4, 1.6], [2.3, 1.4]].forEach(([x, z], i) => {
    const s = 0.55 + (i % 2) * 0.2;
    const g = makeGift(i === 0 ? 0 : 5, s);
    g.position.set(x, s / 2, z); g.rotation.y = i;
    g.userData.baseY = s / 2; g.userData.phase = i * 1.3;
    gifts.push(g); scene.add(g);
  });
  for (let i = 0; i < 18; i++) { const g = makeGift(i, 0.32 + Math.random() * 0.3); g.visible = false; party.push(g); scene.add(g); }
  // light for the special mode: always there (switched off), so turning it on does not rebuild the shaders
  partyLight = new THREE.PointLight(0xffffff, 0, 14); partyLight.position.set(0, 6, 3); scene.add(partyLight);
  // sparkles: one reusable particle cloud
  const SP = 400;
  sparkPos = new Float32Array(SP * 3).fill(-999); sparkCol = new Float32Array(SP * 3); sparkVel = new Float32Array(SP * 3); sparkLife = new Float32Array(SP);
  const spg = new THREE.BufferGeometry();
  spg.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3)); spg.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
  const dotC = document.createElement('canvas'); dotC.width = dotC.height = 32;
  const dg = dotC.getContext('2d'), grad = dg.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.8)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = grad; dg.fillRect(0, 0, 32, 32);
  sparks = new THREE.Points(spg, new THREE.PointsMaterial({ size: 0.26, map: new THREE.CanvasTexture(dotC), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sparks.frustumCulled = false; scene.add(sparks);

  // snow
  const COUNT = 300, pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) { pos[i * 3] = (Math.random() - 0.5) * 20; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - 0.5) * 14; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.85, depthWrite: false }));
  scene.add(snow);

  // interaction
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; tapStart = performance.now(); tapX = e.clientX; });
  window.addEventListener('pointermove', (e) => { if (!dragging) return; spinVel = (e.clientX - lastX) * 0.004; tree.rotation.y += spinVel; lastX = e.clientX; });
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return; dragging = false;
    if (performance.now() - tapStart < 250 && Math.abs(e.clientX - tapX) < 8) { burst(); spinVel = 0.12; }
  });
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
  // the page scrolls over the tree: once the tree is fully covered there is nothing to draw
  window.addEventListener('scroll', () => {
    const c = window.scrollY > canvas.clientHeight * 0.92;
    if (c === covered) return;
    covered = c; covered ? pause() : resume();
  }, { passive: true });
  resize();
  return true;
}
let tapStart = 0, tapX = 0, lastW = 0, lastH = 0;

function resize() {
  if (!renderer) return;
  // While the canvas is hidden (admin pages, phone keyboard open) it has no size:
  // skip, otherwise the tree gets the wrong shape (stretched) until refresh.
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  lastW = w; lastH = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the tree fully visible on narrow phones
  baseZ = w / h < 0.9 ? 12.5 : 11;
  camera.position.z = baseZ - camKick * 1.6;
  camera.updateProjectionMatrix();
}

const SPARK_COLS = [[1, 0.83, 0.3], [0.95, 0.25, 0.3], [1, 1, 1]];
export function burst(count = 40) {
  if (!sparks) return;
  for (let k = 0; k < count; k++) {
    const i = sparkNext; sparkNext = (sparkNext + 1) % sparkLife.length;
    sparkPos.set([0, 5.2, 0], i * 3);
    sparkVel.set([(Math.random() - 0.5) * 15, Math.random() * 13 + 3, (Math.random() - 0.5) * 15], i * 3);
    sparkLife[i] = 1;
    sparkCol.set(SPARK_COLS[k % 3], i * 3);
  }
}

// how many ornaments glow (0..1)
export function setGlow(fraction) {
  litCount = Math.round(Math.max(0.1, Math.min(1, fraction)) * ornaments.length);
}

function tick() {
  if (!running) return;
  raf = requestAnimationFrame(tick);
  if (canvas.clientWidth !== lastW || canvas.clientHeight !== lastH) resize();
  if (quality >= 2 && (skipFrame = !skipFrame)) return;            // slow phone: draw every second frame
  const raw = clock.getDelta(), dt = Math.min(raw, quality >= 2 ? 0.1 : 0.05), time = clock.elapsedTime;
  // watch the speed for a moment; if the phone cannot keep up, lower the detail one step
  if (qWarm < 40) qWarm++;
  else if (quality < 2) {
    qAcc += Math.min(raw, 0.2) / (quality >= 2 ? 2 : 1); qN++;
    if (qN >= 90) {
      if (qAcc / qN > 0.036) { quality++; if (quality === 1) { renderer.setPixelRatio(1); lastW = 0; } }
      qAcc = 0; qN = 0;
    }
  }
  if (!dragging) { spinVel += (0.004 - spinVel) * 0.03; tree.rotation.y += spinVel; }
  star.rotation.y = time * 1.5;
  star.material.emissiveIntensity = 1 + Math.sin(time * 3) * 0.4 + flash * 5;
  star.scale.setScalar(1 + flash * 0.9 + (festive ? 0.15 + Math.sin(time * 4) * 0.08 : 0));
  flash *= 0.96;
  ornaments.forEach((o, i) => {
    if (festive) {                                   // special mode: every light on, colours chasing round the tree
      o.material.emissive.setHSL(((time * 0.25 + i / ornaments.length) % 1), 1, 0.55);
      o.material.emissiveIntensity = 1.3 + Math.sin(time * 6 + i) * 0.6;
      return;
    }
    const target = i < litCount ? 1.2 + Math.sin(time * 2.5 + i) * 0.5 : 0;
    o.material.emissiveIntensity += (target - o.material.emissiveIntensity) * 0.05;
  });
  if (camKick > 0.001) { camKick *= 0.97; camera.position.z = baseZ - camKick * 1.6; camera.position.y = 3.2 + camKick * 0.8; camera.lookAt(0, 2.4, 0); }
  if (partyLight && festive) { partyLight.color.setHSL((time * 0.2) % 1, 1, 0.6); partyLight.intensity = 25 + Math.sin(time * 5) * 10; }
  stepParty(dt);
  gifts.forEach(g => { g.position.y = g.userData.baseY + Math.abs(Math.sin(time * 1.6 + g.userData.phase)) * 0.12; });
  const p = snow.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i) - dt * (0.6 + (i % 5) * 0.12);
    if (y < 0) y = 12;
    p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(time + i) * 0.002);
  }
  p.needsUpdate = true;
  if (sparks) {
    let any = false;
    for (let i = 0; i < sparkLife.length; i++) {
      if (sparkLife[i] <= 0) continue;
      any = true; const j = i * 3;
      sparkVel[j + 1] -= 21 * dt;
      sparkPos[j] += sparkVel[j] * dt; sparkPos[j + 1] += sparkVel[j + 1] * dt; sparkPos[j + 2] += sparkVel[j + 2] * dt;
      sparkLife[i] -= dt * 0.9;
      const f = Math.max(0, sparkLife[i]) / Math.max(0.001, sparkLife[i] + dt * 0.9);   // fade out (additive: darker = see-through)
      sparkCol[j] *= f; sparkCol[j + 1] *= f; sparkCol[j + 2] *= f;
      if (sparkLife[i] <= 0) sparkPos[j + 1] = -999;
    }
    if (any || sparks.userData.dirty) { sparks.geometry.attributes.position.needsUpdate = true; sparks.geometry.attributes.color.needsUpdate = true; sparks.userData.dirty = any; }
  }
  renderer.render(scene, camera);
}

function resume() { if (!renderer || running || !want || covered || document.hidden) return; running = true; clock.getDelta(); qWarm = 0; qAcc = 0; qN = 0; tick(); }
function pause() { running = false; cancelAnimationFrame(raf); }
export function start() { want = true; covered = window.scrollY > (canvas?.clientHeight || 1e9) * 0.92; resume(); }
export function stop() { want = false; pause(); }
export const info = () => ({ running, covered, quality });
export function refresh() { resize(); }

// ------------------------------------------------------------- special mode (5 quick taps on the tree)
const GIFT_COLS = [[0xd93a4a, 0xf6c445], [0x2a7de1, 0xffffff], [0x27a55c, 0xd93a4a], [0xf6c445, 0xd93a4a], [0x9b4dca, 0xf6c445], [0xf4f4f4, 0xd93a4a]];
const GIFT_MATS = [];
const GEO = {};
function makeGift(i, s) {
  GEO.box ??= new THREE.BoxGeometry(1, 1, 1); GEO.r1 ??= new THREE.BoxGeometry(1.02, 1.02, 0.16); GEO.r2 ??= new THREE.BoxGeometry(0.16, 1.02, 1.02);
  GEO.bow ??= new THREE.TorusGeometry(0.18, 0.06, 6, 12);
  const [m1, m2] = GIFT_MATS[i % GIFT_MATS.length], g = new THREE.Group(), inner = new THREE.Group();
  const bow = new THREE.Mesh(GEO.bow, m2); bow.position.y = 0.55;
  inner.add(new THREE.Mesh(GEO.box, m1), new THREE.Mesh(GEO.r1, m2), new THREE.Mesh(GEO.r2, m2), bow);
  inner.scale.setScalar(s); g.add(inner);
  g.userData.half = s / 2; g.userData.size = s;
  return g;
}
// presents burst out of the tree and land all around it
export function celebrate() {
  if (!scene) return;
  festive = true; flash = 1; camKick = 1; spinVel = 0.45;
  party.forEach((g, i) => {
    const a = Math.random() * Math.PI * 2, sp = 2.2 + Math.random() * 2.6, u = g.userData;
    g.position.set(Math.cos(a) * 0.6, 2 + Math.random() * 2.4, Math.sin(a) * 0.6); g.rotation.set(0, 0, 0); g.scale.setScalar(1);
    u.v = new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 4, Math.sin(a) * sp);
    u.spin = new THREE.Vector3(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
    u.delay = i * 0.04; u.rest = false; u.leaving = 0; u.on = true; g.visible = false;
  });
  burst(150);
}
export function calm() {
  festive = false;
  party.forEach(g => { if (g.userData.on) g.userData.leaving = 1; });
  if (partyLight) partyLight.intensity = 0;
  ornaments.forEach(o => o.material.emissive.setHex(o.userData.color));
}
function stepParty(dt) {
  for (const g of party) {
    const u = g.userData;
    if (!u.on) continue;
    if (u.leaving > 0) {
      u.leaving -= dt * 1.5; g.scale.setScalar(Math.max(0.001, u.leaving));
      if (u.leaving <= 0) { u.on = false; g.visible = false; }
      continue;
    }
    if (u.delay > 0) { u.delay -= dt; continue; }
    g.visible = true;
    if (u.rest) continue;
    u.v.y -= 9.8 * dt;
    g.position.addScaledVector(u.v, dt);
    g.rotation.x += u.spin.x * dt; g.rotation.y += u.spin.y * dt; g.rotation.z += u.spin.z * dt;
    const r = Math.hypot(g.position.x, g.position.z);
    if (r > 6.3) { g.position.x *= 6.3 / r; g.position.z *= 6.3 / r; u.v.x *= -0.3; u.v.z *= -0.3; }
    if (g.position.y < u.half) {
      g.position.y = u.half; u.v.y *= -0.35; u.v.x *= 0.6; u.v.z *= 0.6; u.spin.multiplyScalar(0.5);
      if (Math.abs(u.v.y) < 0.6) { u.rest = true; g.rotation.x = 0; g.rotation.z = 0; }
    }
  }
}
