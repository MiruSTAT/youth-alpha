# v38 (roadmap step 8): folding menu groups, settings search, export page, maintenance bar that ends maintenance,
# data tools (SQL file / CSV / SQL box / insights). Phone (390 px) and PC (1366 px). Run: tools/preview.sh t_v38_data. Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')

def seed_db(look=None, sup=True, sw=False, maint=None, who=None):
    now = '2026-11-17T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [{'id': 'p%d' % i, 'kid_id': '11111111-1111-1111-1111-111111111111', 'skill': 'attend', 'amount': 10, 'detail': '', 'note': "it's", 'created_at': '2026-11-%02dT10:00:00.000Z' % (10 + i)} for i in range(3)],
        'attendance': [{'kid_id': '11111111-1111-1111-1111-111111111111', 'day': '2026-11-%02d' % (10 + i), 'status': 'present' if i < 2 else 'absent'} for i in range(3)], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True, 'show_visits': sw, 'show_fb_count': sw}, 'loggedIn': sup or bool(who), 'who': who,
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
    cx.route('**/xlsx.full.min.js', lambda r: r.fulfill(path=V + 'xlsx.full.min.js', content_type='application/javascript'))   # cdn.sheetjs.com is not reachable from the cloud box
    cx.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg = cx.new_page(); pg.set_default_timeout(15000)
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    return cx, pg

def go(pg, h, w=1300): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)
def dbnow(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))


def no_xscroll(pg, label):
    w = pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
    check(w[0] <= w[1] + 1, label + ' (no sideways scroll %s)' % w)

def cut_text(pg, sel):          # elements whose text is cut off (wider than their box) or stick out of the screen
    return pg.evaluate("""(sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent && (e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > innerWidth + 1)).map(e => e.textContent.trim().slice(0, 30))""", sel)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    # ---- 1. phone: folding groups + search
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin', 1800)
    gs = pg.eval_on_selector_all('.mgrp', 'els => els.map(e => [e.dataset.g, e.open])')
    check([g for g, _ in gs] == ['g_daily', 'g_people', 'g_content', 'g_program', 'g_data'], 'phone: five groups %s' % gs)
    check([g for g, o in gs if o] == ['g_daily'], 'phone: only Daily open at first')
    keys = pg.eval_on_selector_all('.mgrp [data-k]', 'els => els.map(e => e.dataset.k)')
    check('look' not in keys and 'phone' not in keys and 'data' in keys, 'look + phone are tabs now, data tools in the menu %s' % keys)
    pg.click('.mgrp[data-g="g_data"] > summary'); pg.wait_for_timeout(200)
    go(pg, '#/admin', 1200)
    check(pg.evaluate("[...document.querySelectorAll('.mgrp[open]')].map(e => e.dataset.g).join()") == 'g_daily,g_data', 'phone: opened group is remembered')
    no_xscroll(pg, 'phone admin home')
    pg.screenshot(path=S + 'v38_home_phone.png')
    pg.fill('#homeFind', 'visits'); pg.wait_for_timeout(200)
    hits = pg.locator('.msearch-hit').all_inner_texts()
    check(len(hits) >= 1, 'search "visits" (English word, Thai screen) finds the visits switch %s' % hits)
    pg.fill('#homeFind', 'ร้าน'); pg.wait_for_timeout(200)
    check(any('ร้าน' in h for h in pg.locator('.msearch-hit').all_inner_texts()), 'search in Thai finds the shop')
    pg.fill('#homeFind', 'visits'); pg.wait_for_timeout(200)
    pg.locator('.msearch-hit').first.click(); pg.wait_for_timeout(1500)
    check(pg.evaluate('location.hash') == '#/admin/settings' and pg.locator('.find-flash').count() == 1, 'search hit opens Settings and lights up the switch')
    pg.fill('#homeFind', 'zzzz') if pg.locator('#homeFind').count() else None
    check([x.strip() for x in pg.locator('.subtabs a').all_inner_texts()][-1] == 'ตัวอย่างบนมือถือ', 'settings: Phone preview is a tab')
    go(pg, '#/admin/programs', 1500)
    check([x.strip() for x in pg.locator('.subtabs a').all_inner_texts()] == ['โปรแกรม', 'หน้าตา'], 'programs: tabs Programs | Look')
    # ---- 2. export page, phone
    go(pg, '#/admin/export', 1500)
    xs = pg.eval_on_selector_all('[data-x]', 'els => els.map(e => e.dataset.x)')
    check('xs_attsum' not in xs and 'xs_kidsum' not in xs and 'xs_kidlog' in xs and 'all' in xs, 'export: repeated rows gone %s' % xs)
    check(cut_text(pg, '.xl-t b, .xl-btn, .grp') == [], 'export phone: no text cut off %s' % cut_text(pg, '.xl-t b, .xl-btn, .grp'))
    no_xscroll(pg, 'export phone')
    pg.screenshot(path=S + 'v38_export_phone.png', full_page=True)
    with pg.expect_download() as dl: pg.click('.xl-btn[data-x="xs_kidlog"]')
    check('kid-activity' in dl.value.suggested_filename, "kids' activity export file name %s" % dl.value.suggested_filename)
    # ---- 3. data tools, phone
    go(pg, '#/admin/data', 2500)
    check(pg.locator('.dt-tbl').count() >= 8, 'data: table list')
    with pg.expect_download() as dl: pg.click('#dtSql')
    sql = open(dl.value.path(), encoding='utf-8').read()
    check('CREATE TABLE "kids"' in sql and "it''s" in sql and 'INSERT INTO "attendance"' in sql, 'data: SQL file with tables and escaped quotes')
    # v46: the SQL box and the insights were removed (the owner uses DBeaver with the .sql file)
    check(pg.locator('#dtRun, #dtQ, #dtIns, .dt-tile').count() == 0, 'data: no SQL box, no insights (v46)')
    no_xscroll(pg, 'data tools phone')
    check(cut_text(pg, '.dt-h3, .grp, .dt-big .btn') == [], 'data phone: no text cut off')
    pg.screenshot(path=S + 'v38_data_phone.png')
    cx.close()

    # ---- 4. PC: side menu groups + search, export grid, data tools, English
    cx, pg = ctx(b, seed_db(), 1366, 860)
    go(pg, '#/admin/export', 2000)
    check(pg.locator('.side-det').count() == 5, 'PC: five folding groups in the side menu')
    check(pg.evaluate("document.querySelector('.side-det[data-g=\"g_data\"]').open"), 'PC: group of the open page is open')
    check(cut_text(pg, '.xl-t b, .xl-btn, .side-link span') == [], 'export PC: no text cut off %s' % cut_text(pg, '.xl-t b, .xl-btn, .side-link span'))
    pg.screenshot(path=S + 'v38_export_pc.png')
    pg.fill('#sideFind', 'logo'); pg.wait_for_timeout(200)
    pg.locator('#adminSide .msearch-hit').first.click(); pg.wait_for_timeout(1800)
    check(pg.evaluate('location.hash') == '#/admin/look', 'PC side search: "logo" opens the Look page')
    pg.evaluate("localStorage.setItem('ya_lang','en')"); go(pg, '#/admin/data', 2500)
    no_xscroll(pg, 'data tools PC')
    check(cut_text(pg, '.dt-h3, .grp, .dt-big .btn, .side-link span') == [], 'data PC: no text cut off')
    pg.screenshot(path=S + 'v38_data_pc.png', full_page=True)
    cx.close()

    # ---- 5. maintenance: no buttons on the scene; the bar really ends it after a warning
    cx, pg = ctx(b, seed_db(sup=False, maint={'on': True, 'scene': 'tree'}))
    go(pg, '', 1800)
    check(pg.locator('.maint-scene').count() == 1 and pg.locator('.maint-scene button, .mt-btns').count() == 0, 'kid: maintenance scene without buttons')
    cx.close()
    cx, pg = ctx(b, seed_db(maint={'on': True, 'scene': 'tree'}))
    go(pg, '#/admin', 1800)
    pg.click('#maintBar'); pg.wait_for_timeout(400)
    check('Youth Alpha Christmas 2026' in pg.inner_text('#dlgForm'), 'bar: warning names the program')
    pg.click('#dlgForm button[value="cancel"]'); pg.wait_for_timeout(300)
    check((dbnow(pg)['programs'][0].get('maintenance') or {}).get('on') is True, 'bar: cancel keeps maintenance on')
    pg.click('#maintBar'); pg.wait_for_timeout(400); pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(1200)
    check((dbnow(pg)['programs'][0].get('maintenance') or {}).get('on') is False and not pg.locator('#maintBar').is_visible(), 'bar: OK ends maintenance and the bar goes away')
    cx.close()
    # ---- 6. normal admin (points + settings): no data tools, no look tab, search finds only allowed pages
    cx, pg = ctx(b, seed_db(sup=False, who='u-kru'))
    go(pg, '#/admin', 1800)
    keys = pg.eval_on_selector_all('.mgrp [data-k]', 'els => els.map(e => e.dataset.k)')
    check('data' not in keys and 'programs' not in keys and 'admins' not in keys, 'normal admin: no super admin pages %s' % keys)
    pg.fill('#homeFind', 'logo'); pg.wait_for_timeout(200)
    check(pg.locator('.msearch-hit').count() == 0, 'normal admin: search does not show super admin settings')
    go(pg, '#/admin/data', 1500)
    check(pg.locator('#dtSql').count() == 0, 'normal admin: data tools page closed')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
