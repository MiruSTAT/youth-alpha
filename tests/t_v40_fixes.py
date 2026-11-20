# v40: fixes from the v39 design critique (one section per step). Run: tools/preview.sh t_v40_fixes
# Env: YA_VENDOR, YA_CHROME, YA_SHOTS.
import json, os
from playwright.sync_api import sync_playwright
V = os.environ.get('YA_VENDOR', '/tmp/npm3/'); U = 'http://localhost:8766/'; S = os.environ.get('YA_SHOTS', '/tmp/shots/'); errs = []
CHROME = os.environ.get('YA_CHROME', '/usr/bin/google-chrome')
NOW = '2026-11-16T10:00:00.000Z'

def kid(i, name, av): return {'id': f'00000000-0000-0000-0000-00000000000{i}', 'nickname': name, 'avatar': av, 'grp': '', 'active': True, 'created_at': NOW}
def pts(i, kid_id, n): return {'id': f'p{i}', 'kid_id': kid_id, 'skill': 'bonus', 'amount': n, 'note': '', 'created_at': NOW}
KIDS = [kid(1, 'Mai', '🐱'), kid(2, 'Ton', '🦊'), kid(3, 'Bai', '🦋')]

def seed_db(points=(), look=None):
    return {'kids': KIDS, 'points': list(points), 'attendance': [], 'rounds': [], 'money': [], 'settings': {'attendance_points': 10, 'fb_open': True},
            'loggedIn': True, 'sa': {'user': {'username': 'Miruku', 'pw': '1234'}, 'asSuper': True, 'unlocked': True, 'until': '2099-01-01T00:00:00Z'},
            'programs': [{'id': 1, 'slug': 'youth-alpha-christmas-2026', 'name': 'Youth Alpha Christmas 2026', 'archived': False, 'look': look or {}, 'login_mode': 'off'}],
            'admins': [], 'events': []}

def ctx(b, db, w=390, h=844, rm=None):
    cx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1 if w >= 1000 else 2, is_mobile=w < 600, has_touch=True, service_workers='block', **({'reduced_motion': rm} if rm else {}))
    cx.add_init_script("if(!localStorage.getItem('ya_preview_db')){localStorage.setItem('ya_preview_db', %s);"
                       "localStorage.setItem('ya_tour', JSON.stringify({done:true,last:Date.now(),n:9}));}" % json.dumps(json.dumps(db)))
    cx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#tour{display:none!important}';document.head.append(s)})")
    pg = cx.new_page()
    pg.route('**/three.module.min.js', lambda r: r.fulfill(path=V + 'three.module.min.js', content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/supabase.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text and 'boom' not in m.text else None)
    return cx, pg

def go(pg, h, w=1300): pg.goto(U + h); pg.wait_for_timeout(w)
def check(cond, label):
    print(('OK   ' if cond else 'FAIL ') + label)
    if not cond: errs.append('FAIL ' + label)
def dbnow(pg): return json.loads(pg.evaluate("localStorage.getItem('ya_preview_db')"))
# make the fake database fail to save (its save() writes JSON.stringify(db) to the phone storage)
BREAK = "window._js=window._js||JSON.stringify;JSON.stringify=function(v,...a){if(v&&v.kids&&v.attendance)throw new Error('boom');return window._js.call(JSON,v,...a)}"
FIX = "JSON.stringify=window._js"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # ---- step 2a: everyone at zero -> no medals, no places, "let's start" line
    cx, pg = ctx(b, seed_db())
    go(pg, '#/')
    lst = pg.inner_text('.rank-list')
    check(all(m not in lst for m in '🥇🥈🥉'), 'zero points: no medals')
    check(pg.locator('.rank-row .n').all_inner_texts() == ['–'] * 3, 'zero points: a dash instead of a place')
    check('เริ่มเก็บคะแนนกันเลย!' in pg.inner_text('.start-line'), 'zero points: "เริ่มเก็บคะแนนกันเลย!" shown')
    pg.click('.rank-row >> nth=0'); pg.wait_for_timeout(500)
    check('ยังไม่มีคะแนน' in pg.inner_text('#kidSheet'), 'zero points: kid detail says "ยังไม่มีคะแนน" instead of a place')
    cx.close()

    # ---- step 2b: ties share the place and say so; nobody else is pushed up
    k = [x['id'] for x in KIDS]
    cx, pg = ctx(b, seed_db([pts(1, k[0], 20), pts(2, k[1], 20), pts(3, k[2], 10)]))
    go(pg, '#/'); pg.screenshot(path=S + 'v40_2_ties.png')
    n = pg.locator('.rank-row .n').all_inner_texts()
    check(n[0].startswith('🥇') and n[1].startswith('🥇') and 'เสมอ' in n[0] and 'เสมอ' in n[1], 'tie: both kids at 20 get 🥇 marked "เสมอ"')
    check(n[2].startswith('🥉') and 'เสมอ' not in n[2], 'tie: next kid is 3rd (🥉), not tied')
    check(pg.locator('.start-line').count() == 0, 'with points: no "let\'s start" line')
    pg.click('.rank-row >> nth=0'); pg.wait_for_timeout(500)
    check('เสมอ 2 คน' in pg.inner_text('#kidSheet'), 'tie: kid detail says "เสมอ 2 คน"')
    cx.close()

    # ---- step 2c: an admin error stays until closed, and "ลองใหม่" saves again
    cx, pg = ctx(b, seed_db())
    go(pg, '#/admin/attendance', 1600)
    pg.evaluate(BREAK)
    pg.locator('.att [data-s]').first.click(); pg.wait_for_timeout(3500)     # longer than the old 2.2 s toast
    check(pg.locator('#errBar').is_visible(), 'admin error: bar still shown after 3.5 s')
    check('ลองใหม่' in pg.inner_text('#errBar'), 'admin error: has a "ลองใหม่" button')
    pg.screenshot(path=S + 'v40_2_errbar.png')
    pg.evaluate(FIX); pg.click('#errRetry'); pg.wait_for_timeout(800)
    check(not pg.locator('#errBar').is_visible(), 'admin error: bar closes on retry')
    check(len(dbnow(pg)['attendance']) >= 1, 'admin error: retry saved the attendance')
    pg.evaluate(BREAK); pg.locator('.att [data-s]').nth(4).click(); pg.wait_for_timeout(600)
    pg.click('#errBar .x'); pg.wait_for_timeout(300)
    check(not pg.locator('#errBar').is_visible(), 'admin error: ✕ closes the bar')
    pg.evaluate(FIX)
    cx.close()

    # ---- step 3: layout of the kids' home (tree 30vh, own card first, hint under the 🏆 title)
    MORE = [kid(i, n, '🐶') for i, n in [(4, 'Fah'), (5, 'Nam'), (6, 'Pim'), (7, 'Bank'), (8, 'Ice')]]
    db3 = seed_db([pts(1, k[0], 30), pts(2, k[1], 20), pts(3, k[2], 10)]); db3['kids'] = KIDS + MORE
    db3['settings']['announce'] = 'ซ้อมร้องเพลงวันอาทิตย์ 9 โมง'
    cx, pg = ctx(b, db3)
    go(pg, '#/')
    sh = pg.evaluate("document.querySelector('#scene').getBoundingClientRect().height")
    check(abs(sh - 844 * .30) < 4, f'3: tree is 30vh on a phone ({sh:.0f}px)')
    check(pg.locator('.sheet .my-hint').count() == 0, '3: no separate hint box above the list')
    check(pg.locator('.rank-head .rank-hint').is_visible() and 'แตะชื่อ' in pg.inner_text('.rank-hint'), '3: hint sits under the 🏆 title')
    y0 = pg.evaluate("document.querySelector('.rank-row').getBoundingClientRect().top")
    check(y0 < 520, f'3: first ranking row starts higher (y={y0:.0f}, was 631)')
    pg.screenshot(path=S + 'v40_3_noname.png')
    pg.click('.rank-row >> nth=7'); pg.wait_for_timeout(500); pg.click('#thisMe'); pg.wait_for_timeout(500)
    go(pg, '#/')
    check(pg.evaluate("document.querySelector('.sheet').firstElementChild.id") == 'myCard', '3: own card is the first thing on the sheet')
    ym = pg.evaluate("document.querySelector('#myCard').getBoundingClientRect().top")
    check(ym < 300, f'3: own card near the top (y={ym:.0f}, was 489)')
    check(pg.locator('.rank-hint').count() == 0, '3: hint gone once a name is picked')
    pg.screenshot(path=S + 'v40_3_me.png')
    cx.close()
    # an order saved in the layout editor still wins (announcement first)
    db3['programs'][0]['look'] = {'layout': {'home': ['notice', 'me', 'rank', 'verse']}}
    cx, pg = ctx(b, db3)
    pg.add_init_script("localStorage.setItem('ya_me', '%s')" % MORE[4]['id'])
    go(pg, '#/')
    cls = pg.evaluate("document.querySelector('.sheet').firstElementChild.className")
    check('notice' in cls, f'3: a saved layout order is kept ({cls})')
    cx.close()
    # Normal mode: no tree, the hint has no 👇 emoji
    db3['programs'][0]['look'] = {'mode': 'normal'}
    cx, pg = ctx(b, db3)
    go(pg, '#/')
    check(pg.locator('.rank-hint').count() == 1 and '👇' not in pg.inner_text('.rank-hint'), 'normal mode: hint without the 👇 emoji')
    cx.close()
    # admin home and wide screen still draw without errors
    cx, pg = ctx(b, db3, 1366, 800); go(pg, '#/admin', 1600)
    check(pg.locator('main').inner_text().strip() != '', 'admin home draws at 1366 px')
    cx.close()

    # ---- step 4 distill: Normal mode is calm by default (no snow, no 3D scene), says "คุณ", points as a word
    db4 = json.loads(json.dumps(db3)); db4['items'] = [{'id': 'i1', 'name': 'Pen', 'price': 50, 'icon': '✏️', 'active': True, 'sort': 0}]
    db4['programs'][0]['look'] = {'mode': 'normal'}
    cx, pg = ctx(b, db4); go(pg, '#/', 1800)
    st = pg.evaluate("({tree: document.body.classList.contains('off-tree'), snow: document.body.classList.contains('off-snow'), hid: document.querySelector('#snow').hidden, scene: getComputedStyle(document.querySelector('#scene')).display, canv: document.querySelectorAll('#scene canvas').length})")
    check(st['tree'] and st['snow'] and st['hid'], f'4: Normal mode default: snow and 3D scene off ({st})')
    check(st['scene'] == 'none' and st['canv'] == 0, '4: Normal mode: no 3D scene drawn (no star under the top bar)')
    body = pg.inner_text('main')
    check('หนู' not in body, '4: Normal mode home never says "หนู"')
    check('แตะชื่อของคุณ' in pg.inner_text('.rank-hint'), '4: hint says "แตะชื่อของคุณ"')
    pt = pg.locator('.rank-row .pt').all_inner_texts()
    check(pt and all('⭐' not in x and 'คะแนน' in x for x in pt), f'4: points read "N คะแนน", no ⭐ ({pt[:2]})')
    pg.screenshot(path=S + 'v40_4_normal_home.png')
    pg.click('.rank-row >> nth=0'); pg.wait_for_timeout(500)
    check('⭐' not in pg.inner_text('#kidSheet') and 'หนู' not in pg.inner_text('#kidSheet'), '4: kid detail in Normal mode: no ⭐, no "หนู"')
    go(pg, '#/shop', 1500)
    sign = pg.locator('.stand-sign').all_inner_texts()
    check(not sign or '⭐' not in sign[0], f'4: shop sign without stars in Normal mode ({sign})')
    check('⭐' not in pg.inner_text('main'), '4: shop prices in Normal mode use the word, not ⭐')
    cx.close()
    # English Normal mode: "pts"
    cx, pg = ctx(b, db4); pg.add_init_script("localStorage.setItem('ya_lang','en')"); go(pg, '#/', 1500)
    pt = pg.locator('.rank-row .pt').all_inner_texts()
    check(pt and 'pts' in pt[0], f'4: English Normal mode says "pts" ({pt[:1]})')
    cx.close()
    # a part the super admin picked still wins (snow on), but the 3D scene never runs in Normal mode
    db4['programs'][0]['look'] = {'mode': 'normal', 'parts': {'fall': 'snow', 'scene': 'tree'}}
    cx, pg = ctx(b, db4); go(pg, '#/', 1800)
    st = pg.evaluate("({snow: document.body.classList.contains('off-snow'), canv: document.querySelectorAll('#scene canvas').length})")
    check(not st['snow'] and st['canv'] == 0, f'4: Normal mode: chosen snow stays on, 3D scene still not drawn ({st})')
    cx.close()
    # Kids mode is unchanged: "หนู", ⭐ and the tree
    db4['programs'][0]['look'] = {}
    cx, pg = ctx(b, db4); go(pg, '#/', 2200)
    check('หนู' in pg.inner_text('.rank-hint'), '4: Kids mode still says "หนู"')
    check('⭐' in pg.locator('.rank-row .pt').first.inner_text(), '4: Kids mode keeps the ⭐')
    check(not pg.evaluate("document.body.classList.contains('off-tree')"), '4: Kids mode keeps the tree on')
    cx.close()
    # admin in Normal mode: points as words there too, page draws
    db4['programs'][0]['look'] = {'mode': 'normal'}
    cx, pg = ctx(b, db4); go(pg, '#/admin', 1600)
    check(pg.locator('main').inner_text().strip() != '', '4: Normal mode admin draws')
    pg.screenshot(path=S + 'v40_4_normal_admin.png')
    cx.close()

    # ---- step 5 polish: name order, + / − amounts, menu group text, one shop title, room above the bottom bar
    NM = ['แบม', 'เอ', 'Zed', 'กล้า', 'โอ๊ต', 'Kid 10', 'Kid 2', 'น้ำ', 'ข้าว', 'ไผ่', 'มด', 'อิ่ม']
    db5 = seed_db(); db5['kids'] = [{**kid(1, n, '🐱'), 'id': f'00000000-0000-0000-0000-0000000001{i:02d}'} for i, n in enumerate(NM)]
    db5['cats'] = []; db5['items'] = [{'id': f'i{i}', 'name': n, 'icon': ic, 'price': pr, 'active': True, 'sort': i}
                                      for i, (n, ic, pr) in enumerate([('ขนม', '🍪', 20), ('ตุ๊กตา', '🧸', 50)])]
    WANT = ['กล้า', 'ข้าว', 'น้ำ', 'แบม', 'ไผ่', 'มด', 'อิ่ม', 'เอ', 'โอ๊ต', 'Kid 2', 'Kid 10', 'Zed']
    cx, pg = ctx(b, db5); go(pg, '#/admin/attendance', 1500)
    got = pg.eval_on_selector_all('.att .nm', 'e => e.map(x => x.textContent)')
    check(got == WANT, f'5: attendance A–Z with Thai rules (เ/แ/โ/ไ sorted by the consonant, Kid 2 before Kid 10) ({got})')
    pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(300)
    gap = pg.evaluate("(() => { const r = [...document.querySelectorAll('.att')].pop().getBoundingClientRect(), b = document.querySelector('.bottom-bar').getBoundingClientRect(); return b.top - r.bottom })()")
    check(gap >= 48, f'5: last attendance row ends ≥48 px above the finish bar ({gap:.0f})')
    pg.click('#multi'); pg.wait_for_timeout(300); pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); pg.wait_for_timeout(300)
    gap = pg.evaluate("(() => { const r = [...document.querySelectorAll('.att-pick')].pop().getBoundingClientRect(), b = document.querySelector('.bottom-bar').getBoundingClientRect(); return b.top - r.bottom })()")
    check(gap >= 48, f'5: bulk select: last row clear of the bar ({gap:.0f})')
    go(pg, '#/admin/points', 1200); pg.click('[data-s] >> nth=0'); pg.wait_for_timeout(500)
    rows = pg.evaluate("[...document.querySelectorAll('.amounts')].map(r => [...r.querySelectorAll('[data-a]')].map(x => +x.dataset.a))")
    check(rows == [[5, 10, 20, 50], [-5, -10]], f'5: + and − amounts in separate rows ({rows})')
    lab = pg.locator('.amt-label').all_inner_texts()
    check(lab == ['เพิ่มคะแนน', 'ลบคะแนน'], f'5: rows labelled "เพิ่มคะแนน" / "ลบคะแนน" ({lab})')
    pg.click('[data-a="-5"]'); pg.click('#amtGo'); pg.wait_for_timeout(400)   # v42: a tap picks, Next moves on
    check('-5' in pg.inner_text('.pw-sum'), '5: −5 then Next goes to step 3 with −5')
    go(pg, '#/admin', 1200)
    cut = pg.evaluate("[...document.querySelectorAll('.mgrp:not([open]) .mgrp-n')].filter(e => e.scrollWidth > e.clientWidth + 1 || getComputedStyle(e).textOverflow === 'ellipsis').length")
    full = pg.evaluate("[...document.querySelectorAll('.mgrp:not([open]) .mgrp-n')].map(e => e.getBoundingClientRect().width > 0).every(Boolean)")
    check(cut == 0 and full, f'5: admin menu group descriptions wrap, never cut with "…" ({cut} cut)')
    check(pg.evaluate("[...document.querySelectorAll('.mgrp-n')].some(e => e.textContent.includes('ผู้ดูแลและสิทธิ์') && e.getBoundingClientRect().right <= innerWidth)"), '5: "ผู้ดูแลและสิทธิ์" shown in full on a 390 px phone')
    pg.screenshot(path=S + 'v40_5_menu.png')
    go(pg, '#/shop', 1500)
    vis = pg.evaluate("[...document.querySelectorAll('.sheet h1, .stand-sign')].filter(e => e.getBoundingClientRect().width > 2).map(e => e.textContent.trim())")
    check(len(vis) == 1 and 'ร้านของรางวัล' in vis[0], f'5: kids shop shows its name once ({vis})')
    check(pg.locator('h1.sheet-title').count() == 1 and 'ร้านของรางวัล' in pg.locator('h1.sheet-title').text_content(), '5: shop h1 kept for screen readers')
    pg.screenshot(path=S + 'v40_5_shop.png')
    cx.close()
    db5['items'] = []
    cx, pg = ctx(b, db5); go(pg, '#/shop', 1500)
    check(pg.locator('h1.sheet-title').bounding_box()['width'] > 50, '5: empty shop still shows its title')
    cx.close()
    # Normal mode admin: no leading 📁 / 🔍 (Kids mode keeps them)
    db5['programs'][0]['look'] = {'mode': 'normal'}
    cx, pg = ctx(b, db5); go(pg, '#/admin', 1500)
    ph = pg.evaluate("[...document.querySelectorAll('input[placeholder]')].map(e => e.placeholder)")
    pn = pg.locator('.prog-name').all_inner_texts()
    check(ph and not any('🔍' in x for x in ph) and pn and '📁' not in pn[0], f'5: Normal admin: no 🔍 / 📁 ({ph[:1]}, {pn[:1]})')
    cx.close()
    db5['programs'][0]['look'] = {}
    cx, pg = ctx(b, db5); go(pg, '#/admin', 1500)
    check(any('🔍' in x for x in pg.evaluate("[...document.querySelectorAll('input[placeholder]')].map(e => e.placeholder)")), '5: Kids mode admin keeps the 🔍')
    cx.close()
    # PC width: menu and attendance still draw
    db5['items'] = [{'id': 'i1', 'name': 'ขนม', 'icon': '🍪', 'price': 20, 'active': True, 'sort': 1}]
    cx, pg = ctx(b, db5, 1366, 900); go(pg, '#/admin/attendance', 1500)
    check(pg.locator('.att').count() == 12, '5: PC attendance draws all rows')
    cx.close()

    # ---- step 6 audit: 3D tree respects reduced motion, keyboard focus ring, shop sign contrast, no nested boxes on the home
    SC = "(async()=>{const u=performance.getEntriesByType('resource').map(e=>e.name).find(n=>n.includes('scene3d.js'));const m=await import(u);return m.info()})()"
    def spin_pair(pg):
        a = pg.evaluate(SC); pg.wait_for_timeout(1200); return a, pg.evaluate(SC)
    db6 = seed_db([pts(1, KIDS[0]['id'], 30)])
    db6['settings']['announce'] = 'ซ้อมร้องเพลงวันอาทิตย์ 9 โมง'; db6['settings']['verse_text'] = 'จงชื่นชมยินดีเสมอ'; db6['settings']['verse_ref'] = '1 ธส 5:16'
    cx, pg = ctx(b, db6, rm='reduce'); go(pg, '#/', 2500)
    a, z = spin_pair(pg)
    check(a.get('rm') is True and a.get('running') and a['spin'] == z['spin'], f'6: reduced motion: tree stands still ({a.get("spin")} → {z.get("spin")}, running={a.get("running")})')
    pg.mouse.click(195, 120); pg.wait_for_timeout(600)
    z2 = pg.evaluate(SC)
    check(z2['spin'] == z['spin'], '6: reduced motion: a tap on the tree does not spin it')
    cx.close()
    cx, pg = ctx(b, db6); go(pg, '#/', 2500)
    a, z = spin_pair(pg)
    check(a.get('rm') is False and a['spin'] != z['spin'], f'6: normal motion: tree still turns ({a.get("spin")} → {z.get("spin")})')
    # home: announcement + verse are not bordered boxes inside the sheet
    st = pg.evaluate("""['.notice','.verse'].map(q=>{const e=document.querySelector('.sheet '+q);if(!e)return null;const c=getComputedStyle(e);
        return {lw:c.borderLeftWidth, rw:c.borderRightWidth, bg:c.backgroundColor, r:c.borderTopLeftRadius}})""")
    check(all(x and x['lw'] == '0px' and x['rw'] == '0px' and x['r'] == '0px' and x['bg'] in ('rgba(0, 0, 0, 0)', 'transparent') for x in st), f'6: notice and verse are not nested boxes ({st})')
    pg.screenshot(path=S + 'v40_6_home.png', full_page=True)
    # keyboard focus ring: Tab to a link/button shows a ≥2px outline; a mouse click does not
    pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); pg.wait_for_timeout(200)
    fo = pg.evaluate("(()=>{const e=document.activeElement;const c=getComputedStyle(e);return {tag:e.tagName, st:c.outlineStyle, w:parseFloat(c.outlineWidth), col:c.outlineColor}})()")
    check(fo['tag'] != 'BODY' and fo['st'] == 'solid' and fo['w'] >= 2, f'6: keyboard focus shows a ring ({fo})')
    cx.close()
    # admin (light page): ring is dark navy, a tap shows no ring
    cx, pg = ctx(b, db6); go(pg, '#/admin', 1500)
    pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); pg.wait_for_timeout(200)
    fo = pg.evaluate("(()=>{const e=document.activeElement;const c=getComputedStyle(e);return {tag:e.tagName, st:c.outlineStyle, col:c.outlineColor}})()")
    check(fo['st'] == 'solid' and fo['col'] == 'rgb(27, 42, 92)', f'6: admin focus ring is dark navy ({fo})')
    pg.locator('.mgrp, .mrow').first.click(); pg.wait_for_timeout(300)
    fo2 = pg.evaluate("getComputedStyle(document.activeElement).outlineStyle")
    check(fo2 == 'none', f'6: a mouse/finger tap shows no ring ({fo2})')
    cx.close()
    # shop sign: gold text on wood ≥ 3:1 (now ≥ 4.5)
    db6['items'] = [{'id': 'i1', 'name': 'ขนม', 'icon': '🍪', 'price': 20, 'active': True, 'sort': 1}]
    cx, pg = ctx(b, db6); go(pg, '#/shop', 1500)
    cr = pg.evaluate("""(()=>{const L=h=>{const c=h.match(/\\d+/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
        const e=document.querySelector('.stand-sign'),cs=getComputedStyle(e);const bgs=cs.backgroundImage.match(/rgb\\([^)]*\\)/g);const f=L(cs.color);
        return Math.min(...bgs.map(b=>{const l=L(b);return (Math.max(f,l)+.05)/(Math.min(f,l)+.05)}))})()""")
    check(cr >= 4.5, f'6: shop sign contrast {cr:.2f}:1 (was 2.8)')
    cx.close()
    # Normal mode: home still draws, focus ring is blue
    db6['programs'][0]['look'] = {'mode': 'normal'}
    cx, pg = ctx(b, db6); go(pg, '#/', 1500)
    check(pg.locator('.sheet .notice').is_visible() and pg.locator('.sheet .verse').is_visible(), '6: Normal mode home shows notice and verse')
    pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); pg.wait_for_timeout(200)
    check(pg.evaluate("getComputedStyle(document.activeElement).outlineColor") == 'rgb(47, 91, 211)', '6: Normal mode focus ring is blue')
    cx.close()

    # ---- step 7 delight: the shop knows who is looking ("หนูมี X ⭐", "แลกได้!" / "อีก Y ⭐" on every prize)
    k = [x['id'] for x in KIDS]
    db7 = seed_db([pts(1, k[0], 30)])
    db7['items'] = [{'id': 'i1', 'name': 'ขนม', 'icon': '🍪', 'price': 20, 'active': True, 'sort': 1},
                    {'id': 'i2', 'name': 'ตุ๊กตา', 'icon': '🧸', 'price': 50, 'active': True, 'sort': 2},
                    {'id': 'i3', 'name': 'สติกเกอร์', 'icon': '🎨', 'price': 30, 'active': True, 'sort': 3}]
    cx, pg = ctx(b, db7); go(pg, '#/shop', 1500)
    check(pg.locator('.slot .reach').count() == 0, '7: no name picked: prizes show no "แลกได้/อีก"')
    hint = pg.locator('a.shop-hint')   # v43: the hint itself is the link
    check(hint.count() == 1 and 'แตะชื่อหนู' in hint.inner_text() and hint.get_attribute('href') == '#/', '7: no name picked: hint links to the home page')
    pg.evaluate("localStorage.setItem('ya_me', '%s')" % k[0]); pg.reload(); pg.wait_for_timeout(1500)
    check('หนูมี 30 ⭐' in pg.inner_text('.shop-bal'), f"7: balance says 'หนูมี 30 ⭐' ({pg.inner_text('.shop-bal')!r})")
    check(pg.locator('.shop-hint').count() == 0, '7: hint gone once a name is picked')
    r = {pg.locator('.slot').nth(i).get_attribute('data-i'): pg.locator('.slot .reach').nth(i).inner_text() for i in range(3)}
    check(r.get('i1') == 'แลกได้!' and r.get('i3') == 'แลกได้!' and r.get('i2') == 'อีก 20 ⭐', f'7: per prize: แลกได้! at ≤ balance, "อีก 20 ⭐" above ({r})')
    check(pg.locator('.slot.can').count() == 2 and pg.locator('.slot.far').count() == 1, '7: slot classes can/far')
    an = pg.evaluate("getComputedStyle(document.querySelector('.slot.can .tag'),'::after').animationName")
    check(an == 'tag-shine', f'7: prizes in reach get one shine ({an})')
    ok_cr = pg.evaluate("""(()=>{const L=h=>{const c=h.match(/\\d+/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
        const r=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
        const c=getComputedStyle(document.querySelector('.slot.can .reach')),f=getComputedStyle(document.querySelector('.slot.far .reach'));
        return [r(c.color,c.backgroundColor), r(f.color,'rgb(234, 211, 171)')]})()""")
    check(min(ok_cr) >= 4.5, f'7: reach labels contrast ≥ 4.5 ({ok_cr})')
    over = pg.evaluate("[...document.querySelectorAll('.slot .reach')].some(e=>{const a=e.getBoundingClientRect(),s=e.closest('.slot').getBoundingClientRect();return a.left<s.left-1||a.right>s.right+1})")
    check(not over, '7: reach labels fit inside the prize (390 px)')
    pg.locator('.slot.far').first.click(); pg.wait_for_timeout(700)
    check('สะสมอีก 20' in pg.inner_text('.prize-zoom'), '7: big prize view agrees ("สะสมอีก 20 ⭐")')
    pg.screenshot(path=S + 'v40_7_shop.png')
    cx.close()
    cx, pg = ctx(b, db7, rm='reduce'); pg.add_init_script("localStorage.setItem('ya_me', '%s')" % k[0]); go(pg, '#/shop', 1500)
    check(pg.evaluate("getComputedStyle(document.querySelector('.slot.can .tag'),'::after').animationName") == 'none', '7: reduced motion: no shine')
    cx.close()
    # Normal mode: "คุณมี 30 คะแนน", "อีก 20 คะแนน", no ⭐, no "หนู"
    db7['programs'][0]['look'] = {'mode': 'normal'}
    cx, pg = ctx(b, db7); go(pg, '#/shop', 1500)
    check('แตะชื่อคุณ' in pg.inner_text('.shop-hint'), '7: Normal mode hint says "คุณ"')
    pg.evaluate("localStorage.setItem('ya_me', '%s')" % k[0]); pg.reload(); pg.wait_for_timeout(1500)
    m = pg.inner_text('main')
    check('คุณมี 30 คะแนน' in m and 'อีก 20 คะแนน' in m and '⭐' not in m and 'หนู' not in m, f"7: Normal mode shop: คุณมี / คะแนน, no ⭐/หนู ({m!r})")
    cx.close()
    # member login on: no "tap your name" hint (members sign in instead)
    db7['programs'][0]['look'] = {}; db7['programs'][0]['login_mode'] = 'all'
    cx, pg = ctx(b, db7); go(pg, '#/shop', 1500)
    check(pg.locator('.shop-hint').count() == 0, '7: member login on: no tap-your-name hint')
    cx.close()

    b.close()
print('\n'.join(errs) if errs else 'no errors')
