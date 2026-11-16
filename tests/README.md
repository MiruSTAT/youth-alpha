# Tests (Playwright, Python)

Run against a **preview copy** of the site (empty `config.js`, so it uses the local fake database):

```bash
mkdir -p /tmp/prev && cp -r index.html sw.js manifest.json icon.svg icons css js sheets vendor /tmp/prev/
echo "window.YA_CONFIG = {};" > /tmp/prev/config.js
cd /tmp/prev && (python3 -m http.server 8766 &) ; python3 /path/to/tests/t_v24_features.py
```

- The scripts expect `three.module.min.js` and `supabase.js` in a local vendor folder (`V=` at the top of each file); change the path for your machine.
- `perf_festive.py` slows the CPU 4× and prints frames per second before, during and after the special mode. Results for v24: special mode about 33 fps (was 9), after it about 40 fps (was 15).
- `t_v23_offline.py` needs `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`.
- `t_v31_members.py` (member login) seeds its own preview database and uses `YA_CHROME` (default `/usr/bin/google-chrome`), `YA_VENDOR` (folder with `three.module.min.js`) and `YA_SHOTS` (screenshot folder).
- Each script prints what it checked and ends with `no errors` when nothing broke.
- `t_v32_admins.py` (admins per program, merged admin panel, who is online) seeds its own preview database; same env variables as `t_v31_members.py`.
- `sql_021_rollback_test.sql` is the rolled-back test of `supabase/021_admin_access.sql` against the live database (send the 021 text followed by this block as one query; the result comes back in the error message `TEST RESULT: …`).
