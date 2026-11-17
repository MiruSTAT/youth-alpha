// Youth Alpha service worker — makes the app quick on weak Wi-Fi and usable with no internet.
//  * app files carry ?v=N: taken from the phone first, replaced when a new version comes out
//  * the page itself: internet first (3.5 s), otherwise the saved copy
//  * libraries, fonts and uploaded pictures (song sheets, avatars): saved the first time, kept between versions
const V = '38';
const SHELL = 'ya-v' + V, KEEP = 'ya-keep-1';
const FILES = ['./', 'manifest.json', 'icon.svg', 'config.js?v=' + V, 'css/style.css?v=' + V,
  ...['app', 'data', 'i18n', 'music', 'art', 'snow', 'track', 'metronome', 'videosync', 'scene3d', 'version', 'songtext', 'superadmin', 'ocr', 'icons', 'demo', 'datatools'].map(n => `js/${n}.js?v=${V}`)];
const LIBS = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'];
const KEEP_HOSTS = /^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
const isUpload = (u) => u.hostname.endsWith('.supabase.co') && u.pathname.startsWith('/storage/v1/object/public/');
const PAGE = self.registration.scope;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(Promise.all([
    caches.open(SHELL).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))),
    caches.open(KEEP).then(c => Promise.all(LIBS.map(async f => { if (!(await c.match(f))) await c.add(f).catch(() => {}); }))),
  ]));
});
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== KEEP).map(k => caches.delete(k)))).then(() => self.clients.claim())));

const after = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
// internet first; when it is slow or down, the saved copy
async function netFirst(e, key, save = true) {
  const c = await caches.open(SHELL), old = await c.match(key);
  const net = fetch(e.request).then(res => { if (res.ok && save) c.put(key, res.clone()); return res; });
  if (!old) return net;
  e.waitUntil(net.catch(() => {}));
  return Promise.race([net, after(3500, old)]).catch(() => old);
}
// saved copy first; fetched (and saved) only the first time
async function cacheFirst(e, name, cors) {
  const c = await caches.open(name), url = e.request.url, hit = await c.match(url, { ignoreVary: true });
  if (hit) return hit;
  let res;
  try { res = await fetch(cors ? new Request(url, { mode: 'cors', credentials: 'omit' }) : e.request); }
  catch (err) { if (!cors) throw err; return fetch(e.request); }
  if (res.ok) c.put(url, res.clone());
  return res;
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === 'navigate' || u.href === PAGE || u.pathname.endsWith('/index.html')) return e.respondWith(netFirst(e, PAGE, req.cache !== 'no-store'));
    if (u.searchParams.has('v') || /\.(jpe?g|png|webp|svg)$/i.test(u.pathname)) return e.respondWith(cacheFirst(e, SHELL));
    return e.respondWith(netFirst(e, req.url, req.cache !== 'no-store'));
  }
  if (KEEP_HOSTS.test(u.hostname) || isUpload(u)) return e.respondWith(cacheFirst(e, KEEP, true));
});
