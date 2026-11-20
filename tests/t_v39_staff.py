# v39: admin activity in the kids' activity log is tagged (by_staff), left out of exports by default, and never shown to kids.
# Run against a preview copy (tools/preview.sh t_v39_staff). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os, datetime, openpyxl
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
FLUSH = "import(performance.getEntriesByType('resource').map(e => e.name).find(n => n.includes('/js/track.js'))).then(m => m.flush())"   # v41: same module (and ?v=) the app loaded, so it never goes stale"

def seed_db(sup=False, events=None):
    now = datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'show_visits': True}, 'loggedIn': sup,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': sup, 'unlocked': sup, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': {}, 'login_mode': 'off'}],
        'admins': [{'user_id': 'u-kru', 'username': 'kru', 'name': 'Kru', 'pw': 'kru12345', 'active': True, 'pending': False, 'access': {'1': ['points']}}],
        'events': events or [],
    }

def ctx(b, db, w=390, h=844):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 600, has_touch=True, service_workers='block', accept_downloads=True)
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % json.dumps(json.dumps(db)))
    cx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#tour{display:none!important}';document.head.append(s)})")
    cx.route('**/three.module.min.js', lambda r: r.fulfill(path=V + 'three.module.min.js', content_type='application/javascript'))
    cx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    cx.route('**/xlsx.full.min.js', lambda r: r.fulfill(path=V + 'xlsx.full.min.js', content_type='application/javascript'))
    cx.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg = cx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    return cx, pg

def go(pg, h, w=1300): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)
def evs(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))['events']
def flush(pg): pg.evaluate(FLUSH); pg.wait_for_timeout(300)

def export_rows(pg):
    with pg.expect_download() as d:
        pg.click('[data-x=xs_kidlog]')
    f = S + 'v39_export.xlsx'; d.value.save_as(f)
    wb = openpyxl.load_workbook(f)
    ws = wb.worksheets[0]
    return [[c.value for c in r] for r in ws.iter_rows()]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: kid use, then an admin signs in on the same phone
    cx, pg = ctx(b, seed_db())
    go(pg, '#/', 2500); go(pg, '#/menu', 1200); flush(pg)
    e = evs(pg)
    check(len(e) >= 2 and not any(x.get('by_staff') for x in e), 'before sign-in: events kept, not marked (%d)' % len(e))
    check('menu' in [x['detail'] for x in e], 'menu view was logged')
    go(pg, '#/admin', 1500)
    pg.fill('#lf [name=email]', 'kru'); pg.fill('#lf [name=pw]', 'kru12345'); pg.click('#lf button'); pg.wait_for_timeout(1800)
    e = evs(pg)
    check(len(e) >= 2 and all(x.get('by_staff') for x in e), 'after sign-in: last 10 minutes on this phone marked as admin')
    check(pg.locator('.toast, dialog[open], .modal').count() == 0 or 'admin activity' not in pg.locator('body').inner_text().lower(), 'no message shown about it')
    n0 = len(e)
    go(pg, '#/', 2000); flush(pg)
    e = evs(pg)
    check(len(e) > n0 and all(x.get('by_staff') for x in e[n0:]), 'signed in: new kid-page events marked as admin')
    cx.close()

    # ---- B: kid side shows nothing new; visit counter leaves admin opens out
    old = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=2)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    mk = lambda i, ev, staff: {'id': i, 'created_at': old, 'device_id': 'dev%d' % (i % 3), 'kid_id': None, 'event': ev, 'detail': 'x', 'path': '#/', 'by_staff': staff}
    seeded = [mk(i + 1, 'open_app', i < 4) for i in range(10)] + [mk(20 + i, 'view', i < 2) for i in range(5)]
    cx, pg = ctx(b, seed_db(events=seeded))
    go(pg, '#/', 3000)
    txt = pg.locator('.visit-pill').inner_text() if pg.locator('.visit-pill').count() else ''   # v46: visits moved to the corner label
    check('6' in txt and '10' not in txt, 'home visits count kid opens only (6 of 10 seeded): %r' % txt)
    pg.screenshot(path=S + 'v39_home.png')
    cx.close()

    # ---- C: export page (super admin): admin activity left out by default, switch adds it with a column
    cx, pg = ctx(b, seed_db(sup=True, events=seeded), 1366, 900)
    go(pg, '#/admin/export', 2500)
    check(pg.locator('#xlStaff').count() == 1 and not pg.locator('#xlStaff').is_checked(), 'switch shown, off by default')
    pg.locator('.xl-staff').screenshot(path=S + 'v39_switch.png')
    r1 = export_rows(pg)
    r2 = None
    pg.check('#xlStaff'); r2 = export_rows(pg)
    check(len(r1) - 1 == 9, 'default export: 9 kid rows (got %d)' % (len(r1) - 1))
    check(len(r2) - 1 == 15 and ('By an admin' in r2[0] or 'โดยผู้ดูแล' in r2[0]), 'with switch: 15 rows + "by an admin" column')
    check(r2 and sum(1 for r in r2[1:] if r[-1]) == 6, 'with switch: 6 rows marked')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
