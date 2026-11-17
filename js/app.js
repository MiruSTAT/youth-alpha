import { t, getLang, setLang, setOverrides, tBase } from './i18n.js?v=38';
import { api, MODE, DEMO, ranked, today, bkkToday, cached, net, program, P, linkFor, member } from './data.js?v=38';
import { VERSION, UPDATES, CHANGELOG, AREAS } from './version.js?v=38';
import { CHORD_TOKEN, isChordLine, ZERO_W, splitAtColumns, parseSong, songLangs, SHARPS, noteIdx, FLAT_KEYS, shiftNote, transposeChord, keyAfter, renderSong, measureCtx, SHEET_FONT, chordsIntoWords, splitSheet, ytId } from './songtext.js?v=38';

import { music } from './music.js?v=38';
import { art, burst, SPECIAL, pic, isImg, shrinkImage } from './art.js?v=38';
import { snow } from './snow.js?v=38';
import { track } from './track.js?v=38';
import { calmIcon } from './icons.js?v=38';
import { metro } from './metronome.js?v=38';
import { videoClock, cleanBeats, bpmOf, hashText, lowerBound } from './videosync.js?v=38';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVATARS = ['⛄', '🎅', '🦌', '🎄', '⭐', '🔔', '🎁', '🧸', '🐧', '🦊', '🐱', '🐶', '🐰', '🐼', '🦁', '🐯', '🐨', '🦄', '🐸', '🐵', '🐳', '🦋', '🎹', '🎤'];
// point categories come from the database (admins can edit them)
// kid pages keep the last answer on the phone (works with no internet); admin pages always read fresh
const kidSide = () => !location.hash.startsWith('#/admin');
const read = (key, fn) => kidSide() ? cached(P() + '_' + key, fn) : fn();
// keys kept on the phone that belong to one program (program 1 keeps its old names, so nothing is lost)
const pkey = (k) => P() === 1 ? k : `${k}_p${P()}`;
const ME = () => pkey('ya' + '_me');
// the category key without the program suffix (attendance_p2 -> attendance): the special categories keep their meaning
const baseKey = (k) => String(k || '').replace(/_p\d+$/, '');
const bal = (r) => Math.max(0, (r?.total || 0) - (r?.spent || 0));      // points left to spend on prizes
// ---- v31 member login (HANDOFF.md 5d). program.login: 'off' | 'personal' | 'all'.
// When it is on, "me" is the signed-in member's own kid (written into the same ME() key, so the old code and track.js keep working).
const loginOn = () => program.login === 'personal' || program.login === 'all';
const MTOK = () => pkey('ya_member');                                  // the member's sign-in token on this phone (per program)
let staffHere = false;                                                // an adult is signed in on this phone (sees everything)
let memberChecked = Date.now();                                       // last time the saved sign-in was checked with the server
let catCache = { at: 0, list: [] };
async function pcats(force = false) {
  if (force || Date.now() - catCache.at > 30000) catCache = { at: Date.now(), list: await read('pcats', () => api.pointCats()) };
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
function fail(e) { console.error(e); toast(/maintenance/i.test(String(e?.message || e)) ? t('mtBlocked') : t('errGeneric')); }

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
  if (force || Date.now() - lbCache.at > 8000) lbCache = { at: Date.now(), rows: ranked(await read('lb', () => api.leaderboard())) };
  return lbCache.rows;
}
const pageHead = (title, backTo = '#/admin') =>
  `<div class="page-head"><a class="back" href="${backTo}">‹ ${t('back')}</a><h1 class="page-title">${title}</h1></div>${subTabs()}`;
// v37: pages that share one menu item show small tabs under the title (e.g. Settings | Point categories | Music)
const TABSETS = [['admins', 'online'], ['about', 'ai'], ['settings', 'pcats', 'musicset', 'phone'], ['programs', 'look']];   // v38: + phone, look
function subTabs() {
  const [, , k, extra] = (location.hash || '').split('/');
  const set = !extra && TABSETS.find(x => x.includes(k)); if (!set) return '';
  const ok = set.filter(x => typeof pageOk === 'function' && pageOk(x)); if (ok.length < 2) return '';
  return `<nav class="subtabs">${ok.map(x => `<a href="#/admin/${x}" class="${x === k ? 'on' : ''}" data-k="${x}">${t('sub_' + x)}</a>`).join('')}</nav>`;
}

// ------------------------------------------------------------- theme + event timing
const THEMES = [['snow', 'linear-gradient(#eef4fd,#d5e4f7)'], ['night', 'linear-gradient(#2c4591,#1c2d66)'], ['red', 'linear-gradient(#8a1c2c,#5a0f1c)'], ['forest', 'linear-gradient(#23664a,#123a29)']];
function applyTheme(k) {
  document.body.dataset.theme = k; try { localStorage.setItem('ya_theme', k); } catch {}
  snow.recolor();
}
document.body.dataset.theme = localStorage.getItem('ya_theme') || 'snow';
let evCache = null;
async function eventInfo(force = false) {
  if (!evCache || force) evCache = await read('ev', () => api.eventInfo()).catch(() => ({ event_dow: 0, event_start: '10:00', event_end: '12:00' }));
  applyAppOpts();
  return evCache;
}
// music switches set by the admin (everything is on unless switched off)
// music switches, in groups (the same groups on the Music settings page and on each song's card)
const MUSIC_GROUPS = [
  ['mg_app', [['bgMusic', '🔔'], ['songsTab', '🎵'], ['festive', '🎄'], ['festiveSfx', '✨']]],
  ['mg_see', [['origSheet', '📄'], ['video', '▶️'], ['lyrics', '📝']]],
  ['mg_text', [['chords', '🎸'], ['transpose', '♯'], ['textSize', 'Aa'], ['langSwitch', '🌐']]],
  ['mg_tools', [['metro', '🥁'], ['beatDots', '🔴'], ['scroll', '⏬'], ['speed', '🐢']]],
  ['mg_sync', [['beatSync', '🔗'], ['lineSync', '🎤']]],
];
const PLAYER_GROUPS = MUSIC_GROUPS.slice(1);
const PLAYER_KEYS = PLAYER_GROUPS.flatMap(([, items]) => items.map(([k]) => k));
// "simple songs" (settings.music.simpleSongs, Music settings page): every song shows only its video and original sheet
const SIMPLE_KEEP = new Set(['video', 'origSheet']);
const simpleSongs = () => evCache?.music?.simpleSongs === true;
let songOpts = {};                                                  // switches for the open song (set by an admin per song)
const moApp = (k) => evCache?.music?.[k] !== false;
const mo = (k) => moApp(k) && (simpleSongs() && PLAYER_KEYS.includes(k) ? SIMPLE_KEEP.has(k) : songOpts[k] !== false);
function applyAppOpts() {
  document.body.classList.toggle('no-bgm', !mo('bgMusic') || !feat('music'));
  document.body.classList.toggle('no-songs', !mo('songsTab') || !feat('songs'));
  music.setAllowed(mo('bgMusic') && feat('music'));
  if (typeof paintChrome === 'function') paintChrome();
}

// ------------------------------------------------------------- top bar
function paintChrome() {
  $('#langBtn').textContent = getLang() === 'th' ? 'EN' : 'TH';
  $('#musicBtn').textContent = music.playing ? '🔊' : '🔇';
  $('#musicBtn').setAttribute('aria-label', music.playing ? t('musicOff') : t('musicOn'));
  $('#themeBtn').setAttribute('aria-label', t('themeBtn'));
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
}
$('#langBtn').onclick = () => { setLang(getLang() === 'th' ? 'en' : 'th'); paintChrome(); render(); };
$('#musicBtn').onclick = (e) => { e.stopPropagation(); music.toggle(); paintChrome(); track('music', music.playing ? 'on' : 'off'); };
const firstTap = () => {
  if (music.wantsMusic() && !music.playing) { music.start(); paintChrome(); }
  window.removeEventListener('pointerdown', firstTap);
};
window.addEventListener('pointerdown', firstTap);

async function ensureScene() {
  if (scene) { scene.refresh(); scene.start(); return scene; }
  try {
    const m = await import('./scene3d.js?v=38');
    if (m.initScene($('#scene'), { pack: part('scene') === 'cross' ? 'easter' : 'christmas' })) { scene = m; scene.start(); } else document.body.classList.add('no-webgl');
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

// tap a profile picture: see it big
function openPic(val, caption = '') {
  track('pic_view');
  const box = document.createElement('div');
  box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = `<div class="lb-inner">${isImg(val) ? `<img src="${esc(val)}" alt="${esc(caption)}">` : `<span class="lb-emoji">${esc(val)}</span>`}
    ${caption ? `<p class="lb-cap">${esc(caption)}</p>` : ''}</div><button class="lb-x" aria-label="${t('close')}">✕</button>`;
  const close = () => { box.remove(); document.removeEventListener('keydown', key); };
  const key = (e) => { if (e.key === 'Escape') close(); };
  box.onclick = close; document.addEventListener('keydown', key);
  document.body.appendChild(box);
}
function wirePics(root, rows) {
  root.querySelectorAll('[data-pic]').forEach(el => el.addEventListener('click', (e) => {
    e.stopPropagation(); const k = rows.find(r => r.id === el.dataset.pic); if (k) openPic(k.avatar, k.nickname);
  }));
}

// HOME = ranking, with "my card" on top (no separate "me" page)
async function kidRank() {
  setNav('rank');
  const [rows, , ev] = await Promise.all([leaderboard(true), pcats(true), eventInfo(true)]);
  const mineId = localStorage.getItem(ME()), me = rows.find(r => r.id === mineId);
  if (mineId && !me) localStorage.removeItem(ME());
  const max = Math.max(1, ...rows.map(r => r.total));
  scene?.setGlow(me ? me.total / max : 0.6);
  const medal = ['🥇', '🥈', '🥉'];
  const part = {
    notice: () => ev?.announce ? `<div class="notice"><span class="ni">📣</span><p>${esc(ev.announce)}</p></div>` : '',
    me: () => me ? `<button class="my-card" id="myCard"><span class="av" data-pic="${me.id}">${pic(me.avatar)}</span>
        <span class="who"><b>${esc(me.nickname)}</b><span>🏆 ${t('rank')} ${me.rank} ${t('of')} ${rows.length}</span>${me.spent ? `<span class="sp">🎁 ${t('canSpend')} ${bal(me)} ⭐</span>` : ''}</span>
        <span class="pts"><b id="tot">0</b><span>${t('points')}</span></span></button>`
      : loginOn() ? (member.me ? '' : `<a class="my-hint mem-hint" href="#/login">🔑 ${t('mLoginHint')}</a>`)
      : rows.length ? `<p class="my-hint">👇 ${t('tapYourName')}</p>` : '',
    rank: () => `<h1 class="sheet-title" style="margin-bottom:12px">🏆 ${t('ranking')}</h1>${ev?.show_visits || ev?.show_fb_count ? '<div class="home-count" id="homeCount" hidden></div>' : ''}
    ${rows.length ? `<div class="rank-list">${rows.map(k => `<button class="rank-row ${k.id === mineId ? 'mine' : ''}" data-id="${k.id}">
      <span class="n ${k.rank <= 3 ? 'medal' : ''}">${k.rank <= 3 ? medal[k.rank - 1] : k.rank}</span>
      <span class="av" data-pic="${k.id}">${pic(k.avatar)}</span><span class="nm">${esc(k.nickname)}</span><span class="pt">${k.total} ⭐</span></button>`).join('')}</div>`
      : `<p class="empty">${t('noKids')}</p>`}`,
    verse: () => ev?.verse_text ? verseCard(ev) : '',
  };
  view.innerHTML = `<section class="sheet">${layKeys('home').map(k => part[k]()).join('\n')}</section>`;   // v29: order set in the layout editor
  wirePics(view, rows);
  homeCount();
  view.querySelectorAll('.rank-row').forEach(b => b.onclick = () => { const k = rows.find(r => r.id === b.dataset.id); track('tap_kid', k?.id === localStorage.getItem(ME()) ? 'self' : 'other'); kidDetail(k, rows); });
  if (me) {
    $('#myCard').onclick = () => { track('tap_my_card'); kidDetail(me, rows); };
    // the total counts up from what this phone saw last time (no pop-up messages)
    const seenKey = `ya_seen_${me.id}`, seen = Number(localStorage.getItem(seenKey) ?? me.total);
    countUp($('#tot'), Math.min(seen, me.total), me.total);
    localStorage.setItem(seenKey, me.total);
  }
}

// v36 (roadmap step 6): "👀 1,234 visits · 💬 56 feedback" under the ranking title. Each number shows only when its
// switch is on (settings.show_visits / show_fb_count, admin Settings page); the server returns null for a switch that is off.
// Loaded after the page is drawn, so it never slows the ranking down; offline it uses the last numbers this phone saw.
async function homeCount() {
  const box = $('#homeCount'); if (!box) return;
  const c = await read('hc', () => api.homeCounts()).catch(() => null);
  if (!c || !box.isConnected) return;
  const fmt = (n) => Number(n).toLocaleString(getLang() === 'th' ? 'th-TH' : 'en-US');
  const items = [c.visits != null && `<span class="hc"><span class="hc-i">👀</span><b>${fmt(c.visits)}</b> ${t('hcVisits')}</span>`,
    c.feedback != null && `<span class="hc"><span class="hc-i">💬</span><b>${fmt(c.feedback)}</b> ${t('hcFeedback')}</span>`].filter(Boolean);
  if (!items.length) return;
  box.innerHTML = items.join(''); box.hidden = false; calmSoon();
}

const verseCard = (ev) => `<div class="verse"><span class="vl">📖 ${t('verseWeek')}</span><p>${esc(ev.verse_text)}</p>${ev.verse_ref ? `<b>${esc(ev.verse_ref)}</b>` : ''}</div>`;

// a kid's points by category (with details like piano / singing)
function kidDetail(k, rows) {
  const isMe = localStorage.getItem(ME()) === k.id;
  const cats = catCache.list.filter(c => c.active || k.skills[c.key]);
  // v31 "personal" login: only the signed-in kid (and adults) see the points per category
  const closed = program.login === 'personal' && !staffHere && k.id !== member.me?.kid_id;
  const meBtns = loginOn() ? (member.me ? '' : `<a class="kbtn" href="#/login">🔑 ${t('mLoginTitle')}</a>`)
    : isMe ? `<button class="text-btn" id="notMe">${t('notMe')}</button>` : `<button class="kbtn" id="thisMe">${t('thisIsMe')}</button>`;
  const p = kidSheet(`<div class="panel-head"><h2>${esc(k.nickname)}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <div class="kid-detail-head"><button class="av" data-pic="${k.id}" aria-label="${esc(k.nickname)}">${pic(k.avatar)}</button><b>${k.total} ⭐</b><span class="me-rank">🏆 ${t('rank')} ${k.rank} ${t('of')} ${rows.length}</span></div>
    ${k.spent ? `<div class="cat-pts" style="margin-bottom:14px"><span>🎁 ${t('canSpend')}</span><b>${bal(k)} ⭐</b></div>` : ''}
    ${closed ? `<p class="cat-info mem-note">🔒 ${t('mOnlyOwn')}</p>` : `<p class="section-label">${t('mySkills')}</p>
    <div class="skill-list">${cats.map(c => {
      const det = k.details?.[c.key];
      return `<button class="skill-row ${c.info ? 'has-info' : ''}" data-c="${c.key}"><span class="i">${pic(c.icon)}</span><span class="l">${esc(cName(c))}</span>
        <span class="v">${k.skills[c.key] || 0}</span><span class="chev">${c.info ? 'ⓘ' : ''}</span></button>`
        + (det ? `<div class="sub-rows">${Object.entries(det).map(([d, v]) => `<div><span>${esc(d)}</span><span>${v}</span></div>`).join('')}</div>` : '');
    }).join('')}</div>`}
    ${meBtns}`);
  wirePics(p, rows);
  p.querySelectorAll('.skill-row.has-info').forEach(b => b.onclick = () => { track('cat_info', b.dataset.c); catInfo(cOf(b.dataset.c), k.skills[b.dataset.c] || 0); });
  const close = () => { $('#kidSheet').hidden = true; kidRank(); };
  p.querySelector('#thisMe')?.addEventListener('click', () => { localStorage.setItem(ME(), k.id); track('set_me'); localStorage.setItem(`ya_seen_${k.id}`, k.total); close(); });
  p.querySelector('#notMe')?.addEventListener('click', () => { track('not_me'); localStorage.removeItem(ME()); close(); });
}

function catInfo(c, pts) {
  kidSheet(`<div class="panel-head"><span class="art" style="font-size:2rem">${pic(c.icon)}</span><h2>${esc(cName(c))}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
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
  track('bible_open');
  const link = (href, icon, title, sub) => `<a class="mrow" href="${href}" target="_blank" rel="noopener noreferrer"><span class="mi">${icon}</span><span class="mt"><b>${title}</b><span>${sub}</span></span><span class="mv">↗</span></a>`;
  kidSheet(`<div class="panel-head"><h2>📖 ${t('bible')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    ${evCache?.verse_text ? verseCard(evCache) : ''}
    <p class="cat-info" style="font-size:1rem">${t('bibleIntro')}</p>
    <div class="mlist">
      ${link('https://www.bible.com/th', '🌐', t('bibleRead'), 'bible.com (YouVersion)')}
      ${link('https://play.google.com/store/apps/details?id=com.sirma.mobile.bible.android', '🤖', t('bibleAndroid'), 'Google Play')}
      ${link('https://apps.apple.com/app/id282935706', '🍎', t('bibleIos'), 'App Store')}
    </div>`);
  $('#kidSheet').querySelectorAll('a.mrow').forEach((l, i) => l.addEventListener('click', () => { track('bible_link', ['web', 'android', 'ios'][i]); }));
}

// MENU: everything else in one simple list
async function kidMenu() {
  setNav('menu'); scene?.setGlow(0.6);
  const ev = await eventInfo(true);
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title" style="margin-bottom:16px">☰ ${t('menu')}</h1>
    <div class="mlist">
      ${loginOn() ? (member.me
        ? `<button class="mrow" data-m="account"><span class="mi">👤</span><span class="mt"><b>${t('mSignedAs', esc(member.me.display_name || member.me.username))}</b><span>${t('mAccountSub')}</span></span><span class="mv">›</span></button>`
        : `<button class="mrow" data-m="account"><span class="mi">🔑</span><span class="mt"><b>${t('mLoginTitle')}</b><span>${t('mLoginRowSub')}</span></span><span class="mv">›</span></button>`) : ''}
      ${feat('feedback') ? `<button class="mrow" data-m="fb"><span class="mi">💬</span><span class="mt"><b>${t('fb')}</b>
        <span>${ev.fb_open ? t('fbOpenSub') : t('fbClosedSub')}</span></span><span class="mv">›</span></button>` : ''}
      ${feat('bible') ? `<button class="mrow" data-m="bible"><span class="mi">📖</span><span class="mt"><b>${t('bible')}</b><span>${t('bibleSub')}</span></span><span class="mv">›</span></button>` : ''}
      <button class="mrow" data-m="credits"><span class="mi">🎵</span><span class="mt"><b>${t('songCredits')}</b><span>${t('songCreditsSub')}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="lang"><span class="mi">🌐</span><span class="mt"><b>${t('language')}</b></span><span class="mv">${t('langName')}</span></button>
      ${ev.install_on && !installed() ? `<button class="mrow" data-m="install"><span class="mi">📲</span><span class="mt"><b>${t('installApp')}</b><span>${t('installSub')}</span></span><span class="mv">›</span></button>` : ''}
      <button class="mrow" data-m="help"><span class="mi">❓</span><span class="mt"><b>${t('help')}</b><span>${t('helpSub')}</span></span><span class="mv">›</span></button>
      <a class="mrow quiet" data-k="adult" href="#/admin"><span class="mi">🔒</span><span class="mt"><b>${t('adults')}</b><span>${t('adminSub')}</span></span><span class="mv">›</span></a>
    </div></section>`;
  const act = {
    account: () => member.me ? accountSheet() : (location.hash = '#/login'),
    fb: () => openFeedback(), bible: openBible, install: installApp, credits: songCredits, help: () => { track('help_open'); showTour(TOUR); },
    lang: () => { setLang(getLang() === 'th' ? 'en' : 'th'); track('lang', getLang()); paintChrome(); kidMenu(); },
  };
  const ml = view.querySelector('.mlist'), keep = layKeys('menu');       // v29: menu order and hidden rows from the layout editor
  layKeys('menu', true).forEach(k => { const el = ml.querySelector(`[data-m="${k}"], [data-k="${k}"]`); if (el) keep.includes(k) ? ml.appendChild(el) : el.remove(); });
  view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => act[b.dataset.m]());
}

// ---- v31 member login: sign-in page, account sheet (change password, sign out). No pop-ups: messages are written on the page.
function clearKidCache() {                                             // saved answers of this program (they may hold a member's details)
  try { Object.keys(localStorage).filter(k => k.startsWith('ya_c_' + P() + '_')).forEach(k => localStorage.removeItem(k)); } catch {}
  lbCache = { at: 0, rows: [] }; catCache.at = 0; songCache.at = 0;
}
function syncMe() { if (loginOn()) member.me?.kid_id ? localStorage.setItem(ME(), member.me.kid_id) : localStorage.removeItem(ME()); }
function dropMember() {
  member.token = ''; member.me = null; api.memberUse?.('');
  localStorage.removeItem(MTOK()); localStorage.removeItem(MTOK() + '_me');
  if (loginOn()) localStorage.removeItem(ME());
  clearKidCache();
}
// at start (from loadProgram): read the login mode, then check the saved sign-in is still good
async function memberStart() {
  const pr = program.list.find(x => x.id === program.id);
  program.login = ['personal', 'all'].includes(pr?.login_mode) ? pr.login_mode : 'off';
  if (!loginOn()) return;
  const tok = localStorage.getItem(MTOK());
  if (tok) {
    member.token = tok; api.memberUse(tok);
    try { member.me = await api.memberMe(); if (member.me) localStorage.setItem(MTOK() + '_me', JSON.stringify(member.me)); else dropMember(); }
    catch (e) { console.error(e); try { member.me = JSON.parse(localStorage.getItem(MTOK() + '_me') || 'null'); } catch {} }   // no internet: keep the last sign-in
  }
  syncMe();
}
async function kidLogin() {
  setNav('');
  if (!loginOn()) { location.hash = '#/'; return; }
  if (member.me) { location.hash = '#/menu'; return; }
  const all = program.login === 'all';
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title">🔑 ${t('mLoginTitle')}</h1>
    <p class="sheet-sub">${t(all ? 'mLoginSubAll' : 'mLoginSub')}</p>
    <form id="mlf" class="k-form" novalidate>
      <label class="k-label">${t('username')}<input class="k-input" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30"></label>
      <label class="k-label">${t('password')}<input class="k-input" name="pw" type="password" autocomplete="current-password" maxlength="72"></label>
      <p class="k-msg" id="mlMsg" aria-live="polite"></p>
      <button class="kbtn" id="mlGo">${t('login')}</button>
    </form>
    <p class="k-small">${t('mForgot')}</p>
    ${all ? `<a class="mrow quiet" href="#/admin" style="margin-top:18px"><span class="mi">🔒</span><span class="mt"><b>${t('adults')}</b><span>${t('adminSub')}</span></span><span class="mv">›</span></a>`
      : `<a class="text-btn" href="#/">‹ ${t('back')}</a>`}</section>`;
  const f = $('#mlf'), msg = $('#mlMsg'), go = $('#mlGo');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const u = f.u.value.trim(), pw = f.pw.value;
    if (!u || !pw) { msg.textContent = t('mFillBoth'); return; }
    go.disabled = true; msg.textContent = t('mSigning');
    try {
      const r = await api.memberLogin(u, pw);
      if (!r?.ok) { msg.textContent = r?.reason === 'locked' ? t('mLocked', r.minutes || 15) : t('mWrong'); f.pw.value = ''; return; }
      member.token = r.token; member.me = { username: r.username, display_name: r.display_name, kid_id: r.kid_id };
      localStorage.setItem(MTOK(), r.token); localStorage.setItem(MTOK() + '_me', JSON.stringify(member.me));
      api.memberUse(r.token); clearKidCache(); syncMe();
      if (member.me.kid_id) localStorage.removeItem(`ya_seen_${member.me.kid_id}`);
      track('member_login');
      location.hash = '#/';
    } catch (err) { console.error(err); msg.textContent = t('mNoNet'); }
    finally { go.disabled = false; }
  };
}
function accountSheet() {
  const me = member.me; if (!me) return;
  const p = kidSheet(`<div class="panel-head"><h2>👤 ${esc(me.display_name || me.username)}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <p class="cat-info" style="font-size:1rem">${t('mUserLine', esc(me.username))}</p>
    <details class="k-pw"><summary>🔒 ${t('mChangePw')}</summary>
      <form id="mpf" class="k-form" novalidate>
        <label class="k-label">${t('mPwOld')}<input class="k-input" name="o" type="password" autocomplete="current-password" maxlength="72"></label>
        <label class="k-label">${t('mPwNew')}<input class="k-input" name="n" type="password" autocomplete="new-password" maxlength="72"></label>
        <label class="k-label">${t('mPwAgain')}<input class="k-input" name="a" type="password" autocomplete="new-password" maxlength="72"></label>
        <p class="k-msg" id="mpMsg" aria-live="polite"></p>
        <button class="kbtn" id="mpGo">${t('save')}</button></form></details>
    <button class="kbtn ghost" id="mOut">🚪 ${t('mLogout')}</button>`);
  const f = p.querySelector('#mpf'), msg = p.querySelector('#mpMsg');
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (f.n.value.length < 4) { msg.textContent = t('mPwShort'); return; }
    if (f.n.value !== f.a.value) { msg.textContent = t('mPwMatch'); return; }
    msg.textContent = t('mSigning');
    try {
      const r = await api.memberPassword(f.o.value, f.n.value);
      if (r?.ok) { msg.textContent = '✅ ' + t('mPwDone'); f.reset(); track('member_pw'); }
      else if (r?.reason === 'signin') { dropMember(); $('#kidSheet').hidden = true; location.hash = '#/login'; }
      else msg.textContent = r?.reason === 'short' ? t('mPwShort') : t('mPwWrong');
    } catch (err) { console.error(err); msg.textContent = t('mNoNet'); }
  };
  p.querySelector('#mOut').onclick = async () => {
    track('member_logout');
    try { await api.memberLogout(); } catch (e) { console.error(e); }
    dropMember(); $('#kidSheet').hidden = true;
    location.hash = program.login === 'all' ? '#/login' : '#/'; render();
  };
}

// ---- install as an app (Chrome on Android: real install; iPhone: Add to Home Screen steps).
// Shown only when the super admin switches it on (settings.install_on, off by default).
let installEv = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEv = e; });
window.addEventListener('appinstalled', () => { installEv = null; track('install', 'installed'); });
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
async function installApp() {
  if (installEv) {
    const ev = installEv; installEv = null;
    try { ev.prompt(); const { outcome } = await ev.userChoice; track('install', outcome); } catch { track('install', 'error'); }
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  track('install', ios ? 'ios steps' : 'steps');
  kidSheet(`<div class="panel-head"><h2>📲 ${t('installApp')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <ol class="steps">${(ios ? [t('insIos1'), t('insIos2'), t('insIos3')] : [t('insAnd1'), t('insAnd2'), t('insAnd3')]).map(x => `<li>${x}</li>`).join('')}</ol>
    <p class="muted-k">${t(ios ? 'insIosNote' : 'insAndNote')}</p>`);
}

// colour themes: the 🎨 button on the top bar
function openThemes() {
  const cur = document.body.dataset.theme || 'snow';
  const p = kidSheet(`<div class="panel-head"><h2>🎨 ${t('theme')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <div class="themes">${THEMES.map(([k, g]) => `<button class="sw ${k === cur ? 'on' : ''}" data-th="${k}"><div class="pv" style="background:${g}">🎄</div><span class="nm">${t('th_' + k)}</span></button>`).join('')}</div>`);
  p.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { applyTheme(b.dataset.th); track('theme', b.dataset.th); openThemes(); });
}
$('#themeBtn').onclick = () => { track('theme_open'); openThemes(); };

// ---- feedback: as a pop-up sheet (from the menu) or as its own page (from the QR code)
async function openFeedback() { track('fb_open'); feedbackForm(null); }
async function kidFeedbackPage() {
  setNav('');
  view.innerHTML = `<section class="sheet"><div id="fbPage"></div></section>`;
  await feedbackForm($('#fbPage'));
}
async function feedbackForm(pageEl) {
  const ev = await eventInfo(true);
  const homeBtn = `<a class="kbtn" href="#/" id="fbHome">🏠 ${t('goHome')}</a>`;
  const head = pageEl ? `<h1 class="sheet-title" style="margin-bottom:14px">💬 ${t('fbTitle')}</h1>`
    : `<div class="panel-head"><h2>💬 ${t('fbTitle')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>`;
  const show = (html) => { if (pageEl) { pageEl.innerHTML = html; return pageEl; } return kidSheet(html); };
  const sentKey = pkey('ya_fb_' + bkkToday());
  if (!ev.fb_open) { show(`${head}<p class="fb-done">🔒 ${t('fbClosed')}</p>${pageEl ? homeBtn : ''}`); return; }
  if (localStorage.getItem(sentKey)) { show(`${head}<p class="fb-done">${t('fbSentAlready')}</p>${pageEl ? homeBtn : ''}`); return; }
  const me = (await leaderboard()).find(r => r.id === localStorage.getItem(ME()));
  let mood = 0;
  const p = show(`${head}<p style="margin:0">${t('fbMood')}</p>
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
      track('fb_send', `mood ${mood}${useName ? ', named' : ', anonymous'}${pageEl ? ', qr page' : ''}`);
      await api.sendFeedback({ kid_id: useName ? me.id : null, kid_name: useName ? me.nickname : '', mood, message: msg.value.trim().slice(0, 500) });
      localStorage.setItem(sentKey, '1');
      p.innerHTML = `${head}<p class="fb-done big">${t('fbThanks')}</p>${pageEl ? homeBtn : ''}`;
      music.ding(); hearts(p.querySelector('.fb-done'), pageEl ? 5 : 3);
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

async function kidShop() {
  setNav('shop'); scene?.setGlow(0.7);
  const [{ items }, lb] = await Promise.all([cached(P() + '_shop', () => api.shop()), leaderboard()]);
  const me = lb.find(r => r.id === localStorage.getItem(ME()));
  const live = items.filter(i => i.active).sort((x, y) => x.price - y.price);
  const rows = []; for (let i = 0; i < live.length; i += 2) rows.push(live.slice(i, i + 2));
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title">🎁 ${t('shopTitle')}</h1>
    ${live.length ? `<p class="sheet-sub">${t('shopSub')}</p>
      ${me ? `<div class="cat-pts shop-bal"><span>🎁 ${t('canSpendOf', esc(me.nickname))}</span><b>${bal(me)} ⭐</b></div>` : ''}<div class="stand">
      <div class="stand-sign">⭐ ${t('shop')} ⭐</div>
      <div class="awning"></div>
      <div class="shelves">${rows.map(row => `<div class="shelf-row">${row.map(i => `<button class="slot" data-i="${i.id}">
          ${art(i.icon)}<div class="plank"></div><span class="lbl">${esc(i.name)}</span><span class="tag">${i.price} ⭐</span></button>`).join('')}</div>`).join('')}</div>
      <div class="counter"></div></div>` : `<p class="empty">${t('emptyShop')}</p>`}
</section>`;
  // tap a prize: it pops out of the shelf (chip bags spill chips, others sparkle)
  view.querySelectorAll('.slot').forEach(b => b.onclick = () => {
    const it = live.find(x => x.id === b.dataset.i);
    track('shop_tap', it?.name);
    b.classList.remove('popping'); void b.offsetWidth; b.classList.add('popping');
    burst(b.querySelector('.art'), it.icon === 'chipbag' ? 'chips' : '✨', 12); music.ding();
    setTimeout(() => zoomPrize(it, me), 380);                   // then show it big (small pictures are hard to see)
  });
}
// a prize, big: the picture, its name and price, and how many points this kid can still spend
function zoomPrize(it, me) {
  track('prize_zoom', it.name);
  const box = document.createElement('div');
  box.className = 'lightbox prize-zoom'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  const left = me ? bal(me) - it.price : null;
  box.innerHTML = `<div class="lb-inner pz">${art(it.icon, 'pz-art')}
    <p class="pz-name">${esc(it.name)}</p><p class="pz-price">${it.price} ⭐</p>
    ${me ? `<p class="pz-me">${left >= 0 ? t('pzEnough', esc(me.nickname)) : t('pzNeed', -left)}</p>` : ''}</div>
    <button class="lb-x" aria-label="${t('close')}">✕</button>`;
  const close = () => { box.remove(); document.removeEventListener('keydown', key); };
  const key = (e) => { if (e.key === 'Escape') close(); };
  box.onclick = close; document.addEventListener('keydown', key);
  document.body.appendChild(box);
}

// =============================================================== SONGS (the song text functions live in songtext.js)
let songCache = { at: 0, list: [] };
async function songList(force = false) {
  if (force || Date.now() - songCache.at > 30000) songCache = { at: Date.now(), list: await read('songs', () => api.songs()) };
  return songCache.list;
}

async function kidSongs() {
  setNav('songs'); scene?.setGlow(0.8);
  const list = (await songList(true)).filter(s => s.active);
  track('songs');
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title" style="margin-bottom:14px">🎵 ${t('songsTitle')}</h1>
    ${list.length ? `<div class="song-list">${list.map((s, i) => `<a class="song-card" href="#/songs/${s.id}">
      <span class="no">${i + 1}</span><span class="st"><b>${esc(s.title)}</b>${s.subtitle ? `<span>${esc(s.subtitle)}</span>` : ''}</span>
      <span class="meta">${s.song_key ? `<span class="kchip">${esc(s.song_key)}</span>` : ''}${ytId(s.youtube) ? '<span class="yt-dot" aria-hidden="true">▶</span>' : ''}</span></a>`).join('')}</div>`
      : `<p class="empty">${t('noSongs')}</p>`}
    <p class="off-note" id="offNote" hidden>✓ ${t('savedOffline')}</p></section>`;
  keepSongs(list);
}
// save every song-sheet picture on the phone (through the service worker), so songs open with no internet
async function keepSongs(list) {
  if (!navigator.serviceWorker?.controller || navigator.onLine === false) return;
  const urls = [...new Set(list.flatMap(s => Array.isArray(s.sheets) ? s.sheets : []))].filter(u => u && !/^data:/.test(u));
  const ok = await Promise.all(urls.map(u => fetch(u, /^https?:/.test(u) ? { mode: 'cors', credentials: 'omit' } : {}).then(r => r.ok, () => false)));
  const el = $('#offNote'); if (el && ok.every(Boolean)) el.hidden = false;
}

function songCredits() {
  track('credits');
  songList().then(list => {
    kidSheet(`<div class="panel-head"><h2>🎵 ${t('songCredits')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
      ${list.filter(s => s.active).map(s => `<div class="credit"><b>${esc(s.title)}</b>${s.subtitle ? ` <span class="muted-k">· ${esc(s.subtitle)}</span>` : ''}
        ${s.credits ? `<p>${esc(s.credits)}</p>` : ''}${ytId(s.youtube) ? `<a href="https://www.youtube.com/watch?v=${ytId(s.youtube)}" target="_blank" rel="noopener noreferrer">▶ YouTube ↗</a>` : ''}</div>`).join('') || `<p class="empty">${t('noSongs')}</p>`}
      <p class="credit-note">${t('creditsNote')}</p>`);
  }).catch(fail);
}

// ---- the song player
const SPEEDS = [0.5, 0.75, 1, 1.25];
const songPrefs = (() => { try { return JSON.parse(localStorage.getItem('ya_song') || '{}'); } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem('ya_song', JSON.stringify(songPrefs)); } catch {} };
let player = null;                  // the open song (stopped when leaving the page)
function stopPlayer() {
  if (!player) return;
  player.stop(); player = null; songOpts = {};
  document.body.classList.remove('song-page', 'no-dock'); $('#songDock')?.remove();
  music.hold(false);
}

async function kidSong(id) {
  const s = (await songList()).find(x => x.id === id) || (await songList(true)).find(x => x.id === id);
  if (!s) { location.hash = '#/songs'; return; }
  track('song_open', s.title);
  setNav('songs');
  document.body.classList.add('song-page'); music.hold(true); scene?.stop();
  document.querySelectorAll('.santa').forEach(x => x.remove());
  await eventInfo(true);
  songOpts = s.opts || {};
  const offline = navigator.onLine === false;                       // no internet: words, chords and sheets still work; the video cannot
  const parsed = parseSong(s.content), vid = mo('video') && !offline ? ytId(s.youtube) : '', sheets = mo('origSheet') && Array.isArray(s.sheets) ? s.sheets : [];
  const showLyrics = mo('lyrics');
  const langs = showLyrics && mo('langSwitch') ? songLangs(parsed) : new Set();
  // timings recorded by an admin for this video (beats) and these words (lines)
  const sync = s.sync && s.sync.video === vid ? s.sync : null;
  const beatMap = mo('beatSync') && sync?.beats?.length > 8 ? sync.beats : null;
  const lineMap = mo('lineSync') && sync?.lines?.length && sync.linesHash === hashText(s.content || '') ? [...sync.lines].sort((x, y) => x[0] - y[0]) : null;
  const st = { by: mo('transpose') ? songPrefs['t_' + s.id] || 0 : 0, chords: mo('chords') && songPrefs.chords !== false, fs: mo('textSize') ? songPrefs.fs || 1.25 : 1.25, speed: 1, metro: false, scroll: false,
    lang: langs.size > 1 ? (songPrefs.lang || 'all') : 'all' };
  const flats = () => FLAT_KEYS.has(keyAfter(s.song_key, st.by));
  view.innerHTML = `<section class="sheet song-sheet">
    <div class="song-head"><a class="back k" href="#/songs" aria-label="${t('back')}">‹</a>
      <div class="st"><h1>${esc(s.title)}</h1>${s.subtitle ? `<p>${esc(s.subtitle)}</p>` : ''}</div></div>
    <div class="song-meta">${s.song_key ? `<span class="chip key">${t('keyLbl')} <b id="keyNow">${esc(keyAfter(s.song_key, st.by))}</b></span>` : ''}
      <span class="chip"><span class="q">♩</span> = <b id="bpmNow">${s.bpm}</b></span><span class="chip">${s.beats}/4</span></div>
    ${vid ? `<div class="yt" id="yt"><button class="yt-poster" id="ytGo" style="background-image:url('https://i.ytimg.com/vi/${vid}/hqdefault.jpg')" aria-label="${t('listen')}">
      <span class="yt-play">▶</span><span class="yt-lbl">${t('listen')}</span></button></div>
      ${beatMap || lineMap ? `<p class="sync-note">🔗 ${t(lineMap ? 'syncedAll' : 'syncedBeat')}</p>` : ''}` : ''}
    ${offline && mo('video') && ytId(s.youtube) ? `<p class="sync-note" style="margin-top:0">📴 ${t('videoNeedsNet')}</p>` : ''}
    ${langs.size > 1 ? `<div class="lang-sw" role="tablist">${[['all', t('langAll')], ['th', 'ไทย'], ['en', 'English']].map(([k, l]) => `<button data-lg="${k}" class="${st.lang === k ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
    <div class="lyrics" id="lyrics" style="--fs:${st.fs}" ${showLyrics ? '' : 'hidden'}></div>
    ${sheets.length ? `<details class="orig" id="orig" open><summary><span class="ot">📄 ${t('origSheet')}</span><span class="orig-key" id="origKey" hidden></span><span class="chev">›</span></summary>
      <div class="sheets">${sheets.map((u, i) => `<button class="sheet-img" data-sh="${i}"><img src="${esc(u)}" alt="${t('sheetLbl')} ${i + 1}" loading="lazy"></button>`).join('')}</div></details>` : ''}
    ${s.credits ? `<p class="song-credit">🎵 ${t('credits')}: ${esc(s.credits)}</p>` : ''}
  </section>`;
  const dock = document.createElement('div');
  dock.id = 'songDock'; dock.className = 'song-dock';
  const hasAa = showLyrics && (mo('chords') || mo('transpose') || mo('textSize'));
  const btns = [mo('metro') && `<button id="dMetro" class="dk"><span>🥁</span><b>${t('metro')}</b></button>`,
    mo('scroll') && `<button id="dScroll" class="dk"><span>⏬</span><b>${t('scroll')}</b></button>`,
    mo('speed') && `<button id="dSpeed" class="dk"><span id="spdTxt">1×</span><b>${t('speed')}</b></button>`,
    hasAa && `<button id="dSet" class="dk"><span>Aa</span><b>${t('setShort')}</b></button>`].filter(Boolean);
  dock.innerHTML = `${mo('beatDots') ? `<div class="beats" id="beats"><span class="follow" id="followPill" hidden>🔗 ${t('withVideo')}</span>${Array.from({ length: s.beats }, () => '<i></i>').join('')}</div>` : ''}
    ${btns.length ? `<div class="dock-row" style="grid-template-columns:repeat(${btns.length},1fr)">${btns.join('')}</div>` : ''}`;
  if (btns.length || mo('beatDots')) document.body.appendChild(dock); else document.body.classList.add('no-dock');
  const lyr = $('#lyrics');
  let curLine = -1;
  const draw = () => {
    lyr.innerHTML = parsed.length ? renderSong(parsed, { by: st.by, flats: flats(), chords: st.chords, lang: st.lang }) : `<p class="empty">${t('noLyrics')}</p>`;
    lyr.style.setProperty('--fs', st.fs);
    const k = $('#keyNow'); if (k) k.textContent = keyAfter(s.song_key, st.by);
    const ok = $('#origKey'); if (ok) { ok.hidden = !st.by; ok.textContent = `${t('original')} ${s.song_key}`; }
    if (curLine >= 0) lyr.querySelector(`[data-li="${curLine}"]`)?.classList.add('here');
  };
  draw();
  view.querySelectorAll('[data-lg]').forEach(b => b.onclick = () => {
    st.lang = b.dataset.lg; songPrefs.lang = st.lang; savePrefs(); track('song_lang', st.lang);
    view.querySelectorAll('[data-lg]').forEach(x => x.classList.toggle('on', x === b)); draw();
  });
  $('#orig')?.addEventListener('toggle', (e) => { if (e.target.open) track('sheet_view', s.title); });

  // --- beat dots
  const dots = [...dock.querySelectorAll('#beats i')];   // (none when the beat dots are switched off)
  const showBeat = (b) => dots.forEach((d, i) => { d.classList.toggle('on', i === b); d.classList.toggle('one', i === b && b === 0); });
  metro.onBeat = showBeat;
  const bpmNow = () => Math.round(s.bpm * st.speed);
  let yt = null, clock = null, karaoke = 0;
  const linked = () => !!(clock && beatMap);              // beat follows the video
  const lyricLinked = () => !!(clock && lineMap);          // lines follow the video

  // --- auto-scroll (free): about 8 beats per lyric line, slower/faster with the speed button
  let raf = 0, lastT = 0, acc = 0, wake = null;
  const lineH = () => { const ls = lyr.querySelectorAll('.ln'); if (!ls.length) return 60; let h = 0; ls.forEach(l => h += l.offsetHeight); return h / ls.length; };
  const pxPerSec = () => parsed.length ? lineH() / (8 * 60 / bpmNow()) : Math.max(12, (document.documentElement.scrollHeight - innerHeight) / (150 / st.speed));
  const stepScroll = (now) => {
    if (!st.scroll) return;
    const dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
    if (!(lyricLinked() && clock.playing)) {                // when the video leads, the lines do the scrolling
      acc += pxPerSec() * dt;
      if (acc >= 1) { const d = Math.floor(acc); acc -= d; window.scrollBy(0, d); }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) { setScroll(false); return; }
    }
    raf = requestAnimationFrame(stepScroll);
  };
  const keepAwake = async () => {
    const need = st.scroll || st.metro || clock?.playing;
    try { if (need && !wake && navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); else if (!need && wake) { wake.release(); wake = null; } } catch {}
  };
  const setScroll = (on) => {
    st.scroll = on; $('#dScroll')?.classList.toggle('on', on);
    const ic = $('#dScroll span'); if (ic) ic.textContent = on ? '⏸' : '⏬';
    cancelAnimationFrame(raf); lastT = 0; acc = 0;
    if (on) raf = requestAnimationFrame(stepScroll);
    keepAwake();
  };
  const setMetro = (on) => {
    st.metro = on; $('#dMetro')?.classList.toggle('on', on);
    if (linked()) metro.setSound(on);
    else on ? metro.start(bpmNow(), s.beats) : metro.stop();
    keepAwake();
  };
  $('#dMetro')?.addEventListener('click', () => { setMetro(!st.metro); track('metro', (st.metro ? 'on' : 'off') + (linked() ? ' video' : '')); });
  $('#dScroll')?.addEventListener('click', () => { setScroll(!st.scroll); track('autoscroll', (st.scroll ? 'on' : 'off') + (lyricLinked() ? ' video' : '')); });
  $('#dSpeed')?.addEventListener('click', () => {
    st.speed = SPEEDS[(SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length];
    $('#spdTxt').textContent = st.speed + '×'; $('#bpmNow').textContent = bpmNow();
    if (!linked()) metro.setBpm(bpmNow());
    try { yt?.setPlaybackRate?.(st.speed); } catch {}
    track('song_speed', String(st.speed));
  });
  $('#dSet')?.addEventListener('click', () => songSettings(s, st, () => { draw(); songPrefs['t_' + s.id] = st.by; songPrefs.chords = st.chords; songPrefs.fs = st.fs; savePrefs(); }));
  // tap a lyric line: it moves up to the reading spot
  lyr.onclick = (e) => {
    const ln = e.target.closest('.ln'); if (!ln) return;
    lyr.querySelectorAll('.ln.here').forEach(x => x.classList.remove('here')); ln.classList.add('here');
    window.scrollTo({ top: scrollY + ln.getBoundingClientRect().top - innerHeight * 0.3, behavior: 'smooth' });
  };
  view.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => openPic(sheets[b.dataset.sh], s.title));

  // --- karaoke: the line being sung lights up (and the page follows it while ⏬ is on)
  const followLines = () => {
    if (!clock?.playing) return;
    const v = clock.now() + 0.12, i = lowerBound(lineMap, v, (e) => e[0]) - 1, li = i >= 0 ? lineMap[i][1] : -1;
    if (li === curLine) return;
    curLine = li;
    lyr.querySelectorAll('.ln.here').forEach(x => x.classList.remove('here'));
    const el = lyr.querySelector(`[data-li="${li}"]`);
    if (!el) return;
    el.classList.add('here');
    if (st.scroll) window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * 0.3, behavior: 'smooth' });
  };

  // --- the official video (loads only when tapped); beat, lines and speed follow it
  $('#ytGo')?.addEventListener('click', async () => {
    track('yt_play', s.title);
    const box = $('#yt'); box.innerHTML = '<div id="ytFrame"></div>';
    try {
      const YT = await loadYT();
      yt = new YT.Player('ytFrame', {
        host: 'https://www.youtube-nocookie.com', videoId: vid,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, start: s.yt_start || 0 },
        events: {
          onReady: (e) => {
            e.target.setPlaybackRate(st.speed); e.target.playVideo();
            clock = videoClock(e.target);
            if (beatMap) { metro.follow({ clock, beats: beatMap, perBar: s.beats, offset: sync.offset || 0, sound: st.metro, onBeat: showBeat }); const fp = $('#followPill'); if (fp) fp.hidden = false; }
            if (lineMap) { karaoke = setInterval(followLines, 80); if (!st.scroll && mo('scroll')) setScroll(true); }
          },
          onStateChange: () => keepAwake(),
          onError: () => ytFallback(box, vid),
        },
      });
    } catch { ytFallback(box, vid); }
  });
  player = { stop: () => { setScroll(false); metro.stop(); clearInterval(karaoke); clock?.stop(); try { yt?.destroy?.(); } catch {} metro.onBeat = null; wake?.release?.(); } };
}
function ytFallback(box, vid) {
  box.innerHTML = `<a class="kbtn" href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener noreferrer">▶ ${t('openYt')} ↗</a>`;
}
let ytP = null;
function loadYT() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return ytP ??= new Promise((res, rej) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); res(window.YT); };
    const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.onerror = () => { ytP = null; rej(); };
    document.head.appendChild(sc);
    setTimeout(() => { if (!window.YT?.Player) { ytP = null; rej(); } }, 12000);
  });
}
function songSettings(s, st, apply) {
  const p = kidSheet(`<div class="panel-head"><h2>Aa ${t('songSettings')}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    ${mo('textSize') ? `<div class="set-row"><span>${t('textSize')}</span><div class="stepper"><button data-fs="-1" aria-label="−">A−</button><b id="fsNow">${Math.round(st.fs * 100)}%</b><button data-fs="1" aria-label="+">A+</button></div></div>` : ''}
    ${mo('chords') ? `<div class="set-row"><span>${t('showChords')}</span><button class="switch ${st.chords ? 'on' : ''}" id="chSw" role="switch" aria-checked="${st.chords}"><span></span></button></div>` : ''}
    ${s.song_key && mo('transpose') ? `<div class="set-row"><span>${t('transpose')}</span><div class="stepper"><button data-tr="-1" aria-label="♭">♭</button><b id="trNow">${esc(keyAfter(s.song_key, st.by))}</b><button data-tr="1" aria-label="♯">♯</button></div></div>
    <button class="text-btn" id="trReset" ${st.by ? '' : 'hidden'}>${t('original')}: ${esc(s.song_key)}</button>` : ''}`);
  const upd = () => {
    const fn = p.querySelector('#fsNow'); if (fn) fn.textContent = Math.round(st.fs * 100) + '%';
    const tr = p.querySelector('#trNow'); if (tr) tr.textContent = keyAfter(s.song_key, st.by);
    const rs = p.querySelector('#trReset'); if (rs) rs.hidden = !st.by;
    apply();
  };
  p.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => { st.fs = Math.max(0.9, Math.min(2, Math.round((st.fs + Number(b.dataset.fs) * 0.1) * 100) / 100)); upd(); });
  p.querySelector('#chSw')?.addEventListener('click', (e) => { st.chords = !st.chords; e.currentTarget.classList.toggle('on', st.chords); e.currentTarget.setAttribute('aria-checked', String(st.chords)); upd(); });
  p.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => { st.by = ((st.by + Number(b.dataset.tr) + 17) % 12) - 5; track('transpose', String(st.by)); upd(); });
  p.querySelector('#trReset')?.addEventListener('click', () => { st.by = 0; upd(); });
}

// ---- tutorial: arrow + text over a darkened screen
const TOUR = [
  { sel: '.kid-nav [data-nav="rank"]', key: 'tut_rank2' },
  { sel: '.kid-nav [data-nav="songs"]', key: 'tut_songs' },
  { sel: '.kid-nav [data-nav="shop"]', key: 'tut_shop' },
  { sel: '.kid-nav [data-nav="menu"]', key: 'tut_menu' },
  { sel: '#themeBtn', key: 'tut_theme' },
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
    box.querySelector('.go').onclick = () => { track(i < steps.length - 1 ? 'tour_next' : 'tour_done', steps[i].key); i++; i < steps.length ? place() : end(); };
    box.querySelector('.sk')?.addEventListener('click', () => { track('tour_skip', steps[i].key); end(); });
  }
  box.hidden = false; place(); window.addEventListener('resize', place);
}
// full tour on the first visit; afterwards one tip every few days
async function maybeTour() {
  if (document.body.classList.contains('adult') || document.body.classList.contains('maint') || document.body.classList.contains('song-page') || location.hash === '#/feedback' || !$('#tour').hidden || !$('#kidSheet').hidden) return;
  const every = Number((await eventInfo()).tip_days ?? 3);
  let st; try { st = JSON.parse(localStorage.getItem('ya_tour') || 'null'); } catch { st = null; }
  const now = Date.now(), GAP = every * 864e5;
  if (!st) { showTour(TOUR); st = { done: true, last: now, n: 0 }; }
  else if (every > 0 && now - st.last > GAP) { showTour([TOUR[st.n % TOUR.length]]); st.n++; st.last = now; }
  else return;
  try { localStorage.setItem('ya_tour', JSON.stringify(st)); } catch {}
}

// =============================================================== little extras for kids
// Santa peeks in from the edge of the screen now and then (tap him for presents!)
function santaSoon(first = false) { setTimeout(santaPeek, (first ? 25 + Math.random() * 20 : 60 + Math.random() * 70) * 1000); }
function santaPeek() {
  const b = document.body;
  const busy = !feat('santa') || b.classList.contains('adult') || b.classList.contains('song-page') || location.hash === '#/feedback' || document.hidden || !$('#kidSheet').hidden || !$('#tour').hidden
    || $('.cutscene') || $('.santa') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!busy) {
    const side = ['left', 'right', 'bottom'][Math.floor(Math.random() * 3)];
    const el = document.createElement('button');
    el.className = `santa from-${side}`; el.setAttribute('aria-label', packInfo().label);
    el.innerHTML = `<span class="s-bubble">${t('santaHo')}</span><span class="s-face">${packInfo().mascot}</span>`;
    if (side === 'bottom') el.style.left = (15 + Math.random() * 60) + '%'; else el.style.top = (28 + Math.random() * 40) + '%';
    el.onclick = (e) => { e.stopPropagation(); track('santa_tap'); burst(el, packInfo().gift, 12); music.ding(); el.classList.add('tapped'); };
    b.appendChild(el);
    setTimeout(() => el.remove(), 4600);
  }
  santaSoon();
}

// Special mode: tap the tree 5 times quickly
let festive = false, tapTimes = [];
function treeTapped() {
  const now = Date.now();
  tapTimes = tapTimes.filter(x => now - x < 2500); tapTimes.push(now);
  if (tapTimes.length < 5 || document.body.classList.contains('adult') || (!festive && (!mo('festive') || !feat('festive')))) return;
  tapTimes = [];
  festive ? endFestive() : startFestive();
}
function startFestive() {
  festive = true; track('festive', 'on');
  scene?.celebrate?.();
  music.setTrack('joy'); if (music.wantsMusic() && !music.playing) music.start(); paintChrome();
  // the cutscene: a golden flash, presents flying everywhere, a title
  const cv = $('#scene').getBoundingClientRect(), cx = cv.left + cv.width / 2, cy = cv.top + cv.height * 0.55;
  const box = document.createElement('div'); box.className = 'cutscene';
  const things = packInfo().things;
  box.innerHTML = `<div class="flash" style="--x:${cx}px;--y:${cy}px"></div><div class="joy-title">✨ ${t('joyTitle')} ✨</div>` +
    Array.from({ length: 20 }, (_, i) => {
      const a = Math.random() * Math.PI * 2, d = 0.45 + Math.random() * 0.75, dx = Math.cos(a) * innerWidth * d, dy = Math.sin(a) * innerHeight * d * 0.9;
      return `<span class="gift" style="left:${cx}px;top:${cy}px;--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--s:${(0.8 + Math.random() * 0.9).toFixed(2)};animation-delay:${(i * 34)}ms">${things[i % things.length]}</span>`;
    }).join('');
  document.body.appendChild(box);
  setTimeout(() => document.body.classList.add('festive'), 1400);
  setTimeout(() => box.remove(), 4200);
  if (part('special') === 'eggs') setTimeout(() => { if (festive) eggHunt(); }, 2600);
}
// v30 Easter special mode: eggs hidden around the screen; tap to find them all (a quiet counter, no pop-ups)
function eggHunt() {
  document.querySelector('.egg-hunt')?.remove();
  const N = 8, layer = document.createElement('div'); layer.className = 'egg-hunt';
  const cols = ['#ff9ec7', '#9ed8ff', '#fff08a', '#b9f5a8', '#d2b4ff', '#ffc79e'];
  layer.innerHTML = `<div class="egg-count" aria-live="polite">🥚 <b>0</b>/${N}</div>` + Array.from({ length: N }, (_, i) => {
    const x = 6 + Math.random() * 82, y = 14 + Math.random() * 62, r = Math.round(Math.random() * 50 - 25);
    return `<button class="egg" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--r:${r}deg;--c:${cols[i % cols.length]}" aria-label="${t('eggFind')}"></button>`;
  }).join('');
  document.body.appendChild(layer);
  let found = 0;
  layer.querySelectorAll('.egg').forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    if (b.classList.contains('found')) return;
    b.classList.add('found'); b.textContent = '🐣'; found++;
    layer.querySelector('.egg-count b').textContent = found;
    burst(b, '✨', 8); music.ding();
    if (found === N) {
      layer.querySelector('.egg-count').innerHTML = `🎉 ${t('eggAll')}`;
      track('egg_hunt', 'all');
      setTimeout(() => layer.classList.add('done'), 2600); setTimeout(() => layer.remove(), 3400);
    }
  });
}
function endFestive() {
  festive = false; track('festive', 'off');
  document.body.classList.remove('festive');
  document.querySelector('.egg-hunt')?.remove();
  scene?.calm?.(); music.setTrack('jingle');
}
// in special mode every tap makes a magic sound (kids only)
document.addEventListener('click', (e) => {
  if (!festive || document.body.classList.contains('adult') || !mo('festiveSfx')) return;
  if (e.target.closest('button, a, [role="button"], .rank-row, .slot')) music.sfx();
}, true);

// =============================================================== ADULT SIDE
// v32 (HANDOFF.md 5e): admins have a permission checklist per program; the super admin can do everything.
let adult = { role: null, myId: null, access: null };
const PERMS = ['points', 'kids', 'songs', 'shop', 'feedback', 'notice', 'settings'];
const isSuper = () => adult.role === 'superadmin';
const myPerms = (pid = program.id) => isSuper() ? PERMS : (adult.access?.programs?.[String(pid)] || []);
const can = (perm) => !perm || isSuper() || myPerms().includes(perm);
const isAdm = () => can('settings');
// every admin page and the permission it needs (null = anyone who may open this program; 'super' = super admin only)
const PAGES = {
  attendance: ['points', () => pAttendance()], attsum: ['points', () => pAttSummary()], points: ['points', () => pPoints()], history: ['points', () => pHistory()],
  kids: ['kids', () => pKids()], members: ['kids', () => pMembers()], notice: ['notice', () => pNotice()],
  shop: ['shop', () => pShop()], redeem: ['shop', (x) => pRedeem(x)], pcats: ['settings', () => pPcats()],
  songs: ['songs', () => pSongs()], song: ['songs', (x) => pSongEdit(x)], sync: ['songs', (x) => pSync(x)],
  feedback: ['feedback', () => pFeedback()], musicset: ['settings', () => pMusicSet()], settings: ['settings', () => pSettings()], phone: ['settings', () => pPhone()],
  weekly: [null, () => pWeekly()], export: [null, () => pExport()], about: [null, () => pAbout()],
  admins: ['super', async (x) => x ? (await saMod()).pAdminEdit(saCtx(), x) : (await saMod()).pAdmins(saCtx())],
  programs: ['super', async () => (await saMod()).pPrograms(saCtx())], look: ['super', async () => (await saMod()).pLook(saCtx())],
  online: ['super', async () => (await saMod()).pOnline(saCtx())], ai: ['super', async () => (await saMod()).pAi(saCtx())],
  data: ['super', async () => (await import('./datatools.js?v=38')).pData(dtCtx())],   // v38 roadmap step 8
};
const pageOk = (k) => { const need = PAGES[k]?.[0]; return need === 'super' ? isSuper() : can(need); };
// helpers handed to the super admin module (js/superadmin.js), so it does not keep its own copies
const saCtx = () => ({ view, $, t, esc, toast, fail, pageHead, api, render, confirmBox, VERSION, getLang, program, linkFor, modal, evReset: () => { evCache = null; }, tBase, applyLook, LOOK, layKeys, partOf, logoOf, uploadImage: async (f) => api.uploadImage(await shrinkImage(f, 512), 'logos'),
  PERMS, dTime, adult, renderSeq: () => renderSeq, phoneFrame, paintMaintBar });
const saMod = () => import('./superadmin.js?v=38');
// v38: helpers for the data tools page (js/datatools.js)
const dtCtx = () => ({ view, $, t, esc, toast, fail, pageHead, api, program, leaderboard, pcats, cName, bkkToday, loadXLSX, isSuper });

// "who is online" for the super admin: a ping when an admin page opens and about every 45 s while one stays open
let pingAt = 0, pingPage = '';
function adminPing(page) {
  pingPage = page || 'home';
  if (Date.now() - pingAt < 8000) return;
  pingAt = Date.now(); api.adminPing?.(pingPage).catch(() => {});
}
setInterval(() => { if (location.hash.startsWith('#/admin') && adult.access && document.visibilityState === 'visible') { pingAt = 0; adminPing(pingPage); } }, 45000);

async function adultGate(page) {
  const session = await api.session();
  if (!session) { adult.access = null; setSide(null); return loginView(); }
  adult.role = await api.myRole(); adult.myId = await api.myId();
  adult.access = null;
  if (maintOn() && !['superadmin', 'superlocked', 'superclaim'].includes(adult.role)) return maintView();   // v37
  if (['pending', 'noaccess', 'superlocked', 'superclaim'].includes(adult.role)) setSide(null);
  if (adult.role === 'pending') return pendingView();
  if (adult.role === 'noaccess') return noAccessView();
  if (adult.role === 'superlocked' || adult.role === 'superclaim') return (await saMod()).superGate(saCtx(), adult.role);
  try { adult.access = await api.myAccess(); } catch (e) { console.error(e); adult.access = { all: false, programs: {} }; }
  if (!isSuper() && !myPerms().length) { setSide(null); return otherProgramView(); }
  if (page === 'super') { history.replaceState(null, '', '#/admin'); page = ''; }   // the old super admin page is part of the admin panel now
  adminPing(PAGES[page] ? page : 'home');
  const ok = PAGES[page] && pageOk(page);
  setSide(ok ? (SIDE_OF[page] || page) : 'home');
  if (!ok) return adultHome();
  await PAGES[page][1](location.hash.split('/')[3]);
  if (findNext) setTimeout(flashFind, 350);                       // v38: came here from the settings search
}

// v33: the admin menu groups (admin home on phones, side menu on PC); only pages this admin may open
// v38: five simple groups that fold open and shut; pages that share one menu item are tabs (TABSETS)
function adminGroups() {
  return [
    ['g_daily', [['attendance', '✅'], ['points', '⭐'], ['redeem', '🎟️'], ['weekly', '📊']]],
    ['g_people', [['kids', '👧'], ['members', '🔑'], ['admins', '👥']]],
    ['g_content', [['songs', '🎵'], ['notice', '📣'], ['shop', '🎁'], ['feedback', '💬']]],
    ['g_program', [['programs', '📁'], ['settings', '⚙️']]],
    ['g_data', [['export', '📥'], ['data', '🧮'], ['about', 'ℹ️']]],
  ].map(([g, items]) => [g, items.filter(([k]) => pageOk(k))]).filter(([, items]) => items.length);
}
// which groups are open (remembered on this device); the group of the page that is open is always open
const GRP_KEY = 'ya_menu_open';
function grpOpen() { try { const v = JSON.parse(localStorage.getItem(GRP_KEY)); return Array.isArray(v) ? v : ['g_daily']; } catch { return ['g_daily']; } }
function grpRemember(root) {
  root.querySelectorAll('details[data-g]').forEach(d => d.addEventListener('toggle', () => {
    const open = new Set(grpOpen()); d.open ? open.add(d.dataset.g) : open.delete(d.dataset.g);
    try { localStorage.setItem(GRP_KEY, JSON.stringify([...open])); } catch {}
  }));
}
// ---------- v38: settings search (top of the side menu on PC, top of the admin home on phones)
// Each entry = [page, text key]; the words are searched in Thai AND English, so either language finds it.
const FIND_ITEMS = [
  ['settings', 'secPoints'], ['settings', 'attPoints'], ['settings', 'secTips'], ['settings', 'tipDays'], ['settings', 'secHomeCount'], ['settings', 'swVisits'], ['settings', 'swFbCount'],
  ['musicset', 'simpleSongs'], ['musicset', 'ms_player'], ['musicset', 'mg_app'], ['pcats', 'tab_pcats'], ['phone', 'tab_phone'],
  ['look', 'installApp'], ['look', 'clogDetailT'], ['look', 'lookTitle'], ['look', 'layTitle'], ['look', 'lookName'], ['look', 'lookEmoji'], ['look', 'lookLogo'],
  ['look', 'lookFont'], ['look', 'lookSize'], ['look', 'lookMode'], ['look', 'lookPack'], ['look', 'lookParts'],
  ['programs', 'progNew'], ['programs', 'mtLabel'], ['online', 'tab_online'], ['ai', 'tab_ai'], ['attsum', 'attSummary'], ['history', 'seeHistory'],
  ['export', 'exportAll'], ['export', 'logsGrp'], ['export', 'clearKidLog'],
  ['data', 'dtSqlFile'], ['data', 'dtCsv'], ['data', 'dtBox'], ['data', 'dtInsights'],
];
const fold = (x) => String(x || '').toLowerCase().replace(/[\p{Extended_Pictographic}\u{FE0F}]/gu, '').trim();
function findIndex() {
  const out = [];
  adminGroups().forEach(([, items]) => items.forEach(([k, i]) => out.push({ page: k, key: 'tab_' + k, icon: i, words: ['th', 'en'].map(l => fold(tBase('tab_' + k, l)) + ' ' + fold(tBase('m_' + k, l))).join(' ') + ' ' + k })));
  FIND_ITEMS.forEach(([page, key]) => {
    if (!pageOk(page)) return;
    const th = tBase(key, 'th'), en = tBase(key, 'en'); if (!th || th === key) return;
    out.push({ page, key, words: fold(th) + ' ' + fold(en) });
  });
  return out;
}
const findBox = (id) => `<div class="msearch"><input class="input" type="search" id="${id}" autocomplete="off" placeholder="🔍 ${t('findPh')}" aria-label="${t('findPh')}"><div class="msearch-res" hidden></div></div>`;
let findNext = '';
function bindFind(root) {
  const inp = root.querySelector('.msearch input'); if (!inp) return;
  const res = inp.nextElementSibling;
  const parentName = (pg) => { const set = TABSETS.find(x => x.includes(pg)); return t('tab_' + (SIDE_OF[pg] || (set ? set[0] : pg))); };
  const show = () => {
    const q = fold(inp.value); if (!q) { res.hidden = true; res.innerHTML = ''; return; }
    const parts = q.split(/\s+/);
    const hits = findIndex().filter(x => parts.every(w => x.words.includes(w))).slice(0, 8);
    res.hidden = false;
    res.innerHTML = hits.length ? hits.map((x, n) => `<button type="button" class="msearch-hit" data-n="${n}"><b>${esc(fold(t(x.key)) ? t(x.key).replace(/^[\p{Extended_Pictographic}\u{FE0F}\s]+/u, '') : x.page)}</b>${x.key.startsWith('tab_') ? '' : `<span>${esc(parentName(x.page))}</span>`}</button>`).join('')
      : `<p class="muted msearch-none">${t('findNone')}</p>`;
    res.querySelectorAll('.msearch-hit').forEach(btn => btn.onclick = () => {
      const x = hits[+btn.dataset.n]; findNext = x.key.startsWith('tab_') ? '' : t(x.key);
      inp.value = ''; res.hidden = true;
      if (location.hash === '#/admin/' + x.page) { render(); } else location.hash = '#/admin/' + x.page;
    });
  };
  inp.addEventListener('input', show);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); res.querySelector('.msearch-hit')?.click(); } if (e.key === 'Escape') { inp.value = ''; show(); } });
}
// after a search hit opens a page: scroll to the setting and light it up for a moment
function flashFind() {
  const want = fold(findNext); findNext = ''; if (!want) return;
  const el = [...view.querySelectorAll('h2, h3, summary, label, .tg-t b, b, button, .grp')].find(e => fold(e.textContent).includes(want));
  if (!el) return;
  const d = el.closest('details'); if (d && !d.open) d.open = true;
  const box = el.closest('.tg-row, .field, .card, details') || el;
  box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  box.classList.add('find-flash'); setTimeout(() => box.classList.remove('find-flash'), 2600);
}
// ---------- v33: PC side menu for the admin area (shown by CSS only on screens 1024 px and wider; phones keep the home menu)
const SIDE_OF = { attsum: 'attendance', history: 'points', song: 'songs', sync: 'songs', online: 'admins', ai: 'about', pcats: 'settings', musicset: 'settings', phone: 'settings', look: 'programs' };   // sub-pages light up their parent
function setSide(page) {                    // page = the admin page that is open ('home' = admin home), null = no side menu
  const box = $('#adminSide'), on = page !== null;
  document.body.classList.toggle('has-side', on); box.hidden = !on;
  if (!on) { box.innerHTML = ''; return; }
  const open = grpOpen();
  box.innerHTML = `<div class="side-prog">${progPicker('sideProg')}</div>${findBox('sideFind')}
    <a class="side-link ${page === 'home' ? 'on' : ''}" data-k="home" href="#/admin"><span class="mi">🏠</span><span>${t('adultMenu')}</span></a>
    ${adminGroups().map(([g, items]) => `<details class="side-det" data-g="${g}" ${open.includes(g) || items.some(([k]) => k === page) ? 'open' : ''}><summary class="side-grp">${t(g)}</summary>${items.map(([k, i]) =>
      `<a class="side-link ${k === page ? 'on' : ''}" data-k="${k}" href="#/admin/${k}"><span class="mi">${i}</span><span>${t('tab_' + k)}</span></a>`).join('')}</details>`).join('')}
    <a class="side-link quiet" href="#/"><span class="mi">‹</span><span>${t('sideKids')}</span></a>`;
  grpRemember(box); bindFind(box);
  bindPicker(box);
  calmAll();
}

// ---------- v33 Normal mode: line icons instead of emoji icons, and no emoji in front of titles, buttons and labels.
// Runs right after any change on screen (MutationObserver = before the screen is drawn, so no emoji flashes).
// Kid avatars (.av) and emoji that stand alone (avatar pickers, points ⭐ after a number) are never touched.
const EMO = /^(\s*)((?:[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}][️‍\u{1F3FB}-\u{1F3FF}\p{Extended_Pictographic}]*\s*)+)(?=\S)/u;
const calmOn = () => document.body.dataset.mode === 'normal';
function calmNode(root) {
  root.querySelectorAll('.mi, .kid-nav a > span, .hc-i').forEach(el => {
    const f = el.firstChild; if (f?.nodeType !== 3) return;
    const svg = calmIcon(f.textContent); if (!svg) return;
    el.dataset.emo = f.textContent; f.replaceWith(document.createRange().createContextualFragment(svg));
  });
  root.querySelectorAll('h1, h2, h3, summary, label, .btn, .grp, .mt b, .side-super, a.back, th, .my-hint, .hint').forEach(el => {
    if (el.closest('.av')) return;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode()) && !n.textContent.trim());
    const m = n?.textContent.match(EMO); if (m) n.textContent = m[1] + n.textContent.slice(m[0].length);
  });
}
const CALM_ROOTS = ['#view', '#adminSide', '#dlg', '#kidSheet', '#kidNav'];
function calmAll() { if (calmOn()) CALM_ROOTS.forEach(s => { const el = $(s); if (el) calmNode(el); }); }
function calmNav() {                        // called by applyLook: switch the tab icons both ways
  if (calmOn()) return calmAll();
  document.querySelectorAll('[data-emo]').forEach(el => { const svg = el.querySelector('svg.ico'); if (svg) svg.replaceWith(el.dataset.emo); delete el.dataset.emo; });
}
const calmSoon = () => queueMicrotask(calmAll);
{ const mo = new MutationObserver(() => { if (calmOn()) calmAll(); });
  CALM_ROOTS.forEach(s => { const el = $(s); if (el) mo.observe(el, { childList: true, subtree: true }); }); }

// v37: one place for "which program + who am I": the top of the PC side menu, and one slim line on the phone's admin home.
// The program picker is the super admin's: normal admins only ever see the program of their own link.
function progPicker(id) {
  const live = program.list.filter(x => !x.archived || x.id === program.id);
  const who = isSuper() ? `<span class="side-super">👑 ${t('saBadge')}</span>` : '';
  const pick = isSuper() && live.length > 1
    ? `<select class="input prog-pick" id="${id}" aria-label="${t('progNow')}">${live.map(x => `<option value="${esc(x.slug)}" ${x.id === program.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`
    : `<b class="prog-name">📁 ${esc(program.name)}</b>`;
  return `${who}${pick}`;
}
function bindPicker(root) {
  // switching program = opening that program's own link (a full reload, so no data from the old program stays on screen)
  root.querySelectorAll('.prog-pick').forEach(ps => { ps.onchange = () => { location.href = linkFor(ps.value) + '#/admin'; }; });
}
function adultHome() {
  const groups = adminGroups(), open = grpOpen();
  view.innerHTML = `
    <div class="page-head"><a class="back" href="#/">‹ ${t('back')}</a><h1 class="page-title">${t('adultMenu')}</h1>
      <button class="btn small head-btn" id="copyLink" title="${t('copyUserLinkSub')}">🔗 ${t('copyUserLink')}</button></div>
    <div class="adm-top" id="admTop">${progPicker('progSel')}${isSuper() ? '<span class="sa-until" id="saUntil"></span>' : ''}</div>
    ${findBox('homeFind')}
    ${groups.map(([g, items]) => `<details class="mgrp" data-g="${g}" ${open.includes(g) ? 'open' : ''}><summary><span class="mgrp-t">${t(g)}</span><span class="mgrp-n">${items.map(([k]) => t('tab_' + k)).join(' · ')}</span></summary>
      <nav class="menu grouped">${items.map(([k, i]) => `<a href="#/admin/${k}" data-k="${k}"><span class="mi">${i}</span>
      <span class="mt"><b>${t('tab_' + k)}</b><span>${t('m_' + k, VERSION)}</span></span><span class="chev">›</span></a>`).join('')}</nav></details>`).join('')}
    <button class="btn wide" style="margin-top:24px" id="logout">${t('logout')}</button>
    ${MODE === 'preview' ? `<p class="preview-note">${t('previewNote')}</p>` : ''}`;
  // v37: one sign-out button; for the super admin it also ends the super admin powers on this device (with a warning)
  $('#logout').onclick = async () => {
    if (isSuper()) return (await saMod()).superSignOut(saCtx());
    await api.signOut(); location.hash = '#/admin'; render();
  };
  $('#copyLink').onclick = () => copyText(linkFor(program.slug), t('userLinkCopied'));
  bindPicker($('#admTop')); grpRemember(view); bindFind(view);
  if (isSuper()) saMod().then(m => { m.superUntil(saCtx(), $('#saUntil')); m.onlineCount(saCtx(), view.querySelector('.menu [data-k="admins"]')); }).catch(console.error);
  // red indicators: things that still need filling in
  const seq = renderSeq;
  computeNeeds().then(n => {
    if (seq !== renderSeq) return;                              // page changed meanwhile
    Object.keys(n).forEach(k => {
      const el = view.querySelector(`.menu [data-k="${k}"]`); if (!el || el.classList.contains('alert')) return;
      el.classList.add('alert'); el.closest('details')?.classList.add('has-alert');   // v38: a dot on a folded group too
      el.querySelector('.mi').insertAdjacentHTML('beforeend', '<span class="dot"></span>');
      el.querySelector('.mt span').outerHTML = `<span class="need">${esc(n[k])}</span>`;
    });
  }).catch(console.error);
}
async function copyText(txt, okMsg) {
  try { await navigator.clipboard.writeText(txt); toast('✓ ' + okMsg); }
  catch { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('✓ ' + okMsg); } catch { toast(txt); } ta.remove(); }
}
async function computeNeeds() {
  const n = {};
  const [kids, shop, fb] = await Promise.all([api.kids(), can('shop') ? api.shop() : { items: [1] }, can('feedback') ? api.feedback().catch(() => []) : []]);
  const active = kids.filter(k => k.active);
  if (!active.length && can('kids')) n.kids = t('need_kids');
  const live = shop.items.filter(i => i === 1 || i.active);
  if (!live.length) n.shop = t('need_shopEmpty');
  if (active.length && can('points')) {
    const [rowsToday, round] = await Promise.all([api.attendance(today()), api.round(today())]);
    if (rowsToday.length && !round?.finished) n.attendance = t('need_att');
  }
  const ev = await eventInfo(true);
  if (!fb.some(f => f.created_at > (localStorage.getItem(pkey('ya_fb_seen')) || ''))) {
    const s = view.querySelector('.menu [data-k="feedback"] .mt span'); if (s) s.textContent = ev.fb_open ? t('fbStatusOn') : t('fbStatusOff');
  }
  const seen = localStorage.getItem(pkey('ya_fb_seen')) || '';
  const nNew = fb.filter(f => f.created_at > seen).length;
  if (nNew) n.feedback = t('newCount', nNew);
  return n;
}

function loginView() {
  view.innerHTML = `${pageHead('🔒 ' + t('adults'), '#/')}
    <form id="lf" class="card">
      <div class="field"><label>${t('username')}</label><input class="input" name="email" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false"></div>
      <div class="field"><label>${t('password')}</label><input class="input" name="pw" type="password" required minlength="4" autocomplete="current-password"></div>
      <button class="btn primary wide" value="in">${t('login')}</button>
    </form>`;
  $('#lf').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), which = e.submitter?.value;
    try {
      if (which === 'up') { await api.signUp(fd.get('email'), fd.get('pw')); toast(t('checkEmail')); }
      else {
        // usernames like "admin" map to an internal login email
        const raw = String(fd.get('email')).trim(), u = raw.toLowerCase();
        try { await api.signIn(u.includes('@') ? u : `${u}@youth-alpha.app`, fd.get('pw')); }
        catch (err) {
          // not a normal admin: maybe the super admin (password here, then a sign-in link by email)
          if (u.includes('@') || !(await (await saMod()).startFromLogin(saCtx(), raw, fd.get('pw')))) throw err;
        }
      }
    } catch (err) { console.error(err); toast(which === 'up' ? (err.message || t('errGeneric')) : t('errLogin')); }
  };
}

function pendingView() {
  view.innerHTML = `${pageHead(t('adults'), '#/')}
    <div class="card"><p>⏳ ${t('pendingMsg2')}</p></div>
    <button class="btn wide" id="lo">${t('logout')}</button>`;
  $('#lo').onclick = async () => { await api.signOut(); render(); };
}
// v32: switched off by the super admin, or no program yet
function noAccessView() {
  view.innerHTML = `${pageHead(t('adults'), '#/')}
    <div class="card"><p>🔒 ${t('noAccessMsg')}</p></div>
    <button class="btn wide" id="lo">${t('logout')}</button>`;
  $('#lo').onclick = async () => { await api.signOut(); render(); };
}
// v32: this link opens a program the admin has no access to: show the links of the programs they do have
function otherProgramView() {
  const mine = program.list.filter(p => (adult.access?.programs?.[String(p.id)] || []).length);
  view.innerHTML = `${pageHead(t('adults'), '#/')}
    <div class="card"><p>🔒 ${t('otherProgMsg', esc(program.name))}</p>
      ${mine.length ? `<p class="muted" style="margin:10px 0 6px">${t('otherProgYours')}</p><nav class="menu grouped">${mine.map(p => `<a href="${esc(linkFor(p.slug))}#/admin"><span class="mi">📁</span><span class="mt"><b>${esc(p.name)}</b></span><span class="chev">›</span></a>`).join('')}</nav>` : ''}</div>
    <button class="btn wide" id="lo">${t('logout')}</button>`;
  $('#lo').onclick = async () => { await api.signOut(); render(); };
}

// ---------------- v31 member accounts (admins). Never deleted: an account is switched off instead.
const dTime = (iso) => iso ? new Date(iso).toLocaleString(getLang() === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–';
async function pMembers() {
  const [list, kids] = await Promise.all([api.memberList(), api.kids()]);
  const mode = program.login || 'off';
  view.innerHTML = `${pageHead('🔑 ' + t('tab_members'))}
    ${isSuper() ? `<div class="card super-card" id="loginCard"></div>` : ''}
    <div class="card"><p style="margin:0"><b>${t('memMode')}: ${t('lm_' + mode)}</b></p><p class="muted" style="margin:6px 0 0">${t('lm_' + mode + '_sub')}</p>
      ${mode === 'off' ? `<p class="hint" style="margin-top:8px">${t('memOffHint')}</p>` : ''}</div>
    <button class="btn primary wide" id="memAdd" style="margin-bottom:12px">➕ ${t('memAdd')}</button>
    <div class="card"><p class="muted" style="margin:0 0 4px">${t('memCount', list.length)}</p><div class="list">${list.map(m => `<div class="li click mem-li ${m.active ? '' : 'off'}" data-id="${m.id}">
      <span class="av">${m.active ? (m.locked ? '⏳' : '👤') : '⛔'}</span>
      <span class="grow"><b>${esc(m.display_name || m.username)}</b><span class="sub">@${esc(m.username)} · ${m.kid_name ? '⭐ ' + esc(m.kid_name) : t('memNoKid')}${!m.active ? ' · ' + t('memIsOff') : m.locked ? ' · ' + t('memLockedNow') : ''}</span>
        <span class="sub">${t('memLast')}: ${dTime(m.last_login)}</span></span><span class="muted">${t('edit')} ›</span></div>`).join('') || `<p class="muted">${t('memNone')}</p>`}</div></div>`;
  if (isSuper()) saMod().then(m => m.drawLogin(saCtx())).catch(console.error);   // v32: the login mode chooser lives here now (super admin only)
  $('#memAdd').onclick = () => memberForm(null, kids);
  view.querySelectorAll('.mem-li').forEach(b => b.onclick = () => memberForm(list.find(m => m.id === b.dataset.id), kids));
}
async function memberForm(m, kids) {
  const kidOpts = `<option value="">${t('memNoKid')}</option>` + kids.filter(k => k.active || k.id === m?.kid_id).map(k => `<option value="${k.id}" ${k.id === m?.kid_id ? 'selected' : ''}>${esc(k.nickname)}</option>`).join('');
  const r = await modal(m ? t('memEdit') : t('memAdd'), `
    <div class="field"><label>${t('username')}</label><input class="input" name="username" required maxlength="30" autocapitalize="none" spellcheck="false" value="${esc(m?.username || '')}">
      <p class="hint">${t('memUserHint')}</p></div>
    <div class="field"><label>${t('memDisplay')}</label><input class="input" name="display_name" maxlength="40" value="${esc(m?.display_name || '')}"></div>
    <div class="field"><label>${t('memKid')}</label><select class="input" name="kid_id">${kidOpts}</select><p class="hint">${t('memKidHint')}</p></div>
    <div class="field"><label>${m ? t('memNewPw') : t('password')}</label><input class="input" name="password" type="text" ${m ? '' : 'required'} minlength="4" maxlength="72" autocomplete="off" spellcheck="false">
      <p class="hint">${m ? t('memPwKeep') : t('memPwHint')}</p></div>`,
    { extra: m ? `<button class="btn small ${m.active ? 'danger' : ''}" value="toggle" formnovalidate>${m.active ? '⛔ ' + t('memOff') : '✅ ' + t('memOn')}</button>` : '' });
  try {
    if (r instanceof FormData) {
      const d = { id: m?.id, username: String(r.get('username')).trim().toLowerCase(), display_name: String(r.get('display_name')).trim(), kid_id: r.get('kid_id') || null,
        active: m ? m.active : true, password: String(r.get('password') || '') || null };
      if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(d.username)) { toast(t('memUserHint')); return memberForm(m, kids); }
      if (d.password && d.password.length < 4) { toast(t('mPwShort')); return memberForm(m, kids); }
      await api.memberSave(d); toast(t('saved'));
    } else if (r === 'toggle') {
      const name = m.display_name || m.username;
      if (m.active && !(await confirmBox(t('memOffWarn', name), t('memOff')))) return;
      await api.memberSave({ ...m, active: !m.active, password: null });
      toast(m.active ? t('memIsOff') : t('memOn'));
    } else return;
    pMembers();
  } catch (e) {
    const s = String(e?.message || e);
    if (/duplicate|unique/i.test(s)) { toast(t('memDup')); return; }
    fail(e);
  }
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
        if (multi) return `<button class="opt att-pick ${pick.has(k.id) ? 'on' : ''}" data-p="${k.id}" data-n="${esc(k.nickname.toLowerCase())}"><span class="i">${pic(k.avatar)}</span>
          <span class="t">${esc(k.nickname)}<span class="opt-sub ${cls}">${label}</span></span><span class="check">${pick.has(k.id) ? '✓' : ''}</span></button>`;
        return `<div class="att" data-n="${esc(k.nickname.toLowerCase())}">
          <div class="who"><span class="av">${pic(k.avatar)}</span><span class="nm">${esc(k.nickname)}</span>${st ? '' : `<span class="state ${cls}">${label}</span>`}</div>
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
      <div class="options">${cats.filter(c => c.active && baseKey(c.key) !== 'attendance').map(c => `<button class="opt" data-s="${c.key}"><span class="i">${pic(c.icon)}</span>
        <span class="t">${esc(cName(c))}${c.info ? `<span class="opt-sub">${esc(c.info)}</span>` : ''}</span><span class="chev">›</span></button>`).join('')}</div>
      <a class="btn wide" style="margin-top:20px" href="#/admin/history">${t('seeHistory')}</a>`;
    view.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { pw.skill = b.dataset.s; pw.detail = ''; pw.step = 2; pPoints(); });
  } else if (pw.step === 2) {
    const dets = (cOf(pw.skill).details || '').split('\n').filter(Boolean);
    view.innerHTML = `${head}
      ${dets.length ? `<p class="muted" style="margin:0 0 8px">${t('pickDetail')}</p><div class="dchips">${['', ...dets].map(d => `<button class="dchip ${pw.detail === d ? 'on' : ''}" data-d="${esc(d)}">${d ? esc(d) : t('noDetail')}</button>`).join('')}</div>` : ''}
      <h2 style="margin-bottom:12px">${pic(cOf(pw.skill).icon)} ${t('s2')}</h2>
      <div class="amounts">${(baseKey(pw.skill) === 'bonus' ? [5, 10, 20, 50] : [5, 10, 20, 50, -5, -10]).map(a => `<button class="opt ${a < 0 ? 'minus' : ''}" data-a="${a}">${signed(a)}</button>`).join('')}</div>
      <div class="field" style="margin-top:16px"><label>${t('customAmt')}</label>
        <div style="display:flex;gap:10px"><input class="input" id="custom" type="number" inputmode="numeric" min="-1000" max="1000"><button class="btn primary" id="customGo">${t('next')}</button></div></div>`;
    view.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { pw.detail = b.dataset.d; view.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); });
    const go = (a) => { if (!a || Math.abs(a) > 1000) return; if (baseKey(pw.skill) === 'bonus' && a < 0) { toast(t('bonusPositive')); return; } pw.amount = a; pw.step = 3; pPoints(); };
    view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => go(Number(b.dataset.a)));
    $('#customGo').onclick = () => go(Math.trunc(Number($('#custom').value)));
  } else {
    const kids = (await api.kids()).filter(k => k.active);
    const draw = () => {
      const n = pw.sel.size;
      view.innerHTML = `${head}<h2 style="margin-bottom:12px">${t('s3')}</h2>
        <div class="list-tools"><span class="muted">${pic(cOf(pw.skill).icon)} ${esc(cName(cOf(pw.skill)))}${pw.detail ? ' · ' + esc(pw.detail) : ''} · ${signed(pw.amount)}</span>
          <button class="btn small" id="all">${n === kids.length && n ? t('clear') : t('selectAll')}</button></div>
        <div class="options">${kids.map(k => `<button class="opt ${pw.sel.has(k.id) ? 'on' : ''}" data-k="${k.id}"><span class="i">${pic(k.avatar)}</span><span class="t">${esc(k.nickname)}</span><span class="check">${pw.sel.has(k.id) ? '✓' : ''}</span></button>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div>
        <div class="field" style="margin-top:14px"><label>${t('note')}</label><input class="input" id="note" maxlength="80"></div>
        <div class="bottom-bar"><button class="btn primary" id="give" ${n ? '' : 'disabled'}>${t('giveTo', signed(pw.amount), pic(cOf(pw.skill).icon), n)}</button></div>`;
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
    <div class="card"><div class="list">${recent.map(p => `<div class="li"><span class="av">${pic(p.kids?.avatar || '')}</span>
      <span class="grow">${esc(p.kids?.nickname || '?')}<span class="sub">${pic(cOf(p.skill).icon)} ${esc(cName(cOf(p.skill)))}${p.detail ? ' · ' + esc(p.detail) : ''}${p.note ? ' · ' + esc(p.note) : ''}</span></span>
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
    <div class="card"><p class="muted" style="margin:0 0 4px">${t('kidsCount', kids.length)}</p><div class="list">${kids.map(k => `<div class="li click" data-edit="${k.id}"><span class="av">${pic(k.avatar)}</span>
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
      <div class="emoji-pick">${uploadTile('avatar', isImg(cur) ? cur : '')}${AVATARS.map(a => `<button type="button" class="${a === cur ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <p class="hint">📷 ${t('photoNote')}</p></div>
    <div class="field"><label>${t('group')}</label><input class="input" name="grp" maxlength="30" value="${esc(kid?.grp || '')}"></div>`,
    { extra: kid ? `<button class="btn small" value="toggle" formnovalidate>${kid.active ? t('hidden') : t('show')}</button><button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
  const form = $('#dlgForm');
  const pickA = (b) => { form.querySelectorAll('[data-a], .up-tile').forEach(x => x.classList.remove('on')); b.classList.add('on'); };
  form.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { pickA(b); form.avatar.value = b.dataset.a; });
  wireUpload(form, 'avatar', 'avatars', 512, (tile) => pickA(tile));
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
    <div class="card"><div class="list">${list.map(r => `<div class="li"><span class="av">${pic(r.k.avatar)}</span>
      <span class="grow">${esc(r.k.nickname)}<span class="sub">${t('attTimes', r.present, r.leave, r.absent)}</span></span>
      <span class="amt c-here">${r.present}${days ? `<span class="muted"> / ${days}</span>` : ''}</span></div>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div></div>`;
}

// ---------------- Point categories (name, icon, extra info)
const PC_ICONS = ['🎹', '🎤', '🎼', '🎸', '🥁', '🔤', '📖', '🙋', '🧽', '🍽️', '🧹', '⛪', '🎁', '⭐', '💡', '🙏', '📝', '🤝'];
async function pPcats() {
  const cats = await pcats(true);
  view.innerHTML = `${pageHead(t('tab_settings'))}
    <button class="btn primary wide" id="addPc" style="margin-bottom:12px">+ ${t('addPcat')}</button>
    <div class="card"><div class="list">${cats.map(c => `<div class="li click" data-k="${c.key}"><span class="av">${pic(c.icon)}</span>
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
    { extra: c && baseKey(c.key) !== 'attendance' ? `<button class="btn small" value="toggle" formnovalidate>${c.active ? t('hidden') : t('show')}</button><button class="btn small danger" value="delete" formnovalidate>${t('del')}</button>` : '' });
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
    ${uploadTile(name, isImg(cur) ? cur : '')}${list.map(v => `<button type="button" class="${v === cur ? 'on' : ''}" data-v="${esc(v)}" title="${esc(SPECIAL[v] || v)}">${art(v)}</button>`).join('')}</div>
    <input class="input" data-own="${name}" placeholder="${t('orType')}" maxlength="8" style="height:48px">`;
}
function wirePickers(form) {
  form.querySelectorAll('.pick-row').forEach(row => {
    const name = row.dataset.for;
    const clearOwn = () => { const own = form.querySelector(`[data-own="${name}"]`); if (own) own.value = ''; };
    const on = (b) => { row.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); };
    row.querySelectorAll('button[data-v]').forEach(b => b.onclick = () => { on(b); form[name].value = b.dataset.v; clearOwn(); });
    wireUpload(form, name, 'icons', 512, (tile) => { on(tile); clearOwn(); });
  });
  form.querySelectorAll('[data-own]').forEach(inp => inp.oninput = () => {
    if (inp.value.trim()) { form[inp.dataset.own].value = inp.value.trim(); form.querySelectorAll(`[data-for="${inp.dataset.own}"] button`).forEach(x => x.classList.remove('on')); }
  });
}
// "📷" tile: pick a photo from the phone, shrink it, upload it, use it
function uploadTile(name, cur) {
  return `<button type="button" class="up-tile ${cur ? 'on has' : ''}" data-up="${name}" aria-label="${t('upload')}" title="${t('upload')}">${cur ? `<img src="${esc(cur)}" alt="">` : '📷'}</button>
    <input type="file" accept="image/*" data-file="${name}" hidden>`;
}
function wireUpload(form, name, folder, max, onDone) {
  const tile = form.querySelector(`[data-up="${name}"]`), file = form.querySelector(`[data-file="${name}"]`);
  if (!tile || !file) return;
  tile.onclick = () => { if (tile.classList.contains('has') && !tile.classList.contains('on')) { onDone(tile); form[name].value = tile.dataset.url || tile.querySelector('img').getAttribute('src'); } else file.click(); };
  file.onchange = async () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    if (!/^image\//.test(f.type)) { toast(t('notImage')); return; }
    tile.classList.add('busy'); tile.innerHTML = '⏳';
    try {
      const url = await api.uploadImage(await shrinkImage(f, max), folder);
      tile.innerHTML = `<img src="${esc(url)}" alt="">`; tile.dataset.url = url; tile.classList.add('has');
      form[name].value = url; onDone(tile);
    } catch (e) { console.error(e); toast(t('uploadFail')); tile.innerHTML = '📷'; }
    tile.classList.remove('busy');
  };
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

// ---------------- Prize redemption: kid -> prize -> confirm.
// The price comes off the kid's "points to spend"; the ranking points never change.
const dShort = (iso) => new Date(iso).toLocaleDateString(getLang() === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short' });
async function pRedeem(kidId) {
  const [rows, { items }, hist] = await Promise.all([leaderboard(true), api.shop(), api.redemptions(60)]);
  const kid = kidId ? rows.find(r => r.id === kidId) : null;
  if (kidId && !kid) { location.hash = '#/admin/redeem'; return; }
  if (!kid) {
    const kids = [...rows].sort((a, b) => a.nickname.localeCompare(b.nickname, 'th'));
    view.innerHTML = `${pageHead(t('tab_redeem'))}
      <h2 style="margin-bottom:12px">${t('rd1')}</h2>
      ${kids.length > 8 ? `<input class="input" id="q" placeholder="🔍 ${t('search')}" style="margin-bottom:12px">` : ''}
      <div class="options">${kids.map(k => `<button class="opt" data-k="${k.id}" data-n="${esc(k.nickname.toLowerCase())}"><span class="i">${pic(k.avatar)}</span>
        <span class="t">${esc(k.nickname)}<span class="opt-sub">${t('canSpend')} ${bal(k)} ⭐</span></span><span class="chev">›</span></button>`).join('') || `<p class="muted">${t('noKids')}</p>`}</div>
      <h2 class="grp" style="margin-top:26px">${t('rdHist')}</h2>
      <div class="card"><div class="list">${hist.map(h => `<div class="li">${art(h.item_icon)}
        <span class="grow">${esc(h.kids?.nickname || '?')}<span class="sub">${esc(h.item_name)} · ${dShort(h.created_at)}</span></span>
        <span class="amt neg">−${h.price} ⭐</span><button class="btn small danger" data-undo="${h.id}">${t('rdUndo')}</button></div>`).join('') || `<p class="muted">${t('none')}</p>`}</div></div>`;
    const q = $('#q'); if (q) q.oninput = () => view.querySelectorAll('[data-k]').forEach(b => b.hidden = !b.dataset.n.includes(q.value.trim().toLowerCase()));
    view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { location.hash = '#/admin/redeem/' + b.dataset.k; });
    view.querySelectorAll('[data-undo]').forEach(b => b.onclick = async () => {
      const h = hist.find(x => x.id === b.dataset.undo);
      if (!(await confirmBox(t('rdUndoWarn', h?.kids?.nickname || '?', h?.item_name || '', h?.price || 0), t('rdUndo')))) return;
      try { await api.deleteRedemption(h.id); lbCache.at = 0; toast(t('saved')); pRedeem(); } catch (e) { fail(e); }
    });
    return;
  }
  const live = items.filter(i => i.active).sort((x, y) => x.price - y.price), b = bal(kid);
  view.innerHTML = `${pageHead(t('tab_redeem'), '#/admin/redeem')}
    <div class="card rd-kid"><span class="av">${pic(kid.avatar)}</span><span class="grow"><b>${esc(kid.nickname)}</b><span class="sub">${t('rankPts')} ${kid.total} ⭐</span></span>
      <span class="rd-bal"><b>${b} ⭐</b><span>${t('canSpend')}</span></span></div>
    <h2 style="margin-bottom:12px">${t('rd2')}</h2>
    <div class="options">${live.map(i => { const ok = i.price <= b; return `<button class="opt ${ok ? '' : 'dim'}" data-i="${i.id}" ${ok ? '' : 'disabled'}><span class="i">${art(i.icon)}</span>
      <span class="t">${esc(i.name)}<span class="opt-sub">${ok ? t('rdLeft', b - i.price) : t('rdShort', i.price - b)}</span></span><span class="amt">${i.price} ⭐</span></button>`; }).join('') || `<p class="muted">${t('need_shopEmpty')}</p>`}</div>`;
  view.querySelectorAll('[data-i]').forEach(btn => btn.onclick = async () => {
    const it = live.find(x => x.id === btn.dataset.i);
    if (!(await confirmBox(t('rdConfirm', it.name, kid.nickname, it.price, b - it.price), t('rdGo'), false))) return;
    btn.disabled = true;
    try {
      await api.redeem({ kid_id: kid.id, item_id: it.id, item_name: it.name, item_icon: it.icon, price: it.price });
      lbCache.at = 0; toast('✓ ' + t('rdDone', kid.nickname, it.name)); location.hash = '#/admin/redeem';
    } catch (e) { btn.disabled = false; console.error(e); toast(/not enough/.test(e?.message || '') ? t('rdShort', it.price - b) : t('errGeneric')); }
  });
}

// ---------------- Announcement line + verse of the week (shown on the kids' home page)
async function pNotice() {
  const s = await eventInfo(true);
  view.innerHTML = `${pageHead(t('tab_notice'))}
    <form id="nf">
      <div class="card"><h3 class="sec">📣 ${t('annTitle')}</h3>
        <div class="field"><label>${t('annLbl')}</label><textarea class="input" name="announce" maxlength="160" rows="3" style="height:auto;padding:12px">${esc(s.announce || '')}</textarea>
          <p class="hint">${t('annHint')}</p></div></div>
      <div class="card"><h3 class="sec">📖 ${t('verseWeek')}</h3>
        <div class="field"><label>${t('verseLbl')}</label><textarea class="input" name="verse_text" maxlength="400" rows="4" style="height:auto;padding:12px">${esc(s.verse_text || '')}</textarea></div>
        <div class="field"><label>${t('verseRefLbl')}</label><input class="input" name="verse_ref" maxlength="60" placeholder="${t('verseRefEg')}" value="${esc(s.verse_ref || '')}">
          <p class="hint">${t('verseHint')}</p></div></div>
      <div class="bottom-bar"><button class="btn primary" id="saveN">${t('save')}</button></div>
    </form>`;
  $('#nf').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), b = $('#saveN'); b.disabled = true;
    try { await api.saveNotice({ announce: f.get('announce').trim(), verse_text: f.get('verse_text').trim(), verse_ref: f.get('verse_ref').trim() }); evCache = null; toast(t('saved')); } catch (err) { fail(err); }
    b.disabled = false;
  };
}

// ---------------- Weekly summary: the last 7 days at a glance
async function pWeekly() {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  // v32: the kids' activity rows belong to the super admin; admins get only the counts (kid_week_stats)
  const [kids, att, pts, ks, red, fb] = await Promise.all([api.kids(), api.attendanceAll(), api.pointsSince(since), api.kidWeekStats(since).catch(() => ({ phones: 0, songs: [] })),
    api.redemptions(300), can('feedback') ? api.feedback().catch(() => []) : [], pcats()]);
  const active = kids.filter(k => k.active), kidOf = Object.fromEntries(kids.map(k => [k.id, k]));
  const days = [...new Set(att.map(a => a.day))].sort(), last2 = days.slice(-2);
  const stOf = (kid, day) => att.find(a => a.kid_id === kid && a.day === day)?.status || '';
  const stTxt = (s) => s ? t(s) : t('notChecked');
  const missed = last2.length === 2 ? active.filter(k => last2.every(d => stOf(k.id, d) !== 'present')) : [];
  const gain = {}; pts.forEach(p => { gain[p.kid_id] = (gain[p.kid_id] || 0) + p.amount; });
  const top = Object.entries(gain).filter(([id, n]) => kidOf[id] && n > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topSongs = (ks.songs || []).map(x => [x.title, { n: x.n, d: { size: x.devices } }]);
  const redW = red.filter(r => r.created_at >= since), fbW = fb.filter(f => f.created_at >= since).length;
  const phones = ks.phones || 0, given = pts.reduce((a, p) => a + (p.amount > 0 ? p.amount : 0), 0);
  const lastDay = days[days.length - 1], came = lastDay ? active.filter(k => stOf(k.id, lastDay) === 'present').length : 0;
  const card = (title, sub, inner) => `<div class="card"><b>${title}</b>${sub ? `<p class="muted" style="margin:2px 0 6px">${sub}</p>` : ''}<div class="list">${inner}</div></div>`;
  const none = `<p class="muted" style="margin:8px 0 4px">${t('none')}</p>`;
  view.innerHTML = `${pageHead(t('tab_weekly'))}
    <p class="muted" style="margin:-6px 2px 12px">${t('wkSub')}</p>
    <div class="summary"><div><b class="c-here">${given}</b><span>${t('wkPts')}</span></div><div><b>${came}<span class="muted" style="font-size:.9rem"> / ${active.length}</span></b><span>${t('wkCame')}</span></div>
      <div><b>${phones}</b><span>${t('wkPhones')}</span></div>${can('feedback') ? `<div><b>${fbW}</b><span>${t('wkFb')}</span></div>` : ''}</div>
    ${card('🙋 ' + t('wkMissed'), last2.length === 2 ? t('wkMissedSub', dShort(last2[0]), dShort(last2[1])) : t('wkNeed2'),
      last2.length < 2 ? '' : missed.map(k => `<div class="li"><span class="av">${pic(k.avatar)}</span><span class="grow">${esc(k.nickname)}<span class="sub">${last2.map(d => `${dShort(d)}: ${stTxt(stOf(k.id, d))}`).join(' · ')}</span></span></div>`).join('') || `<p class="c-here" style="margin:8px 0 4px">✓ ${t('wkNoMiss')}</p>`)}
    ${card('⭐ ' + t('wkTop'), '', top.map(([id, n], i) => `<div class="li"><span class="av">${pic(kidOf[id].avatar)}</span><span class="grow">${esc(kidOf[id].nickname)}</span><span class="amt pos">+${n}</span></div>`).join('') || none)}
    ${card('🎵 ' + t('wkSongs'), '', topSongs.map(([title, x]) => `<div class="li"><span class="grow">${esc(title)}<span class="sub">${t('wkSongN', x.n, x.d.size)}</span></span><span class="amt">${x.n}</span></div>`).join('') || none)}
    ${card('🎟️ ' + t('wkPrizes'), '', redW.map(r => `<div class="li">${art(r.item_icon)}<span class="grow">${esc(r.kids?.nickname || '?')}<span class="sub">${esc(r.item_name)} · ${dShort(r.created_at)}</span></span><span class="amt neg">−${r.price} ⭐</span></div>`).join('') || none)}`;
}

// ---------------- Version and what changed (for admins)
async function pAbout() {
  const th = getLang() === 'th', L = th ? 0 : 1;
  const dLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString(th ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const span = (u) => { const vs = u.versions.map(x => Number(x.v)); return `${t('clogVer')} ${Math.min(...vs)}${vs.length > 1 ? '–' + Math.max(...vs) : ''}`; };
  const dates = (u) => { const a = u.versions[u.versions.length - 1].date, b = u.versions[0].date; return dLong(a) + (a !== b ? ' – ' + dLong(b) : ''); };
  const verCard = `<div class="card ver-card"><div class="ver-now"><span>${t('verUsing')}</span><b>${esc(VERSION)}</b></div>
      <p id="verState" class="muted">${t('verChecking')}…</p>
      <button class="btn primary wide" id="verUpd" hidden>🔄 ${t('verUpdate')}</button></div>`;
  // v32: normal admins get a short, simple "what's new" (last 5 versions, no area tags, no technical items);
  // the full grouped change log with the Excel export is the super admin's
  if (!isSuper() && !program.look?.clogDetail) {                  // v35: the super admin can let a program's admins see the detailed one
    const plain = new Set(['kids', 'admin', 'songs', 'look', 'fix']);
    const recent = CHANGELOG.slice(0, 5).map(c => ({ ...c, list: c.short ? [th ? c.short.th : c.short.en] : c.items.filter(x => plain.has(x.a)).slice(0, 4).map(x => th ? x.th : x.en) })).filter(c => c.list.length);
    view.innerHTML = `${pageHead(t('tab_about'))}${verCard}
      <h2 class="grp">${t('clogNew')}</h2>
      ${recent.map(c => `<div class="card clog-simple"><div class="clog-h"><b>${t('verN', c.v)}${c.v === VERSION ? ` <span class="now-tag">${t('verThis')}</span>` : ''}</b><span class="muted">${dLong(c.date)}</span></div>
        <ul>${c.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}`;
  } else view.innerHTML = `${pageHead(t('tab_about'))}${verCard}
    ${isSuper() ? `<button class="btn wide" id="clogXl" style="margin-bottom:6px">📥 ${t('clogExport')}</button>` : ''}
    <h2 class="grp">${t('clogTitle')}</h2>
    ${UPDATES.map((u, ui) => `<details class="card upd" ${ui === 0 ? 'open' : ''}><summary><span class="ut"><b>${esc(th ? u.th : u.en)}</b><span class="muted">${span(u)} · ${dates(u)}</span></span><span class="chev">›</span></summary>
      ${u.versions.map(c => `<div class="clog ${c.v === VERSION ? 'now' : ''}"><div class="clog-h"><b>${t('verN', c.v)}${c.v === VERSION ? ` <span class="now-tag">${t('verThis')}</span>` : ''}</b><span class="muted">${dLong(c.date)}</span></div>
        <ul>${c.items.map(x => `<li><span class="area a-${x.a}">${esc(AREAS[x.a]?.[L] || x.a)}</span>${esc(th ? x.th : x.en)}</li>`).join('')}</ul></div>`).join('')}</details>`).join('')}`;
  $('#verUpd').onclick = async () => { try { await (await navigator.serviceWorker?.getRegistration())?.update(); } catch {} location.reload(); };
  if ($('#clogXl')) $('#clogXl').onclick = async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try {
      const XLSX = await loadXLSX(), wb = XLSX.utils.book_new();
      const rows = CHANGELOG.flatMap(c => c.items.map(x => ({ [t('clogUpd')]: th ? c.update.th : c.update.en, [t('clogVer')]: Number(c.v), [t('clogDate')]: c.date,
        [t('clogArea')]: AREAS[x.a]?.[L] || x.a, [t('clogItem')]: th ? x.th : x.en, ...(th ? { English: x.en } : {}), Commit: c.commit || '' })));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 34 }, { wch: 9 }, { wch: 12 }, { wch: 13 }, { wch: 90 }, ...(th ? [{ wch: 90 }] : []), { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, t('clogSheet').slice(0, 31));
      XLSX.writeFile(wb, `youth-alpha-changelog-v${VERSION}.xlsx`);
    } catch (err) { fail(err); }
    b.disabled = false;
  };
  const st = $('#verState');
  try {
    const txt = await fetch('js/version.js?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject(new Error('http')));
    const latest = /VERSION\s*=\s*'(\d+)'/.exec(txt)?.[1];
    if (!st.isConnected) return;
    if (latest && Number(latest) > Number(VERSION)) { st.textContent = t('verNew', latest); st.className = 'c-leave'; $('#verUpd').hidden = false; }
    else { st.textContent = '✓ ' + t('verLatest'); st.className = 'c-here'; }
  } catch { if (st.isConnected) st.textContent = t('verNoCheck'); }
}

// ---------------- Songs (admin)
const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].flatMap(k => [k, k + 'm']);
async function pSongs() {
  const list = await songList(true);
  view.innerHTML = `${pageHead(t('tab_songs'))}
    <a class="btn primary wide" href="#/admin/song/new" style="margin-bottom:10px">+ ${t('addSong')}</a>
    <button class="btn wide" id="pasteAll" style="margin-bottom:12px">📋 ${t('pasteAll')}</button>
    <div class="card"><div class="list">${list.map((x, i) => `<a class="li click" href="#/admin/song/${x.id}" style="text-decoration:none;color:inherit"><span class="av" style="font-size:1.1rem;font-weight:700">${i + 1}</span>
      <span class="grow">${esc(x.title)}<span class="sub">${[x.song_key && t('keyLbl') + ' ' + x.song_key, '♩ ' + x.bpm, ytId(x.youtube) && '▶ YouTube', syncState(x).beats && '🔗', (x.sheets || []).length && '📄 ' + x.sheets.length, x.content.trim() ? '' : t('noLyrics'), x.active ? '' : t('hidden')].filter(Boolean).map(esc).join(' · ')}</span></span>
      <span class="muted">${t('edit')} ›</span></a>`).join('') || `<p class="muted">${t('noSongs')}</p>`}</div></div>`;
  $('#pasteAll').onclick = () => pasteWholeSheet(list);
}
async function pasteWholeSheet(list) {
  const r = await modal('📋 ' + t('pasteAll'), `<p class="hint" style="margin:0 0 10px">${t('pasteAllHow')}</p>
    <textarea class="input" name="sheet" rows="14" spellcheck="false" required style="white-space:pre;overflow-x:auto;font-family:Tahoma,'Leelawadee UI','Noto Sans Thai',sans-serif;font-size:.9rem"></textarea>`, { okText: t('next') });
  if (!(r instanceof FormData)) return;
  const parts = splitSheet(r.get('sheet'), list);
  if (!parts.length) { await confirmBox(t('pasteNone'), t('ok'), false); return; }
  const missing = list.filter(x => !parts.some(p => p.song.id === x.id)).map(x => x.title);
  const ok = await modal('⚠️ ' + t('warnTitle'), `<p style="white-space:pre-line;font-size:1.05rem;margin-top:0">${esc(t('pasteFound', parts.length))}</p>
    <div class="list">${parts.map(p => `<div class="li"><span class="grow"><b>${esc(p.song.title)}</b><span class="sub">${t('linesN', p.content.split('\n').filter(l => l.trim()).length)}</span></span><span class="c-here">✓</span></div>`).join('')}</div>
    ${missing.length ? `<p class="muted">${esc(t('pasteMissing'))} ${missing.map(esc).join(', ')}</p>` : ''}
    <p style="white-space:pre-line;margin-bottom:0">${esc(t('pasteReplaceWarn'))}</p>`, { okText: t('save'), danger: true });
  if (!(ok instanceof FormData)) return;
  try {
    for (const p of parts) await api.saveSong({ id: p.song.id, content: p.content });
    songCache.at = 0; toast(t('pasteDone', parts.length)); pSongs();
  } catch (e) { fail(e); }
}
async function pSongEdit(id) {
  const [list] = await Promise.all([songList(true), eventInfo(true)]), x = list.find(v => v.id === id);   // eventInfo: the music switches (simple songs)
  if (id !== 'new' && !x) { location.hash = '#/admin/songs'; return; }
  const v = x || { title: '', subtitle: '', song_key: 'C', bpm: 100, beats: 4, youtube: '', yt_start: 0, credits: '', content: '', sheets: [], sort: list.length + 1, active: true };
  let sheets = [...(v.sheets || [])];
  view.innerHTML = `${pageHead(x ? esc(x.title) : t('addSong'), '#/admin/songs')}
    <form id="sf" class="song-form">
      <div class="card">
        <div class="field"><label class="req">${t('songTitle')}</label><input class="input" name="title" required maxlength="80" value="${esc(v.title)}"></div>
        <div class="field"><label>${t('songSub')}</label><input class="input" name="subtitle" maxlength="80" value="${esc(v.subtitle)}"></div>
        <div class="grid3">
          <div class="field"><label>${t('keyLbl')}</label><select class="input" name="song_key"><option value=""></option>${KEYS.map(k => `<option ${k === v.song_key ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
          <div class="field"><label>${t('bpmLbl')}</label><input class="input" name="bpm" type="number" inputmode="numeric" min="30" max="240" required value="${v.bpm}"></div>
          <div class="field"><label>${t('beatsLbl')}</label><select class="input" name="beats">${[2, 3, 4, 6].map(b => `<option ${b === v.beats ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
        </div>
      </div>
      <div class="card">
        <div class="field"><label>${t('lyricsLbl')}</label><textarea class="input mono" name="content" rows="14" maxlength="20000" spellcheck="false">${esc(v.content)}</textarea>
          <p class="hint">${t('lyricsHelp')}</p></div>
        <button type="button" class="btn small" id="pv">👀 ${t('pvBtn')}</button>
        <div class="lyrics admin-pv" id="pvBox" hidden></div>
      </div>
      <div class="card">
        <div class="field"><label>${t('sheetsLbl')}</label><div class="sheet-thumbs" id="thumbs"></div>
          <button type="button" class="btn small" id="addSheet">${t('upload')}</button><input type="file" id="sheetFile" accept="image/*" multiple hidden>
          <p class="hint" id="readStatus" hidden></p><p class="hint">✨ ${t('readHint')}</p></div>
      </div>
      <div class="card">
        <div class="field"><label>${t('ytLink')}</label><input class="input" name="youtube" maxlength="200" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" value="${esc(v.youtube)}"></div>
        <div class="grid3">
          <div class="field"><label>${t('ytStart')}</label><input class="input" name="yt_start" type="number" inputmode="numeric" min="0" max="3600" value="${v.yt_start || 0}"></div>
          <div class="field"><label>${t('orderLbl')}</label><input class="input" name="sort" type="number" inputmode="numeric" min="0" max="999" value="${v.sort}"></div>
        </div>
        <div class="field"><label>${t('creditsLbl')}</label><textarea class="input" name="credits" rows="3" maxlength="600">${esc(v.credits)}</textarea></div>
      </div>
      ${x ? songSwitches(x) : ''}
      ${x && ytId(x.youtube) ? syncCard(x) : ''}
      ${x ? `<div class="row-btns"><button type="button" class="btn small" id="hideSong">${x.active ? t('hidden') : t('show')}</button><button type="button" class="btn small danger" id="delSong">${t('del')}</button></div>` : ''}
      <div class="bottom-bar"><button class="btn primary" id="saveSong">${t('save')}</button></div>
    </form>`;
  const form = $('#sf');
  // "original sheet only": everything else switches off (and back on when it is turned off)
  view.querySelector('[data-only]')?.addEventListener('click', async (e) => {
    const b = e.currentTarget, on = !b.classList.contains('on'), keys = PLAYER_KEYS;
    const opts = Object.fromEntries(keys.map(k => [k, k === 'origSheet' ? true : !on])); opts.sheetOnly = on;
    b.disabled = true;
    try {
      await api.saveSong({ id: x.id, opts }); x.opts = opts; songCache.at = 0;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
      view.querySelectorAll('[data-so]').forEach(sw => { const v = opts[sw.dataset.so] !== false; sw.classList.toggle('on', v); sw.setAttribute('aria-checked', String(v)); });
      toast(`${t('sheetOnly')} · ${on ? t('moOn') : t('moOff')}`);
    } catch (err) { fail(err); }
    b.disabled = false;
  });
  view.querySelectorAll('[data-so]').forEach(b => b.onclick = async () => {
    const k = b.dataset.so, on = !b.classList.contains('on'), opts = { ...(x.opts || {}), [k]: on };
    if (on && k !== 'origSheet') opts.sheetOnly = false;                    // turning anything else on ends "sheet only"
    if (!on && k === 'origSheet') opts.sheetOnly = false;
    b.disabled = true;
    try {
      await api.saveSong({ id: x.id, opts }); x.opts = opts; songCache.at = 0;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
      const only = view.querySelector('[data-only]'); if (only) { only.classList.toggle('on', !!opts.sheetOnly); only.setAttribute('aria-checked', String(!!opts.sheetOnly)); }
      toast(`${t('mo_' + k)} · ${on ? t('moOn') : t('moOff')}`);
    } catch (e) { fail(e); }
    b.disabled = false;
  });
  const drawThumbs = () => {
    $('#thumbs').innerHTML = sheets.map((u, i) => `<div class="th"><img src="${esc(u)}" alt=""><button type="button" class="x" data-rm="${i}" aria-label="${t('removePic')}">✕</button>
      <button type="button" class="read" data-read="${i}">✨ ${t('readPic')}</button></div>`).join('');
    $('#thumbs').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { sheets.splice(Number(b.dataset.rm), 1); drawThumbs(); });
    $('#thumbs').querySelectorAll('[data-read]').forEach(b => b.onclick = () => readInto(sheets[b.dataset.read]));
  };
  // fill the lyrics box from a sheet picture (words + chords over them)
  const readInto = async (url) => {
    if (form.content.value.trim() && !(await confirmBox(t('readReplace'), t('readGo')))) return;
    const st = $('#readStatus'); st.hidden = false; st.textContent = '✨ ' + t('reading') + '…';
    view.querySelectorAll('[data-read]').forEach(b => b.disabled = true);
    try {
      const { readSheet } = await import('./ocr.js?v=38');
      const txt = await readSheet(url, { skipTitles: [form.title.value, form.subtitle.value], key: form.song_key.value, onProgress: (p) => { st.textContent = `✨ ${t('reading')}… ${Math.round(p * 100)}%`; } });
      if (!txt.trim()) { st.textContent = t('readNothing'); return; }
      form.content.value = txt; form.content.dispatchEvent(new Event('input'));
      const box = $('#pvBox'); box.hidden = false; box.innerHTML = renderSong(parseSong(txt));
      st.textContent = '✓ ' + t('readDone');
      form.content.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch (e) { console.error(e); st.textContent = t('readFail'); }
    finally { view.querySelectorAll('[data-read]').forEach(b => b.disabled = false); }
  };
  drawThumbs();
  $('#addSheet').onclick = () => $('#sheetFile').click();
  $('#sheetFile').onchange = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const b = $('#addSheet'); b.disabled = true; b.textContent = t('uploading');
    let first = null;
    for (const f of files) {
      if (!/^image\//.test(f.type)) { toast(t('notImage')); continue; }
      try { const u = await api.uploadImage(await shrinkImage(f, 2000, 0.9), 'sheets'); sheets.push(u); first ??= u; drawThumbs(); } catch (err) { console.error(err); toast(t('uploadFail')); }
    }
    b.disabled = false; b.textContent = t('upload');
    if (first) readInto(first);                                   // new picture: read the words and chords straight away
  };
  $('#pv').onclick = () => { const box = $('#pvBox'); box.hidden = !box.hidden; if (!box.hidden) box.innerHTML = renderSong(parseSong(form.content.value)) || `<p class="muted">${t('noLyrics')}</p>`; };
  form.content.oninput = () => { const box = $('#pvBox'); if (!box.hidden) box.innerHTML = renderSong(parseSong(form.content.value)); };
  form.content.addEventListener('paste', (e) => {
    const txt = e.clipboardData?.getData('text/plain'); if (!txt || !txt.includes('\n')) return;
    e.preventDefault();
    const ta = form.content, a = ta.selectionStart, b = ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + chordsIntoWords(txt) + ta.value.slice(b);
    ta.dispatchEvent(new Event('input'));
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(form), num = (k, lo, hi, d) => Math.max(lo, Math.min(hi, Math.trunc(Number(f.get(k))) || d));
    const row = { title: f.get('title').trim(), subtitle: f.get('subtitle').trim(), song_key: f.get('song_key'), bpm: num('bpm', 30, 240, 100), beats: num('beats', 2, 12, 4),
      youtube: f.get('youtube').trim(), yt_start: num('yt_start', 0, 3600, 0), sort: num('sort', 0, 999, 0), credits: f.get('credits').trim(), content: f.get('content').replace(/\r/g, ''), sheets };
    if (!row.title) return;
    const b = $('#saveSong'); b.disabled = true;
    try { await api.saveSong(x ? { id: x.id, ...row } : row); songCache.at = 0; toast(t('songSaved')); location.hash = '#/admin/songs'; } catch (err) { fail(err); }
    b.disabled = false;
  };
  $('#hideSong')?.addEventListener('click', async () => { try { await api.saveSong({ id: x.id, active: !x.active }); songCache.at = 0; pSongEdit(id); } catch (e) { fail(e); } });
  $('#delSong')?.addEventListener('click', async () => {
    if (!(await confirmBox(t('delWarn', x.title)))) return;
    try { await api.deleteSong(x.id); songCache.at = 0; location.hash = '#/admin/songs'; } catch (e) { fail(e); }
  });
}

// ---------------- What kids see in this one song (switches like the feedback switch)
function songSwitches(x) {
  const o = x.opts || {}, simple = simpleSongs();
  const row = ([k, i]) => { const off = !moApp(k); return `<div class="tg-row"><span class="tg-i">${i}</span>
      <span class="tg-t"><b>${t('mo_' + k)}</b>${off ? `<span>${t('songSwOff')}</span>` : ''}</span>
      <button type="button" class="switch ${o[k] !== false ? 'on' : ''}" data-so="${k}" role="switch" aria-checked="${o[k] !== false}" aria-label="${t('mo_' + k)}" ${off ? 'disabled' : ''}><span></span></button></div>`; };
  return `<details class="card toggles sw-card" ${simple ? '' : 'open'}><summary><b>👀 ${t('songSw')}</b><span class="chev">›</span></summary>
    ${simple ? `<p class="simple-note">✅ ${t('simpleOnNote')} <a href="#/admin/musicset">${t('tab_musicset')} ›</a></p>` : `<p class="muted" style="margin:0 0 4px">${t('songSwSub')}</p>`}
    <div class="${simple ? 'dimmed' : ''}">
    <div class="tg-row only"><span class="tg-i">📄</span><span class="tg-t"><b>${t('sheetOnly')}</b><span>${t('sheetOnlySub')}</span></span>
      <button type="button" class="switch ${o.sheetOnly ? 'on' : ''}" data-only role="switch" aria-checked="${!!o.sheetOnly}" aria-label="${t('sheetOnly')}"><span></span></button></div>
    ${PLAYER_GROUPS.map(([g, items]) => `<p class="tg-grp">${t(g)}</p>${items.map(row).join('')}`).join('')}</div></details>`;
}

// ---------------- Tap-along: match the beat and the lyric lines to the video (admin)
function syncState(x) {
  const ok = x.sync && x.sync.video === ytId(x.youtube);
  return { beats: ok && x.sync.beats?.length > 8 ? x.sync.beats.length : 0, lines: ok && x.sync.lines?.length ? x.sync.lines.length : 0,
    linesOld: ok && x.sync.lines?.length && x.sync.linesHash !== hashText(x.content || '') };
}
function syncCard(x) {
  const st = syncState(x);
  return `<div class="card"><b>🎯 ${t('syncTitle')}</b>
    <p class="muted" style="margin:4px 0 10px">${t('syncSub')}</p>
    <div class="sync-stat"><span>🥁 ${t('syncBeats')}</span><b class="${st.beats ? 'c-here' : 'muted'}">${st.beats ? '✓ ' + t('syncN', st.beats) : t('syncNone')}</b></div>
    <div class="sync-stat"><span>🎤 ${t('syncLines')}</span><b class="${st.lines && !st.linesOld ? 'c-here' : 'muted'}">${st.linesOld ? '⚠️ ' + t('syncRedo') : st.lines ? '✓ ' + t('syncN', st.lines) : t('syncNone')}</b></div>
    <a class="btn wide" href="#/admin/sync/${x.id}" style="margin-top:10px">🎯 ${t('syncOpen')}</a></div>`;
}
async function pSync(id) {
  const x = (await songList(true)).find(v => v.id === id);
  if (!x) { location.hash = '#/admin/songs'; return; }
  const vid = ytId(x.youtube);
  if (!vid) { location.hash = '#/admin/song/' + id; return; }
  const parsed = parseSong(x.content);
  const old = x.sync && x.sync.video === vid ? x.sync : {};
  const sync = { video: vid, beats: old.beats || [], offset: old.offset || 0, lines: old.lines || [], linesHash: old.linesHash || '' };
  let mode = 'beats', taps = [], marks = [], next = 0, yt = null, clock = null, preview = 0, testing = false;
  view.innerHTML = `${pageHead('🎯 ' + t('syncTitle'), '#/admin/song/' + id)}
    <p class="muted" style="margin:-8px 2px 10px">${esc(x.title)}</p>
    <div class="seg" id="seg"><button data-mode="beats" class="on">🥁 ${t('syncBeats')}</button><button data-mode="lines">🎤 ${t('syncLines')}</button></div>
    <div class="yt sync-yt"><div id="syncFrame"></div></div>
    <div id="syncBody"></div>`;
  const stop = () => { clearInterval(preview); metro.stop(); };
  const body = () => $('#syncBody');
  const drawBeats = () => {
    const have = sync.beats.length > 8;
    body().innerHTML = `<p class="hint" style="margin:0 2px 10px">${t('tapHowBeat')}</p>
      <button class="tap-big" id="tap"><span>${t('tapHere')}</span><b id="tapN">${taps.length}</b><small id="tapBpm">${taps.length > 4 ? '♩ ' + bpmOf(cleanBeats(taps)) : ''}</small></button>
      <div class="row-btns" style="justify-content:space-between"><button class="btn small" id="redo">↺ ${t('startOver')}</button><button class="btn small primary" id="saveB" ${taps.length >= 8 ? '' : 'disabled'}>💾 ${t('save')}</button></div>
      <button class="btn wide" id="autoB" style="margin-bottom:12px" ${taps.length >= 8 || have ? '' : 'disabled'}>✨ ${t('autoFill')}</button>
      <p class="hint" style="margin:-6px 2px 12px">${t('autoFillHint')}</p>
      ${have ? `<div class="card"><b>✓ ${t('syncN', sync.beats.length)} · ♩ ${bpmOf(sync.beats)}</b>
        <p class="muted" style="margin:4px 0 10px">${t('testHow')}</p>
        <button class="btn wide ${testing ? 'primary' : ''}" id="testB">🎧 ${testing ? t('testing') : t('testBeat')}</button>
        <div class="nudge"><button class="btn small" data-nudge="-0.02">− ${t('earlier')}</button><b id="offNow">${Math.round(sync.offset * 1000)} ms</b><button class="btn small" data-nudge="0.02">+ ${t('later')}</button></div></div>` : ''}`;
    const tap = $('#tap');
    tap.onpointerdown = (e) => {
      e.preventDefault();
      if (!clock?.playing) { toast(t('pressPlay')); return; }
      taps.push(clock.now()); tap.classList.remove('hit'); void tap.offsetWidth; tap.classList.add('hit');
      $('#tapN').textContent = taps.length;
      if (taps.length > 4) $('#tapBpm').textContent = '♩ ' + bpmOf(cleanBeats(taps));
      $('#saveB').disabled = taps.length < 8; $('#autoB').disabled = taps.length < 8 && !have;
    };
    // fill the rest of the song: keep going at the tempo of the last beats until the video ends
    $('#autoB').onclick = async () => {
      const base = taps.length >= 8 ? cleanBeats(taps) : [...sync.beats];
      let end = 0; try { end = Number(yt?.getDuration?.()) || 0; } catch {}
      if (!end) { toast(t('pressPlay')); return; }
      const tail = base.slice(-9), period = (tail[tail.length - 1] - tail[0]) / (tail.length - 1);
      if (!(period > 0.2 && period < 2.5)) { toast(t('errGeneric')); return; }
      const out = [...base];
      for (let tm = out[out.length - 1] + period; tm < end - 0.05; tm += period) out.push(Math.round(tm * 1000) / 1000);
      sync.beats = out;
      try { await api.saveSong({ id, sync, bpm: Math.max(30, Math.min(240, bpmOf(base))) }); songCache.at = 0; taps = []; toast(t('autoFilled', out.length - base.length)); drawBeats(); } catch (e) { fail(e); }
    };
    $('#redo').onclick = () => { taps = []; try { yt?.seekTo(x.yt_start || 0, true); yt?.pauseVideo(); } catch {} drawBeats(); };
    $('#saveB').onclick = async () => {
      sync.beats = cleanBeats(taps);
      try { await api.saveSong({ id, sync, bpm: Math.max(30, Math.min(240, bpmOf(sync.beats))) }); songCache.at = 0; taps = []; toast(t('saved')); drawBeats(); } catch (e) { fail(e); }
    };
    $('#testB')?.addEventListener('click', () => {
      testing = !testing;
      testing && clock ? metro.follow({ clock, beats: sync.beats, perBar: x.beats, offset: sync.offset, sound: true }) : metro.stop();
      drawBeats();
    });
    view.querySelectorAll('[data-nudge]').forEach(b => b.onclick = async () => {
      sync.offset = Math.round((sync.offset + Number(b.dataset.nudge)) * 1000) / 1000; metro.setOffset(sync.offset);
      $('#offNow').textContent = Math.round(sync.offset * 1000) + ' ms';
      clearTimeout(b._t); b._t = setTimeout(async () => { try { await api.saveSong({ id, sync }); songCache.at = 0; } catch (e) { fail(e); } }, 700);
    });
  };
  const drawLines = () => {
    if (!marks.length && sync.lines.length && sync.linesHash === hashText(x.content || '')) marks = sync.lines.map(m => [...m]);
    const lines = parsed.filter(p => p.k === 'line' || p.k === 'chords');
    body().innerHTML = `<p class="hint" style="margin:0 2px 10px">${t('tapHowLine')}</p>
      <div class="lyrics admin-pv sync-lines" id="sl">${renderSong(parsed)}</div>
      <div class="sync-bar"><button class="btn small" id="undo">↩ ${t('undoMark')}</button><button class="btn small" id="redoL">↺</button>
        <button class="btn primary" id="nextL">⏭ ${t('nextLine')}</button><button class="btn small primary" id="saveL" ${marks.length ? '' : 'disabled'}>💾</button></div>`;
    const sl = $('#sl');
    const paint = () => {
      sl.querySelectorAll('.ln').forEach(el => { const li = Number(el.dataset.li); el.classList.toggle('done', marks.some(m => m[1] === li)); el.classList.toggle('next', li === next); });
      $('#saveL').disabled = !marks.length;
      sl.querySelector('.ln.next')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    const mark = (li) => {
      if (!clock?.playing) { toast(t('pressPlay')); return; }
      marks.push([Math.round(clock.now() * 1000) / 1000, li]); next = Math.min(lines.length - 1, li + 1); paint();
    };
    $('#nextL').onclick = () => mark(next);
    sl.onclick = (e) => { const el = e.target.closest('.ln'); if (el) mark(Number(el.dataset.li)); };
    $('#undo').onclick = () => { const m = marks.pop(); if (m) next = m[1]; paint(); };
    $('#redoL').onclick = () => { marks = []; next = 0; try { yt?.seekTo(x.yt_start || 0, true); yt?.pauseVideo(); } catch {} paint(); };
    $('#saveL').onclick = async () => {
      sync.lines = [...marks].sort((a, b) => a[0] - b[0]); sync.linesHash = hashText(x.content || '');
      try { await api.saveSong({ id, sync }); songCache.at = 0; toast(t('saved')); } catch (e) { fail(e); }
    };
    paint();
  };
  const draw = () => { stop(); testing = false; mode === 'beats' ? drawBeats() : drawLines(); };
  view.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; view.querySelectorAll('[data-mode]').forEach(z => z.classList.toggle('on', z === b)); draw(); });
  document.addEventListener('keydown', function key(e) {
    if (!document.body.contains($('#syncBody'))) { document.removeEventListener('keydown', key); return; }
    if (e.code === 'Space' && mode === 'beats') { e.preventDefault(); $('#tap')?.onpointerdown(e); }
    if (e.code === 'Space' && mode === 'lines') { e.preventDefault(); $('#nextL')?.click(); }
  });
  draw();
  try {
    const YT = await loadYT();
    yt = new YT.Player('syncFrame', { host: 'https://www.youtube-nocookie.com', videoId: vid,
      playerVars: { playsinline: 1, rel: 0, start: x.yt_start || 0 }, events: { onReady: (e) => { clock = videoClock(e.target); } } });
    syncCleanup = () => { stop(); clock?.stop(); try { yt?.destroy?.(); } catch {} };
  } catch { $('.sync-yt').innerHTML = `<p class="muted" style="padding:16px;color:#fff">${t('ytFail')}</p>`; }
}
let syncCleanup = null;

// ---------------- Kids' feedback
async function pFeedback() {
  const list = await api.feedback();
  const moods = { 4: '😄', 3: '🙂', 2: '😐', 1: '😢', 0: '💬' };
  const ev = await eventInfo(true);
  view.innerHTML = `${pageHead(t('tab_feedback'))}
    <div class="card switch-card"><div class="sw-text"><b>${t('fbToggle')}</b><span id="fbState" class="${ev.fb_open ? 'c-here' : 'muted'}">${ev.fb_open ? t('fbOnNow') : t('fbOffNow')}</span></div>
      <button class="switch ${ev.fb_open ? 'on' : ''}" id="fbSwitch" role="switch" aria-checked="${!!ev.fb_open}" aria-label="${t('fbToggle')}"><span></span></button></div>
    <div class="card qr-card"><div class="qr-row"><canvas id="qrPrev" width="132" height="132" aria-label="QR"></canvas>
      <div><b>📱 ${t('fbQr')}</b><p class="muted" style="margin:2px 0 10px">${t('fbQrSub')}</p><button class="btn small primary" id="qrDl">📥 ${t('dlQr')}</button></div></div></div>
    ${list.length ? `<button class="btn wide" id="fbXl" style="margin-bottom:12px">📥 ${t('exportFb')}</button>` : ''}
    <div class="card"><div class="list">${list.map(f => `<div class="li fb-item"><span class="mood-i">${moods[f.mood] || '💬'}</span>
      <span class="grow"><b>${f.kid_name ? esc(f.kid_name) : t('anon')}</b><span class="sub">${new Date(f.created_at).toLocaleString(getLang() === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      <span style="display:block;margin-top:4px">${esc(f.message)}</span></span></div>`).join('') || `<p class="muted">${t('none')}</p>`}</div></div>`;
  const hadNew = list.some(f => f.created_at > (localStorage.getItem(pkey('ya_fb_seen')) || ''));
  if (list[0]) localStorage.setItem(pkey('ya_fb_seen'), list[0].created_at);
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
  const fbUrl = location.href.split('#')[0] + '#/feedback';
  loadQR().then(qrcode => drawQR($('#qrPrev'), fbUrl, qrcode, false)).catch(console.error);
  $('#qrDl').onclick = async () => {
    try {
      const qrcode = await loadQR(); await document.fonts?.load?.('700 40px "Noto Sans Thai"').catch(() => {});
      const c = document.createElement('canvas'); drawQR(c, fbUrl, qrcode, true);
      const a = document.createElement('a'); a.download = 'youth-alpha-feedback-qr.png'; a.href = c.toDataURL('image/png'); a.click();
    } catch (e) { fail(e); }
  };
}
// QR code (library kept in /vendor, loaded only here)
function loadQR() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'vendor/qrcode.js'; sc.onload = () => res(window.qrcode); sc.onerror = rej; document.head.appendChild(sc); });
}
function drawQR(canvas, text, qrcode, poster) {
  const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), quiet = 4;
  const cell = poster ? Math.floor(760 / (n + quiet * 2)) : Math.floor(canvas.width / (n + quiet * 2));
  const size = cell * (n + quiet * 2), top = poster ? 170 : 0, W = poster ? 1000 : size, H = poster ? size + 330 : size;
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const ox = (W - size) / 2;
  g.fillStyle = '#1b2a5c';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect(ox + (c + quiet) * cell, top + (r + quiet) * cell, cell, cell);
  if (!poster) return;
  g.textAlign = 'center'; g.fillStyle = '#1b2a5c';
  g.font = '700 64px "Noto Sans Thai", sans-serif'; g.fillText('💬 ' + t('qrCaption'), W / 2, 110);
  g.font = '700 46px "Noto Sans Thai", sans-serif'; g.fillText('🎄 Youth Alpha', W / 2, top + size + 80);
  g.font = '400 28px "Noto Sans Thai", sans-serif'; g.fillStyle = '#5a6a8f'; g.fillText(text, W / 2, top + size + 135);
}

// ---------------- Music switches (admin): turn each music feature on or off for the kids
async function pMusicSet() {
  const cur = { ...((await api.settings()).music || {}) };
  const row = ([k, i]) => `<div class="tg-row">
      <span class="tg-i">${i}</span><span class="tg-t"><b>${t('mo_' + k)}</b>${t('mos_' + k) !== 'mos_' + k ? `<span>${t('mos_' + k)}</span>` : ''}</span>
      <button class="switch ${cur[k] !== false ? 'on' : ''}" data-mo="${k}" role="switch" aria-checked="${cur[k] !== false}" aria-label="${t('mo_' + k)}"><span></span></button></div>`;
  const draw = () => {
    const simple = cur.simpleSongs === true;
    view.innerHTML = `${pageHead(t('tab_settings'))}
      <div class="card toggles simple-card"><div class="tg-row"><span class="tg-i">📄</span><span class="tg-t"><b>${t('simpleSongs')}</b><span>${t('simpleSongsSub')}</span></span>
        <button class="switch ${simple ? 'on' : ''}" id="swSimple" role="switch" aria-checked="${simple}" aria-label="${t('simpleSongs')}"><span></span></button></div></div>
      <h2 class="grp">${t('mg_app')}</h2><div class="card toggles">${MUSIC_GROUPS[0][1].map(row).join('')}</div>
      <h2 class="grp">${t('ms_player')}</h2>
      ${simple ? `<p class="simple-note">✅ ${t('simpleOnNote2')}</p>` : ''}
      <div class="${simple ? 'dimmed' : ''}">${PLAYER_GROUPS.map(([g, items]) => `<details class="card toggles sw-card" ${simple ? '' : 'open'}><summary><b>${t(g)}</b><span class="muted">${items.filter(([k]) => cur[k] !== false).length} / ${items.length}</span><span class="chev">›</span></summary>${items.map(row).join('')}</details>`).join('')}</div>
      <p class="muted" style="margin:6px 4px 0">${t('moNote')}</p>`;
    $('#swSimple').onclick = async (e) => {
      const b = e.currentTarget, on = !simple; b.disabled = true;
      try { cur.simpleSongs = on; await api.saveSettings({ music: cur }); evCache = null; toast(`${t('simpleSongs')} · ${on ? t('moOn') : t('moOff')}`); draw(); }
      catch (err) { cur.simpleSongs = simple; fail(err); b.disabled = false; }
    };
    view.querySelectorAll('[data-mo]').forEach(b => b.onclick = async () => {
      const k = b.dataset.mo, on = cur[k] === false;
      b.disabled = true;
      try {
        cur[k] = on; await api.saveSettings({ music: cur }); evCache = null;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
        toast(`${t('mo_' + k)} · ${on ? t('moOn') : t('moOff')}`);
      } catch (e) { cur[k] = !on; fail(e); }
      b.disabled = false;
    });
  };
  draw();
}

// ---------------- Settings (admin): all timings in one place
async function pSettings() {
  const s = await api.settings();
  view.innerHTML = `${pageHead(t('tab_settings'))}
    <div class="card"><h3 class="sec">👆 ${t('secTips')}</h3>
      <div class="field"><label>${t('tipDays')}</label><input class="input" id="tips" type="number" min="0" max="60" value="${s.tip_days ?? 3}"></div></div>
    <div class="card"><h3 class="sec">⭐ ${t('secPoints')}</h3>
      <div class="field"><label>${t('attPoints')}</label><input class="input" id="ap" type="number" min="0" max="1000" value="${s.attendance_points}"></div></div>
    <div class="card toggles" style="padding-top:14px"><h3 class="sec">🏠 ${t('secHomeCount')}</h3>
      <div class="tg-row"><span class="tg-i">👀</span><span class="tg-t"><b>${t('swVisits')}</b><span>${t('swVisitsSub')}</span></span>
        <button class="switch ${s.show_visits ? 'on' : ''}" data-sw="show_visits" role="switch" aria-checked="${!!s.show_visits}" aria-label="${t('swVisits')}"><span></span></button></div>
      <div class="tg-row"><span class="tg-i">💬</span><span class="tg-t"><b>${t('swFbCount')}</b><span>${t('swFbCountSub')}</span></span>
        <button class="switch ${s.show_fb_count ? 'on' : ''}" data-sw="show_fb_count" role="switch" aria-checked="${!!s.show_fb_count}" aria-label="${t('swFbCount')}"><span></span></button></div>
    </div>
    <div class="bottom-bar"><button class="btn primary" id="saveSet">${t('save')}</button></div>`;
  $('#saveSet').onclick = async () => {
    const d = { tip_days: Math.max(0, Math.min(60, Math.trunc(Number($('#tips').value) || 0))), attendance_points: Math.max(0, Math.min(1000, Math.trunc(Number($('#ap').value) || 0))) };
    try { await api.saveSettings(d); evCache = null; toast(t('saved')); } catch (e) { fail(e); }
  };
  // v36: the two home-page counter switches save at once (each change goes to the admin log through the settings trigger)
  view.querySelectorAll('[data-sw]').forEach(btn => btn.onclick = async () => {
    const k = btn.dataset.sw, on = !btn.classList.contains('on');
    btn.disabled = true;
    try { await api.saveSettings({ [k]: on }); evCache = null; btn.classList.toggle('on', on); btn.setAttribute('aria-checked', on);
      toast(`${t(k === 'show_visits' ? 'swVisits' : 'swFbCount')} · ${t(on ? 'moOn' : 'moOff')}`); } catch (e) { fail(e); }
    btn.disabled = false;
  });
}

// ---------------- Export everything to Excel (.xlsx), built in the browser
const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => res(window.XLSX); s.onerror = rej; document.head.appendChild(s); });
}
// v38: "Attendance totals" was the same numbers as the summary per kid (removed); the activity summary now comes with "Kids' activity"
const XL_SHEETS = [['xs_summary', 'summary', '📊'], ['xs_points', 'points', '⭐'], ['xs_att', 'attendance', '✅'], ['xs_feedback', 'feedback', '💬'], ['xs_shop', 'shop', '🎁'], ['xs_redeem', 'prizes-given', '🎟️'],
  ['xs_adminlog', 'admin-log', '📜'], ['xs_kidlog', 'kid-activity', '👆'], ['xs_kidsum', 'kid-activity-summary', '📈']];
const LOG_SHEETS = ['xs_adminlog', 'xs_kidlog', 'xs_kidsum'];
const TBL = { songs: 'lt_songs', kids: 'lt_kids', points: 'lt_points', attendance: 'lt_att', attendance_rounds: 'lt_round', shop_items: 'lt_shop', point_categories: 'lt_pcats', settings: 'lt_settings', staff: 'lt_staff', staff_programs: 'lt_staffprog', kid_events: 'lt_kidlog', redemptions: 'lt_redeem', members: 'lt_members', programs: 'lt_programs' };
const SKIP_FIELDS = new Set(['updated_at', 'created_at', 'updated_by', 'given_by', 'created_by', 'finished_by', 'finished_at']);
// one admin-log row -> readable text
function describeLog(e, kidName) {
  const o = e.old_data || {}, n = e.new_data || {}, r = { ...o, ...n };
  const who = (id) => kidName[id] || '?';
  let item = '';
  switch (e.table_name) {
    case 'kids': item = r.nickname; break;
    case 'points': item = `${who(r.kid_id)} ${signed(r.amount)} ${cName(cOf(r.skill))}${r.detail ? ' (' + r.detail + ')' : ''}${r.note ? ' · ' + r.note : ''}`; break;
    case 'attendance': item = `${who(r.kid_id)} · ${r.day} · ${t(r.status) || r.status}`; break;
    case 'attendance_rounds': item = `${r.day} · ${r.finished ? t('finished') : t('reopen')}`; break;
    case 'shop_items': item = `${r.name} (${r.price} ⭐)`; break;
    case 'point_categories': item = r.name_th; break;
    case 'staff': item = r.display_name || r.role || (n.password_changed ? '🔑' : ''); break;
    case 'staff_programs': item = `${program.list.find(x => x.id === r.program_id)?.name || r.program_id}: ${(r.perms || []).map(k => t('perm_' + k)).join(', ') || t('permNone')}`; break;
    case 'kid_events': item = t('logCleared', r.rows_deleted ?? 0); break;
    case 'songs': item = r.title; break;
    case 'redemptions': item = `${who(r.kid_id)} · ${r.item_name} (−${r.price} ⭐)`; break;
    case 'members': item = `@${r.username || '?'}${r.kid_id ? ' · ' + who(r.kid_id) : ''}${n.password_changed ? ' · 🔑' : ''}`; break;
    case 'programs': item = r.name || ''; break;
    default: item = '';
  }
  let changes = '';
  const short = (v) => { const x = v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v); return x.length > 80 ? x.slice(0, 77) + '…' : x; };
  if (e.op === 'UPDATE') changes = Object.keys(n).filter(k => !SKIP_FIELDS.has(k) && JSON.stringify(o[k]) !== JSON.stringify(n[k]))
    .map(k => `${k}: ${short(o[k])} → ${short(n[k])}`).join(' ; ');
  else if (e.op === 'INSERT' && e.table_name === 'settings') changes = JSON.stringify(n);
  return { item, changes, op: t('op_' + e.op) || e.op, area: t(TBL[e.table_name] || '') || e.table_name };
}
const EVT_TH = ['open_app', 'view', 'tap_kid', 'tap_my_card', 'set_me', 'not_me', 'cat_info', 'shop_tap', 'bible_open', 'bible_link', 'theme_open', 'theme', 'lang', 'music', 'help_open', 'tour_next', 'tour_skip', 'tour_done', 'fb_pill', 'fb_open', 'fb_send', 'tree_tap',
  'songs', 'song_open', 'metro', 'autoscroll', 'song_speed', 'transpose', 'yt_play', 'sheet_view', 'credits', 'santa_tap', 'festive', 'pic_view', 'fb_qr', 'song_lang', 'prize_zoom', 'install', 'egg_hunt', 'member_login', 'member_logout', 'member_pw'];
const evName = (e) => EVT_TH.includes(e) ? t('ev_' + e) : e;

async function pExport() {
  // v38: one clean list (name + short line on the left, a full "Export" button on the right), nothing cut off on phones or PC
  const rows = (keys) => `<div class="xl-list">${keys.map(xlRow).join('')}</div>`;
  view.innerHTML = `${pageHead(t('tab_export'))}
    <div class="card xl-all"><button class="btn primary wide" data-x="all">📥 ${t('exportAll')}</button>
      <p class="muted">${t('exportAllSub')}</p></div>
    <h2 class="grp">${t('exportEach')}</h2>
    ${rows(XL_SHEETS.filter(([k]) => !LOG_SHEETS.includes(k) && xlOk(k)))}
    ${isSuper() ? `<h2 class="grp grp-super">👑 ${t('logsGrp')}</h2>
    ${rows(XL_SHEETS.filter(([k]) => LOG_SHEETS.includes(k) && k !== 'xs_kidsum'))}
    <p class="muted xl-note">🔒 ${t('adminLogNote')} · ${t('logsSuperNote')}</p>
    <h2 class="grp">${t('dangerZone')}</h2>
    <div class="card"><button class="btn danger wide" id="clearKid">🗑️ ${t('clearKidLog')}</button>
    <p class="muted xl-note">${t('clearKidNote')}</p></div>` : ''}`;
  view.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => {
    const keep = b.innerHTML; b.disabled = true; b.textContent = t('exporting');
    try { await buildExcel(b.dataset.x === 'all' ? null : b.dataset.x === 'xs_kidlog' ? ['xs_kidlog', 'xs_kidsum'] : [b.dataset.x]); } catch (err) { fail(err); }
    b.disabled = false; b.innerHTML = keep;
  });
  $('#clearKid')?.addEventListener('click', async () => {
    const r = await modal('⚠️ ' + t('warnTitle'), `<p style="white-space:pre-line;font-size:1.05rem">${esc(t('clearKidWarn'))}</p>
      <div class="field"><label>${t('password')}</label><input class="input" name="pw" type="password" required autocomplete="current-password"></div>`,
      { okText: t('clearNow'), danger: true });
    if (!(r instanceof FormData)) return;
    try {
      const r2 = await api.superStart((await api.superInfo())?.username || '', r.get('pw')); if (!r2?.ok) throw new Error('wrong');
    } catch { toast(t('errLogin')); return; }
    try { const n = await api.clearKidEvents(); toast(t('logCleared', n)); } catch (e) { fail(e); }
  });
}
// v32: logs are the super admin's; feedback needs the feedback permission
const xlOk = (k) => LOG_SHEETS.includes(k) ? isSuper() : k === 'xs_feedback' ? can('feedback') : true;
const xlRow = ([k, , i]) => `<div class="xl-item"><span class="mi">${i}</span><span class="xl-t"><b>${t(k)}</b><span>${t('xd_' + k.slice(3))}</span></span>
  <button class="btn small xl-btn" data-x="${k}">📥 ${t('exportOne')}</button></div>`;
async function buildExcel(only = null) {
  only = (only || XL_SHEETS.map(x => x[0])).filter(xlOk);
  const want = (k) => only.includes(k);
  const [XLSX, kids, rows, cats, pts, att, fb, shop, alog, kev] = await Promise.all([loadXLSX(), api.kids(), leaderboard(true), pcats(true), api.allPoints(),
    api.attendanceAll(), want('xs_feedback') ? api.feedback().catch(() => []) : [], api.shop(),
    want('xs_adminlog') ? api.auditAll() : [], (want('xs_kidlog') || want('xs_kidsum')) ? api.kidEvents() : []]);
  const kidName = Object.fromEntries(kids.map(k => [k.id, k.nickname]));
  const red = want('xs_redeem') ? await api.redemptions(5000) : [];
  const dt = (s) => s ? new Date(new Date(s).getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : ''; // Thai time, 2026-11-14 21:41
  const stTxt = { present: t('present'), leave: t('leave'), absent: t('absent') };
  const by = Object.fromEntries(rows.map(r => [r.id, r]));
  const attC = {}; att.forEach(r => { (attC[r.kid_id] ??= { present: 0, leave: 0, absent: 0 })[r.status]++; });
  const summary = kids.map(k => {
    const r = by[k.id] || { total: 0, skills: {} }, row = { [t('nickname')]: k.nickname, [t('group').replace(/ \(.*\)/, '')]: k.grp, [t('xc_total')]: r.total, [t('xc_spent')]: r.spent || 0, [t('canSpend')]: bal(r) };
    cats.forEach(c => { row[cName(c)] = r.skills?.[c.key] || 0; });
    const a = attC[k.id] || { present: 0, leave: 0, absent: 0 };
    Object.assign(row, { [t('present')]: a.present, [t('leave')]: a.leave, [t('absent')]: a.absent });
    return row;
  }).sort((a, b) => b[t('xc_total')] - a[t('xc_total')]);
  const sheets = [
    ['xs_summary', summary],
    ['xs_points', pts.map(p => ({ [t('date')]: dt(p.created_at), [t('nickname')]: p.kids?.nickname || kidName[p.kid_id] || '', [t('category')]: cName(cOf(p.skill)), [t('xc_detail')]: p.detail || '', [t('xc_points')]: p.amount, [t('note')]: p.note || '' }))],
    ['xs_att', [...att].sort((a, b) => a.day.localeCompare(b.day)).map(r => ({ [t('date')]: r.day, [t('nickname')]: kidName[r.kid_id] || '', [t('xc_status')]: stTxt[r.status] }))],
    ['xs_feedback', fb.map(f => ({ [t('date')]: dt(f.created_at), [t('nickname')]: f.kid_name || t('anon'), [t('xc_mood')]: ['', '😢', '😐', '🙂', '😄'][f.mood] || '', [t('xc_msg')]: f.message }))],
    ['xs_adminlog', alog.map(e => { const d = describeLog(e, kidName); return { [t('xc_time')]: dt(e.created_at), [t('xc_admin')]: e.actor_email || t('lt_system'), [t('xc_action')]: d.op, [t('xc_area')]: d.area, [t('xc_item')]: d.item || '', [t('xc_changes')]: d.changes, [t('xc_key')]: e.row_key }; })],
    ['xs_kidlog', kev.map(e => ({ [t('xc_time')]: dt(e.created_at), [t('xc_device')]: e.device_id, [t('nickname')]: kidName[e.kid_id] || '', [t('xc_event')]: evName(e.event), [t('xc_eventcode')]: e.event, [t('xc_detail')]: e.detail, [t('xc_page')]: e.path }))],
    ['xs_kidsum', (() => { const m = {}; kev.forEach(e => { const x = (m[e.event] ??= { n: 0, d: new Set(), k: new Set() }); x.n++; x.d.add(e.device_id); if (e.kid_id) x.k.add(e.kid_id); });
      return Object.entries(m).sort((a, b) => b[1].n - a[1].n).map(([ev, x]) => ({ [t('xc_event')]: evName(ev), [t('xc_eventcode')]: ev, [t('xc_count')]: x.n, [t('xc_devices')]: x.d.size, [t('xc_kids')]: x.k.size })); })()],
    ['xs_redeem', red.map(r => ({ [t('date')]: dt(r.created_at), [t('nickname')]: r.kids?.nickname || kidName[r.kid_id] || '', [t('itemName')]: r.item_name, [t('xc_points')]: r.price }))],
    ['xs_shop', shop.items.map(i => ({ [t('itemName')]: i.name, [t('xc_points')]: i.price, [t('xc_shown')]: i.active ? '✓' : t('hidden') }))],
  ];
  const wb = XLSX.utils.book_new();
  for (const [k, data] of sheets.filter(([k]) => only.includes(k))) {
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ '-': t('none') }]);
    const cols = Object.keys(data[0] || { '-': 1 });
    ws['!cols'] = cols.map(c => ({ wch: Math.min(50, Math.max(c.length + 2, ...data.map(r => String(r[c] ?? '').length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, t(k).slice(0, 31));
  }
  const slug = (only.length === 1 || only.join() === 'xs_kidlog,xs_kidsum') ? (XL_SHEETS.find(s => s[0] === only[0])?.[1] + '-') : '';
  XLSX.writeFile(wb, `youth-alpha-${slug}${bkkToday()}.xlsx`);
}

// =============================================================== router
let renderSeq = 0;
async function render() {
  const seq = ++renderSeq, h = location.hash || '';
  if (DEMO && h.startsWith('#/admin')) { location.hash = '#/'; return; }   // v35 phone preview: kids' side only
  const isAdult = h.startsWith('#/admin');
  document.body.classList.toggle('adult', isAdult);
  // v35: on phones every kids' page except home opens full (over the tree); pull it down to see the tree
  document.body.classList.toggle('sheet-full', !isAdult && !!h && h !== '#/' && h !== '#/rank' && !/^#\/me(\/|$)/.test(h) && !h.startsWith('#/songs/'));
  document.body.classList.remove('tree-peek');
  document.body.classList.toggle('login-page', h === '#/login' && program.login === 'all');   // v31: no tabs on the sign-in page when sign-in is required
  $('#kidSheet').hidden = true;
  document.querySelectorAll('.lightbox').forEach(x => x.remove());
  stopPlayer();                                                   // leaving a song: stop scrolling / metronome / video
  syncCleanup?.(); syncCleanup = null;
  isAdult || !feat('snow') ? snow.stop() : snow.start();
  document.body.classList.remove('maint');
  paintChrome();
  try {
    // v37 maintenance mode: kids (and adults who are not the super admin) see only the maintenance scene
    if (!isAdult && maintOn() && !(await maintSuper())) return maintView();
    if (isAdult) { scene?.stop(); return await adultGate(h.split('/')[2]); }
    await Promise.all([feat('tree') ? ensureScene() : null, eventInfo()]);             // eventInfo: the admin's music switches
    if (seq !== renderSeq) return;
    // v31: in "all" mode a kid must be signed in first (adults signed in on this phone see everything)
    if (loginOn()) staffHere = !!(await api.session().catch(() => null));
    if (member.me && Date.now() - memberChecked > 60000 && navigator.onLine !== false) {   // an account switched off by an admin is noticed within a minute
      memberChecked = Date.now();
      try { if (!(await api.memberMe())) dropMember(); } catch (e) { console.error(e); }
    }
    if (h === '#/login') { track('view', 'login'); return await kidLogin(); }
    if (program.login === 'all' && !member.me && !staffHere) { location.hash = '#/login'; return; }
    const page = h === '#/shop' ? 'shop' : h === '#/menu' ? 'menu' : h.startsWith('#/songs') ? 'songs' : h === '#/feedback' ? 'feedback' : 'ranking';
    track('view', page);
    if ((h === '#/shop' && !feat('shop')) || (h === '#/feedback' && !feat('feedback'))) { location.hash = '#/'; return; }
    if (h === '#/shop') return await kidShop();
    if (h === '#/menu') return await kidMenu();
    if (h.startsWith('#/songs')) { await eventInfo(); if (!mo('songsTab') || !feat('songs')) { location.hash = '#/'; return; } }
    if (h === '#/songs') return await kidSongs();
    if (h.startsWith('#/songs/')) return await kidSong(h.split('/')[2]);
    if (h === '#/feedback') return await kidFeedbackPage();
    if (h.startsWith('#/me') || h === '#/rank') { history.replaceState(null, '', '#/'); }
    return await kidRank();
  } catch (e) { fail(e); view.innerHTML = `<p class="empty">${t('errGeneric')}</p>`; }
  finally { paintOffline(); addGrab(); paintMaintBar(); }
}
// a quiet line when the phone has no internet and saved data is being shown (kid pages only)
function paintOffline() {
  const bar = $('#offBar'), off = kidSide() && (navigator.onLine === false || net.stale);
  bar.hidden = !off; if (off) bar.textContent = '📴 ' + t('offlineBar');
}
window.addEventListener('offline', paintOffline);
window.addEventListener('online', () => { const was = !$('#offBar').hidden; net.stale = false; paintOffline(); if (was && kidSide() && !document.body.classList.contains('song-page') && $('#kidSheet').hidden) render(); });
setTimeout(maybeTour, 1800);
window.addEventListener('hashchange', () => {
  if (location.hash === '#/admin/points') pw = { step: 1, skill: null, detail: '', amount: null, sel: new Set() };
  window.scrollTo(0, 0); render();
});
// re-draw admin pages only when someone signs in / out (not on token refresh)
api.onAuth?.((event) => { maintSup = null; if (location.hash.startsWith('#/admin') && (!event || event === 'SIGNED_IN' || event === 'SIGNED_OUT')) render(); });
// ---------- v37 (roadmap step 7): maintenance mode per program (programs.maintenance, supabase/023_maintenance.sql)
// Switched by the super admin on the Programs page. While it is on, kids and every adult who is not the super admin see
// only a full-screen scene (no tabs, no menus, no pop-ups): "Under maintenance", a colour switch and a sound switch.
// The database refuses every write in that program from anyone but the super admin. The super admin sees a thin bar.
const maintOn = () => program.maintenance?.on === true;
let maintSup = null;                                             // is this device's adult the super admin? (null = not asked yet)
async function maintSuper() {
  if (maintSup !== null) return maintSup;
  try { maintSup = !!(await api.session()) && (await api.myRole()) === 'superadmin'; } catch { maintSup = false; }
  return maintSup;
}
const MAINT_ART = {
  tree: `<svg class="mt-art" viewBox="0 0 300 260" aria-hidden="true">
    <ellipse cx="150" cy="242" rx="125" ry="13" fill="#fff" opacity=".5"/>
    <rect x="138" y="204" width="24" height="34" rx="4" fill="#7a4a24"/>
    <polygon points="150,42 82,128 218,128" fill="#2f9a55"/><polygon points="150,78 64,176 236,176" fill="#278a4b"/><polygon points="150,116 46,214 254,214" fill="#1f7741"/>
    <path d="M102 112 Q150 136 196 108 M86 160 Q150 188 214 156 M70 200 Q150 228 232 196" stroke="#f3d27a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>
    <g class="mt-lights">${[[118,118,'#ff5d6c'],[176,114,'#5ec8ff'],[150,128,'#ffd54a'],[100,166,'#ffd54a'],[134,176,'#ff8ad8'],[170,174,'#7dff9b'],[204,164,'#ff5d6c'],[84,206,'#5ec8ff'],[118,216,'#ff5d6c'],[156,218,'#ffd54a'],[194,214,'#ff8ad8'],[226,202,'#7dff9b']]
      .map(([x, y, c], i) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" style="animation-delay:${(i % 4) * .4}s"/>`).join('')}</g>
    <polygon class="mt-star" points="150,14 155,29 171,29 158,38 163,53 150,44 137,53 142,38 129,29 145,29" fill="#ffd54a"/>
    <rect x="58" y="214" width="34" height="26" rx="3" fill="#e2463d"/><rect x="72" y="214" width="6" height="26" fill="#ffd54a"/>
    <rect x="206" y="218" width="40" height="22" rx="3" fill="#3f7be0"/><rect x="223" y="218" width="6" height="22" fill="#fff"/></svg>`,
  bunny: `<svg class="mt-art" viewBox="0 0 300 260" aria-hidden="true">
    <path d="M0 226 Q80 196 150 212 T300 206 V260 H0 Z" fill="#7cc576"/>
    ${[[30,226,'#ffd54a'],[52,234,'#ff8ad8'],[262,222,'#fff'],[282,236,'#ffd54a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/>`).join('')}
    <ellipse cx="96" cy="222" rx="58" ry="16" fill="#9a6a3a"/>
    <g class="mt-eggs">
      <g style="animation-delay:0s"><ellipse cx="72" cy="206" rx="15" ry="20" fill="#ff9ec7"/><path d="M58 204 l7 -5 7 5 7 -5 7 5" stroke="#fff" stroke-width="3" fill="none"/></g>
      <g style="animation-delay:.5s"><ellipse cx="98" cy="200" rx="16" ry="21" fill="#8fd3ff"/><circle cx="92" cy="194" r="3" fill="#fff"/><circle cx="104" cy="204" r="3" fill="#fff"/><circle cx="96" cy="210" r="3" fill="#fff"/></g>
      <g style="animation-delay:1s"><ellipse cx="124" cy="206" rx="15" ry="20" fill="#ffe27a"/><path d="M110 206 h28" stroke="#ff8a5c" stroke-width="4"/></g>
    </g>
    <ellipse cx="96" cy="226" rx="60" ry="10" fill="#7d5229"/>
    <g class="mt-bunny">
      <ellipse cx="208" cy="190" rx="42" ry="40" fill="#f6f2ee"/><circle cx="250" cy="200" r="10" fill="#fff"/>
      <g class="mt-ears"><ellipse cx="186" cy="92" rx="10" ry="32" fill="#f6f2ee" transform="rotate(-12 186 92)"/><ellipse cx="186" cy="94" rx="5" ry="22" fill="#ffc1d6" transform="rotate(-12 186 94)"/>
        <ellipse cx="214" cy="90" rx="10" ry="32" fill="#f6f2ee" transform="rotate(12 214 90)"/><ellipse cx="214" cy="92" rx="5" ry="22" fill="#ffc1d6" transform="rotate(12 214 92)"/></g>
      <circle cx="198" cy="138" r="30" fill="#f6f2ee"/>
      <circle cx="188" cy="134" r="4" fill="#2b2b3a"/><circle cx="208" cy="134" r="4" fill="#2b2b3a"/>
      <ellipse cx="198" cy="145" rx="4" ry="3" fill="#ff8fb1"/><circle cx="180" cy="146" r="5" fill="#ffd0de"/><circle cx="216" cy="146" r="5" fill="#ffd0de"/>
      <ellipse cx="186" cy="228" rx="14" ry="7" fill="#fff"/><ellipse cx="226" cy="228" rx="14" ry="7" fill="#fff"/></g></svg>`,
};
function maintView() {
  const sc = program.maintenance?.scene === 'bunny' ? 'bunny' : 'tree';
  const b = document.body;
  b.classList.add('maint'); b.classList.remove('adult', 'sheet-full', 'song-page'); setSide(null);
  scene?.stop?.(); $('#kidSheet').hidden = true;
  sc === 'tree' ? snow.start() : snow.stop();
  music.setAllowed(false);                                        // v38: no sound button any more, so no music either
  // v38: no buttons on the maintenance scene (owner's request): just the picture and the words
  view.innerHTML = `<section class="maint-scene ${sc}">${MAINT_ART[sc]}
    <h1 class="mt-title">🛠️ ${t('mtTitle')}</h1><p class="mt-sub">${t('mtSub')}</p></section>`;
}
// the super admin's reminder: a thin bar on every page while the program is in maintenance
function paintMaintBar() {
  let bar = $('#maintBar');
  const show = maintOn() && !document.body.classList.contains('maint') && (isSuper() || maintSup === true);
  if (!show) { if (bar) bar.hidden = true; return; }
  if (!bar) {
    bar = document.createElement('button'); bar.id = 'maintBar'; bar.type = 'button'; bar.className = 'maint-bar'; $('#offBar').before(bar);
    bar.onclick = endMaintFromBar;
  }
  bar.hidden = false; bar.textContent = '🛠️ ' + t('mtBar');
}
// v38: tapping the orange bar really ends maintenance (after a warning that names the program); only the super admin may
async function endMaintFromBar() {
  if (!isSuper() && maintSup !== true) return;
  if (!(await confirmBox(t('mtWarnOff', program.name), t('mtTurnOff'), false))) return;
  const scene = program.maintenance?.scene === 'bunny' ? 'bunny' : 'tree';
  try {
    await api.programSetMaint(program.id, false, scene);
    program.maintenance = { on: false, scene };
    const row = program.list.find(x => x.id === program.id); if (row) row.maintenance = program.maintenance;
    try { Object.keys(localStorage).filter(k => k.includes('programs')).forEach(k => localStorage.removeItem(k)); } catch {}
    paintMaintBar(); toast('✓ ' + t('mtDoneOff', program.name)); render();
  } catch (e) { fail(e); }
}
// an app left open notices the switch within about two minutes
setInterval(async () => {
  if (document.visibilityState !== 'visible' || DEMO || navigator.onLine === false) return;
  let list; try { list = await api.programs(); } catch { return; }
  const pr = list.find(x => x.id === program.id); if (!pr) return;
  const was = maintOn(); program.maintenance = pr.maintenance || {};
  if (was === maintOn()) return;
  if (isSuper() || maintSup === true) paintMaintBar(); else location.reload();
}, 120000);

// which program this link opens (?p=<slug>); everything below reads and writes only that program
async function loadProgram() {
  const want = (new URLSearchParams(location.search).get('p') || '').trim().toLowerCase();
  let list = [];
  try { list = await cached('programs', () => api.programs()); } catch (e) { console.error(e); }
  program.list = list;
  const pr = want ? list.find(x => x.slug === want) : list.find(x => x.id === 1);
  if (pr) Object.assign(program, { id: pr.id, slug: pr.slug, name: pr.name, look: pr.look || {}, maintenance: pr.maintenance || {} });
  else if (want) setTimeout(() => toast(t('progUnknown')), 600);
  window.YA_PID = program.id;
  applyLook();
  await memberStart();                                            // v31 member login
}
// ---- v28 program settings (programs.look; set on the super admin page, see supabase/019_program_look.sql)
// look = { title, emoji, pack, font, size, off: { songs, shop, feedback, bible, santa, festive, snow, tree, music }, words: { th: {}, en: {} } }
const LOOK = {
  FONTS: { noto: 'Noto Sans Thai', sarabun: 'Sarabun', kanit: 'Kanit', mitr: 'Mitr', prompt: 'Prompt' },
  FEATS: [['songs', '🎵'], ['shop', '🎁'], ['feedback', '💬'], ['bible', '📖'], ['music', '🔔'], ['tree', '🌲'], ['snow', '❄️'], ['santa', '🎅'], ['festive', '✨']],
  // the text an admin can change per program (others keep the normal wording)
  WORDS: ['ranking', 'songs', 'shop', 'menu', 'songsTitle', 'shopTitle', 'shopSub', 'santaHo'],
  // theme packs: default emoji + wording that fits the pack (the program's own wording still wins)
  // v29 layout editor: default order of each list; LOCKED items cannot be hidden (the way home / to the adults' area)
  LAYOUT: {
    tabs: [['rank', '🏆', 'ranking'], ['songs', '🎵', 'songs'], ['shop', '🎁', 'shop'], ['menu', '☰', 'menu']],
    home: [['notice', '📣', 'lay_notice'], ['me', '⭐', 'lay_me'], ['rank', '🏆', 'lay_rank'], ['verse', '📖', 'lay_verse']],
    menu: [['account', '👤', 'lay_account'], ['fb', '💬', 'fb'], ['bible', '📖', 'bible'], ['credits', '🎵', 'songCredits'], ['lang', '🌐', 'language'], ['install', '📲', 'installApp'], ['help', '❓', 'help'], ['adult', '🔒', 'adults']],
  },
  LOCKED: { tabs: ['rank', 'menu'], home: ['rank'], menu: ['adult', 'account'] },
  PACKS: {
    christmas: { emoji: '🎄', mascot: '🎅', gift: '🎁', things: ['🎁', '🎁', '🎁', '🎀', '⭐', '✨', '🎁', '🍬', '🧸', '🎄'], words: {} },
    plain: { emoji: '⛪', mascot: '🕊️', gift: '✨', things: ['✨', '⭐', '🕊️', '💛', '🌟'], words: { th: { songsTitle: 'เพลงนมัสการ' }, en: { songsTitle: 'Worship songs' } } },
    // v30: Easter — cross on a hill in 3D, Easter Hymn, egg hunt in the special mode, a lamb peeks in instead of Santa
    easter: { emoji: '🐣', mascot: '🐑', gift: '🥚', things: ['🥚', '🐣', '🌷', '🌸', '✨', '🥚', '🌼', '🦋', '🥚', '🌷'],
      words: { th: { songsTitle: 'เพลงอีสเตอร์', santaHo: 'สุขสันต์วันอีสเตอร์!', joyTitle: 'พระเยซูทรงคืนพระชนม์!' },
               en: { songsTitle: 'Easter songs', santaHo: 'Happy Easter!', joyTitle: 'He is risen!' } } },
  },
};
// v34: each playful part has its own choice instead of on/off: look.parts = { fall, scene, friend, special, music }
// ('off' = switched off). A program saved before v34 has no parts: the choice comes from its pack and its old off-switch.
LOOK.PARTS = {
  fall: { old: 'snow', icon: '❄️', opts: { snow: '❄️', petals: '🌸' } },
  scene: { old: 'tree', icon: '🌲', opts: { tree: '🎄', cross: '✝️' } },
  friend: { old: 'santa', icon: '🎅', opts: { santa: '🎅', lamb: '🐑', dove: '🕊️' } },
  special: { old: 'festive', icon: '✨', opts: { gifts: '🎁', eggs: '🥚' } },
  music: { old: 'music', icon: '🔔', opts: { jingle: '🔔', easter: '🎺' } },
};
LOOK.PACK_PARTS = {
  christmas: { fall: 'snow', scene: 'tree', friend: 'santa', special: 'gifts', music: 'jingle' },
  easter: { fall: 'petals', scene: 'cross', friend: 'lamb', special: 'eggs', music: 'easter' },
  plain: { fall: 'snow', scene: 'tree', friend: 'dove', special: 'gifts', music: 'jingle' },
};
LOOK.FRIENDS = { santa: { gift: '🎁', label: 'Santa' }, lamb: { gift: '🥚', label: 'Lamb' }, dove: { gift: '✨', label: 'Dove' } };
function partOf(look, k) {
  const L = look || {}, P = LOOK.PARTS[k], v = L.parts?.[k];
  if (v === 'off' || P.opts[v]) return v;
  if (L.off?.[P.old] === true) return 'off';
  return (LOOK.PACK_PARTS[L.pack] || LOOK.PACK_PARTS.christmas)[k];
}
const part = (k) => partOf(program.look, k);
// v34: the program's logo, ready to show (only https picture addresses, or data: pictures in the preview copy)
function logoOf(L) {
  const g = L?.logo || {}, url = typeof g.url === 'string' ? g.url : '';
  const img = g.type === 'image' && /^(https:\/\/|data:image\/)/.test(url);
  return { img, url, size: Math.min(2, Math.max(0.6, Number(g.size) || 1)) };
}
const OLD_PART = Object.fromEntries(Object.entries(LOOK.PARTS).map(([k, p]) => [p.old, k]));
const feat = (k) => OLD_PART[k] ? part(OLD_PART[k]) !== 'off' : program.look?.off?.[k] !== true;
const packInfo = () => {
  const f = part('friend'), fr = LOOK.FRIENDS[f] || LOOK.FRIENDS.santa;
  return { mascot: LOOK.PARTS.friend.opts[f] || '🎅', gift: fr.gift, label: fr.label,
    things: (part('special') === 'eggs' ? LOOK.PACKS.easter : LOOK.PACKS.christmas).things };
};
// v29: keys of one list (tabs | home | menu) in the program's order, without the hidden ones
function layKeys(kind, withHidden = false) {
  const lay = program.look?.layout || {}, all = LOOK.LAYOUT[kind].map(x => x[0]);
  const order = [...(lay[kind] || []).filter(k => all.includes(k)), ...all.filter(k => !(lay[kind] || []).includes(k))];
  const hide = new Set((lay.hide?.[kind] || []).filter(k => !LOOK.LOCKED[kind].includes(k)));
  return withHidden ? order : order.filter(k => !hide.has(k));
}
function applyLook() {
  const L = program.look || {}, pack = LOOK.PACKS[L.pack] || LOOK.PACKS.christmas;
  // v34: the greeting follows the peeking friend and the special-mode title follows the special mode, whatever the pack
  const pw = { th: { ...pack.words.th }, en: { ...pack.words.en } }, E = LOOK.PACKS.easter.words;
  ['th', 'en'].forEach(l => { delete pw[l].santaHo; delete pw[l].joyTitle;
    if (part('friend') === 'lamb') pw[l].santaHo = E[l].santaHo;
    if (part('special') === 'eggs') pw[l].joyTitle = E[l].joyTitle; });
  setOverrides({ th: { ...pw.th, ...L.words?.th }, en: { ...pw.en, ...L.words?.en } });
  const title = (L.title || '').trim() || 'Youth Alpha', emoji = (L.emoji || '').trim() || pack.emoji;
  // v34 logo: an emoji (default) or an uploaded picture (look.logo = { type: 'emoji' | 'image', url, size 0.6–2 })
  const lg = logoOf(L), bt = $('.brand-tree'), rs = document.documentElement.style;
  if (lg.img) bt.innerHTML = `<img src="${esc(lg.url)}" alt="">`; else bt.textContent = emoji;
  bt.nextElementSibling.textContent = title;
  document.title = `${title} ${emoji}`;
  document.body.classList.toggle('logo-img', lg.img);
  rs.setProperty('--logo-size', String(lg.size));
  rs.setProperty('--look-emoji', lg.img ? '""' : JSON.stringify(emoji));   // shown big when the 3D scene is off
  if (lg.img) rs.setProperty('--look-img', `url(${JSON.stringify(lg.url)})`); else rs.removeProperty('--look-img');
  const f = LOOK.FONTS[L.font], root = document.documentElement;
  if (f && L.font !== 'noto' && !document.querySelector(`link[data-font="${L.font}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.dataset.font = L.font;
    l.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
    document.head.appendChild(l);
  }
  if (f) root.style.setProperty('--font', `'${f}', 'Noto Sans Thai', 'Sarabun', system-ui, sans-serif`); else root.style.removeProperty('--font');
  const size = Math.min(1.3, Math.max(0.9, Number(L.size) || 1));
  root.style.fontSize = size === 1 ? '' : (18 * size).toFixed(1) + 'px';
  document.body.dataset.pack = LOOK.PACKS[L.pack] ? L.pack : 'christmas';
  document.body.dataset.mode = L.mode === 'normal' ? 'normal' : 'kids';      // v33: Kids mode / Normal mode (per program, set by the super admin)
  calmNav(); calmSoon();
  document.body.dataset.fall = part('fall');                          // v34: petals colour for the falling layer
  music.setPack?.(part('music') === 'easter' ? 'easter' : 'christmas');
  LOOK.FEATS.forEach(([k]) => document.body.classList.toggle('off-' + k, !feat(k)));
  const nav = $('#kidNav'), shown = layKeys('tabs');                  // v29: bottom tab order and hidden tabs
  layKeys('tabs', true).forEach(k => { const a = nav.querySelector(`[data-nav="${k}"]`); if (a) { nav.appendChild(a); a.classList.toggle('lay-hide', !shown.includes(k)); } });
  if (!feat('tree')) scene?.stop();
  if (!feat('snow')) snow.stop();
  applyAppOpts?.();
}
await loadProgram();
render();
// opened from the super admin's emailed sign-in link: wait for the sign-in, then go to the super admin page
if (window.YA_LINK) (async () => {
  if (/error/.test(window.YA_LINK) && !/access_token/.test(window.YA_LINK)) { location.hash = '#/admin'; toast(t('saLinkBad')); return; }
  for (let i = 0; i < 40 && !(await api.session()); i++) await new Promise(r => setTimeout(r, 250));
  await new Promise(r => setTimeout(r, 300));
  location.hash = '#/admin/super';
})();
eventInfo().catch(() => {});                                    // admin music switches (background music, songs tab…)
if (location.hash === '#/feedback') track('fb_qr');
santaSoon(true);
track('open_app', `${document.body.dataset.theme} · ${getLang()} · ${matchMedia('(display-mode: standalone)').matches ? 'installed' : 'browser'} · ${innerWidth}x${innerHeight}`);
let lastTree = 0;
$('#scene').addEventListener('click', () => { if (Date.now() - lastTree > 3000) { lastTree = Date.now(); track('tree_tap'); } treeTapped(); });

if (!DEMO && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});

// =============================================================== v35: kids' pages open full on phones
// body.sheet-full (set in render) lifts the page sheet over the tree (CSS, phones only, Kids mode only).
// Pulling the page down at the top (or tapping the little bar) shows the tree again (body.tree-peek); tap the bar to go back.
function addGrab() {
  const sh = document.body.classList.contains('sheet-full') && view.querySelector(':scope > .sheet:not(.song-sheet)');
  if (!sh || sh.querySelector(':scope > .sheet-grab')) return;
  sh.insertAdjacentHTML('afterbegin', `<button type="button" class="sheet-grab" aria-label="${t('sheetGrab')}"></button>`);
  sh.firstElementChild.onclick = () => treePeek(!document.body.classList.contains('tree-peek'));
}
function treePeek(on) {
  const b = document.body; b.classList.add('peek-anim'); b.classList.toggle('tree-peek', on);
  if (!on) window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => b.classList.remove('peek-anim'), 360);
  if (on) track('tree_peek');
}
(function sheetPull() {
  let y0 = null, dy = 0, sh = null;
  const can = () => { const b = document.body; return b.classList.contains('sheet-full') && !b.classList.contains('tree-peek') && b.dataset.mode !== 'normal' && matchMedia('(max-width: 760px)').matches; };
  document.addEventListener('touchstart', (e) => {
    sh = can() && window.scrollY <= 0 && e.touches.length === 1 && !e.target.closest('input, textarea, select, iframe') ? e.target.closest('main > .sheet:not(.song-sheet)') : null;
    y0 = sh ? e.touches[0].clientY : null; dy = 0;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (dy <= 0 || window.scrollY > 0) { sh.style.transform = ''; return; }      // moving up = normal scrolling
    e.preventDefault(); sh.style.transform = `translateY(${Math.min(dy * 0.6, 260)}px)`;
  }, { passive: false });
  const end = () => {
    if (y0 == null) return;
    const el = sh; y0 = null;
    if (dy > 70) { treePeek(true); el.style.transform = ''; return; }
    el.style.transition = 'transform .25s ease'; el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 260);
  };
  document.addEventListener('touchend', end); document.addEventListener('touchcancel', end);
})();

// =============================================================== v35: real mobile preview (the kids' app with sample data)
// phoneFrame(box) draws a phone frame with the real app opened as index.html?demo=1 (js/demo.js: sample kids, points, songs,
// prizes; nothing is saved). The frame reads window.YA_DEMO_PROGRAM (name + look) from this page when it starts.
// Returns { update(look) }: unsaved settings are shown at once (look.pack / parts / mode / font changes reload the frame).
function phoneFrame(box, { lazy = false } = {}) {
  const SIZES = { phone: [390, 800], tablet: [768, 1024] };
  let size = 'phone', look = program.look || {}, loaded = false;
  const sig = (L) => JSON.stringify([L.pack || 'christmas', L.mode === 'normal' ? 'normal' : 'kids', L.font || 'noto', Object.keys(LOOK.PARTS).map(k => partOf(L, k))]);
  let lastSig = sig(look);
  box.innerHTML = `<div class="pf-bar"><span class="pf-tag">👀 ${t('pfSample')}</span>
      <span class="pf-sz">${Object.keys(SIZES).map(k => `<button type="button" class="chip ${k === size ? 'on' : ''}" data-sz="${k}">${t('pf_' + k)}</button>`).join('')}</span>
      <button type="button" class="btn small" data-pf="reload">🔄 ${t('pfReload')}</button></div>
    <div class="pf-stage"><div class="pf-phone"><iframe title="${esc(t('tab_phone'))}" loading="lazy"></iframe></div></div>`;
  const stage = box.querySelector('.pf-stage'), ph = box.querySelector('.pf-phone'), fr = box.querySelector('iframe');
  const fit = () => {
    const [w, h] = SIZES[size], pad = 24, avail = stage.clientWidth || 360;
    const sc = Math.min(1, avail / (w + pad), (innerHeight * 0.82) / (h + pad));
    fr.style.width = w + 'px'; fr.style.height = h + 'px';
    ph.style.width = (w + pad) + 'px'; ph.style.height = (h + pad) + 'px'; ph.style.transform = `scale(${sc})`;
    stage.style.height = Math.ceil((h + pad) * sc) + 'px';
  };
  const load = () => {
    window.YA_DEMO_PROGRAM = { name: program.name, look: JSON.parse(JSON.stringify(look)) };
    loaded = true; fr.src = location.pathname + '?demo=1&r=' + Date.now() + '#/';   // r = always a fresh start
  };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sz) { size = b.dataset.sz; box.querySelectorAll('[data-sz]').forEach(x => x.classList.toggle('on', x === b)); fit(); }
    if (b.dataset.pf === 'reload') load();
  });
  new ResizeObserver(fit).observe(stage); fit();
  if (!lazy) load();
  return {
    load: () => { if (!loaded) load(); },
    update(L) {
      look = L || {};
      window.YA_DEMO_PROGRAM = { name: program.name, look: JSON.parse(JSON.stringify(look)) };
      if (!loaded) return;
      const sg = sig(look);
      if (sg !== lastSig) { lastSig = sg; load(); return; }               // 3D scene, music, fonts: start the frame again
      try { fr.contentWindow.YA_DEMO_LOOK?.(window.YA_DEMO_PROGRAM.look); } catch { load(); }
    },
  };
}
// admin page "Phone preview" (Settings group; admins with the Settings permission and the super admin)
async function pPhone() {
  view.innerHTML = `${pageHead(t('tab_phone'))}<p class="muted" style="margin:0 0 10px">${t('pfSub')}</p><div class="card pf-card" id="pfBox"></div>`;
  phoneFrame($('#pfBox'));
}
// inside the frame: the admin page pushes unsaved settings here
if (DEMO) window.YA_DEMO_LOOK = (look) => {
  program.look = look || {};
  const row = program.list.find(x => x.id === program.id); if (row) row.look = program.look;
  applyLook(); render();
};
