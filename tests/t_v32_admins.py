# v32: admins per program with permissions (super admin page "Admins & permissions"), merged admin panel
# (super admin badge + group, no separate super admin page), program picker for the super admin only,
# "Copy user link", simple change log for admins, logs for the super admin only, "who is online".
# Run against a preview copy (see tests/README.md). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
ALL = ['points', 'kids', 'songs', 'shop', 'feedback', 'notice', 'settings']

def seed_db():
    now = '2026-11-16T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True}, 'loggedIn': True,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': {}, 'login_mode': 'off'},
                     {'id': 3, 'slug': 'testing-new-program', 'name': 'Testing new program', 'archived': False, 'look': {}, 'login_mode': 'off'}],
        'admins': [{'user_id': 'u-new', 'username': 'newbie', 'name': '', 'pw': 'newbie1', 'active': False, 'pending': True, 'access': {}},
                   {'user_id': 'u-kru', 'username': 'kru', 'name': 'ครูแอน', 'pw': 'kru12345', 'active': True, 'pending': False, 'access': {'1': ['points']}}],
        'events': [{'id': 1, 'created_at': '2099-01-01T00:00:00Z', 'device_id': 'dev123456', 'event': 'song_open', 'detail': 'Jingle Bells', 'path': ''}],
    }

def ctx(b, db, w=390, h=844):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=w < 600, has_touch=True, service_workers='block')
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % json.dumps(json.dumps(db)))
    cx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#tour{display:none!important}';document.head.append(s)})")
    cx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=U.rstrip('/'))
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
def menu_keys(pg): return pg.eval_on_selector_all('.menu [data-k]', 'els => els.map(e => e.dataset.k)')
def dbnow(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: the super admin
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin', 1800); pg.screenshot(path=S + 'v32_01_super_home.png', full_page=True)
    keys = menu_keys(pg)
    check('ผู้ดูแลสูงสุด' in pg.inner_text('#saBadge') and 'Miruku' in pg.inner_text('#saBadge'), 'super admin badge with the username')
    check(all(k in keys for k in ['admins', 'programs', 'look', 'online', 'ai']), 'super admin group: admins, programs, look, online, AI')
    check(all(k in keys for k in ['attendance', 'points', 'kids', 'members', 'songs', 'shop', 'pcats', 'feedback', 'musicset', 'settings', 'export', 'about']), 'super admin also has every admin page')
    check(pg.locator('#progSel').count() == 1, 'program picker shown for the super admin')
    settings_grp = pg.eval_on_selector_all('h2.grp', 'els => els.map(e => e.textContent)')
    check('ตั้งค่า' in settings_grp, 'a "Settings" group (shop, categories, feedback, music, settings)')
    pg.click('#copyLink'); pg.wait_for_timeout(400)
    check('คัดลอกลิงก์ผู้ใช้แล้ว' in pg.inner_text('#toast') and pg.evaluate('navigator.clipboard.readText()') == U, 'copy user link (kids link of this program)')
    go(pg, '#/admin/super', 1500); check(pg.evaluate('location.hash') == '#/admin', 'old super admin page link opens the admin panel')
    go(pg, '#/admin/admins', 1500); pg.screenshot(path=S + 'v32_02_admins.png', full_page=True)
    t = pg.inner_text('#view')
    check('รออนุมัติ (1)' in t and 'newbie' in t, 'waiting account listed')
    check('ครูแอน' in t and 'Youth Alpha Christmas 2026 (1/7)' in t, 'admin listed with program + permission count')
    # new admin: too short a password first
    pg.click('#admNew'); pg.wait_for_timeout(300)
    pg.fill('#dlgForm [name=u]', 'Staff1'); pg.fill('#dlgForm [name=n]', 'พี่บี'); pg.fill('#dlgForm [name=p]', 'abcdef'); pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(900)
    check(pg.evaluate('location.hash').startswith('#/admin/admins/'), 'new admin created → its permission page')
    pg.screenshot(path=S + 'v32_03_admin_edit.png', full_page=True)
    check(pg.locator('.perm-card').count() == 2 and pg.locator('.perm-card input:checked').count() == 0, 'two programs, nothing ticked yet')
    pg.click('[data-all="1"]'); pg.check('[name=p_3_songs]')
    pg.click('#admForm [type=submit]'); pg.wait_for_timeout(800)
    a = [x for x in dbnow(pg)['admins'] if x['username'] == 'staff1'][0]
    check(a['access'].get('1') == ALL and a['access'].get('3') == ['songs'], 'saved: all on program 1, songs on program 3')
    check(pg.evaluate('location.hash') == '#/admin/admins' and 'ทุกสิทธิ์' in pg.inner_text('#view'), 'list shows "all permissions"')
    # approve the waiting account
    pg.click('a.adm-li[href$="u-new"]'); pg.wait_for_timeout(900)
    check('รออนุมัติ' in pg.inner_text('#view') and 'อนุมัติและบันทึก' in pg.inner_text('#admForm'), 'waiting account page: approve and save')
    pg.check('[name=p_3_points]'); pg.click('#admForm [type=submit]'); pg.wait_for_timeout(800)
    a = [x for x in dbnow(pg)['admins'] if x['username'] == 'newbie'][0]
    check(not a['pending'] and a['active'] and a['access'] == {'3': ['points']}, 'approved with points on program 3 only')
    # switch an admin off: named warning
    pg.click('a.adm-li[href$="u-kru"]'); pg.wait_for_timeout(900)
    pg.click('#admOn'); pg.click('#admForm [type=submit]'); pg.wait_for_timeout(500)
    check('ครูแอน' in pg.inner_text('#dlgForm'), 'switch-off warning names the admin'); pg.screenshot(path=S + 'v32_04_off_warn.png')
    pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(800)
    check('ปิดอยู่' in pg.inner_text('#view'), 'admin shown as switched off')
    # new password for an app login
    pg.click('a.adm-li[href$="u-kru"]'); pg.wait_for_timeout(900)
    pg.fill('#admPw [name=p]', 'newpass1'); pg.click('#admPw button'); pg.wait_for_timeout(500)
    check([x for x in dbnow(pg)['admins'] if x['username'] == 'kru'][0]['pw'] == 'newpass1', 'new password set')
    # the other super admin pages
    go(pg, '#/admin/programs', 1500); check(pg.locator('.prog-row').count() == 2, 'programs page lists the programs')
    go(pg, '#/admin/look', 1500); pg.screenshot(path=S + 'v32_05_look.png')
    check(pg.locator('#lookCard form').count() == 1 and pg.locator('#layCard').count() == 1 and pg.locator('#swInstall').count() == 1, 'look page: install switch, settings, layout')
    pg.fill('#lookForm [name=title]', 'Easter Kids'); pg.click('#lookForm [type=submit]'); pg.wait_for_timeout(600)
    check(dbnow(pg)['programs'][0]['look'].get('title') == 'Easter Kids', 'look page: program settings still save')
    go(pg, '#/admin/programs', 1200); pg.click('#progNew'); pg.wait_for_timeout(300)
    pg.fill('#dlgForm [name=name]', 'Easter 2027'); pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(800)
    check(len(dbnow(pg)['programs']) == 3, 'programs page: a new program can still be created')
    go(pg, '#/admin/ai', 2000); check(pg.locator('#hoCopy').count() == 1, 'details for AI page')
    go(pg, '#/admin/members', 1500); check(pg.locator('#loginCard input[name=lm]').count() == 3, 'member login mode chooser on the members page')
    go(pg, '#/admin/export', 1500); check(pg.locator('[data-x=xs_adminlog]').count() == 1 and pg.locator('#clearKid').count() == 1, 'super admin sees the logs and the clear button')
    go(pg, '#/admin/about', 1500); check(pg.locator('#clogXl').count() == 1 and pg.locator('details.upd').count() > 1, 'super admin: full change log with Excel')
    go(pg, '#/admin/online', 1800); pg.screenshot(path=S + 'v32_06_online.png')
    check('Miruku' in pg.inner_text('#onList'), 'who is online: the super admin is listed')
    db = dbnow(pg)
    check(any(x['table_name'] == 'staff' for x in db['audit']), 'admin changes are in the admin log')
    pg.click('.page-head .back'); pg.wait_for_timeout(500)
    cx.close()

    # ---- B: an admin with "points" on program 1 only (signs in through the normal form)
    db['loggedIn'] = False; db['sa']['asSuper'] = False; db['sa']['unlocked'] = False
    for x in db['admins']:
        if x['username'] == 'kru': x.update(active=True, access={'1': ['points']}, pw='kru12345')
    cx, pg = ctx(b, db)
    go(pg, '#/admin', 1200)
    pg.fill('#lf [name=email]', 'kru'); pg.fill('#lf [name=pw]', 'kru12345'); pg.click('#lf button'); pg.wait_for_timeout(1500)
    pg.screenshot(path=S + 'v32_10_points_admin.png', full_page=True)
    keys = menu_keys(pg)
    check(sorted(keys) == sorted(['attendance', 'points', 'weekly', 'export', 'about']), 'points-only admin sees only: ' + ','.join(keys))
    check(pg.locator('#saBadge').count() == 0 and pg.locator('#progSel').count() == 0, 'no super admin badge, no program picker')
    check(pg.locator('#copyLink').count() == 1, 'copy user link for admins too')
    for page in ['shop', 'kids', 'songs', 'admins', 'settings', 'members', 'online']:
        go(pg, '#/admin/' + page, 900)
        if pg.locator('.menu [data-k=attendance]').count() != 1: check(False, f'#/admin/{page} blocked'); break
    else: check(True, 'pages without permission open the admin home instead')
    go(pg, '#/admin/export', 1200)
    check(pg.locator('[data-x=xs_adminlog]').count() == 0 and pg.locator('[data-x=xs_feedback]').count() == 0 and pg.locator('#clearKid').count() == 0, 'export: no logs, no feedback, no clear button')
    check(pg.locator('[data-x=xs_points]').count() == 1, 'export: points still there')
    go(pg, '#/admin/about', 1200); pg.screenshot(path=S + 'v32_11_about_simple.png', full_page=True)
    check(pg.locator('#clogXl').count() == 0 and pg.locator('.clog-simple').count() >= 1 and pg.locator('.area').count() == 0, 'simple change log, no Excel, no tags')
    go(pg, '#/admin/weekly', 1500); check('Jingle Bells' in pg.inner_text('#view'), 'weekly summary: most opened songs from the counts')
    go(pg, '?p=testing-new-program#/admin', 1800); pg.screenshot(path=S + 'v32_12_other_program.png')
    t = pg.inner_text('#view')
    check('Testing new program' in t and 'Youth Alpha Christmas 2026' in t and pg.locator('.menu [data-k]').count() == 0, 'other program: no access, link to own program')
    cx.close()

    # ---- C: switched-off account
    db = json.loads(json.dumps(db))
    for x in db['admins']:
        if x['username'] == 'kru': x.update(active=False)
    cx, pg = ctx(b, db)
    go(pg, '#/admin', 1200)
    if pg.locator('#lf').count():
        pg.fill('#lf [name=email]', 'kru'); pg.fill('#lf [name=pw]', 'kru12345'); pg.click('#lf button'); pg.wait_for_timeout(1300)
    check('ถูกปิด' in pg.inner_text('#view') and pg.locator('.menu [data-k]').count() == 0, 'switched-off account: message, no menu')
    cx.close()

    # ---- D: wide screen still fine (admin home of the super admin)
    db['loggedIn'] = True; db['sa']['asSuper'] = True; db['sa']['unlocked'] = True
    cx, pg = ctx(b, db, 1280, 900)
    go(pg, '#/admin', 1500); pg.screenshot(path=S + 'v32_20_wide.png')
    check(pg.locator('#saBadge').count() == 1, 'wide screen: admin home loads')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
