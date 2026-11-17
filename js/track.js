// Kid activity log: what kids view and tap (for later analysis).
// No names are typed or stored here — only a random device id, the chosen kid (if they tapped "this is me"),
// the event name and a short detail. Events are batched and sent every 15 s or when the app is hidden.
import { api } from './data.js?v=35';

const DEV_KEY = 'ya_dev';
let dev = '';
try { dev = localStorage.getItem(DEV_KEY) || ''; } catch {}
if (!dev) {
  dev = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 20);
  try { localStorage.setItem(DEV_KEY, dev); } catch {}
}
const UUID = /^[0-9a-f-]{36}$/i;
let queue = [];

export function track(event, detail = '') {
  if (document.body.classList.contains('adult')) return;          // only kids' activity
  let kid = null; try { const p = new URLSearchParams(location.search).get('p'); kid = localStorage.getItem(p && window.YA_PID > 1 ? 'ya_me_p' + window.YA_PID : 'ya_me'); } catch {}
  queue.push({
    device_id: dev, kid_id: kid && UUID.test(kid) ? kid : null,
    event: String(event).toLowerCase().replace(/[^a-z_]/g, '_').slice(0, 40),
    detail: String(detail ?? '').slice(0, 120),
    path: (location.hash || '#/').slice(0, 60),
  });
  if (queue.length >= 25) flush();
}
export async function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0, 100);
  try { await api.logEvents(batch); } catch (e) { /* analytics must never break the app */ }
}
setInterval(flush, 15000);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
window.addEventListener('pagehide', flush);
