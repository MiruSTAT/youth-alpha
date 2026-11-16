# v34 program settings polish: logo emoji/picture + size slider, layout drag only, a choice for each playful part.
# Run against a preview copy (tools/preview.sh t_v34_settings). Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import base64, json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
PNG = '/tmp/ya_logo.png'
open(PNG, 'wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJElEQVR4nGP8z8Dwn4EIwESMIoZRhYMHMDIwMPwnRiHRVgMA2a0DDcT9sF4AAAAASUVORK5CYII='))

def seed_db(look=None):
    now = '2026-11-17T10:00:00.000Z'
    return {
        'kids': [{'id': '11111111-1111-1111-1111-111111111111', 'nickname': 'Mai', 'avatar': '🐱', 'grp': '', 'active': True, 'created_at': now}],
        'points': [], 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True}, 'loggedIn': True,
        'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
        'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
        'admins': [], 'events': [],
    }

def ctx(b, db, w=390, h=844):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=w < 600, has_touch=True, service_workers='block')
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
def look(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))['programs'][0]['look']
def val(pg, n): return pg.input_value(f'#lookForm [name={n}]')
PARTS = ['fall', 'scene', 'friend', 'special', 'music']

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- A: an untouched program: Christmas choices, emoji logo, drag-only layout
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/look', 1800)
    check([val(pg, 'p_' + k) for k in PARTS] == ['snow', 'tree', 'santa', 'gifts', 'jingle'], 'empty look shows the Christmas choices')
    check(val(pg, 'logoType') == 'emoji' and pg.is_hidden('#logoPick'), 'logo starts as emoji, picture button hidden')
    check(pg.locator('#lookForm [name=f_tree], #lookForm [name=f_snow]').count() == 0 and pg.locator('#lookForm [name=f_shop]').count() == 1, 'only the pages keep on/off ticks')
    check(pg.locator('#layCard [data-up], #layCard [data-down]').count() == 0 and '▲' not in pg.inner_text('#layCard'), 'layout card has no ▲▼ buttons')
    # pack switch fills the choices; plain = all off; normal mode = all off
    pg.select_option('#lookForm [name=pack]', 'easter')
    check([val(pg, 'p_' + k) for k in PARTS] == ['petals', 'cross', 'lamb', 'eggs', 'easter'], 'choosing Easter sets every part to its Easter choice')
    pg.select_option('#lookForm [name=pack]', 'plain')
    check(all(val(pg, 'p_' + k) == 'off' for k in PARTS), 'choosing plain switches every part off')
    pg.select_option('#lookForm [name=pack]', 'christmas')
    # picture logo + size + mixed parts
    pg.select_option('#lookForm [name=logoType]', 'image')
    pg.click('#lookForm [type=submit]'); pg.wait_for_timeout(500)
    check('logo' not in look(pg), 'picture chosen without a file: not saved (asks for a picture)')
    pg.set_input_files('#logoFile', PNG); pg.wait_for_timeout(800)
    check(pg.locator('#logoPv img').count() == 1, 'uploaded logo shows in the preview')
    pg.eval_on_selector('#lookForm [name=logoSize]', 'e=>{e.value="1.5"; e.dispatchEvent(new Event("input"))}')
    check(pg.inner_text('#logoSizeV') == '150%', 'size slider label 150%')
    for k, v in [('fall', 'petals'), ('scene', 'off'), ('friend', 'lamb'), ('special', 'eggs'), ('music', 'easter')]: pg.select_option(f'#lookForm [name=p_{k}]', v)
    pg.evaluate("document.querySelector('#lookCard').scrollIntoView()"); pg.screenshot(path=S + 'v34_01_settings.png', full_page=True)
    pg.click('#lookForm [type=submit]'); pg.wait_for_timeout(800)
    L = look(pg)
    check(L.get('parts') == {'fall': 'petals', 'scene': 'off', 'friend': 'lamb', 'special': 'eggs', 'music': 'easter'}, 'parts saved in look.parts')
    check(L.get('logo', {}).get('type') == 'image' and L['logo'].get('url', '').startswith('data:image') and L['logo'].get('size') == 1.5, 'logo saved as picture, size 1.5')
    check(not any(k in (L.get('off') or {}) for k in ['tree', 'snow', 'santa', 'festive', 'music']), 'old on/off keys for the parts are not written any more')
    # kids' side
    go(pg, '#/', 1800); pg.screenshot(path=S + 'v34_02_kids_logo.png')
    check(pg.locator('.brand-tree img').count() == 1, 'header shows the logo picture')
    check(pg.evaluate("document.body.classList.contains('logo-img') && document.body.classList.contains('off-tree')"), 'scene off: big logo spot is used')
    check('data:image' in pg.evaluate("getComputedStyle(document.body, '::before').backgroundImage"), 'big logo spot shows the picture')
    check(pg.evaluate("document.body.dataset.fall") == 'petals' and '255, 170, 205' in pg.evaluate("getComputedStyle(document.body).getPropertyValue('--flake')"), 'petals colour with the Christmas pack')
    check(pg.evaluate("document.body.dataset.pack") == 'christmas', 'pack stays Christmas (mixed parts)')
    # back to emoji keeps the picture address for later
    go(pg, '#/admin/look', 1800)
    check(val(pg, 'logoType') == 'image' and val(pg, 'logoSize') == '1.5' and val(pg, 'p_music') == 'easter', 'form keeps logo and part choices')
    pg.select_option('#lookForm [name=logoType]', 'emoji'); pg.fill('#lookForm [name=emoji]', '⭐')
    pg.click('#lookForm [type=submit]'); pg.wait_for_timeout(800)
    L = look(pg)
    check(L['logo']['type'] == 'emoji' and L['logo'].get('url', '').startswith('data:image'), 'emoji chosen again; picture address kept')
    check(pg.inner_text('.brand-tree') == '⭐' and pg.locator('.brand-tree img').count() == 0, 'header back to the emoji')
    cx.close()

    # ---- B: a program saved before v34 (Easter pack, Santa switched off) keeps working
    cx, pg = ctx(b, seed_db({'pack': 'easter', 'off': {'santa': True, 'shop': True}}))
    go(pg, '#/', 1800)
    check(pg.evaluate("document.body.classList.contains('off-santa') && !document.body.classList.contains('off-tree')"), 'old look: friend off, scene on')
    check(pg.evaluate("document.body.dataset.fall") == 'petals', 'old Easter look: petals')
    go(pg, '#/admin/look', 1800)
    check([val(pg, 'p_' + k) for k in PARTS] == ['petals', 'cross', 'off', 'eggs', 'easter'], 'old look shown as choices (friend off)')
    check(not pg.is_checked('#lookForm [name=f_shop]'), 'old page switch (shop off) kept')
    cx.close()

    # ---- C: drag-only layout saves; Christmas tree + egg hunt mixed (special = eggs, scene = tree)
    cx, pg = ctx(b, seed_db({'parts': {'scene': 'tree', 'special': 'eggs', 'friend': 'dove'}}))
    go(pg, '#/admin/look', 1800); pg.evaluate("document.querySelector('#layCard').scrollIntoView()")
    keys = lambda k: pg.eval_on_selector_all(f'[data-kind={k}] .lay-item', 'e=>e.map(x=>x.dataset.key)')
    h = pg.locator('[data-kind=tabs] [data-key=shop] .lh').bounding_box(); t = pg.locator('[data-kind=tabs] [data-key=rank]').bounding_box()
    pg.mouse.move(h['x'] + 5, h['y'] + 5); pg.mouse.down()
    for i in range(1, 11): pg.mouse.move(h['x'] + 5, h['y'] + 5 + (t['y'] + 5 - h['y'] - 5) * i / 10); pg.wait_for_timeout(30)
    pg.mouse.up(); pg.wait_for_timeout(200)
    check(keys('tabs')[0] == 'shop', 'drag ⠿ moves the shop tab to the top')
    pg.click('#laySave'); pg.wait_for_timeout(700)
    check(look(pg).get('layout', {}).get('tabs', [None])[0] == 'shop', 'dragged order saved')
    go(pg, '#/', 2500)
    check(pg.eval_on_selector_all('.kid-nav a', 'e=>e.map(x=>x.dataset.nav)')[0] == 'shop', 'kids tab order follows the drag')
    box = pg.locator('#scene').bounding_box()
    for i in range(5): pg.mouse.click(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.5); pg.wait_for_timeout(120)
    pg.wait_for_timeout(3200)
    check(pg.locator('.egg-hunt .egg').count() == 8, 'special mode = eggs: egg hunt starts with the Christmas tree')
    pg.screenshot(path=S + 'v34_03_tree_egg_hunt.png')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
