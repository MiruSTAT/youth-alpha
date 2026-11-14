import { t, getLang, setLang } from './i18n.js?v=8';
import { api, MODE, ranked, today, eventState, bkkToday } from './data.js?v=8';
import { music } from './music.js?v=8';
import { art, burst, SPECIAL } from './art.js?v=8';
import { snow } from './snow.js?v=8';

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

function modal(title, inner, { okText = t('save'), extra = '' } = {}) {
  const dlg = $('#dlg'), form = $('#dlgForm');
  form.innerHTML = `<h3>${title}</h3>${inner}
    <div class="dlg-actions"><button class="btn" value="cancel" formnovalidate>${t('cancel')}</button>
    <button class="btn primary" value="ok">${okText}</button></div>
    ${extra ? `<div class="dlg-extra">${extra}</div>` : ''}`;
  form.querySelectorAll('[required]').forEach(i => i.closest('.field')?.querySelector('label')?.classList.add('req'));
  return new Promise((resolve) => {
    dlg.onclose = () => resolve(dlg.returnValue === 'ok' ? new FormData(form) : (dlg.returnValue || null));
    dlg.returnValue = ''; dlg.showModal();
  });
}
async function confirmBox(msg, okText = t('del')) {
  return (await modal('', `<p style="font-size:1.05rem">${esc(msg)}</p>`, { okText })) instanceof FormData;
}
async function leaderboard(force = false) {
  if (force || Date.now() - lbCache.at > 8000) lbCache = { at: Date.now(), rows: ranked(await api.leaderboard()) };
  return lbCache.rows;
}
const pageHead = (title, backTo = '#/admin') =>
  `<div class="page-head"><a class="back" href="${backTo}">‹ ${t('back')}</a><h1 class="page-title">${title}</h1></div>`;

// ------------------------------------------------------------- theme + event timing
const THEMES = [['night', 'linear-gradient(#2c4591,#1c2d66)'], ['snow', 'linear-gradient(#eef4fd,#d5e4f7)'], ['red', 'linear-gradient(#8a1c2c,#5a0f1c)'], ['forest', 'linear-gradient(#23664a,#123a29)']];
function applyTheme(k) {
  document.body.dataset.theme = k; try { localStorage.setItem('ya_theme', k); } catch {}
  snow.recolor();
}
document.body.dataset.theme = localStorage.getItem('ya_theme') || 'night';
let evCache = null;
async function eventInfo(force = false) {
  if (!evCache || force) evCache = await api.eventInfo().catch(() => ({ event_dow: 0, event_start: '10:00', event_end: '12:00' }));
  return evCache;
}
const fmtDur = (mins) => t('dur', Math.floor(mins / 1440), Math.floor((mins % 1440) / 60), mins % 60);
const hmMin = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
// minutes until feedback opens (end of the next/current activity)
const fbIn = (ev, st) => st.phase === 'live' ? st.mins : st.mins + (hmMin(ev.event_end) - hmMin(ev.event_start));

// ------------------------------------------------------------- top bar
function paintChrome() {
  $('#langBtn').textContent = getLang() === 'th' ? 'EN' : 'TH';
  $('#musicBtn').textContent = music.playing ? '🔊' : '🔇';
  $('#musicBtn').setAttribute('aria-label', music.playing ? t('musicOff') : t('musicOn'));
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
}
$('#langBtn').onclick = () => { setLang(getLang() === 'th' ? 'en' : 'th'); paintChrome(); render(); };
$('#musicBtn').onclick = (e) => { e.stopPropagation(); music.toggle(); paintChrome(); };
$('#schedBtn').onclick = () => openSchedule();
const firstTap = () => {
  if (music.wantsMusic() && !music.playing && !document.body.classList.contains('adult')) { music.start(); paintChrome(); }
  window.removeEventListener('pointerdown', firstTap);
};
window.addEventListener('pointerdown', firstTap);

async function ensureScene() {
  if (scene) { scene.refresh(); scene.start(); return scene; }
  try {
    const m = await import('./scene3d.js?v=8');
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

function evPill(ev) {
  const st = eventState(ev), when = `${t('dows')[ev.event_dow]} ${ev.event_start}`;
  if (st.phase === 'live') return `<button class="ev-pill live" data-ev="sched"><span class="i">🔔</span><span>${t('evLive', fmtDur(st.mins))}</span></button>`;
  if (st.phase === 'feedback') return `<button class="ev-pill feedback" data-ev="fb"><span class="i">💬</span><span>${t('evFeedback')}</span></button>`;
  return `<button class="ev-pill" data-ev="sched"><span class="i">⏰</span><span>${t('evWait', when, fmtDur(st.mins))}</span></button>`;
}
function wirePill(root) {
  root.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => b.dataset.ev === 'fb' ? openFeedback() : openSchedule());
}

// HOME = ranking, with "my card" on top (no separate "me" page)
async function kidRank() {
  setNav('rank');
  const [rows, ev] = await Promise.all([leaderboard(true), eventInfo(), pcats()]);
  const mineId = localStorage.getItem('ya_me'), me = rows.find(r => r.id === mineId);
  if (mineId && !me) localStorage.removeItem('ya_me');
  const max = Math.max(1, ...rows.map(r => r.total));
  scene?.setGlow(me ? me.total / max : 0.6);
  const medal = ['🥇', '🥈', '🥉'];
  view.innerHTML = `<section class="sheet">
    ${evPill(ev)}
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

// MENU: everything else in one simple list
async function kidMenu() {
  setNav('menu'); scene?.setGlow(0.6);
  const ev = await eventInfo(), st = eventState(ev);
  const dayTxt = `${t('dows')[ev.event_dow]} ${ev.event_end}`;
  const thName = t('th_' + (document.body.dataset.theme || 'night'));
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title" style="margin-bottom:16px">☰ ${t('menu')}</h1>
    <div class="mlist">
      <button class="mrow" data-m="sched"><span class="mi">📅</span><span class="mt"><b>${t('schedule')}</b><span>${t('dows')[ev.event_dow]} ${ev.event_start}–${ev.event_end}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="fb" ${st.phase === 'feedback' ? 'style="border:2px solid var(--gold)"' : ''}><span class="mi">💬</span><span class="mt"><b>${t('fb')}</b>
        <span>${st.phase === 'feedback' ? t('fbOpenSub') : t('fbClosedSub', dayTxt, fmtDur(fbIn(ev, st)))}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="theme"><span class="mi">🎨</span><span class="mt"><b>${t('theme')}</b></span><span class="mv">${thName} ›</span></button>
      <button class="mrow" data-m="lang"><span class="mi">🌐</span><span class="mt"><b>${t('language')}</b></span><span class="mv">${t('langName')}</span></button>
      <button class="mrow" data-m="music"><span class="mi">🎵</span><span class="mt"><b>${t('music')}</b></span><span class="mv">${music.playing ? t('on') : t('off')}</span></button>
      <button class="mrow" data-m="help"><span class="mi">❓</span><span class="mt"><b>${t('help')}</b><span>${t('helpSub')}</span></span><span class="mv">›</span></button>
      <a class="mrow quiet" href="#/admin"><span class="mi">🔒</span><span class="mt"><b>${t('adults')}</b><span>${t('adminSub')}</span></span><span class="mv">›</span></a>
    </div></section>`;
  const act = {
    sched: openSchedule, fb: openFeedback, theme: openThemes, help: () => showTour(TOUR),
    lang: () => { setLang(getLang() === 'th' ? 'en' : 'th'); paintChrome(); kidMenu(); },
    music: () => { music.toggle(); paintChrome(); kidMenu(); },
  };
  view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => act[b.dataset.m]());
}

function openThemes() {
  const cur = document.body.dataset.theme || 'night';
  const p = kidSheet(`<div class="panel-head"><h2>🎨 ${t('theme')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <div class="themes">${THEMES.map(([k, g]) => `<button class="sw ${k === cur ? 'on' : ''}" data-th="${k}"><div class="pv" style="background:${g}">🎄</div><span class="nm">${t('th_' + k)}</span></button>`).join('')}</div>`);
  p.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { applyTheme(b.dataset.th); openThemes(); kidMenu(); });
}

async function openFeedback() {
  const ev = await eventInfo(true), st = eventState(ev);
  const head = `<div class="panel-head"><h2>💬 ${t('fbTitle')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>`;
  const sentKey = 'ya_fb_' + bkkToday();
  if (st.phase !== 'feedback') {
    kidSheet(`${head}<p class="fb-done">⏰ ${t('fbClosed')}<br><span style="font-size:1rem;color:var(--text-d2)">${t('fbClosedSub', `${t('dows')[ev.event_dow]} ${ev.event_end}`, fmtDur(fbIn(ev, st)))}</span></p>`);
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
      p.innerHTML = `${head}<p class="fb-done">${t('fbThanks')}</p>`; music.ding(); scene?.burst(40);
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

async function openSchedule() {
  const p = kidSheet(`<div class="panel-head"><h2>📅 ${t('schedule')}</h2><button class="x" aria-label="${t('close')}">✕</button></div><p class="empty">${t('loading')}</p>`);
  try {
    const rows = await api.schedule(), td = today();
    const up = rows.filter(r => r.day >= td), past = rows.filter(r => r.day < td).slice(-3);
    const ev = (r, cls = '') => `<div class="ev ${cls} ${r.day === td ? 'today' : ''}"><div class="d"><b>${dayNum(r.day)}</b><span>${monShort(r.day)}</span></div>
      <div class="tx"><b>${esc(r.title)}</b><span>${r.day === td ? t('todayLbl') + ' · ' : ''}${fmtDay(r.day)}${r.time_text ? ' · ' + esc(r.time_text) : ''}</span>
      ${r.note ? `<span style="display:block">${esc(r.note)}</span>` : ''}</div></div>`;
    p.innerHTML = `<div class="panel-head"><h2>📅 ${t('schedule')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
      ${up.map(r => ev(r)).join('') || `<p class="empty">${t('noSchedule')}</p>`}
      ${past.length ? `<p class="section-label">${t('pastEvents')}</p>${past.reverse().map(r => ev(r, 'past')).join('')}` : ''}`;
  } catch (e) { fail(e); }
}

async function kidShop() {
  setNav('shop'); scene?.setGlow(0.7);
  const [{ cats, items }, rows] = await Promise.all([api.shop(), leaderboard()]);
  const me = rows.find(r => r.id === localStorage.getItem('ya_me'));
  const live = items.filter(i => i.active);
  const pairs = []; for (let i = 0; i < cats.length; i += 2) pairs.push(cats.slice(i, i + 2));
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title">🎁 ${t('shopTitle')}</h1><p class="sheet-sub">${t('shopSub')}</p>
    ${cats.length ? `<div class="stand">
      <div class="stand-sign">⭐ ${t('shop')} ⭐</div>
      <div class="awning"></div>
      <div class="shelves">${pairs.map(row => `<div class="shelf-row">${row.map(c => `<button class="slot" data-cat="${c.id}">
          ${art(c.icon)}<div class="plank"></div><span class="lbl">${esc(c.name)}</span><span class="hint">${t('tapCat')}</span></button>`).join('')}</div>`).join('')}</div>
      <div class="counter"></div></div>` : `<p class="empty">${t('emptyShop')}</p>`}
</section>`;
  view.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
    const c = cats.find(x => x.id === b.dataset.cat);
    b.classList.remove('popping'); void b.offsetWidth; b.classList.add('popping');
    burst(b.querySelector('.art'), c.effect, 12); music.ding();
    setTimeout(() => openCategory(c, live.filter(i => i.category_id === c.id), me), 650);
  });
}
function openCategory(c, list, me) {
  const p = kidSheet(`<div class="panel-head">${art(c.icon)}<h2>${esc(c.name)}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    ${list.length ? `<div class="prizes">${list.map(i => {
      return `<button class="prize" data-i="${i.id}">${art(i.icon)}<span class="nm">${esc(i.name)}</span><span class="tag">${i.price} ⭐</span></button>`;
    }).join('')}</div>` : `<p class="empty">${t('emptyCat')}</p>`}
`);
  p.querySelector('.panel-head .art').style.fontSize = '2rem';
  p.querySelectorAll('.prize').forEach(b => b.onclick = () => {
    b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    burst(b.querySelector('.art'), c.effect, 6);
  });
}

// ---- tutorial: arrow + text over a darkened screen
const TOUR = [
  { sel: '#schedBtn', key: 'tut_schedule' },
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
function maybeTour() {
  if (document.body.classList.contains('adult') || !$('#tour').hidden || !$('#kidSheet').hidden) return;
  let st; try { st = JSON.parse(localStorage.getItem('ya_tour') || 'null'); } catch { st = null; }
  const now = Date.now(), DAYS3 = 3 * 864e5;
  if (!st) { showTour(TOUR); st = { done: true, last: now, n: 0 }; }
  else if (now - st.last > DAYS3) { showTour([TOUR[st.n % TOUR.length]]); st.n++; st.last = now; }
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
  const pages = { attendance: pAttendance, attsum: pAttSummary, points: pPoints, history: pHistory, money: pMoney, kids: pKids, shop: pShop, schedule: pSchedule, pcats: pPcats, feedback: pFeedback, ...(adult.role === 'admin' ? { settings: pSettings } : {}) };
  if (!pages[page]) return adultHome();
  await pages[page]();
}

function adultHome() {
  const items = [['attendance', '✅'], ['points', '⭐'], ['feedback', '💬'], ['money', '💰'], ['kids', '👧'], ['pcats', '🏷️'], ['shop', '🎁'], ['schedule', '📅'], ...(adult.role === 'admin' ? [['settings', '⚙️']] : [])];
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/">‹ ${t('back')}</a><h1 class="page-title">${t('adultMenu')}</h1></div>
    <nav class="menu">${items.map(([k, i]) => `<a href="#/admin/${k}" data-k="${k}"><span class="mi">${i}</span>
      <span class="mt"><b>${t('tab_' + k)}</b><span>${t('m_' + k)}</span></span><span class="chev">›</span></a>`).join('')}</nav>
    <button class="btn wide" style="margin-top:20px" id="logout">${t('logout')}</button>
    ${MODE === 'preview' ? `<p class="preview-note">${t('previewNote')}</p>` : ''}`;
  $('#logout').onclick = async () => { await api.signOut(); location.hash = '#/admin'; render(); };
  // red indicators: things that still need filling in
  computeNeeds().then(n => Object.entries(n).forEach(([k, msg]) => {
    const a = view.querySelector(`.menu [data-k="${k}"]`); if (!a) return;
    a.querySelector('.mi').insertAdjacentHTML('beforeend', '<span class="dot"></span>');
    a.querySelector('.mt span').outerHTML = `<span class="need">${esc(msg)}</span>`;
  })).catch(console.error);
}
async function computeNeeds() {
  const n = {};
  const [kids, shop, sched, ev, fb] = await Promise.all([api.kids(), api.shop(), api.schedule(), eventInfo(true), api.feedback().catch(() => [])]);
  const active = kids.filter(k => k.active);
  if (!active.length) n.kids = t('need_kids');
  const live = shop.items.filter(i => i.active);
  if (!live.length) n.shop = t('need_shopEmpty');
  else { const empty = shop.cats.find(c => !live.some(i => i.category_id === c.id)); if (empty) n.shop = t('need_shopCat', empty.name); }
  if (!sched.some(r => r.day >= bkkToday())) n.schedule = t('need_sched');
  const st = eventState(ev), dow = new Date(Date.now() + 7 * 3600e3).getUTCDay();
  if (dow === Number(ev.event_dow) && st.phase !== 'wait' && active.length) {
    const round = await api.round(bkkToday());
    if (!round?.finished) n.attendance = t('need_att');
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
      <div class="att-list">${active.map(k => {
        const st = status[k.id], [cls, label] = st ? stateTxt[st] : ['c-wait', t('waiting')];
        return `<div class="att" data-n="${esc(k.nickname.toLowerCase())}">
          <div class="who"><span class="av">${esc(k.avatar)}</span><span class="nm">${esc(k.nickname)}</span>${st ? '' : `<span class="state ${cls}">${label}</span>`}</div>
          <div class="st">${['present', 'leave', 'absent'].map(s => `<button class="${s} ${st === s ? 'on' : ''}" data-k="${k.id}" data-s="${s}">${t(s)}</button>`).join('')}</div></div>`;
      }).join('') || `<p class="muted">${t('noKids')}</p>`}</div>
      ${active.length && !round?.finished ? `<div class="bottom-bar"><button class="btn primary" id="finish">✓ ${t('finishRound')}</button></div>` : ''}`;
    $('#day').onchange = (e) => { attDay = e.target.value || today(); pAttendance().catch(fail); };
    const q = $('#q'), filter = () => view.querySelectorAll('.att').forEach(r => r.hidden = !r.dataset.n.includes(q.value.trim().toLowerCase()));
    if (q) { q.oninput = filter; if (qv) filter(); }
    view.querySelectorAll('.st button').forEach(b => b.onclick = async () => {
      const k = b.dataset.k, s = b.dataset.s, prev = status[k], y = window.scrollY;
      if (prev === s) delete status[k]; else status[k] = s;      // tap again = back to "waiting"
      draw(); window.scrollTo(0, y);
      try { prev === s ? await api.clearAttendance(k, attDay) : await api.setAttendance(k, attDay, s); lbCache.at = 0; }
      catch (e) { if (prev) status[k] = prev; else delete status[k]; draw(); fail(e); }
    });
    const fin = $('#finish');
    if (fin) fin.onclick = async () => {
      if (await confirmBox(t('finishConfirm', waiting), t('finishRound'))) { await api.setRound(attDay, true); round = { finished: true }; draw(); toast(t('saved')); }
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
      <div class="amounts">${[5, 10, 20, 50, -5, -10].map(a => `<button class="opt ${a < 0 ? 'minus' : ''}" data-a="${a}">${signed(a)}</button>`).join('')}</div>
      <div class="field" style="margin-top:16px"><label>${t('customAmt')}</label>
        <div style="display:flex;gap:10px"><input class="input" id="custom" type="number" inputmode="numeric" min="-1000" max="1000"><button class="btn primary" id="customGo">${t('next')}</button></div></div>`;
    view.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { pw.detail = b.dataset.d; view.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); });
    const go = (a) => { if (!a || Math.abs(a) > 1000) return; pw.amount = a; pw.step = 3; pPoints(); };
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
    if (await confirmBox(t('confirmDel'))) { try { await api.deletePoint(b.dataset.del); lbCache.at = 0; pHistory(); } catch (e) { fail(e); } }
  });
}

// ---------------- Money: just record what each kid was paid
async function pMoney() {
  const [kids, money] = await Promise.all([api.kids(), api.money()]);
  const paid = (id) => money.filter(m => m.kid_id === id && m.kind === 'paid').reduce((a, m) => a + Number(m.amount), 0);
  let total = 0;
  const rows = kids.map(k => { const p = paid(k.id); total += p; return { k, p }; });
  view.innerHTML = `${pageHead(t('tab_money'))}
    <p class="muted" style="margin:-6px 0 12px">🔒 ${t('moneyHint')}</p>
    <div class="card"><div class="list">${rows.map(({ k, p }) => `<div class="li click" data-kid="${k.id}"><span class="av">${esc(k.avatar)}</span>
      <span class="grow">${esc(k.nickname)}</span><span class="amt">${fmtMoney(p)} ฿</span><span class="muted">›</span></div>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div></div>
    <div class="card"><div class="total-row"><span>${t('totalPaid')}</span><span>${fmtMoney(total)} ฿</span></div></div>`;
  view.querySelectorAll('[data-kid]').forEach(r => r.onclick = () => moneyKid(kids.find(k => k.id === r.dataset.kid), money));
}
async function moneyKid(kid, money) {
  const hist = money.filter(m => m.kid_id === kid.id && m.kind === 'paid');
  const p = modal(`${esc(kid.avatar)} ${esc(kid.nickname)}`, `
    <div class="field"><label>${t('amount')}</label>
      <div class="seg" style="margin-bottom:8px"><button type="button" class="btn" data-q="100">100 ฿</button><button type="button" class="btn" data-q="150">150 ฿</button></div>
      <input class="input" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>
    <div class="field"><label>${t('note')}</label><input class="input" name="note" maxlength="80"></div>
    ${hist.length ? `<p class="muted" style="margin:4px 0 0">${t('history')}</p><div class="list" style="max-height:180px;overflow:auto">${hist.map(m => `<div class="li"><span class="grow">${m.created_at.slice(0, 10)}${m.note ? `<span class="sub">${esc(m.note)}</span>` : ''}</span>
      <span class="amt">${fmtMoney(m.amount)} ฿</span><button class="btn small danger" value="del:${m.id}" formnovalidate>${t('undo')}</button></div>`).join('')}</div>` : ''}`);
  const form = $('#dlgForm');
  form.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { form.amount.value = b.dataset.q; });
  const r = await p;
  try {
    if (r instanceof FormData) { await api.addMoney({ kid_id: kid.id, kind: 'paid', amount: Number(r.get('amount')), note: r.get('note') || '' }); toast(t('saved')); }
    else if (typeof r === 'string' && r.startsWith('del:')) { if (await confirmBox(t('confirmDel'))) await api.deleteMoney(r.slice(4)); else return; }
    else return;
    pMoney();
  } catch (e) { fail(e); }
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
      if (!(await confirmBox(t('confirmDel')))) return;
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
  const { cats, items } = await api.shop();
  view.innerHTML = `${pageHead(t('tab_shop'))}
    <div class="row-actions" style="margin-bottom:12px"><button class="btn primary" id="addItem" ${cats.length ? '' : 'disabled'} style="flex:1">+ ${t('addItem')}</button><button class="btn" id="addCat" style="flex:1">+ ${t('addCategory')}</button></div>
    ${cats.map(c => `<div class="card cat-block"><div class="cat-head">${art(c.icon)}<b>${esc(c.name)}</b><button class="btn small" data-cat="${c.id}">${t('edit')}</button></div>
      <div class="list">${items.filter(i => i.category_id === c.id).map(i => `<div class="li click" data-item="${i.id}">${art(i.icon)}
        <span class="grow">${esc(i.name)}${i.active ? '' : `<span class="sub">${t('hidden')}</span>`}</span><span class="amt">${i.price} ⭐</span><span class="muted">›</span></div>`).join('') || `<p class="muted">${t('emptyCat')}</p>`}</div></div>`).join('')}`;
  $('#addCat').onclick = () => catForm(null);
  $('#addItem').onclick = () => itemForm(null, cats);
  view.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => catForm(cats.find(c => c.id === b.dataset.cat)));
  view.querySelectorAll('[data-item]').forEach(b => b.onclick = () => itemForm(items.find(i => i.id === b.dataset.item), cats));
}
async function catForm(c) {
  const p = modal(c ? t('edit') : t('addCategory'), `
    <div class="field"><label>${t('catName')}</label><input class="input" name="name" required maxlength="40" value="${esc(c?.name || '')}"></div>
    <div class="field"><label>${t('shelfIcon')}</label>${pickRow('icon', ICONS, c?.icon || '🎁')}</div>
    <div class="field"><label>${t('effectIcon')}</label>${pickRow('effect', EFFECTS, c?.effect || '✨')}</div>`,
    { extra: c ? `<button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  wirePickers($('#dlgForm'));
  const r = await p;
  try {
    if (r instanceof FormData) { await api.saveCategory({ ...(c ? { id: c.id } : {}), name: r.get('name').trim(), icon: r.get('icon'), effect: r.get('effect') }); toast(t('saved')); }
    else if (r === 'delete') { if (!(await confirmBox(t('delCatConfirm', c.name)))) return; await api.deleteCategory(c.id); }
    else return;
    pShop();
  } catch (e) { fail(e); }
}
async function itemForm(it, cats) {
  const p = modal(it ? t('edit') : t('addItem'), `
    <div class="field"><label>${t('itemName')}</label><input class="input" name="name" required maxlength="40" value="${esc(it?.name || '')}"></div>
    <div class="field"><label>${t('price')}</label><input class="input" name="price" type="number" inputmode="numeric" min="0" max="100000" required value="${it?.price ?? ''}"></div>
    <div class="field"><label>${t('category')}</label><select class="input" name="cat">${cats.map(c => `<option value="${c.id}" ${(it?.category_id || cats[0].id) === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div class="field"><label>${t('avatar')}</label>${pickRow('icon', ICONS, it?.icon || '🎁')}</div>`,
    { extra: it ? `<button class="btn small" value="toggle" formnovalidate>${it.active ? t('hidden') : t('show')}</button><button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  wirePickers($('#dlgForm'));
  const r = await p;
  try {
    if (r instanceof FormData) {
      await api.saveItem({ ...(it ? { id: it.id } : {}), name: r.get('name').trim(), price: Math.max(0, Math.trunc(Number(r.get('price')) || 0)), category_id: r.get('cat'), icon: r.get('icon') });
      toast(t('saved'));
    } else if (r === 'toggle') await api.saveItem({ id: it.id, active: !it.active });
    else if (r === 'delete') { if (!(await confirmBox(t('confirmDel')))) return; await api.deleteItem(it.id); }
    else return;
    pShop();
  } catch (e) { fail(e); }
}

// ---------------- Schedule editor
async function pSchedule() {
  const rows = await api.schedule(), td = today();
  view.innerHTML = `${pageHead(t('tab_schedule'))}
    <button class="btn primary wide" id="addEv" style="margin-bottom:12px">+ ${t('addEvent')}</button>
    <div class="card"><div class="list">${rows.map(r => `<div class="li click" data-ev="${r.id}" style="${r.day < td ? 'opacity:.5' : ''}">
      <span class="grow"><b>${esc(r.title)}</b><span class="sub">${fmtDay(r.day)}${r.time_text ? ' · ' + esc(r.time_text) : ''}</span></span><span class="muted">${t('edit')} ›</span></div>`).join('') || `<p class="muted">${t('noSchedule')}</p>`}</div></div>`;
  $('#addEv').onclick = () => evForm(null);
  view.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => evForm(rows.find(r => r.id === b.dataset.ev)));
}
async function evForm(ev) {
  const r = await modal(ev ? t('edit') : t('addEvent'), `
    <div class="field"><label>${t('evTitle')}</label><input class="input" name="title" required maxlength="80" value="${esc(ev?.title || '')}"></div>
    <div class="field"><label>${t('date')}</label><input class="input" name="day" type="date" required value="${ev?.day || today()}"></div>
    <div class="field"><label>${t('time')}</label><input class="input" name="time" maxlength="30" placeholder="13:00 – 15:00" value="${esc(ev?.time_text || '')}"></div>
    <div class="field"><label>${t('note')}</label><input class="input" name="note" maxlength="120" value="${esc(ev?.note || '')}"></div>`,
    { extra: ev ? `<button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  try {
    if (r instanceof FormData) { await api.saveSchedule({ ...(ev ? { id: ev.id } : {}), title: r.get('title').trim(), day: r.get('day'), time_text: r.get('time').trim(), note: r.get('note').trim() }); toast(t('saved')); }
    else if (r === 'delete') { if (!(await confirmBox(t('confirmDel')))) return; await api.deleteSchedule(ev.id); }
    else return;
    pSchedule();
  } catch (e) { fail(e); }
}

// ---------------- Kids' feedback
async function pFeedback() {
  const list = await api.feedback();
  const moods = { 4: '😄', 3: '🙂', 2: '😐', 1: '😢', 0: '💬' };
  view.innerHTML = `${pageHead(t('tab_feedback'))}
    <div class="card"><div class="list">${list.map(f => `<div class="li fb-item"><span class="mood-i">${moods[f.mood] || '💬'}</span>
      <span class="grow"><b>${f.kid_name ? esc(f.kid_name) : t('anon')}</b><span class="sub">${new Date(f.created_at).toLocaleString(getLang() === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      <span style="display:block;margin-top:4px">${esc(f.message)}</span></span>
      <button class="btn small danger" data-del="${f.id}">${t('del')}</button></div>`).join('') || `<p class="muted">${t('none')}</p>`}</div></div>`;
  if (list[0]) localStorage.setItem('ya_fb_seen', list[0].created_at);
  view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (await confirmBox(t('confirmDel'))) { try { await api.deleteFeedback(b.dataset.del); pFeedback(); } catch (e) { fail(e); } }
  });
}

// ---------------- Settings (admin)
async function pSettings() {
  const s = await api.settings();
  view.innerHTML = `${pageHead(t('tab_settings'))}
    <div class="card">
      <div class="field"><label>${t('eventDay')}</label><select class="input" id="dow">${t('dows').map((d, i) => `<option value="${i}" ${Number(s.event_dow ?? 0) === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="field"><label>${t('eventStart')}</label><input class="input" id="st" type="time" value="${esc(s.event_start || '10:00')}"></div>
      <div class="field"><label>${t('eventEnd')}</label><input class="input" id="en" type="time" value="${esc(s.event_end || '12:00')}"></div>
      <div class="field"><label>${t('attPoints')}</label><input class="input" id="ap" type="number" min="0" max="1000" value="${s.attendance_points}"></div>
      <button class="btn primary wide" id="saveSet">${t('save')}</button></div>`;
  $('#saveSet').onclick = async () => {
    const v = Math.max(0, Math.min(1000, Math.trunc(Number($('#ap').value) || 0)));
    const st = $('#st').value || '10:00', en = $('#en').value || '12:00';
    try { await api.saveSettings({ attendance_points: v, event_dow: Number($('#dow').value), event_start: st.slice(0, 5), event_end: en.slice(0, 5) }); evCache = null; toast(t('saved')); } catch (e) { fail(e); }
  };
}

// =============================================================== router
let renderSeq = 0;
async function render() {
  const seq = ++renderSeq, h = location.hash || '';
  const isAdult = h.startsWith('#/admin');
  document.body.classList.toggle('adult', isAdult);
  if (isAdult && music.playing) { music.stop(); localStorage.setItem('ya_music', 'on'); }
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
