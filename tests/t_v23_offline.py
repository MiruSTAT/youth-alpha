from playwright.sync_api import sync_playwright
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='allow')
    cx.add_init_script("localStorage.getItem('ya_tour') || localStorage.setItem('ya_tour', JSON.stringify({ done: true, last: Date.now(), n: 0 }))")
    cx.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript', headers={'access-control-allow-origin':'*'}))
    cx.route('**/supabase.js', lambda r: r.fulfill(path=V+'supabase.js', content_type='application/javascript', headers={'access-control-allow-origin':'*'}))
    cx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='/* fonts */', content_type='text/css', headers={'access-control-allow-origin':'*'}))
    cx.route('**/i.ytimg.com/**', lambda r: r.fulfill(body=b'', content_type='image/png'))
    pg=cx.new_page()
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(U); pg.wait_for_timeout(2500)
    print('sw controlling:', pg.evaluate("!!navigator.serviceWorker.controller"), '| caches', pg.evaluate("caches.keys()"))
    pg.goto(U+'#/songs'); pg.wait_for_timeout(2500)
    print('songs:', pg.locator('.song-card').count(), '| saved note shown:', pg.is_visible('#offNote'), pg.inner_text('#offNote') if pg.is_visible('#offNote') else '')
    print('shell files saved:', pg.evaluate("caches.open('ya-v23').then(c=>c.keys()).then(k=>k.map(r=>r.url.replace(location.origin,'')))"))
    print('kept files:', pg.evaluate("caches.open('ya-keep-1').then(c=>c.keys()).then(k=>k.map(r=>r.url.slice(0,70)))"))
    # ---- no internet
    cx.set_offline(True)
    pg.reload(); pg.wait_for_timeout(2500)
    print('OFFLINE reload -> song list:', pg.locator('.song-card').count(), '| offline bar:', pg.inner_text('#offBar') if pg.is_visible('#offBar') else 'hidden')
    pg.locator('.song-card').nth(1).click(); pg.wait_for_timeout(1500)
    print('OFFLINE song: lyric lines', pg.locator('#lyrics .ln').count(), '| sheet picture loaded:', pg.evaluate("[...document.querySelectorAll('.sheet-img img')].map(i=>i.complete && i.naturalWidth>0)"),
          '| video box:', pg.locator('#ytGo').count(), '| note:', [x for x in pg.eval_on_selector_all('.sync-note','e=>e.map(x=>x.innerText)')])
    pg.screenshot(path='/tmp/s23/20_offline_song.png')
    pg.goto(U+'#/'); pg.wait_for_timeout(1500); pg.screenshot(path='/tmp/s23/21_offline_home.png'); print('OFFLINE home ok:', pg.locator('.sheet-title').count(), '| tree 3D:', pg.evaluate("!document.body.classList.contains('no-webgl')"))
    # ---- the "last good answer" helper used for the live database
    print('cached():', pg.evaluate("""import('./js/data.js?v=23').then(async m => {
      const a = await m.cached('t1', async () => [1,2,3]);
      const b = await m.cached('t1', async () => { throw new Error('offline'); });
      const stale1 = m.net.stale;
      const c = await m.cached('t1', () => new Promise(r => setTimeout(() => r([9]), 400)), 100);
      const d = await m.cached('t2', async () => { throw new Error('offline'); }).catch(e => 'no saved copy -> error');
      return JSON.stringify({ fresh: a, afterFail: b, stale1, slow: c, d });
    })"""))
    cx.set_offline(False); pg.wait_for_timeout(800); print('back online -> bar hidden:', not pg.is_visible('#offBar'))
    # English labels (reload so the language applies)
    pg.evaluate("localStorage.setItem('ya_lang','en')"); pg.goto(U+'#/admin'); pg.reload(); pg.wait_for_timeout(800)
    pg.fill('input[name=email]','admin'); pg.fill('input[name=pw]','preview1'); pg.click('button[value=in]'); pg.wait_for_timeout(1200)
    print('EN menu', pg.eval_on_selector_all('.menu a .mt', 'e=>e.map(x=>x.innerText.replace(/\\n/g," — "))'))
    b.close()
print('\n'.join(errs) or 'no errors')
