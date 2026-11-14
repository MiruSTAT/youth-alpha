import { t, getLang, setLang } from './i18n.js?v=16';
import { api, MODE, ranked, today, bkkToday } from './data.js?v=16';
import { music } from './music.js?v=16';
import { art, burst, SPECIAL, pic, isImg, shrinkImage } from './art.js?v=16';
import { snow } from './snow.js?v=16';
import { track } from './track.js?v=16';
import { metro } from './metronome.js?v=16';

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
    const m = await import('./scene3d.js?v=16');
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
  const [rows] = await Promise.all([leaderboard(true), pcats(true)]);
  const mineId = localStorage.getItem('ya_me'), me = rows.find(r => r.id === mineId);
  if (mineId && !me) localStorage.removeItem('ya_me');
  const max = Math.max(1, ...rows.map(r => r.total));
  scene?.setGlow(me ? me.total / max : 0.6);
  const medal = ['🥇', '🥈', '🥉'];
  view.innerHTML = `<section class="sheet">
    ${me ? `<button class="my-card" id="myCard"><span class="av" data-pic="${me.id}">${pic(me.avatar)}</span>
        <span class="who"><b>${esc(me.nickname)}</b><span>🏆 ${t('rank')} ${me.rank} ${t('of')} ${rows.length}</span></span>
        <span class="pts"><b id="tot">0</b><span>${t('points')}</span></span></button>`
      : rows.length ? `<p class="my-hint">👇 ${t('tapYourName')}</p>` : ''}
    <h1 class="sheet-title" style="margin-bottom:12px">🏆 ${t('ranking')}</h1>
    ${rows.length ? `<div class="rank-list">${rows.map(k => `<button class="rank-row ${k.id === mineId ? 'mine' : ''}" data-id="${k.id}">
      <span class="n ${k.rank <= 3 ? 'medal' : ''}">${k.rank <= 3 ? medal[k.rank - 1] : k.rank}</span>
      <span class="av" data-pic="${k.id}">${pic(k.avatar)}</span><span class="nm">${esc(k.nickname)}</span><span class="pt">${k.total} ⭐</span></button>`).join('')}</div>`
      : `<p class="empty">${t('noKids')}</p>`}</section>`;
  wirePics(view, rows);
  view.querySelectorAll('.rank-row').forEach(b => b.onclick = () => { const k = rows.find(r => r.id === b.dataset.id); track('tap_kid', k?.id === localStorage.getItem('ya_me') ? 'self' : 'other'); kidDetail(k, rows); });
  if (me) {
    $('#myCard').onclick = () => { track('tap_my_card'); kidDetail(me, rows); };
    // the total counts up from what this phone saw last time (no pop-up messages)
    const seenKey = `ya_seen_${me.id}`, seen = Number(localStorage.getItem(seenKey) ?? me.total);
    countUp($('#tot'), Math.min(seen, me.total), me.total);
    localStorage.setItem(seenKey, me.total);
  }
}

// a kid's points by category (with details like piano / singing)
function kidDetail(k, rows) {
  const isMe = localStorage.getItem('ya_me') === k.id;
  const cats = catCache.list.filter(c => c.active || k.skills[c.key]);
  const p = kidSheet(`<div class="panel-head"><h2>${esc(k.nickname)}</h2><button class="x" aria-label="${t('close')}">✕</button></div>
    <div class="kid-detail-head"><button class="av" data-pic="${k.id}" aria-label="${esc(k.nickname)}">${pic(k.avatar)}</button><b>${k.total} ⭐</b><span class="me-rank">🏆 ${t('rank')} ${k.rank} ${t('of')} ${rows.length}</span></div>
    <p class="section-label">${t('mySkills')}</p>
    <div class="skill-list">${cats.map(c => {
      const det = k.details?.[c.key];
      return `<button class="skill-row ${c.info ? 'has-info' : ''}" data-c="${c.key}"><span class="i">${pic(c.icon)}</span><span class="l">${esc(cName(c))}</span>
        <span class="v">${k.skills[c.key] || 0}</span><span class="chev">${c.info ? 'ⓘ' : ''}</span></button>`
        + (det ? `<div class="sub-rows">${Object.entries(det).map(([d, v]) => `<div><span>${esc(d)}</span><span>${v}</span></div>`).join('')}</div>` : '');
    }).join('')}</div>
    ${isMe ? `<button class="text-btn" id="notMe">${t('notMe')}</button>` : `<button class="kbtn" id="thisMe">${t('thisIsMe')}</button>`}`);
  wirePics(p, rows);
  p.querySelectorAll('.skill-row.has-info').forEach(b => b.onclick = () => { track('cat_info', b.dataset.c); catInfo(cOf(b.dataset.c), k.skills[b.dataset.c] || 0); });
  const close = () => { $('#kidSheet').hidden = true; kidRank(); };
  p.querySelector('#thisMe')?.addEventListener('click', () => { localStorage.setItem('ya_me', k.id); track('set_me'); localStorage.setItem(`ya_seen_${k.id}`, k.total); close(); });
  p.querySelector('#notMe')?.addEventListener('click', () => { track('not_me'); localStorage.removeItem('ya_me'); close(); });
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
      <button class="mrow" data-m="fb"><span class="mi">💬</span><span class="mt"><b>${t('fb')}</b>
        <span>${ev.fb_open ? t('fbOpenSub') : t('fbClosedSub')}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="bible"><span class="mi">📖</span><span class="mt"><b>${t('bible')}</b><span>${t('bibleSub')}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="credits"><span class="mi">🎵</span><span class="mt"><b>${t('songCredits')}</b><span>${t('songCreditsSub')}</span></span><span class="mv">›</span></button>
      <button class="mrow" data-m="lang"><span class="mi">🌐</span><span class="mt"><b>${t('language')}</b></span><span class="mv">${t('langName')}</span></button>
      <button class="mrow" data-m="help"><span class="mi">❓</span><span class="mt"><b>${t('help')}</b><span>${t('helpSub')}</span></span><span class="mv">›</span></button>
      <a class="mrow quiet" href="#/admin"><span class="mi">🔒</span><span class="mt"><b>${t('adults')}</b><span>${t('adminSub')}</span></span><span class="mv">›</span></a>
    </div></section>`;
  const act = {
    fb: () => openFeedback(), bible: openBible, credits: songCredits, help: () => { track('help_open'); showTour(TOUR); },
    lang: () => { setLang(getLang() === 'th' ? 'en' : 'th'); track('lang', getLang()); paintChrome(); kidMenu(); },
  };
  view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => act[b.dataset.m]());
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
  const sentKey = 'ya_fb_' + bkkToday();
  if (!ev.fb_open) { show(`${head}<p class="fb-done">🔒 ${t('fbClosed')}</p>${pageEl ? homeBtn : ''}`); return; }
  if (localStorage.getItem(sentKey)) { show(`${head}<p class="fb-done">${t('fbSentAlready')}</p>${pageEl ? homeBtn : ''}`); return; }
  const me = (await leaderboard()).find(r => r.id === localStorage.getItem('ya_me'));
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
  const { items } = await api.shop();
  const live = items.filter(i => i.active).sort((x, y) => x.price - y.price);
  const rows = []; for (let i = 0; i < live.length; i += 2) rows.push(live.slice(i, i + 2));
  view.innerHTML = `<section class="sheet">
    <h1 class="sheet-title">🎁 ${t('shopTitle')}</h1>
    ${live.length ? `<p class="sheet-sub">${t('shopSub')}</p><div class="stand">
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
  });
}

// =============================================================== SONGS
// Lyrics with chords: "[G]Jingle bells" (chords in brackets), "# Chorus" (section name),
// or the usual "chords on the line above the words" layout.
const CHORD_TOKEN = /^\(?[A-G][#b]?(?:maj|min|m|dim|aug|sus|add|M|°|ø|\+)?\d*(?:(?:sus|add|maj|b|#)\d+)*\)?(?:\/[A-G][#b]?)?\)?$/;
const isChordLine = (line) => {
  const toks = line.trim().split(/\s+/).filter(x => !/^(\||\/|-|–|\(x?\d+\)|x\d+|\*?\)|[A-Za-z]\)|\*|intro:?|outro:?|interlude:?)$/i.test(x));
  return toks.length > 0 && toks.every(x => CHORD_TOKEN.test(x));
};
const ZERO_W = /[ัิ-ฺ็-๎̀-ͯ]/;      // Thai vowels/tone marks above or below: no width
function splitAtColumns(text, cols) {          // map visual columns of a chord line onto the lyric line
  const idx = []; let col = 0, ci = 0;
  for (let i = 0; i <= text.length && ci < cols.length; i++) {
    while (ci < cols.length && col >= cols[ci]) { let j = i; while (j < text.length && ZERO_W.test(text[j])) j++; idx.push(j); ci++; }
    if (i < text.length && !ZERO_W.test(text[i])) col++;
  }
  while (idx.length < cols.length) idx.push(text.length);
  return idx;
}
function parseSong(content) {
  const out = [], lines = String(content || '').replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, '    '), sec = /^\s*(?:#\s*(.+?)|\{(?:c:|comment:)?\s*(.+?)\})\s*$/.exec(line);
    if (sec) { out.push({ k: 'sec', text: sec[1] || sec[2] }); continue; }
    if (!line.trim()) { if (out.length && out[out.length - 1].k !== 'gap') out.push({ k: 'gap' }); continue; }
    if (!/\[[^\]]+\]/.test(line) && isChordLine(line)) {
      const next = lines[i + 1];
      if (next && next.trim() && !isChordLine(next) && !/^\s*#/.test(next) && !/\[[^\]]+\]/.test(next)) {
        const cols = [], names = [], re = /\S+/g; let m;
        while ((m = re.exec(line))) if (CHORD_TOKEN.test(m[0])) { cols.push(m.index); names.push(m[0].replace(/[()]/g, '')); }
        const lyric = next.replace(/\t/g, '    '), at = splitAtColumns(lyric, cols), segs = [];
        if (at[0] > 0) segs.push({ ch: '', ly: lyric.slice(0, at[0]) });
        at.forEach((a, j) => segs.push({ ch: names[j], ly: lyric.slice(a, at[j + 1] ?? lyric.length) || ' ' }));
        out.push({ k: 'line', segs }); i++; continue;
      }
      out.push({ k: 'chords', text: line.trim() }); continue;
    }
    const segs = [], re = /\[([^\]]+)\]/g; let last = 0, ch = '', m;
    while ((m = re.exec(line))) { if (m.index > last || ch) segs.push({ ch, ly: line.slice(last, m.index) }); ch = m[1].trim(); last = re.lastIndex; }
    segs.push({ ch, ly: line.slice(last) });
    out.push({ k: 'line', segs: segs.filter(s => s.ch || s.ly) });
  }
  while (out.length && out[out.length - 1].k === 'gap') out.pop();
  return out;
}
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteIdx = (n) => { const i = SHARPS.indexOf(n); return i >= 0 ? i : FLATS.indexOf(n); };
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);
function shiftNote(n, by, flats) { const i = noteIdx(n); return i < 0 ? n : (flats ? FLATS : SHARPS)[(i + by + 120) % 12]; }
function transposeChord(ch, by, flats) {
  if (!by) return ch;
  return ch.replace(/^([A-G][#b]?)/, (r) => shiftNote(r, by, flats)).replace(/\/([A-G][#b]?)/, (_, b) => '/' + shiftNote(b, by, flats));
}
function keyAfter(key, by) {
  const m = /^([A-G][#b]?)(m?)$/.exec(String(key || '').trim()); if (!m) return key;
  const sharpName = shiftNote(m[1], by, false) + m[2], flatName = shiftNote(m[1], by, true) + m[2];
  return FLAT_KEYS.has(flatName) ? flatName : sharpName;
}
function renderSong(parsed, { by = 0, flats = false, chords = true } = {}) {
  const tc = (c) => esc(transposeChord(c, by, flats));
  return parsed.map(x => {
    if (x.k === 'sec') return `<div class="sec">${esc(x.text)}</div>`;
    if (x.k === 'gap') return '<div class="gap"></div>';
    if (x.k === 'chords') return chords ? `<div class="ln chords-only">${x.text.split(/(\s+)/).map(tok => CHORD_TOKEN.test(tok) ? `<b class="ch">${tc(tok.replace(/[()]/g, ''))}</b>` : tok.trim() ? `<span class="sep">${esc(tok)}</span>` : ' ').join('')}</div>` : '';
    const has = chords && x.segs.some(s => s.ch);
    if (!has) return `<div class="ln plain">${esc(x.segs.map(s => s.ly).join(''))}</div>`;
    return `<div class="ln">${x.segs.map(s => `<span class="sg"><b class="ch">${s.ch ? tc(s.ch) : ''}</b><span class="ly">${esc(s.ly) || '&nbsp;'}</span></span>`).join('')}</div>`;
  }).join('');
}
const ytId = (u) => { const m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/.exec(u || '') || /^([\w-]{11})$/.exec(String(u || '').trim()); return m ? m[1] : ''; };
let songCache = { at: 0, list: [] };
async function songList(force = false) {
  if (force || Date.now() - songCache.at > 30000) songCache = { at: Date.now(), list: await api.songs() };
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
      : `<p class="empty">${t('noSongs')}</p>`}</section>`;
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
  player.stop(); player = null;
  document.body.classList.remove('song-page'); $('#songDock')?.remove();
  music.hold(false);
}

async function kidSong(id) {
  const s = (await songList()).find(x => x.id === id) || (await songList(true)).find(x => x.id === id);
  if (!s) { location.hash = '#/songs'; return; }
  track('song_open', s.title);
  setNav('songs');
  document.body.classList.add('song-page'); music.hold(true); scene?.stop();
  document.querySelectorAll('.santa').forEach(x => x.remove());
  const parsed = parseSong(s.content), vid = ytId(s.youtube), sheets = Array.isArray(s.sheets) ? s.sheets : [];
  const st = { by: songPrefs['t_' + s.id] || 0, chords: songPrefs.chords !== false, fs: songPrefs.fs || 1.25, speed: 1, metro: false, scroll: false };
  const flats = () => FLAT_KEYS.has(keyAfter(s.song_key, st.by));
  view.innerHTML = `<section class="sheet song-sheet">
    <div class="song-head"><a class="back k" href="#/songs" aria-label="${t('back')}">‹</a>
      <div class="st"><h1>${esc(s.title)}</h1>${s.subtitle ? `<p>${esc(s.subtitle)}</p>` : ''}</div></div>
    <div class="song-meta">${s.song_key ? `<span class="chip key">${t('keyLbl')} <b id="keyNow">${esc(keyAfter(s.song_key, st.by))}</b></span>` : ''}
      <span class="chip"><span class="q">♩</span> = <b id="bpmNow">${s.bpm}</b></span><span class="chip">${s.beats}/4</span></div>
    ${vid ? `<div class="yt" id="yt"><button class="yt-poster" id="ytGo" style="background-image:url('https://i.ytimg.com/vi/${vid}/hqdefault.jpg')" aria-label="${t('listen')}">
      <span class="yt-play">▶</span><span class="yt-lbl">${t('listen')}</span></button></div>` : ''}
    <div class="lyrics" id="lyrics" style="--fs:${st.fs}"></div>
    ${sheets.length ? `<h2 class="sheet-h">📄 ${t('sheetLbl')}</h2><div class="sheets">${sheets.map((u, i) => `<button class="sheet-img" data-sh="${i}"><img src="${esc(u)}" alt="${t('sheetLbl')} ${i + 1}" loading="lazy"></button>`).join('')}</div>` : ''}
    ${s.credits ? `<p class="song-credit">🎵 ${t('credits')}: ${esc(s.credits)}</p>` : ''}
  </section>`;
  const dock = document.createElement('div');
  dock.id = 'songDock'; dock.className = 'song-dock';
  dock.innerHTML = `<div class="beats" id="beats">${Array.from({ length: s.beats }, () => '<i></i>').join('')}</div>
    <div class="dock-row">
      <button id="dMetro" class="dk"><span>🥁</span><b>${t('metro')}</b></button>
      <button id="dScroll" class="dk"><span>⏬</span><b>${t('scroll')}</b></button>
      <button id="dSpeed" class="dk"><span id="spdTxt">1×</span><b>${t('speed')}</b></button>
      <button id="dSet" class="dk"><span>Aa</span><b>${t('setShort')}</b></button>
    </div>`;
  document.body.appendChild(dock);
  const lyr = $('#lyrics');
  const draw = () => {
    lyr.innerHTML = parsed.length ? renderSong(parsed, { by: st.by, flats: flats(), chords: st.chords }) : (sheets.length ? '' : `<p class="empty">${t('noLyrics')}</p>`);
    lyr.style.setProperty('--fs', st.fs);
    const k = $('#keyNow'); if (k) k.textContent = keyAfter(s.song_key, st.by);
  };
  draw();

  // --- beat dots + metronome
  const dots = [...dock.querySelectorAll('#beats i')];
  metro.onBeat = (b) => dots.forEach((d, i) => { d.classList.toggle('on', i === b); d.classList.toggle('one', i === b && b === 0); });
  const bpmNow = () => Math.round(s.bpm * st.speed);
  // --- auto-scroll: about 8 beats per lyric line, slower/faster with the speed button
  let raf = 0, lastT = 0, acc = 0, wake = null;
  const lineH = () => { const ls = lyr.querySelectorAll('.ln'); if (!ls.length) return 60; let h = 0; ls.forEach(l => h += l.offsetHeight); return h / ls.length; };
  const pxPerSec = () => parsed.length ? lineH() / (8 * 60 / bpmNow()) : Math.max(12, (document.documentElement.scrollHeight - innerHeight) / (150 / st.speed));
  const stepScroll = (now) => {
    if (!st.scroll) return;
    const dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
    acc += pxPerSec() * dt;
    if (acc >= 1) { const d = Math.floor(acc); acc -= d; window.scrollBy(0, d); }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) { setScroll(false); return; }
    raf = requestAnimationFrame(stepScroll);
  };
  const keepAwake = async () => {
    const need = st.scroll || st.metro;
    try { if (need && !wake && navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); else if (!need && wake) { wake.release(); wake = null; } } catch {}
  };
  const setScroll = (on) => {
    st.scroll = on; $('#dScroll').classList.toggle('on', on);
    $('#dScroll span').textContent = on ? '⏸' : '⏬';
    cancelAnimationFrame(raf); lastT = 0; acc = 0;
    if (on) raf = requestAnimationFrame(stepScroll);
    keepAwake();
  };
  const setMetro = (on) => {
    st.metro = on; $('#dMetro').classList.toggle('on', on);
    on ? metro.start(bpmNow(), s.beats) : metro.stop();
    keepAwake();
  };
  $('#dMetro').onclick = () => { setMetro(!st.metro); track('metro', st.metro ? 'on' : 'off'); };
  $('#dScroll').onclick = () => { setScroll(!st.scroll); track('autoscroll', st.scroll ? 'on' : 'off'); };
  $('#dSpeed').onclick = () => {
    st.speed = SPEEDS[(SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length];
    $('#spdTxt').textContent = st.speed + '×'; $('#bpmNow').textContent = bpmNow();
    metro.setBpm(bpmNow()); yt?.setPlaybackRate?.(st.speed);
    track('song_speed', String(st.speed));
  };
  $('#dSet').onclick = () => songSettings(s, st, () => { draw(); songPrefs['t_' + s.id] = st.by; songPrefs.chords = st.chords; songPrefs.fs = st.fs; savePrefs(); });
  // tap a lyric line: it moves up to the reading spot
  lyr.onclick = (e) => {
    const ln = e.target.closest('.ln'); if (!ln) return;
    lyr.querySelectorAll('.ln.here').forEach(x => x.classList.remove('here')); ln.classList.add('here');
    window.scrollTo({ top: scrollY + ln.getBoundingClientRect().top - innerHeight * 0.3, behavior: 'smooth' });
  };
  view.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => { track('sheet_view', s.title); openPic(sheets[b.dataset.sh], s.title); });

  // --- the official video (loads only when tapped; speed follows the speed button)
  let yt = null;
  $('#ytGo')?.addEventListener('click', async () => {
    track('yt_play', s.title);
    const box = $('#yt'); box.innerHTML = '<div id="ytFrame"></div>';
    try {
      const YT = await loadYT();
      yt = new YT.Player('ytFrame', {
        host: 'https://www.youtube-nocookie.com', videoId: vid,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, start: s.yt_start || 0 },
        events: { onReady: (e) => { e.target.setPlaybackRate(st.speed); e.target.playVideo(); }, onError: () => ytFallback(box, vid) },
      });
    } catch { ytFallback(box, vid); }
  });
  player = { stop: () => { setScroll(false); setMetro(false); try { yt?.destroy?.(); } catch {} metro.onBeat = null; } };
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
    <div class="set-row"><span>${t('textSize')}</span><div class="stepper"><button data-fs="-1" aria-label="−">A−</button><b id="fsNow">${Math.round(st.fs * 100)}%</b><button data-fs="1" aria-label="+">A+</button></div></div>
    <div class="set-row"><span>${t('showChords')}</span><button class="switch ${st.chords ? 'on' : ''}" id="chSw" role="switch" aria-checked="${st.chords}"><span></span></button></div>
    ${s.song_key ? `<div class="set-row"><span>${t('transpose')}</span><div class="stepper"><button data-tr="-1" aria-label="♭">♭</button><b id="trNow">${esc(keyAfter(s.song_key, st.by))}</b><button data-tr="1" aria-label="♯">♯</button></div></div>
    <button class="text-btn" id="trReset" ${st.by ? '' : 'hidden'}>${t('original')}: ${esc(s.song_key)}</button>` : ''}`);
  const upd = () => {
    p.querySelector('#fsNow').textContent = Math.round(st.fs * 100) + '%';
    const tr = p.querySelector('#trNow'); if (tr) tr.textContent = keyAfter(s.song_key, st.by);
    const rs = p.querySelector('#trReset'); if (rs) rs.hidden = !st.by;
    apply();
  };
  p.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => { st.fs = Math.max(0.9, Math.min(2, Math.round((st.fs + Number(b.dataset.fs) * 0.1) * 100) / 100)); upd(); });
  p.querySelector('#chSw').onclick = (e) => { st.chords = !st.chords; e.currentTarget.classList.toggle('on', st.chords); e.currentTarget.setAttribute('aria-checked', String(st.chords)); upd(); };
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
  if (document.body.classList.contains('adult') || document.body.classList.contains('song-page') || location.hash === '#/feedback' || !$('#tour').hidden || !$('#kidSheet').hidden) return;
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
  const busy = b.classList.contains('adult') || b.classList.contains('song-page') || location.hash === '#/feedback' || document.hidden || !$('#kidSheet').hidden || !$('#tour').hidden
    || $('.cutscene') || $('.santa') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!busy) {
    const side = ['left', 'right', 'bottom'][Math.floor(Math.random() * 3)];
    const el = document.createElement('button');
    el.className = `santa from-${side}`; el.setAttribute('aria-label', 'Santa');
    el.innerHTML = `<span class="s-bubble">${t('santaHo')}</span><span class="s-face">🎅</span>`;
    if (side === 'bottom') el.style.left = (15 + Math.random() * 60) + '%'; else el.style.top = (28 + Math.random() * 40) + '%';
    el.onclick = (e) => { e.stopPropagation(); track('santa_tap'); burst(el, '🎁', 12); music.ding(); el.classList.add('tapped'); };
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
  if (tapTimes.length < 5 || document.body.classList.contains('adult')) return;
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
  const things = ['🎁', '🎁', '🎁', '🎀', '⭐', '✨', '🎁', '🍬', '🧸', '🎄'];
  box.innerHTML = `<div class="flash" style="--x:${cx}px;--y:${cy}px"></div><div class="joy-title">✨ ${t('joyTitle')} ✨</div>` +
    Array.from({ length: 44 }, (_, i) => {
      const a = Math.random() * Math.PI * 2, d = 0.45 + Math.random() * 0.75, dx = Math.cos(a) * innerWidth * d, dy = Math.sin(a) * innerHeight * d * 0.9;
      return `<span class="gift" style="left:${cx}px;top:${cy}px;--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--s:${(0.8 + Math.random() * 0.9).toFixed(2)};animation-delay:${(i * 22)}ms">${things[i % things.length]}</span>`;
    }).join('');
  document.body.appendChild(box);
  setTimeout(() => document.body.classList.add('festive'), 1400);
  setTimeout(() => box.remove(), 4200);
}
function endFestive() {
  festive = false; track('festive', 'off');
  document.body.classList.remove('festive');
  scene?.calm?.(); music.setTrack('jingle');
}
// in special mode every tap makes a magic sound (kids only)
document.addEventListener('click', (e) => {
  if (!festive || document.body.classList.contains('adult')) return;
  if (e.target.closest('button, a, [role="button"], .rank-row, .slot')) music.sfx();
}, true);

// =============================================================== ADULT SIDE
let adult = { role: null, myId: null };

async function adultGate(page) {
  const session = await api.session();
  if (!session) return loginView();
  adult.role = await api.myRole(); adult.myId = await api.myId();
  if (adult.role === 'pending') return pendingView();
  const pages = { attendance: pAttendance, attsum: pAttSummary, points: pPoints, history: pHistory, kids: pKids, shop: pShop, pcats: pPcats, feedback: pFeedback, export: pExport,
    songs: pSongs, song: pSongEdit, ...(adult.role === 'admin' ? { settings: pSettings } : {}) };
  if (!pages[page]) return adultHome();
  await pages[page](location.hash.split('/')[3]);
}

function adultHome() {
  const groups = [
    ['g_daily', [['attendance', '✅'], ['points', '⭐']]],
    ['g_kids', [['kids', '👧'], ['feedback', '💬']]],
    ['g_rewards', [['pcats', '🏷️'], ['shop', '🎁']]],
    ['g_songs', [['songs', '🎵']]],
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
  const seq = renderSeq;
  computeNeeds().then(n => {
    if (seq !== renderSeq) return;                              // page changed meanwhile
    Object.keys(n).forEach(k => {
      const el = view.querySelector(`.menu [data-k="${k}"]`); if (!el || el.classList.contains('alert')) return;
      el.classList.add('alert');
      el.querySelector('.mi').insertAdjacentHTML('beforeend', '<span class="dot"></span>');
      el.querySelector('.mt span').outerHTML = `<span class="need">${esc(n[k])}</span>`;
    });
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
      <div class="options">${cats.filter(c => c.active && c.key !== 'attendance').map(c => `<button class="opt" data-s="${c.key}"><span class="i">${pic(c.icon)}</span>
        <span class="t">${esc(cName(c))}${c.info ? `<span class="opt-sub">${esc(c.info)}</span>` : ''}</span><span class="chev">›</span></button>`).join('')}</div>
      <a class="btn wide" style="margin-top:20px" href="#/admin/history">${t('seeHistory')}</a>`;
    view.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { pw.skill = b.dataset.s; pw.detail = ''; pw.step = 2; pPoints(); });
  } else if (pw.step === 2) {
    const dets = (cOf(pw.skill).details || '').split('\n').filter(Boolean);
    view.innerHTML = `${head}
      ${dets.length ? `<p class="muted" style="margin:0 0 8px">${t('pickDetail')}</p><div class="dchips">${['', ...dets].map(d => `<button class="dchip ${pw.detail === d ? 'on' : ''}" data-d="${esc(d)}">${d ? esc(d) : t('noDetail')}</button>`).join('')}</div>` : ''}
      <h2 style="margin-bottom:12px">${pic(cOf(pw.skill).icon)} ${t('s2')}</h2>
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
  view.innerHTML = `${pageHead(t('tab_pcats'))}
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

// ---------------- Songs (admin)
const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].flatMap(k => [k, k + 'm']);
async function pSongs() {
  const list = await songList(true);
  view.innerHTML = `${pageHead(t('tab_songs'))}
    <a class="btn primary wide" href="#/admin/song/new" style="margin-bottom:12px">+ ${t('addSong')}</a>
    <div class="card"><div class="list">${list.map((x, i) => `<a class="li click" href="#/admin/song/${x.id}" style="text-decoration:none;color:inherit"><span class="av" style="font-size:1.1rem;font-weight:700">${i + 1}</span>
      <span class="grow">${esc(x.title)}<span class="sub">${[x.song_key && t('keyLbl') + ' ' + x.song_key, '♩ ' + x.bpm, ytId(x.youtube) && '▶ YouTube', (x.sheets || []).length && '📄 ' + x.sheets.length, x.content.trim() ? '' : t('noLyrics'), x.active ? '' : t('hidden')].filter(Boolean).map(esc).join(' · ')}</span></span>
      <span class="muted">${t('edit')} ›</span></a>`).join('') || `<p class="muted">${t('noSongs')}</p>`}</div></div>`;
}
async function pSongEdit(id) {
  const list = await songList(true), x = list.find(v => v.id === id);
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
          <button type="button" class="btn small" id="addSheet">${t('upload')}</button><input type="file" id="sheetFile" accept="image/*" multiple hidden></div>
      </div>
      <div class="card">
        <div class="field"><label>${t('ytLink')}</label><input class="input" name="youtube" maxlength="200" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" value="${esc(v.youtube)}"></div>
        <div class="grid3">
          <div class="field"><label>${t('ytStart')}</label><input class="input" name="yt_start" type="number" inputmode="numeric" min="0" max="3600" value="${v.yt_start || 0}"></div>
          <div class="field"><label>${t('orderLbl')}</label><input class="input" name="sort" type="number" inputmode="numeric" min="0" max="999" value="${v.sort}"></div>
        </div>
        <div class="field"><label>${t('creditsLbl')}</label><textarea class="input" name="credits" rows="3" maxlength="600">${esc(v.credits)}</textarea></div>
      </div>
      ${x ? `<div class="row-btns"><button type="button" class="btn small" id="hideSong">${x.active ? t('hidden') : t('show')}</button><button type="button" class="btn small danger" id="delSong">${t('del')}</button></div>` : ''}
      <div class="bottom-bar"><button class="btn primary" id="saveSong">${t('save')}</button></div>
    </form>`;
  const form = $('#sf');
  const drawThumbs = () => {
    $('#thumbs').innerHTML = sheets.map((u, i) => `<div class="th"><img src="${esc(u)}" alt=""><button type="button" class="x" data-rm="${i}" aria-label="${t('removePic')}">✕</button></div>`).join('');
    $('#thumbs').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { sheets.splice(Number(b.dataset.rm), 1); drawThumbs(); });
  };
  drawThumbs();
  $('#addSheet').onclick = () => $('#sheetFile').click();
  $('#sheetFile').onchange = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    const b = $('#addSheet'); b.disabled = true; b.textContent = t('uploading');
    for (const f of files) {
      if (!/^image\//.test(f.type)) { toast(t('notImage')); continue; }
      try { sheets.push(await api.uploadImage(await shrinkImage(f, 1600, 0.85), 'sheets')); drawThumbs(); } catch (err) { console.error(err); toast(t('uploadFail')); }
    }
    b.disabled = false; b.textContent = t('upload');
  };
  $('#pv').onclick = () => { const box = $('#pvBox'); box.hidden = !box.hidden; if (!box.hidden) box.innerHTML = renderSong(parseSong(form.content.value)) || `<p class="muted">${t('noLyrics')}</p>`; };
  form.content.oninput = () => { const box = $('#pvBox'); if (!box.hidden) box.innerHTML = renderSong(parseSong(form.content.value)); };
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
const XL_SHEETS = [['xs_summary', 'summary', '📊'], ['xs_points', 'points', '⭐'], ['xs_att', 'attendance', '✅'], ['xs_attsum', 'attendance-totals', '📈'], ['xs_feedback', 'feedback', '💬'], ['xs_shop', 'shop', '🎁'],
  ['xs_adminlog', 'admin-log', '📜'], ['xs_kidlog', 'kid-activity', '👆'], ['xs_kidsum', 'kid-activity-summary', '📈']];
const LOG_SHEETS = ['xs_adminlog', 'xs_kidlog', 'xs_kidsum'];
const TBL = { songs: 'lt_songs', kids: 'lt_kids', points: 'lt_points', attendance: 'lt_att', attendance_rounds: 'lt_round', shop_items: 'lt_shop', point_categories: 'lt_pcats', settings: 'lt_settings', staff: 'lt_staff', kid_events: 'lt_kidlog' };
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
    case 'staff': item = r.role; break;
    case 'kid_events': item = t('logCleared', r.rows_deleted ?? 0); break;
    case 'songs': item = r.title; break;
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
  'songs', 'song_open', 'metro', 'autoscroll', 'song_speed', 'transpose', 'yt_play', 'sheet_view', 'credits', 'santa_tap', 'festive', 'pic_view', 'fb_qr'];
const evName = (e) => EVT_TH.includes(e) ? t('ev_' + e) : e;

async function pExport() {
  view.innerHTML = `${pageHead(t('tab_export'))}
    <button class="btn primary wide" data-x="all" style="margin-bottom:6px">📥 ${t('exportAll')}</button>
    <p class="muted" style="margin:0 0 14px;text-align:center">${t('exportAllSub')}</p>
    <h2 class="grp">${t('exportEach')}</h2>
    <nav class="menu grouped">${XL_SHEETS.filter(([k]) => !LOG_SHEETS.includes(k)).map(xlRow).join('')}</nav>
    <h2 class="grp">${t('logsGrp')}</h2>
    <nav class="menu grouped">${XL_SHEETS.filter(([k]) => LOG_SHEETS.includes(k)).map(xlRow).join('')}</nav>
    <p class="muted" style="margin:6px 4px 0">🔒 ${t('adminLogNote')}</p>
    ${adult.role === 'admin' ? `<button class="btn danger wide" id="clearKid" style="margin-top:24px">🗑️ ${t('clearKidLog')}</button>
    <p class="muted" style="margin:6px 4px 0">${t('clearKidNote')}</p>` : ''}`;
  view.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => {
    const keep = b.innerHTML; b.disabled = true; b.textContent = t('exporting');
    try { await buildExcel(b.dataset.x === 'all' ? null : [b.dataset.x]); } catch (err) { fail(err); }
    b.disabled = false; b.innerHTML = keep;
  });
  $('#clearKid')?.addEventListener('click', async () => {
    const r = await modal('⚠️ ' + t('warnTitle'), `<p style="white-space:pre-line;font-size:1.05rem">${esc(t('clearKidWarn'))}</p>
      <div class="field"><label>${t('password')}</label><input class="input" name="pw" type="password" required autocomplete="current-password"></div>`,
      { okText: t('clearNow'), danger: true });
    if (!(r instanceof FormData)) return;
    try { await api.reauth(r.get('pw')); } catch { toast(t('errLogin')); return; }
    try { const n = await api.clearKidEvents(); toast(t('logCleared', n)); } catch (e) { fail(e); }
  });
}
const xlRow = ([k, , i]) => `<button class="xl-row" data-x="${k}"><span class="mi">${i}</span><span class="mt"><b>${t(k)}</b></span><span class="xl-dl">📥 ${t('exportOne')}</span></button>`;
async function buildExcel(only = null) {
  const want = (k) => !only || only.includes(k);
  const [XLSX, kids, rows, cats, pts, att, fb, shop, alog, kev] = await Promise.all([loadXLSX(), api.kids(), leaderboard(true), pcats(true), api.allPoints(),
    api.attendanceAll(), api.feedback().catch(() => []), api.shop(),
    want('xs_adminlog') ? api.auditAll() : [], (want('xs_kidlog') || want('xs_kidsum')) ? api.kidEvents() : []]);
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
    ['xs_adminlog', alog.map(e => { const d = describeLog(e, kidName); return { [t('xc_time')]: dt(e.created_at), [t('xc_admin')]: e.actor_email || t('lt_system'), [t('xc_action')]: d.op, [t('xc_area')]: d.area, [t('xc_item')]: d.item || '', [t('xc_changes')]: d.changes, [t('xc_key')]: e.row_key }; })],
    ['xs_kidlog', kev.map(e => ({ [t('xc_time')]: dt(e.created_at), [t('xc_device')]: e.device_id, [t('nickname')]: kidName[e.kid_id] || '', [t('xc_event')]: evName(e.event), [t('xc_eventcode')]: e.event, [t('xc_detail')]: e.detail, [t('xc_page')]: e.path }))],
    ['xs_kidsum', (() => { const m = {}; kev.forEach(e => { const x = (m[e.event] ??= { n: 0, d: new Set(), k: new Set() }); x.n++; x.d.add(e.device_id); if (e.kid_id) x.k.add(e.kid_id); });
      return Object.entries(m).sort((a, b) => b[1].n - a[1].n).map(([ev, x]) => ({ [t('xc_event')]: evName(ev), [t('xc_eventcode')]: ev, [t('xc_count')]: x.n, [t('xc_devices')]: x.d.size, [t('xc_kids')]: x.k.size })); })()],
    ['xs_shop', shop.items.map(i => ({ [t('itemName')]: i.name, [t('xc_points')]: i.price, [t('xc_shown')]: i.active ? '✓' : t('hidden') }))],
  ];
  const wb = XLSX.utils.book_new();
  for (const [k, data] of sheets.filter(([k]) => only ? only.includes(k) : true)) {
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
  document.querySelectorAll('.lightbox').forEach(x => x.remove());
  stopPlayer();                                                   // leaving a song: stop scrolling / metronome / video
  isAdult ? snow.stop() : snow.start();
  paintChrome();
  try {
    if (isAdult) { scene?.stop(); return await adultGate(h.split('/')[2]); }
    await ensureScene();
    if (seq !== renderSeq) return;
    const page = h === '#/shop' ? 'shop' : h === '#/menu' ? 'menu' : h.startsWith('#/songs') ? 'songs' : h === '#/feedback' ? 'feedback' : 'ranking';
    track('view', page);
    if (h === '#/shop') return await kidShop();
    if (h === '#/menu') return await kidMenu();
    if (h === '#/songs') return await kidSongs();
    if (h.startsWith('#/songs/')) return await kidSong(h.split('/')[2]);
    if (h === '#/feedback') return await kidFeedbackPage();
    if (h.startsWith('#/me') || h === '#/rank') { history.replaceState(null, '', '#/'); }
    return await kidRank();
  } catch (e) { fail(e); view.innerHTML = `<p class="empty">${t('errGeneric')}</p>`; }
}
setTimeout(maybeTour, 1800);
window.addEventListener('hashchange', () => {
  if (location.hash === '#/admin/points') pw = { step: 1, skill: null, detail: '', amount: null, sel: new Set() };
  window.scrollTo(0, 0); render();
});
// re-draw admin pages only when someone signs in / out (not on token refresh)
api.onAuth?.((event) => { if (location.hash.startsWith('#/admin') && (!event || event === 'SIGNED_IN' || event === 'SIGNED_OUT')) render(); });
render();
if (location.hash === '#/feedback') track('fb_qr');
santaSoon(true);
track('open_app', `${document.body.dataset.theme} · ${getLang()} · ${matchMedia('(display-mode: standalone)').matches ? 'installed' : 'browser'} · ${innerWidth}x${innerHeight}`);
let lastTree = 0;
$('#scene').addEventListener('click', () => { if (Date.now() - lastTree > 3000) { lastTree = Date.now(); track('tree_tap'); } treeTapped(); });

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
