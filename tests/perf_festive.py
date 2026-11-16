from playwright.sync_api import sync_playwright
import sys, json
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'
SEED = """
(() => { if (localStorage.getItem('ya_preview_db')) return;
  const iso = () => new Date().toISOString();
  const kids = Array.from({length: 26}, (_, i) => ({ id: 'k' + String(i).padStart(2,'0') + '0000-0000-0000-0000-000000000000', nickname: 'เด็กคนที่ ' + (i+1), avatar: ['⛄','🦌','🐧','🦊','🎅','🐱'][i%6], grp: '', active: true, created_at: iso() }));
  const points = kids.map((k, i) => ({ id: 'p' + i, kid_id: k.id, skill: 'music', detail: '', amount: 10 + i * 7, note: '', attendance_id: null, created_at: iso() }));
  localStorage.setItem('ya_preview_db', JSON.stringify({ kids, attendance: [], rounds: [], points, money: [], settings: { attendance_points: 10 }, loggedIn: false, items: [], events: [], feedback: [], audit: [], redemptions: [] }));
  localStorage.setItem('ya_tour', JSON.stringify({ done: true, last: Date.now(), n: 0 })); })();
"""
MEAS = """(ms) => new Promise(res => { const t = []; let last = performance.now(), end = last + ms;
  const f = (now) => { t.push(now - last); last = now; now < end ? requestAnimationFrame(f) : done(); };
  const done = () => { t.shift(); t.sort((a,b)=>a-b); const avg = t.reduce((a,b)=>a+b,0)/t.length;
    res({ fps: +(1000/avg).toFixed(1), p95: +t[Math.floor(t.length*0.95)].toFixed(1), worst: +t[t.length-1].toFixed(1), over50: t.filter(x=>x>50).length, layers: document.getAnimations().length }); };
  requestAnimationFrame(f); })"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
    cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
    cx.add_init_script(SEED); pg=cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    cdp=cx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.goto(U); pg.wait_for_timeout(3000)
    pg.mouse.click(195, 200); pg.wait_for_timeout(1500)           # first tap: music starts
    m=lambda ms=4000: pg.evaluate(MEAS, ms)
    def tap5():
        for _ in range(5): pg.mouse.click(195, 220); pg.wait_for_timeout(90)
    print('music playing', pg.evaluate("document.querySelector('#musicBtn').textContent"))
    print('1 normal            ', m())
    tap5(); print('2 cutscene (0-4s)   ', m()); pg.wait_for_timeout(2500)
    print('  festive on?', pg.evaluate("document.body.classList.contains('festive')"))
    print('3 special mode steady', m())
    pg.evaluate("window.scrollTo(0, 600)"); pg.wait_for_timeout(300); print('3b same, scrolled list', m()); pg.evaluate("window.scrollTo(0, 0)")
    if 'parts' in sys.argv:
        pg.evaluate("document.body.classList.remove('festive')"); pg.wait_for_timeout(500); print('  - without glow CSS  ', m()); pg.evaluate("document.body.classList.add('festive')")
        pg.click('#musicBtn'); pg.wait_for_timeout(500); print('  - without music     ', m()); pg.click('#musicBtn'); pg.wait_for_timeout(500)
    tap5(); pg.wait_for_timeout(1500); print('  festive on?', pg.evaluate("document.body.classList.contains('festive')"))
    print('4 after turning off ', m()); pg.wait_for_timeout(8000); print('5 10 s later        ', m())
    tap5(); pg.wait_for_timeout(7000); tap5(); pg.wait_for_timeout(3000); print('6 after a 2nd round ', m())
    print('audio nodes hint:', pg.evaluate("performance.memory ? Math.round(performance.memory.usedJSHeapSize/1e6)+' MB heap' : 'n/a'"))
    b.close(); print(errs or 'no errors')
