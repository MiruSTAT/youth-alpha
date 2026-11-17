# v36 (roadmap step 6): visits and feedback counters on the kids' home page + the two switches on the admin Settings page.
# Run against a preview copy (tools/preview.sh t_v36_counters). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')

def seed_db(look=None, sup=True, sw=False):
    now = '2026-11-17T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True, 'show_visits': sw, 'show_fb_count': sw}, 'loggedIn': sup,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': sup, 'unlocked': sup, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
        'admins': [{'user_id': 'u-kru', 'username': 'kru', 'name': 'Kru', 'pw': 'kru12345', 'active': True, 'pending': False, 'access': {'1': ['points', 'settings']}}],
        'events': [{'id': i + 1, 'created_at': now, 'device_id': 'd', 'kid_id': None, 'event': e, 'detail': '', 'path': '#/'} for i, e in enumerate(['open_app'] * 1234 + ['view'] * 5)],
        'feedback': [{'id': 'f%d' % i, 'created_at': now, 'kid_id': None, 'kid_name': 'x', 'mood': 3, 'message': 'hi'} for i in range(56)],
    }

def ctx(b, db, w=390, h=844):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 600, has_touch=True, service_workers='block')
    cx.add_init_script("if(!location.search.includes('demo=1')&&!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % json.dumps(json.dumps(db)))
    cx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#tour{display:none!important}';document.head.append(s)})")
    cx.route('**/three.module.min.js', lambda r: r.fulfill(path=V + 'three.module.min.js', content_type='application/javascript'))
    cx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    cx.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg = cx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    return cx, pg

def go(pg, h, w=1300): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)
def dbnow(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: switches off (default): no counter row on the kids' home page
    cx, pg = ctx(b, seed_db(sup=False))
    go(pg, '#/', 2500)
    check(pg.locator('#homeCount').count() == 0, 'off: no counter row on home')
    cx.close()

    # ---- B: admin Settings page: both switches, saved at once and logged
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/settings', 1800)
    sw = pg.locator('[data-sw]')
    check(sw.count() == 2, 'settings: two counter switches')
    pg.click('[data-sw=show_visits]'); pg.wait_for_timeout(600)
    pg.click('[data-sw=show_fb_count]'); pg.wait_for_timeout(600)
    d = dbnow(pg)
    check(d['settings'].get('show_visits') is True and d['settings'].get('show_fb_count') is True, 'settings: both switches saved on')
    check(pg.locator('[data-sw=show_visits].on').count() == 1, 'settings: switch shows on')
    check(sum(1 for a in d.get('audit', []) if a.get('table_name') == 'settings') >= 2, 'settings: changes written to the admin log')
    pg.locator('[data-sw]').first.scroll_into_view_if_needed(); pg.screenshot(path=S + 'v36_01_settings.png')
    pg.click('[data-sw=show_fb_count]'); pg.wait_for_timeout(600)
    check(dbnow(pg)['settings'].get('show_fb_count') is False, 'settings: switch turns back off')
    cx.close()

    # ---- C: both on: kids' home shows the numbers (Thai), nothing else about feedback
    cx, pg = ctx(b, seed_db(sup=False, sw=True))
    go(pg, '#/', 3000)
    hc = pg.locator('#homeCount')
    txt = hc.inner_text() if hc.count() else ''
    check(hc.is_visible(), 'on: counter row visible')
    check('1,234' in txt and '56' in txt, 'on: shows 1,234 visits and 56 feedback  [%s]' % txt.replace('\n', ' '))
    check('hi' not in txt, 'on: no feedback text shown')
    fs = pg.evaluate("parseFloat(getComputedStyle(document.querySelector('#homeCount')).fontSize)")
    check(fs >= 15, 'on: text is big enough (%spx)' % fs)
    pg.locator('#homeCount').scroll_into_view_if_needed(); pg.wait_for_timeout(1500); hc.screenshot(path=S + 'v36_02_home.png'); pg.locator('main > .sheet').screenshot(path=S + 'v36_03_sheet.png')
    cx.close()

    # ---- D: only visits on
    db = seed_db(sup=False, sw=True); db['settings']['show_fb_count'] = False
    cx, pg = ctx(b, db)
    go(pg, '#/', 3000)
    txt = pg.locator('#homeCount').inner_text()
    check('1,234' in txt and '56' not in txt, 'visits only: feedback number hidden')
    cx.close()

    # ---- E: Normal mode: line icons, no emojis in the row
    cx, pg = ctx(b, seed_db({'mode': 'normal'}, sup=False, sw=True))
    go(pg, '#/', 3000)
    check(pg.locator('#homeCount svg.ico').count() == 2, 'Normal mode: two line icons')
    check('👀' not in pg.locator('#homeCount').inner_text(), 'Normal mode: no emoji')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
