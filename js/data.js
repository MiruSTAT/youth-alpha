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
    onAuth: (cb) => sb.auth.onAuthStateChange(() => cb()),
    async leaderboard() { return ok(await sb.from('leaderboard').select('*')); },

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
  };
}

// ---------------------------------------------------------------- Preview (local)
function previewApi() {
  const KEY = 'ya_preview_db';
  const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') ||
    { kids: [], attendance: [], rounds: [], points: [], money: [], settings: { attendance_points: 10 }, loggedIn: false };
  let db = load();
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
        const r = { id: k.id, nickname: k.nickname, avatar: k.avatar, total: 0 };
        SKILLS.forEach(s => r[s] = 0);
        db.points.filter(p => p.kid_id === k.id).forEach(p => { r[p.skill] += p.amount; r.total += p.amount; });
        return r;
      });
    },
    async session() { return db.loggedIn ? { user: { id: 'preview-admin' } } : null; },
    async signIn() { db.loggedIn = true; save(); listeners.forEach(f => f()); },
    async signUp() { return {}; },
    async signOut() { db.loggedIn = false; save(); listeners.forEach(f => f()); },
    async myRole() { return db.loggedIn ? 'admin' : null; },
    async claimAdmin() { return 'ok'; },

    async kids() { return [...db.kids].sort((a, b) => a.nickname.localeCompare(b.nickname, 'th')); },
    async addKid(k) { const r = { id: id(), active: true, grp: '', created_at: now(), ...k }; db.kids.push(r); save(); return r; },
    async updateKid(kid, patch) { Object.assign(db.kids.find(k => k.id === kid), patch); save(); },
    async deleteKid(kid) {
      db.kids = db.kids.filter(k => k.id !== kid);
      ['attendance', 'points', 'money'].forEach(t => db[t] = db[t].filter(r => r.kid_id !== kid)); save();
    },

    async attendance(day, session = 'main') { return db.attendance.filter(a => a.day === day && a.session === session); },
    async setAttendance(kid_id, day, status, session = 'main') {
      let row = db.attendance.find(a => a.kid_id === kid_id && a.day === day && a.session === session);
      if (row) { row.status = status; row.updated_at = now(); }
      else { row = { id: id(), kid_id, day, session, status, updated_at: now() }; db.attendance.push(row); }
      syncAtt(row); save();
    },
    async clearAttendance(kid_id, day, session = 'main') {
      const row = db.attendance.find(a => a.kid_id === kid_id && a.day === day && a.session === session);
      if (!row) return;
      db.points = db.points.filter(p => p.attendance_id !== row.id);
      db.attendance = db.attendance.filter(a => a !== row); save();
    },
    async round(day, session = 'main') { return db.rounds.find(r => r.day === day && r.session === session) || null; },
    async setRound(day, finished, session = 'main') {
      const r = db.rounds.find(r => r.day === day && r.session === session);
      if (r) r.finished = finished; else db.rounds.push({ day, session, finished }); save();
    },

    async addPoints(rows) { rows.forEach(r => db.points.push({ id: id(), attendance_id: null, created_at: now(), ...r })); save(); },
    async recentPoints(limit = 30) {
      return db.points.filter(p => !p.attendance_id).sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit).map(p => ({ ...p, kids: kidOf(p.kid_id) }));
    },
    async deletePoint(pid) { db.points = db.points.filter(p => p.id !== pid); save(); },

    async money() { return [...db.money].sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addMoney(m) { db.money.push({ id: id(), created_at: now(), ...m }); save(); },
    async deleteMoney(mid) { db.money = db.money.filter(m => m.id !== mid); save(); },

    async settings() { return db.settings; },
    async saveSettings(patch) { Object.assign(db.settings, patch); save(); },

    async pendingUsers() { return []; },
    async staffList() { return [{ user_id: 'preview-admin', email: 'preview@local', display_name: 'Preview', role: 'admin' }]; },
    async approve() {}, async removeStaff() {},
    async myId() { return 'preview-admin'; },
  };
}

export const api = MODE === 'supabase' ? supabaseApi() : previewApi();

// Rank with ties (same points = same rank)
export function ranked(rows) {
  const sorted = [...rows].sort((a, b) => b.total - a.total || a.nickname.localeCompare(b.nickname, 'th'));
  let rank = 0, prev = null;
  sorted.forEach((r, i) => { if (r.total !== prev) { rank = i + 1; prev = r.total; } r.rank = rank; });
  return sorted;
}
