# v42: section 14 "After v41" (v41 re-critique) + the owner's attendance screenshots (TH/EN) + change log hint.
# Run: tools/preview.sh t_v42_fixes      Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os, datetime
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
NOW = '2026-11-16T10:00:00.000Z'; TODAY = datetime.date.today().isoformat()

def kid(i, name, av, active=True): return {'id': f'00000000-0000-0000-0000-00000000000{i}', 'nickname': name, 'avatar': av, 'grp': '', 'active': active, 'created_at': NOW}
def pts(i, kid_id, n): return {'id': f'p{i}', 'kid_id': kid_id, 'skill': 'bonus', 'amount': n, 'note': '', 'created_at': NOW}
KIDS = [kid(1, 'Tommy', '🎅'), kid(2, 'Maximilian', '🦊'), kid(3, 'ต้นกล้า', '🐼')] + [kid(i, n, '🐼') for i, n in [(4, 'Nok'), (5, 'Pim'), (6, 'Fah'), (7, 'Oil'), (8, 'Bam'), (9, 'Mai')]]
k = [x['id'] for x in KIDS]

def seed_db(points=(), look=None, kids=None):
    return {'kids': kids or KIDS, 'points': list(points), 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True},
            'loggedIn': True, 'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
            'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
            'admins': [], 'events': []}

def ctx(b, db, w=390, h=844, lang='th', extra=''):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 600, has_touch=True, service_workers='block')
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);localStorage.setItem('ya_lang','%s');%s"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % (json.dumps(json.dumps(db)), lang, extra))
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
BREAK = "window._js=window._js||JSON.stringify;JSON.stringify=function(v,...a){if(v&&v.kids&&v.attendance)throw new Error('boom');return window._js.call(JSON,v,...a)}"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- a: attendance rows, both languages, phone + computer (owner's screenshots: "Tomm/y" and one letter per line)
    for lang, here in (('th', 'มา'), ('en', 'Here')):
        for w in (390, 1500):
            cx, pg = ctx(b, seed_db(), w, 800, lang)
            go(pg, '#/admin/attendance', 1600)
            row = pg.locator('.att', has_text='Tommy')
            nh = row.locator('.nm').bounding_box()['height']
            check(nh < 40, f'a {lang} {w}: "Tommy" stays on one line ({nh:.0f} px)')
            check(row.bounding_box()['height'] <= 64, f'a {lang} {w}: Tommy row is one line')
            chip = row.locator('.chip.present')
            check(chip.count() == 1 and here in chip.inner_text(), f'a {lang} {w}: visible "✓ {here}" button on the row')
            overlap = pg.evaluate("[...document.querySelectorAll('.att')].some(r => { const n = r.querySelector('.nm').getBoundingClientRect(), c = r.querySelector('.chips').getBoundingClientRect(); return n.right > c.left + 1 && n.bottom > c.top + 1 && c.bottom > n.top + 1 })")
            check(not overlap, f'a {lang} {w}: names never run under the buttons')
            if w == 390:
                pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(300); chip.click(); pg.wait_for_timeout(500)
                check('present' in row.get_attribute('class') and '+10' in row.inner_text(), f'a {lang}: "✓ {here}" marks the row and shows +10 ⭐')
                check('+10' in pg.inner_text('.att-pts'), f'a {lang}: the counters say what "{here}" gives')
                pg.screenshot(path=S + f'v42_a_att_{lang}.png')
            else:
                cols = pg.evaluate("getComputedStyle(document.querySelector('.att-list')).gridTemplateColumns.split(' ').length")
                check(cols == 2, f'a {lang} {w}: attendance stays 2 wide on a big screen ({cols})')
            cx.close()
    cx, pg = ctx(b, seed_db(), 390, 800, 'th')
    go(pg, '#/admin/attendance', 1500); pg.click('#langBtn'); pg.wait_for_timeout(900)
    check('Here' in pg.locator('.att .chip.present').first.inner_text() and 'Attendance' in pg.inner_text('#view h1'), 'a: switching TH→EN on the page changes the row buttons too')
    cx.close()

    # ---- b: "นี่คือฉัน" only on your own sheet
    cx, pg = ctx(b, seed_db([pts(1, k[0], 20), pts(2, k[1], 10)]), extra="localStorage.setItem('ya_me','%s');" % k[0])
    go(pg, '#/', 1600)
    pg.locator('.rank-row', has_text='Maximilian').click(); pg.wait_for_timeout(600)
    sh = pg.locator('#kidSheet')
    check(sh.locator('.kbtn#thisMe').count() == 0 and 'เปลี่ยนเป็น Maximilian' in sh.locator('#thisMe').inner_text(), 'b: a friend\'s sheet shows only "เปลี่ยนเป็น Maximilian ใช่ไหม?"')
    pg.screenshot(path=S + 'v42_b_friend.png')
    sh.locator('.x').click(); pg.wait_for_timeout(400)
    pg.click('#myCard'); pg.wait_for_timeout(600)
    check(sh.locator('#notMe').count() == 1, 'b: own sheet keeps "ไม่ใช่ฉัน"')
    cx.close()
    cx, pg = ctx(b, seed_db([pts(1, k[0], 20)]))
    go(pg, '#/', 1600); pg.click('.rank-row >> nth=0'); pg.wait_for_timeout(600)
    check(pg.locator('#kidSheet .kbtn#thisMe').count() == 1, 'b: a phone with no kid set still gets the big "นี่คือฉัน"')
    cx.close()

    # ---- c: kids' side on a computer / projector
    many = [kid(i, f'Kid {i}', '🐼') for i in range(1, 10)]
    cx, pg = ctx(b, seed_db([pts(i, f'00000000-0000-0000-0000-00000000000{i}', 10 * i) for i in range(1, 10)], kids=many), 1366, 768)
    go(pg, '#/', 2200)
    colc = pg.evaluate("getComputedStyle(document.querySelector('.rank-list')).columnCount")
    nav = pg.locator('.kid-nav').bounding_box()
    shown = pg.evaluate("[...document.querySelectorAll('.rank-row')].filter(r => r.getBoundingClientRect().bottom <= innerHeight - 70).length")
    check(colc == '2', f'c: ranking in 2 columns at 1366 px ({colc})')
    check(nav['width'] <= 640 and abs(nav['x'] + nav['width'] / 2 - 683) < 2, f'c: tab bar capped and centred ({nav["width"]:.0f} px)')
    check(shown >= 8, f'c: {shown} rank rows visible without scrolling (was 4)')
    pg.screenshot(path=S + 'v42_c_wide.png')
    cx.close()

    # ---- d: Edit kid box on a 390 px phone + "ซ่อนแทน"
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/kids', 1500)
    pg.click(f'[data-edit="{k[1]}"]'); pg.wait_for_timeout(500)
    m = pg.evaluate("(() => { const d = document.querySelector('#dlg'), r = d.getBoundingClientRect(), g = d.querySelector('.emoji-pick').getBoundingClientRect(), f = d.querySelector('.dlg-foot').getBoundingClientRect(); return { over: d.scrollWidth - d.clientWidth, w: r.width, gr: g.right, dr: r.right, fb: f.bottom, vh: innerHeight } })()")
    check(m['over'] <= 0 and m['gr'] <= m['dr'], f'd: Edit kid fits 390 px (box {m["w"]:.0f}, no side scroll, avatars inside)')
    check(m['fb'] <= m['vh'], 'd: Save / Hide / Delete stay in view')
    pg.screenshot(path=S + 'v42_d_edit.png')
    pg.click('#dlg [value=delete]'); pg.wait_for_timeout(500)
    ok = pg.locator('#dlg [value=ok]').inner_text()
    check(ok == 'ซ่อนแทน' and 'Maximilian' in pg.inner_text('#dlg [value=reallyDel]'), f'd: delete warning offers "ซ่อนแทน" first ({ok})')
    pg.screenshot(path=S + 'v42_d_delete.png')
    pg.click('#dlg [value=ok]'); pg.wait_for_timeout(700)
    kd = [x for x in dbnow(pg)['kids'] if x['id'] == k[1]]
    check(kd and kd[0]['active'] is False, 'd: "ซ่อนแทน" hides the kid and keeps the row')
    cx.close()

    # ---- e: kids' small text
    tied = seed_db([pts(1, k[0], 10), pts(2, k[1], 10)])
    cx, pg = ctx(b, tied)
    go(pg, '#/', 1600)
    fs = pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.rank-row .tie')).fontSize)")
    check(fs >= 14, f'e: "เสมอ" is {fs:.1f} px (was 11)')
    cx.close()

    # ---- f: Give points step 2 waits for "ถัดไป"; failed save names the reason
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/points', 1200); pg.click('[data-s] >> nth=0'); pg.wait_for_timeout(400)
    pg.click('[data-a="10"]'); pg.wait_for_timeout(300)
    check(pg.locator('#amtGo').count() == 1 and '+10' in pg.inner_text('#amtGo') and pg.locator('[data-a]').count() > 0, 'f: a tap picks +10 and stays on step 2')
    pg.click('#amtGo'); pg.wait_for_timeout(400)
    check('+10' in pg.inner_text('.list-tools'), 'f: "ถัดไป" goes on with +10')
    go(pg, '#/admin/attendance', 1300); pg.evaluate(BREAK)
    pg.locator('.att .chip.present').first.click(); pg.wait_for_timeout(600)
    check('boom' in pg.inner_text('#errBar'), 'f: a failed save that is not the internet shows the real reason')
    cx.close()

    # ---- g: Normal mode — category line icons, computer admin home, change log hint
    cx, pg = ctx(b, seed_db(look={'mode': 'normal'}), 1366, 900)
    go(pg, '#/admin/points', 1500)
    em = pg.evaluate("[...document.querySelectorAll('.options .opt > .i')].filter(e => !e.querySelector('svg')).length")
    check(em == 0, f'g: Normal mode Give points uses line icons ({em} emoji left)')
    go(pg, '#/admin', 1600)
    groups = pg.evaluate("[...document.querySelectorAll('#view .mgrp')].filter(e => e.getBoundingClientRect().height > 0).length")
    tiles = pg.locator('.today-tile').count()
    tops = set(pg.evaluate("[...document.querySelectorAll('.today-tile')].map(e => Math.round(e.getBoundingClientRect().top))"))
    check(groups == 0 and tiles == 4 and len(tops) == 1, f'g: computer admin home = today\'s 4 jobs in one row, no repeated menu ({groups} groups, {tiles} tiles)')
    pg.screenshot(path=S + 'v42_g_home.png')
    it = pg.evaluate("(() => { const a = document.querySelector('.menu a.alert'); return a ? getComputedStyle(a).animationIterationCount : '3' })()")
    check(it == '3', f'g: alert pulse stops after 3 ({it})')
    go(pg, '#/admin/about', 1400)
    check(pg.locator('.clog-hint a[href="#/admin/look"]').count() == 1, 'g: change log page tells the super admin where admins\' log switch is')
    cx.close()

    b.close()
print('\n'.join(errs) if errs else 'no errors')
