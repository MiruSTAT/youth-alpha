# v44: section 14 "After v43" P1 + P2 (attendance rows never jump, calm "รอเช็ก N คน", neutral "✓ มา" chip, redeem ⓘ)
# + one column width per admin page on a computer (the owner's feedback / shop / programs screenshots) + no sideways scroll.
# Run: tools/preview.sh t_v44_fixes      Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os, datetime
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
NOW = '2026-11-16T10:00:00.000Z'; TODAY = datetime.date.today().isoformat()

def kid(i, name, av='🐼'): return {'id': f'00000000-0000-0000-0000-00000000000{i}', 'nickname': name, 'avatar': av, 'grp': '', 'active': True, 'created_at': NOW}
KIDS = [kid(1, 'Tommy', '🎅'), kid(2, 'Maximilian', '🦊'), kid(3, 'ต้นกล้า')] + [kid(i, n) for i, n in [(4, 'Nok'), (5, 'Pim'), (6, 'Fah'), (7, 'Oil'), (8, 'Bam'), (9, 'Mai')]]
k = [x['id'] for x in KIDS]

def seed_db(mode=None):
    return {'kids': KIDS, 'points': [{'id': 'p1', 'kid_id': k[0], 'skill': 'bonus', 'amount': 50, 'note': '', 'created_at': NOW}],
            'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True},
            'loggedIn': True, 'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
            'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': {'mode': mode} if mode else {}, 'login_mode': 'off'},
                         {'id': 2, 'slug': 'testing-new-program', 'name': 'Testing new program', 'archived': False, 'look': {}, 'login_mode': 'off'}],
            'admins': [], 'events': [], 'cats': [{'id': 'c1', 'name': 'ทั่วไป', 'sort': 0}],
            'items': [{'id': 'i1', 'name': 'ชาเจี๊ยบ', 'price': 30, 'icon': '🧋', 'category_id': 'c1', 'active': True, 'sort': 0}],
            'feedback': [{'id': 'f1', 'created_at': NOW, 'message': 'Testing by raffy', 'nickname': '', 'avatar': '🙂'}]}

def ctx(b, db, w=390, h=844, lang='th'):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 600, has_touch=True, service_workers='block')
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);localStorage.setItem('ya_lang','%s');"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % (json.dumps(json.dumps(db)), lang))
    pg = cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V + 'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    return cx, pg

def go(pg, h, w=1200): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)

# direct blocks of #view (not text lines, not fixed bars) and their left/right edges
EDGES = """() => [...document.querySelector('#view').children].filter(c => { const s = getComputedStyle(c), r = c.getBoundingClientRect();
  return s.display !== 'none' && s.position !== 'fixed' && !c.hidden && r.width > 200 && !/^(H\\d|P|LABEL)$/.test(c.tagName); })
  .map(c => { const r = c.getBoundingClientRect(); return [c.tagName + '.' + c.className, Math.round(r.left), Math.round(r.right)]; })"""
ADMIN = ['', 'attendance', 'attsum', 'points', 'history', 'kids', 'members', 'notice', 'shop', 'redeem', 'pcats', 'songs', 'feedback', 'musicset',
         'settings', 'phone', 'weekly', 'export', 'about', 'admins', 'programs', 'look', 'online', 'ai', 'data']

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- a: attendance rows keep their height after มา; chips stay on the name line; unmarked "✓ มา" is neutral (P1 + P2)
    for lang in ('th', 'en'):
        cx, pg = ctx(b, seed_db(), 390, 844, lang)
        go(pg, '#/admin/attendance', 1500)
        h0 = [r['height'] for r in [pg.locator('.att').nth(i).bounding_box() for i in range(3)]]
        bc = pg.evaluate("getComputedStyle(document.querySelector('.att .chip.present')).borderTopColor")
        ln = pg.evaluate("getComputedStyle(document.querySelector('.att .chip.absent')).borderTopColor")
        check(bc == ln, f'a {lang}: unmarked "✓ มา" has the same neutral outline as ขาด ({bc})')
        y3 = pg.locator('.att').nth(3).bounding_box()['y']
        for i in range(3): pg.locator('.att .att-main').nth(i).click(); pg.wait_for_timeout(500)
        h1 = [r['height'] for r in [pg.locator('.att').nth(i).bounding_box() for i in range(3)]]
        check(all(abs(x - y) <= 2 for x, y in zip(h0, h1)), f'a {lang}: rows keep their height after มา ({h0} → {h1})')
        check(abs(pg.locator('.att').nth(3).bounding_box()['y'] - y3) <= 3, f'a {lang}: rows below do not move')
        one = pg.evaluate("[...document.querySelectorAll('.att')].slice(0, 3).every(r => { const m = r.querySelector('.att-main').getBoundingClientRect(), c = r.querySelector('.chips').getBoundingClientRect(); return c.top < m.bottom && c.left >= m.right - 1; })")
        check(one, f'a {lang}: chips stay on the name line (Maximilian too)')
        st = pg.evaluate("(() => { const r = document.querySelector('.att'), n = r.querySelector('.nm').getBoundingClientRect(), s = r.querySelector('.state')?.getBoundingClientRect(); return s ? s.top >= n.bottom - 2 : false })()")
        check(st, f'a {lang}: "+10 ⭐" sits under the name')
        check(pg.evaluate("document.documentElement.scrollWidth") <= 390, f'a {lang}: no sideways scroll')
        if lang == 'th': pg.locator('.att').nth(4).scroll_into_view_if_needed(); pg.wait_for_timeout(200); pg.screenshot(path=S + 'v44_a_att.png')
        cx.close()

    # ---- b: phone admin home: one calm "รอเช็ก N คน", no red tile for attendance (P2)
    db = seed_db(); db['attendance'] = [{'id': 'a1', 'kid_id': k[1], 'day': TODAY, 'session': 'main', 'status': 'present'}]
    cx, pg = ctx(b, db)
    go(pg, '#/admin', 2000)
    tx = pg.inner_text('.home-needs') if pg.locator('.home-needs').is_visible() else ''
    check('รอเช็ก 8 คน' in tx, f'b: to-do card says "รอเช็ก 8 คน" ({tx!r})')
    cls = pg.evaluate("document.querySelector('.home-needs a[href$=\"/attendance\"] .sub')?.className || ''")
    check('calm-tx' in cls and 'need-tx' not in cls, f'b: the attendance line is calm, not red ({cls})')
    check(pg.locator('.menu [data-k="attendance"].alert').count() == 0, 'b: no red attendance tile in the menu')
    check('ยังเช็กชื่อไม่เสร็จ' not in pg.inner_text('#view'), 'b: the red "not finished" text is gone')
    pg.screenshot(path=S + 'v44_b_home.png', clip={'x': 0, 'y': 0, 'width': 390, 'height': 500})
    cx.close()

    # ---- c: redeem: big "ใช้แลกได้", explanation folded behind ⓘ with room before the heading (P2)
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/redeem/' + k[0], 1500)
    fs = pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.rd-bal b')).fontSize)")
    check(fs >= 28, f'c: spendable points are big ({fs}px)')
    check(pg.locator('details.rd-why').count() == 1 and not pg.evaluate("document.querySelector('.rd-why').open"), 'c: explanation folded behind ⓘ')
    pg.click('.rd-why summary'); pg.wait_for_timeout(200)
    check(pg.locator('.rd-why p').count() == 2 and pg.locator('.rd-why p').first.is_visible(), 'c: ⓘ opens two short lines')
    gap = pg.evaluate("document.querySelector('.rd-why + h2').getBoundingClientRect().top - document.querySelector('.rd-why').getBoundingClientRect().bottom")
    check(gap >= 20, f'c: room before "เลือกของรางวัล" ({gap:.0f} px)')
    pg.screenshot(path=S + 'v44_c_redeem.png', clip={'x': 0, 'y': 0, 'width': 390, 'height': 520})
    cx.close()

    # ---- d: every admin page: one column width on a computer, no sideways scroll on phone / tablet (TH + EN, kids + normal)
    for mode in (None, 'normal'):
        for w, lang in ((1366, 'th'), (768, 'en'), (390, 'en'), (390, 'th')):
            cx, pg = ctx(b, seed_db(mode), w, 900, lang)
            bad, wide = [], []
            for r in ADMIN:
                go(pg, '#/admin' + ('/' + r if r else ''), 800)
                e = pg.evaluate(EDGES)
                if len({x[1] for x in e}) > 1 or len({x[2] for x in e}) > 1: bad.append((r or 'home', e))
                if pg.evaluate("document.documentElement.scrollWidth") > w: wide.append(r or 'home')
            check(not bad, f'd {mode or "kids"} {w} {lang}: every block on a page shares one left/right edge {bad[:2]}')
            check(not wide, f'd {mode or "kids"} {w} {lang}: no sideways scroll {wide}')
            if w == 1366 and not mode:
                go(pg, '#/admin/feedback', 1000)
                r = pg.evaluate("document.querySelector('#view').children[2].getBoundingClientRect().width")
                check(r <= 762, f'd: feedback blocks are 760 px wide on a computer ({r:.0f})')
                pg.screenshot(path=S + 'v44_d_feedback_pc.png', clip={'x': 256, 'y': 0, 'width': 900, 'height': 520})
            cx.close()

    b.close()
print('\n'.join(errs) if errs else 'no errors')
