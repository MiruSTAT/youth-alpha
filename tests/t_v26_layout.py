from playwright.sync_api import sync_playwright
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'; errs=[]
SEED="""(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1);
  localStorage.setItem('ya_tour', JSON.stringify({ done: true, last: Date.now(), n: 0 }));
  localStorage.setItem('ya_preview_db', JSON.stringify({ kids: [], attendance: [], rounds: [], points: [], money: [], settings: { attendance_points: 10 }, loggedIn: true, items: [], events: [], feedback: [], audit: [], redemptions: [],
    sa: { user: { username: 'Miruku', pw: '1234' }, asSuper: true, unlocked: true, until: new Date(Date.now()+12*3600e3).toISOString() } })); })();"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
    cx.add_init_script(SEED); pg=cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.route('**/i.ytimg.com/**', lambda r: r.fulfill(body=b'', content_type='image/png'))
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    def go(h,w=1200): pg.goto(U+h); pg.wait_for_timeout(w)
    go('#/admin/super', 1800); pg.screenshot(path='/tmp/s23/40_super.png', full_page=True)
    print('handoff folded:', pg.evaluate("!document.querySelector('.ho-all').open"), '| state:', pg.inner_text('#hoState'))
    pg.click('.ho-all > summary'); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/s23/41_super_open.png', full_page=True)
    print('sections:', pg.eval_on_selector_all('.ho-sec summary span:first-child','e=>e.map(x=>x.innerText)')[:5])
    go('#/admin/musicset'); pg.screenshot(path='/tmp/s23/42_music_off.png', full_page=True)
    print('groups:', pg.eval_on_selector_all('.sw-card summary b','e=>e.map(x=>x.innerText)'))
    pg.click('#swSimple'); pg.wait_for_timeout(700); pg.screenshot(path='/tmp/s23/43_music_on.png', full_page=True)
    print('simple on toast:', pg.inner_text('#toast'), '| note:', pg.locator('.simple-note').count())
    go('#/admin/songs'); pg.locator('.li.click').nth(1).click(); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelector('.sw-card').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/s23/44_song_card.png')
    print('song card folded:', pg.evaluate("!document.querySelector('.sw-card').open"), '|', pg.text_content('.sw-card .simple-note')[:80])
    go('#/songs'); pg.locator('.song-card').nth(1).click(); pg.wait_for_timeout(1200); pg.screenshot(path='/tmp/s23/45_kid_song.png')
    print('kid song: lyrics visible', pg.is_visible('#lyrics'), '| video', pg.locator('#ytGo').count(), '| sheet', pg.locator('#orig').count(), '| dock', pg.locator('#songDock').count())
    go('#/admin/musicset'); pg.click('#swSimple'); pg.wait_for_timeout(700)
    go('#/songs'); pg.locator('.song-card').nth(1).click(); pg.wait_for_timeout(1200)
    print('simple off -> lyrics visible', pg.is_visible('#lyrics'), '| dock', pg.locator('#songDock').count())
    go('#/admin/super', 1500); pg.click('#saLock'); pg.wait_for_timeout(400); print('sign-out warning:', pg.inner_text('#dlgForm p').replace('\n',' / '))
    pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(1500); print('after sign-out:', pg.inner_text('.page-title'), '| login form', pg.locator('#lf').count())
    b.close()
print('\n'.join(errs) or 'no errors')
