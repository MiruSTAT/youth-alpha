# v46: the owner's fix list. (a) visits = see-through label bottom-right (eye line icon, no emoji); (b) the open kids' tab is
# one tile over icon + label; (c) attendance without ลา (old ลา rows still shown); (d) cutscene switch (Music settings);
# (e) maintenance timer (super admin) + a passed timer counts as off; (f) new "Coming next" list; (g) data tools: files only.
# Run: tools/preview.sh t_v46_fixes      Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os, datetime
from playwright.sync_api import sync_playwright
exec(open(os.path.join(os.path.dirname(__file__), 't_v38_data.py')).read().split('with sync_playwright() as p:')[0])   # same seed + helpers

KID = '11111111-1111-1111-1111-111111111111'
TODAY = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime('%Y-%m-%d')
def iso(mins): return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=mins)).strftime('%Y-%m-%dT%H:%M:%S.000Z')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- a + b: kids' home, phone and PC
    for w in (390, 1366):
        cx, pg = ctx(b, seed_db(sup=False, sw=True), w, 860)
        go(pg, '#/', 2200)
        v = pg.evaluate("""() => { const e = document.querySelector('.visit-pill'); if (!e) return null; const r = e.getBoundingClientRect(),
          n = document.querySelector('#kidNav').getBoundingClientRect(), s = getComputedStyle(e);
          return { right: Math.round(innerWidth - r.right), bottomGap: Math.round(n.top - r.bottom), svg: !!e.querySelector('svg'), txt: e.textContent, bg: s.backgroundColor }; }""")
        check(v and v['svg'] and '1,234' in v['txt'] and '👀' not in v['txt'], f'a {w}: visits label with eye icon, no emoji {v}')
        check(v and 0 <= v['right'] <= 20 and v['bottomGap'] >= 0 and 'rgba' in v['bg'], f'a {w}: bottom-right, above the tab bar, see-through {v}')
        hc = pg.inner_text('#homeCount')
        check('56' in hc and '1,234' not in hc, f'a {w}: feedback count stays under the title, visits not there ({hc!r})')
        t = pg.evaluate("""() => { const a = document.querySelector('#kidNav a.active'), r = a.getBoundingClientRect(), s = getComputedStyle(a, '::before'),
          ic = a.querySelector('span').getBoundingClientRect(), lb = a.querySelector('b').getBoundingClientRect();
          const top = r.top + parseFloat(s.top), bot = r.bottom - parseFloat(s.bottom);
          return { bg: s.backgroundColor, covers: top <= ic.top && bot >= lb.bottom, spanBg: getComputedStyle(a.querySelector('span')).backgroundColor }; }""")
        check(t['bg'] not in ('rgba(0, 0, 0, 0)', 'transparent') and t['covers'] and t['spanBg'] == 'rgba(0, 0, 0, 0)', f'b {w}: the open tab tile covers icon + label {t}')
        pg.screenshot(path=S + f'v46_home_{w}.png')
        go(pg, '#/shop', 1200)
        check(pg.locator('.visit-pill').count() == 0, f'a {w}: no visits label on other pages')
        cx.close()

    # ---- c: attendance without ลา; an old ลา row is still shown
    d = seed_db(); d['attendance'] = []
    cx, pg = ctx(b, d)
    go(pg, '#/admin/attendance', 1600)
    check(pg.locator('.att .chip.leave').count() == 0 and pg.locator('.att .chip.absent').count() == 1, 'c: only มา / ขาด chips')
    check(pg.locator('.summary .c-leave').count() == 0, 'c: no ลา total')
    pg.click('#multi'); pg.wait_for_timeout(300)
    check(pg.locator('[data-bulk="leave"]').count() == 0 and pg.locator('[data-bulk="absent"]').count() == 1, 'c: Select many has no ลา')
    cx.close()
    d = seed_db(); d['attendance'] = [{'kid_id': KID, 'day': TODAY, 'session': 'main', 'status': 'leave'}]
    cx, pg = ctx(b, d)
    go(pg, '#/admin/attendance', 1600)
    check(pg.locator('.att .chip.leave.on').count() == 1 and pg.locator('.summary .c-leave').count() == 1, 'c: a kid already on ลา keeps the chip and the total')
    go(pg, '#/admin/attsum', 1500)
    check(pg.locator('.summary .c-leave').count() == 1, 'c: totals page shows ลา only because there is an old ลา row')
    cx.close()
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/attsum', 1500)
    check(pg.locator('.summary .c-leave').count() == 0 and pg.locator('.summary > div').count() == 2, 'c: totals page without ลา when there is none')
    cx.close()

    # ---- d: cutscene switch
    cx, pg = ctx(b, seed_db(), 1366, 860)
    go(pg, '#/admin/musicset', 1600)
    check(pg.locator('[data-mo="cutscene"]').count() == 1, 'd: switch on the Music settings page')
    pg.click('[data-mo="cutscene"]'); pg.wait_for_timeout(800)
    check((dbnow(pg)['settings'].get('music') or {}).get('cutscene') is False, 'd: switching it off is saved')
    cx.close()
    for on in (True, False):
        d = seed_db(sup=False); d['settings']['music'] = {} if on else {'cutscene': False}
        cx, pg = ctx(b, d, 1366, 860)
        go(pg, '#/', 2500)
        pg.evaluate("for (let i = 0; i < 5; i++) document.querySelector('#scene').dispatchEvent(new MouseEvent('click', {bubbles: true}))")
        pg.wait_for_timeout(500)
        cs = pg.locator('.cutscene').count(); fe = pg.evaluate("document.body.classList.contains('festive')")
        check(cs == (1 if on else 0) and (on or fe), f'd: cutscene {"shown" if on else "skipped, special mode starts at once"} (cutscene={cs}, festive={fe})')
        cx.close()

    # ---- e: maintenance timer
    cx, pg = ctx(b, seed_db(), 1366, 860)
    go(pg, '#/admin/programs', 1500)
    pg.click('[data-maint="1"]'); pg.wait_for_timeout(400)
    check(pg.locator('#dlgForm select[name="min"] option').count() == 8, 'e: timer choices in the start box')
    pg.select_option('#dlgForm select[name="min"]', '30'); pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(500)
    check('30' in pg.inner_text('#dlgForm'), 'e: the warning says the timer')
    pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(1200)
    m = dbnow(pg)['programs'][0]['maintenance']
    left = (datetime.datetime.fromisoformat(m['until'].replace('Z', '+00:00')) - datetime.datetime.now(datetime.timezone.utc)).total_seconds() / 60
    check(m.get('on') is True and 28 < left <= 30.1, f'e: saved with a 30-minute timer ({left:.1f} min)')
    check('⏱' in pg.inner_text('.prog-maint'), 'e: the program card shows when it ends')
    go(pg, '#/admin', 1500)
    check(pg.locator('#maintBar').is_visible() and '⏱' in pg.inner_text('#maintBar'), f'e: the orange bar shows the time left ({pg.inner_text("#maintBar")[-40:]})')
    pg.screenshot(path=S + 'v46_maint_bar.png', clip={'x': 0, 'y': 0, 'width': 1366, 'height': 200})
    cx.close()
    # custom minutes
    cx, pg = ctx(b, seed_db(), 1366, 860)
    go(pg, '#/admin/programs', 1500)
    pg.click('[data-maint="1"]'); pg.wait_for_timeout(400)
    pg.fill('#dlgForm input[name="other"]', '45'); pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(500)
    pg.click('#dlgForm button[value="ok"]'); pg.wait_for_timeout(1200)
    m = dbnow(pg)['programs'][0]['maintenance']
    left = (datetime.datetime.fromisoformat(m['until'].replace('Z', '+00:00')) - datetime.datetime.now(datetime.timezone.utc)).total_seconds() / 60
    check(43 < left <= 45.1, f'e: typed 45 minutes is used ({left:.1f} min)')
    cx.close()
    # kids: a timer still running = scene; a passed timer = normal app; ends while open = the app comes back by itself
    for until, scene in ((iso(30), True), (iso(-1), False)):
        cx, pg = ctx(b, seed_db(sup=False, maint={'on': True, 'scene': 'tree', 'until': until}))
        go(pg, '#/', 2000)
        check(pg.locator('.maint-scene').count() == (1 if scene else 0), f'e: kid with timer {"running" if scene else "passed"}: scene={scene}')
        cx.close()
    cx, pg = ctx(b, seed_db(sup=False, maint={'on': True, 'scene': 'tree', 'until': iso(0.15)}))
    go(pg, '#/', 1500)
    check(pg.locator('.maint-scene').count() == 1, 'e: scene while the last seconds run')
    pg.wait_for_timeout(26000)
    check(pg.locator('.maint-scene').count() == 0 and pg.locator('.rank-row').count() > 0, 'e: timer ran out → the kids\' app is back without anyone switching it off')
    cx.close()

    # ---- f + g: Coming next list, data tools
    cx, pg = ctx(b, seed_db(), 1366, 860)
    go(pg, '#/admin/ai', 1800)
    items = pg.eval_on_selector_all('.sa-next li', 'els => els.map(e => e.textContent)')
    check(len(items) == 5 and not any('Visits' in x or 'Maintenance mode' in x or 'ปิดปรับปรุง' in x for x in items), f'f: new Coming next list {items}')
    go(pg, '#/admin/data', 2200)
    check(pg.locator('#dtSql').count() == 1 and pg.locator('#dtRun, #dtQ, #dtIns').count() == 0, 'g: data tools = files only')
    with pg.expect_download() as dl: pg.click('#dtSql')
    check('CREATE TABLE' in open(dl.value.path(), encoding='utf-8').read(), 'g: the .sql file still downloads')
    cx.close()
    b.close()

print('\n'.join(errs) if errs else 'no errors')
