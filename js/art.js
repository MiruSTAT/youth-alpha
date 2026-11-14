// Shop artwork: emoji, plus two hand-drawn pieces (chip bag + potato chip) as tiny SVGs.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SVG = {
  chipbag: `<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M10 6h44l-3 6 3 6v40l3 6H10l3-6V18l-3-6 3-6z" fill="#d93a4a"/>
    <path d="M10 6h44l-3 6H13zM13 64h38l3 6H10z" fill="#b52b3a"/><rect x="13" y="22" width="38" height="28" rx="6" fill="#f6c445"/>
    <ellipse cx="32" cy="36" rx="12" ry="8" fill="#f9d77a" stroke="#d99a00" stroke-width="2" transform="rotate(-12 32 36)"/>
    <circle cx="27" cy="34" r="1.4" fill="#d99a00"/><circle cx="35" cy="38" r="1.4" fill="#d99a00"/><circle cx="36" cy="32" r="1.2" fill="#d99a00"/></svg>`,
  chips: `<svg viewBox="0 0 40 30" aria-hidden="true"><path d="M4 16c2-8 10-13 18-12s14 6 14 12-7 11-16 11S2 24 4 16z" fill="#f9d77a" stroke="#d99a00" stroke-width="2"/>
    <circle cx="14" cy="13" r="1.5" fill="#d99a00"/><circle cx="24" cy="18" r="1.5" fill="#d99a00"/><circle cx="27" cy="11" r="1.2" fill="#d99a00"/></svg>`,
};
export const SPECIAL = { chipbag: 'ถุงขนม', chips: 'มันฝรั่งแผ่น' };

// an uploaded picture is stored as its address (or, in preview mode, as a data: URL)
export const isImg = (v) => typeof v === 'string' && /^(https:\/\/|data:image\/|sheets\/)/.test(v);

// avatar / small icon: emoji text, or a round picture the size of the emoji
export function pic(val, cls = '') {
  return isImg(val) ? `<img class="pic ${cls}" src="${esc(val)}" alt="" loading="lazy" decoding="async">` : esc(val);
}

// returns HTML for an icon value (emoji text, an uploaded picture, or a special keyword)
export function art(val, cls = '') {
  if (SVG[val]) return `<span class="art art-svg ${cls}">${SVG[val]}</span>`;
  if (isImg(val)) return `<span class="art art-img ${cls}"><img src="${esc(val)}" alt="" loading="lazy" decoding="async"></span>`;
  return `<span class="art ${cls}">${esc(val || '🎁')}</span>`;
}

// Fly copies of `val` out of element `el` (the "pop" effect)
export function burst(el, val, count = 10) {
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'fly'; p.innerHTML = art(val);
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2, dist = 90 + Math.random() * 90;
    p.style.left = cx + 'px'; p.style.top = cy + 'px';
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
    p.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
    p.style.animationDelay = (i * 25) + 'ms';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1300 + i * 25);
  }
}

// Shrink a picture in the browser before uploading (smaller, faster, and strips camera location data).
export async function shrinkImage(file, max = 512, quality = 0.85) {
  if (!file || !/^image\//.test(file.type)) throw new Error('not an image');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const blob = await new Promise(res => c.toBlob(res, 'image/webp', quality));
    if (blob && blob.type === 'image/webp') return blob;
    return await new Promise(res => { g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); c.toBlob(res, 'image/jpeg', quality); });
  } finally { URL.revokeObjectURL(url); }
}
