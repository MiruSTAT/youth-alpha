# v33: Kids mode / Normal mode per program (super admin, Look page) + PC side menu for the admin area.
# Run against a preview copy (tools/preview.sh t_v33_modes). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os, re
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-➿]')

def seed_db(look=None):
    now = '2026-11-16T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True}, 'loggedIn': True,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
        'admins': [{'user_id': 'u-kru', 'username': 'kru', 'name': 'ครูแอน', 'pw': 'kru12345', 'active': True, 'pending': False, 'access': {'1': ['points']}}],
        'events': [],
    }

def ctx(b, db, w=390, h=844):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1 if w >= 1000 else 2, is_mobile=w < 600, has_touch=True, service_workers='block')
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % json.dumps(json.dumps(db)))
    cx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#tour{display:none!important}';document.head.append(s)})")
    pg = cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V + 'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    return cx, pg

def go(pg, h, w=1300): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)
def dbnow(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))
def mode(pg): return pg.evaluate('document.body.dataset.mode')
def side_on(pg): return pg.evaluate("getComputedStyle(document.querySelector('#adminSide')).display") != 'none'

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: Kids mode stays exactly as before (default for every program)
    cx, pg = ctx(b, seed_db())
    go(pg, '#/')
    check(mode(pg) == 'kids', 'a program with no mode set is in Kids mode')
    nav = pg.inner_text('#kidNav')
    check('🏆' in nav and pg.locator('#kidNav svg.ico').count() == 0, 'Kids mode: emoji tabs, no line icons')
    go(pg, '#/menu', 900)
    check(pg.locator('.mrow .mi svg').count() == 0, 'Kids mode: kid menu keeps its emoji')
    cx.close()

    # ---- B: super admin on a PC: side menu, wide content, switch the program to Normal mode
    db = seed_db()
    cx, pg = ctx(b, db, 1366, 820)
    go(pg, '#/admin', 1800); pg.screenshot(path=S + 'v33_01_pc_home_kids.png')
    check(side_on(pg), 'PC: side menu is shown in the admin area')
    side = pg.eval_on_selector_all('#adminSide [data-k]', 'els => els.map(e => e.dataset.k)')
    check(all(k in side for k in ['home', 'admins', 'programs', 'attendance', 'points', 'kids', 'songs', 'settings', 'export']), 'PC: side menu lists the super admin and admin pages')
    check(pg.locator('#adminSide .side-link.on[data-k="home"]').count() == 1, 'PC: "admin home" lit in the side menu')
    left = pg.evaluate("document.querySelector('main').getBoundingClientRect().left")
    width = pg.evaluate("document.querySelector('main').getBoundingClientRect().width")
    check(left >= 256 and width > 700, f'PC: content starts right of the side menu and is wide (left {left:.0f}, width {width:.0f})')
    cols = pg.evaluate("getComputedStyle(document.querySelector('.menu.grouped')).gridTemplateColumns.split(' ').length")
    check(cols >= 2, 'PC: admin home menu in two columns')
    pg.click('#adminSide [data-k="points"]'); pg.wait_for_timeout(1000)
    check(pg.evaluate('location.hash') == '#/admin/points' and pg.locator('#adminSide .side-link.on[data-k="points"]').count() == 1, 'PC: side menu opens a page and lights it')
    go(pg, '#/admin/look', 1300)   # v38: Look is a tab of Programs
    check(pg.locator('#lookForm [name=mode]').count() == 1, 'Look page has the app style (mode) choice')
    pg.select_option('#lookForm [name=mode]', 'normal')
    check(all(pg.input_value(f'#lookForm [name=p_{k}]') == 'off' for k in ['scene', 'fall', 'friend', 'special', 'music']), 'choosing Normal mode switches the playful parts off')
    pg.click('#lookForm [type=submit]'); pg.wait_for_timeout(800)
    check(dbnow(pg)['programs'][0]['look'].get('mode') == 'normal', 'Normal mode saved in programs.look.mode')
    check(mode(pg) == 'normal', 'Normal mode applied at once')
    check(pg.locator('#adminSide .mi svg.ico').count() >= 10, 'Normal mode: side menu uses line icons')
    go(pg, '#/admin', 1500); pg.screenshot(path=S + 'v33_02_pc_home_normal.png')
    heads = pg.eval_on_selector_all('h2.grp', 'els => els.map(e => e.textContent)')
    check(not any(EMOJI.match(h.strip()[:1] or 'x') for h in heads), 'Normal mode: no emoji in front of the group titles')
    check(pg.locator('.menu .mi svg.ico').count() >= 10, 'Normal mode: admin home menu uses line icons')
    cx.close()

    # ---- C: phone in Normal mode: kids' side calm, avatars untouched; admin home without side menu
    db = seed_db({'mode': 'normal', 'off': {'tree': True, 'snow': True, 'santa': True, 'festive': True, 'music': True}})
    cx, pg = ctx(b, db)
    go(pg, '#/', 1800); pg.screenshot(path=S + 'v33_03_phone_kids_normal.png')
    check(mode(pg) == 'normal', 'phone: Normal mode on the kids side')
    check(pg.locator('#kidNav svg.ico').count() == 4 and not EMOJI.search(pg.inner_text('#kidNav')), 'phone: tabs use line icons, no emoji')
    check(pg.locator('#view .ini').count() > 0 and '🐱' not in pg.inner_text('#view'), 'phone: initials instead of the animal avatar (v41)')
    check(not pg.is_visible('#themeBtn') and not pg.is_visible('.brand-tree'), 'phone: no colour-theme button or brand emoji')
    go(pg, '#/menu', 900)
    check(pg.locator('.mrow .mi svg.ico').count() >= 4, 'phone: kid menu rows use line icons')
    go(pg, '#/admin', 1500); pg.screenshot(path=S + 'v33_04_phone_admin_normal.png', full_page=True)
    check(not side_on(pg), 'phone: no side menu (admin home menu as before)')
    check(pg.locator('.menu .mi svg.ico').count() >= 10, 'phone: admin menu uses line icons')
    cx.close()

    # ---- D: normal admin with only "points" on a PC: side menu shows only what they may open
    db = seed_db(); db['loggedIn'] = False; db['sa']['asSuper'] = False; db['sa']['unlocked'] = False
    cx, pg = ctx(b, db, 1366, 820)
    go(pg, '#/admin', 1200)
    check(not side_on(pg), 'PC: no side menu on the sign-in page')
    pg.fill('#lf [name=email]', 'kru'); pg.fill('#lf [name=pw]', 'kru12345'); pg.click('#lf button'); pg.wait_for_timeout(1500)
    side = pg.eval_on_selector_all('#adminSide [data-k]', 'els => els.map(e => e.dataset.k)')
    check(side_on(pg) and 'points' in side and not any(k in side for k in ['admins', 'look', 'kids', 'songs', 'settings']), 'PC: points-only admin sees only allowed pages in the side menu')
    check(pg.locator('.side-super').count() == 0, 'PC: no super admin badge for a normal admin')
    go(pg, '#/', 1200)
    check(not side_on(pg) and pg.evaluate("getComputedStyle(document.querySelector('main')).maxWidth") == '520px', 'PC: kids side unchanged (no side menu, phone-width column)')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
