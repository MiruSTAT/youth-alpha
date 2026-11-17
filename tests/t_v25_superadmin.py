from playwright.sync_api import sync_playwright
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'; errs=[]
BASE = """(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1);
  localStorage.setItem('ya_tour', JSON.stringify({ done: true, last: Date.now(), n: 0 }));
  localStorage.setItem('ya_preview_db', JSON.stringify({ kids: [], attendance: [], rounds: [], points: [], money: [], settings: { attendance_points: 10 }, loggedIn: %s, items: [], events: [], feedback: [], audit: [], redemptions: [], sa: %s })); })();"""
def run(name, logged, sa, steps):
    with sync_playwright() as p:
        b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
        cx.add_init_script(BASE % (logged, sa))
        cx.grant_permissions(['clipboard-read','clipboard-write'])
        pg=cx.new_page()
        pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript'))
        pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
        pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
        pg.on('pageerror',lambda e: errs.append(name+' PAGEERR '+str(e)))
        pg.on('console',lambda m: errs.append(name+' CONSOLE '+m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
        print('=====', name); steps(pg); b.close()

def claim(pg):
    pg.goto(U+'#/admin'); pg.wait_for_timeout(1500); pg.screenshot(path='/tmp/s23/30_claim.png')
    print('claim page:', pg.inner_text('.page-title'), '| username prefilled:', pg.input_value('[name=u]'))
    pg.fill('[name=p]','1234'); pg.fill('[name=p2]','1234'); pg.click('#sac button'); pg.wait_for_timeout(400)
    print('weak warning:', pg.inner_text('#dlgForm p').replace('\n',' / ')); pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(1800)
    print('after claim hash:', pg.evaluate('location.hash'), '| title:', pg.inner_text('.page-title'))
run('first-time claim', 'true', "{ asSuper: true }", claim)

def login(pg):
    pg.goto(U+'#/admin'); pg.wait_for_timeout(1200)
    pg.fill('input[name=email]','miruku'); pg.fill('input[name=pw]','9999'); pg.click('button[value=in]'); pg.wait_for_timeout(1200)
    print('wrong password ->', pg.inner_text('#toast'))
    pg.fill('input[name=email]','Miruku'); pg.fill('input[name=pw]','1234'); pg.click('button[value=in]'); pg.wait_for_timeout(1500)
    pg.screenshot(path='/tmp/s23/31_linksent.png'); print('link sent page:', pg.inner_text('.sa-step').replace('\n',' / ')[:200])
    # simulate opening the email link on this device: signed in as the owner, address has #access_token
    pg.evaluate("""(() => { const d = JSON.parse(localStorage.getItem('ya_preview_db')); d.loggedIn = true; d.sa.asSuper = true; localStorage.setItem('ya_preview_db', JSON.stringify(d)); })()""")
    pg.goto(U+'#access_token=fake&type=magiclink'); pg.reload(); pg.wait_for_timeout(2600)
    print('after link hash:', pg.evaluate('location.hash'), '| title:', pg.inner_text('.page-title'))
    pg.wait_for_timeout(1200); pg.screenshot(path='/tmp/s23/32_super.png'); pg.screenshot(path='/tmp/s23/32b_super_full.png', full_page=True)
    print('handoff state:', pg.inner_text('#hoState'), '| sections:', pg.locator('.ho-sec').count())
    print('install switch on?', pg.evaluate("document.querySelector('#swInstall').classList.contains('on')"))
    pg.click('#swInstall'); pg.wait_for_timeout(500); print('toggle ->', pg.inner_text('#toast'), pg.evaluate("JSON.parse(localStorage.getItem('ya_preview_db')).settings.install_on"))
    pg.click('#hoCopy'); pg.wait_for_timeout(400); clip=pg.evaluate('navigator.clipboard.readText()'); print('copied prompt starts:', clip[:90].replace('\n',' '), '| length', len(clip))
    pg.goto(U+'#/admin'); pg.wait_for_timeout(1200); print('admin menu first group:', pg.inner_text('.grp'), '| items', pg.eval_on_selector_all('.menu a', 'e=>e.map(x=>x.dataset.k)')[:4])
    pg.goto(U+'#/menu'); pg.wait_for_timeout(900); print('kids menu install row now:', pg.locator('[data-m=install]').count())
    pg.goto(U+'#/admin'); pg.wait_for_timeout(1200); pg.click('#logout'); pg.wait_for_timeout(1500)
    print('after lock:', pg.inner_text('.page-title'), '|', pg.inner_text('.sa-step h2') if pg.locator('.sa-step h2').count() else '')
    pg.screenshot(path='/tmp/s23/33_locked.png')
run('login + link', 'false', "{ user: { username: 'Miruku', pw: '1234' } }", login)

def normal(pg):
    pg.goto(U+'#/admin'); pg.wait_for_timeout(1000); pg.fill('input[name=email]','admin'); pg.fill('input[name=pw]','xxxxxx'); pg.click('button[value=in]'); pg.wait_for_timeout(1200)
    print('normal admin menu:', pg.eval_on_selector_all('.menu a', 'e=>e.map(x=>x.dataset.k)')); pg.goto(U+'#/admin'); pg.wait_for_timeout(900); print('normal admin on #/admin ->', pg.inner_text('.page-title'))
run('normal admin', 'false', "{}", normal)
print('\n'.join(errs) or 'no errors')
