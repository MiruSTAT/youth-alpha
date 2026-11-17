# v37 (roadmap step 7): simpler admin panel (program picker in the side menu / top line, tabs inside one menu item,
# one sign-out) and maintenance mode per program. Run against a preview copy (tools/preview.sh t_v37_maint). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')

def seed_db(look=None, sup=True, sw=False, maint=None, who=None):
    now = '2026-11-17T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True, 'show_visits': sw, 'show_fb_count': sw}, 'loggedIn': sup or bool(who), 'who': who,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': sup, 'unlocked': sup, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off', 'maintenance': maint or {}},
                     {'id': 2, 'slug': 'easter-2027', 'name': 'Easter 2027', 'archived': False, 'look': {}, 'login_mode': 'off'}],
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
    # ---- 1. super admin, phone: one slim top line, tiles, no big badge card, tabs
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin', 1800)
    check(pg.locator('#saBadge').count() == 0, 'phone: no big super admin card')
    check(pg.locator('#admTop #progSel').count() == 1 and 'ผู้ดูแลสูงสุด' in pg.inner_text('#admTop'), 'phone: program picker + super admin in one top line')
    check(pg.locator('.prog-bar').count() == 0, 'phone: old program card is gone')
    keys = pg.eval_on_selector_all('.menu [data-k]', 'els => els.map(e => e.dataset.k)')
    check(not any(k in keys for k in ['online', 'ai', 'pcats', 'musicset']) and 'admins' in keys and 'settings' in keys, 'menu: online/ai/pcats/musicset folded into their parents %s' % keys)
    check(pg.locator('.menu.grouped .mt > span:not(.need)').first.is_hidden(), 'phone: tiles without the description line')
    check(pg.locator('#logout').count() == 1 and pg.locator('#saLock').count() == 0, 'one sign-out button')
    pg.screenshot(path=S + 'v37_home_phone.png')
    go(pg, '#/admin/admins', 1500)
    check([x.strip() for x in pg.locator('.subtabs a').all_inner_texts()] == ['ผู้ดูแล', 'ออนไลน์ตอนนี้'], 'admins page: tabs Admins | Online now')
    pg.click('.subtabs a[data-k="online"]'); pg.wait_for_timeout(1500)
    check(pg.locator('#onList').count() == 1 and pg.locator('.subtabs a.on').inner_text().strip() == 'ออนไลน์ตอนนี้', 'online tab opens who is online')
    go(pg, '#/admin/settings', 1500)
    check(len(pg.locator('.subtabs a').all()) == 4, 'settings: tabs General | Point categories | Music | Phone preview (v38)')
    pg.click('.subtabs a[data-k="musicset"]'); pg.wait_for_timeout(1200)
    check(pg.locator('#swSimple').count() == 1, 'music tab opens music settings')
    go(pg, '#/admin/about', 1500)
    check(pg.locator('.subtabs a[data-k="ai"]').count() == 1, 'about: super admin has the Details for AI tab')
    # sign out = one button with the super admin warning
    go(pg, '#/admin', 1500); pg.click('#logout'); pg.wait_for_timeout(400)
    check('Miruku' in pg.inner_text('#dlgForm'), 'sign out warns about the super admin sign-out')
    pg.click('#dlgForm button[value="cancel"]'); pg.wait_for_timeout(300)
    cx.close()
    # ---- 2. super admin, PC: picker at the top of the side menu, top line hidden
    cx, pg = ctx(b, seed_db(), 1400, 900)
    go(pg, '#/admin', 1800)
    check(pg.locator('#adminSide #sideProg').is_visible() and not pg.locator('#admTop').is_visible(), 'PC: program picker in the side menu, no top line')
    check(pg.locator('#adminSide [data-k="online"]').count() == 0, 'PC side menu: no separate Who is online')
    pg.screenshot(path=S + 'v37_home_pc.png')
    # ---- 3. start maintenance from the Programs page
    go(pg, '#/admin/programs', 1500)
    pg.click('[data-maint="1"]'); pg.wait_for_timeout(400)
    pg.click('#dlgForm label:has(input[value="bunny"])'); pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(500)
    check('Youth Alpha Christmas 2026' in pg.inner_text('#dlgForm'), 'start maintenance: warning names the program')
    pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(1200)
    d = dbnow(pg); m = d['programs'][0].get('maintenance') or {}
    check(m.get('on') is True and m.get('scene') == 'bunny', 'maintenance saved on, bunny scene %s' % m)
    go(pg, '#/admin', 1500)
    check(pg.locator('#maintBar').is_visible() and not pg.evaluate("document.body.classList.contains('maint')"), 'super admin: full access + thin maintenance bar')
    go(pg, '#/', 1800)
    check(pg.locator('#maintBar').is_visible() and pg.locator('.rank-row, #kidNav a').count() > 0, "super admin on the kids' side: normal app + bar")
    cx.close()
    # ---- 4. a kid during maintenance: only the scene
    cx, pg = ctx(b, seed_db(sup=False, maint={'on': True, 'scene': 'tree'}))
    go(pg, '#/', 2200)
    check(pg.evaluate("document.body.classList.contains('maint')") and pg.locator('.maint-scene.tree').count() == 1, 'kid: maintenance scene (tree)')
    check(not pg.locator('#kidNav').is_visible() and pg.locator('.rank-row').count() == 0, 'kid: no tabs, no ranking')
    check('ปิดปรับปรุงชั่วคราว' in pg.inner_text('.maint-scene'), 'kid: "Under maintenance" text')
    check(pg.locator('#mtColour, #mtSound').count() == 0, 'kid: no colour / sound buttons (removed in v38)')
    pg.screenshot(path=S + 'v37_maint_tree.png')
    go(pg, '#/shop', 1500)
    check(pg.locator('.maint-scene').count() == 1, 'kid: every page shows the scene')
    cx.close()
    # ---- 5. a normal admin during maintenance: only the scene
    cx, pg = ctx(b, seed_db(sup=False, who='u-kru', maint={'on': True, 'scene': 'bunny'}))
    go(pg, '#/admin', 2000)
    check(pg.locator('.maint-scene.bunny').count() == 1 and not pg.locator('#adminSide').is_visible(), 'normal admin: bunny scene, no panels')
    pg.screenshot(path=S + 'v37_maint_bunny.png')
    go(pg, '#/admin/points', 1500)
    check(pg.locator('.maint-scene').count() == 1, 'normal admin: admin pages show the scene too')
    cx.close()
    # ---- 6. normal admin, maintenance off: no picker, no super tabs
    cx, pg = ctx(b, seed_db(sup=False, who='u-kru'))
    go(pg, '#/admin', 1800)
    check(pg.locator('#progSel').count() == 0 and 'Youth Alpha Christmas 2026' in pg.inner_text('#admTop'), 'normal admin: program name, no picker')
    go(pg, '#/admin/about', 1500)
    check(pg.locator('.subtabs').count() == 0, 'normal admin: no AI tab on Version & changes')
    go(pg, '#/admin/settings', 1500)
    check(len(pg.locator('.subtabs a').all()) == 4, 'normal admin with settings: the four settings tabs (v38: + Phone preview)')
    cx.close()
    b.close()
print('ERRORS:', errs[:12] if errs else 'no errors')
