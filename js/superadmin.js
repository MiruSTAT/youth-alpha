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
  if (r?.ok) { c.toast('👑 ' + c.t('saWelcome', c.esc(r.username || ''))); location.hash = '#/admin/super'; return c.render(); }
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
      if (r?.ok) { c.toast('👑 ' + c.t('saWelcome', c.esc(r.username))); location.hash = '#/admin/super'; return c.render(); }
      c.toast(c.t('saClaim_' + (r?.reason || 'x')));
    } catch (err) { c.fail(err); }
    b.disabled = false;
  };
}

// ---------- the super admin page
export async function pSuper(c) {
  const [info, s] = await Promise.all([c.api.superInfo().catch(() => null), c.api.settings()]);
  const until = info?.until ? new Date(info.until).toLocaleTimeString(c.getLang() === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  c.view.innerHTML = `${c.pageHead('👑 ' + c.t('saTitle'))}
    <p class="muted sa-intro">${c.t('saIntro')}</p>
    <div class="card sa-who"><div class="sa-who-top"><span class="sa-crown">👑</span><span class="grow"><b>${c.esc(info?.username || '')}</b><span class="sub">${c.t('saUntil', until)}</span></span></div>
      <button class="btn wide" id="saLock">🚪 ${c.t('saOutBtn')}</button>
      <p class="hint" style="margin-top:8px">${c.t('saOutHint')}</p></div>

    <h2 class="grp">${c.t('saKidsApp')}</h2>
    <div class="card toggles"><div class="tg-row"><span class="tg-i">📲</span><span class="tg-t"><b>${c.t('installApp')}</b><span>${c.t('saInstallSub')}</span></span>
      <button class="switch ${s.install_on ? 'on' : ''}" id="swInstall" role="switch" aria-checked="${!!s.install_on}" aria-label="${c.t('installApp')}"><span></span></button></div></div>

    <h2 class="grp">📁 ${c.t('progTitle')}</h2>
    <div class="card"><p class="muted" style="margin:0 0 10px">${c.t('progSub')}</p><div id="progList"></div>
      <button class="btn primary wide" id="progNew" style="margin-top:12px">➕ ${c.t('progNew')}</button></div>

    <h2 class="grp">🤖 ${c.t('saAi')}</h2>
    <div class="card"><p class="muted" style="margin:0 0 10px">${c.t('saAiSub')}</p>
      <p id="hoState" class="sa-ho muted">${c.t('loading')}…</p>
      <div class="sa-btns"><button class="btn primary" id="hoCopy" disabled>📋 ${c.t('saCopy')}</button><button class="btn" id="hoDl" disabled>📥 ${c.t('saDownload')}</button></div></div>
    <div id="hoBody"></div>

    <h2 class="grp">${c.t('saNext')}</h2>
    <div class="card"><ul class="sa-next">${['saN1', 'saN2', 'saN3', 'saN4', 'saN5', 'saN6'].map(k => `<li>${c.t(k)}</li>`).join('')}</ul></div>`;

  // sign out: end the super admin powers on this device AND sign out (next time: password + email link again)
  c.$('#saLock').onclick = async () => {
    if (!(await c.confirmBox(c.t('saOutWarn'), c.t('saOutBtn'), false))) return;
    try { await c.api.superLock(); } catch (e) { console.error(e); }
    try { await c.api.signOut(); } catch (e) { console.error(e); }
    location.hash = '#/admin'; c.render();
  };
  c.$('#swInstall').onclick = async (e) => {
    const sw = e.currentTarget, on = !sw.classList.contains('on'); sw.disabled = true;
    try {
      await c.api.superSet('install_on', on); c.evReset();
      sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on));
      c.toast(`${c.t('installApp')} · ${on ? c.t('moOn') : c.t('moOff')}`);
    } catch (err) { c.fail(err); }
    sw.disabled = false;
  };

  drawPrograms(c);
  c.$('#progNew').onclick = () => newProgram(c);

  // the handoff (HANDOFF.md, published with every release): shown by section, copied as a ready prompt
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
        <button class="btn small" data-edit="${p.id}">✏️ ${c.t('progEdit')}</button></div></div>`).join('');
  box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => {
    const p = list.find(x => x.id === +b.dataset.copy);
    try { await navigator.clipboard.writeText(c.linkFor(p.slug)); c.toast('✓ ' + c.t('progCopied')); } catch { c.toast(c.linkFor(p.slug)); }
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
    <div class="field"><label>${c.t('progName')}</label><input class="input" name="name" required maxlength="60" placeholder="${c.t('progNameEg')}"></div>
    <div class="field"><label>${c.t('progSlug')}</label><input class="input" name="slug" required pattern="[a-z0-9][a-z0-9\\-]{1,39}" maxlength="40" placeholder="easter-2027" autocapitalize="none" spellcheck="false">
      <p class="hint">${c.t('progSlugHint')}</p></div>
    <div class="field"><label>${c.t('progFrom')}</label><select class="input" name="from">${list.map(p => `<option value="${p.id}" ${p.id === c.program.id ? 'selected' : ''}>${c.esc(p.name)}</option>`).join('')}</select>
      <p class="hint">${c.t('progFromHint')}</p></div>
    <label class="chk"><input type="checkbox" name="people"> ${c.t('progPeople')}</label>
    <label class="chk"><input type="checkbox" name="shop" checked> ${c.t('progShop')}</label>
    <label class="chk"><input type="checkbox" name="songs" checked> ${c.t('progSongs')}</label>`, { okText: c.t('progCreate') });
  // the link name fills itself from the program name until it is typed by hand
  const f = document.querySelector('#dlgForm'), nm = f.querySelector('[name=name]'), sl = f.querySelector('[name=slug]');
  let auto = true; sl.oninput = () => { auto = false; }; nm.oninput = () => { if (auto) sl.value = slugify(nm.value); };
  const r = await pending;
  if (!(r instanceof FormData)) return;
  const name = String(r.get('name')).trim(), slug = slugify(r.get('slug') || name);
  if (slug.length < 2) { c.toast(c.t('progSlugBad')); return; }
  if (list.some(p => p.slug === slug)) { c.toast(c.t('progSlugUsed')); return; }
  try {
    const res = await c.api.programCreate({ name, slug, from: +r.get('from'), people: r.get('people') === 'on', shop: r.get('shop') === 'on', songs: r.get('songs') === 'on' });
    if (!res?.ok) throw new Error('create failed');
    c.toast('✓ ' + c.t('progMade', name));
    drawPrograms(c);
  } catch (e) { c.fail(e); }
}
