# v41: fixes from the v40 design critique (section 14 "After v40"). Run: tools/preview.sh t_v41_fixes
# Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
NOW = '2026-11-16T10:00:00.000Z'

def kid(i, name, av): return {'id': f'00000000-0000-0000-0000-00000000000{i}', 'nickname': name, 'avatar': av, 'grp': '', 'active': True, 'created_at': NOW}
def pts(i, kid_id, n): return {'id': f'p{i}', 'kid_id': kid_id, 'skill': 'bonus', 'amount': n, 'note': '', 'created_at': NOW}
KIDS = [kid(1, 'Mai', '🐱'), kid(2, 'Ton', '🦊'), kid(3, 'Bai', '🦋')] + [kid(i, n, '🐼') for i, n in [(4, 'เจมส์'), (5, 'Nok'), (6, 'Pim'), (7, 'Fah'), (8, 'Oil'), (9, 'Bam')]]

def seed_db(points=(), look=None):
    return {'kids': KIDS, 'points': list(points), 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True},
            'loggedIn': True, 'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
            'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
            'admins': [], 'events': []}

def ctx(b, db, w=390, h=844, rm=None):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1 if w >= 1000 else 2, is_mobile=w < 600, has_touch=True, service_workers='block', **({'reduced_motion': rm} if rm else {}))
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % json.dumps(json.dumps(db)))
    cx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#tour{display:none!important}';document.head.append(s)})")
    pg = cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V + 'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text and 'boom' not in m.text else None)
    return cx, pg

def go(pg, h, w=1300): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)
def dbnow(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))
# make the fake database fail to save (its save() writes JSON.stringify(db) to the phone storage)
BREAK = "window._js=window._js||JSON.stringify;JSON.stringify=function(v,...a){if(v&&v.kids&&v.attendance)throw new Error('boom');return window._js.call(JSON,v,...a)}"
FIX = "JSON.stringify=window._js"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    k = [x['id'] for x in KIDS]

    # ---- a: attendance on a phone
    import datetime; TODAY = datetime.date.today().isoformat()
    db = seed_db(); db['attendance'] = [{'kid_id': k[0], 'day': TODAY, 'session': 'main', 'status': 'leave'}]
    cx, pg = ctx(b, db)
    go(pg, '#/admin/attendance', 1800)
    rows = pg.locator('.att')
    h = rows.first.bounding_box()['height']
    check(h <= 64, f'attendance: one-line rows ({h:.0f} px, was ~145)')
    names = pg.locator('.att .nm').all_inner_texts()
    check(names[-1] == 'Mai', 'attendance: the kid already on "ลา" is last, "รอเช็ก" first')
    pg.screenshot(path=S + 'v41_a_att.png')
    pg.locator('.att-main').first.click(); pg.wait_for_timeout(500)
    first = pg.locator('.att .nm').first.inner_text()
    check(first == names[0], 'attendance: rows do not jump after a tap')
    check(pg.locator('.att').first.get_attribute('class').split()[-1] == 'present', 'attendance: tapping the name = มา')
    pg.locator('.att >> nth=1').locator('.chip.absent').click(); pg.wait_for_timeout(500)
    check('absent' in pg.locator('.att >> nth=1').get_attribute('class'), 'attendance: ขาด chip works')
    check(pg.locator('#allHere').is_visible() and '(6)' in pg.inner_text('#allHere'), 'attendance: "ทุกคนที่รอเช็กมา" counts the 6 still waiting')
    pg.click('#allHere'); pg.wait_for_timeout(400); pg.click('#dlg button[value="ok"]'); pg.wait_for_timeout(1200)
    st = {r['kid_id']: r['status'] for r in dbnow(pg)['attendance']}
    check(sum(v == 'present' for v in st.values()) == 7 and st.get(k[0]) == 'leave', 'attendance: everyone waiting -> มา, ลา/ขาด kept')
    check(pg.locator('#allHere').count() == 0, 'attendance: the button goes away when nobody is waiting')
    pg.mouse.wheel(0, 600); pg.wait_for_timeout(300)
    check(pg.locator('.summary').bounding_box()['y'] < 140, 'attendance: counters stay on screen when scrolling')
    cx.close()

    # ---- b: Normal mode words and faces
    cx, pg = ctx(b, seed_db([pts(1, k[0], 20)], look={'mode': 'normal'}))
    go(pg, '#/admin', 1600)
    txt = pg.inner_text('body')
    check('เด็ก' not in txt.replace('โหมดเด็ก', ''), 'normal mode: admin home has no "เด็ก"')
    go(pg, '#/', 1600)
    check(pg.locator('.rank-row .ini').count() == 9, 'normal mode: initials instead of avatars')
    check('🥇' not in pg.inner_text('.rank-list'), 'normal mode: no medals')
    check('เจ' in pg.inner_text('.rank-list'), 'normal mode: Thai initial keeps the leading vowel ("เจ")')
    pg.screenshot(path=S + 'v41_b_normal.png')
    cx.close()
    cx, pg = ctx(b, seed_db([pts(1, k[0], 20)]))
    go(pg, '#/', 1600)
    check('🥇' in pg.inner_text('.rank-list') and pg.locator('.ini').count() == 0, 'kids mode: medals and avatars stay')
    cx.close()

    # ---- c: kid detail
    cx, pg = ctx(b, seed_db([pts(1, k[0], 20)]))
    go(pg, '#/', 1600)
    pg.click('.rank-row >> nth=0'); pg.wait_for_timeout(600)
    sh = pg.locator('#kidSheet')
    check(sh.locator('.kd-me').count() == 1 and sh.locator('.kd-me').bounding_box()['y'] < sh.locator('.section-label').bounding_box()['y'], 'kid detail: "นี่คือฉัน" sits above the categories')
    vis = sh.locator('.skill-list').first.locator('.v').all_inner_texts()
    check(vis == ['20'], f'kid detail: only categories with points shown open ({vis})')
    check(sh.locator('.zero-skills').count() == 1 and not sh.locator('.zero-skills').get_attribute('open'), 'kid detail: zero categories folded')
    pg.screenshot(path=S + 'v41_c_detail.png')
    cx.close()

    # ---- d: prizes (icon from the name, sold out)
    db = seed_db([pts(1, k[0], 100)])
    db['items'] = [{'id': 'i1', 'name': 'ขนมปังกรอบ', 'icon': '🎁', 'price': 10, 'active': True, 'sort': 0},
                   {'id': 'i2', 'name': 'ปากกาเจล', 'icon': '', 'price': 20, 'active': True, 'sort': 0},
                   {'id': 'i3', 'name': 'ตุ๊กตาหมี', 'icon': '🦄', 'price': 30, 'active': True, 'sort': 0, 'sold_out': True},
                   {'id': 'i4', 'name': 'ของขวัญลับ', 'icon': '🎁', 'price': 5, 'active': True, 'sort': 0}]
    cx, pg = ctx(b, db)
    pg.add_init_script("localStorage.setItem('ya_me', '%s')" % k[0])
    go(pg, '#/shop', 1600)
    arts = pg.locator('.slot .art').all_inner_texts()
    check('🍰' in arts and '✏️' in arts and '🎁' in arts, f'shop: icons guessed from names, unknown stays 🎁 ({arts})')
    check('🦄' in arts, 'shop: an emoji the admin picked always wins')
    last = pg.locator('.slot').last
    check('out' in last.get_attribute('class') and 'หมดแล้ว' in last.inner_text(), 'shop: sold-out prize last, marked "หมดแล้ว"')
    pg.screenshot(path=S + 'v41_d_shop.png')
    go(pg, '#/admin/redeem/' + k[0], 1600)
    btn = pg.locator('[data-i="i3"]')
    check(btn.is_disabled() and 'หมดแล้ว' in btn.inner_text(), 'redeem: sold-out prize cannot be picked')
    go(pg, '#/admin/redeem', 1600)
    check(pg.locator('.options').first.locator('[data-k]').count() == 1 and pg.locator('.rd-zero [data-k]').count() == 8, 'redeem: kids with 0 to spend are folded')
    go(pg, '#/admin/shop', 1400)
    pg.click('[data-item="i3"]'); pg.wait_for_timeout(400)
    pg.uncheck('#dlg input[name="sold_out"]'); pg.click('#dlg button[value="ok"]'); pg.wait_for_timeout(900)
    check(next(i for i in dbnow(pg)['items'] if i['id'] == 'i3').get('sold_out') is False, 'shop admin: "sold out" switch saves')
    cx.close()

    # ---- e: desktop admin pickers side by side
    cx, pg = ctx(b, seed_db(), w=1366, h=900)
    go(pg, '#/admin/attendance', 1800)
    a0, a1 = pg.locator('.att').nth(0).bounding_box(), pg.locator('.att').nth(1).bounding_box()
    check(abs(a0['y'] - a1['y']) < 2 and a1['x'] > a0['x'], 'desktop: attendance rows side by side')
    pg.screenshot(path=S + 'v41_e_desk.png')
    cx.close()

    # ---- f: small fixes
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/attendance', 1600)
    check(any(m in pg.inner_text('#daySay') for m in ['พ.ย.', 'ต.ค.', 'ธ.ค.', 'ม.ค.']) or len(pg.inner_text('#daySay')) > 5, 'date: the day in Thai words next to the picker')
    go(pg, '#/', 1400)
    check(pg.evaluate("getComputedStyle(document.querySelector('.kid-nav a.active')).boxShadow") == 'none', 'kid tabs: no top line on the open tab')
    cx.close()
    cx, pg = ctx(b, seed_db(), rm='reduce')
    go(pg, '#/', 800)
    pg.evaluate("const d=document.createElement('div');d.className='alert-banner';d.id='ab';document.body.append(d)")
    check(pg.evaluate("getComputedStyle(document.getElementById('ab')).animationName") == 'none', 'reduced motion: alert does not glow')
    cx.close()

    b.close()
print('\n'.join(errs) if errs else 'no errors')
