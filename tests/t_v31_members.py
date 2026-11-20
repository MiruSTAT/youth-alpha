# v31 member login: super admin mode chooser, admin "Member accounts" page, kid sign-in page,
# "personal" mode (own details only), lock after 5 wrong passwords, change password, sign out, "all" mode redirect.
# Run against a preview copy (see tests/README.md). Each part runs in its own browser context; the preview
# database is carried from one context to the next through localStorage (ya_preview_db).
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')

def seed_db(login_mode='off'):
    now = '2026-11-16T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now},
                 {'id': '22222222-2222-2222-2222-222222222222', 'nickname': 'Ton', 'avatar': '🐶', 'grp': '', 'active': True, 'created_at': now}],
        'points': [{'id': 'p1', 'kid_id': '11111111-1111-1111-1111-111111111111', 'skill': 'music', 'detail': 'เปียโน', 'amount': 20, 'attendance_id': None, 'created_at': now},
                   {'id': 'p2', 'kid_id': '22222222-2222-2222-2222-222222222222', 'skill': 'english', 'amount': 30, 'attendance_id': None, 'created_at': now}],
        'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True}, 'loggedIn': True,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': {}, 'login_mode': login_mode}],
    }

def ctx(b, db):
    cx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, service_workers='block')
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

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: super admin + admin (mode "off" at the start)
    cx, pg = ctx(b, seed_db('off'))
    go(pg, '#/', 1500)
    check(pg.locator('[data-m=account]').count() == 0 and pg.locator('.rank-hint').count() == 1, 'mode off: old app (tap-your-name hint, no sign-in)')
    go(pg, '#/menu', 1000); check(pg.locator('[data-m=account]').count() == 0, 'mode off: no sign-in row in the menu')
    go(pg, '#/login', 1000); check(pg.evaluate('location.hash') == '#/', 'mode off: #/login goes home')
    go(pg, '#/admin', 1500)
    check(pg.locator('.menu [data-k=members]').count() == 1, 'admin home has "Member accounts"')
    go(pg, '#/admin/members', 1500); pg.screenshot(path=S + 'v31_01_members_empty.png', full_page=True)
    check('ปิด' in pg.inner_text('#view'), 'members page shows mode off')
    def add(u, name, kid, pw):
        pg.click('#memAdd'); pg.wait_for_timeout(300)
        pg.fill('#dlgForm [name=username]', u); pg.fill('#dlgForm [name=display_name]', name)
        if kid: pg.select_option('#dlgForm [name=kid_id]', label=kid)
        pg.fill('#dlgForm [name=password]', pw); pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(600)
    add('Mai', 'น้องใหม่', 'Mai', 'abcd'); add('ton', 'น้องต้น', 'Ton', '1234')
    check(pg.locator('.mem-li').count() == 2, 'two accounts added (username saved lower-case: %s)' % pg.inner_text('.mem-li >> nth=0').split('\n')[1][:14])
    add('mai', 'dup', None, 'zzzz'); check('มีแล้ว' in pg.inner_text('#toast'), 'duplicate username refused with a message')
    pg.screenshot(path=S + 'v31_02_members_list.png', full_page=True)
    # switch off shows a named warning; cancel keeps it on
    pg.click('.mem-li >> nth=1'); pg.wait_for_timeout(300); pg.click('#dlgForm button[value=toggle]'); pg.wait_for_timeout(400)
    warn = pg.inner_text('#dlgForm'); check('น้องต้น' in warn, 'switch-off warning names the account'); pg.screenshot(path=S + 'v31_03_off_warning.png')
    pg.click('#dlgForm button[value=cancel]'); pg.wait_for_timeout(500)
    check('ปิดอยู่' not in pg.inner_text('.mem-li >> nth=1'), 'cancel keeps the account on')
    go(pg, '#/admin/members', 1800); pg.evaluate("document.querySelector('#loginCard').scrollIntoView()")  # v32: the mode chooser is on the members page; pg.screenshot(path=S + 'v31_04_super_login.png')
    check(pg.locator('#loginCard input[name=lm]').count() == 3 and pg.is_disabled('#lmSave'), 'super admin: 3 modes, save disabled until changed')
    check('บัญชีในโปรแกรมนี้: 2' in pg.inner_text('#loginCard'), 'super admin card shows the account count')
    pg.check('#loginCard input[value=personal]'); pg.click('#lmSave'); pg.wait_for_timeout(600)
    db = json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))
    check(db['programs'][0]['login_mode'] == 'personal', 'mode saved as personal')
    log = [a for a in db['audit'] if a['table_name'] == 'members']
    check(len(log) == 2 and all('pw' not in (a['new_data'] or {}) or a['new_data']['pw'] is None for a in log), 'account changes are in the admin log without passwords')
    cx.close()

    # ---- B: kid in "personal" mode
    db['loggedIn'] = False; db['sa']['asSuper'] = False
    cx, pg = ctx(b, db)
    go(pg, '#/', 1800); pg.screenshot(path=S + 'v31_10_personal_home.png')
    check(pg.locator('.mem-hint').count() == 1, 'personal, not signed in: "sign in" hint instead of "tap your name"')
    pg.click('.rank-row[data-id^="2222"]'); pg.wait_for_timeout(500)
    check(pg.locator('#kidSheet .mem-note').count() == 1 and pg.locator('#thisMe').count() == 0, 'other kid: note instead of categories, no "this is me"')
    pg.screenshot(path=S + 'v31_11_other_kid.png')
    go(pg, '#/login', 1200); pg.screenshot(path=S + 'v31_12_login.png')
    check(pg.locator('.kid-nav').is_visible(), 'personal: tabs still shown on the sign-in page')
    pg.click('#mlGo'); pg.wait_for_timeout(200); check('ครบ' in pg.inner_text('#mlMsg'), 'empty form: message on the page')
    for i in range(5):
        pg.fill('#mlf [name=u]', 'ton'); pg.fill('#mlf [name=pw]', 'nope'); pg.click('#mlGo'); pg.wait_for_timeout(250)
    check('ไม่ถูก' in pg.inner_text('#mlMsg'), 'wrong password: message on the page, no pop-up')
    pg.fill('#mlf [name=u]', 'ton'); pg.fill('#mlf [name=pw]', '1234'); pg.click('#mlGo'); pg.wait_for_timeout(300)
    check('15 นาที' in pg.inner_text('#mlMsg'), 'after 5 wrong tries: locked 15 minutes (%s)' % pg.inner_text('#mlMsg'))
    pg.screenshot(path=S + 'v31_13_locked.png')
    pg.fill('#mlf [name=u]', ' MAI '); pg.fill('#mlf [name=pw]', 'abcd'); pg.click('#mlGo'); pg.wait_for_timeout(1500)
    check(pg.evaluate('location.hash') == '#/' and pg.locator('#myCard').count() == 1, 'sign in (username trimmed + lower-cased) → home with my card')
    check('Mai' in pg.inner_text('#myCard'), 'my card is the linked kid')
    pg.screenshot(path=S + 'v31_14_signed_home.png')
    pg.click('#myCard'); pg.wait_for_timeout(500)
    check(pg.locator('#kidSheet .skill-row').count() > 0 and pg.locator('#notMe').count() == 0, 'own details shown, no "not me" button')
    pg.click('#kidSheet .x'); pg.wait_for_timeout(400)
    pg.click('.rank-row[data-id^="2222"]'); pg.wait_for_timeout(500); check(pg.locator('#kidSheet .mem-note').count() == 1, 'still no details for another kid')
    ev = json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))
    go(pg, '#/menu', 1200); check('น้องใหม่' in pg.inner_text('[data-m=account]'), 'menu: "signed in as" row')
    pg.screenshot(path=S + 'v31_15_menu.png')
    pg.click('[data-m=account]'); pg.wait_for_timeout(500); pg.click('#kidSheet .k-pw summary'); pg.wait_for_timeout(200)
    pg.fill('#mpf [name=o]', 'xxxx'); pg.fill('#mpf [name=n]', 'wxyz'); pg.fill('#mpf [name=a]', 'wxyz'); pg.click('#mpGo'); pg.wait_for_timeout(500)
    check('ไม่ถูก' in pg.inner_text('#mpMsg'), 'change password: wrong old password message')
    pg.fill('#mpf [name=o]', 'abcd'); pg.fill('#mpf [name=n]', 'wxyz'); pg.fill('#mpf [name=a]', 'wxy'); pg.click('#mpGo'); pg.wait_for_timeout(200)
    check('ไม่ตรง' in pg.inner_text('#mpMsg'), 'change password: the two new ones must match')
    pg.fill('#mpf [name=a]', 'wxyz'); pg.click('#mpGo'); pg.wait_for_timeout(600)
    check('เปลี่ยนรหัสผ่านแล้ว' in pg.inner_text('#mpMsg'), 'password changed')
    pg.screenshot(path=S + 'v31_16_account_sheet.png')
    pg.click('#mOut'); pg.wait_for_timeout(1500)
    check(pg.evaluate('location.hash') == '#/' and pg.locator('#myCard').count() == 0 and pg.locator('.mem-hint').count() == 1, 'sign out → home without my card')
    check(pg.evaluate("localStorage.getItem('ya_member')") is None and pg.evaluate("localStorage.getItem('ya_me')") is None, 'token and "me" removed from the phone')
    go(pg, '#/login', 1000); pg.fill('#mlf [name=u]', 'mai'); pg.fill('#mlf [name=pw]', 'abcd'); pg.click('#mlGo'); pg.wait_for_timeout(500)
    check('ไม่ถูก' in pg.inner_text('#mlMsg'), 'old password no longer works')
    pg.reload(); pg.wait_for_timeout(1200)                     # leaving the page sends the queued kid events (pagehide)
    db = json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))
    names = [e['event'] for e in db['events']]
    check(all(x in names for x in ['member_login', 'member_pw', 'member_logout']), 'kid activity log has sign-in / password / sign-out events')
    cx.close()

    # ---- C: "all" mode
    db['programs'][0]['login_mode'] = 'all'
    cx, pg = ctx(b, db)
    for h in ['#/', '#/shop', '#/songs', '#/menu']:
        go(pg, h, 1300); check(pg.evaluate('location.hash') == '#/login', 'all mode, not signed in: %s → #/login' % h)
    check(not pg.locator('.kid-nav').is_visible() and pg.locator('a[href="#/admin"]').count() == 1, 'all mode: no tabs on the sign-in page, adults link shown')
    pg.screenshot(path=S + 'v31_20_all_login.png')
    pg.fill('#mlf [name=u]', 'mai'); pg.fill('#mlf [name=pw]', 'wxyz'); pg.click('#mlGo'); pg.wait_for_timeout(1500)
    check(pg.evaluate('location.hash') == '#/' and pg.locator('.rank-row').count() == 2, 'all mode: signed in → ranking shows')
    pg.click('.rank-row[data-id^="2222"]'); pg.wait_for_timeout(500)
    check(pg.locator('#kidSheet .skill-row').count() > 0, 'all mode: signed-in kid can see details of others')
    go(pg, '#/shop', 1200); check(pg.evaluate('location.hash') == '#/shop', 'all mode: shop opens when signed in')
    go(pg, '#/', 1500); pg.reload(); pg.wait_for_timeout(1500); check(pg.locator('#myCard').count() == 1, 'sign-in kept after reload')
    # an admin switches the account off: its session ends at once
    go(pg, '#/admin', 1000); pg.fill('#lf [name=email]', 'admin'); pg.fill('#lf [name=pw]', 'preview1'); pg.click('#lf button'); pg.wait_for_timeout(1500)
    go(pg, '#/admin/members', 1300); pg.click('.mem-li >> nth=0'); pg.wait_for_timeout(300); pg.click('#dlgForm button[value=toggle]'); pg.wait_for_timeout(300)
    pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(700)
    check('ปิดอยู่' in pg.inner_text('.mem-li >> nth=0'), 'account switched off after the warning')
    pg.screenshot(path=S + 'v31_21_switched_off.png', full_page=True)
    go(pg, '#/admin', 1000); pg.click('#logout'); pg.wait_for_timeout(800)
    go(pg, '#/', 300); pg.reload(); pg.wait_for_timeout(1800)          # the kid opens the app again
    check(pg.evaluate('location.hash') == '#/login', 'switched-off account is signed out on the phone')
    cx.close()
    b.close()
print('\n'.join(errs) or 'no errors')
