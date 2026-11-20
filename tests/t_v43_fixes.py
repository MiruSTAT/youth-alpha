# v43: section 14 "After v42" (v42 re-critique) + the owner's shop/songs screenshots.
# Run: tools/preview.sh t_v43_fixes      Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
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

    # ---- a: Edit kid box: name in the title, small Delete apart from Hide; Back closes the box (P1)
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/kids', 1500)
    pg.locator('#view').get_by_text('Tommy', exact=True).first.click(); pg.wait_for_timeout(500)
    check(pg.evaluate("document.querySelector('#dlg').open"), 'a: Edit kid box opens')
    check('Tommy' in pg.inner_text('#dlgForm h3'), 'a: box title has the kid\'s name')
    gap = pg.evaluate("(() => { const h = document.querySelector('.dlg-extra [value=toggle]').getBoundingClientRect(), d = document.querySelector('.dlg-extra [value=delete]').getBoundingClientRect(); return d.left - h.right })()")
    check(gap >= 20, f'a: Delete sits apart from Hide ({gap:.0f} px)')
    pg.screenshot(path=S + 'v43_a_editkid.png')
    pg.evaluate("location.hash = '#/admin'"); pg.wait_for_timeout(700)
    check(not pg.evaluate("document.querySelector('#dlg').open"), 'a: page change closes the box (= Cancel)')
    check(dbnow(pg)['kids'][0]['nickname'] == 'Tommy', 'a: closing saved nothing')
    cx.close()

    # ---- b: darker text for "✓ มา" and ลา (P1)
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/attendance', 1500)
    c1 = pg.evaluate("getComputedStyle(document.querySelector('.att .chip.present')).color")
    c2 = pg.evaluate("getComputedStyle(document.querySelector('.summary .c-leave')).color")
    check(c1 == 'rgb(20, 108, 59)', f'b: "✓ มา" text is the darker green ({c1})')
    check(c2 == 'rgb(138, 90, 0)', f'b: ลา counter is the darker amber ({c2})')
    cx.close()

    # ---- c: English attendance never scrolls sideways at 390 px (normal + Select many) (P2)
    for lang in ('en', 'th'):
        cx, pg = ctx(b, seed_db(), 390, 844, lang)
        go(pg, '#/admin/attendance', 1500)
        sw = lambda: pg.evaluate('document.documentElement.scrollWidth')
        check(sw() <= 390, f'c {lang}: attendance fits 390 px ({sw()})')
        pg.click('#multi'); pg.wait_for_timeout(400); pg.click('#pickAll'); pg.wait_for_timeout(400)
        check(sw() <= 390, f'c {lang}: Select many + bottom bar fit 390 px ({sw()})')
        if lang == 'en': pg.screenshot(path=S + 'v43_c_att_en.png')
        cx.close()

    # ---- d: Give points step 3: today's kids first, "เลือกคนที่มาวันนี้ (N)", nobody ticked, note above the list (P2)
    db = seed_db(); db['attendance'] = [{'kid_id': k[5], 'day': TODAY, 'session': 'main', 'status': 'present'}, {'kid_id': k[8], 'day': TODAY, 'session': 'main', 'status': 'present'},
                                        {'kid_id': k[0], 'day': TODAY, 'session': 'main', 'status': 'leave'}]
    cx, pg = ctx(b, db)
    go(pg, '#/admin/points', 1500)
    pg.locator('[data-s]').first.click(); pg.wait_for_timeout(500)
    pg.locator('[data-a="10"]').first.click(); pg.click('#amtGo'); pg.wait_for_timeout(800)
    btn = pg.locator('#pickHere')
    check(btn.count() == 1 and '(2)' in btn.inner_text(), 'd: "เลือกคนที่มาวันนี้ (2)" button')
    check(pg.locator('.options .opt.on').count() == 0, 'd: nobody is ticked at the start')
    first2 = pg.evaluate("[...document.querySelectorAll('.options .opt')].slice(0,2).map(o => o.innerText).join('|')")
    check('Fah' in first2 and 'Mai' in first2 and 'มาวันนี้' in first2, f'd: today\'s kids are listed first ({first2!r})')
    above = pg.evaluate("document.querySelector('#note').getBoundingClientRect().top < document.querySelector('.options').getBoundingClientRect().top")
    check(above, 'd: หมายเหตุ is above the list')
    pg.fill('#note', 'เก่งมาก'); btn.click(); pg.wait_for_timeout(400)
    check(pg.locator('.options .opt.on').count() == 2 and pg.input_value('#note') == 'เก่งมาก', 'd: button picks the 2 and keeps the note')
    pg.screenshot(path=S + 'v43_d_points.png')
    pg.click('#give'); pg.wait_for_timeout(800)
    got = [x for x in dbnow(pg)['points'] if x.get('note') == 'เก่งมาก']
    check(len(got) == 2, f'd: points saved for the 2 with the note ({len(got)})')
    cx.close()

    # ---- e: phone admin home shows the to-do card only when something waits; computer tiles show live status (P3)
    db = seed_db(); db['attendance'] = [{'kid_id': k[1], 'day': TODAY, 'session': 'main', 'status': 'present'}]
    cx, pg = ctx(b, db)
    go(pg, '#/admin', 2000)
    check(pg.locator('.home-needs').is_visible(), 'e: phone shows the to-do card when attendance is not finished')
    check(not pg.locator('.today-tiles').is_visible(), 'e: phone keeps its menu (no today tiles)')
    cx.close()
    cx, pg = ctx(b, db, 1366, 800)
    go(pg, '#/admin', 2000)
    t1 = pg.inner_text('.today-tile[data-k="attendance"]')
    check('1/9' in t1, f'e: computer attendance tile shows "1/9" ({t1!r})')
    t2 = pg.inner_text('.today-tile[data-k="redeem"]') if pg.locator('.today-tile[data-k="redeem"]').count() else ''
    pg.screenshot(path=S + 'v43_e_home_pc.png')
    cx.close()
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin', 2000)
    check(not pg.locator('.home-needs').is_visible() or 'ของรางวัล' in pg.inner_text('.home-needs'), 'e: phone to-do card only with something to do')
    cx.close()

    # ---- f: kids' shop: no extra line, one calm hint pill; empty shop is friendly (owner's screenshot)
    db = seed_db(); db['items'] = [{'id': 'i1', 'name': 'ชาเจี๊ยบ', 'price': 1900, 'icon': '🧋', 'active': True, 'sort': 1, 'cat_id': None, 'sold_out': False}]
    cx, pg = ctx(b, db)
    go(pg, '#/shop', 2000)
    check(pg.locator('.sheet-sub').count() == 0, 'f: "สะสมคะแนนแล้วมาแลกกันนะ" line is gone')
    hint = pg.locator('.shop-hint')
    if hint.count():
        bb = hint.bounding_box(); fs = pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.shop-hint')).fontSize)")
        check(bb['x'] >= 0 and bb['x'] + bb['width'] <= 390 and bb['height'] <= 80, f'f: hint fits ({bb["width"]:.0f}x{bb["height"]:.0f})')
        check(16 <= fs <= 19, f'f: hint text is readable but not big ({fs}px)')
    pg.screenshot(path=S + 'v43_f_shop.png')
    cx.close()
    cx, pg = ctx(b, seed_db())
    go(pg, '#/shop', 2000)
    check(pg.locator('.empty-shop').count() == 1, 'f: empty shop has a friendly block')
    cx.close()

    # ---- g: songs show the name the same way (Thai first in Thai, English first in English) + "คีย์" on the badge
    for lang in ('th', 'en'):
        cx, pg = ctx(b, seed_db(), 390, 844, lang)
        go(pg, '#/songs', 2000)
        firsts = pg.evaluate("[...document.querySelectorAll('.song-card .st')].map(s => [s.querySelector('b').innerText, s.querySelector('span')?.innerText || ''])")
        th = lambda x: any('\u0e00' <= ch <= '\u0e7f' for ch in x)
        bad = [f for f in firsts if f[1] and th(f[0]) != (lang == 'th') and th(f[0]) != th(f[1])]
        check(firsts and not bad, f'g {lang}: every song shows the {lang} name first ({bad})')
        if pg.locator('.kchip').count(): check(('คีย์' if lang == 'th' else 'Key') in pg.inner_text('.kchip >> nth=0'), f'g {lang}: key badge says what it is')
        if lang == 'th': pg.screenshot(path=S + 'v43_g_songs.png')
        cx.close()

    b.close()
print('\n'.join(errs) if errs else 'no errors')
