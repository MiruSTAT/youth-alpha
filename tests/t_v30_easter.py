# v30 Easter pack: pick Easter in program settings, reload, 3D scene (cross + eggs), lamb, special mode egg hunt
from playwright.sync_api import sync_playwright
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'; errs=[]
SEED=open('/tmp/t35.py').read().split('SEED="""')[1].split('"""')[0]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
    cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
    cx.add_init_script(SEED); pg=cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' and 'Failed to load' not in m.text else None)
    def go(h,w=1300): pg.goto(U+h); pg.wait_for_timeout(w)
    go('#/admin/look', 1800)
    pg.select_option('#lookForm [name=pack]', 'easter')
    print('easter ticks:', [pg.is_checked(f'#lookForm [name=f_{k}]') for k in ['tree','santa','festive','music']])
    pg.click('#lookForm [type=submit]'); pg.wait_for_timeout(700); print('brand:', pg.inner_text('.brand').replace('\n',' '))
    go('#/', 3000)
    print('pack:', pg.evaluate('document.body.dataset.pack'), '| flake:', pg.evaluate("getComputedStyle(document.body).getPropertyValue('--flake')"))
    pg.screenshot(path='/tmp/s23/80_easter_home.png')
    pg.evaluate("document.querySelector('#tour').hidden=true")
    box=pg.locator('#scene').bounding_box()
    for i in range(5): pg.mouse.click(box['x']+box['width']/2, box['y']+box['height']*0.5); pg.wait_for_timeout(120)
    pg.wait_for_timeout(1000); print('cutscene:', pg.inner_text('.cutscene .joy-title') if pg.locator('.cutscene .joy-title').count() else 'none')
    pg.screenshot(path='/tmp/s23/81_cutscene.png')
    pg.wait_for_timeout(2600); print('eggs:', pg.locator('.egg-hunt .egg').count(), '| counter:', pg.inner_text('.egg-count'))
    pg.screenshot(path='/tmp/s23/82_hunt.png')
    for i in range(3): pg.locator('.egg-hunt .egg:not(.found)').first.click(force=True); pg.wait_for_timeout(150)
    print('after 3:', pg.inner_text('.egg-count'))
    while pg.locator('.egg-hunt .egg:not(.found)').count(): pg.locator('.egg-hunt .egg:not(.found)').first.click(force=True); pg.wait_for_timeout(100)
    print('all:', pg.inner_text('.egg-count')); pg.screenshot(path='/tmp/s23/83_all.png')
    pg.wait_for_timeout(3800); print('hunt removed:', pg.locator('.egg-hunt').count()==0)
    # lamb
    pg.evaluate("santaPeek && 0") if False else None
    go('#/songs', 1500); print('songs title:', pg.inner_text('.sheet-title'))
    b.close()
print('\n'.join(errs) or 'no errors')
