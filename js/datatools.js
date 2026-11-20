// v38 (roadmap step 8): data tools for the super admin, page #/admin/data.
// 1) download this program's data as one .sql file (PostgreSQL + SQLite), CSV per table or JSON;
// 2) an SQL box: SQLite (vendor/sql-wasm.js, loaded only on this page) runs on a COPY of the data inside this browser,
//    so a query can never change or delete the live data;
// 3) quick insights: attendance per day, points per category, how many days each kid came, top kids, mean/median/SD.
// The app hands in its helpers through c (dtCtx() in app.js), like superadmin.js does.

let SQL = null;                                   // the SQLite engine, loaded once
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

// ---------- SQLite in the browser
function loadSql() {
  if (SQL) return Promise.resolve(SQL);
  return new Promise((res, rej) => {
    const go = () => window.initSqlJs({ locateFile: (f) => 'vendor/' + f }).then(x => { SQL = x; res(x); }, rej);
    if (window.initSqlJs) return go();
    const s = document.createElement('script'); s.src = 'vendor/sql-wasm.js?v=45'; s.onload = go; s.onerror = rej; document.head.appendChild(s);
  });
}
async function makeDb(c, tb) {
  const S = await loadSql();
  const db = new S.Database();
  db.exec(sqlDump(c, tb).replace(/^BEGIN;$|^COMMIT;$/gm, ''));
  return db;
}

const EXAMPLES = [
  ['dtEx_top', 'SELECT nickname, total, spent, total - spent AS can_spend\nFROM leaderboard\nORDER BY total DESC\nLIMIT 10;'],
  ['dtEx_day', "SELECT day,\n       SUM(status = 'present') AS present,\n       SUM(status = 'leave')   AS on_leave,\n       COUNT(*)                AS marked\nFROM attendance\nGROUP BY day\nORDER BY day;"],
  ['dtEx_cat', 'SELECT skill, SUM(amount) AS points, COUNT(*) AS times\nFROM points\nGROUP BY skill\nORDER BY points DESC;'],
  ['dtEx_rate', "SELECT k.nickname,\n       COUNT(*) AS days_marked,\n       ROUND(100.0 * SUM(a.status = 'present') / COUNT(*), 1) AS present_pct\nFROM attendance a\nJOIN kids k ON k.id = a.kid_id\nGROUP BY k.id, k.nickname\nORDER BY present_pct DESC;"],
  ['dtEx_run', 'WITH d AS (\n  SELECT substr(created_at, 1, 10) AS day, SUM(amount) AS pts\n  FROM points\n  GROUP BY 1\n)\nSELECT day, pts, SUM(pts) OVER (ORDER BY day) AS running_total\nFROM d\nORDER BY day;'],
  ['dtEx_prize', 'SELECT item_name, COUNT(*) AS times, SUM(price) AS points_spent\nFROM redemptions\nGROUP BY item_name\nORDER BY times DESC;'],
];

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
    </div>

    <h2 class="grp" id="dtBoxH">${t('dtBox')}</h2>
    <div class="card dt-box">
      <p class="muted" style="margin-top:0">${t('dtBoxSub')}</p>
      <div class="field"><label for="dtEx">${t('dtExamples')}</label>
        <select class="input" id="dtEx"><option value="">—</option>${EXAMPLES.map(([k], i) => `<option value="${i}">${t(k)}</option>`).join('')}</select></div>
      <textarea class="input dt-q" id="dtQ" rows="7" spellcheck="false" autocapitalize="off" aria-label="SQL">${esc(EXAMPLES[0][1])}</textarea>
      <div class="dt-run"><button class="btn primary" id="dtRun">▶ ${t('dtRun')}</button><button class="btn" id="dtCsvRes" disabled>📥 ${t('dtResCsv')}</button></div>
      <div id="dtOut" class="dt-out"></div>
      <details class="dt-schema"><summary>${t('dtSchema')}</summary>${names.map(n => `<p><b>${n}</b> <span class="muted">(${tb[n].cols.map(esc).join(', ') || '—'})</span></p>`).join('')}</details>
    </div>

    <h2 class="grp" id="dtInsH">${t('dtInsights')}</h2>
    <div id="dtIns"></div>`;

  $('#dtSql').onclick = () => download(`${c.program.slug}-data-${c.bkkToday()}.sql`, sqlDump(c, tb), 'application/sql');
  $('#dtJson').onclick = () => download(`${c.program.slug}-data-${c.bkkToday()}.json`,
    JSON.stringify(Object.fromEntries(names.map(n => [n, tb[n].rows])), null, 1), 'application/json');
  view.querySelectorAll('[data-csv]').forEach(b => b.onclick = () => {
    const n = b.dataset.csv; download(`${c.program.slug}-${n}-${c.bkkToday()}.csv`, toCsv(tb[n].cols, tb[n].rows), 'text/csv');
  });

  // SQL box
  let db = null, last = null;
  $('#dtEx').onchange = (e) => { const i = e.target.value; if (i !== '') $('#dtQ').value = EXAMPLES[+i][1]; };
  $('#dtRun').onclick = async () => {
    const out = $('#dtOut'), btn = $('#dtRun'); btn.disabled = true; out.innerHTML = `<p class="muted">${t('loading')}</p>`;
    try {
      db ??= await makeDb(c, tb);
      const res = db.exec($('#dtQ').value);
      last = res[res.length - 1] || null;
      $('#dtCsvRes').disabled = !last;
      out.innerHTML = !last ? `<p class="muted">${t('dtNoRows')}</p>`
        : `<p class="muted dt-count">${t('dtRows', last.values.length)}${last.values.length > 300 ? ' · ' + t('dtFirst', 300) : ''}</p>
          <div class="dt-scroll"><table class="dt-table"><thead><tr>${last.columns.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${last.values.slice(0, 300).map(r => `<tr>${r.map(v => `<td>${v === null ? '<i class="muted">NULL</i>' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    } catch (e) {
      console.warn(e); last = null; $('#dtCsvRes').disabled = true;
      out.innerHTML = `<p class="dt-err">⚠️ ${esc(String(e?.message || e))}</p>`;
    }
    btn.disabled = false;
  };
  $('#dtCsvRes').onclick = () => { if (last) download(`${c.program.slug}-query-${c.bkkToday()}.csv`, toCsv(last.columns, last.values), 'text/csv'); };
  $('#dtQ').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#dtRun').click(); } });

  drawInsights(c, tb);
}

// ---------- insights: plain HTML bars (one colour, numbers always shown in text, a table under each chart)
const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const median = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const sd = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const r1 = (x) => Math.round(x * 10) / 10;

function hbars(c, rows, unit = '') {                               // rows: [{label, value}]
  if (!rows.length) return `<p class="muted">${c.t('none')}</p>`;
  const max = Math.max(...rows.map(r => r.value), 1);
  return `<div class="hb">${rows.map(r => `<div class="hb-row" title="${c.esc(r.label)}: ${r.value}${unit}"><span class="hb-l">${c.esc(r.label)}</span>
    <span class="hb-track"><span class="hb-bar" style="width:${Math.max(1.5, 100 * r.value / max)}%"></span></span><span class="hb-v">${r.value}</span></div>`).join('')}</div>`;
}
function cols(c, rows) {                                            // vertical bars over time / counts, scrolls sideways if long
  if (!rows.length) return `<p class="muted">${c.t('none')}</p>`;
  const max = Math.max(...rows.map(r => r.value), 1), every = Math.ceil(rows.length / 12);
  return `<div class="vc-scroll"><div class="vc" style="min-width:${Math.max(100, rows.length * 22)}px">${rows.map((r, i) => `<div class="vc-col" title="${c.esc(r.label)}: ${r.value}">
    <span class="vc-v">${r.value}</span><span class="vc-bar" style="height:${Math.max(2, 100 * r.value / max)}%"></span><span class="vc-l">${i % every ? '' : c.esc(r.label)}</span></div>`).join('')}</div></div>`;
}
const numTable = (c, head, rows) => `<details class="dt-nums"><summary>${c.t('dtSeeNums')}</summary><div class="dt-scroll"><table class="dt-table">
  <thead><tr>${head.map(h => `<th>${c.esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${c.esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;

function drawInsights(c, tb) {
  const { t } = c;
  const kids = tb.kids.rows, active = kids.filter(k => k.active !== false), att = tb.attendance.rows, pts = tb.points.rows;
  const lb = tb.leaderboard.rows, cats = tb.point_categories.rows;
  const days = [...new Set(att.map(a => a.day))].sort();
  const perDay = days.map(d => ({ label: d.slice(5), day: d, value: att.filter(a => a.day === d && a.status === 'present').length }));
  const cameDays = {}; att.forEach(a => { if (a.status === 'present') cameDays[a.kid_id] = (cameDays[a.kid_id] || 0) + 1; });
  const came = active.map(k => cameDays[k.id] || 0);
  const hist = Array.from({ length: (Math.max(0, ...came)) + 1 }, (_, n) => ({ label: String(n), value: came.filter(x => x === n).length }));
  const totals = lb.map(r => r.total);
  const rate = days.length && active.length ? 100 * mean(came) / days.length : 0;
  const catName = (k) => { const x = cats.find(cc => cc.key === k); return x ? c.cName(x) : (k || '—'); };
  const perCat = Object.entries(pts.reduce((m, p) => { m[p.skill] = (m[p.skill] || 0) + (p.amount || 0); return m; }, {}))
    .map(([k, v]) => ({ label: catName(k), value: v })).sort((a, b) => b.value - a.value);
  const top = [...lb].sort((a, b) => b.total - a.total).slice(0, 10).map(r => ({ label: r.nickname, value: r.total }));
  const tile = (v, l, s = '') => `<div class="dt-tile"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ''}</div>`;
  c.$('#dtIns').innerHTML = `
    <div class="dt-tiles">
      ${tile(active.length, t('dtT_kids'))}
      ${tile(days.length, t('dtT_days'))}
      ${tile(r1(rate) + '%', t('dtT_rate'), t('dtT_rateSub'))}
      ${tile(pts.reduce((s, p) => s + (p.amount || 0), 0), t('dtT_points'))}
      ${tile(r1(median(totals)), t('dtT_median'), t('dtT_meanSd', r1(mean(totals)), r1(sd(totals))))}
    </div>
    <div class="dt-charts">
      <div class="card dt-chart"><h3 class="dt-h3">${t('dtC_day')}</h3>${cols(c, perDay)}${numTable(c, [t('date'), t('present')], perDay.map(r => [r.day, r.value]))}</div>
      <div class="card dt-chart"><h3 class="dt-h3">${t('dtC_cat')}</h3>${hbars(c, perCat)}${numTable(c, [t('category'), t('xc_points')], perCat.map(r => [r.label, r.value]))}</div>
      <div class="card dt-chart"><h3 class="dt-h3">${t('dtC_came')}</h3><p class="muted dt-sub">${t('dtC_cameSub')}</p>${cols(c, hist)}${numTable(c, [t('dtDaysCame'), t('dtT_kids')], hist.map(r => [r.label, r.value]))}</div>
      <div class="card dt-chart"><h3 class="dt-h3">${t('dtC_top')}</h3>${hbars(c, top)}${numTable(c, [t('nickname'), t('xc_total')], top.map(r => [r.label, r.value]))}</div>
    </div>`;
}
