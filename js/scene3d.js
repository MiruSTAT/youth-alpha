// Interactive 3D Christmas scene (Three.js). Drag to spin the tree, tap for sparkles.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

let renderer, scene, camera, tree, star, snow, gifts = [], ornaments = [], sparks = [];
let running = false, raf = 0, spinVel = 0.004, dragging = false, lastX = 0, litCount = 0;
let canvas;
const clock = new THREE.Clock();

export function initScene(el) {
  canvas = el;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { document.body.classList.add('no-webgl'); return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1030, 12, 30);
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
  const giftCols = [[0xd93a4a, 0xf6c445], [0xf4f4f4, 0xd93a4a]];
  [[-2.4, 1.6], [2.3, 1.4]].forEach(([x, z], i) => {
    const s = 0.55 + (i % 2) * 0.2;
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshStandardMaterial({ color: giftCols[i][0], roughness: 0.4 }));
    const rib = new THREE.MeshStandardMaterial({ color: giftCols[i][1], roughness: 0.3, metalness: 0.3 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 1.02, s * 0.16), rib);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.16, s * 1.02, s * 1.02), rib);
    g.add(box, r1, r2); g.position.set(x, s / 2, z); g.rotation.y = i;
    g.userData.baseY = s / 2; g.userData.phase = i * 1.3;
    gifts.push(g); scene.add(g);
  });

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
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
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
  camera.position.z = w / h < 0.9 ? 12.5 : 11;
  camera.updateProjectionMatrix();
}

export function burst(count = 40) {
  if (!scene) return;
  const geo = new THREE.SphereGeometry(0.06, 6, 4);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: [0xf6c445, 0xd93a4a, 0xffffff][i % 3], transparent: true }));
    m.position.set(0, 5.2, 0);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.25, Math.random() * 0.22 + 0.05, (Math.random() - 0.5) * 0.25);
    m.userData.life = 1; sparks.push(m); scene.add(m);
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
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  if (!dragging) { spinVel += (0.004 - spinVel) * 0.03; tree.rotation.y += spinVel; }
  star.rotation.y = time * 1.5;
  star.material.emissiveIntensity = 1 + Math.sin(time * 3) * 0.4;
  ornaments.forEach((o, i) => {
    const target = i < litCount ? 1.2 + Math.sin(time * 2.5 + i) * 0.5 : 0;
    o.material.emissiveIntensity += (target - o.material.emissiveIntensity) * 0.05;
  });
  gifts.forEach(g => { g.position.y = g.userData.baseY + Math.abs(Math.sin(time * 1.6 + g.userData.phase)) * 0.12; });
  const p = snow.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i) - dt * (0.6 + (i % 5) * 0.12);
    if (y < 0) y = 12;
    p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(time + i) * 0.002);
  }
  p.needsUpdate = true;
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.userData.v.y -= 0.006; s.position.add(s.userData.v);
    s.userData.life -= 0.015; s.material.opacity = s.userData.life;
    if (s.userData.life <= 0) { scene.remove(s); s.material.dispose(); sparks.splice(i, 1); }
  }
  renderer.render(scene, camera);
}

export function start() { if (!renderer || running || document.hidden) return; running = true; clock.getDelta(); tick(); }
export function stop() { running = false; cancelAnimationFrame(raf); }
export function refresh() { resize(); }
