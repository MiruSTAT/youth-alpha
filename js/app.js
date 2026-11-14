import { t, getLang, setLang } from './i18n.js?v=14';
import { api, MODE, ranked, today, eventState, bkkToday } from './data.js?v=14';
import { music } from './music.js?v=14';
import { art, burst, SPECIAL } from './art.js?v=14';
import { snow } from './snow.js?v=14';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVATARS = ['⛄', '🎅', '🦌', '🎄', '⭐', '🔔', '🎁', '🧸', '🐧', '🦊', '🐱', '🐶', '🐰', '🐼', '🦁', '🐯', '🐨', '🦄', '🐸', '🐵', '🐳', '🦋', '🎹', '🎤'];
// point categories come from the database (admins can edit them)
let catCache = { at: 0, list: [] };
async function pcats(force = false) {
  if (force || Date.now() - catCache.at > 30000) catCache = { at: Date.now(), list: await api.pointCats() };
  return catCache.list;
}
const cName = (c) => (getLang() === 'en' && c?.name_en) ? c.name_en : (c?.name_th || '?');
const cOf = (key) => catCache.list.find(c => c.key === key) || { key, name_th: key, icon: '⭐', info: '' };
const fmtMoney = (n) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
const signed = (n) => (n > 0 ? '+' : '') + n;

let scene = null;
let lbCache = { at: 0, rows: [] };

// ------------------------------------------------------------- utilities
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}
function fail(e) { console.error(e); toast(t('errGeneric')); }

function modal(title, inner, { okText = t('save'), extra = '', danger = false } = {}) {
  const dlg = $('#dlg'), form = $('#dlgForm');
  form.innerHTML = `<h3>${title}</h3>${inner}
    <div class="dlg-actions"><button class="btn" value="cancel" formnovalidate>${t('cancel')}</button>
    <button class="btn ${danger ? 'danger-fill' : 'primary'}" value="ok">${okText}</button></div>
    ${extra ? `<div class="dlg-extra">${extra}</div>` : ''}`;
  form.querySelectorAll('[required]').forEach(i => i.closest('.field')?.querySelector('label')?.classList.add('req'));
  return new Promise((resolve) => {
    dlg.onclose = () => resolve(dlg.returnValue === 'ok' ? new FormData(form) : (dlg.returnValue || null));
    dlg.returnValue = ''; dlg.showModal();
  });
}
async function confirmBox(msg, okText = t('del'), danger = true) {
  return (await modal('⚠️ ' + t('warnTitle'), `<p style="font-size:1.05rem;white-space:pre-line">${esc(msg)}</p>`, { okText, danger })) instanceof FormData;
}
async function leaderboard(force = false) {
  if (force || Date.now() - lbCache.at > 8000) lbCache = { at: Date.now(), rows: ranked(await api.leaderboard()) };
  return lbCache.rows;
}
const pageHead = (title, backTo = '#/admin') =>
  `<div class="page-head"><a class="back" href="${backTo}">‹ ${t('back')}</a><h1 class="page-title">${title}</h1></div>`;

// ------------------------------------------------------------- theme + event timing
const THEMES = [['snow', 'linear-gradient(#eef4fd,#d5e4f7)'], ['night', 'linear-gradient(#2c4591,#1c2d66)'], ['red', 'linear-gradient(#8a1c2c,#5a0f1c)'], ['forest', 'linear-gradient(#23664a,#123a29)']];
function applyTheme(k) {
  document.body.dataset.theme = k; try { localStorage.setItem('ya_theme', k); } catch {}
  snow.recolor();
}
document.body.dataset.theme = localStorage.getItem('ya_theme') || 'snow';
let evCache = null;
async function eventInfo(force = false) {
  if (!evCache || force) evCache = await api.eventInfo().catch(() => ({ event_dow: 0, event_start: '10:00', event_end: '12:00' }));
  return evCache;
}
const fmtDur = (mins) => t('dur', Math.floor(mins / 1440), Math.floor((mins % 1440) / 60), mins % 60);
const hmMin = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };

// ------------------------------------------------------------- top bar
function paintChrome() {
  $('#langBtn').textContent = getLang() === 'th' ? 'EN' : 'TH';
  $('#musicBtn').textContent = music.playing ? '🔊' : '🔇';
  $('#musicBtn').setAttribute('aria-label', music.playing ? t('musicOff') : t('musicOn'));
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
}
$('#langBtn').onclick = () => { setLang(getLang() === 'th' ? 'en' : 'th'); paintChrome(); render(); };
$('#musicBtn').onclick = (e) => { e.stopPropagation(); music.toggle(); paintChrome(); };
const firstTap = () => {
  if (music.wantsMusic() && !music.playing) { music.start(); paintChrome(); }
  window.removeEventListener('pointerdown', firstTap);
};
window.addEventListener('pointerdown', firstTap);

async function ensureScene() {
  if (scene) { scene.refresh(); scene.start(); return scene; }
  try {
    const m = await import('./scene3d.js?v=14');
    if (m.initScene($('#scene'))) { scene = m; scene.start(); } else document.body.classList.add('no-webgl');
  } catch (e) { console.warn('3D unavailable', e); document.body.classList.add('no-webgl'); }
  return scene;
}

// =============================================================== KID SIDE
function setNav(which) { document.querySelectorAll('.kid-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === which)); }

function countUp(el, from, to, ms = 1200) {
  const t0 = performance.now();
  const step = (now) => { const p = Math.min(1, (now - t0) / ms); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// small reminder on the home page while the feedback box is open
function fbPill(ev) {
  return ev.fb_open ? `<button class="ev-pill feedback" data-ev="fb"><span class="i">💬</span><span>${t('evFeedback')}</span></button>` : '';
}
function wirePill(root) { root.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => openFeedback()); }

// HOME = ranking, with "my card" on top (no separate "me" page)
async function kidRank() {
  setNav('rank');
  const [rows, ev] = await Promise.all([leaderboard(true), eventInfo(), pcats(true)]);
  const mineId = localStorage.getItem('ya_me'), me = rows.find(r => r.id === mineId);
  if (mineId && !me) localStorage.removeItem('ya_me');
  const max = Math.max(1, ...rows.map(r => r.total));
  scene?.setGlow(me ? me.total / max : 0.6);
  const medal = ['🥇', '🥈', '🥉'];
  view.innerHTML = `<section class="sheet">
    ${fbPill(ev)}
    ${me ? `<button class="my-card" id="myCard"><span class="av">${esc(me.avatar)}</span>
        <span class="who"><b>${esc(me.nickname)}</b><span>🏆 ${t('rank')} ${me.rank} ${t('of')} ${rows.length}</span></span>
        <span class="pts"><b id="tot">0</b><span>${t('points')}</span></span></button>`
      : rows.length ? `<p class="my-hint">👇 ${t('tapYourName')}</p>` : ''}
    <h1 class="sheet-title" style="margin-bottom:12px">🏆 ${t('ranking')}</h1>
    <div class="rank-list">${rows.map(k => `<button class="rank-row ${k.id === mineId ? 'mine' : ''}" data-id="${k.id}">
      <span class="n ${k.rank <= 3 ? 'medal' : ''}">${k.rank <= 3 ? medal[k.rank - 1] : k.rank}</span>
      <span class="av">${esc(k.avatar)}</span><span class="nm">${esc(k.nickname)}</span><span class="pt">${k.total} ⭐</span></button>`).join('')}</div>
    ${rows.length ? '' : `<p class="empty">${t('noKids')}</p>`}</section>`;
  wirePill(view);
  view.querySelectorAll('.rank-row').forEach(b => b.onclick = () => kidDetail(rows.find(r => r.id === b.dataset.id), rows));
  if (me) {
    $('#myCard').onclick = () => kidDetail(me, rows);
    const seenKey = `ya_seen_${me.id}`, seen = Number(localStorage.getItem(seenKey) ?? me.total);
    countUp($('#tot'), Math.min(seen, me.total), me.total);
    if (me.total > seen) setTimeout(() => {
      const pop = document.createElement('div'); pop.className = 'plus-pop'; pop.textContent = `+${me.total - seen} ⭐`;
      document.body.appendChild(pop); setTimeout(() => pop.remove(), 2100); scene?.burst(60); music.ding();
    }, 800);
    localStorage.setItem(seenKey, me.total);
  }
}

// a kid's points by category (with details like piano / singing)
function kidDetail(k, rows) {
  const isMe = localStorage.getItem('ya_me') === k.id;
  const cats = catCache.list.filter(c => c.active || k.skills[c.key]);
  const p = kidSheet(`<div class="panel-head"><h2>${esc(k.nickname)}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <div class="kid-detail-head"><div class="av">${esc(k.avatar)}</div><b>${k.total} ⭐</b><span class="me-rank">🏆 ${t('rank')} ${k.rank} ${t('of')} ${rows.length}</span></div>
    <p class="section-label">${t('mySkills')}</p>
    <div class="skill-list">${cats.map(c => {
      const det = k.details?.[c.key];
      return `<button class="skill-row ${c.info ? 'has-info' : ''}" data-c="${c.key}"><span class="i">${esc(c.icon)}</span><span class="l">${esc(cName(c))}</span>
        <span class="v">${k.skills[c.key] || 0}</span><span class="chev">${c.info ? 'ⓘ' : ''}</span></button>`
        + (det ? `<div class="sub-rows">${Object.entries(det).map(([d, v]) => `<div><span>${esc(d)}</span><span>${v}</span></div>`).join('')}</div>` : '');
    }).join('')}</div>
    ${isMe ? `<button class="text-btn" id="notMe">${t('notMe')}</button>` : `<button class="kbtn" id="thisMe">${t('thisIsMe')}</button>`}`);
  p.querySelectorAll('.skill-row.has-info').forEach(b => b.onclick = () => catInfo(cOf(b.dataset.c), k.skills[b.dataset.c] || 0));
  const close = () => { $('#kidSheet').hidden = true; kidRank(); };
  p.querySelector('#thisMe')?.addEventListener('click', () => { localStorage.setItem('ya_me', k.id); localStorage.setItem(`ya_seen_${k.id}`, k.total); close(); });
  p.querySelector('#notMe')?.addEventListener('click', () => { localStorage.removeItem('ya_me'); close(); });
}

function catInfo(c, pts) {
  kidSheet(`<div class="panel-head"><span class="art" style="font-size:2rem">${esc(c.icon)}</span><h2>${esc(cName(c))}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <p class="cat-info">${esc(c.info).replace(/\n/g, '<br>')}</p>
    ${pts !== null ? `<div class="cat-pts"><span>${t('myPointsIn')}</span><b>${pts} ⭐</b></div>` : ''}`);
}

// a shower of red hearts
function hearts(el, waves = 3) {
  if (!el) return;
  for (let w = 0; w < waves; w++) setTimeout(() => burst(el, '❤️', 14), w * 260);
}

// Bible: trusted links (YouVersion — free, no ads, many Thai versions)
function openBible() {
  const link = (href, icon, title, sub) => `<a class="mrow" href="${href}" target="_blank" rel="noopener noreferrer"><span class="mi">${icon}</span><span class="mt"><b>${title}</b><span>${sub}</span></span><span class="mv">↗</span></a>`;
  kidSheet(`<div class="panel-head"><h2>📖 ${t('bible')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <p class="cat-info" style="font-size:1rem">${t('bibleIntro')}</p>
    <div class="mlist">
      ${link('https://www.bible.com/th', '🌐', t('bibleRead'), 'bible.com (YouVersion)')}
      ${link('https://play.google.com/store/apps/details?id=com.sirma.mobile.bible.android', '🤖', t('bibleAndroid'), 'Google Play')}
      ${link('https://apps.apple.com/app/id282935706', '🍎', t('bibleIos'), 'App Store')}
    </div>`);
}

// MENU: everything else in one simple list
async function kidMenu() {
  setNav('menu'); scene?.setGlow(0.6);
  const ev = await eventInfo(true);
  const thName = t('th_' + (document.body.dataset.theme || 'snow'));
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title" style="margin-bottom:16px">☰ ${t('menu')}</h1>
    <div class="mlist">
      <button class="mrow" data-m="fb" ${ev.fb_open ? 'style="border:2px solid var(--gold)"' : ''}><span class="mi">💬</span><span class="mt"><b>${t('fb')}</b>
        <span>${ev.fb_open ? t('fbOpenSub') : t('fbClosedSub')}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="bible"><span class="mi">📖</span><span class="mt"><b>${t('bible')}</b><span>${t('bibleSub')}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="theme"><span class="mi">🎨</span><span class="mt"><b>${t('theme')}</b></span><span class="mv">${thName} ›</span></button>
      <button class="mrow" data-m="lang"><span class="mi">🌐</span><span class="mt"><b>${t('language')}</b></span><span class="mv">${t('langName')}</span></button>
      <button class="mrow" data-m="help"><span class="mi">❓</span><span class="mt"><b>${t('help')}</b><span>${t('helpSub')}</span></span><span class="mv">›</span></button>
      <a class="mrow quiet" href="#/admin"><span class="mi">🔒</span><span class="mt"><b>${t('adults')}</b><span>${t('adminSub')}</span></span><span class="mv">›</span></a>
    </div></section>`;
  const act = {
    fb: openFeedback, bible: openBible, theme: openThemes, help: () => showTour(TOUR),
    lang: () => { setLang(getLang() === 'th' ? 'en' : 'th'); paintChrome(); kidMenu(); },
  };
  view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => act[b.dataset.m]());
}

function openThemes() {
  const cur = document.body.dataset.theme || 'snow';
  const p = kidSheet(`<div class="panel-head"><h2>🎨 ${t('theme')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <div class="themes">${THEMES.map(([k, g]) => `<button class="sw ${k === cur ? 'on' : ''}" data-th="${k}"><div class="pv" style="background:${g}">🎄</div><span class="nm">${t('th_' + k)}</span></button>`).join('')}</div>`);
  p.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { applyTheme(b.dataset.th); openThemes(); kidMenu(); });
}

async function openFeedback() {
  const ev = await eventInfo(true);
  const head = `<div class="panel-head"><h2>💬 ${t('fbTitle')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>`;
  const sentKey = 'ya_fb_' + bkkToday();
  if (!ev.fb_open) {
    kidSheet(`${head}<p class="fb-done">🔒 ${t('fbClosed')}</p>`);
    return;
  }
  if (localStorage.getItem(sentKey)) { kidSheet(`${head}<p class="fb-done">${t('fbSentAlready')}</p>`); return; }
  const me = (await leaderboard()).find(r => r.id === localStorage.getItem('ya_me'));
  let mood = 0;
  const p = kidSheet(`${head}<p style="margin:0">${t('fbMood')}</p>
    <div class="moods">${['😄', '🙂', '😐', '😢'].map((m, i) => `<button class="mood" data-m="${4 - i}" aria-label="${m}">${m}</button>`).join('')}</div>
    <textarea class="k-text" id="fbMsg" maxlength="500" placeholder="${t('fbMsg')}"></textarea>
    ${me ? `<label class="fb-as"><input type="checkbox" id="fbName" checked> ${t('fbAs', esc(me.nickname))}</label>` : ''}
    <button class="kbtn" id="fbSend" disabled>${t('fbSend')}</button>`);
  const send = p.querySelector('#fbSend'), msg = p.querySelector('#fbMsg');
  const check = () => { send.disabled = !msg.value.trim(); };
  msg.oninput = check;
  p.querySelectorAll('.mood').forEach(b => b.onclick = () => { mood = Number(b.dataset.m); p.querySelectorAll('.mood').forEach(x => x.classList.toggle('on', x === b)); });
  send.onclick = async () => {
    send.disabled = true;
    const useName = me && p.querySelector('#fbName')?.checked;
    try {
      await api.sendFeedback({ kid_id: useName ? me.id : null, kid_name: useName ? me.nickname : '', mood, message: msg.value.trim().slice(0, 500) });
      localStorage.setItem(sentKey, '1');
      p.innerHTML = `${head}<p class="fb-done">${t('fbThanks')}</p>`; music.ding(); hearts(p.querySelector('.fb-done'));
    } catch (e) { console.error(e); toast(t('fbClosed')); check(); }
  };
}

// ---- kid bottom sheet helper
function kidSheet(html) {
  const el = $('#kidSheet');
  el.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}</div>`;
  el.hidden = false;
  const close = () => { el.hidden = true; el.innerHTML = ''; };
  el.onclick = (e) => { if (e.target === el || e.target.closest('.x')) close(); };
  return el.querySelector('.panel');
}
const fmtDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString(getLang() === 'th' ? 'th-TH' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const dayNum = (d) => Number(d.slice(8, 10));
const monShort = (d) => new Date(d + 'T00:00:00').toLocaleDateString(getLang() === 'th' ? 'th-TH' : 'en-GB', { month: 'short' });

async function kidShop() {
  setNav('shop'); scene?.setGlow(0.7);
  const { items } = await api.shop();
  const live = items.filter(i => i.active).sort((x, y) => x.price - y.price);
  const rows = []; for (let i = 0; i < live.length; i += 2) rows.push(live.slice(i, i + 2));
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title">🎁 ${t('shopTitle')}</h1><p class="sheet-sub">${t('shopSub')}</p>
    ${live.length ? `<div class="stand">
      <div class="stand-sign">⭐ ${t('shop')} ⭐</div>
      <div class="awning"></div>
      <div class="shelves">${rows.map(row => `<div class="shelf-row">${row.map(i => `<button class="slot" data-i="${i.id}">
          ${art(i.icon)}<div class="plank"></div><span class="lbl">${esc(i.name)}</span><span class="tag">${i.price} ⭐</span></button>`).join('')}</div>`).join('')}</div>
      <div class="counter"></div></div>` : `<p class="empty">${t('emptyShop')}</p>`}
</section>`;
  // tap a prize: it pops out of the shelf (chip bags spill chips, others sparkle)
  view.querySelectorAll('.slot').forEach(b => b.onclick = () => {
    const it = live.find(x => x.id === b.dataset.i);
    b.classList.remove('popping'); void b.offsetWidth; b.classList.add('popping');
    burst(b.querySelector('.art'), it.icon === 'chipbag' ? 'chips' : '✨', 12); music.ding();
  });
}

// ---- tutorial: arrow + text over a darkened screen
const TOUR = [
  { sel: '.kid-nav [data-nav="rank"]', key: 'tut_rank2' },
  { sel: '.kid-nav [data-nav="shop"]', key: 'tut_shop' },
  { sel: '.kid-nav [data-nav="menu"]', key: 'tut_menu' },
  { sel: '#musicBtn', key: 'tut_music' },
];
function showTour(steps) {
  const box = $('#tour'); let i = 0;
  const end = () => { box.hidden = true; box.innerHTML = ''; window.removeEventListener('resize', place); };
  function place() {
    const s = steps[i], el = $(s.sel);
    if (!el || !el.getBoundingClientRect().width) { i++; return i < steps.length ? place() : end(); }
    const r = el.getBoundingClientRect(), pad = 6, below = r.top < innerHeight / 2;
    // keep the bubble next to its target (matters on wide PC screens)
    const bw = Math.min(360, innerWidth - 32), cx = r.left + r.width / 2;
    const bl = Math.max(16, Math.min(innerWidth - bw - 16, cx - bw / 2));
    box.innerHTML = `<div class="tour-hole" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
      <div class="tour-arrow ${below ? '' : 'down'}" style="left:${Math.max(8, Math.min(innerWidth - 50, r.left + r.width / 2 - 20))}px;top:${below ? r.bottom + 10 : r.top - 58}px">${below ? '⬆' : '⬇'}</div>
      <div class="tour-bubble" style="left:${bl}px;right:auto;width:${bw}px;margin:0;${below ? `top:${r.bottom + 64}px` : `bottom:${innerHeight - r.top + 64}px`}">
        <p>${t(s.key)}</p><div class="row"><span class="dots">${steps.length > 1 ? `${i + 1} / ${steps.length}` : ''}</span>
        <span>${i < steps.length - 1 ? `<button class="sk">${t('skip')}</button>` : ''}<button class="go">${i < steps.length - 1 ? t('next') : t('gotIt')}</button></span></div></div>`;
    box.querySelector('.go').onclick = () => { i++; i < steps.length ? place() : end(); };
    box.querySelector('.sk')?.addEventListener('click', end);
  }
  box.hidden = false; place(); window.addEventListener('resize', place);
}
// full tour on the first visit; afterwards one tip every few days
async function maybeTour() {
  if (document.body.classList.contains('adult') || !$('#tour').hidden || !$('#kidSheet').hidden) return;
  const every = Number((await eventInfo()).tip_days ?? 3);
  let st; try { st = JSON.parse(localStorage.getItem('ya_tour') || 'null'); } catch { st = null; }
  const now = Date.now(), GAP = every * 864e5;
  if (!st) { showTour(TOUR); st = { done: true, last: now, n: 0 }; }
  else if (every > 0 && now - st.last > GAP) { showTour([TOUR[st.n % TOUR.length]]); st.n++; st.last = now; }
  else return;
  try { localStorage.setItem('ya_tour', JSON.stringify(st)); } catch {}
}

// =============================================================== ADULT SIDE
let adult = { role: null, myId: null };

async function adultGate(page) {
  const session = await api.session();
  if (!session) return loginView();
  adult.role = await api.myRole(); adult.myId = await api.myId();
  if (adult.role === 'pending') return pendingView();
  const pages = { attendance: pAttendance, attsum: pAttSummary, points: pPoints, history: pHistory, kids: pKids, shop: pShop, pcats: pPcats, feedback: pFeedback, export: pExport, ...(adult.role === 'admin' ? { settings: pSettings } : {}) };
  if (!pages[page]) return adultHome();
  await pages[page]();
}

function adultHome() {
  const groups = [
    ['g_daily', [['attendance', '✅'], ['points', '⭐']]],
    ['g_kids', [['kids', '👧'], ['feedback', '💬']]],
    ['g_rewards', [['pcats', '🏷️'], ['shop', '🎁']]],
    ['g_system', [['export', '📥'], ...(adult.role === 'admin' ? [['settings', '⚙️']] : [])]],
  ];
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/">‹ ${t('back')}</a><h1 class="page-title">${t('adultMenu')}</h1></div>
    ${groups.map(([g, items]) => `<h2 class="grp">${t(g)}</h2><nav class="menu grouped">${items.map(([k, i]) => `<a href="#/admin/${k}" data-k="${k}"><span class="mi">${i}</span>
      <span class="mt"><b>${t('tab_' + k)}</b><span>${t('m_' + k)}</span></span><span class="chev">›</span></a>`).join('')}</nav>`).join('')}
    <button class="btn wide" style="margin-top:24px" id="logout">${t('logout')}</button>
    ${MODE === 'preview' ? `<p class="preview-note">${t('previewNote')}</p>` : ''}`;
  $('#logout').onclick = async () => { await api.signOut(); location.hash = '#/admin'; render(); };
  // red indicators: things that still need filling in
  computeNeeds().then(n => {
    const keys = Object.keys(n);
    keys.forEach(k => {
      const a = view.querySelector(`.menu [data-k="${k}"]`); if (!a) return;
      a.classList.add('alert');
      a.querySelector('.mi').insertAdjacentHTML('beforeend', '<span class="dot"></span>');
      a.querySelector('.mt span').outerHTML = `<span class="need">${esc(n[k])}</span>`;
    });
    if (keys.length) view.querySelector('.page-head').insertAdjacentHTML('afterend',
      `<div class="alert-banner"><span class="bell">🔔</span><span><b>${t('needCount', keys.length)}</b><br>${keys.map(k => t('tab_' + k)).join(' · ')}</span></div>`);
  }).catch(console.error);
}
async function computeNeeds() {
  const n = {};
  const [kids, shop, fb] = await Promise.all([api.kids(), api.shop(), api.feedback().catch(() => [])]);
  const active = kids.filter(k => k.active);
  if (!active.length) n.kids = t('need_kids');
  const live = shop.items.filter(i => i.active);
  if (!live.length) n.shop = t('need_shopEmpty');
  if (active.length) {
    const [rowsToday, round] = await Promise.all([api.attendance(today()), api.round(today())]);
    if (rowsToday.length && !round?.finished) n.attendance = t('need_att');
  }
  const ev = await eventInfo(true);
  if (!fb.some(f => f.created_at > (localStorage.getItem('ya_fb_seen') || ''))) {
    const s = view.querySelector('.menu [data-k="feedback"] .mt span'); if (s) s.textContent = ev.fb_open ? t('fbStatusOn') : t('fbStatusOff');
  }
  const seen = localStorage.getItem('ya_fb_seen') || '';
  const nNew = fb.filter(f => f.created_at > seen).length;
  if (nNew) n.feedback = t('newCount', nNew);
  return n;
}

function loginView() {
  view.innerHTML = `${pageHead('🔒 ' + t('adults'), '#/')}
    <form id="lf" class="card">
      <div class="field"><label>${t('username')}</label><input class="input" name="email" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false"></div>
      <div class="field"><label>${t('password')}</label><input class="input" name="pw" type="password" required minlength="6" autocomplete="current-password"></div>
      <button class="btn primary wide" value="in">${t('login')}</button>
    </form>`;
  $('#lf').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), which = e.submitter?.value;
    try {
      if (which === 'up') { await api.signUp(fd.get('email'), fd.get('pw')); toast(t('checkEmail')); }
      else {
        // usernames like "admin" map to an internal login email
        const u = String(fd.get('email')).trim().toLowerCase();
        await api.signIn(u.includes('@') ? u : `${u}@youth-alpha.app`, fd.get('pw'));
      }
    } catch (err) { console.error(err); toast(which === 'up' ? (err.message || t('errGeneric')) : t('errLogin')); }
  };
}

function pendingView() {
  view.innerHTML = `${pageHead(t('adults'), '#/')}
    <div class="card"><p>⏳ ${t('pendingMsg')}</p></div>
    <div class="card"><p class="muted">${t('firstAdminHint')}</p>
      <div class="field"><label>${t('yourName')}</label><input class="input" id="nm"></div>
      <button class="btn primary wide" id="claim">${t('firstAdmin')}</button></div>
    <button class="btn wide" id="lo">${t('logout')}</button>`;
  $('#claim').onclick = async () => { try { (await api.claimAdmin($('#nm').value.trim())) === 'ok' ? render() : toast(t('pendingMsg')); } catch (e) { fail(e); } };
  $('#lo').onclick = async () => { await api.signOut(); render(); };
}

// ---------------- Attendance
let attDay = today();
async function pAttendance() {
  const [kids, rows, round0] = await Promise.all([api.kids(), api.attendance(attDay), api.round(attDay)]);
  let round = round0;
  const active = kids.filter(k => k.active);
  const status = Object.fromEntries(rows.map(r => [r.kid_id, r.status]));
  const stateTxt = { present: ['c-here', t('present')], leave: ['c-leave', t('leave')], absent: ['c-absent', t('absent')] };
  let multi = false; const pick = new Set();
  const draw = () => {
    const c = { present: 0, leave: 0, absent: 0 };
    active.forEach(k => status[k.id] && c[status[k.id]]++);
    const waiting = active.length - c.present - c.leave - c.absent;
    const qv = $('#q')?.value || '';
    view.innerHTML = `${pageHead(t('tab_attendance'))}
      <a class="btn wide" href="#/admin/attsum" style="margin-bottom:12px">📊 ${t('attSummary')}</a>
      <div class="date-row"><input type="date" class="input" id="day" value="${attDay}"></div>
      ${active.length > 8 ? `<input class="input" id="q" placeholder="🔍 ${t('search')}" style="margin-bottom:12px" value="${esc(qv)}">` : ''}
      ${round?.finished ? `<div class="finished-banner"><span>${t('finished')}</span><button class="btn small" id="reopen">${t('reopen')}</button></div>` : ''}
      <div class="summary">
        <div><b class="c-here">${c.present}</b><span>${t('present')}</span></div>
        <div><b class="c-leave">${c.leave}</b><span>${t('leave')}</span></div>
        <div><b class="c-absent">${c.absent}</b><span>${t('absent')}</span></div>
        <div><b class="c-wait">${waiting}</b><span>${t('waiting')}</span></div></div>
      ${active.length ? `<div class="list-tools"><button class="btn small ${multi ? 'primary' : ''}" id="multi">☑️ ${multi ? t('multiDone') : t('multiSelect')}</button>
        ${multi ? `<button class="btn small" id="pickAll">${pick.size === active.length ? t('clear') : t('selectAll')}</button>` : ''}</div>` : ''}
      <div class="att-list">${active.map(k => {
        const st = status[k.id], [cls, label] = st ? stateTxt[st] : ['c-wait', t('waiting')];
        if (multi) return `<button class="opt att-pick ${pick.has(k.id) ? 'on' : ''}" data-p="${k.id}" data-n="${esc(k.nickname.toLowerCase())}"><span class="i">${esc(k.avatar)}</span>
          <span class="t">${esc(k.nickname)}<span class="opt-sub ${cls}">${label}</span></span><span class="check">${pick.has(k.id) ? '✓' : ''}</span></button>`;
        return `<div class="att" data-n="${esc(k.nickname.toLowerCase())}">
          <div class="who"><span class="av">${esc(k.avatar)}</span><span class="nm">${esc(k.nickname)}</span>${st ? '' : `<span class="state ${cls}">${label}</span>`}</div>
          <div class="st">${['present', 'leave', 'absent'].map(s => `<button class="${s} ${st === s ? 'on' : ''}" data-k="${k.id}" data-s="${s}">${t(s)}</button>`).join('')}</div></div>`;
      }).join('') || `<p class="muted">${t('noKids')}</p>`}</div>
      ${multi ? `<div class="bottom-bar bulk"><span class="muted">${t('selectedN', pick.size)}</span><div class="st">${['present', 'leave', 'absent'].map(s => `<button class="${s} on" data-bulk="${s}" ${pick.size ? '' : 'disabled'}>${t(s)}</button>`).join('')}</div></div>`
        : active.length && !round?.finished ? `<div class="bottom-bar"><button class="btn primary" id="finish">✓ ${t('finishRound')}</button></div>` : ''}`;
    $('#day').onchange = (e) => { attDay = e.target.value || today(); pAttendance().catch(fail); };
    const q = $('#q'), filter = () => view.querySelectorAll('.att').forEach(r => r.hidden = !r.dataset.n.includes(q.value.trim().toLowerCase()));
    if (q) { q.oninput = filter; if (qv) filter(); }
    view.querySelectorAll('.st button').forEach(b => b.onclick = async () => {
      const k = b.dataset.k, s = b.dataset.s, prev = status[k], y = window.scrollY;
      if (prev === s && !(await confirmBox(t('clearAttWarn', active.find(x => x.id === k)?.nickname || ''), t('clearAtt')))) return;
      if (prev === s) delete status[k]; else status[k] = s;      // tap again = back to "waiting"
      draw(); window.scrollTo(0, y);
      try { prev === s ? await api.clearAttendance(k, attDay) : await api.setAttendance(k, attDay, s); lbCache.at = 0; }
      catch (e) { if (prev) status[k] = prev; else delete status[k]; draw(); fail(e); }
    });
    $('#multi')?.addEventListener('click', () => { multi = !multi; pick.clear(); draw(); });
    $('#pickAll')?.addEventListener('click', () => { pick.size === active.length ? pick.clear() : active.forEach(k => pick.add(k.id)); draw(); });
    view.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const id = b.dataset.p, y = window.scrollY; pick.has(id) ? pick.delete(id) : pick.add(id); draw(); window.scrollTo(0, y); });
    view.querySelectorAll('[data-bulk]').forEach(b => b.onclick = async () => {
      const s = b.dataset.bulk, ids = [...pick];
      view.querySelectorAll('[data-bulk]').forEach(x => x.disabled = true);
      try {
        for (const k of ids) { await api.setAttendance(k, attDay, s); status[k] = s; }
        lbCache.at = 0; toast(t('bulkDone', ids.length, t(s))); pick.clear(); multi = false; draw();
      } catch (e) { fail(e); draw(); }
    });
    const fin = $('#finish');
    if (fin) fin.onclick = async () => {
      if (await confirmBox(t('finishConfirm', waiting), t('finishRound'), false)) { await api.setRound(attDay, true); round = { finished: true }; draw(); toast(t('saved')); }
    };
    const ro = $('#reopen'); if (ro) ro.onclick = async () => { await api.setRound(attDay, false); round = { finished: false }; draw(); };
  };
  draw();
}

// ---------------- Points: 3 steps, one question per screen
let pw = { step: 1, skill: null, detail: '', amount: null, sel: new Set() };
async function pPoints() {
  const back = pw.step === 1 ? '#/admin' : 'javascript:void 0';
  const head = `${pageHead(t('tab_points'), back)}<p class="step">${t('stepOf', pw.step)}</p>`;
  const wire = () => { const b = $('.page-head .back'); if (pw.step > 1) b.onclick = (e) => { e.preventDefault(); pw.step--; pPoints(); }; };

  const cats = await pcats();
  if (pw.step === 1) {
    view.innerHTML = `${head}<h2 style="margin-bottom:12px">${t('s1')}</h2>
      <div class="options">${cats.filter(c => c.active && c.key !== 'attendance').map(c => `<button class="opt" data-s="${c.key}"><span class="i">${esc(c.icon)}</span>
        <span class="t">${esc(cName(c))}${c.info ? `<span class="opt-sub">${esc(c.info)}</span>` : ''}</span><span class="chev">›</span></button>`).join('')}</div>
      <a class="btn wide" style="margin-top:20px" href="#/admin/history">${t('seeHistory')}</a>`;
    view.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { pw.skill = b.dataset.s; pw.detail = ''; pw.step = 2; pPoints(); });
  } else if (pw.step === 2) {
    const dets = (cOf(pw.skill).details || '').split('\n').filter(Boolean);
    view.innerHTML = `${head}
      ${dets.length ? `<p class="muted" style="margin:0 0 8px">${t('pickDetail')}</p><div class="dchips">${['', ...dets].map(d => `<button class="dchip ${pw.detail === d ? 'on' : ''}" data-d="${esc(d)}">${d ? esc(d) : t('noDetail')}</button>`).join('')}</div>` : ''}
      <h2 style="margin-bottom:12px">${esc(cOf(pw.skill).icon)} ${t('s2')}</h2>
      <div class="amounts">${(pw.skill === 'bonus' ? [5, 10, 20, 50] : [5, 10, 20, 50, -5, -10]).map(a => `<button class="opt ${a < 0 ? 'minus' : ''}" data-a="${a}">${signed(a)}</button>`).join('')}</div>
      <div class="field" style="margin-top:16px"><label>${t('customAmt')}</label>
        <div style="display:flex;gap:10px"><input class="input" id="custom" type="number" inputmode="numeric" min="-1000" max="1000"><button class="btn primary" id="customGo">${t('next')}</button></div></div>`;
    view.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { pw.detail = b.dataset.d; view.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); });
    const go = (a) => { if (!a || Math.abs(a) > 1000) return; if (pw.skill === 'bonus' && a < 0) { toast(t('bonusPositive')); return; } pw.amount = a; pw.step = 3; pPoints(); };
    view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => go(Number(b.dataset.a)));
    $('#customGo').onclick = () => go(Math.trunc(Number($('#custom').value)));
  } else {
    const kids = (await api.kids()).filter(k => k.active);
    const draw = () => {
      const n = pw.sel.size;
      view.innerHTML = `${head}<h2 style="margin-bottom:12px">${t('s3')}</h2>
        <div class="list-tools"><span class="muted">${esc(cOf(pw.skill).icon)} ${esc(cName(cOf(pw.skill)))}${pw.detail ? ' · ' + esc(pw.detail) : ''} · ${signed(pw.amount)}</span>
          <button class="btn small" id="all">${n === kids.length && n ? t('clear') : t('selectAll')}</button></div>
        <div class="options">${kids.map(k => `<button class="opt ${pw.sel.has(k.id) ? 'on' : ''}" data-k="${k.id}"><span class="i">${esc(k.avatar)}</span><span class="t">${esc(k.nickname)}</span><span class="check">${pw.sel.has(k.id) ? '✓' : ''}</span></button>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div>
        <div class="field" style="margin-top:14px"><label>${t('note')}</label><input class="input" id="note" maxlength="80"></div>
        <div class="bottom-bar"><button class="btn primary" id="give" ${n ? '' : 'disabled'}>${t('giveTo', signed(pw.amount), esc(cOf(pw.skill).icon), n)}</button></div>`;
      wire();
      view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const id = b.dataset.k, y = window.scrollY; pw.sel.has(id) ? pw.sel.delete(id) : pw.sel.add(id); draw(); window.scrollTo(0, y); });
      $('#all').onclick = () => { n === kids.length ? pw.sel.clear() : kids.forEach(k => pw.sel.add(k.id)); draw(); };
      $('#give').onclick = async (e) => {
        e.currentTarget.disabled = true;
        try {
          const note = $('#note').value.trim();
          await api.addPoints([...pw.sel].map(kid_id => ({ kid_id, skill: pw.skill, detail: pw.detail || '', amount: pw.amount, note })));
          toast(`✓ ${t('given', pw.sel.size)}`); lbCache.at = 0;
          pw = { step: 1, skill: null, detail: '', amount: null, sel: new Set() }; window.scrollTo(0, 0); pPoints();
        } catch (err) { e.currentTarget.disabled = false; fail(err); }
      };
    };
    draw(); return;
  }
  wire();
}

async function pHistory() {
  const [recent] = await Promise.all([api.recentPoints(50), pcats()]);
  view.innerHTML = `${pageHead(t('pointsHistory'), '#/admin/points')}
    <div class="card"><div class="list">${recent.map(p => `<div class="li"><span class="av">${esc(p.kids?.avatar || '')}</span>
      <span class="grow">${esc(p.kids?.nickname || '?')}<span class="sub">${esc(cOf(p.skill).icon)} ${esc(cName(cOf(p.skill)))}${p.detail ? ' · ' + esc(p.detail) : ''}${p.note ? ' · ' + esc(p.note) : ''}</span></span>
      <span class="amt ${p.amount < 0 ? 'neg' : 'pos'}">${signed(p.amount)}</span><button class="btn small danger" data-del="${p.id}">${t('undo')}</button></div>`).join('') || `<p class="muted">${t('none')}</p>`}</div></div>`;
  view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const p = recent.find(x => x.id === b.dataset.del);
    if (await confirmBox(t('delPointWarn', p?.kids?.nickname || '', signed(p?.amount || 0)))) { try { await api.deletePoint(b.dataset.del); lbCache.at = 0; pHistory(); } catch (e) { fail(e); } }
  });
}

// ---------------- Kids list
async function pKids() {
  const kids = await api.kids(), link = location.href.split('#')[0];
  view.innerHTML = `${pageHead(t('tab_kids'))}
    <button class="btn primary wide" id="add" style="margin-bottom:12px">+ ${t('addKid')}</button>
    <div class="card"><p class="muted" style="margin:0 0 4px">${t('kidsCount', kids.length)}</p><div class="list">${kids.map(k => `<div class="li click" data-edit="${k.id}"><span class="av">${esc(k.avatar)}</span>
      <span class="grow">${esc(k.nickname)}${k.grp || !k.active ? `<span class="sub">${[k.grp, k.active ? '' : t('hidden')].filter(Boolean).map(esc).join(' · ')}</span>` : ''}</span><span class="muted">${t('edit')} ›</span></div>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div></div>
    <div class="card"><p class="muted" style="margin:0 0 8px">🔗 ${t('shareLink')}</p>
      <input class="input" readonly value="${esc(link)}" id="lnk" style="margin-bottom:10px"><button class="btn wide" id="cp">${t('copy')}</button></div>`;
  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(link); toast(t('copied')); } catch { $('#lnk').select(); } };
  $('#add').onclick = () => kidForm(null);
  view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => kidForm(kids.find(k => k.id === b.dataset.edit)));
}
async function kidForm(kid) {
  const cur = kid?.avatar || AVATARS[0];
  const p = modal(kid ? t('edit') : t('addKid'), `
    <div class="field"><label>${t('nickname')}</label><input class="input" name="nickname" required maxlength="30" value="${esc(kid?.nickname || '')}"></div>
    <div class="field"><label>${t('avatar')}</label><input type="hidden" name="avatar" value="${esc(cur)}">
      <div class="emoji-pick">${AVATARS.map(a => `<button type="button" class="${a === cur ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div></div>
    <div class="field"><label>${t('group')}</label><input class="input" name="grp" maxlength="30" value="${esc(kid?.grp || '')}"></div>`,
    { extra: kid ? `<button class="btn small" value="toggle" formnovalidate>${kid.active ? t('hidden') : t('show')}</button><button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  const form = $('#dlgForm');
  form.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { form.querySelectorAll('[data-a]').forEach(x => x.classList.remove('on')); b.classList.add('on'); form.avatar.value = b.dataset.a; });
  const r = await p;
  try {
    if (r instanceof FormData) {
      const d = { nickname: r.get('nickname').trim(), avatar: r.get('avatar'), grp: r.get('grp').trim() };
      if (!d.nickname) return;
      kid ? await api.updateKid(kid.id, d) : await api.addKid(d); toast(t('saved'));
    } else if (r === 'toggle') await api.updateKid(kid.id, { active: !kid.active });
    else if (r === 'delete') { if (!(await confirmBox(t('delKidConfirm', kid.nickname)))) return; await api.deleteKid(kid.id); }
    else return;
    lbCache.at = 0; pKids();
  } catch (e) { fail(e); }
}

// ---------------- Attendance totals
async function pAttSummary() {
  const [kids, rows] = await Promise.all([api.kids(), api.attendanceAll()]);
  const days = new Set(rows.map(r => r.day)).size;
  const c = {}; rows.forEach(r => { (c[r.kid_id] ??= { present: 0, leave: 0, absent: 0 })[r.status]++; });
  const list = kids.map(k => ({ k, ...(c[k.id] || { present: 0, leave: 0, absent: 0 }) })).sort((a, b) => b.present - a.present || a.k.nickname.localeCompare(b.k.nickname, 'th'));
  const tot = list.reduce((s, r) => ({ present: s.present + r.present, leave: s.leave + r.leave, absent: s.absent + r.absent }), { present: 0, leave: 0, absent: 0 });
  view.innerHTML = `${pageHead(t('attSummary'), '#/admin/attendance')}
    <p class="muted" style="margin:-6px 0 12px">${t('rounds', days)}</p>
    <div class="summary"><div><b class="c-here">${tot.present}</b><span>${t('present')}</span></div><div><b class="c-leave">${tot.leave}</b><span>${t('leave')}</span></div><div><b class="c-absent">${tot.absent}</b><span>${t('absent')}</span></div></div>
    <div class="card"><div class="list">${list.map(r => `<div class="li"><span class="av">${esc(r.k.avatar)}</span>
      <span class="grow">${esc(r.k.nickname)}<span class="sub">${t('attTimes', r.present, r.leave, r.absent)}</span></span>
      <span class="amt c-here">${r.present}${days ? `<span class="muted"> / ${days}</span>` : ''}</span></div>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div></div>`;
}

// ---------------- Point categories (name, icon, extra info)
const PC_ICONS = ['🎹', '🎤', '🎼', '🎸', '🥁', '🔤', '📖', '🙋', '🧽', '🍽️', '🧹', '⛪', '🎁', '⭐', '💡', '🙏', '📝', '🤝'];
async function pPcats() {
  const cats = await pcats(true);
  view.innerHTML = `${pageHead(t('tab_pcats'))}
    <button class="btn primary wide" id="addPc" style="margin-bottom:12px">+ ${t('addPcat')}</button>
    <div class="card"><div class="list">${cats.map(c => `<div class="li click" data-k="${c.key}"><span class="av">${esc(c.icon)}</span>
      <span class="grow">${esc(cName(c))}<span class="sub">${c.details ? esc(c.details.split('\n').join(' · ')) + (c.info ? ' — ' : '') : ''}${c.info ? esc(c.info) : (c.details ? '' : '—')}${c.active ? '' : ' · ' + t('hidden')}</span></span><span class="muted">${t('edit')} ›</span></div>`).join('')}</div></div>`;
  $('#addPc').onclick = () => pcForm(null);
  view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => pcForm(cats.find(c => c.key === b.dataset.k)));
}
async function pcForm(c) {
  const p = modal(c ? t('edit') : t('addPcat'), `
    <div class="field"><label>${t('nameTh')}</label><input class="input" name="name_th" required maxlength="40" value="${esc(c?.name_th || '')}"></div>
    <div class="field"><label>${t('nameEn')}</label><input class="input" name="name_en" maxlength="40" value="${esc(c?.name_en || '')}"></div>
    <div class="field"><label>${t('avatar')}</label>${pickRow('icon', PC_ICONS, c?.icon || '⭐')}</div>
    <div class="field"><label>${t('infoLbl')}</label><textarea class="input" name="info" maxlength="500" rows="4" style="height:auto;padding:12px">${esc(c?.info || '')}</textarea></div>
    <div class="field"><label>${t('details')}</label><textarea class="input" name="details" maxlength="300" rows="3" style="height:auto;padding:12px" placeholder="เปียโน&#10;ร้องเพลง">${esc(c?.details || '')}</textarea></div>`,
    { extra: c && c.key !== 'attendance' ? `<button class="btn small" value="toggle" formnovalidate>${c.active ? t('hidden') : t('show')}</button><button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  wirePickers($('#dlgForm'));
  const r = await p;
  try {
    if (r instanceof FormData) {
      const details = r.get('details').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12).join('\n');
      const d = { name_th: r.get('name_th').trim(), name_en: r.get('name_en').trim(), icon: r.get('icon'), info: r.get('info').trim(), details };
      if (c) await api.savePointCat({ key: c.key, ...d }, false);
      else await api.savePointCat({ key: 'c' + Date.now().toString(36), sort: 100, ...d }, true);
      toast(t('saved'));
    } else if (r === 'toggle') await api.savePointCat({ key: c.key, active: !c.active }, false);
    else if (r === 'delete') {
      if (!(await confirmBox(t('delWarn', cName(c))))) return;
      try { await api.deletePointCat(c.key); } catch { toast(t('cantDelPcat')); return; }
    } else return;
    catCache.at = 0; pPcats();
  } catch (e) { fail(e); }
}

// ---------------- Shop editor
const ICONS = ['🐰', '🧸', '🎁', '🍿', 'chipbag', '🍫', '🍬', '🍭', '🧃', '🥤', '🍪', '🍩', '✏️', '📒', '🎨', '⚽', '🏀', '🎮', '🪀', '🧩', '🎀', '👕', '🧢', '⭐'];
const EFFECTS = ['✨', '⭐', 'chips', '🍬', '🍿', '🎀', '❤️', '🎈', '❄️', '🎉'];
function pickRow(name, list, cur) {
  return `<input type="hidden" name="${name}" value="${esc(cur)}"><div class="pick-row" data-for="${name}">
    ${list.map(v => `<button type="button" class="${v === cur ? 'on' : ''}" data-v="${esc(v)}" title="${esc(SPECIAL[v] || v)}">${art(v)}</button>`).join('')}</div>
    <input class="input" data-own="${name}" placeholder="${t('orType')}" maxlength="8" style="height:48px">`;
}
function wirePickers(form) {
  form.querySelectorAll('.pick-row').forEach(row => row.querySelectorAll('button').forEach(b => b.onclick = () => {
    row.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); form[row.dataset.for].value = b.dataset.v;
    const own = form.querySelector(`[data-own="${row.dataset.for}"]`); if (own) own.value = '';
  }));
  form.querySelectorAll('[data-own]').forEach(inp => inp.oninput = () => {
    if (inp.value.trim()) { form[inp.dataset.own].value = inp.value.trim(); form.querySelectorAll(`[data-for="${inp.dataset.own}"] button`).forEach(x => x.classList.remove('on')); }
  });
}
async function pShop() {
  const { items } = await api.shop();
  const list = [...items].sort((x, y) => x.price - y.price);
  view.innerHTML = `${pageHead(t('tab_shop'))}
    <button class="btn primary wide" id="addItem" style="margin-bottom:12px">+ ${t('addItem')}</button>
    <div class="card"><div class="list">${list.map(i => `<div class="li click" data-item="${i.id}">${art(i.icon)}
      <span class="grow">${esc(i.name)}${i.active ? '' : `<span class="sub">${t('hidden')}</span>`}</span><span class="amt">${i.price} ⭐</span><span class="muted">›</span></div>`).join('') || `<p class="muted">${t('need_shopEmpty')}</p>`}</div></div>`;
  $('#addItem').onclick = () => itemForm(null);
  view.querySelectorAll('[data-item]').forEach(b => b.onclick = () => itemForm(list.find(i => i.id === b.dataset.item)));
}
async function itemForm(it) {
  const p = modal(it ? t('edit') : t('addItem'), `
    <div class="field"><label>${t('itemName')}</label><input class="input" name="name" required maxlength="40" value="${esc(it?.name || '')}"></div>
    <div class="field"><label>${t('price')}</label><input class="input" name="price" type="number" inputmode="numeric" min="0" max="100000" required value="${it?.price ?? ''}"></div>
    <div class="field"><label>${t('avatar')}</label>${pickRow('icon', ICONS, it?.icon || '🎁')}</div>`,
    { extra: it ? `<button class="btn small" value="toggle" formnovalidate>${it.active ? t('hidden') : t('show')}</button><button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  wirePickers($('#dlgForm'));
  const r = await p;
  try {
    if (r instanceof FormData) {
      await api.saveItem({ ...(it ? { id: it.id } : {}), name: r.get('name').trim(), price: Math.max(0, Math.trunc(Number(r.get('price')) || 0)), icon: r.get('icon') });
      toast(t('saved'));
    } else if (r === 'toggle') await api.saveItem({ id: it.id, active: !it.active });
    else if (r === 'delete') { if (!(await confirmBox(t('delWarn', it.name)))) return; await api.deleteItem(it.id); }
    else return;
    pShop();
  } catch (e) { fail(e); }
}

// ---------------- Kids' feedback
async function pFeedback() {
  const list = await api.feedback();
  const moods = { 4: '😄', 3: '🙂', 2: '😐', 1: '😢', 0: '💬' };
  const ev = await eventInfo(true);
  view.innerHTML = `${pageHead(t('tab_feedback'))}
    <div class="card switch-card"><div class="sw-text"><b>${t('fbToggle')}</b><span id="fbState" class="${ev.fb_open ? 'c-here' : 'muted'}">${ev.fb_open ? t('fbOnNow') : t('fbOffNow')}</span></div>
      <button class="switch ${ev.fb_open ? 'on' : ''}" id="fbSwitch" role="switch" aria-checked="${!!ev.fb_open}" aria-label="${t('fbToggle')}"><span></span></button></div>
    ${list.length ? `<button class="btn wide" id="fbXl" style="margin-bottom:12px">📥 ${t('exportFb')}</button>` : ''}
    <div class="card"><div class="list">${list.map(f => `<div class="li fb-item"><span class="mood-i">${moods[f.mood] || '💬'}</span>
      <span class="grow"><b>${f.kid_name ? esc(f.kid_name) : t('anon')}</b><span class="sub">${new Date(f.created_at).toLocaleString(getLang() === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      <span style="display:block;margin-top:4px">${esc(f.message)}</span></span></div>`).join('') || `<p class="muted">${t('none')}</p>`}</div></div>`;
  const hadNew = list.some(f => f.created_at > (localStorage.getItem('ya_fb_seen') || ''));
  if (list[0]) localStorage.setItem('ya_fb_seen', list[0].created_at);
  if (hadNew) setTimeout(() => hearts(view.querySelector('.fb-item') || view.querySelector('.card')), 300);
  $('#fbSwitch').onclick = async (e) => {
    const sw = e.currentTarget, turningOn = !sw.classList.contains('on');
    if (!turningOn && !(await confirmBox(t('fbOffWarn'), t('turnOff')))) return;
    sw.disabled = true;
    try {
      await api.saveSettings({ fb_open: turningOn }); evCache = null;
      sw.classList.toggle('on', turningOn); sw.setAttribute('aria-checked', String(turningOn));
      const st = $('#fbState'); st.textContent = turningOn ? t('fbOnNow') : t('fbOffNow'); st.className = turningOn ? 'c-here' : 'muted';
      toast(turningOn ? t('fbOnNow') : t('fbOffNow'));
    } catch (err) { fail(err); }
    sw.disabled = false;
  };
  $('#fbXl')?.addEventListener('click', async (e) => { const b = e.currentTarget; b.disabled = true; try { await buildExcel(['xs_feedback']); } catch (err) { fail(err); } b.disabled = false; });
}

// ---------------- Settings (admin): all timings in one place
async function pSettings() {
  const s = await api.settings();
  view.innerHTML = `${pageHead(t('tab_settings'))}
    <div class="card"><h3 class="sec">👆 ${t('secTips')}</h3>
      <div class="field"><label>${t('tipDays')}</label><input class="input" id="tips" type="number" min="0" max="60" value="${s.tip_days ?? 3}"></div></div>
    <div class="card"><h3 class="sec">⭐ ${t('secPoints')}</h3>
      <div class="field"><label>${t('attPoints')}</label><input class="input" id="ap" type="number" min="0" max="1000" value="${s.attendance_points}"></div></div>
    <div class="bottom-bar"><button class="btn primary" id="saveSet">${t('save')}</button></div>`;
  $('#saveSet').onclick = async () => {
    const d = { tip_days: Math.max(0, Math.min(60, Math.trunc(Number($('#tips').value) || 0))), attendance_points: Math.max(0, Math.min(1000, Math.trunc(Number($('#ap').value) || 0))) };
    try { await api.saveSettings(d); evCache = null; toast(t('saved')); } catch (e) { fail(e); }
  };
}

// ---------------- Export everything to Excel (.xlsx), built in the browser
const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => res(window.XLSX); s.onerror = rej; document.head.appendChild(s); });
}
const XL_SHEETS = [['xs_summary', 'summary', '📊'], ['xs_points', 'points', '⭐'], ['xs_att', 'attendance', '✅'], ['xs_attsum', 'attendance-totals', '📈'], ['xs_feedback', 'feedback', '💬'], ['xs_shop', 'shop', '🎁']];
async function pExport() {
  view.innerHTML = `${pageHead(t('tab_export'))}
    <button class="btn primary wide" data-x="all" style="margin-bottom:6px">📥 ${t('exportAll')}</button>
    <p class="muted" style="margin:0 0 14px;text-align:center">${t('exportAllSub')}</p>
    <h2 class="grp">${t('exportEach')}</h2>
    <nav class="menu grouped">${XL_SHEETS.map(([k, , i]) => `<button class="xl-row" data-x="${k}"><span class="mi">${i}</span><span class="mt"><b>${t(k)}</b></span><span class="xl-dl">📥 ${t('exportOne')}</span></button>`).join('')}</nav>`;
  view.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => {
    const keep = b.innerHTML; b.disabled = true; b.textContent = t('exporting');
    try { await buildExcel(b.dataset.x === 'all' ? null : [b.dataset.x]); } catch (err) { fail(err); }
    b.disabled = false; b.innerHTML = keep;
  });
}
async function buildExcel(only = null) {
  const [XLSX, kids, rows, cats, pts, att, fb, shop] = await Promise.all([loadXLSX(), api.kids(), leaderboard(true), pcats(true), api.allPoints(),
    api.attendanceAll(), api.feedback().catch(() => []), api.shop()]);
  const kidName = Object.fromEntries(kids.map(k => [k.id, k.nickname]));
  const dt = (s) => s ? new Date(new Date(s).getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : ''; // Thai time, 2026-11-14 21:41
  const stTxt = { present: t('present'), leave: t('leave'), absent: t('absent') };
  const by = Object.fromEntries(rows.map(r => [r.id, r]));
  const attC = {}; att.forEach(r => { (attC[r.kid_id] ??= { present: 0, leave: 0, absent: 0 })[r.status]++; });
  const summary = kids.map(k => {
    const r = by[k.id] || { total: 0, skills: {} }, row = { [t('nickname')]: k.nickname, [t('group').replace(/ \(.*\)/, '')]: k.grp, [t('xc_total')]: r.total };
    cats.forEach(c => { row[cName(c)] = r.skills?.[c.key] || 0; });
    const a = attC[k.id] || { present: 0, leave: 0, absent: 0 };
    Object.assign(row, { [t('present')]: a.present, [t('leave')]: a.leave, [t('absent')]: a.absent });
    return row;
  }).sort((a, b) => b[t('xc_total')] - a[t('xc_total')]);
  const sheets = [
    ['xs_summary', summary],
    ['xs_points', pts.map(p => ({ [t('date')]: dt(p.created_at), [t('nickname')]: p.kids?.nickname || kidName[p.kid_id] || '', [t('category')]: cName(cOf(p.skill)), [t('xc_detail')]: p.detail || '', [t('xc_points')]: p.amount, [t('note')]: p.note || '' }))],
    ['xs_att', [...att].sort((a, b) => a.day.localeCompare(b.day)).map(r => ({ [t('date')]: r.day, [t('nickname')]: kidName[r.kid_id] || '', [t('xc_status')]: stTxt[r.status] }))],
    ['xs_attsum', kids.map(k => { const a = attC[k.id] || { present: 0, leave: 0, absent: 0 }; return { [t('nickname')]: k.nickname, [t('present')]: a.present, [t('leave')]: a.leave, [t('absent')]: a.absent }; })],
    ['xs_feedback', fb.map(f => ({ [t('date')]: dt(f.created_at), [t('nickname')]: f.kid_name || t('anon'), [t('xc_mood')]: ['', '😢', '😐', '🙂', '😄'][f.mood] || '', [t('xc_msg')]: f.message }))],
    ['xs_shop', shop.items.map(i => ({ [t('itemName')]: i.name, [t('xc_points')]: i.price, [t('xc_shown')]: i.active ? '✓' : t('hidden') }))],
  ];
  const wb = XLSX.utils.book_new();
  for (const [k, data] of sheets.filter(([k]) => !only || only.includes(k))) {
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ '-': t('none') }]);
    const cols = Object.keys(data[0] || { '-': 1 });
    ws['!cols'] = cols.map(c => ({ wch: Math.min(50, Math.max(c.length + 2, ...data.map(r => String(r[c] ?? '').length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, t(k).slice(0, 31));
  }
  const slug = only?.length === 1 ? (XL_SHEETS.find(s => s[0] === only[0])?.[1] + '-') : '';
  XLSX.writeFile(wb, `youth-alpha-${slug}${bkkToday()}.xlsx`);
}

// =============================================================== router
let renderSeq = 0;
async function render() {
  const seq = ++renderSeq, h = location.hash || '';
  const isAdult = h.startsWith('#/admin');
  document.body.classList.toggle('adult', isAdult);
  $('#kidSheet').hidden = true;
  isAdult ? snow.stop() : snow.start();
  paintChrome();
  try {
    if (isAdult) { scene?.stop(); return await adultGate(h.split('/')[2]); }
    await ensureScene();
    if (seq !== renderSeq) return;
    if (h === '#/shop') return await kidShop();
    if (h === '#/menu') return await kidMenu();
    if (h.startsWith('#/me') || h === '#/rank') { history.replaceState(null, '', '#/'); }
    return await kidRank();
  } catch (e) { fail(e); view.innerHTML = `<p class="empty">${t('errGeneric')}</p>`; }
}
setTimeout(maybeTour, 1800);
window.addEventListener('hashchange', () => {
  if (location.hash === '#/admin/points') pw = { step: 1, skill: null, detail: '', amount: null, sel: new Set() };
  window.scrollTo(0, 0); render();
});
api.onAuth?.(() => { if (location.hash.startsWith('#/admin')) render(); });
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
