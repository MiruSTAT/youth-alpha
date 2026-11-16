from playwright.sync_api import sync_playwright
import json
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'; errs=[]
SEED = open('/tmp/t31.py').read().split('SEED = """')[1].split('"""')[0].replace("['ลูกบอล', '⚽', 400]]", "['ลูกบอล', '⚽', 400], ['รูปที่อัปโหลด', 'sheets/jingle-bells.jpg', 30]]").replace("localStorage.setItem('ya_tour'", "localStorage.setItem('ya_me','k000000-0000-0000-0000-000000000000'); localStorage.setItem('ya_tour'")
XLSTUB = "window.__xl=[];window.XLSX={utils:{book_new:()=>({s:[]}),json_to_sheet:(d)=>({rows:d}),book_append_sheet:(wb,ws,n)=>{wb.s.push([n,ws.rows])}},writeFile:(wb,f)=>{window.__xl.push([f,wb.s])}};"
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
    cx.add_init_script(SEED); pg=cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.route('**/xlsx.full.min.js', lambda r: r.fulfill(body=XLSTUB, content_type='application/javascript'))
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    def go(h,w=900): pg.goto(U+h); pg.wait_for_timeout(w)
    go("", 1200)
    0 and pg.evaluate("""(() => { const d = JSON.parse(localStorage.getItem('ya_preview_db')); d.items.push({ id: 'i9', name: 'รูปที่อัปโหลด', icon: 'sheets/jingle-bells.jpg', price: 30, active: true, sort: 9 }); localStorage.setItem('ya_preview_db', JSON.stringify(d)); localStorage.setItem('ya_me','k000000-0000-0000-0000-000000000000'); })()""")
    pg.goto(U+'#/shop'); pg.reload(); pg.wait_for_timeout(1800)
    for iid, n in [('i2','01_zoom_emoji'), ('i1','02_zoom_svg'), ('i4','03_zoom_upload'), ('i3','04_zoom_toomuch')]:
        pg.locator(f'.slot[data-i="{iid}"]').scroll_into_view_if_needed(); pg.click(f'.slot[data-i="{iid}"]'); pg.wait_for_timeout(1000)
        print(n, '|', pg.inner_text('.prize-zoom').replace('\n',' / ')); pg.screenshot(path=f'/tmp/s23/{n}.png')
        pg.click('.prize-zoom'); pg.wait_for_timeout(250)
    print('zoom closed:', pg.locator('.prize-zoom').count() == 0)
    # install row hidden by default, shown when switched on
    go('#/menu'); print('install row (default):', pg.locator('[data-m=install]').count())
    cx.add_init_script("(() => { if (sessionStorage.getItem('io')) return; sessionStorage.setItem('io', 1); const d = JSON.parse(localStorage.getItem('ya_preview_db')); d.settings.install_on = true; localStorage.setItem('ya_preview_db', JSON.stringify(d)); })()")
    pg.reload(); pg.wait_for_timeout(1200); go('#/menu'); print('install row (switched on):', pg.locator('[data-m=install]').count())
    pg.click('[data-m=install]'); pg.wait_for_timeout(400); print('install steps:', pg.inner_text('#kidSheet .steps').replace('\n',' / ')); pg.screenshot(path='/tmp/s23/05_install.png')
    # version page
    pg.goto(U+'#/admin/about'); pg.reload(); pg.wait_for_timeout(1500)
    print('groups:', pg.eval_on_selector_all('.upd .ut b','e=>e.map(x=>x.innerText)'), '| versions shown in first:', pg.locator('.upd[open] .clog').count(), '| state:', pg.inner_text('#verState'))
    pg.screenshot(path='/tmp/s23/06_about.png'); pg.screenshot(path='/tmp/s23/06b_about_full.png', full_page=True)
    pg.click('#clogXl'); pg.wait_for_timeout(800); xl=pg.evaluate('window.__xl')
    print('changelog xlsx:', xl[0][0], '| rows', len(xl[0][1][0][1]), '| first', json.dumps(xl[0][1][0][1][0], ensure_ascii=False)[:260])
    print('versions in export:', sorted({r['เวอร์ชัน'] for r in xl[0][1][0][1]}))
    # festive + 3D pause sanity
    go('#/', 2500)
    print('3D:', pg.evaluate("import('./js/scene3d.js?v=25').then(m => JSON.stringify(m.info()))"))
    pg.evaluate("window.scrollTo(0, 2000)"); pg.wait_for_timeout(500); print('3D scrolled away:', pg.evaluate("import('./js/scene3d.js?v=25').then(m => JSON.stringify(m.info()))"))
    pg.evaluate("window.scrollTo(0, 0)"); pg.wait_for_timeout(500); print('3D back:', pg.evaluate("import('./js/scene3d.js?v=25').then(m => JSON.stringify(m.info()))"))
    for _ in range(5): pg.mouse.click(195, 220); pg.wait_for_timeout(90)
    pg.wait_for_timeout(3000); pg.screenshot(path='/tmp/s23/07_festive.png'); print('festive:', pg.evaluate("document.body.classList.contains('festive')"))
    b.close()
print('\n'.join(errs) or 'no errors')
