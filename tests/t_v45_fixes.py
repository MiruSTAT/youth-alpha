# v45: (a) the owner's PC screenshots: few kids / few prizes stay centred, every kids' page uses one column, the tab bar is as
# wide as the sheet (390/768/1366/1920 px, TH + EN, kids + normal mode); (b) admin two-column pickers with one row use the full
# width; (c) points history: day headers, times, quiet ลบ, "เลิกทำ" after giving points; (d) a new program with a Thai name.
# Run: tools/preview.sh t_v45_fixes      Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os, re, datetime
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(__file__), 't_v44_fixes.py')).read().split('with sync_playwright() as p:')[0])   # same seed + helpers

def db_with(mode=None, nk=1, ni=1):
    d = seed_db(mode); d['kids'] = KIDS[:nk]
    d['items'] = [dict(d['items'][0], id=f'i{j}', name=f'ชาเจี๊ยบ {j + 1}', sort=j) for j in range(ni)]
    return d

KIDP = ['', 'shop', 'songs', 'menu', 'feedback']
LAYOUT = """() => { const sh = document.querySelector('#view .sheet'), R = sh.getBoundingClientRect(), nav = document.querySelector('.kid-nav');
  const vis = (c) => { const s = getComputedStyle(c), r = c.getBoundingClientRect(); return s.display !== 'none' && s.position !== 'absolute' && r.width > 40 && r.height > 0; };
  const wideOk = (c) => (c.matches('.rank-list') && c.children.length >= 6) || (c.matches('.stand') && c.querySelectorAll('.slot').length >= 4);
  const col = [...sh.children].filter(c => vis(c) && !c.matches('.sheet-grab, .vh') && !wideOk(c) && !c.matches('.shop-hint')).map(c => { const r = c.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; });
  const items = [...sh.querySelectorAll('.rank-row, .slot')].map(c => c.getBoundingClientRect());
  const mid = items.length ? (Math.min(...items.map(r => r.left)) + Math.max(...items.map(r => r.right))) / 2 : null;
  const n = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect() : null;
  return { col, off: mid === null ? 0 : Math.round(mid - (R.left + R.right) / 2), sheetW: Math.round(R.width), sheetL: Math.round(R.left),
           navW: n ? Math.round(n.width) : null, navL: n ? Math.round(n.left) : null, sx: document.documentElement.scrollWidth,
           cols: getComputedStyle(sh.querySelector('.rank-list') || sh).columnCount }; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- a: kids' pages
    runs = [(m, w, l, 1, 1) for m in (None, 'normal') for w in (390, 768, 1366, 1920) for l in ('th', 'en')] + \
           [(None, w, 'en', n, n) for w in (1366, 1920) for n in (3, 9)] + [('normal', 1366, 'th', 3, 3)]
    for mode, w, lang, nk, ni in runs:
        cx, pg = ctx(b, db_with(mode, nk, ni), w, 900, lang)
        bad = []
        for r in KIDP:
            go(pg, '#/' + r, 900); d = pg.evaluate(LAYOUT)
            if len({x[0] for x in d['col']}) > 1 or len({x[1] for x in d['col']}) > 1: bad.append((r or 'rank', 'column', d['col']))
            if abs(d['off']) > 3: bad.append((r or 'rank', 'off-centre', d['off']))
            if d['navW'] is not None and (abs(d['navW'] - d['sheetW']) > 2 or abs(d['navL'] - d['sheetL']) > 2): bad.append((r or 'rank', 'tab bar', d['navW'], d['sheetW']))
            if d['sx'] > w: bad.append((r or 'rank', 'sideways', d['sx']))
            if r == '' and w >= 1024: 
                want = '1' if nk <= 5 else ('3' if w >= 1440 and nk >= 13 else '2')
                if d['cols'] != want: bad.append(('rank', 'columns', d['cols'], want))
        check(not bad, f'a {mode or "kids"} {w} {lang} {nk} kids / {ni} prizes: centred, one column, tab bar = sheet, no sideways scroll {bad[:3]}')
        if (w, nk, mode, lang) in ((1920, 1, None, 'en'), (1366, 3, None, 'en')):
            go(pg, '#/', 900); pg.screenshot(path=S + f'v45_a_rank_{w}_{nk}.png')
            go(pg, '#/shop', 900); pg.screenshot(path=S + f'v45_a_shop_{w}_{nk}.png')
        cx.close()

    # ---- b: admin pickers with one kid use the full width on a computer
    cx, pg = ctx(b, db_with(None, 1, 1), 1366, 900, 'th')
    for r in ('attendance', 'redeem'):
        go(pg, '#/admin/' + r, 1200)
        wl = pg.evaluate("(() => { const g = document.querySelector('#view .att-list, #view .options'); const c = [...g.children].find(x => x.getBoundingClientRect().width); return [g.getBoundingClientRect().width, c.getBoundingClientRect().width]; })()")
        check(abs(wl[0] - wl[1]) < 4, f'b {r}: one kid fills the picker width ({wl[1]:.0f} of {wl[0]:.0f})')
    cx.close()

    # ---- c: points history + undo
    d = db_with(None, 3, 1)
    yest = (datetime.datetime.now() - datetime.timedelta(days=1)).replace(hour=10, minute=5).astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    d['points'].append({'id': 'p2', 'kid_id': k[1], 'skill': 'bonus', 'amount': 20, 'note': '', 'created_at': yest})
    d['points'][0]['created_at'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    for lang in ('th', 'en'):
        cx, pg = ctx(b, d, 390, 844, lang)
        go(pg, '#/admin/history', 1200)
        heads = pg.locator('.hist-day').all_inner_texts()
        check(heads[:2] == (['วันนี้', 'เมื่อวาน'] if lang == 'th' else ['Today', 'Yesterday']), f'c {lang}: day headers {heads}')
        times = pg.locator('.hist-time').all_inner_texts()
        check(len(times) == 2 and all(re.fullmatch(r'\d\d:\d\d', x) for x in times), f'c {lang}: every row shows its time {times}')
        cls = pg.locator('[data-del]').first.get_attribute('class')
        check('quiet' in cls and 'danger' not in cls, f'c {lang}: ลบ is a quiet button ({cls})')
        # give +10 to two kids, then undo
        go(pg, '#/admin/points', 1000)
        pg.locator('[data-s]').first.click(); pg.wait_for_timeout(400)
        pg.locator('[data-a="10"]').click(); pg.locator('#amtGo').click(); pg.wait_for_timeout(800)
        pg.locator('.options [data-k]').nth(0).click(); pg.wait_for_timeout(200); pg.locator('.options [data-k]').nth(1).click(); pg.wait_for_timeout(200)
        pg.locator('#give').click(); pg.wait_for_timeout(900)
        n0 = pg.evaluate("JSON.parse(localStorage.getItem('ya_preview_db')).points.length")
        check(pg.locator('#undoBar').is_visible(), f'c {lang}: undo bar shows after giving points')
        if lang == 'th': pg.screenshot(path=S + 'v45_c_undo.png')
        pg.locator('#undoGo').click(); pg.wait_for_timeout(500)
        msg = pg.locator('#dlgForm p').first.inner_text()
        check('Tommy' in msg or 'Maximilian' in msg or 'ต้นกล้า' in msg, f'c {lang}: undo warning names the kids ({msg[:60]})')
        pg.locator('#dlgForm button[value=ok]').click(); pg.wait_for_timeout(800)
        n1 = pg.evaluate("JSON.parse(localStorage.getItem('ya_preview_db')).points.length")
        check(n1 == n0 - 2 and not pg.locator('#undoBar').count(), f'c {lang}: undo removed exactly the 2 new rows ({n0} → {n1})')
        go(pg, '#/admin/history', 1000)
        if lang == 'th': pg.screenshot(path=S + 'v45_c_history.png')
        cx.close()

    # ---- d: new program with a Thai name
    for lang in ('th', 'en'):
        cx, pg = ctx(b, db_with(None, 1, 1), 390, 844, lang)
        go(pg, '#/admin/programs', 1500)
        pg.locator('#progNew').click(); pg.wait_for_timeout(400)
        pg.locator('#dlgForm [name=name]').fill('คริสต์มาสเด็กเล็ก'); pg.locator('#dlgForm [name=name]').dispatch_event('input')
        sv = pg.locator('#dlgForm [name=slug]').input_value()
        check(re.fullmatch(r'program-\d{4}-\d\d', sv) is not None, f'd {lang}: a Thai name suggests a link name ({sv})')
        pg.locator('#dlgForm [name=slug]').fill('testing-new-program'); pg.locator('#dlgForm button[value=ok]').click(); pg.wait_for_timeout(400)
        e = pg.locator('#slugErr')
        check(pg.locator('#dlg').evaluate('d => d.open') and e.is_visible(), f'd {lang}: a used link name keeps the box open with the error under the field ({e.inner_text() if e.count() else ""})')
        check(pg.locator('#dlgForm [name=name]').input_value() == 'คริสต์มาสเด็กเล็ก', f'd {lang}: the typed name is kept')
        pg.locator('#dlgForm [name=slug]').fill('ภาษาไทย'); pg.locator('#dlgForm button[value=ok]').click(); pg.wait_for_timeout(300)
        check(pg.locator('#dlg').evaluate('d => d.open') and e.is_visible(), f'd {lang}: a Thai link name shows the error, box stays open')
        if lang == 'th': pg.screenshot(path=S + 'v45_d_err.png')
        pg.locator('#dlgForm [name=slug]').fill('kids-christmas'); pg.locator('#dlgForm button[value=ok]').click(); pg.wait_for_timeout(1500)
        check(not pg.locator('#dlg').evaluate('d => d.open') and pg.locator('.prog-row.just-made').count() == 1, f'd {lang}: created, the new card is lit up')
        cx.close()

    b.close()
print('\n'.join(errs) if errs else 'no errors')
