// v38 (roadmap step 8): data tools for the super admin, page #/admin/data.
// 1) download this program's data as one .sql file (PostgreSQL + SQLite), CSV per table or JSON;
// v46: the SQL box and the quick insights were removed (the owner loads the .sql file into DBeaver instead).
// The app hands in its helpers through c (dtCtx() in app.js), like superadmin.js does.

let tables = null;                                // { name: { cols: [...], rows: [{...}] } } of the open program
let tablesOf = null;                              // program id the tables belong to

// ---------- reading the data (same calls as the Excel export) and making flat tables
async function loadTables(c, force = false) {
  if (tables && tablesOf === c.program.id && !force) return tables;
  const { api } = c;
  const [kids, pts, att, cats, shop, red, fb, alog, kev, lb] = await Promise.all([
    api.kids(), api.allPoints(), api.attendanceAll(), c.pcats(true), api.shop(), api.redemptions(5000).catch(() => []),
    api.feedback().catch(() => []), api.auditAll().catch(() => []), api.kidEvents().catch(() => []), c.leaderboard(true)]);
  const raw = {
    kids, points: pts, attendance: att, point_categories: cats, shop_items: shop.items || [], redemptions: red, feedback: fb,
    leaderboard: lb.map(r => ({ kid_id: r.id, nickname: r.nickname, total: r.total || 0, spent: r.spent || 0 })),
    admin_log: alog, kid_events: kev,
  };
  tables = {}; tablesOf = c.program.id;
  for (const [name, rows] of Object.entries(raw)) tables[name] = flat(rows || []);
  return tables;
}
// one row = one level of plain values; joined rows (e.g. points.kids) are dropped, other objects become JSON text
function flat(rows) {
  const cols = [];
  const out = rows.map(r => {
    const o = {};
    for (const [k, v] of Object.entries(r || {})) {
      if (k === 'kids' && v && typeof v === 'object') continue;
      if (!cols.includes(k)) cols.push(k);
      o[k] = v === undefined ? null : (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
    }
    return o;
  });
  return { cols, rows: out };
}
function colType(rows, col) {
  const vs = rows.map(r => r[col]).filter(v => v !== null && v !== undefined);
  if (!vs.length) return 'TEXT';
  if (vs.every(v => typeof v === 'boolean')) return 'BOOLEAN';
  if (vs.every(v => typeof v === 'number' && Number.isInteger(v))) return 'INTEGER';
  if (vs.every(v => typeof v === 'number')) return 'REAL';
  return 'TEXT';
}
const qi = (n) => '"' + String(n).replace(/"/g, '""') + '"';
const lit = (v) => v === null || v === undefined ? 'NULL' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE')
  : typeof v === 'number' ? (Number.isFinite(v) ? String(v) : 'NULL') : "'" + String(v).replace(/'/g, "''") + "'";

// one .sql file: CREATE TABLE + INSERT, plain SQL that both PostgreSQL and SQLite accept
function sqlDump(c, tb) {
  const lines = [`-- Youth Alpha data export: program "${c.program.name}" (${c.program.slug}), ${c.bkkToday()}`,
    '-- Plain SQL for PostgreSQL or SQLite. Load it into an EMPTY database (the tables are created here).', 'BEGIN;'];
  for (const [name, { cols, rows }] of Object.entries(tb)) {
    if (!cols.length) { lines.push(`-- ${name}: no rows`); continue; }
    lines.push('', `CREATE TABLE ${qi(name)} (${cols.map(k => `${qi(k)} ${colType(rows, k)}`).join(', ')});`);
    for (let i = 0; i < rows.length; i += 200) {
      lines.push(`INSERT INTO ${qi(name)} (${cols.map(qi).join(', ')}) VALUES\n` +
        rows.slice(i, i + 200).map(r => '  (' + cols.map(k => lit(r[k])).join(', ') + ')').join(',\n') + ';');
    }
  }
  lines.push('COMMIT;', '');
  return lines.join('\n');
}
const csvCell = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (cols, rows) => '﻿' + [cols.map(csvCell).join(','), ...rows.map(r => cols.map(k => csvCell(Array.isArray(r) ? r[cols.indexOf(k)] : r[k])).join(','))].join('\r\n');
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}


// ---------- the page
export async function pData(c) {
  const { t, esc, view, $ } = c;
  view.innerHTML = `${c.pageHead(t('tab_data'))}
    <p class="muted dt-intro">${t('dtIntro', esc(c.program.name))}</p>
    <div id="dtLoad" class="muted">${t('loading')}</div>`;
  let tb;
  try { tb = await loadTables(c, true); } catch (e) { c.fail(e); return; }
  const names = Object.keys(tb);
  view.innerHTML = `${c.pageHead(t('tab_data'))}
    <p class="muted dt-intro">🔒 ${t('dtIntro', esc(c.program.name))}</p>

    <h2 class="grp" id="dtFiles">${t('dtFiles')}</h2>
    <div class="card dt-files">
      <div class="dt-big"><button class="btn primary" id="dtSql">🗄️ ${t('dtSqlFile')}</button><button class="btn" id="dtJson">{ } ${t('dtJsonAll')}</button></div>
      <p class="muted">${t('dtSqlSub')}</p>
      <h3 class="dt-h3">${t('dtCsv')}</h3>
      <div class="dt-tables">${names.map(n => `<div class="dt-tbl"><span class="dt-tn"><b>${n}</b><span>${t('dtRows', tb[n].rows.length)}</span></span>
        <button class="btn small" data-csv="${n}">CSV</button></div>`).join('')}</div>
    </div>`;

  $('#dtSql').onclick = () => download(`${c.program.slug}-data-${c.bkkToday()}.sql`, sqlDump(c, tb), 'application/sql');
  $('#dtJson').onclick = () => download(`${c.program.slug}-data-${c.bkkToday()}.json`,
    JSON.stringify(Object.fromEntries(names.map(n => [n, tb[n].rows])), null, 1), 'application/json');
  view.querySelectorAll('[data-csv]').forEach(b => b.onclick = () => {
    const n = b.dataset.csv; download(`${c.program.slug}-${n}-${c.bkkToday()}.csv`, toCsv(tb[n].cols, tb[n].rows), 'text/csv');
  });
}
