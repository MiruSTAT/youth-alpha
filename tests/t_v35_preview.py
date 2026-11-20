# v35: real mobile preview (?demo=1 in a phone frame), detailed change log switch, kids' pages open full on phones.
# Run against a preview copy (tools/preview.sh t_v35_preview). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')

def seed_db(look=None, sup=True):
    now = '2026-11-17T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True}, 'loggedIn': sup,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': sup, 'unlocked': sup, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
        'admins': [{'user_id': 'u-kru', 'username': 'kru', 'name': 'Kru', 'pw': 'kru12345', 'active': True, 'pending': False, 'access': {'1': ['points', 'settings']}}],
        'events': [],
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
def frame(pg): return pg.frame_locator('#pfBox iframe')
def sheet_top(pg): return pg.evaluate("document.querySelector('main > .sheet').getBoundingClientRect().top")
PULL = """(dy) => { const el = document.querySelector('main > .sheet'), r = el.getBoundingClientRect(), x = r.left + 60, y = r.top + 40;
  const T = (yy) => new Touch({ identifier: 1, target: el, clientX: x, clientY: yy, pageX: x, pageY: yy });
  el.dispatchEvent(new TouchEvent('touchstart', { touches: [T(y)], changedTouches: [T(y)], bubbles: true, cancelable: true }));
  for (let i = 1; i <= 6; i++) el.dispatchEvent(new TouchEvent('touchmove', { touches: [T(y + dy * i / 6)], changedTouches: [T(y + dy * i / 6)], bubbles: true, cancelable: true }));
  el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [T(y + dy)], bubbles: true, cancelable: true })); }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: super admin, PC: look page with the phone preview beside it, live updates, sample data only
    cx, pg = ctx(b, seed_db(), 1400, 900)
    go(pg, '#/admin/look', 1500)
    before = pg.evaluate("localStorage.getItem('ya_preview_db')")
    check(pg.evaluate("document.querySelector('#lookPv').open"), 'PC: phone preview open beside the settings')
    pg.wait_for_timeout(3500)
    fr = frame(pg)
    names = fr.locator('#view').inner_text()
    check('มิน' in names and 'ต้นกล้า' in names and 'Mai' not in names, 'frame shows the sample kids, not the real ones')
    check(fr.locator('.preview-banner:visible').count() == 0, 'no preview banner inside the frame')
    pg.screenshot(path=S + 'v35_01_look_pc.png')
    pg.fill('#lookForm [name=title]', 'Easter Kids'); pg.wait_for_timeout(1200)
    check('Easter Kids' in fr.locator('.brand').inner_text(), 'unsaved name shows at once in the frame')
    pg.select_option('#lookForm [name=pack]', 'easter'); pg.wait_for_timeout(4500)
    check(frame(pg).locator('body').get_attribute('data-pack') == 'easter', 'pack change reloads the frame with the Easter pack')
    check(json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))['programs'][0]['look'] == {}, 'nothing saved before Save')
    # inside the frame: shop works, the adults' area is blocked
    fr = frame(pg)
    pg.evaluate("document.querySelector('#pfBox iframe').contentWindow.location.hash = '#/shop'"); pg.wait_for_timeout(1200)
    check('ตุ๊กตาหมี' in fr.locator('#view').inner_text(), 'frame: sample prizes in the shop')
    pg.evaluate("document.querySelector('#pfBox iframe').contentWindow.location.hash = '#/admin'"); pg.wait_for_timeout(1000)
    check(pg.evaluate("document.querySelector('#pfBox iframe').contentWindow.location.hash") == '#/', 'frame: adults area sends back to home')
    after = pg.evaluate("localStorage.getItem('ya_preview_db')")
    keys = pg.evaluate("Object.keys(localStorage)")
    check(before == after and 'ya_demo_db' not in keys and not any(k.startswith('ya_c_') and 'leaderboard' in k for k in keys), 'real phone storage untouched by the frame')
    # change log switch
    check(pg.locator('#swClog').count() == 1 and 'on' not in pg.get_attribute('#swClog', 'class'), 'change log switch is there, off')
    pg.click('#swClog'); pg.wait_for_timeout(600)
    check(dbnow(pg)['programs'][0]['look'].get('clogDetail') is True, 'switch on saves look.clogDetail')
    go(pg, '#/admin/about', 1200)
    check(pg.locator('#clogXl').count() == 1, 'super admin keeps the Excel export')
    cx.close()

    # ---- B: normal admin (points + settings): detailed change log only when switched on; Phone preview page
    for on in (False, True):
        cx, pg = ctx(b, seed_db({'clogDetail': True} if on else None, sup=False), 390, 844)
        go(pg, '#/admin', 1200)
        pg.fill('#lf [name=email]', 'kru'); pg.fill('#lf [name=pw]', 'kru12345'); pg.click('#lf button'); pg.wait_for_timeout(1500)
        go(pg, '#/admin/about', 1200)
        if on:
            check(pg.locator('details.upd').count() >= 1 and pg.locator('.area').count() > 0 and pg.locator('#clogXl').count() == 0, 'switch on: admin sees the detailed log, no Excel')
            pg.screenshot(path=S + 'v35_03_about_detail.png')
        else:
            check(pg.locator('.clog-simple').count() >= 1 and pg.locator('.area').count() == 0, 'switch off: admin sees the short log')
            go(pg, '#/admin', 900)
            check(pg.locator('.menu [data-k=phone]').count() == 1, 'admin with Settings sees "Phone preview"')
            go(pg, '#/admin/phone', 4500)
            check('มิน' in frame(pg).locator('#view').inner_text(), 'Phone preview page shows the sample app')
            pg.screenshot(path=S + 'v35_02_phone_page.png')
        cx.close()

    # ---- C: kids on a phone: home shows the tree; other pages open full; pull down shows the tree; the bar toggles back
    cx, pg = ctx(b, seed_db(), 390, 844)
    go(pg, '#/', 2500)
    check(sheet_top(pg) > 180, 'home: tree first (sheet starts low)')   # v40: the tree is 30vh now (sheet ~230 px on a 844 px phone)
    for h in ['#/shop', '#/menu', '#/songs']:
        pg.evaluate(f"location.hash = '{h}'"); pg.wait_for_timeout(1000)
        check(sheet_top(pg) < 120 and pg.locator('main > .sheet > .sheet-grab').is_visible(), f'{h}: opens full with the little bar')
    pg.screenshot(path=S + 'v35_04_songs_full.png')
    pg.evaluate(PULL, 200); pg.wait_for_timeout(600)
    check(pg.evaluate("document.body.classList.contains('tree-peek')") and sheet_top(pg) > 180, 'pull down: the tree shows')
    pg.screenshot(path=S + 'v35_05_peek.png')
    pg.click('main > .sheet > .sheet-grab'); pg.wait_for_timeout(600)
    check(sheet_top(pg) < 120, 'tap the bar: full again')
    pg.evaluate(PULL, 30); pg.wait_for_timeout(500)
    check(sheet_top(pg) < 120, 'a small pull springs back')
    pg.evaluate("location.hash = '#/'"); pg.wait_for_timeout(1000)
    check(sheet_top(pg) > 180 and pg.locator('.sheet-grab').count() == 0, 'back home: tree first, no bar')
    cx.close()
    # PC kids' side and Normal mode: unchanged
    cx, pg = ctx(b, seed_db(), 1300, 900)
    go(pg, '#/shop', 2000)
    check(sheet_top(pg) > 180, 'PC: kids pages unchanged (tree above)')
    cx.close()
    cx, pg = ctx(b, seed_db({'mode': 'normal'}), 390, 844)
    go(pg, '#/shop', 1500)
    check(not pg.locator('.sheet-grab').is_visible(), 'Normal mode: no bar (no tree)')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
