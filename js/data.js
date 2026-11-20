// Data layer: Supabase when configured, otherwise a local PREVIEW store.
// v35: ?demo=1 (phone preview on the admin panel) always uses the local store, filled with sample data and never saved.
import { DEMO, demoDb } from './demo.js?v=46';
const cfg = window.YA_CONFIG || {};
// v40 polish: one name order everywhere (Thai rules, numbers as numbers: "Kid 2" before "Kid 10", case ignored)
const NAME_ORDER = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });
export const byName = (a, b) => NAME_ORDER.compare(a.nickname || '', b.nickname || '');
export const MODE = DEMO ? 'demo' : cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY ? 'supabase' : 'preview';
export { DEMO };
export const SKILLS = ['piano', 'singing', 'english', 'thai', 'attendance', 'bonus'];
export const SKILL_ICON = { piano: '🎹', singing: '🎤', english: '🔤', thai: '📖', attendance: '⛪', bonus: '🎁' };

// ---- the program this link opens (?p=<slug>; no ?p = program 1). Set once at start by setProgram().
export const program = { id: 1, slug: '', name: '', look: {}, list: [], login: 'off' };
// v31 member login (supabase/020_members.sql): the signed-in member of this program on this phone, or null.
// login = programs.login_mode: 'off' (old app) | 'personal' (own point details only) | 'all' (sign in to see anything)
export const member = { token: '', me: null };
export const P = () => program.id;
export const linkFor = (slug) => location.origin + location.pathname + (slug && slug !== program.list.find(x => x.id === 1)?.slug ? '?p=' + encodeURIComponent(slug) : '');

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- Supabase
function supabaseApi() {
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const uid = async () => (await sb.auth.getUser()).data.user?.id;

  return {
    onAuth: (cb) => sb.auth.onAuthStateChange((event) => cb(event)),
    async leaderboard() {
      const [lb, st] = await Promise.all([sb.from('leaderboard').select('*').eq('program_id', P()), sb.from('kid_skill_totals').select('*').eq('program_id', P())]);
      const rows = ok(lb).map(r => ({ ...r, skills: {} })), by = Object.fromEntries(rows.map(r => [r.id, r]));
      ok(st).forEach(x => {
        const r = by[x.kid_id]; if (!r) return;
        r.skills[x.skill] = (r.skills[x.skill] || 0) + x.total;
        if (x.detail) ((r.details ??= {})[x.skill] ??= {})[x.detail] = x.total;
      });
      return rows;
    },
    async pointCats() { return ok(await sb.from('point_categories').select('*').eq('program_id', P()).order('sort')); },
    async savePointCat(row, isNew) { const { key, ...d } = row; ok(isNew ? await sb.from('point_categories').insert({ ...row, program_id: P() }) : await sb.from('point_categories').update(d).eq('key', key)); },
    async deletePointCat(key) { ok(await sb.from('point_categories').delete().eq('key', key)); },

    async session() { return (await sb.auth.getSession()).data.session; },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async signUp(email, password) { return ok(await sb.auth.signUp({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async myRole() { return ok(await sb.rpc('my_role')); },
    async claimAdmin(name) { return ok(await sb.rpc('claim_admin', { p_name: name })); },

    async kids() { return ok(await sb.from('kids').select('*').eq('program_id', P()).order('nickname')).sort(byName); },  // v40 polish: Thai A–Z (เ/แ/โ in front), the database sorts by bytes
    async addKid(k) { return ok(await sb.from('kids').insert({ ...k, program_id: P() }).select().single()); },
    async updateKid(id, patch) { ok(await sb.from('kids').update(patch).eq('id', id)); },
    async deleteKid(id) { ok(await sb.from('kids').delete().eq('id', id)); },

    async attendance(day, session = 'main') {
      return ok(await sb.from('attendance').select('*').eq('program_id', P()).eq('day', day).eq('session', session));
    },
    async setAttendance(kid_id, day, status, session = 'main') {
      const updated_by = await uid();
      ok(await sb.from('attendance').upsert({ kid_id, day, session, status, updated_by, updated_at: new Date().toISOString() },
        { onConflict: 'kid_id,day,session' }));
    },
    async clearAttendance(kid_id, day, session = 'main') {
      ok(await sb.from('attendance').delete().eq('kid_id', kid_id).eq('day', day).eq('session', session));
    },
    async round(day, session = 'main') {
      return ok(await sb.from('attendance_rounds').select('*').eq('program_id', P()).eq('day', day).eq('session', session).maybeSingle());
    },
    async setRound(day, finished, session = 'main') {
      const u = await uid();
      ok(await sb.from('attendance_rounds').upsert({ program_id: P(), day, session, finished, finished_by: u, finished_at: new Date().toISOString() }));
    },

    async addPoints(rows) {
      const given_by = await uid();
      return (ok(await sb.from('points').insert(rows.map(r => ({ ...r, given_by }))).select('id')) || []).map(r => r.id);   // v45: ids for "เลิกทำ"
    },
    async deletePoints(ids) { ok(await sb.from('points').delete().in('id', ids)); },   // v45: undo right after giving
    async recentPoints(limit = 30) {
      return ok(await sb.from('points').select('*, kids(nickname, avatar)').eq('program_id', P()).is('attendance_id', null)
        .order('created_at', { ascending: false }).limit(limit));
    },
    async deletePoint(id) { ok(await sb.from('points').delete().eq('id', id)); },

    async money() { return ok(await sb.from('money').select('*').order('created_at', { ascending: false })); },
    async addMoney(m) { const created_by = await uid(); ok(await sb.from('money').insert({ ...m, created_by })); },
    async deleteMoney(id) { ok(await sb.from('money').delete().eq('id', id)); },

    async settings() { return ok(await sb.from('settings').select('*').eq('id', P()).single()); },
    async saveSettings(patch) { ok(await sb.from('settings').update(patch).eq('id', P())); },

    async pendingUsers() { return ok(await sb.rpc('pending_users')); },
    async staffList() { return ok(await sb.rpc('staff_list')); },
    async approve(user_id) { ok(await sb.from('staff').insert({ user_id, role: 'editor' })); },
    async removeStaff(user_id) { ok(await sb.from('staff').delete().eq('user_id', user_id)); },
    async myId() { return uid(); },

    async attendanceAll() { return pageAll((a, b) => sb.from('attendance').select('kid_id,status,day').eq('program_id', P()).order('day').range(a, b)); },

    async schedule() { return ok(await sb.from('schedule').select('*').order('day').order('time_text')); },
    async saveSchedule(row) { const { id, ...d } = row; ok(id ? await sb.from('schedule').update(d).eq('id', id) : await sb.from('schedule').insert(d)); },
    async deleteSchedule(id) { ok(await sb.from('schedule').delete().eq('id', id)); },

    async shop() {
      const [c, i] = await Promise.all([sb.from('shop_categories').select('*').order('sort').order('created_at'),
        sb.from('shop_items').select('*').eq('program_id', P()).order('sort').order('price')]);
      return { cats: ok(c), items: ok(i) };
    },
    async saveCategory(row) { const { id, ...d } = row; ok(id ? await sb.from('shop_categories').update(d).eq('id', id) : await sb.from('shop_categories').insert(d)); },
    async deleteCategory(id) { ok(await sb.from('shop_categories').delete().eq('id', id)); },
    async saveItem(row) { const { id, ...d } = row; ok(id ? await sb.from('shop_items').update(d).eq('id', id) : await sb.from('shop_items').insert({ ...d, program_id: P() })); },
    async deleteItem(id) { ok(await sb.from('shop_items').delete().eq('id', id)); },

    async eventInfo() { return ok(await sb.from('event_info').select('*').eq('program_id', P()).single()); },
    // v36: visits / feedback numbers for the kids' home page (null when that switch is off)
    async homeCounts() { const r = ok(await sb.rpc('home_counts', { p: P() })); return (Array.isArray(r) ? r[0] : r) || {}; },
    async allPoints() {
      const out = []; // page through in case there are many rows
      for (let from = 0; ; from += 1000) {
        const rows = ok(await sb.from('points').select('*, kids(nickname, avatar)').eq('program_id', P()).order('created_at').range(from, from + 999));
        out.push(...rows); if (rows.length < 1000) return out;
      }
    },
    async sendFeedback(row) { ok(await sb.from('feedback').insert({ ...row, program_id: P() })); },
    async feedback() { return ok(await sb.from('feedback').select('*').eq('program_id', P()).order('created_at', { ascending: false }).limit(200)); },
    async deleteFeedback(id) { ok(await sb.from('feedback').delete().eq('id', id)); },

    // ---- songs + pictures
    async songs() { return ok(await sb.from('songs').select('*').eq('program_id', P()).order('sort').order('title')); },
    async saveSong(row) {
      const { id, ...d } = row; d.updated_at = new Date().toISOString();
      return ok(id ? await sb.from('songs').update(d).eq('id', id).select().single() : await sb.from('songs').insert({ ...d, program_id: P() }).select().single());
    },
    async deleteSong(id) { ok(await sb.from('songs').delete().eq('id', id)); },
    // upload a (already shrunk) picture; returns its public address
    async uploadImage(blob, folder = 'misc') {
      const ext = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[blob.type] || 'jpg';
      const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      ok(await sb.storage.from('images').upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000', upsert: false }));
      return sb.storage.from('images').getPublicUrl(path).data.publicUrl;
    },

    // ---- logs
    async logEvents(rows) { ok(await sb.from('kid_events').insert(rows.map(r => ({ ...r, program_id: P() })))); },
    async auditLog(limit = 100) { return ok(await sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit)); },
    // v32: the admin log of THIS program (program 1 also keeps the rows from before v32, which have no program)
    async auditAll() { return pageAll((a, b) => sb.from('audit_log').select('*').or(P() === 1 ? 'program_id.eq.1,program_id.is.null' : `program_id.eq.${P()}`).order('created_at').range(a, b)); },
    async kidEvents() { return pageAll((a, b) => sb.from('kid_events').select('*').eq('program_id', P()).order('created_at').range(a, b)); },
    async markStaffDevice(dev) { return ok(await sb.rpc('mark_staff_device', { p_device: dev, p_program: P() })); },   // v39, 024_staff_events.sql
    async kidEventsSince(iso) { return pageAll((a, b) => sb.from('kid_events').select('event,detail,device_id,kid_id,created_at').eq('program_id', P()).gte('created_at', iso).order('created_at').range(a, b)); },
    async reauth(password) {
      const email = (await sb.auth.getUser()).data.user?.email;
      ok(await sb.auth.signInWithPassword({ email, password }));
    },
    async clearKidEvents() { return ok(await sb.rpc('clear_kid_events', { p_program: P() })); },

    // ---- super admin (two steps: username + password, then the emailed sign-in link). See supabase/017_superadmin.sql
    async superStart(username, password) { return ok(await sb.rpc('superadmin_start', { p_username: username, p_password: password })); },
    async superSendLink(email) {
      const r = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
      if (r.error) throw r.error;
    },
    async superUnlock() { return ok(await sb.rpc('superadmin_unlock')); },
    async superClaim(username, password) { return ok(await sb.rpc('superadmin_claim', { p_username: username, p_password: password })); },
    async superLock() { ok(await sb.rpc('superadmin_lock')); },
    async superInfo() { return ok(await sb.rpc('superadmin_info')); },
    async superSet(key, value) { ok(await sb.rpc('superadmin_set', { p_key: key, p_value: value, p_program: P() })); },

    // ---- programs (see supabase/018_programs.sql)
    async programs() { return ok(await sb.from('programs').select('*').order('id')); },
    async programCreate(o) { return ok(await sb.rpc('program_create', { p_name: o.name, p_slug: o.slug, p_from: o.from, p_people: !!o.people, p_shop: !!o.shop, p_songs: !!o.songs })); },
    async programUpdate(id, name, archived) { ok(await sb.rpc('program_update', { p_id: id, p_name: name, p_archived: !!archived })); },
    async programSetLook(id, look) { ok(await sb.rpc('program_set_look', { p_id: id, p_look: look })); },   // v28, see 019_program_look.sql
    async programSetMaint(id, on, scene, minutes = 0) { ok(await sb.rpc('program_set_maintenance', { p_id: id, p_on: !!on, p_scene: scene, p_minutes: Math.max(0, Math.trunc(minutes || 0)) })); },   // v37 + v46 timer, see 023/026

    // ---- v31 member login (020_members.sql). The token goes on EVERY request as the header x-member-token.
    memberUse(tok) {
      const h = sb.rest.headers, k = 'x-member-token';
      if (typeof h?.set === 'function') { tok ? h.set(k, tok) : h.delete(k); } else if (h) { if (tok) h[k] = tok; else delete h[k]; }
    },
    async memberLogin(username, password) { return ok(await sb.rpc('member_login', { p_program: P(), p_username: username, p_password: password })); },
    async memberMe() { return ok(await sb.rpc('member_me', { p_program: P() })); },
    async memberLogout() { ok(await sb.rpc('member_logout', { p_program: P() })); },
    async memberPassword(oldPw, newPw) { return ok(await sb.rpc('member_password', { p_program: P(), p_old: oldPw, p_new: newPw })); },
    async memberList() { return ok(await sb.rpc('member_list', { p_program: P() })); },
    async memberSave(m) {
      return ok(await sb.rpc('member_save', { p_program: P(), p_id: m.id || null, p_username: m.username, p_display: m.display_name || '',
        p_kid: m.kid_id || null, p_active: m.active !== false, p_password: m.password || null }));
    },
    async programSetLogin(id, mode) { ok(await sb.rpc('program_set_login', { p_id: id, p_mode: mode })); },

    // ---- v32 admins per program (supabase/021_admin_access.sql)
    async myAccess() { return ok(await sb.rpc('my_access')); },                  // { all: true } | { all: false, programs: { "1": ["points", …] } }
    async adminList() { return ok(await sb.rpc('admin_list')); },                // super admin: every login except the super admin's
    async adminSave(userId, name, active, access) { ok(await sb.rpc('admin_save', { p_user: userId, p_display: name, p_active: !!active, p_access: access })); },
    async adminCreate(username, password, name) { return ok(await sb.rpc('admin_create', { p_username: username, p_password: password, p_display: name })); },
    async adminPassword(userId, password) { ok(await sb.rpc('admin_password', { p_user: userId, p_password: password })); },
    async adminPing(page) { ok(await sb.rpc('admin_ping', { p_program: P(), p_page: page })); },
    async adminOnline() { return ok(await sb.rpc('admin_online')); },
    async kidWeekStats(iso) { return ok(await sb.rpc('kid_week_stats', { p_program: P(), p_since: iso })); },   // { phones, songs: [{ title, n, devices }] }

    // ---- prizes given, announcement + verse, weekly summary
    async redemptions(limit = 1000) { return ok(await sb.from('redemptions').select('*, kids(nickname, avatar)').eq('program_id', P()).order('created_at', { ascending: false }).limit(limit)); },
    async redeem(row) { ok(await sb.from('redemptions').insert(row)); },
    async deleteRedemption(id) { ok(await sb.from('redemptions').delete().eq('id', id)); },
    async saveNotice(n) { ok(await sb.rpc('save_notice', { p_announce: n.announce || '', p_verse_text: n.verse_text || '', p_verse_ref: n.verse_ref || '', p_program: P() })); },
    async pointsSince(iso) { return pageAll((a, b) => sb.from('points').select('kid_id,amount,skill,created_at').eq('program_id', P()).gte('created_at', iso).order('created_at').range(a, b)); },
  };
  async function pageAll(q) {
    const out = [];
    for (let from = 0; ; from += 1000) { const rows = ok(await q(from, from + 999)); out.push(...rows); if (rows.length < 1000) return out; }
  }
}

// ---------------------------------------------------------------- Preview (local)
function previewApi(seed = null) {
  const KEY = seed ? 'ya_demo_db' : 'ya_preview_db';             // demo: its own key, inside the in-memory storage
  const load = () => seed || JSON.parse(localStorage.getItem(KEY) || 'null') ||
    { kids: [], attendance: [], rounds: [], points: [], money: [], settings: { attendance_points: 10 }, loggedIn: false };
  let db = load();
  db.schedule ??= []; db.items ??= [];
  db.feedback ??= []; db.audit ??= []; db.events ??= []; db.redemptions ??= [];
  // (db.songs is filled from the seed list the first time songs are read)
  let aid = db.audit.length;
  const audit = (table_name, op, o, n) => db.audit.push({ id: ++aid, created_at: new Date().toISOString(), actor_email: 'preview@local', table_name, op,
    row_key: (n || o)?.id || (n || o)?.key || '', old_data: o ? JSON.parse(JSON.stringify(o)) : null, new_data: n ? JSON.parse(JSON.stringify(n)) : null });
  Object.assign(db.settings, { event_dow: 0, event_start: '10:00', event_end: '12:00', fb_dow: 0, fb_start: '12:00', fb_end: '23:59', tip_days: 3, fb_open: false, ...db.settings });
  db.pcats ??= [['music', 'ดนตรี', 'Music', '🎵', '', 'เปียโน\nร้องเพลง\nซ้อมดนตรี'],
    ['english', 'อังกฤษ', 'English', '🔤', ''], ['thai', 'อ่านไทย', 'Thai reading', '📖', ''], ['questions', 'ตอบคำถาม', 'Answering questions', '🙋', ''],
    ['chores', 'งานบ้าน', 'Chores', '🧽', 'เช่น ล้างจาน'], ['attendance', 'มาร่วม', 'Came', '⛪', 'ได้คะแนนอัตโนมัติทุกครั้งที่มาร่วมกิจกรรม'], ['bonus', 'โบนัส', 'Bonus', '🎁', '']]
    .map(([key, name_th, name_en, icon, info, details = ''], i) => ({ key, name_th, name_en, icon, info, details, sort: i + 1, active: true }));
  db.cats ??= [{ id: 'c1', name: 'ของเล่น', icon: '🐰', effect: '✨', sort: 1 }, { id: 'c2', name: 'ขนม', icon: 'chipbag', effect: 'chips', sort: 2 }];
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  const now = () => new Date().toISOString();
  const kidOf = (kid_id) => { const k = db.kids.find(k => k.id === kid_id); return k ? { nickname: k.nickname, avatar: k.avatar } : null; };
  const listeners = [];
  // v31 members, preview copy: same rules as 020_members.sql (the preview data is not split by program)
  db.members ??= []; db.msess ??= {};
  db.admins ??= [];
  const PERMS = ['points', 'kids', 'songs', 'shop', 'feedback', 'notice', 'settings'];
  const curAdmin = () => (db.sa?.asSuper ? null : db.admins.find(a => a.user_id === db.who)) || null;
  let mtok = '';
  const loginMode = () => (db.programs || []).find(p => p.id === P())?.login_mode || 'off';
  const curMember = () => { const id = db.msess[mtok]; const m = id && db.members.find(x => x.id === id && x.active); return m || null; };
  const memberOk = () => loginMode() !== 'all' || db.loggedIn || !!curMember();
  const seesKid = (kid) => { const m = loginMode(); if (m === 'off' || db.loggedIn) return true; const c = curMember(); return m === 'all' ? !!c : !!c && c.kid_id === kid; };
  const syncAtt = (row) => {
    db.points = db.points.filter(p => p.attendance_id !== row.id);
    if (row.status === 'present' && db.settings.attendance_points > 0)
      db.points.push({ id: id(), kid_id: row.kid_id, skill: 'attendance', amount: db.settings.attendance_points, note: row.day, attendance_id: row.id, created_at: now() });
  };

  return {
    onAuth: (cb) => listeners.push(cb),
    async leaderboard() {
      if (!memberOk()) return [];
      return db.kids.filter(k => k.active).map(k => {
        const r = { id: k.id, nickname: k.nickname, avatar: k.avatar, total: 0, skills: {}, spent: db.redemptions.filter(x => x.kid_id === k.id).reduce((a, x) => a + x.price, 0) };
        db.points.filter(p => p.kid_id === k.id).forEach(p => {
          r.total += p.amount; if (!seesKid(k.id)) return;
          r.skills[p.skill] = (r.skills[p.skill] || 0) + p.amount;
          if (p.detail) { const d = ((r.details ??= {})[p.skill] ??= {}); d[p.detail] = (d[p.detail] || 0) + p.amount; }
        });
        return r;
      });
    },
    async pointCats() { return [...db.pcats].sort((a, b) => a.sort - b.sort); },
    async savePointCat(row, isNew) {
      if (isNew) { const n = { active: true, sort: db.pcats.length + 1, ...row }; db.pcats.push(n); audit('point_categories', 'INSERT', null, n); }
      else { const r = db.pcats.find(c => c.key === row.key), o = { ...r }; Object.assign(r, row); audit('point_categories', 'UPDATE', o, r); }
      save();
    },
    async deletePointCat(key) { if (db.points.some(p => p.skill === key)) throw new Error('in use'); db.pcats = db.pcats.filter(c => c.key !== key); save(); },
    async session() { return db.loggedIn ? { user: { id: 'preview-admin' } } : null; },
    async signIn(email, pw) {
      // the preview super admin has no normal account (like the real one): its name goes to the two-step sign-in
      if (db.sa?.user && String(email).startsWith(db.sa.user.username.toLowerCase() + '@')) throw new Error('Invalid login credentials');
      const a = db.admins.find(x => String(email).toLowerCase() === x.username + '@youth-alpha.app');
      if (a && a.pw && a.pw !== pw) throw new Error('Invalid login credentials');
      db.who = a ? a.user_id : 'preview-admin';
      db.loggedIn = true; save(); listeners.forEach(f => f());
    },
    async signUp() { return {}; },
    async signOut() { db.loggedIn = false; db.who = null; if (db.sa) { db.sa.asSuper = false; db.sa.unlocked = false; } save(); listeners.forEach(f => f()); },
    async myRole() {
      if (!db.loggedIn) return null;
      const sa = db.sa || {};
      if (sa.asSuper) return sa.unlocked ? 'superadmin' : (sa.user ? 'superlocked' : 'superclaim');
      const me = curAdmin();
      if (!me) return 'admin';                                     // the default preview admin: everything, every program
      if (me.pending) return 'pending';
      return me.active && Object.values(me.access || {}).some(a => a.length) ? 'admin' : 'noaccess';
    },
    // v32 admins, preview copy: db.admins = [{ user_id, username, name, pw, active, pending, access: { "1": [...] } }].
    // Signing in with one of those usernames acts as that admin; any other name is the default admin with every permission.
    async myAccess() {
      if (db.sa?.asSuper && db.sa?.unlocked) return { all: true };
      const me = curAdmin();
      if (!me) return { all: false, programs: Object.fromEntries((db.programs || [{ id: 1 }]).map(p => [String(p.id), [...PERMS]])) };
      return { all: false, programs: me.active ? Object.fromEntries(Object.entries(me.access || {}).filter(([, a]) => a.length)) : {} };
    },
    async adminList() {
      return db.admins.map(a => ({ user_id: a.user_id, username: a.username, name: a.name || a.username, pending: !!a.pending, active: !!a.active && !a.pending, role: a.pending ? null : 'admin',
        app_login: true, created_at: a.created_at || now(), last_sign_in_at: a.last || null, access: a.access || {} }));
    },
    async adminSave(userId, name, active, access) {
      const a = db.admins.find(x => x.user_id === userId); if (!a) throw new Error('no such account');
      const old = JSON.parse(JSON.stringify(a));
      Object.keys(a.access || {}).forEach(k => { if (!access[k]) a.access[k] = []; });
      Object.assign(a, { name: String(name || '').trim().slice(0, 40), active: !!active, pending: false, access: { ...(a.access || {}), ...access } });
      audit('staff', old.pending ? 'INSERT' : 'UPDATE', old, a); save();
    },
    async adminCreate(username, password, name) {
      const u = String(username || '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(u)) throw new Error('bad username');
      if (String(password || '').length < 6) throw new Error('password too short');
      if (db.admins.some(a => a.username === u)) throw new Error('duplicate username');
      const a = { user_id: id(), username: u, name: String(name || '').trim(), pw: password, active: true, pending: false, access: {}, created_at: now() };
      db.admins.push(a); audit('staff', 'INSERT', null, { ...a, pw: undefined }); save(); return a.user_id;
    },
    async adminPassword(userId, password) {
      if (String(password || '').length < 6) throw new Error('password too short');
      const a = db.admins.find(x => x.user_id === userId); if (!a) throw new Error('not an app login'); a.pw = password; save();
    },
    async adminPing(page) { (db.presence ??= {})[db.sa?.asSuper ? 'preview-super' : (db.who || 'preview-admin')] = { program_id: P(), page, seen_at: now() }; save(); },
    async adminOnline() {
      const p = db.presence || {};
      return Object.entries(p).filter(([, x]) => Date.now() - new Date(x.seen_at) < 10 * 6e4).map(([uid, x]) => {
        const a = db.admins.find(y => y.user_id === uid);
        return { user_id: uid, program_id: x.program_id, page: x.page, seen_at: x.seen_at, is_super: uid === 'preview-super', name: a?.name || a?.username || (uid === 'preview-super' ? db.sa?.user?.username : 'Preview') };
      }).sort((a, b) => b.seen_at.localeCompare(a.seen_at));
    },
    async kidWeekStats(iso) {
      const ev = db.events.filter(e => e.created_at >= iso && !e.by_staff), m = {};
      ev.filter(e => e.event === 'song_open' && e.detail).forEach(e => { const x = (m[e.detail] ??= { title: e.detail, n: 0, d: new Set() }); x.n++; x.d.add(e.device_id); });
      return { phones: new Set(ev.map(e => e.device_id)).size, songs: Object.values(m).sort((a, b) => b.n - a.n).slice(0, 5).map(x => ({ title: x.title, n: x.n, devices: x.d.size })) };
    },
    async claimAdmin() { return 'ok'; },

    async kids() { return [...db.kids].sort(byName); },
    async addKid(k) { const r = { id: id(), active: true, grp: '', created_at: now(), ...k }; db.kids.push(r); audit('kids', 'INSERT', null, r); save(); return r; },
    async updateKid(kid, patch) { const r = db.kids.find(k => k.id === kid), o = { ...r }; Object.assign(r, patch); audit('kids', 'UPDATE', o, r); save(); },
    async deleteKid(kid) {
      audit('kids', 'DELETE', db.kids.find(k => k.id === kid), null);
      db.kids = db.kids.filter(k => k.id !== kid);
      ['attendance', 'points', 'money', 'redemptions'].forEach(t => db[t] = db[t].filter(r => r.kid_id !== kid)); save();
    },

    async attendance(day, session = 'main') { return db.attendance.filter(a => a.day === day && a.session === session); },
    async setAttendance(kid_id, day, status, session = 'main') {
      let row = db.attendance.find(a => a.kid_id === kid_id && a.day === day && a.session === session);
      if (row) { const o = { ...row }; row.status = status; row.updated_at = now(); audit('attendance', 'UPDATE', o, row); }
      else { row = { id: id(), kid_id, day, session, status, updated_at: now() }; db.attendance.push(row); audit('attendance', 'INSERT', null, row); }
      syncAtt(row); save();
    },
    async clearAttendance(kid_id, day, session = 'main') {
      const row = db.attendance.find(a => a.kid_id === kid_id && a.day === day && a.session === session);
      if (!row) return;
      db.points = db.points.filter(p => p.attendance_id !== row.id);
      audit('attendance', 'DELETE', row, null);
      db.attendance = db.attendance.filter(a => a !== row); save();
    },
    async round(day, session = 'main') { return db.rounds.find(r => r.day === day && r.session === session) || null; },
    async setRound(day, finished, session = 'main') {
      const r = db.rounds.find(r => r.day === day && r.session === session);
      if (r) r.finished = finished; else db.rounds.push({ day, session, finished }); save();
    },

    async addPoints(rows) { const ids = []; rows.forEach(r => { const p = { id: id(), attendance_id: null, created_at: now(), ...r }; db.points.push(p); ids.push(p.id); audit('points', 'INSERT', null, p); }); save(); return ids; },
    async deletePoints(ids) { ids.forEach(pid => this.deletePoint(pid)); },
    async recentPoints(limit = 30) {
      return db.points.filter(p => !p.attendance_id).sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit).map(p => ({ ...p, kids: kidOf(p.kid_id) }));
    },
    async deletePoint(pid) { audit('points', 'DELETE', db.points.find(p => p.id === pid), null); db.points = db.points.filter(p => p.id !== pid); save(); },

    async money() { return [...db.money].sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addMoney(m) { db.money.push({ id: id(), created_at: now(), ...m }); save(); },
    async deleteMoney(mid) { db.money = db.money.filter(m => m.id !== mid); save(); },

    async settings() { return db.settings; },
    async saveSettings(patch) { const o = { ...db.settings }; Object.assign(db.settings, patch); audit('settings', 'UPDATE', o, db.settings); save(); },

    async pendingUsers() { return []; },
    async staffList() { return [{ user_id: 'preview-admin', email: 'preview@local', display_name: 'Preview', role: 'admin' }]; },
    async approve() {}, async removeStaff() {},
    async myId() { return 'preview-admin'; },

    async attendanceAll() { return db.attendance.map(({ kid_id, status, day }) => ({ kid_id, status, day })); },

    async schedule() { return [...db.schedule].sort((a, b) => (a.day + a.time_text).localeCompare(b.day + b.time_text)); },
    async saveSchedule(row) { const r = row.id && db.schedule.find(x => x.id === row.id); r ? Object.assign(r, row) : db.schedule.push({ ...row, id: id() }); save(); },
    async deleteSchedule(sid) { db.schedule = db.schedule.filter(x => x.id !== sid); save(); },

    async shop() {
      return { cats: [...db.cats].sort((a, b) => a.sort - b.sort), items: [...db.items].filter(() => memberOk()).sort((a, b) => a.sort - b.sort || a.price - b.price) };
    },
    async saveCategory(row) { const r = row.id && db.cats.find(x => x.id === row.id); r ? Object.assign(r, row) : db.cats.push({ sort: db.cats.length + 1, ...row, id: id() }); save(); },
    async deleteCategory(cid) { db.cats = db.cats.filter(x => x.id !== cid); db.items = db.items.filter(x => x.category_id !== cid); save(); },
    async saveItem(row) {
      const r = row.id && db.items.find(x => x.id === row.id);
      if (r) { const o = { ...r }; Object.assign(r, row); audit('shop_items', 'UPDATE', o, r); }
      else { const n = { active: true, sort: 0, ...row, id: id() }; db.items.push(n); audit('shop_items', 'INSERT', null, n); }
      save();
    },
    async deleteItem(iid) { audit('shop_items', 'DELETE', db.items.find(x => x.id === iid), null); db.items = db.items.filter(x => x.id !== iid); save(); },

    async eventInfo() { const { event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music = {}, announce = '', verse_text = '', verse_ref = '', install_on = false, show_visits = false, show_fb_count = false } = db.settings; return { event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music, announce, verse_text, verse_ref, install_on, show_visits, show_fb_count }; },
    async homeCounts() { const s = db.settings; return { visits: s.show_visits ? db.events.filter(e => e.event === 'open_app' && !e.by_staff).length : null, feedback: s.show_fb_count ? db.feedback.length : null }; },
    async allPoints() { return db.points.map(p => ({ ...p, kids: kidOf(p.kid_id) })); },
    async sendFeedback(row) {
      if (!db.settings.fb_open) throw new Error('closed');
      db.feedback.unshift({ id: id(), created_at: now(), ...row }); save();
    },
    async feedback() { return db.feedback; },
    async deleteFeedback() { throw new Error('feedback is permanent'); },

    async songs() {
      if (!db.songs) { const { SEED_SONGS } = await import('./songs-seed.js?v=46'); db.songs = SEED_SONGS.map(x => ({ id: id(), active: true, ...x })); save(); }
      return [...db.songs].filter(() => memberOk()).sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, 'th'));
    },
    async saveSong(row) {
      const r = row.id && db.songs.find(x => x.id === row.id);
      if (r) { const o = { ...r }; Object.assign(r, row); audit('songs', 'UPDATE', o, r); save(); return r; }
      const n = { active: true, sort: db.songs.length + 1, sheets: [], opts: {}, ...row, id: id() }; db.songs.push(n); audit('songs', 'INSERT', null, n); save(); return n;
    },
    async deleteSong(sid) { audit('songs', 'DELETE', db.songs.find(x => x.id === sid), null); db.songs = db.songs.filter(x => x.id !== sid); save(); },
    async uploadImage(blob) {
      return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
    },
    async logEvents(rows) { rows.forEach(r => db.events.push({ id: db.events.length + 1, created_at: now(), ...r, by_staff: !!(db.loggedIn || db.sa?.unlocked) })); save(); },
    async markStaffDevice(dev) { const t0 = new Date(Date.now() - 6e5).toISOString(); let n = 0; db.events.forEach(e => { if (e.device_id === dev && !e.by_staff && e.created_at > t0) { e.by_staff = true; n++; } }); save(); return n; },
    async auditLog(limit = 100) { return [...db.audit].reverse().slice(0, limit); },
    async auditAll() { return db.audit; },
    async kidEvents() { return db.events; },
    async kidEventsSince(iso) { return db.events.filter(e => e.created_at >= iso); },
    async reauth(pw) { if (!pw) throw new Error('password'); },
    // super admin, preview copy: the test puts { user: { username, pw } } in db.sa; the "email link" opens straight away
    async superStart(username, password) {
      const sa = (db.sa ??= {});
      if (!sa.user || sa.user.username.toLowerCase() !== String(username).trim().toLowerCase() || sa.user.pw !== password) return { ok: false, reason: 'wrong' };
      sa.pwOk = Date.now(); save(); return { ok: true, email: 'preview-owner@example.com' };
    },
    async superSendLink() { const sa = (db.sa ??= {}); sa.linkSent = Date.now(); save(); },
    async superUnlock() {
      const sa = (db.sa ??= {});
      if (!sa.pwOk || Date.now() - sa.pwOk > 20 * 6e4) return { ok: false, reason: 'need_password' };
      sa.unlocked = true; sa.pwOk = 0; sa.until = new Date(Date.now() + 12 * 3600e3).toISOString(); save();
      return { ok: true, username: sa.user.username, until: sa.until };
    },
    async superClaim(username, password) {
      const sa = (db.sa ??= {});
      if (sa.user) return { ok: false, reason: 'exists' };
      if (!/^[A-Za-z0-9_.-]{2,30}$/.test(username)) return { ok: false, reason: 'bad_username' };
      if (String(password).length < 4) return { ok: false, reason: 'short_password' };
      sa.user = { username, pw: password }; sa.unlocked = true; sa.until = new Date(Date.now() + 12 * 3600e3).toISOString(); save();
      return { ok: true, username };
    },
    async superLock() { if (db.sa) db.sa.unlocked = false; save(); },
    async superInfo() { return db.sa?.unlocked ? { username: db.sa.user?.username, until: db.sa.until } : null; },
    async superSet(key, value) { if (key !== 'install_on') throw new Error('unknown setting'); db.settings.install_on = !!value; save(); },
    // programs, preview copy: only the list is kept (the preview data itself is not split by program)
    async programs() { return (db.programs ??= [{ id: 1, slug: 'youth-alpha-christmas-2026', name: 'Youth Alpha Christmas 2026', archived: false, look: {}, login_mode: 'off' }]); },
    async programCreate(o) {
      const list = await this.programs();
      if (list.some(p => p.slug === o.slug)) throw new Error('duplicate key value violates unique constraint "programs_slug_key"');
      const id = Math.max(...list.map(p => p.id)) + 1; list.push({ id, slug: o.slug, name: o.name, archived: false, copied_from: o.from, look: {}, login_mode: 'off' }); save();
      return { ok: true, id };
    },
    async programUpdate(id, name, archived) { const p = (await this.programs()).find(x => x.id === id); if (p) Object.assign(p, { name, archived: id === 1 ? false : !!archived }); save(); },
    async programSetLook(id, look) { const p = (await this.programs()).find(x => x.id === id); if (p) p.look = JSON.parse(JSON.stringify(look)); save(); },
    async programSetMaint(id, on, scene, minutes = 0) { const p = (await this.programs()).find(x => x.id === id); if (p) p.maintenance = { on: !!on, scene, at: now(), until: on && minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : null }; save(); },
    async programSetLogin(id, mode) {
      if (!['off', 'personal', 'all'].includes(mode)) throw new Error('bad mode');
      const p = (await this.programs()).find(x => x.id === id); if (p) p.login_mode = mode; save();
    },
    memberUse(tok) { mtok = tok || ''; },
    async memberLogin(username, password) {
      const u = String(username || '').trim().toLowerCase(), m = db.members.find(x => x.username === u);
      if (!m || !m.active) return { ok: false, reason: 'wrong' };
      if (m.locked_until && m.locked_until > Date.now()) return { ok: false, reason: 'locked', minutes: Math.ceil((m.locked_until - Date.now()) / 6e4) };
      if (m.pw !== password) { m.failed = (m.failed || 0) + 1; if (m.failed >= 5) { m.failed = 0; m.locked_until = Date.now() + 15 * 6e4; } save(); return { ok: false, reason: 'wrong' }; }
      const tok = Array.from({ length: 48 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
      db.msess[tok] = m.id; m.failed = 0; m.locked_until = null; m.last_login = now(); save();
      return { ok: true, token: tok, username: m.username, display_name: m.display_name, kid_id: m.kid_id };
    },
    async memberMe() { const m = curMember(); return m ? { username: m.username, display_name: m.display_name, kid_id: m.kid_id } : null; },
    async memberLogout() { delete db.msess[mtok]; save(); },
    async memberPassword(oldPw, newPw) {
      const m = curMember(); if (!m) return { ok: false, reason: 'signin' };
      if (m.pw !== oldPw) return { ok: false, reason: 'wrong' };
      if (String(newPw || '').length < 4) return { ok: false, reason: 'short' };
      m.pw = newPw; save(); return { ok: true };
    },
    async memberList() {
      if (!db.loggedIn) throw new Error('admins only');
      return db.members.map(m => ({ id: m.id, username: m.username, display_name: m.display_name, kid_id: m.kid_id, kid_name: db.kids.find(k => k.id === m.kid_id)?.nickname || null,
        active: m.active, last_login: m.last_login || null, locked: !!(m.locked_until && m.locked_until > Date.now()), created_at: m.created_at })).sort((a, b) => a.username.localeCompare(b.username));
    },
    async memberSave(o) {
      if (!db.loggedIn) throw new Error('admins only');
      const u = String(o.username || '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(u)) throw new Error('members_username_check');
      if (o.password && String(o.password).length < 4) throw new Error('password too short');
      if (db.members.some(x => x.username === u && x.id !== o.id)) throw new Error('duplicate key value violates unique constraint');
      if (!o.id) {
        if (!o.password) throw new Error('password needed');
        const n = { id: id(), username: u, display_name: (o.display_name || '').trim(), kid_id: o.kid_id || null, active: o.active !== false, pw: o.password, failed: 0, locked_until: null, created_at: now() };
        db.members.push(n); audit('members', 'INSERT', null, { ...n, pw: undefined }); save(); return n.id;
      }
      const m = db.members.find(x => x.id === o.id); if (!m) throw new Error('no such account');
      const old = { ...m, pw: undefined };
      Object.assign(m, { username: u, display_name: (o.display_name || '').trim(), kid_id: o.kid_id || null, active: o.active !== false });
      if (o.password) Object.assign(m, { pw: o.password, failed: 0, locked_until: null });
      if (!m.active) Object.keys(db.msess).forEach(k => { if (db.msess[k] === m.id) delete db.msess[k]; });
      audit('members', 'UPDATE', old, { ...m, pw: undefined, password_changed: !!o.password }); save(); return m.id;
    },
    async clearKidEvents() { const n = db.events.length; db.events = []; audit('kid_events', 'CLEAR', null, { rows_deleted: n }); save(); return n; },

    async redemptions(limit = 1000) { return [...db.redemptions].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit).map(r => ({ ...r, kids: kidOf(r.kid_id) })); },
    async redeem(row) {
      const bal = db.points.filter(p => p.kid_id === row.kid_id).reduce((a, p) => a + p.amount, 0) - db.redemptions.filter(r => r.kid_id === row.kid_id).reduce((a, r) => a + r.price, 0);
      if (row.price > bal) throw new Error('not enough points to spend');
      const n = { id: id(), created_at: now(), note: '', ...row }; db.redemptions.push(n); audit('redemptions', 'INSERT', null, n); save();
    },
    async deleteRedemption(rid) { audit('redemptions', 'DELETE', db.redemptions.find(r => r.id === rid), null); db.redemptions = db.redemptions.filter(r => r.id !== rid); save(); },
    async saveNotice(n) { const o = { ...db.settings }; Object.assign(db.settings, { announce: (n.announce || '').trim().slice(0, 160), verse_text: (n.verse_text || '').trim().slice(0, 400), verse_ref: (n.verse_ref || '').trim().slice(0, 60) }); audit('settings', 'UPDATE', o, db.settings); save(); },
    async pointsSince(iso) { return db.points.filter(p => p.created_at >= iso).map(({ kid_id, amount, skill, created_at }) => ({ kid_id, amount, skill, created_at })); },
  };
}

export const api = MODE === 'supabase' ? supabaseApi() : MODE === 'demo' ? previewApi(demoDb()) : previewApi();

// Keep the last good answer on this phone and use it when the internet is down or very slow,
// so kids can still see the ranking and the songs (net.stale = a saved answer is being shown).
export const net = { stale: false };
export async function cached(key, fn, ms = 6000) {
  if (DEMO) return fn();                                          // v35 phone preview: never touch the phone's saved answers
  const K = 'ya_c_' + key;
  let old = null; try { old = JSON.parse(localStorage.getItem(K) || 'null'); } catch {}
  const fresh = fn().then(v => { try { localStorage.setItem(K, JSON.stringify(v)); } catch {} net.stale = false; return v; });
  if (old == null) return fresh;
  let timer;
  try { return await Promise.race([fresh, new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('slow')), ms); })]); }
  catch { fresh.catch(() => {}); net.stale = true; return old; }
  finally { clearTimeout(timer); }
}

// Rank with ties (same points = same rank)
export function ranked(rows) {
  const sorted = [...rows].sort((a, b) => b.total - a.total || a.nickname.localeCompare(b.nickname, 'th'));
  let rank = 0, prev = null;
  sorted.forEach((r, i) => { if (r.total !== prev) { rank = i + 1; prev = r.total; } r.rank = rank; });
  const same = {}; sorted.forEach(r => { same[r.total] = (same[r.total] || 0) + 1; });
  sorted.forEach(r => { r.tie = same[r.total] > 1 ? same[r.total] : 0; });   // v40: how many kids share this score (0 = nobody)
  return sorted;
}

// ---------------------------------------------------------------- event timing (Thai time)
// phase: 'live' (activity running) | 'feedback' (feedback window open) | 'wait'
// fbOpen / fbMins: is the feedback window open, and minutes until it closes (open) or opens (closed)
// started: it is the activity day and the activity has started
export function eventState(ev, nowMs = Date.now()) {
  const d = new Date(nowMs + 7 * 3600e3), W = 10080;
  const nowMin = d.getUTCDay() * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes();
  const hm = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return h * 60 + m; };
  const day = Number(ev?.event_dow ?? 0) * 1440, start = day + hm(ev?.event_start ?? '10:00'), end = day + hm(ev?.event_end ?? '12:00');
  const fDay = Number(ev?.fb_dow ?? ev?.event_dow ?? 0) * 1440;
  const fs = fDay + hm(ev?.fb_start ?? ev?.event_end ?? '12:00'), fe = fDay + hm(ev?.fb_end ?? '23:59') + 1;
  const fbOpen = nowMin >= fs && nowMin < fe;
  const fbMins = fbOpen ? fe - nowMin : (fs - nowMin + W) % W;
  const started = nowMin >= start && nowMin < day + 1440;
  if (nowMin >= start && nowMin < end) return { phase: 'live', mins: end - nowMin, fbOpen, fbMins, started };
  if (fbOpen) return { phase: 'feedback', mins: fe - nowMin, fbOpen, fbMins, started };
  return { phase: 'wait', mins: (start - nowMin + W) % W, fbOpen, fbMins, started };
}
export function bkkToday() {
  const d = new Date(Date.now() + 7 * 3600e3);
  return d.toISOString().slice(0, 10);
}
