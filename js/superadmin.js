// Super admin: the two-step sign-in screens and the super admin page.
// Loaded only when needed (import() from app.js). app.js passes its helpers in `c` so this file has no
// copies of them: { view, $, t, esc, toast, fail, pageHead, api, render, confirmBox, VERSION, getLang, evReset }.
//
// Sign-in (see supabase/017_superadmin.sql for the server side):
//  step 1  login form: username + password -> api.superStart() -> api.superSendLink(email)  -> linkSentView
//  step 2  the owner opens the emailed link -> the app opens #/admin/super -> superGate -> api.superUnlock()
//  first time only: the owner opens the invitation email -> role 'superclaim' -> claimView (choose username + password)

const PROMPT_HEAD = (v) => `You are continuing work on the Youth Alpha web app (version ${v}).
Read this whole handoff before changing anything, and follow it: the owner's rules (section 2), the release steps (section 10),
and the rule to keep HANDOFF.md and the change log in js/version.js detailed and up to date with every change you make.
Repository: https://github.com/MiruSTAT/youth-alpha · Live app: https://mirustat.github.io/youth-alpha/
Before a big change: give the owner a short summary of what you will do and wait for their "go".

----- HANDOFF.md -----
`;

const maskEmail = (e) => { const [a, d] = String(e || '').split('@'); return a && d ? a.slice(0, 2) + '•••@' + d : '•••'; };

// v46: maintenance timer choices in minutes (0 = no timer)
const MT_TIMES = [0, 15, 30, 60, 120, 240, 480, 1440];

// ---------- step 1 succeeded (called from the login form): send the link and say where it went
export async function startFromLogin(c, username, password) {
  const r = await c.api.superStart(username, password);
  if (!r?.ok) {
    if (r?.reason === 'locked') { c.toast(c.t('saLocked', r.minutes || 15)); return true; }
    return false;                                      // not a super admin name / wrong password: normal "wrong" message
  }
  try { await c.api.superSendLink(r.email); }
  catch (e) { console.error(e); c.toast(/rate|seconds/i.test(e?.message || '') ? c.t('saRate') : c.t('saSendFail')); return true; }
  linkSentView(c, r.email);
  return true;
}

function linkSentView(c, email) {
  c.view.innerHTML = `${c.pageHead('👑 ' + c.t('saTitle'), '#/')}
    <div class="card sa-step"><p class="sa-big">📧</p><h2>${c.t('saCheckMail')}</h2>
      <p>${c.t('saSentTo', c.esc(maskEmail(email)))}</p>
      <ol class="sa-list"><li>${c.t('saStep1')}</li><li>${c.t('saStep2')}</li><li>${c.t('saStep3')}</li></ol>
      <p class="muted">${c.t('saMailNote')}</p></div>`;
}

// ---------- the signed-in owner still needs a step (role 'superlocked' or 'superclaim')
export async function superGate(c, role) {
  if (role === 'superclaim') return claimView(c);
  c.view.innerHTML = `${c.pageHead('👑 ' + c.t('saTitle'), '#/')}<div class="card sa-step"><p class="muted">${c.t('loading')}</p></div>`;
  let r = null;
  try { r = await c.api.superUnlock(); } catch (e) { console.error(e); }
  if (r?.ok) { c.toast('👑 ' + c.t('saWelcome', c.esc(r.username || ''))); location.hash = '#/admin'; return c.render(); }
  // the password step is missing or too old: ask for it here, then a new link is sent
  c.view.innerHTML = `${c.pageHead('👑 ' + c.t('saTitle'), '#/')}
    <form id="saf" class="card sa-step"><h2>${c.t('saNeedBoth')}</h2>
      <p class="muted">${c.t(r?.reason === 'old_link' ? 'saOldLink' : 'saNeedPw')}</p>
      <div class="field"><label>${c.t('username')}</label><input class="input" name="u" required autocomplete="username" autocapitalize="none" spellcheck="false"></div>
      <div class="field"><label>${c.t('password')}</label><input class="input" name="p" type="password" required autocomplete="current-password"></div>
      <button class="btn primary wide">${c.t('saSendLink')}</button></form>
    <button class="btn wide" id="saOut">${c.t('logout')}</button>`;
  c.$('#saf').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), b = e.target.querySelector('button'); b.disabled = true;
    try { if (!(await startFromLogin(c, f.get('u'), f.get('p')))) c.toast(c.t('errLogin')); }
    catch (err) { c.fail(err); }
    b.disabled = false;
  };
  c.$('#saOut').onclick = async () => { await c.api.signOut(); location.hash = '#/admin'; c.render(); };
}

// ---------- first time: choose the super admin username + password
function claimView(c) {
  c.view.innerHTML = `${c.pageHead('👑 ' + c.t('saSetup'), '#/')}
    <form id="sac" class="card sa-step"><p>${c.t('saSetupIntro')}</p>
      <div class="field"><label>${c.t('username')}</label><input class="input" name="u" required value="Miruku" pattern="[A-Za-z0-9_.\\-]{2,30}" autocomplete="username" autocapitalize="none" spellcheck="false"></div>
      <div class="field"><label>${c.t('password')}</label><input class="input" name="p" type="password" required minlength="4" autocomplete="new-password"></div>
      <div class="field"><label>${c.t('saPw2')}</label><input class="input" name="p2" type="password" required minlength="4" autocomplete="new-password"></div>
      <p class="hint" id="pwHint">${c.t('saPwHint')}</p>
      <button class="btn primary wide">${c.t('saCreate')}</button></form>`;
  const form = c.$('#sac');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(form), u = String(f.get('u')).trim(), p = String(f.get('p'));
    if (p !== f.get('p2')) { c.toast(c.t('saPwDiff')); return; }
    if (p.length < 8 && !(await c.confirmBox(c.t('saWeakPw', p.length), c.t('saKeepPw'), false))) return;
    const b = form.querySelector('button'); b.disabled = true;
    try {
      const r = await c.api.superClaim(u, p);
      if (r?.ok) { c.toast('👑 ' + c.t('saWelcome', c.esc(r.username))); location.hash = '#/admin'; return c.render(); }
      c.toast(c.t('saClaim_' + (r?.reason || 'x')));
    } catch (err) { c.fail(err); }
    b.disabled = false;
  };
}

// ---------- v32: no separate super admin page any more. The admin panel shows this badge and a "Super admin"
// group with the pages below (programs, look & layout, admins, online now, details for AI).
// v37: the big super admin card is gone. One slim line says who is signed in and until when;
// the one sign-out button of the admin home also ends the super admin powers on this device.
export async function superUntil(c, el) {
  if (!el) return;
  const info = await c.api.superInfo().catch(() => null);
  const until = info?.until ? new Date(info.until).toLocaleTimeString(c.getLang() === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  el.textContent = [info?.username ? '@' + info.username : '', until ? c.t('saUntilShort', until) : ''].filter(Boolean).join(' · ');
}
export async function superSignOut(c) {
  if (!(await c.confirmBox(c.t('saOutWarn'), c.t('logout'), false))) return;
  try { await c.api.superLock(); } catch (e) { console.error(e); }
  try { await c.api.signOut(); } catch (e) { console.error(e); }
  location.hash = '#/admin'; c.render();
}
// v37: "Who is online" lives inside "Admins & permissions"; the admin home shows how many are online on that item
export async function onlineCount(c, item) {
  if (!item) return;
  const rows = await c.api.adminOnline().catch(() => []);
  const n = rows.filter(r => Date.now() - new Date(r.seen_at) < 2 * 6e4).length;
  if (n) item.querySelector('.mt b')?.insertAdjacentHTML('beforeend', ` <span class="on-cnt">🟢 ${n}</span>`);
}

// ---------- programs (was a section of the super admin page)
export async function pPrograms(c) {
  c.view.innerHTML = `${c.pageHead('📁 ' + c.t('tab_programs'))}
    <div class="card"><p class="muted" style="margin:0 0 10px">${c.t('progSub')}</p><div id="progList"></div>
      <button class="btn primary wide" id="progNew" style="margin-top:12px">➕ ${c.t('progNew')}</button></div>`;
  drawPrograms(c);
  c.$('#progNew').onclick = () => newProgram(c);
}

// ---------- this program's look: install switch, settings (v28), layout (v29)
export async function pLook(c) {
  const s = await c.api.settings();
  c.view.innerHTML = `${c.pageHead('🎨 ' + c.t('tab_look'))}
    <p class="muted sa-intro">${c.t('lookPageSub', c.esc(c.program.name))}</p>
    <div class="look-split"><div>
    <h2 class="grp">${c.t('saKidsApp')}</h2>
    <div class="card toggles"><div class="tg-row"><span class="tg-i">📲</span><span class="tg-t"><b>${c.t('installApp')}</b><span>${c.t('saInstallSub')}</span></span>
      <button class="switch ${s.install_on ? 'on' : ''}" id="swInstall" role="switch" aria-checked="${!!s.install_on}" aria-label="${c.t('installApp')}"><span></span></button></div></div>
    <h2 class="grp">${c.t('saAdminsGrp')}</h2>
    <div class="card toggles"><div class="tg-row"><span class="tg-i">📜</span><span class="tg-t"><b>${c.t('clogDetailT')}</b><span>${c.t('clogDetailSub')}</span></span>
      <button class="switch ${c.program.look?.clogDetail ? 'on' : ''}" id="swClog" role="switch" aria-checked="${!!c.program.look?.clogDetail}" aria-label="${c.t('clogDetailT')}"><span></span></button></div></div>
    <h2 class="grp">🎨 ${c.t('lookTitle')}</h2>
    <div class="card look-card" id="lookCard"></div>
    <h2 class="grp">🧩 ${c.t('layTitle')}</h2>
    <div class="card lay-card" id="layCard"></div></div>
    <details class="card look-pv" id="lookPv"><summary>📱 ${c.t('tab_phone')}</summary><p class="muted" style="margin:4px 0 8px">${c.t('pfLookSub')}</p><div id="pfBox"></div></details></div>`;
  c.$('#swInstall').onclick = async (e) => {
    const sw = e.currentTarget, on = !sw.classList.contains('on'); sw.disabled = true;
    try {
      await c.api.superSet('install_on', on); c.evReset();
      sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on));
      c.toast(`${c.t('installApp')} · ${on ? c.t('moOn') : c.t('moOff')}`);
    } catch (err) { c.fail(err); }
    sw.disabled = false;
  };
  // v35: switch "admins can see the detailed change log" (programs.look.clogDetail, saved with program_set_look)
  c.$('#swClog').onclick = async (e) => {
    const sw = e.currentTarget, on = !sw.classList.contains('on'); sw.disabled = true;
    try {
      const look = { ...(c.program.look || {}), clogDetail: on };
      await c.api.programSetLook(c.program.id, look); keepLook(c, look);
      sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on));
      c.toast(`${c.t('clogDetailT')} · ${on ? c.t('moOn') : c.t('moOff')}`);
    } catch (err) { c.fail(err); }
    sw.disabled = false;
  };
  // v35 real mobile preview: open beside the settings on wide screens, folded on phones (opens when tapped)
  const pvBox = c.$('#lookPv'), wide = matchMedia('(min-width: 1100px)').matches;
  pvBox.open = wide;
  const pf = c.phoneFrame(c.$('#pfBox'), { lazy: !wide });
  pvBox.addEventListener('toggle', () => { if (pvBox.open) pf.load(); });
  const draft = { form: null, layout: null };
  c.pvPush = (part, v) => { draft[part] = v; pf.update({ ...(c.program.look || {}), ...(draft.form || {}), ...(draft.layout ? { layout: draft.layout } : {}) }); };
  drawLook(c);
  drawLayout(c);
}
function keepLook(c, look) {
  c.program.look = look;
  const row = c.program.list.find(x => x.id === c.program.id); if (row) row.look = look;
  try { Object.keys(localStorage).filter(k => k.includes('programs')).forEach(k => localStorage.removeItem(k)); } catch { }
}

// ---------- details for AI: the handoff (HANDOFF.md, published with every release), shown by section, copied as a ready prompt
export async function pAi(c) {
  c.view.innerHTML = `${c.pageHead('ℹ️ ' + c.t('tab_about'))}
    <div class="card"><p class="muted" style="margin:0 0 10px">${c.t('saAiSub')}</p>
      <p id="hoState" class="sa-ho muted">${c.t('loading')}…</p>
      <div class="sa-btns"><button class="btn primary" id="hoCopy" disabled>📋 ${c.t('saCopy')}</button><button class="btn" id="hoDl" disabled>📥 ${c.t('saDownload')}</button></div></div>
    <div id="hoBody"></div>
    <h2 class="grp">${c.t('saNext')}</h2>
    <div class="card"><ul class="sa-next">${['saN12', 'saN13', 'saN14', 'saN15', 'saN16']   /* v46: the old list was all done */.map(k => `<li>${c.t(k)}</li>`).join('')}</ul></div>`;
  let md = '';
  try { md = await fetch('HANDOFF.md?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject(new Error('http ' + r.status))); }
  catch (e) { console.error(e); const st = c.$('#hoState'); if (st) st.textContent = c.t('saHoFail'); return; }
  if (!c.$('#hoState')) return;                        // left the page meanwhile
  const hoVer = /current version is `(\d+)`/.exec(md)?.[1] || '?';
  const lines = md.split('\n').length, st = c.$('#hoState');
  st.innerHTML = hoVer === String(c.VERSION) ? `✓ ${c.t('saHoOk', hoVer, lines)}` : `⚠️ ${c.t('saHoOld', hoVer, c.VERSION)}`;
  st.className = 'sa-ho ' + (hoVer === String(c.VERSION) ? 'c-here' : 'c-leave');
  const parts = md.split(/\n(?=## )/);
  // all sections inside one folded card, each section folded too
  c.$('#hoBody').innerHTML = `<details class="card ho-all"><summary><b>📄 ${c.t('saHoRead', parts.length)}</b><span class="chev">›</span></summary>
    ${parts.map((p, i) => {
      const title = i === 0 ? c.t('saHoStart') : p.split('\n')[0].replace(/^##\s*/, '');
      return `<details class="ho-sec"><summary><span>${c.esc(title)}</span><span class="muted">${c.t('saHoLines', p.split('\n').length)}</span></summary><pre class="ho-pre">${c.esc(p)}</pre></details>`;
    }).join('')}</details>`;
  const prompt = PROMPT_HEAD(c.VERSION) + md;
  const copy = c.$('#hoCopy'), dl = c.$('#hoDl'); copy.disabled = dl.disabled = false;
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(prompt); c.toast('✓ ' + c.t('saCopied')); }
    catch { const ta = document.createElement('textarea'); ta.value = prompt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); c.toast('✓ ' + c.t('saCopied')); } catch { c.toast(c.t('errGeneric')); } ta.remove(); }
  };
  dl.onclick = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([prompt], { type: 'text/markdown' }));
    a.download = `youth-alpha-ai-prompt-v${c.VERSION}.md`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
}

// ---------- v32 admins: who may open which program and do what (supabase/021_admin_access.sql)
const permLine = (c, access) => {
  const parts = Object.entries(access || {}).filter(([, a]) => a?.length).map(([pid, a]) => {
    const p = c.program.list.find(x => String(x.id) === pid);
    return `${c.esc(p?.name || '#' + pid)} (${a.length === c.PERMS.length ? c.t('permAll') : a.length + '/' + c.PERMS.length})`;
  });
  return parts.join(' · ') || c.t('permNoProg');
};
export async function pAdmins(c) {
  const list = await c.api.adminList();
  const waiting = list.filter(a => a.pending), team = list.filter(a => !a.pending);
  const row = (a) => `<a class="li click adm-li ${a.pending || a.active ? '' : 'off'}" href="#/admin/admins/${a.user_id}">
      <span class="av">${a.pending ? '⏳' : a.active ? '🧑‍💼' : '⛔'}</span>
      <span class="grow"><b>${c.esc(a.name)}</b><span class="sub">@${c.esc(a.username)}${!a.pending && !a.active ? ' · ' + c.t('admIsOff') : ''}</span>
        <span class="sub">${a.pending ? c.t('admWaiting') : permLine(c, a.access)}</span></span><span class="muted">${a.pending ? c.t('admApprove') : c.t('edit')} ›</span></a>`;
  c.view.innerHTML = `${c.pageHead('👥 ' + c.t('tab_admins'))}
    <p class="muted sa-intro">${c.t('admIntro')}</p>
    <button class="btn primary wide" id="admNew" style="margin-bottom:12px">➕ ${c.t('admNew')}</button>
    ${waiting.length ? `<h2 class="grp">⏳ ${c.t('admWaitingGrp', waiting.length)}</h2><div class="card"><div class="list">${waiting.map(row).join('')}</div></div>` : ''}
    <h2 class="grp">${c.t('admTeam', team.length)}</h2>
    <div class="card"><div class="list">${team.map(row).join('') || `<p class="muted">${c.t('none')}</p>`}</div></div>
    <p class="hint" style="margin:8px 4px">${c.t('admSuperNote')}</p>`;
  c.$('#admNew').onclick = () => newAdmin(c);
}
async function newAdmin(c, keep = {}) {
  const r = await c.modal('➕ ' + c.t('admNew'), `
    <div class="field"><label>${c.t('username')}</label><input class="input" name="u" required maxlength="30" autocapitalize="none" spellcheck="false" value="${c.esc(keep.u || '')}"><p class="hint">${c.t('memUserHint')}</p></div>
    <div class="field"><label>${c.t('admName')}</label><input class="input" name="n" maxlength="40" value="${c.esc(keep.n || '')}"></div>
    <div class="field"><label>${c.t('password')}</label><input class="input" name="p" type="text" required minlength="6" maxlength="72" autocomplete="off" spellcheck="false"><p class="hint">${c.t('admPwHint')}</p></div>
    <p class="hint">${c.t('admNewHint')}</p>`, { okText: c.t('admCreate') });
  if (!(r instanceof FormData)) return;
  const u = String(r.get('u')).trim().toLowerCase(), n = String(r.get('n')).trim(), pw = String(r.get('p'));
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(u)) { c.toast(c.t('memUserHint')); return newAdmin(c, { u, n }); }
  if (pw.length < 6) { c.toast(c.t('admPwHint')); return newAdmin(c, { u, n }); }
  try {
    const id = await c.api.adminCreate(u, pw, n);
    c.toast('✓ ' + c.t('admMade', u));
    location.hash = '#/admin/admins/' + id;             // next: pick its programs and permissions
  } catch (e) {
    if (/duplicate/i.test(String(e?.message || e))) { c.toast(c.t('admDup')); return newAdmin(c, { u, n }); }
    c.fail(e);
  }
}
export async function pAdminEdit(c, uid) {
  const list = await c.api.adminList(), a = list.find(x => x.user_id === uid);
  if (!a) { location.hash = '#/admin/admins'; return; }
  const progs = c.program.list.filter(p => !p.archived || (a.access?.[String(p.id)] || []).length);
  const has = (pid, k) => (a.access?.[String(pid)] || []).includes(k);
  c.view.innerHTML = `${c.pageHead('👥 ' + c.esc(a.name), '#/admin/admins')}
    <form id="admForm">
      <div class="card">
        <p class="muted" style="margin:0 0 8px">@${c.esc(a.username)} · ${c.t('admLast')}: ${c.dTime(a.last_sign_in_at)}</p>
        ${a.pending ? `<p class="c-leave" style="margin:0 0 10px">⏳ ${c.t('admWaitingSub')}</p>` : ''}
        <div class="field"><label>${c.t('admName')}</label><input class="input" name="n" maxlength="40" value="${c.esc(a.name || '')}"></div>
        ${a.pending ? '' : `<div class="tg-row"><span class="tg-i">🔓</span><span class="tg-t"><b>${c.t('admActive')}</b><span>${c.t('admActiveSub')}</span></span>
          <button type="button" class="switch ${a.active ? 'on' : ''}" id="admOn" role="switch" aria-checked="${!!a.active}" aria-label="${c.t('admActive')}"><span></span></button></div>`}
      </div>
      <h2 class="grp">${c.t('admPerms')}</h2>
      <p class="muted" style="margin:-4px 4px 10px">${c.t('admPermsSub')}</p>
      ${progs.map(p => `<div class="card perm-card" data-pid="${p.id}">
        <div class="perm-top"><b>📁 ${c.esc(p.name)}</b><button type="button" class="btn small" data-all="${p.id}">${c.t('permTickAll')}</button></div>
        <div class="perm-grid">${c.PERMS.map(k => `<label class="chk perm-chk"><input type="checkbox" name="p_${p.id}_${k}" ${has(p.id, k) ? 'checked' : ''}>
          <span><b>${c.t('perm_' + k)}</b><span class="sub">${c.t('permSub_' + k)}</span></span></label>`).join('')}</div></div>`).join('')}
      <div class="bottom-bar"><button class="btn primary" type="submit">💾 ${a.pending ? c.t('admApproveSave') : c.t('save')}</button></div>
    </form>
    ${a.app_login && !a.pending ? `<h2 class="grp">🔑 ${c.t('admPwTitle')}</h2>
    <form class="card" id="admPw"><div class="field"><label>${c.t('memNewPw')}</label><input class="input" name="p" type="text" required minlength="6" maxlength="72" autocomplete="off" spellcheck="false">
      <p class="hint">${c.t('admPwHint')}</p></div><button class="btn wide">${c.t('admPwSet')}</button></form>` : ''}
    <div style="height:70px"></div>`;
  const f = c.$('#admForm');
  let active = a.pending ? true : !!a.active;
  const sw = c.$('#admOn');
  if (sw) sw.onclick = () => { active = !active; sw.classList.toggle('on', active); sw.setAttribute('aria-checked', String(active)); };
  f.querySelectorAll('[data-all]').forEach(b => b.onclick = () => {
    const boxes = [...f.querySelectorAll(`[name^="p_${b.dataset.all}_"]`)], on = !boxes.every(x => x.checked);
    boxes.forEach(x => { x.checked = on; });
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const access = {};
    progs.forEach(p => { const list = c.PERMS.filter(k => f[`p_${p.id}_${k}`].checked); if (list.length) access[String(p.id)] = list; });
    const name = f.n.value.trim() || a.username;
    if (!active && (a.active || a.pending) && !(await c.confirmBox(c.t('admOffWarn', name), c.t('admOff')))) return;
    if (active && !Object.keys(access).length && !(await c.confirmBox(c.t('admNoProgWarn', name), c.t('save'), false))) return;
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try { await c.api.adminSave(a.user_id, name, active, access); c.toast('✓ ' + c.t('saved')); location.hash = '#/admin/admins'; }
    catch (err) { c.fail(err); btn.disabled = false; }
  };
  const pw = c.$('#admPw');
  if (pw) pw.onsubmit = async (e) => {
    e.preventDefault();
    const v = String(pw.p.value);
    if (v.length < 6) { c.toast(c.t('admPwHint')); return; }
    try { await c.api.adminPassword(a.user_id, v); pw.reset(); c.toast('✓ ' + c.t('admPwDone', a.username)); } catch (err) { c.fail(err); }
  };
}

// ---------- v32 who is online now (admin pages ping about every 45 s; shown for 10 minutes)
export async function pOnline(c) {
  c.view.innerHTML = `${c.pageHead('👥 ' + c.t('tab_admins'))}<p class="muted sa-intro">${c.t('onlineIntro')}</p><div class="card"><div class="list" id="onList"><p class="muted">${c.t('loading')}…</p></div></div>
    <p class="hint" style="margin:8px 4px" id="onAt"></p>`;
  const seq = c.renderSeq();
  const ago = (iso) => { const s = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000)); return s < 60 ? c.t('agoS', s) : c.t('agoM', Math.round(s / 60)); };
  const draw = async () => {
    if (seq !== c.renderSeq()) return clearInterval(timer);   // left the page
    let rows = [];
    try { rows = await c.api.adminOnline(); } catch (e) { console.error(e); }
    const box = c.$('#onList'); if (!box) return clearInterval(timer);
    box.innerHTML = rows.map(r => {
      const live = Date.now() - new Date(r.seen_at) < 2 * 6e4, p = c.program.list.find(x => x.id === r.program_id);
      const page = r.page && r.page !== 'home' ? c.t('tab_' + r.page) : c.t('adultMenu');
      return `<div class="li on-li"><span class="av">${live ? '🟢' : '⚪'}</span><span class="grow"><b>${r.is_super ? '👑 ' : ''}${c.esc(r.name || '?')}</b>
        <span class="sub">${c.esc(p?.name || '')} · ${c.esc(page)}</span></span><span class="muted">${ago(r.seen_at)}</span></div>`;
    }).join('') || `<p class="muted">${c.t('onlineNone')}</p>`;
    c.$('#onAt').textContent = c.t('onlineAuto');
  };
  const timer = setInterval(draw, 20000);
  draw();
}

// ---------- programs: list with each one's own link, create, rename, archive (never delete)
async function drawPrograms(c) {
  const box = c.$('#progList'); if (!box) return;
  const list = await c.api.programs().catch(() => c.program.list);
  c.program.list = list;
  box.innerHTML = list.map(p => `<div class="prog-row ${p.archived ? 'arch' : ''}">
      <div class="prog-top"><b>${c.esc(p.name)}</b>${p.id === c.program.id ? `<span class="now-tag">${c.t('progHere')}</span>` : ''}${p.archived ? `<span class="arch-tag">${c.t('progArchived')}</span>` : ''}</div>
      <code class="prog-link">${c.esc(c.linkFor(p.slug))}</code>
      <div class="prog-btns"><button class="btn small" data-copy="${p.id}">📋 ${c.t('progCopy')}</button>
        <a class="btn small" href="${c.esc(c.linkFor(p.slug))}#/admin">⚙️ ${c.t('progOpen')}</a>
        <button class="btn small" data-edit="${p.id}">✏️ ${c.t('progEdit')}</button></div>
      <div class="prog-maint ${c.maintLive(p.maintenance) ? 'on' : ''}"><span>🛠️ ${c.t('mtLabel')}: <b>${c.maintLive(p.maintenance) ? c.t('mtIsOn', c.t('mt_' + (p.maintenance.scene === 'bunny' ? 'bunny' : 'tree'))) + (c.maintEnds(p.maintenance) ? ' · ⏱ ' + c.maintEnds(p.maintenance) : '') : c.t('mtIsOff')}</b></span>
        <button class="btn small" data-maint="${p.id}">${c.maintLive(p.maintenance) ? c.t('mtTurnOff') : c.t('mtTurnOn')}</button></div></div>`).join('');
  box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => {
    const p = list.find(x => x.id === +b.dataset.copy);
    try { await navigator.clipboard.writeText(c.linkFor(p.slug)); c.toast('✓ ' + c.t('progCopied')); } catch { c.toast(c.linkFor(p.slug)); }
  });
  // v37 maintenance mode: switch it on (pick a scene) or off, with a warning that names the program
  box.querySelectorAll('[data-maint]').forEach(b => b.onclick = async () => {
    const p = list.find(x => x.id === +b.dataset.maint), on = !c.maintLive(p.maintenance);
    let scene = p.maintenance?.scene === 'bunny' ? 'bunny' : 'tree', minutes = 0;
    if (on) {
      // v46: a timer — maintenance ends by itself after the chosen time (0 = no timer, ends only when switched off)
      const r = await c.modal('🛠️ ' + c.esc(p.name), `<p>${c.t('mtWhat')}</p>
        <div class="field"><label>${c.t('mtScene')}</label><div class="seg">${['tree', 'bunny'].map(k => `<label><input type="radio" name="scene" value="${k}" ${k === scene ? 'checked' : ''}>${c.t('mt_' + k)}</label>`).join('')}</div></div>
        <div class="field"><label for="mtMin">${c.t('mtTimer')}</label><select class="input" id="mtMin" name="min">${MT_TIMES.map(m => `<option value="${m}" ${m === 60 ? 'selected' : ''}>${m ? c.t('mtFor', m) : c.t('mtNoTimer')}</option>`).join('')}</select></div>
        <div class="field"><label for="mtOther">${c.t('mtOther')}</label><input class="input" id="mtOther" name="other" type="number" min="1" max="10080" inputmode="numeric" placeholder="${c.t('mtOtherPh')}"></div>`,
        { okText: c.t('mtTurnOn') });
      if (!(r instanceof FormData)) return;
      scene = String(r.get('scene') || 'tree');
      const other = Math.trunc(Number(r.get('other')) || 0);
      minutes = Math.min(10080, Math.max(0, other > 0 ? other : Math.trunc(Number(r.get('min')) || 0)));
      if (!(await c.confirmBox(c.t('mtWarnOn', p.name) + (minutes ? '\n⏱ ' + c.t('mtFor', minutes) : ''), c.t('mtTurnOn'), false))) return;
    } else if (!(await c.confirmBox(c.t('mtWarnOff', p.name), c.t('mtTurnOff'), false))) return;
    try {
      await c.api.programSetMaint(p.id, on, scene, minutes);
      const m = { on, scene, until: on && minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null };
      p.maintenance = m;
      if (p.id === c.program.id) c.program.maintenance = m;
      c.toast('✓ ' + c.t(on ? 'mtDoneOn' : 'mtDoneOff', p.name));
      drawPrograms(c); c.paintMaintBar?.();
    } catch (e) { c.fail(e); }
  });
  box.querySelectorAll('[data-edit]').forEach(b => b.onclick = async () => {
    const p = list.find(x => x.id === +b.dataset.edit);
    const r = await c.modal('✏️ ' + c.esc(p.name), `<div class="field"><label>${c.t('progName')}</label><input class="input" name="name" required maxlength="60" value="${c.esc(p.name)}"></div>
      ${p.id === 1 ? '' : `<label class="chk"><input type="checkbox" name="arch" ${p.archived ? 'checked' : ''}> ${c.t('progArchive')}</label><p class="hint">${c.t('progArchiveHint')}</p>`}`);
    if (!(r instanceof FormData)) return;
    try { await c.api.programUpdate(p.id, String(r.get('name')).trim(), r.get('arch') === 'on'); c.toast(c.t('saved')); drawPrograms(c); } catch (e) { c.fail(e); }
  });
}

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

async function newProgram(c) {
  const list = c.program.list;
  const pending = c.modal('➕ ' + c.t('progNew'), `
    <div class="field"><label>${c.t('progName')}</label><input class="input" name="name" required maxlength="60" placeholder="${c.t('progNameEg')}" aria-describedby="nameErr"><p class="field-err" id="nameErr" role="alert" hidden></p></div>
    <div class="field"><label>${c.t('progSlug')}</label><input class="input" name="slug" required maxlength="40" placeholder="easter-2027" autocapitalize="none" spellcheck="false" aria-describedby="slugHint slugErr">
      <p class="hint" id="slugHint">${c.t('progSlugHint')}</p><p class="field-err" id="slugErr" role="alert" hidden></p></div>
    <div class="field"><label>${c.t('progFrom')}</label><select class="input" name="from">${list.map(p => `<option value="${p.id}" ${p.id === c.program.id ? 'selected' : ''}>${c.esc(p.name)}</option>`).join('')}</select>
      <p class="hint">${c.t('progFromHint')}</p></div>
    <label class="chk"><input type="checkbox" name="people"> ${c.t('progPeople')}</label>
    <label class="chk"><input type="checkbox" name="shop" checked> ${c.t('progShop')}</label>
    <label class="chk"><input type="checkbox" name="songs" checked> ${c.t('progSongs')}</label>`, { okText: c.t('progCreate') });
  // the link name fills itself from the program name until it is typed by hand.
  // v45 (critique P1): a Thai name has no a–z, so a free link name is suggested ("program-2026-11"); mistakes show in Thai
  // under the field and the box stays open (no browser bubble, no lost typing)
  const f = document.querySelector('#dlgForm'), nm = f.querySelector('[name=name]'), sl = f.querySelector('[name=slug]');
  const hint = f.querySelector('#slugHint'), used = (x) => list.some(p => p.slug === x);
  const free = (base) => { let x = base, i = 2; while (used(x)) x = `${base}-${i++}`; return x; };
  const suggest = (n) => { const x = slugify(n); if (x.length >= 2) return x; if (!n.trim()) return '';
    const d = new Date(); return free(`program-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const err = (input, msg) => { const e = f.querySelector(input === nm ? '#nameErr' : '#slugErr'); e.textContent = msg || ''; e.hidden = !msg; input.toggleAttribute('aria-invalid', !!msg); };
  let auto = true;
  sl.oninput = () => { auto = false; err(sl, ''); };
  sl.onblur = () => { if (sl.value) sl.value = slugify(sl.value) || sl.value; };
  nm.oninput = () => { err(nm, ''); if (!auto) return; const x = suggest(nm.value); sl.value = x; err(sl, '');
    hint.textContent = x && slugify(nm.value).length < 2 ? c.t('progSlugAuto') : c.t('progSlugHint'); };
  f.noValidate = true;
  const check = (e) => {
    if (e.submitter?.value !== 'ok') return;
    const n = nm.value.trim(), x = slugify(sl.value);
    let bad = false;
    if (!n) { err(nm, c.t('progNameNeed')); bad = true; }
    if (x.length < 2) { err(sl, c.t('progSlugBad')); bad = true; } else if (used(x)) { err(sl, c.t('progSlugUsed')); bad = true; } else sl.value = x;
    if (bad) { e.preventDefault(); (n ? sl : nm).focus(); }
  };
  f.addEventListener('submit', check);
  const r = await pending;
  f.removeEventListener('submit', check); f.noValidate = false;
  if (!(r instanceof FormData)) return;
  const name = String(r.get('name')).trim(), slug = slugify(r.get('slug'));
  try {
    const res = await c.api.programCreate({ name, slug, from: +r.get('from'), people: r.get('people') === 'on', shop: r.get('shop') === 'on', songs: r.get('songs') === 'on' });
    if (!res?.ok) throw new Error('create failed');
    c.toast('✓ ' + c.t('progMade', name));
    await drawPrograms(c);
    const row = [...document.querySelectorAll('.prog-row')].find(x => x.querySelector('.prog-link')?.textContent.includes(slug));   // v45: show where it went
    if (row) { row.classList.add('just-made'); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  } catch (e) { c.fail(e); }
}


// ---------- v28 program settings: name on screen, theme pack, font, text size, parts on/off, wording
// ---------- v31 member login mode of the program this link opens (program_set_login, supabase/020_members.sql)
export async function drawLogin(c) {
  const box = c.$('#loginCard'); if (!box) return;
  let cur = c.program.login || 'off';
  const n = await c.api.memberList().then(l => l.length).catch(() => null);
  box.innerHTML = `<p class="muted" style="margin:0 0 10px">${c.t('saLoginSub')}</p>
    <div class="lm-opts">${['off', 'personal', 'all'].map(m => `<label class="lm-opt"><input type="radio" name="lm" value="${m}" ${m === cur ? 'checked' : ''}>
      <span><b>${c.t('lm_' + m)}</b><span class="sub">${c.t('lm_' + m + '_sub')}</span></span></label>`).join('')}</div>
    ${n != null ? `<p class="hint" style="margin:10px 0 0">${c.t('saLoginAccts', n)} · <a href="#/admin/members">${c.t('tab_members')} ›</a></p>` : ''}
    <button class="btn primary wide" id="lmSave" style="margin-top:12px" disabled>💾 ${c.t('save')}</button>`;
  const save = box.querySelector('#lmSave');
  const pick = () => box.querySelector('input[name="lm"]:checked')?.value || 'off';
  box.querySelectorAll('input[name="lm"]').forEach(r => r.onchange = () => { save.disabled = pick() === cur; });
  save.onclick = async () => {
    const m = pick(); if (m === cur) return;
    if (m === 'all' && !(await c.confirmBox(c.t('saLoginAllWarn'), c.t('save'), false))) return;
    save.disabled = true;
    try {
      await c.api.programSetLogin(c.program.id, m);
      cur = c.program.login = m;
      const pr = c.program.list.find(x => x.id === c.program.id); if (pr) pr.login_mode = m;
      try { Object.keys(localStorage).filter(k => k.includes('programs')).forEach(k => localStorage.removeItem(k)); } catch { }
      c.toast(c.t('saLoginSaved'));
    } catch (e) { c.fail(e); save.disabled = false; }
  };
}

// saved in programs.look of the program this link opens (program_set_look, supabase/019_program_look.sql)
function drawLook(c) {
  const box = c.$('#lookCard'); if (!box) return;
  const L = JSON.parse(JSON.stringify(c.program.look || {})), K = c.LOOK, off = L.off || {}, words = L.words || {};
  const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${label}</option>`;
  // v34: playful parts are choices (look.parts); the plain on/off switches are only the pages
  const PK = Object.keys(K.PARTS), oldKeys = PK.map(k => K.PARTS[k].old), pageFeats = K.FEATS.filter(([k]) => !oldKeys.includes(k));
  const lg = c.logoOf(L), logo = { type: lg.img ? 'image' : 'emoji', url: L.logo?.url || '', size: lg.size };
  box.innerHTML = `<p class="muted" style="margin:0 0 6px">${c.t('lookSub', c.esc(c.program.name))}</p>
    <form id="lookForm">
      <label>${c.t('lookMode')}<select class="input" name="mode">${opt('kids', L.mode === 'normal' ? 'normal' : 'kids', c.t('mode_kids'))}${opt('normal', L.mode === 'normal' ? 'normal' : 'kids', c.t('mode_normal'))}</select></label>
      <p class="hint" style="margin:-4px 0 10px">${c.t('lookModeHint')}</p>
      <div class="look-row">
        <label>${c.t('lookName')}<input class="input" name="title" maxlength="30" value="${c.esc(L.title || '')}" placeholder="Youth Alpha"></label>
        <label>${c.t('lookLogo')}<select class="input" name="logoType">${opt('emoji', logo.type, c.t('logo_emoji'))}${opt('image', logo.type, c.t('logo_image'))}</select></label>
      </div>
      <label data-lg="emoji">${c.t('lookEmoji')}<input class="input" name="emoji" maxlength="8" value="${c.esc(L.emoji || '')}" placeholder="${(K.PACKS[L.pack] || K.PACKS.christmas).emoji}"></label>
      <div data-lg="image"><button type="button" class="btn" id="logoPick"></button><input type="file" accept="image/*" id="logoFile" hidden>
        <p class="hint" style="margin:4px 0 6px">${c.t('lookLogoHint')}</p></div>
      <label>${c.t('lookLogoSize')} <span id="logoSizeV"></span>
        <input type="range" name="logoSize" min="0.6" max="2" step="0.1" value="${logo.size}"></label>
      <div class="logo-pv" id="logoPv" aria-hidden="true"></div>
      <div class="look-row">
        <label>${c.t('lookPack')}<select class="input" name="pack">${Object.keys(K.PACKS).map(k => opt(k, L.pack || 'christmas', c.t('pack_' + k))).join('')}</select></label>
        <label>${c.t('lookFont')}<select class="input" name="font">${Object.entries(K.FONTS).map(([k, f]) => opt(k, L.font || 'noto', f)).join('')}</select></label>
      </div>
      <p class="hint" style="margin:-4px 0 10px">${c.t('lookPackHint')}</p>
      <label>${c.t('lookSize')} <span id="lookSizeV">${Math.round((L.size || 1) * 100)}%</span>
        <input type="range" name="size" min="0.9" max="1.3" step="0.05" value="${L.size || 1}"></label>
      <div class="look-sample" id="lookSample">ตัวอย่างตัวอักษร · Sample text 123</div>
      <b>${c.t('lookOnOff')}</b>
      <div class="look-feats">${pageFeats.map(([k, i]) => `<label><input type="checkbox" name="f_${k}" ${off[k] ? '' : 'checked'}> ${i} ${c.t('feat_' + k)}</label>`).join('')}</div>
      <b>${c.t('lookParts')}</b>
      <div class="look-parts">${PK.map(k => `<label>${K.PARTS[k].icon} ${c.t('part_' + k)}<select class="input" name="p_${k}">${
        [...Object.keys(K.PARTS[k].opts), 'off'].map(v => opt(v, c.partOf(L, k), c.t('opt_' + v))).join('')}</select></label>`).join('')}</div>
      <p class="hint" style="margin:-4px 0 10px">${c.t('lookPartsHint')}</p>
      <details class="ho-sec"><summary><span>✏️ ${c.t('lookWords')}</span><span class="muted">${c.t('lookWordsSub')}</span></summary>
        <div class="look-words">${K.WORDS.map(k => `<div class="lw"><span>${c.esc(c.tBase(k, 'th'))}</span>
          <input class="input" name="th_${k}" maxlength="60" value="${c.esc(words.th?.[k] || '')}" placeholder="${c.esc(c.tBase(k, 'th'))}" aria-label="TH ${k}">
          <input class="input" name="en_${k}" maxlength="60" value="${c.esc(words.en?.[k] || '')}" placeholder="${c.esc(c.tBase(k, 'en'))}" aria-label="EN ${k}"></div>`).join('')}</div>
        <p class="hint">${c.t('lookWordsHint')}</p></details>
      <button class="btn primary wide" type="submit" style="margin-top:12px">💾 ${c.t('lookSave')}</button>
    </form>`;
  const f = c.$('#lookForm'), sample = c.$('#lookSample');
  const paintSample = () => {
    const fn = K.FONTS[f.font.value];
    sample.style.fontFamily = `'${fn}', 'Noto Sans Thai', sans-serif`;
    sample.style.fontSize = (18 * Number(f.size.value)).toFixed(1) + 'px';
    c.$('#lookSizeV').textContent = Math.round(Number(f.size.value) * 100) + '%';
    if (fn && !document.querySelector(`link[data-font="${f.font.value}"]`) && f.font.value !== 'noto') {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.font = f.font.value;
      l.href = `https://fonts.googleapis.com/css2?family=${fn.replace(/ /g, '+')}:wght@400;600;700&display=swap`; document.head.appendChild(l);
    }
  };
  f.font.onchange = f.size.oninput = paintSample; paintSample();
  // v34 logo: emoji or picture, size slider, live preview
  const paintLogo = () => {
    logo.type = f.logoType.value; logo.size = Number(f.logoSize.value);
    box.querySelectorAll('[data-lg]').forEach(el => { el.hidden = el.dataset.lg !== logo.type; });
    c.$('#logoPick').textContent = logo.url ? c.t('lookLogoChange') : c.t('lookLogoUp');
    c.$('#logoSizeV').textContent = Math.round(logo.size * 100) + '%';
    const pv = c.$('#logoPv'), em = f.emoji.value.trim() || f.emoji.placeholder;
    pv.style.setProperty('--s', logo.size);
    pv.innerHTML = logo.type === 'image' ? (logo.url ? `<img src="${c.esc(logo.url)}" alt="">` : `<span class="muted" style="font-size:1rem">${c.t('lookLogoNone')}</span>`) : `<span>${c.esc(em)}</span>`;
  };
  f.logoType.onchange = f.logoSize.oninput = f.emoji.oninput = paintLogo; paintLogo();
  const file = c.$('#logoFile');
  c.$('#logoPick').onclick = () => file.click();
  file.onchange = async () => {
    const fl = file.files[0]; file.value = ''; if (!fl) return;
    const b = c.$('#logoPick'); b.disabled = true; b.textContent = '⏳';
    try { logo.url = await c.uploadImage(fl); } catch (err) { c.fail(err); }
    b.disabled = false; paintLogo(); f.dispatchEvent(new Event('change'));
  };
  // choosing a pack sets every part to that pack's choice (plain church pack: all off); each can be changed again
  const setParts = (v) => PK.forEach(k => { f['p_' + k].value = v === 'off' ? 'off' : (K.PACK_PARTS[v] || K.PACK_PARTS.christmas)[k]; });
  f.pack.onchange = () => setParts(f.pack.value === 'plain' || f.mode.value === 'normal' ? 'off' : f.pack.value);
  // v33: Normal mode switches the playful parts off; back to Kids mode switches them on again (not for the plain church pack)
  f.mode.onchange = () => setParts(f.mode.value === 'normal' || f.pack.value === 'plain' ? 'off' : f.pack.value);
  const collect = (check) => {
    const look = { ...(c.program.look || {}), mode: f.mode.value, title: f.title.value.trim(), emoji: f.emoji.value.trim(), pack: f.pack.value, font: f.font.value, size: Number(f.size.value), off: {}, words: { th: {}, en: {} } };
    pageFeats.forEach(([k]) => { if (!f['f_' + k].checked) look.off[k] = true; });
    look.parts = Object.fromEntries(PK.map(k => [k, f['p_' + k].value]));
    if (logo.type === 'image' && !logo.url) { if (check) { c.toast(c.t('lookLogoNeed')); return null; } }
    else look.logo = { type: logo.type, size: logo.size, ...(logo.url ? { url: logo.url } : {}) };
    K.WORDS.forEach(k => ['th', 'en'].forEach(l => { const v = f[`${l}_${k}`].value.trim(); if (v) look.words[l][k] = v; }));
    return look;
  };
  // v35: every change shows at once in the phone preview (not saved until Save)
  let pvT = 0; const pv = () => { clearTimeout(pvT); pvT = setTimeout(() => c.pvPush?.('form', collect(false)), 350); };
  f.addEventListener('input', pv); f.addEventListener('change', pv);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const look = collect(true); if (!look) return;
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    try {
      await c.api.programSetLook(c.program.id, look);
      c.program.look = look;
      const row = c.program.list.find(x => x.id === c.program.id); if (row) row.look = look;
      try { Object.keys(localStorage).filter(k => k.includes('programs')).forEach(k => localStorage.removeItem(k)); } catch { }
      c.applyLook(); c.toast('✓ ' + c.t('saved'));
    } catch (err) { c.fail(err); }
    btn.disabled = false;
  };
}


// ---------- v29 layout editor: order and show/hide of the bottom tabs, the home page parts and the menu rows
// saved as programs.look.layout = { tabs: [...], home: [...], menu: [...], hide: { tabs: [], home: [], menu: [] } }
// (same program_set_look call as the program settings; app.js layKeys() reads it)
function drawLayout(c) {
  const box = c.$('#layCard'); if (!box) return;
  const K = c.LOOK, KINDS = ['tabs', 'home', 'menu'];
  const lay = { hide: {} };
  KINDS.forEach(k => { lay[k] = c.layKeys(k, true); lay.hide[k] = (c.program.look?.layout?.hide?.[k] || []).filter(x => !K.LOCKED[k].includes(x)); });
  const info = (kind, key) => K.LAYOUT[kind].find(x => x[0] === key);
  const label = (kind, key) => { const [, i, w] = info(kind, key); return `${i} ${c.esc(c.t(w))}`; };

  box.innerHTML = `<p class="muted" style="margin:0 0 6px">${c.t('laySub')}</p>
    <div class="lay-wrap"><div>${KINDS.map(k => `<h3>${c.t('lay_' + k)}</h3><ul class="lay-list" data-kind="${k}"></ul>`).join('')}</div>
      <div class="lay-phone" id="layPhone" aria-hidden="true"></div></div>
    <div class="sa-btns" style="margin-top:14px"><button class="btn primary" id="laySave">💾 ${c.t('laySave')}</button><button class="btn" id="layReset">↺ ${c.t('layReset')}</button></div>`;

  const paint = () => {
    KINDS.forEach(kind => {
      const ul = box.querySelector(`[data-kind="${kind}"]`);
      ul.innerHTML = lay[kind].map((key) => {
        const off = lay.hide[kind].includes(key), locked = K.LOCKED[kind].includes(key);
        return `<li class="lay-item ${off ? 'off' : ''}" data-key="${key}">
          <span class="lh" aria-hidden="true">⠿</span><span class="ll">${label(kind, key)}</span>
          <button type="button" data-eye ${locked ? 'disabled' : ''} aria-label="${off ? c.t('layShow') : c.t('layHide')}" title="${locked ? c.t('layLocked') : ''}">${locked ? '🔒' : off ? '🙈' : '👁️'}</button></li>`;
      }).join('');
    });
    const vis = (kind) => lay[kind].filter(k => !lay.hide[kind].includes(k));
    const L = c.program.look || {};
    const lgo = c.logoOf(L);
    c.$('#layPhone').innerHTML = `<div class="pv-bar">${lgo.img ? `<img src="${c.esc(lgo.url)}" alt="" style="height:1.3em;width:auto;vertical-align:middle">` : c.esc(L.emoji || '🎄')} ${c.esc(L.title || 'Youth Alpha')}</div>
      <div class="pv-home">${vis('home').map(k => `<div class="${k === 'rank' ? 'big' : ''}">${label('home', k)}</div>`).join('')}</div>
      <div class="pv-menu">☰ ${vis('menu').map(k => info('menu', k)[1]).join(' ')}</div>
      <div class="pv-tabs">${vis('tabs').map(k => `<span>${info('tabs', k)[1]}</span>`).join('')}</div>`;
    c.pvPush?.('layout', JSON.parse(JSON.stringify(lay)));          // v35: the real phone preview follows too
  };
  paint();

  const move = (kind, from, to) => { const a = lay[kind]; if (to < 0 || to >= a.length || from === to) return; a.splice(to, 0, a.splice(from, 1)[0]); };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'), li = e.target.closest('.lay-item'); if (!b || !li) return;
    const kind = li.parentElement.dataset.kind, key = li.dataset.key;
    if (b.hasAttribute('data-eye')) { const h = lay.hide[kind]; h.includes(key) ? h.splice(h.indexOf(key), 1) : h.push(key); }
    else return;
    paint();
  });

  // drag with a finger or the mouse on the ⠿ handle (pointer events, so it works on phones too)
  let drag = null;
  box.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.lh'); if (!h) return;
    const li = h.closest('.lay-item');
    drag = { li, kind: li.parentElement.dataset.kind, y0: e.clientY };
    li.classList.add('dragging'); h.setPointerCapture(e.pointerId); e.preventDefault();
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const ul = drag.li.parentElement, items = [...ul.children];
    drag.li.style.transform = `translateY(${e.clientY - drag.y0}px)`;
    const over = items.find(x => x !== drag.li && (() => { const r = x.getBoundingClientRect(); return e.clientY > r.top && e.clientY < r.bottom; })());
    if (!over) return;
    const a = lay[drag.kind], from = a.indexOf(drag.li.dataset.key), to = a.indexOf(over.dataset.key);
    move(drag.kind, from, to);
    const r0 = drag.li.getBoundingClientRect().top;
    to > from ? over.after(drag.li) : over.before(drag.li);
    drag.y0 += drag.li.getBoundingClientRect().top - r0;            // keep the item under the finger after it jumps
    drag.li.style.transform = `translateY(${e.clientY - drag.y0}px)`;
  });
  const end = () => { if (!drag) return; drag.li.classList.remove('dragging'); drag.li.style.transform = ''; drag = null; paint(); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);

  const save = async (layout) => {
    const look = { ...(c.program.look || {}), layout };
    try {
      await c.api.programSetLook(c.program.id, look);
      c.program.look = look;
      const row = c.program.list.find(x => x.id === c.program.id); if (row) row.look = look;
      try { Object.keys(localStorage).filter(k => k.includes('programs')).forEach(k => localStorage.removeItem(k)); } catch { }
      c.applyLook(); c.toast('✓ ' + c.t('saved'));
    } catch (err) { c.fail(err); }
  };
  c.$('#laySave').onclick = () => save(JSON.parse(JSON.stringify(lay)));
  c.$('#layReset').onclick = async () => {
    if (!(await c.confirmBox(c.t('layResetWarn'), c.t('layReset'), false))) return;
    KINDS.forEach(k => { lay[k] = K.LAYOUT[k].map(x => x[0]); lay.hide[k] = []; });
    paint(); await save({});
  };
}
