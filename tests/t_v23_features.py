from playwright.sync_api import sync_playwright
import json
V='/home/claude/youth-alpha/vendor/'; U='http://localhost:8766/'; errs=[]
SEED = """
(() => {
  if (localStorage.getItem('ya_preview_db')) return;
  const d = (n) => new Date(Date.now() - n * 864e5), iso = (n) => d(n).toISOString(), day = (n) => d(n).toISOString().slice(0, 10);
  const kids = ['มะลิ', 'ต้นกล้า', 'ใบเตย', 'ภูผา'].map((n, i) => ({ id: 'k' + i + '00000-0000-0000-0000-000000000000', nickname: n, avatar: ['⛄','🦌','🐧','🦊'][i], grp: '', active: true, created_at: iso(30) }));
  const pts = [[0, 150, 2], [0, 30, 20], [1, 40, 3], [2, 90, 1], [3, 10, 15]].map(([k, a, ago], i) => ({ id: 'p' + i, kid_id: kids[k].id, skill: 'music', detail: '', amount: a, note: '', attendance_id: null, created_at: iso(ago) }));
  const att = [];
  [[14, ['present','present','present','present']], [7, ['present','leave','present','absent']], [0, ['present','absent','present', null]]].forEach(([ago, sts], r) =>
    sts.forEach((s, i) => { if (s) att.push({ id: 'a' + r + i, kid_id: kids[i].id, day: day(ago), session: 'main', status: s, updated_at: iso(ago) }); }));
  const items = [['สติกเกอร์', '⭐', 20], ['ขนม', 'chipbag', 50], ['ตุ๊กตา', '🧸', 120], ['ลูกบอล', '⚽', 400]].map(([name, icon, price], i) => ({ id: 'i' + i, name, icon, price, active: true, sort: i }));
  const events = [];
  [['Jingle Bells', 5, 'devA'], ['Jingle Bells', 3, 'devB'], ['เปี่ยมรัก', 2, 'devA']].forEach(([t, n, dev]) => { for (let j = 0; j < n; j++) events.push({ id: events.length + 1, created_at: iso(1), device_id: dev + '00000', kid_id: null, event: 'song_open', detail: t, path: '#/songs' }); });
  localStorage.setItem('ya_preview_db', JSON.stringify({ kids, attendance: att, rounds: [], points: pts, money: [], settings: { attendance_points: 10 }, loggedIn: true, items, events, feedback: [], audit: [], redemptions: [] }));
  localStorage.setItem('ya_tour', JSON.stringify({ done: true, last: Date.now(), n: 0 }));
})();
"""
XLSTUB = "window.__xl=[];window.XLSX={utils:{book_new:()=>({s:[]}),json_to_sheet:(d)=>({rows:d}),book_append_sheet:(wb,ws,n)=>{wb.s.push([n,ws.rows])}},writeFile:(wb,f)=>{window.__xl.push([f,wb.s])}};"
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    cx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
    cx.add_init_script(SEED)
    pg=cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V+'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/i.ytimg.com/**', lambda r: r.fulfill(body=b'', content_type='image/png'))
    pg.route('**/xlsx.full.min.js', lambda r: r.fulfill(body=XLSTUB, content_type='application/javascript'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
    shot=lambda n: pg.screenshot(path=f'/tmp/s23/{n}.png')
    def go(h, w=700): pg.goto(U+h); pg.wait_for_timeout(w)
    go('#/admin', 1500); shot('01_admin_home'); pg.evaluate("window.scrollTo(0, 9999)"); pg.wait_for_timeout(200); shot('02_admin_home_bottom')
    print('menu items', pg.eval_on_selector_all('.menu a', 'e=>e.map(x=>x.dataset.k)'))
    print('about line', pg.inner_text('.menu [data-k="about"] .mt'))
    # --- redeem
    go('#/admin/redeem'); shot('03_redeem_kids')
    print('kids+balance', pg.eval_on_selector_all('.opt', 'e=>e.map(x=>x.innerText.replace(/\\n/g," | "))'))
    pg.click('.opt[data-n="มะลิ"]'); pg.wait_for_timeout(600); shot('04_redeem_prizes')
    print('prizes', pg.eval_on_selector_all('.opt', 'e=>e.map(x=>x.innerText.replace(/\\n/g," | ")+(x.disabled?" [disabled]":""))'))
    pg.click('.opt[data-i="i2"]'); pg.wait_for_timeout(400); shot('05_redeem_confirm')
    print('confirm text:', pg.inner_text('#dlgForm p').replace('\n',' / '))
    pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(800); shot('06_redeem_done')
    print('toast:', pg.inner_text('#toast'), '| hash', pg.evaluate('location.hash'))
    print('after: kids', pg.eval_on_selector_all('.opt', 'e=>e.map(x=>x.innerText.replace(/\\n/g," | "))')[:2], '| history', pg.eval_on_selector_all('.card .li', 'e=>e.map(x=>x.innerText.replace(/\\n/g," | "))'))
    # second redeem then undo it
    pg.click('.opt[data-n="มะลิ"]'); pg.wait_for_timeout(500); pg.click('.opt[data-i="i0"]'); pg.wait_for_timeout(300); pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(700)
    print('balance after 2 prizes', pg.inner_text('.opt[data-n="มะลิ"] .opt-sub'))
    pg.locator('[data-undo]').first.click(); pg.wait_for_timeout(300); print('undo warning:', pg.inner_text('#dlgForm p').replace('\n',' / ')); shot('07_redeem_undo_warn')
    pg.click('#dlgForm button[value=ok]'); pg.wait_for_timeout(700)
    print('balance after undo', pg.inner_text('.opt[data-n="มะลิ"] .opt-sub'), '| history rows', pg.locator('.card .li').count())
    # server-side guard (preview copy of it)
    print('guard:', pg.evaluate("import('./js/data.js?v=23').then(m => m.api.redeem({kid_id:'k300000-0000-0000-0000-000000000000', item_id:'i3', item_name:'x', item_icon:'⚽', price:400}).then(()=> 'ALLOWED (bad)', e => 'blocked: '+e.message))"))
    # --- notice
    go('#/admin/notice'); pg.fill('[name=announce]', 'อาทิตย์นี้อย่าลืมเอาแผ่นเพลงมานะ'); pg.fill('[name=verse_text]', 'ข้อความตัวอย่างสำหรับทดสอบ'); pg.fill('[name=verse_ref]', 'ลูกา 2:11'); shot('08_notice')
    pg.click('#saveN'); pg.wait_for_timeout(500); print('notice toast:', pg.inner_text('#toast'))
    # --- weekly + about
    go('#/admin/weekly', 900); pg.screenshot(path='/tmp/s23/09_weekly.png', full_page=True)
    print('weekly summary', pg.inner_text('.summary').replace('\n',' '))
    print('weekly cards', [c.replace('\n',' | ') for c in pg.eval_on_selector_all('.card', 'e=>e.map(x=>x.innerText)')])
    go('#/admin/about', 1200); pg.screenshot(path='/tmp/s23/10_about.png'); print('version state:', pg.inner_text('#verState'), '| entries', pg.locator('.clog').count(), '| first', pg.inner_text('.clog .clog-h'))
    # --- export
    go('#/admin/export'); pg.click('[data-x=all]'); pg.wait_for_timeout(1500)
    xl=pg.evaluate('window.__xl'); print('excel file', xl[0][0], '| sheets', [s[0] for s in xl[0][1]])
    print('summary row', json.dumps(xl[0][1][0][1][0], ensure_ascii=False)); print('prizes sheet', json.dumps([s for s in xl[0][1] if 'แลก' in s[0]][0][1], ensure_ascii=False)[:200])
    print('admin log rows about redemption', [json.dumps(r, ensure_ascii=False)[:160] for s in xl[0][1] if 'ผู้ดูแล' in s[0] or 'แก้ไข' in s[0] for r in s[1] if 'ตุ๊กตา' in json.dumps(r, ensure_ascii=False)][:2])
    # --- kid side
    pg.evaluate("localStorage.setItem('ya_me','k000000-0000-0000-0000-000000000000')")
    go('#/', 1800); shot('11_kid_home'); print('kid home notice:', pg.inner_text('.notice p'), '| my card:', pg.inner_text('#myCard').replace('\n',' | '))
    pg.evaluate("window.scrollTo(0, 9999)"); pg.wait_for_timeout(200); shot('12_kid_home_verse'); print('verse:', pg.inner_text('.verse').replace('\n',' | '))
    pg.evaluate("window.scrollTo(0, 0)"); pg.click('#myCard'); pg.wait_for_timeout(400); shot('13_kid_detail'); print('detail:', pg.inner_text('#kidSheet .cat-pts').replace('\n',' '))
    go('#/shop', 900); shot('14_kid_shop'); print('shop balance:', pg.inner_text('.shop-bal').replace('\n',' '))
    go('#/menu', 600); pg.click('[data-m=bible]'); pg.wait_for_timeout(300); print('bible sheet verse:', pg.locator('#kidSheet .verse').count()); shot('15_bible')
    # english check
    pg.evaluate("localStorage.setItem('ya_lang','en')"); go('#/admin/redeem', 800); shot('16_redeem_en'); go('#/admin', 800); print('EN menu', pg.eval_on_selector_all('.menu a b', 'e=>e.map(x=>x.innerText)'))
    b.close()
print('\n'.join(errs) or 'no errors')
