// Run SQL on the live database from the built-in browser (HANDOFF.md "Running SQL from the browser").
// 1. Open https://supabase.com/dashboard/project/zzjoxshqatkzqsnjvlwn/sql/new in the built-in browser (owner is signed in).
// 2. Paste THIS file's code once with javascript_tool. Then:
//      await Q('select 1')                                   -> "201 [...]"  or  "400 {message}"
//      await QF('<commit>', 'supabase/022_x.sql')            -> runs a file straight from GitHub (no pasting big files!)
//      await QF('<commit>', 'supabase/022_x.sql', 'tests/sql_022_test.sql')   -> file + rolled-back test block in ONE transaction
// One call = one transaction. A test block must end with: raise exception 'TEST RESULT: %', out;  (so nothing is kept).
// Push the files to a work branch first (or use main after merging) and pass that commit id.
window.Q = async (sql) => {
  const tok = JSON.parse(localStorage['supabase.dashboard.auth.token']).access_token;
  const r = await fetch('https://api.supabase.com/v1/projects/zzjoxshqatkzqsnjvlwn/database/query', { method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ query: sql }) });
  return r.status + ' ' + (await r.text());
};
window.RAW = (commit, path) => fetch(`https://raw.githubusercontent.com/MiruSTAT/youth-alpha/${commit}/${path}`).then(r => r.ok ? r.text() : Promise.reject(new Error(r.status + ' ' + path)));
window.QF = async (commit, ...paths) => Q((await Promise.all(paths.map(p => RAW(commit, p)))).join('\n'));
'ready: Q(sql), RAW(commit, path), QF(commit, ...paths)';
