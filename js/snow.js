// Gentle full-page snowfall (2D canvas, very light). Sits above everything but never blocks taps.
const c = document.getElementById('snow');
const ctx = c.getContext('2d');
let flakes = [], w = 0, h = 0, raf = 0, on = false;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  w = innerWidth; h = innerHeight;
  c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(Math.min(70, (w * h) / 9000));
  flakes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.2, v: 0.3 + Math.random() * 0.8, s: Math.random() * 6 }));
}
function draw(t) {
  if (!on) return;
  raf = requestAnimationFrame(draw);
  if (w !== innerWidth || h !== innerHeight) size();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const f of flakes) {
    f.y += f.v; f.x += Math.sin(t / 1400 + f.s) * 0.3;
    if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
  }
}
export const snow = {
  start() { if (on || reduce) return; on = true; c.hidden = false; size(); raf = requestAnimationFrame(draw); },
  stop() { on = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); c.hidden = true; },
};
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (on) raf = requestAnimationFrame(draw); });
