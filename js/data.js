// Data layer: Supabase when configured, otherwise a local PREVIEW store.
const cfg = window.YA_CONFIG || {};
export const MODE = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY ? 'supabase' : 'preview';
export const SKILLS = ['piano', 'singing', 'english', 'thai', 'attendance', 'bonus'];
export const SKILL_ICON = { piano: '🎹', singing: '🎤', english: '🔤', thai: '📖', attendance: '⛪', bonus: '🎁' };

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
      const [lb, st] = await Promise.all([sb.from('leaderboard').select('*'), sb.from('kid_skill_totals').select('*')]);
      const rows = ok(lb).map(r => ({ ...r, skills: {} })), by = Object.fromEntries(rows.map(r => [r.id, r]));
      ok(st).forEach(x => {
        const r = by[x.kid_id]; if (!r) return;
        r.skills[x.skill] = (r.skills[x.skill] || 0) + x.total;
        if (x.detail) ((r.details ??= {})[x.skill] ??= {})[x.detail] = x.total;
      });
      return rows;
    },
    async pointCats() { return ok(await sb.from('point_categories').select('*').order('sort')); },
    async savePointCat(row, isNew) { const { key, ...d } = row; ok(isNew ? await sb.from('point_categories').insert(row) : await sb.from('point_categories').update(d).eq('key', key)); },
    async deletePointCat(key) { ok(await sb.from('point_categories').delete().eq('key', key)); },

    async session() { return (await sb.auth.getSession()).data.session; },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async signUp(email, password) { return ok(await sb.auth.signUp({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async myRole() { return ok(await sb.rpc('my_role')); },
    async claimAdmin(name) { return ok(await sb.rpc('claim_admin', { p_name: name })); },

    async kids() { return ok(await sb.from('kids').select('*').order('nickname')); },
    async addKid(k) { return ok(await sb.from('kids').insert(k).select().single()); },
    async updateKid(id, patch) { ok(await sb.from('kids').update(patch).eq('id', id)); },
    async deleteKid(id) { ok(await sb.from('kids').delete().eq('id', id)); },

    async attendance(day, session = 'main') {
      return ok(await sb.from('attendance').select('*').eq('day', day).eq('session', session));
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
      return ok(await sb.from('attendance_rounds').select('*').eq('day', day).eq('session', session).maybeSingle());
    },
    async setRound(day, finished, session = 'main') {
      const u = await uid();
      ok(await sb.from('attendance_rounds').upsert({ day, session, finished, finished_by: u, finished_at: new Date().toISOString() }));
    },

    async addPoints(rows) {
      const given_by = await uid();
      ok(await sb.from('points').insert(rows.map(r => ({ ...r, given_by }))));
    },
    async recentPoints(limit = 30) {
      return ok(await sb.from('points').select('*, kids(nickname, avatar)').is('attendance_id', null)
        .order('created_at', { ascending: false }).limit(limit));
    },
    async deletePoint(id) { ok(await sb.from('points').delete().eq('id', id)); },

    async money() { return ok(await sb.from('money').select('*').order('created_at', { ascending: false })); },
    async addMoney(m) { const created_by = await uid(); ok(await sb.from('money').insert({ ...m, created_by })); },
    async deleteMoney(id) { ok(await sb.from('money').delete().eq('id', id)); },

    async settings() { return ok(await sb.from('settings').select('*').eq('id', 1).single()); },
    async saveSettings(patch) { ok(await sb.from('settings').update(patch).eq('id', 1)); },

    async pendingUsers() { return ok(await sb.rpc('pending_users')); },
    async staffList() { return ok(await sb.rpc('staff_list')); },
    async approve(user_id) { ok(await sb.from('staff').insert({ user_id, role: 'editor' })); },
    async removeStaff(user_id) { ok(await sb.from('staff').delete().eq('user_id', user_id)); },
    async myId() { return uid(); },

    async attendanceAll() { return ok(await sb.from('attendance').select('kid_id,status,day')); },

    async schedule() { return ok(await sb.from('schedule').select('*').order('day').order('time_text')); },
    async saveSchedule(row) { const { id, ...d } = row; ok(id ? await sb.from('schedule').update(d).eq('id', id) : await sb.from('schedule').insert(d)); },
    async deleteSchedule(id) { ok(await sb.from('schedule').delete().eq('id', id)); },

    async shop() {
      const [c, i] = await Promise.all([sb.from('shop_categories').select('*').order('sort').order('created_at'),
        sb.from('shop_items').select('*').order('sort').order('price')]);
      return { cats: ok(c), items: ok(i) };
    },
    async saveCategory(row) { const { id, ...d } = row; ok(id ? await sb.from('shop_categories').update(d).eq('id', id) : await sb.from('shop_categories').insert(d)); },
    async deleteCategory(id) { ok(await sb.from('shop_categories').delete().eq('id', id)); },
    async saveItem(row) { const { id, ...d } = row; ok(id ? await sb.from('shop_items').update(d).eq('id', id) : await sb.from('shop_items').insert(d)); },
    async deleteItem(id) { ok(await sb.from('shop_items').delete().eq('id', id)); },

    async eventInfo() { return ok(await sb.from('event_info').select('*').single()); },
    async allPoints() {
      const out = []; // page through in case there are many rows
      for (let from = 0; ; from += 1000) {
        const rows = ok(await sb.from('points').select('*, kids(nickname, avatar)').order('created_at').range(from, from + 999));
        out.push(...rows); if (rows.length < 1000) return out;
      }
    },
    async sendFeedback(row) { ok(await sb.from('feedback').insert(row)); },
    async feedback() { return ok(await sb.from('feedback').select('*').order('created_at', { ascending: false }).limit(200)); },
    async deleteFeedback(id) { ok(await sb.from('feedback').delete().eq('id', id)); },

    // ---- songs + pictures
    async songs() { return ok(await sb.from('songs').select('*').order('sort').order('title')); },
    async saveSong(row) {
      const { id, ...d } = row; d.updated_at = new Date().toISOString();
      return ok(id ? await sb.from('songs').update(d).eq('id', id).select().single() : await sb.from('songs').insert(d).select().single());
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
    async logEvents(rows) { ok(await sb.from('kid_events').insert(rows)); },
    async auditLog(limit = 100) { return ok(await sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit)); },
    async auditAll() { return pageAll((a, b) => sb.from('audit_log').select('*').order('created_at').range(a, b)); },
    async kidEvents() { return pageAll((a, b) => sb.from('kid_events').select('*').order('created_at').range(a, b)); },
    async kidEventsSince(iso) { return pageAll((a, b) => sb.from('kid_events').select('event,detail,device_id,kid_id,created_at').gte('created_at', iso).order('created_at').range(a, b)); },
    async reauth(password) {
      const email = (await sb.auth.getUser()).data.user?.email;
      ok(await sb.auth.signInWithPassword({ email, password }));
    },
    async clearKidEvents() { return ok(await sb.rpc('clear_kid_events')); },

    // ---- prizes given, announcement + verse, weekly summary
    async redemptions(limit = 1000) { return ok(await sb.from('redemptions').select('*, kids(nickname, avatar)').order('created_at', { ascending: false }).limit(limit)); },
    async redeem(row) { ok(await sb.from('redemptions').insert(row)); },
    async deleteRedemption(id) { ok(await sb.from('redemptions').delete().eq('id', id)); },
    async saveNotice(n) { ok(await sb.rpc('save_notice', { p_announce: n.announce || '', p_verse_text: n.verse_text || '', p_verse_ref: n.verse_ref || '' })); },
    async pointsSince(iso) { return pageAll((a, b) => sb.from('points').select('kid_id,amount,skill,created_at').gte('created_at', iso).order('created_at').range(a, b)); },
  };
  async function pageAll(q) {
    const out = [];
    for (let from = 0; ; from += 1000) { const rows = ok(await q(from, from + 999)); out.push(...rows); if (rows.length < 1000) return out; }
  }
}

// ---------------------------------------------------------------- Preview (local)
function previewApi() {
  const KEY = 'ya_preview_db';
  const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') ||
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
  const syncAtt = (row) => {
    db.points = db.points.filter(p => p.attendance_id !== row.id);
    if (row.status === 'present' && db.settings.attendance_points > 0)
      db.points.push({ id: id(), kid_id: row.kid_id, skill: 'attendance', amount: db.settings.attendance_points, note: row.day, attendance_id: row.id, created_at: now() });
  };

  return {
    onAuth: (cb) => listeners.push(cb),
    async leaderboard() {
      return db.kids.filter(k => k.active).map(k => {
        const r = { id: k.id, nickname: k.nickname, avatar: k.avatar, total: 0, skills: {}, spent: db.redemptions.filter(x => x.kid_id === k.id).reduce((a, x) => a + x.price, 0) };
        db.points.filter(p => p.kid_id === k.id).forEach(p => {
          r.skills[p.skill] = (r.skills[p.skill] || 0) + p.amount; r.total += p.amount;
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
    async signIn() { db.loggedIn = true; save(); listeners.forEach(f => f()); },
    async signUp() { return {}; },
    async signOut() { db.loggedIn = false; save(); listeners.forEach(f => f()); },
    async myRole() { return db.loggedIn ? 'admin' : null; },
    async claimAdmin() { return 'ok'; },

    async kids() { return [...db.kids].sort((a, b) => a.nickname.localeCompare(b.nickname, 'th')); },
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

    async addPoints(rows) { rows.forEach(r => { const p = { id: id(), attendance_id: null, created_at: now(), ...r }; db.points.push(p); audit('points', 'INSERT', null, p); }); save(); },
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
      return { cats: [...db.cats].sort((a, b) => a.sort - b.sort), items: [...db.items].sort((a, b) => a.sort - b.sort || a.price - b.price) };
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

    async eventInfo() { const { event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music = {}, announce = '', verse_text = '', verse_ref = '' } = db.settings; return { event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music, announce, verse_text, verse_ref }; },
    async allPoints() { return db.points.map(p => ({ ...p, kids: kidOf(p.kid_id) })); },
    async sendFeedback(row) {
      if (!db.settings.fb_open) throw new Error('closed');
      db.feedback.unshift({ id: id(), created_at: now(), ...row }); save();
    },
    async feedback() { return db.feedback; },
    async deleteFeedback() { throw new Error('feedback is permanent'); },

    async songs() {
      if (!db.songs) { const { SEED_SONGS } = await import('./songs-seed.js?v=23'); db.songs = SEED_SONGS.map(x => ({ id: id(), active: true, ...x })); save(); }
      return [...db.songs].sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, 'th'));
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
    async logEvents(rows) { rows.forEach(r => db.events.push({ id: db.events.length + 1, created_at: now(), ...r })); save(); },
    async auditLog(limit = 100) { return [...db.audit].reverse().slice(0, limit); },
    async auditAll() { return db.audit; },
    async kidEvents() { return db.events; },
    async kidEventsSince(iso) { return db.events.filter(e => e.created_at >= iso); },
    async reauth(pw) { if (!pw) throw new Error('password'); },
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

export const api = MODE === 'supabase' ? supabaseApi() : previewApi();

// Keep the last good answer on this phone and use it when the internet is down or very slow,
// so kids can still see the ranking and the songs (net.stale = a saved answer is being shown).
export const net = { stale: false };
export async function cached(key, fn, ms = 6000) {
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
