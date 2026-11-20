const DICT = {
  th: {
    appName: 'Youth Alpha',
    tagline: 'คริสต์มาสนี้ สะสมดาวกันเถอะ!',
    whoAreYou: 'แตะชื่อของหนู',
    search: 'ค้นหาชื่อ',
    me: 'ของฉัน',
    ranking: 'อันดับ',
    points: 'คะแนน',
    rank: 'อันดับที่',
    of: 'จาก',
    notMe: 'ไม่ใช่ฉัน',
    noKids: 'ยังไม่มีรายชื่อ — รอผู้ใหญ่เพิ่มชื่อนะ',
    loading: 'กำลังโหลด…',
    back: 'กลับ',
    adults: 'ผู้ดูแล',
    newPoints: 'ได้คะแนนเพิ่ม!',
    tapTree: 'แตะต้นคริสต์มาสได้นะ!',
    musicOn: 'เปิดเพลง', musicOff: 'ปิดเพลง',
    preview: 'โหมดทดลอง — ข้อมูลเก็บในเครื่องนี้เท่านั้น',
    skill_piano: 'เปียโน', skill_singing: 'ร้องเพลง', skill_english: 'อังกฤษ',
    skill_thai: 'อ่านไทย', skill_attendance: 'มาร่วม', skill_bonus: 'โบนัส',
    // adult
    login: 'เข้าสู่ระบบ', signup: 'สมัครบัญชีผู้ดูแล', logout: 'ออกจากระบบ',
    email: 'อีเมล', username: 'ชื่อผู้ใช้', password: 'รหัสผ่าน', yourName: 'ชื่อของคุณ',
    pendingMsg: 'บัญชีนี้รอผู้ดูแลอนุมัติ — แจ้งผู้ดูแลให้กดอนุมัติในแท็บ "ทีมงาน"',
    firstAdmin: 'ฉันคือผู้ดูแลคนแรก',
    firstAdminHint: 'ถ้ายังไม่มีผู้ดูแลเลย กดปุ่มนี้เพื่อเป็นผู้ดูแล (Admin)',
    checkEmail: 'สมัครแล้ว! ถ้ามีอีเมลยืนยันส่งไป ให้กดยืนยันก่อน แล้วค่อยเข้าสู่ระบบ',
    tab_attendance: 'เช็กชื่อ', tab_points: 'ให้คะแนน', tab_money: 'เงิน',
    tab_kids: 'รายชื่อเด็ก', tab_staff: 'ทีมงาน',
    present: 'มา', leave: 'ลา', absent: 'ขาด', waiting: 'รอเช็ก',
    finishRound: 'เช็กชื่อเสร็จแล้ว', finished: 'เช็กชื่อเสร็จแล้ว ✓', reopen: 'เปิดแก้ไขอีกครั้ง',
    finishConfirm: (w) => w > 0 ? `ยังมี ${w} คนที่ยังไม่ได้เช็ก ปิดรอบเลยไหม?` : 'ปิดรอบเช็กชื่อวันนี้?',
    chooseSkill: '1. เลือกทักษะ', chooseAmount: '2. เลือกคะแนน', chooseKids: '3. แตะเลือกเด็ก',
    selectAll: 'เลือกทั้งหมด', clear: 'ล้าง', give: 'ให้คะแนน',
    given: (n) => `ให้คะแนนแล้ว ${n} คน`,
    recent: 'ล่าสุด', undo: 'ลบ',
    earned: 'ได้รับสิทธิ์', paid: 'จ่ายแล้ว', owed: 'ค้างจ่าย', total: 'รวม',
    addEarned: '+ บันทึกเงินที่ได้', addPaid: '+ บันทึกการจ่าย',
    amount: 'จำนวนเงิน (บาท)', note: 'หมายเหตุ', save: 'บันทึก', cancel: 'ยกเลิก',
    history: 'ประวัติ',
    addKid: 'เพิ่มเด็ก', nickname: 'ชื่อเล่น', avatar: 'ตัวการ์ตูน', group: 'กลุ่ม (ไม่บังคับ)',
    edit: 'แก้ไข', del: 'ลบ', hidden: 'ซ่อน', show: 'แสดง',
    delKidConfirm: (n) => `ลบ "${n}"?\nคะแนน และการเช็กชื่อทั้งหมดของคนนี้จะถูกลบด้วย\nลบแล้วกู้คืนไม่ได้`,
    delWarn: (n) => `ลบ "${n}"?\nลบแล้วกู้คืนไม่ได้`, delPointWarn: (n, a) => `ลบคะแนน ${a} ของ "${n}"?\nลบแล้วกู้คืนไม่ได้`,
    clearAttWarn: (n) => `ล้างการเช็กชื่อของ "${n}" วันนี้?\nคะแนนการมาร่วมของวันนี้จะถูกลบด้วย`, clearAtt: 'ล้าง',
    pendingUsers: 'บัญชีรออนุมัติ', approve: 'อนุมัติเป็น Editor', staffList: 'ทีมงาน',
    remove: 'นำออก', none: 'ไม่มี',
    settings: 'ตั้งค่า', attPoints: 'คะแนนที่ได้เมื่อมาร่วม (ต่อครั้ง)',
    saved: 'บันทึกแล้ว', errGeneric: 'มีบางอย่างผิดพลาด ลองใหม่อีกครั้งนะ',
    errLogin: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', confirmDel: 'ลบรายการนี้?',
    shareLink: 'ลิงก์สำหรับเด็ก', copy: 'คัดลอก', copied: 'คัดลอกแล้ว',
    adultMenu: 'ผู้ดูแล', mySkills: 'คะแนนแต่ละด้าน', pickSub: 'แล้วดูคะแนนของหนูได้เลย',
    m_attendance: 'เช็กชื่อวันนี้', m_points: 'ให้คะแนนเด็ก', m_money: 'บันทึกเงินที่จ่ายให้เด็ก', m_kids: 'เพิ่ม / แก้ไขรายชื่อ', m_staff: 'อนุมัติผู้ช่วยและตั้งค่า',
    stepOf: (n) => `ขั้นที่ ${n} จาก 3`, s1: 'เลือกทักษะ', s2: 'ให้กี่คะแนน?', s3: 'เลือกเด็กที่ได้คะแนน',
    next: 'ถัดไป', customAmt: 'ใส่จำนวนเอง', giveTo: (a, s, n) => `ให้ ${a} ${s} · ${n} คน`,
    seeHistory: 'ดูประวัติการให้คะแนน', pointsHistory: 'ประวัติการให้คะแนน', owedLabel: 'ค้าง',
    earnedPaid: (e, p) => `ได้ ${e} · จ่ายแล้ว ${p}`, previewNote: 'โหมดทดลอง: ข้อมูลอยู่ในเครื่องนี้เท่านั้น',
    moneyHint: 'เห็นเฉพาะผู้ดูแล · แตะชื่อเพื่อบันทึกการจ่ายเงิน', totalPaid: 'จ่ายไปแล้วทั้งหมด',
    menu: 'เมนู', myCard: 'คะแนนของหนู', tapYourName: 'แตะชื่อของหนูในรายการ เพื่อดูคะแนนของหนู', thisIsMe: '⭐ นี่คือฉัน', changeMe: 'เปลี่ยนชื่อ',
    m_sched: 'ดูวันและเวลากิจกรรม', fb: 'ความคิดเห็น', theme: 'ธีมสี', language: 'ภาษา / Language', music: 'เพลง', help: 'วิธีใช้', helpSub: 'ดูคำแนะนำอีกครั้ง', adminSub: 'สำหรับผู้ดูแลเท่านั้น',
    on: 'เปิด', off: 'ปิด', langName: 'ไทย',
    th_night: 'คืนคริสต์มาส', th_snow: 'หิมะขาว', th_red: 'แดงคริสต์มาส', th_forest: 'ป่าสน',
    evLive: (t) => `กิจกรรมกำลังดำเนินอยู่ · จบใน ${t}`, evFeedback: 'เขียนความคิดเห็นของวันนี้ได้แล้ว!', evWait: (d, t) => `กิจกรรมครั้งต่อไป ${d} · อีก ${t}`,
    fbOpenSub: 'เปิดแล้ว! เขียนความคิดเห็นได้เลย', fbClosedSub: 'ยังไม่เปิดให้เขียน',
    fbTitle: 'วันนี้เป็นยังไงบ้าง?', fbMood: 'เลือกความรู้สึก', fbMsg: 'เขียนความคิดเห็นของหนู', fbSend: 'ส่งความคิดเห็น', fbThanks: 'ขอบคุณนะ! 💛', fbSentAlready: 'วันนี้หนูส่งแล้ว ขอบคุณนะ! 💛',
    fbAs: (n) => `ส่งในชื่อ ${n}`, fbAnon: 'ส่งแบบไม่บอกชื่อ', fbClosed: 'ยังไม่เปิดให้เขียนความคิดเห็น',
    dur: (d, h, m) => [d ? `${d} วัน` : '', h ? `${h} ชม.` : '', !d && m ? `${m} นาที` : ''].filter(Boolean).join(' ') || 'ไม่ถึง 1 นาที',
    dows: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    tut_rank2: 'ดูอันดับ และแตะชื่อของหนูเพื่อดูคะแนน', tut_menu: 'เมนู: ความคิดเห็น ธีมสี และอื่น ๆ',
    tab_feedback: 'ความคิดเห็นของเด็ก', m_feedback: 'อ่านความคิดเห็นหลังกิจกรรม', newCount: (n) => `ใหม่ ${n} รายการ`, anon: 'ไม่บอกชื่อ',
    need_att: 'วันนี้ยังเช็กชื่อไม่เสร็จ', need_kids: 'ยังไม่มีรายชื่อเด็ก', need_shopEmpty: 'ยังไม่มีของรางวัลเลย', need_shopCat: (n) => `หมวด "${n}" ยังไม่มีของรางวัล`,
    need_sched: 'ยังไม่มีกิจกรรมที่กำลังจะมา',
    eventDay: 'วันที่มีกิจกรรม', eventStart: 'เวลาเริ่ม', eventEnd: 'เวลาจบ',
    secEvent: 'เวลากิจกรรม', secFb: 'ช่วงเวลาเขียนความคิดเห็น', secTips: 'คำแนะนำ (ลูกศร)', secPoints: 'คะแนน',
    fbDay: 'วันที่เปิดให้เขียน', fbStart: 'เปิดเวลา', fbEnd: 'ปิดเวลา', tipDays: 'แสดงคำแนะนำซ้ำทุก ๆ กี่วัน (0 = ไม่แสดงซ้ำ)', errTime: 'เวลาเริ่มต้องมาก่อนเวลาจบ',
    exportFb: 'ส่งออกความคิดเห็นเป็น Excel', warnTitle: 'แน่ใจไหม?',
    bible: 'พระคัมภีร์', bibleSub: 'อ่านพระคัมภีร์ หรือดาวน์โหลดแอป', bibleIntro: 'อ่านพระคัมภีร์ภาษาไทยฟรี จาก YouVersion (ไม่มีโฆษณา)', bibleRead: 'อ่านออนไลน์', bibleAndroid: 'ดาวน์โหลดสำหรับ Android', bibleIos: 'ดาวน์โหลดสำหรับ iPhone / iPad',
    bonusPositive: 'คะแนนโบนัสต้องเป็นบวกเท่านั้น', multiSelect: 'เลือกหลายคน', multiDone: 'เสร็จ', selectedN: (n) => `เลือก ${n} คน`, bulkDone: (n, s) => `บันทึก "${s}" ให้ ${n} คนแล้ว`,
    needCount: (n) => `มี ${n} เรื่องที่ต้องดูแล`,
    tab_logs: 'บันทึกการใช้งาน', m_logs: 'ประวัติการแก้ไข และการใช้งานของเด็ก', adminLog: 'ประวัติการแก้ไขโดยผู้ดูแล', adminLogNote: 'เก็บถาวร ลบหรือแก้ไขไม่ได้',
    kidLog: 'การใช้งานของเด็ก', last7: '7 วันล่าสุด', evCount: (n) => `${n} ครั้ง`, devCount: (n) => `${n} เครื่อง`,
    exportAdminLog: 'ส่งออกประวัติการแก้ไข', exportKidLog: 'ส่งออกการใช้งาน', exportKidSum: 'ส่งออกสรุป',
    clearKidLog: 'ล้างบันทึกการใช้งานของเด็ก', clearKidNote: 'ต้องใส่รหัสผ่านผู้ดูแลอีกครั้ง · ประวัติการแก้ไขของผู้ดูแลจะไม่ถูกลบ',
    clearKidWarn: 'ล้างบันทึกการใช้งานของเด็กทั้งหมด?\nลบแล้วกู้คืนไม่ได้\nใส่รหัสผ่านผู้ดูแลเพื่อยืนยัน', logCleared: (n) => `ล้างบันทึกการใช้งานของเด็กแล้ว (${n} รายการ)`,
    clearNow: 'ล้างเลย', op_INSERT: 'เพิ่ม', op_UPDATE: 'แก้ไข', op_DELETE: 'ลบ', op_CLEAR: 'ล้าง',
    lt_kids: 'เด็ก', lt_points: 'คะแนน', lt_att: 'เช็กชื่อ', lt_round: 'รอบเช็กชื่อ', lt_shop: 'ของรางวัล', lt_pcats: 'หมวดคะแนน', lt_settings: 'ตั้งค่า', lt_staff: 'ผู้ดูแล', lt_kidlog: 'บันทึกการใช้งานของเด็ก', lt_system: 'ระบบ (อัตโนมัติ)',
    xs_adminlog: 'ประวัติการแก้ไข', xs_kidlog: 'การใช้งานของเด็ก', xs_kidsum: 'สรุปการใช้งาน',
    xc_time: 'เวลา', xc_admin: 'ผู้ดูแล', xc_action: 'การกระทำ', xc_area: 'ส่วน', xc_item: 'รายการ', xc_changes: 'สิ่งที่เปลี่ยน', xc_key: 'รหัสรายการ',
    xc_device: 'รหัสเครื่อง', xc_event: 'เหตุการณ์', xc_eventcode: 'รหัสเหตุการณ์', xc_page: 'หน้า', xc_count: 'จำนวนครั้ง', xc_devices: 'จำนวนเครื่อง', xc_kids: 'จำนวนเด็ก',
    ev_open_app: 'เปิดแอป', ev_view: 'ดูหน้า', ev_tap_kid: 'แตะชื่อในอันดับ', ev_tap_my_card: 'แตะการ์ดของฉัน', ev_set_me: 'เลือก "นี่คือฉัน"', ev_not_me: 'กด "ไม่ใช่ฉัน"',
    ev_cat_info: 'ดูข้อมูลหมวดคะแนน', ev_shop_tap: 'แตะของรางวัล', ev_bible_open: 'เปิดพระคัมภีร์', ev_bible_link: 'แตะลิงก์พระคัมภีร์', ev_theme_open: 'เปิดธีมสี', ev_theme: 'เปลี่ยนธีม',
    ev_lang: 'เปลี่ยนภาษา', ev_music: 'เปิด/ปิดเพลง', ev_help_open: 'เปิดวิธีใช้', ev_tour_next: 'คำแนะนำ: ถัดไป', ev_tour_skip: 'คำแนะนำ: ข้าม', ev_tour_done: 'คำแนะนำ: ครบ',
    ev_fb_pill: 'แตะแถบความคิดเห็น', ev_fb_open: 'เปิดความคิดเห็น', ev_fb_send: 'ส่งความคิดเห็น', ev_tree_tap: 'แตะต้นคริสต์มาส',
    g_daily: 'ประจำวัน', g_kids: 'เด็ก ๆ', g_rewards: 'คะแนนและของรางวัล', g_system: 'ระบบ',
    fbToggle: 'เปิดให้เด็กเขียนความคิดเห็น', fbOnNow: 'เปิดอยู่ — เด็ก ๆ เขียนได้', fbOffNow: 'ปิดอยู่ — เด็ก ๆ ยังเขียนไม่ได้',
    fbStatusOn: 'เปิดให้เขียนอยู่', fbStatusOff: 'ปิดอยู่ · แตะเพื่อเปิด', turnOff: 'ปิดเลย',
    fbOffWarn: 'ปิดการเขียนความคิดเห็น?\nเด็ก ๆ จะส่งความคิดเห็นไม่ได้ จนกว่าจะเปิดอีกครั้ง\n(ความคิดเห็นที่ส่งมาแล้วจะยังอยู่)',
    exportAll: 'ส่งออกทั้งหมด', exportAllSub: '1 ไฟล์ มีทุกแผ่นงาน', exportEach: 'หรือเลือกส่งออกทีละอย่าง', exportOne: 'ส่งออก', tab_export: 'ส่งออก Excel', m_export: 'ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ Excel', exportBtn: 'ดาวน์โหลดไฟล์ Excel', exporting: 'กำลังสร้างไฟล์…',
    exportIntro: 'ไฟล์ Excel 1 ไฟล์ มีแผ่นงานดังนี้:', xs_summary: 'สรุปรายคน', xs_points: 'คะแนนทั้งหมด', xs_att: 'การมาร่วม', xs_attsum: 'สรุปการมาร่วม',
    xs_money: 'การจ่ายเงิน', xs_feedback: 'ความคิดเห็น', xs_shop: 'ร้านค้า', xs_sched: 'ตารางกิจกรรม',
    xc_total: 'คะแนนรวม', xc_paid: 'เงินที่จ่ายแล้ว (บาท)', xc_detail: 'รายละเอียด', xc_points: 'คะแนน', xc_status: 'สถานะ', xc_baht: 'บาท', xc_mood: 'ความรู้สึก', xc_msg: 'ข้อความ', xc_shown: 'แสดง',
    details: 'รายละเอียดย่อย (บรรทัดละ 1 อย่าง ไม่บังคับ)', pickDetail: 'รายละเอียด (ไม่บังคับ)', noDetail: 'ไม่ระบุ',
    tab_pcats: 'หมวดคะแนน', m_pcats: 'ชื่อ ไอคอน และข้อมูลเพิ่มเติม', addPcat: 'เพิ่มหมวดคะแนน', nameTh: 'ชื่อ (ไทย)', nameEn: 'ชื่อ (อังกฤษ ไม่บังคับ)', infoLbl: 'ข้อมูลเพิ่มเติม (เด็กแตะดูได้)', myPointsIn: 'คะแนนของหนูในหมวดนี้', cantDelPcat: 'ลบไม่ได้ เพราะมีคะแนนในหมวดนี้แล้ว — ใช้ "ซ่อน" แทนนะ',
    shop: 'ร้านค้า', shopTitle: 'ร้านของรางวัล', shopSub: 'สะสมคะแนนแล้วมาแลกกันนะ! แตะของรางวัลดูสิ',  tapCat: 'แตะเพื่อเปิดดู',
    youHave: (n) => `หนูมี ${n} ⭐`, canGet: 'แลกได้!', needMore: (n) => `อีก ${n} ⭐`, emptyCat: 'ยังไม่มีของในหมวดนี้', emptyShop: 'ร้านยังไม่เปิดนะ',
    schedule: 'ตารางกิจกรรม', noSchedule: 'ยังไม่มีกิจกรรม', todayLbl: 'วันนี้', close: 'ปิด', pastEvents: 'ผ่านไปแล้ว',
    tut_schedule: 'แตะตรงนี้เพื่อดูตารางกิจกรรม', tut_shop: 'ร้านค้า! ดูของรางวัลที่แลกด้วยคะแนน', tut_rank: 'ดูอันดับของเพื่อน ๆ ที่นี่',
    tut_me: 'ดูคะแนนของหนูที่นี่', tut_music: 'เปิด / ปิดเพลงคริสต์มาส', gotIt: 'เข้าใจแล้ว', skip: 'ข้าม',
    tab_shop: 'ร้านค้า', m_shop: 'เพิ่ม / แก้ไขของรางวัลและราคา', tab_schedule: 'ตารางกิจกรรม', m_schedule: 'เพิ่ม / แก้ไขกิจกรรม',
    tab_settings: 'ตั้งค่า', m_settings: 'คำแนะนำ และคะแนนการมาร่วม',
    attSummary: 'สรุปการมาร่วมทั้งหมด', rounds: (n) => `เช็กชื่อไปแล้ว ${n} ครั้ง`, attTimes: (p, l, a) => `มา ${p} · ลา ${l} · ขาด ${a}`,
    addCategory: 'เพิ่มหมวด', addItem: 'เพิ่มของรางวัล', catName: 'ชื่อหมวด', shelfIcon: 'ของที่วางบนชั้น', effectIcon: 'สิ่งที่เด้งออกมาเมื่อแตะ',
    itemName: 'ชื่อของรางวัล', price: 'ราคา (คะแนน)', category: 'หมวด', orType: 'หรือพิมพ์อีโมจิเอง',
    date: 'วันที่', time: 'เวลา (ไม่บังคับ)', evTitle: 'ชื่อกิจกรรม', addEvent: 'เพิ่มกิจกรรม', delCatConfirm: (n) => `ลบหมวด "${n}"? ของในหมวดนี้จะถูกลบด้วย`, kidsCount: (n) => `เด็กทั้งหมด ${n} คน`,
  },
  en: {
    appName: 'Youth Alpha',
    tagline: 'Collect stars this Christmas!',
    whoAreYou: 'Tap your name',
    search: 'Search name',
    me: 'Me',
    ranking: 'Ranking',
    points: 'points',
    rank: 'Rank',
    of: 'of',
    notMe: 'Not me',
    noKids: 'No names yet — ask an adult to add you',
    loading: 'Loading…',
    back: 'Back',
    adults: 'Admin',
    newPoints: 'New points!',
    tapTree: 'Tap the tree!',
    musicOn: 'Music on', musicOff: 'Music off',
    preview: 'Preview mode — data is saved on this device only',
    skill_piano: 'Piano', skill_singing: 'Singing', skill_english: 'English',
    skill_thai: 'Thai', skill_attendance: 'Came', skill_bonus: 'Bonus',
    login: 'Log in', signup: 'Create adult account', logout: 'Log out',
    email: 'Email', username: 'Username', password: 'Password', yourName: 'Your name',
    pendingMsg: 'This account is waiting for the Admin to approve it in the "Team" tab.',
    firstAdmin: "I'm the first admin",
    firstAdminHint: 'If there is no admin yet, tap this to become the Admin.',
    checkEmail: 'Account created! If a confirmation email was sent, confirm it, then log in.',
    tab_attendance: 'Attendance', tab_points: 'Points', tab_money: 'Money',
    tab_kids: 'Kids', tab_staff: 'Team',
    present: 'Here', leave: 'Leave', absent: 'Absent', waiting: 'Waiting',
    finishRound: 'Finish attendance', finished: 'Attendance finished ✓', reopen: 'Reopen',
    finishConfirm: (w) => w > 0 ? `${w} kid(s) not checked yet. Finish anyway?` : "Finish today's attendance?",
    chooseSkill: '1. Pick skill', chooseAmount: '2. Pick points', chooseKids: '3. Tap kids',
    selectAll: 'Select all', clear: 'Clear', give: 'Give points',
    given: (n) => `Points given to ${n} kid(s)`,
    recent: 'Recent', undo: 'Delete',
    earned: 'Earned', paid: 'Paid', owed: 'Owed', total: 'Total',
    addEarned: '+ Add earned', addPaid: '+ Add payment',
    amount: 'Amount (THB)', note: 'Note', save: 'Save', cancel: 'Cancel',
    history: 'History',
    addKid: 'Add kid', nickname: 'Nickname', avatar: 'Avatar', group: 'Group (optional)',
    edit: 'Edit', del: 'Delete', hidden: 'Hidden', show: 'Show',
    delKidConfirm: (n) => `Delete "${n}"?\nAll their points and attendance will be deleted too.\nThis can't be undone.`,
    delWarn: (n) => `Delete "${n}"?\nThis can't be undone.`, delPointWarn: (n, a) => `Delete ${a} points from "${n}"?\nThis can't be undone.`,
    clearAttWarn: (n) => `Clear today's attendance for "${n}"?\nToday's attendance points will be removed too.`, clearAtt: 'Clear',
    pendingUsers: 'Waiting for approval', approve: 'Approve as Editor', staffList: 'Team',
    remove: 'Remove', none: 'None',
    settings: 'Settings', attPoints: 'Points for attending (each time)',
    saved: 'Saved', errGeneric: 'Something went wrong, please try again',
    errLogin: 'Wrong username or password', confirmDel: 'Delete this?',
    shareLink: 'Link for kids', copy: 'Copy', copied: 'Copied',
    adultMenu: 'Admin', mySkills: 'Points by skill', pickSub: 'to see your points',
    m_attendance: "Check today's attendance", m_points: 'Give points to kids', m_money: 'Record money', m_kids: 'Add / edit kids', m_staff: 'Approve helpers & settings',
    stepOf: (n) => `Step ${n} of 3`, s1: 'Pick a skill', s2: 'How many points?', s3: 'Pick the kids',
    next: 'Next', customAmt: 'Type a number', giveTo: (a, s, n) => `Give ${a} ${s} · ${n} kid(s)`,
    seeHistory: 'See points history', pointsHistory: 'Points history', owedLabel: 'Owed',
    earnedPaid: (e, p) => `Earned ${e} · Paid ${p}`, previewNote: 'Preview mode: data stays on this device only',
    moneyHint: 'Admins only · tap a name to record a payment', totalPaid: 'Total paid',
    menu: 'Menu', myCard: 'My points', tapYourName: 'Tap your name in the list to see your points', thisIsMe: '⭐ This is me', changeMe: 'Change',
    m_sched: 'Activity days and times', fb: 'Feedback', theme: 'Colour theme', language: 'Language / ภาษา', music: 'Music', help: 'How to use', helpSub: 'See the tips again', adminSub: 'For admins only',
    on: 'On', off: 'Off', langName: 'English',
    th_night: 'Christmas night', th_snow: 'Snow white', th_red: 'Christmas red', th_forest: 'Pine forest',
    evLive: (t) => `Activity is on now · ends in ${t}`, evFeedback: 'You can write your feedback now!', evWait: (d, t) => `Next activity ${d} · in ${t}`,
    fbOpenSub: 'Open now — write your feedback!', fbClosedSub: 'Not open yet',
    fbTitle: 'How was today?', fbMood: 'How do you feel?', fbMsg: 'Write your feedback', fbSend: 'Send feedback', fbThanks: 'Thank you! 💛', fbSentAlready: 'You already sent feedback today. Thank you! 💛',
    fbAs: (n) => `Send as ${n}`, fbAnon: 'Send without my name', fbClosed: 'Feedback is not open yet',
    dur: (d, h, m) => [d ? `${d}d` : '', h ? `${h}h` : '', !d && m ? `${m}m` : ''].filter(Boolean).join(' ') || '< 1m',
    dows: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    tut_rank2: 'See the ranking — tap your name to see your points', tut_menu: 'Menu: colours, feedback and more',
    tab_feedback: "Kids' feedback", m_feedback: 'Read feedback after each activity', newCount: (n) => `${n} new`, anon: 'No name',
    need_att: "Today's attendance isn't finished", need_kids: 'No kids added yet', need_shopEmpty: 'No prizes yet', need_shopCat: (n) => `"${n}" has no prizes`,
    need_sched: 'No upcoming activities',
    eventDay: 'Activity day', eventStart: 'Start time', eventEnd: 'End time',
    secEvent: 'Activity time', secFb: 'Feedback window', secTips: 'Tips (arrows)', secPoints: 'Points',
    fbDay: 'Feedback day', fbStart: 'Opens at', fbEnd: 'Closes at', tipDays: 'Show a tip again every how many days (0 = never)', errTime: 'Start time must be before end time',
    exportFb: 'Export feedback to Excel', warnTitle: 'Are you sure?',
    bible: 'Bible', bibleSub: 'Read the Bible or get the app', bibleIntro: 'Read the Bible in Thai for free with YouVersion (no ads)', bibleRead: 'Read online', bibleAndroid: 'Download for Android', bibleIos: 'Download for iPhone / iPad',
    bonusPositive: 'Bonus points must be positive', multiSelect: 'Select many', multiDone: 'Done', selectedN: (n) => `${n} selected`, bulkDone: (n, s) => `Saved "${s}" for ${n} kid(s)`,
    needCount: (n) => `${n} thing(s) need attention`,
    tab_logs: 'Logs', m_logs: 'Change history and kids\' activity', adminLog: 'Admin change history', adminLogNote: 'Permanent — cannot be deleted or edited',
    kidLog: "Kids' activity", last7: 'Last 7 days', evCount: (n) => `${n} events`, devCount: (n) => `${n} devices`,
    exportAdminLog: 'Export change history', exportKidLog: 'Export activity', exportKidSum: 'Export summary',
    clearKidLog: "Clear kids' activity log", clearKidNote: 'Needs the admin password again · admin change history is never deleted',
    clearKidWarn: "Clear all of the kids' activity log?\nThis can't be undone.\nEnter the admin password to confirm.", logCleared: (n) => `Kids' activity log cleared (${n} rows)`,
    clearNow: 'Clear now', op_INSERT: 'Added', op_UPDATE: 'Changed', op_DELETE: 'Deleted', op_CLEAR: 'Cleared',
    lt_kids: 'Kid', lt_points: 'Points', lt_att: 'Attendance', lt_round: 'Attendance round', lt_shop: 'Prize', lt_pcats: 'Point category', lt_settings: 'Settings', lt_staff: 'Admin', lt_kidlog: "Kids' activity log", lt_system: 'System (automatic)',
    xs_adminlog: 'Change history', xs_kidlog: "Kids' activity", xs_kidsum: 'Activity summary',
    xc_time: 'Time', xc_admin: 'Admin', xc_action: 'Action', xc_area: 'Area', xc_item: 'Item', xc_changes: 'What changed', xc_key: 'Item id',
    xc_device: 'Device', xc_event: 'Event', xc_eventcode: 'Event code', xc_page: 'Page', xc_count: 'Count', xc_devices: 'Devices', xc_kids: 'Kids',
    ev_open_app: 'Opened app', ev_view: 'Viewed page', ev_tap_kid: 'Tapped a name', ev_tap_my_card: 'Tapped my card', ev_set_me: 'Chose "this is me"', ev_not_me: 'Tapped "not me"',
    ev_cat_info: 'Opened category info', ev_shop_tap: 'Tapped a prize', ev_bible_open: 'Opened Bible', ev_bible_link: 'Tapped Bible link', ev_theme_open: 'Opened themes', ev_theme: 'Changed theme',
    ev_lang: 'Changed language', ev_music: 'Music on/off', ev_help_open: 'Opened help', ev_tour_next: 'Tip: next', ev_tour_skip: 'Tip: skip', ev_tour_done: 'Tip: done',
    ev_fb_pill: 'Tapped feedback strip', ev_fb_open: 'Opened feedback', ev_fb_send: 'Sent feedback', ev_tree_tap: 'Tapped the tree',
    g_daily: 'Daily', g_kids: 'Kids', g_rewards: 'Points & prizes', g_system: 'System',
    fbToggle: 'Let kids write feedback', fbOnNow: 'On — kids can write', fbOffNow: 'Off — kids cannot write yet',
    fbStatusOn: 'Open for writing', fbStatusOff: 'Closed · tap to open', turnOff: 'Turn off',
    fbOffWarn: 'Turn off feedback?\nKids won\'t be able to send feedback until you turn it on again.\n(Feedback already sent is kept.)',
    exportAll: 'Export everything', exportAllSub: 'One file with every sheet', exportEach: 'Or export one thing at a time', exportOne: 'Export', tab_export: 'Export to Excel', m_export: 'Download all data as an Excel file', exportBtn: 'Download Excel file', exporting: 'Creating file…',
    exportIntro: 'One Excel file with these sheets:', xs_summary: 'Summary per kid', xs_points: 'All points', xs_att: 'Attendance', xs_attsum: 'Attendance totals',
    xs_money: 'Payments', xs_feedback: 'Feedback', xs_shop: 'Shop', xs_sched: 'Schedule',
    xc_total: 'Total points', xc_paid: 'Paid (THB)', xc_detail: 'Detail', xc_points: 'Points', xc_status: 'Status', xc_baht: 'THB', xc_mood: 'Mood', xc_msg: 'Message', xc_shown: 'Shown',
    details: 'Details (one per line, optional)', pickDetail: 'Detail (optional)', noDetail: 'Not specified',
    tab_pcats: 'Point categories', m_pcats: 'Names, icons and extra info', addPcat: 'Add point category', nameTh: 'Name (Thai)', nameEn: 'Name (English, optional)', infoLbl: 'Extra info (kids can tap to see)', myPointsIn: 'Your points here', cantDelPcat: 'Can\'t delete: points were given in this category. Hide it instead.',
    shop: 'Shop', shopTitle: 'Prize Shop', shopSub: 'Collect points and trade them here!', tapCat: 'Tap to open',
    youHave: (n) => `You have ${n} ⭐`, canGet: 'You can get it!', needMore: (n) => `${n} ⭐ more`, emptyCat: 'Nothing here yet', emptyShop: 'The shop is not open yet',
    schedule: 'Schedule', noSchedule: 'No activities yet', todayLbl: 'Today', close: 'Close', pastEvents: 'Past',
    tut_schedule: 'Tap here to see the schedule', tut_shop: 'The shop! See prizes you can get with points', tut_rank: 'See everyone\'s ranking here',
    tut_me: 'See your points here', tut_music: 'Turn Christmas music on / off', gotIt: 'Got it', skip: 'Skip',
    tab_shop: 'Shop', m_shop: 'Set prizes and prices', tab_schedule: 'Schedule', m_schedule: 'Add / edit activities',
    tab_settings: 'Settings', m_settings: 'Tips and attendance points',
    attSummary: 'Attendance totals', rounds: (n) => `${n} day(s) checked`, attTimes: (p, l, a) => `Here ${p} · Leave ${l} · Absent ${a}`,
    addCategory: 'Add category', addItem: 'Add prize', catName: 'Category name', shelfIcon: 'What sits on the shelf', effectIcon: 'What pops out when tapped',
    itemName: 'Prize name', price: 'Price (points)', category: 'Category', orType: 'or type any emoji',
    date: 'Date', time: 'Time (optional)', evTitle: 'Activity', addEvent: 'Add activity', delCatConfirm: (n) => `Delete "${n}"? Its prizes will be deleted too`, kidsCount: (n) => `${n} kids`,
  }
};

let lang = localStorage.getItem('ya_lang') || 'th';
export const getLang = () => lang;
export function setLang(l) { lang = l; localStorage.setItem('ya_lang', l); document.documentElement.lang = l; }
// v28: wording set per program on the super admin page (programs.look.words) wins over the built-in text
let OVR = { th: {}, en: {} };
export function setOverrides(w) { OVR = { th: { ...(w?.th || {}) }, en: { ...(w?.en || {}) } }; }
export const tBase = (key, l = lang) => { const v = DICT[l][key] ?? DICT.en[key] ?? key; return typeof v === 'function' ? '' : v; };
// v40 distill: Normal mode (adult programs) — the kids' words are swapped for adult ones (NORMAL, built at the end of this file)
let ADULT = false;
export function setAdult(on) { ADULT = !!on; }
export function t(key, ...args) {
  const o = OVR[lang]?.[key];
  if (typeof o === 'string' && o.trim()) return o;
  const v = (ADULT ? NORMAL[lang]?.[key] : undefined) ?? DICT[lang][key] ?? DICT.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
document.documentElement.lang = lang;

// ---- update 16: songs, pictures, feedback QR, short empty messages
Object.assign(DICT.th, {
  noKids: 'ยังไม่มีรายชื่อ', emptyShop: 'ยังไม่มีของรางวัล', fbClosed: 'ยังไม่เปิดรับความคิดเห็น',
  tut_menu: 'เมนู: ความคิดเห็น พระคัมภีร์ และอื่น ๆ', tut_songs: 'เพลงคริสต์มาส: เนื้อเพลง คอร์ด และเครื่องเคาะจังหวะ', tut_theme: 'เปลี่ยนสีแอปได้ที่ปุ่มนี้',
  songs: 'เพลง', songsTitle: 'เพลงคริสต์มาส', noSongs: 'ยังไม่มีเพลง', noLyrics: 'ยังไม่มีเนื้อเพลง', keyLbl: 'คีย์',
  sheetLbl: 'แผ่นเพลง', listen: 'ฟังเพลง', openYt: 'เปิดใน YouTube', metro: 'จังหวะ', scroll: 'เลื่อน', speed: 'ความเร็ว',
  textSize: 'ขนาดตัวอักษร', showChords: 'แสดงคอร์ด', transpose: 'เปลี่ยนคีย์', original: 'คีย์เดิม', songSettings: 'ตั้งค่าการแสดงผล',
  credits: 'เครดิต', songCredits: 'เครดิตเพลง', songCreditsSub: 'ที่มาของเพลงและวิดีโอ', creditsNote: 'วิดีโอเป็นของเจ้าของช่อง YouTube แต่ละช่อง',
  goHome: 'กลับหน้าแรก', santaHo: 'โฮ่ โฮ่ โฮ่!', joyTitle: 'Joy to the World!', themeBtn: 'ธีมสี',
  tab_songs: 'เพลง', m_songs: 'เนื้อเพลง คอร์ด วิดีโอ และเครดิต', g_songs: 'เพลง', addSong: 'เพิ่มเพลง',
  pvBtn: 'ดูตัวอย่าง', sheetOnly: 'แผ่นเพลงต้นฉบับอย่างเดียว', sheetOnlySub: 'เปิดแล้วจะปิดอย่างอื่นทั้งหมดในเพลงนี้', songSw: 'สิ่งที่เด็กเห็นในเพลงนี้', songSwSub: 'เปิด / ปิดเฉพาะเพลงนี้ บันทึกทันที', songSwOff: 'ปิดอยู่สำหรับทุกเพลง (ตั้งค่าเพลง)', setShort: 'ตั้งค่า', songTitle: 'ชื่อเพลง', songSub: 'ชื่อรอง (ไม่บังคับ)', bpmLbl: 'ความเร็ว (BPM)', beatsLbl: 'จังหวะต่อห้อง',
  ytLink: 'ลิงก์ YouTube (ไม่บังคับ)', ytStart: 'เริ่มวิดีโอที่วินาที', creditsLbl: 'เครดิต', lyricsLbl: 'เนื้อเพลงและคอร์ด',
  lyricsHelp: 'ใส่คอร์ดในวงเล็บ เช่น [G]Jingle bells · บรรทัดที่ขึ้นต้นด้วย # คือชื่อท่อน · วางแบบคอร์ดอยู่บรรทัดบนเนื้อก็ได้',
  sheetsLbl: 'รูปแผ่นเพลง', orderLbl: 'ลำดับ', songSaved: 'บันทึกเพลงแล้ว', removePic: 'เอารูปออก',
  upload: '📷 อัปโหลดรูป', uploading: 'กำลังอัปโหลด…', uploadFail: 'อัปโหลดไม่สำเร็จ', notImage: 'ไฟล์นี้ไม่ใช่รูปภาพ',
  photoNote: 'ทุกคนเห็นรูปนี้ได้ ใช้รูปการ์ตูน หรือขออนุญาตผู้ปกครองก่อนใช้รูปจริง',
  fbQr: 'QR ให้ความคิดเห็น', fbQrSub: 'สแกนแล้วไปที่หน้าเขียนความคิดเห็นทันที', dlQr: 'ดาวน์โหลด QR', qrCaption: 'สแกนเพื่อให้ความคิดเห็น',
  logsGrp: 'บันทึกการใช้งาน', lt_songs: 'เพลง', g_system: 'ระบบ',
  ev_songs: 'ดูรายการเพลง', ev_song_open: 'เปิดเพลง', ev_metro: 'เครื่องเคาะจังหวะ', ev_autoscroll: 'เลื่อนอัตโนมัติ', ev_song_speed: 'เปลี่ยนความเร็วเพลง',
  ev_transpose: 'เปลี่ยนคีย์', ev_yt_play: 'เล่นวิดีโอ', ev_sheet_view: 'ดูแผ่นเพลง', ev_credits: 'ดูเครดิตเพลง', ev_santa_tap: 'แตะซานต้า',
  ev_festive: 'โหมดพิเศษ (แตะต้นไม้ 5 ครั้ง)', ev_pic_view: 'ดูรูปโปรไฟล์', ev_fb_qr: 'เปิดจาก QR ความคิดเห็น',
});
Object.assign(DICT.en, {
  noKids: 'No names yet', emptyShop: 'No prizes yet', fbClosed: 'Feedback is closed',
  tut_menu: 'Menu: feedback, Bible and more', tut_songs: 'Christmas songs: lyrics, chords and a metronome', tut_theme: 'Change the app colours here',
  songs: 'Songs', songsTitle: 'Christmas songs', noSongs: 'No songs yet', noLyrics: 'No lyrics yet', keyLbl: 'Key',
  sheetLbl: 'Song sheet', listen: 'Listen', openYt: 'Open in YouTube', metro: 'Beat', scroll: 'Scroll', speed: 'Speed',
  textSize: 'Text size', showChords: 'Show chords', transpose: 'Change key', original: 'Original key', songSettings: 'Display settings',
  credits: 'Credits', songCredits: 'Song credits', songCreditsSub: 'Where the songs and videos come from', creditsNote: 'Videos belong to their YouTube channels',
  goHome: 'Back to home', santaHo: 'Ho ho ho!', joyTitle: 'Joy to the World!', themeBtn: 'Theme',
  tab_songs: 'Songs', m_songs: 'Lyrics, chords, videos and credits', g_songs: 'Songs', addSong: 'Add song',
  pvBtn: 'Preview', sheetOnly: 'Original sheet only', sheetOnlySub: 'Turning it on switches everything else off for this song', songSw: 'What kids see in this song', songSwSub: 'On / off for this song only; saved straight away', songSwOff: 'Off for all songs (Music settings)', setShort: 'Display', songTitle: 'Song title', songSub: 'Second title (optional)', bpmLbl: 'Tempo (BPM)', beatsLbl: 'Beats per bar',
  ytLink: 'YouTube link (optional)', ytStart: 'Start video at second', creditsLbl: 'Credits', lyricsLbl: 'Lyrics and chords',
  lyricsHelp: 'Put chords in brackets, e.g. [G]Jingle bells · a line starting with # is a section name · chords on the line above the words also work',
  sheetsLbl: 'Song sheet pictures', orderLbl: 'Order', songSaved: 'Song saved', removePic: 'Remove picture',
  upload: '📷 Upload picture', uploading: 'Uploading…', uploadFail: 'Upload failed', notImage: 'This file is not a picture',
  photoNote: 'Everyone can see this picture. Use a cartoon, or ask a parent before using a real photo.',
  fbQr: 'Feedback QR code', fbQrSub: 'Scanning it opens the feedback page directly', dlQr: 'Download QR', qrCaption: 'Scan to give feedback',
  logsGrp: 'Activity logs', lt_songs: 'Songs', g_system: 'System',
  ev_songs: 'Viewed song list', ev_song_open: 'Opened a song', ev_metro: 'Metronome', ev_autoscroll: 'Auto-scroll', ev_song_speed: 'Changed song speed',
  ev_transpose: 'Changed key', ev_yt_play: 'Played video', ev_sheet_view: 'Viewed song sheet', ev_credits: 'Viewed song credits', ev_santa_tap: 'Tapped Santa',
  ev_festive: 'Special mode (5 tree taps)', ev_pic_view: 'Viewed a profile picture', ev_fb_qr: 'Opened from feedback QR',
});

// ---- update 17: video sync, Thai/English switch, original sheet
Object.assign(DICT.th, {
  syncedAll: 'จังหวะและเนื้อเพลงจะตามวิดีโอ', syncedBeat: 'จังหวะจะตามวิดีโอ', langAll: 'ทั้งหมด', origSheet: 'แผ่นเพลงต้นฉบับ', withVideo: 'ตามวิดีโอ',
  syncTitle: 'ซิงก์กับวิดีโอ', syncSub: 'แตะตามเพลงครั้งเดียว แล้วจังหวะและเนื้อเพลงในแอปจะตามวิดีโอเอง',
  syncBeats: 'จังหวะ', syncLines: 'บรรทัดเนื้อเพลง', syncN: (n) => `${n} จุด`, syncNone: 'ยังไม่ได้ทำ', syncRedo: 'เนื้อเพลงเปลี่ยน ต้องทำใหม่', syncOpen: 'เริ่มแตะตามเพลง',
  tapHowBeat: '1) กด ▶ ที่วิดีโอ  2) แตะปุ่มใหญ่ทุกจังหวะ เริ่มที่จังหวะแรกของห้อง  3) แตะไปจนจบเพลง แล้วกดบันทึก (บนคอมกด Space ได้)',
  tapHere: 'แตะตามจังหวะ', startOver: 'เริ่มใหม่', testHow: 'เล่นวิดีโอแล้วฟังเสียงเคาะ ถ้าเร็วหรือช้าไปนิด ปรับได้ที่นี่',
  testing: 'กำลังลองฟัง (แตะเพื่อหยุด)', testBeat: 'ลองฟังเสียงเคาะกับวิดีโอ', earlier: 'เร็วขึ้น', later: 'ช้าลง', pressPlay: 'กด ▶ ที่วิดีโอก่อน',
  tapHowLine: '1) กด ▶ ที่วิดีโอ  2) กด ⏭ ทุกครั้งที่เริ่มร้องบรรทัดใหม่ (ท่อนที่ร้องซ้ำ แตะที่บรรทัดนั้นได้เลย)  3) กด 💾 บันทึก',
  nextLine: 'บรรทัดถัดไป', undoMark: 'ย้อน', ytFail: 'โหลดวิดีโอไม่ได้', ev_song_lang: 'เปลี่ยนภาษาเนื้อเพลง',
});
Object.assign(DICT.en, {
  syncedAll: 'Beat and lyrics follow the video', syncedBeat: 'The beat follows the video', langAll: 'All', origSheet: 'Original song sheet', withVideo: 'with video',
  syncTitle: 'Sync with the video', syncSub: "Tap along once, then the app's beat and lyrics follow the video",
  syncBeats: 'Beat', syncLines: 'Lyric lines', syncN: (n) => `${n} marks`, syncNone: 'Not done yet', syncRedo: 'Lyrics changed — redo', syncOpen: 'Start tap-along',
  tapHowBeat: '1) Press ▶ on the video  2) Tap the big button on every beat, starting on the first beat of a bar  3) Keep tapping to the end, then Save (Space works on a computer)',
  tapHere: 'Tap the beat', startOver: 'Start over', testHow: 'Play the video and listen to the clicks; nudge them if slightly early or late',
  testing: 'Testing (tap to stop)', testBeat: 'Test the clicks with the video', earlier: 'earlier', later: 'later', pressPlay: 'Press ▶ on the video first',
  tapHowLine: '1) Press ▶ on the video  2) Press ⏭ each time a new line starts (for a repeated part, tap that line)  3) Press 💾 to save',
  nextLine: 'Next line', undoMark: 'Undo', ytFail: "Couldn't load the video", ev_song_lang: 'Changed lyric language',
});

// ---- update 18: paste the whole song sheet
Object.assign(DICT.th, {
  pasteAll: 'วางเนื้อเพลงทั้งแผ่น', ok: 'ตกลง', linesN: (n) => `${n} บรรทัด`,
  pasteAllHow: 'เปิดไฟล์แผ่นเพลง (Word หรือ Google Docs) กด Ctrl+A แล้ว Ctrl+C จากนั้นวางในช่องนี้ แอปจะแยกเป็นแต่ละเพลงตามชื่อเพลง และวางคอร์ดไว้เหนือคำให้เหมือนต้นฉบับ',
  pasteNone: 'ไม่พบชื่อเพลงในข้อความที่วาง ลองตรวจว่าชื่อเพลงในแผ่นตรงกับชื่อเพลงในแอป',
  pasteFound: (n) => `พบ ${n} เพลง`, pasteMissing: 'ไม่พบในข้อความ:',
  pasteReplaceWarn: 'เนื้อเพลงเดิมในแอปของเพลงเหล่านี้จะถูกแทนที่\nเพลงที่ซิงก์บรรทัดเนื้อเพลงไว้แล้วต้องซิงก์บรรทัดใหม่',
  pasteDone: (n) => `ใส่เนื้อเพลงแล้ว ${n} เพลง`,
});
Object.assign(DICT.en, {
  pasteAll: 'Paste the whole song sheet', ok: 'OK', linesN: (n) => `${n} lines`,
  pasteAllHow: 'Open the song sheet file (Word or Google Docs), press Ctrl+A then Ctrl+C, and paste here. The app splits it into songs by title and keeps each chord over the right word, like the original.',
  pasteNone: 'No song titles found in the pasted text. Check that the titles on the sheet match the song titles in the app.',
  pasteFound: (n) => `Found ${n} songs`, pasteMissing: 'Not found in the text:',
  pasteReplaceWarn: "These songs' current lyrics in the app will be replaced.\nSongs whose lyric lines were synced will need the line sync again.",
  pasteDone: (n) => `Lyrics added to ${n} songs`,
});

// ---- update 19: music switches for admins
Object.assign(DICT.th, {
  tab_musicset: 'ตั้งค่าเพลง', m_musicset: 'เปิด / ปิดแต่ละอย่างของเพลงสำหรับเด็ก ๆ', ms_app: 'ทั้งแอป', ms_player: 'หน้าเพลง',
  moOn: 'เปิดแล้ว', moOff: 'ปิดแล้ว', moNote: 'เปลี่ยนแล้วมีผลทันทีเมื่อเด็กเปิดแอปหรือเปิดเพลงครั้งถัดไป',
  mo_bgMusic: 'เพลงคริสต์มาสพื้นหลัง', mos_bgMusic: 'เพลงที่เล่นตอนเปิดแอป และปุ่ม 🔊',
  mo_songsTab: 'แท็บเพลง', mos_songsTab: 'ปุ่ม 🎵 เพลง ที่แถบด้านล่าง',
  mo_festive: 'โหมดพิเศษ (แตะต้นไม้ 5 ครั้ง)', mos_festive: 'ของขวัญกระจาย แสงสีทอง และเพลง Joy to the World',
  mo_festiveSfx: 'เสียงวิ้งตอนแตะในโหมดพิเศษ',
  mo_lyrics: 'เนื้อเพลงและคอร์ดในแอป', mos_lyrics: 'ปิดแล้วจะเห็นแค่แผ่นเพลงต้นฉบับ', mo_video: 'วิดีโอ YouTube', mo_metro: 'เครื่องเคาะจังหวะ', mos_metro: 'ปุ่ม 🥁 จังหวะ',
  mo_beatDots: 'จุดจังหวะ', mos_beatDots: 'จุดที่กระพริบตามจังหวะ',
  mo_scroll: 'เลื่อนอัตโนมัติ', mos_scroll: 'ปุ่ม ⏬ เลื่อน', mo_speed: 'ปุ่มความเร็ว', mos_speed: '0.5× – 1.25×',
  mo_beatSync: 'จังหวะตามวิดีโอ', mos_beatSync: 'ใช้จังหวะที่แตะตามวิดีโอไว้',
  mo_lineSync: 'เนื้อเพลงตามวิดีโอ', mos_lineSync: 'บรรทัดที่กำลังร้องสว่างขึ้น',
  mo_chords: 'คอร์ด', mos_chords: 'แสดงคอร์ดเหนือเนื้อเพลง', mo_transpose: 'เปลี่ยนคีย์ ♭ ♯',
  readPic: 'อ่านเนื้อเพลง', reading: 'กำลังอ่านเนื้อเพลงจากรูป', readDone: 'ใส่เนื้อเพลงและคอร์ดจากรูปแล้ว ตรวจในตัวอย่าง แก้ได้ แล้วกดบันทึก',
  readFail: 'อ่านรูปไม่สำเร็จ ลองรูปที่ชัดกว่านี้', readNothing: 'ไม่พบตัวหนังสือในรูป', readGo: 'อ่านจากรูป',
  readReplace: 'เนื้อเพลงที่มีอยู่ในช่องจะถูกแทนที่ด้วยข้อความจากรูป', readHint: 'อัปโหลดรูปแผ่นเพลง แล้วแอปจะใส่เนื้อเพลงและคอร์ดให้เอง (ครั้งแรกโหลดตัวอ่าน ~8 MB)',
  autoFill: 'เติมจังหวะอัตโนมัติจนจบเพลง', autoFillHint: 'แตะตามจังหวะแค่ 8 ครั้งขึ้นไป แล้วกดปุ่มนี้ แอปจะเติมจังหวะที่เหลือให้ตามความเร็วเดิม (ถ้าเพลงช้าลงหรือเร็วขึ้นกลางเพลง ให้แตะยาวขึ้น)',
  autoFilled: (n) => `เติมจังหวะให้แล้ว ${n} จุด`,
  mo_textSize: 'ปรับขนาดตัวอักษร', mo_langSwitch: 'ปุ่มสลับ ไทย / English', mo_origSheet: 'แผ่นเพลงต้นฉบับ',
});
Object.assign(DICT.en, {
  tab_musicset: 'Music settings', m_musicset: 'Turn each music feature on or off for the kids', ms_app: 'Whole app', ms_player: 'Song page',
  moOn: 'on', moOff: 'off', moNote: 'Changes apply the next time a kid opens the app or a song',
  mo_bgMusic: 'Background Christmas music', mos_bgMusic: 'The music when the app opens, and the 🔊 button',
  mo_songsTab: 'Songs tab', mos_songsTab: 'The 🎵 Songs button at the bottom',
  mo_festive: 'Special mode (5 taps on the tree)', mos_festive: 'Flying presents, golden glow and Joy to the World',
  mo_festiveSfx: 'Magic tap sound in special mode',
  mo_lyrics: 'In-app lyrics and chords', mos_lyrics: 'When off, only the original sheet shows', mo_video: 'YouTube video', mo_metro: 'Metronome', mos_metro: 'The 🥁 Beat button',
  mo_beatDots: 'Beat dots', mos_beatDots: 'Dots that flash on the beat',
  mo_scroll: 'Auto-scroll', mos_scroll: 'The ⏬ Scroll button', mo_speed: 'Speed button', mos_speed: '0.5× – 1.25×',
  mo_beatSync: 'Beat follows the video', mos_beatSync: 'Uses the tapped-along beat',
  mo_lineSync: 'Lyrics follow the video', mos_lineSync: 'The line being sung lights up',
  mo_chords: 'Chords', mos_chords: 'Chords over the lyrics', mo_transpose: 'Change key ♭ ♯',
  readPic: 'Read lyrics', reading: 'Reading the lyrics from the picture', readDone: 'Lyrics and chords filled in from the picture. Check the preview, fix anything, then Save',
  readFail: "Couldn't read the picture; try a sharper one", readNothing: 'No text found in the picture', readGo: 'Read the picture',
  readReplace: 'The lyrics now in the box will be replaced by the text from the picture', readHint: 'Upload a song sheet picture and the app fills in the lyrics and chords (first time downloads the reader, ~8 MB)',
  autoFill: 'Auto-fill the beat to the end', autoFillHint: 'Tap just 8 or more beats, then press this; the app fills the rest at the same tempo (if the song speeds up or slows down, tap for longer)',
  autoFilled: (n) => `${n} beats filled in`,
  mo_textSize: 'Text size', mo_langSwitch: 'Thai / English switch', mo_origSheet: 'Original song sheet',
});

// ---- update 23: prize redemption, announcement + verse, weekly summary, offline songs, version page
Object.assign(DICT.th, {
  tab_redeem: 'แลกของรางวัล', m_redeem: 'ให้ของรางวัลและหักคะแนนที่ใช้แลกได้', tab_notice: 'ประกาศและข้อพระคัมภีร์', m_notice: 'ข้อความบนหน้าแรกของเด็ก',
  tab_weekly: 'สรุปประจำสัปดาห์', m_weekly: 'ใครขาด ใครได้คะแนนมาก เพลงที่เปิดบ่อย', tab_about: 'เวอร์ชันและสิ่งที่เปลี่ยน', m_about: (v) => `ตอนนี้ใช้เวอร์ชัน ${v}`,
  canSpend: 'ใช้แลกได้', canSpendOf: (n) => `คะแนนที่ ${n} ใช้แลกได้`, rankPts: 'คะแนนอันดับ',
  rd1: 'ใครมาแลกของรางวัล?', rd2: 'เลือกของรางวัล', rdHist: 'ของที่แลกไปแล้ว', rdUndo: 'คืนคะแนน',
  rdLeft: (n) => `แลกแล้วเหลือ ${n} ⭐`, rdShort: (n) => `คะแนนไม่พอ ขาดอีก ${n} ⭐`, rdGo: 'ให้ของรางวัล',
  rdConfirm: (item, kid, price, left) => `ให้ "${item}" แก่ ${kid}?\nหัก ${price} ⭐ จากคะแนนที่ใช้แลกได้ (จะเหลือ ${left} ⭐)\nคะแนนอันดับไม่เปลี่ยน`,
  rdDone: (kid, item) => `${kid} ได้ ${item} แล้ว`,
  rdUndoWarn: (kid, item, price) => `ยกเลิกการแลก "${item}" ของ ${kid}?\n${kid} จะได้ ${price} ⭐ คืน`,
  annTitle: 'ประกาศ', annLbl: 'ข้อความสั้น ๆ 1 บรรทัด', annHint: 'แสดงบนสุดของหน้าแรกของเด็ก เช่น "อาทิตย์นี้อย่าลืมเอาแผ่นเพลงมานะ" · เว้นว่างแล้วบันทึก = ไม่แสดง',
  verseWeek: 'ข้อพระคัมภีร์ประจำสัปดาห์', verseLbl: 'ข้อความ', verseRefLbl: 'ที่มา', verseRefEg: 'เช่น ลูกา 2:11',
  verseHint: 'แสดงใต้อันดับในหน้าแรก และในเมนูพระคัมภีร์ · เว้นว่างแล้วบันทึก = ไม่แสดง',
  wkSub: '7 วันที่ผ่านมา', wkPts: 'คะแนนที่ให้', wkCame: 'มารอบล่าสุด', wkPhones: 'เครื่องที่เปิดแอป', wkFb: 'ความคิดเห็น',
  wkMissed: 'ไม่ได้มา 2 รอบติดกัน', wkMissedSub: (a, b) => `รอบ ${a} และ ${b}`, wkNeed2: 'ต้องเช็กชื่ออย่างน้อย 2 รอบก่อน', wkNoMiss: 'ไม่มีใครขาด 2 รอบติดกัน',
  wkTop: 'ได้คะแนนมากที่สุด', wkSongs: 'เพลงที่เปิดบ่อย', wkSongN: (n, d) => `เปิด ${n} ครั้ง จาก ${d} เครื่อง`, wkPrizes: 'ของรางวัลที่แลกไป', notChecked: 'ไม่ได้เช็ก',
  verUsing: 'เวอร์ชันที่ใช้อยู่', verChecking: 'กำลังตรวจเวอร์ชันล่าสุด', verLatest: 'เครื่องนี้เป็นเวอร์ชันล่าสุดแล้ว', verNew: (v) => `มีเวอร์ชันใหม่ (${v})`,
  verNoCheck: 'ตรวจเวอร์ชันล่าสุดไม่ได้ (ไม่มีอินเทอร์เน็ต)', verUpdate: 'อัปเดตตอนนี้', clogTitle: 'สิ่งที่เปลี่ยนในแต่ละเวอร์ชัน', verN: (v) => `เวอร์ชัน ${v}`,
  offlineBar: 'ไม่มีอินเทอร์เน็ต — แสดงข้อมูลล่าสุดที่เก็บไว้', savedOffline: 'เก็บเพลงไว้ในเครื่องแล้ว เปิดได้แม้ไม่มีอินเทอร์เน็ต', videoNeedsNet: 'วิดีโอต้องใช้อินเทอร์เน็ต',
  xs_redeem: 'ของรางวัลที่แลก', xc_spent: 'คะแนนที่แลกไป', lt_redeem: 'แลกของรางวัล',
});
Object.assign(DICT.en, {
  tab_redeem: 'Give a prize', m_redeem: 'Hand out a prize and take off points to spend', tab_notice: 'Announcement & verse', m_notice: "Messages on the kids' home page",
  tab_weekly: 'Weekly summary', m_weekly: 'Who missed, top gainers, most opened songs', tab_about: 'Version & changes', m_about: (v) => `Now on version ${v}`,
  canSpend: 'Points to spend', canSpendOf: (n) => `${n}'s points to spend`, rankPts: 'Ranking points',
  rd1: 'Who is getting a prize?', rd2: 'Pick the prize', rdHist: 'Prizes already given', rdUndo: 'Give points back',
  rdLeft: (n) => `${n} ⭐ left after this`, rdShort: (n) => `Not enough points: ${n} ⭐ short`, rdGo: 'Give the prize',
  rdConfirm: (item, kid, price, left) => `Give "${item}" to ${kid}?\n${price} ⭐ comes off their points to spend (${left} ⭐ left)\nRanking points do not change`,
  rdDone: (kid, item) => `${kid} got ${item}`,
  rdUndoWarn: (kid, item, price) => `Cancel "${item}" for ${kid}?\n${kid} gets ${price} ⭐ back`,
  annTitle: 'Announcement', annLbl: 'One short line', annHint: 'Shown at the top of the kids\' home page, e.g. "Bring your song sheet this Sunday" · leave empty and save to hide it',
  verseWeek: 'Verse of the week', verseLbl: 'Verse text', verseRefLbl: 'Reference', verseRefEg: 'e.g. Luke 2:11',
  verseHint: 'Shown under the ranking on the home page and in the Bible menu · leave empty and save to hide it',
  wkSub: 'The last 7 days', wkPts: 'Points given', wkCame: 'Came last round', wkPhones: 'Phones that opened the app', wkFb: 'Feedback',
  wkMissed: 'Missed 2 rounds in a row', wkMissedSub: (a, b) => `Rounds on ${a} and ${b}`, wkNeed2: 'Needs at least 2 attendance rounds first', wkNoMiss: 'Nobody missed 2 rounds in a row',
  wkTop: 'Top point gainers', wkSongs: 'Most opened songs', wkSongN: (n, d) => `Opened ${n} times on ${d} phones`, wkPrizes: 'Prizes given', notChecked: 'not checked',
  verUsing: 'Version in use', verChecking: 'Checking for the latest version', verLatest: 'This phone has the latest version', verNew: (v) => `A new version is out (${v})`,
  verNoCheck: "Couldn't check for the latest version (no internet)", verUpdate: 'Update now', clogTitle: 'What changed in each version', verN: (v) => `Version ${v}`,
  offlineBar: 'No internet — showing the last saved data', savedOffline: 'Songs are saved on this phone and open with no internet', videoNeedsNet: 'The video needs internet',
  xs_redeem: 'Prizes given', xc_spent: 'Points spent', lt_redeem: 'Prize given',
});

// ---- update 24: prize zoom, install as an app, change log export
Object.assign(DICT.th, {
  pzEnough: (n) => `${n} มีคะแนนพอแลกแล้ว!`, pzNeed: (n) => `สะสมอีก ${n} ⭐ ก็แลกได้`,
  installApp: 'ติดตั้งเป็นแอป', installSub: 'มีไอคอนบนหน้าจอ เปิดได้แม้ไม่มีเน็ต',
  insAnd1: 'แตะปุ่ม ⋮ มุมขวาบนของ Chrome', insAnd2: 'เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"', insAnd3: 'แตะ "ติดตั้ง"',
  insAndNote: 'ถ้าไม่เห็นตัวเลือกนี้ ให้เปิดลิงก์ใน Chrome (ไม่ใช่ใน LINE หรือ Facebook)',
  insIos1: 'แตะปุ่ม แชร์ (สี่เหลี่ยมมีลูกศรขึ้น) ด้านล่างของ Safari', insIos2: 'เลื่อนลงแล้วเลือก "เพิ่มไปยังหน้าจอโฮม"', insIos3: 'แตะ "เพิ่ม"',
  insIosNote: 'ต้องเปิดใน Safari (ไม่ใช่ใน LINE หรือ Facebook)',
  ev_prize_zoom: 'ดูของรางวัลแบบขยาย', ev_install: 'ติดตั้งเป็นแอป',
  clogExport: 'ส่งออกรายการเปลี่ยนแปลงเป็น Excel', verThis: 'ตอนนี้', verThis: 'ตอนนี้', clogSheet: 'สิ่งที่เปลี่ยน', clogUpd: 'อัปเดต', clogVer: 'เวอร์ชัน', clogArea: 'ส่วน', clogItem: 'สิ่งที่เปลี่ยน', clogDate: 'วันที่',
});
Object.assign(DICT.en, {
  pzEnough: (n) => `${n} has enough points for this!`, pzNeed: (n) => `Collect ${n} more ⭐ to get it`,
  installApp: 'Install as an app', installSub: 'An icon on your home screen; works without internet',
  insAnd1: 'Tap ⋮ at the top right of Chrome', insAnd2: 'Choose "Install app" or "Add to Home screen"', insAnd3: 'Tap "Install"',
  insAndNote: "If you don't see it, open the link in Chrome (not inside LINE or Facebook)",
  insIos1: 'Tap Share (the square with an up arrow) at the bottom of Safari', insIos2: 'Scroll down and choose "Add to Home Screen"', insIos3: 'Tap "Add"',
  insIosNote: 'It has to be opened in Safari (not inside LINE or Facebook)',
  ev_prize_zoom: 'Viewed a prize up close', ev_install: 'Installed as an app',
  clogExport: 'Export the change log to Excel', verThis: 'now', verThis: 'now', clogSheet: 'Changes', clogUpd: 'Update', clogVer: 'Version', clogArea: 'Area', clogItem: 'Change', clogDate: 'Date',
});

// ---- update 25: super admin
Object.assign(DICT.th, {
  g_super: 'ผู้ดูแลสูงสุด', tab_super: 'หน้าผู้ดูแลสูงสุด', m_super: 'สวิตช์พิเศษ และรายละเอียดสำหรับ AI', saTitle: 'ผู้ดูแลสูงสุด',
  saCheckMail: 'เปิดอีเมลของคุณ', saSentTo: (e) => `ส่งลิงก์เข้าสู่ระบบไปที่ ${e} แล้ว`,
  saStep1: 'เปิดอีเมลจาก Supabase ชื่อ "Your sign-in link"', saStep2: 'แตะ "Sign in" ในอีเมล (เปิดในเครื่องที่จะใช้หน้าผู้ดูแลสูงสุด)', saStep3: 'แอปจะเปิดหน้าผู้ดูแลสูงสุดให้เอง',
  saMailNote: 'ลิงก์ใช้ได้ครั้งเดียวและหมดอายุเร็ว ต้องเปิดภายใน 20 นาทีหลังใส่รหัสผ่าน · ส่งอีเมลได้ไม่เกิน 2 ฉบับต่อชั่วโมง · ถ้าไม่เห็นให้ดูในจดหมายขยะ',
  saLocked: (m) => `ใส่รหัสผิดหลายครั้ง ล็อกไว้ ${m} นาที`, saRate: 'ส่งอีเมลบ่อยเกินไป รอสักครู่แล้วลองใหม่ (ได้ 2 ฉบับต่อชั่วโมง)', saSendFail: 'ส่งอีเมลไม่สำเร็จ ลองใหม่อีกครั้ง',
  saWelcome: (u) => `ยินดีต้อนรับ ${u}`, saNeedBoth: 'ต้องยืนยัน 2 ขั้นตอน', saNeedPw: 'ใส่ชื่อผู้ใช้และรหัสผ่าน แล้วเปิดลิงก์ใหม่ที่ส่งไปทางอีเมล',
  saOldLink: 'ลิงก์นี้เปิดก่อนใส่รหัสผ่าน ใส่ชื่อผู้ใช้และรหัสผ่านอีกครั้ง แล้วเปิดลิงก์ใหม่', saSendLink: 'ส่งลิงก์ทางอีเมล',
  saLinkBad: 'ลิงก์ในอีเมลหมดอายุหรือใช้ไปแล้ว ลองเข้าสู่ระบบใหม่', saSetup: 'ตั้งค่าผู้ดูแลสูงสุด',
  saSetupIntro: 'ครั้งแรกเท่านั้น: ตั้งชื่อผู้ใช้และรหัสผ่านของผู้ดูแลสูงสุด ต่อไปเข้าสู่ระบบด้วยชื่อและรหัสนี้ แล้วเปิดลิงก์ที่ส่งไปทางอีเมล',
  saPw2: 'ใส่รหัสผ่านอีกครั้ง', saPwHint: 'อย่างน้อย 4 ตัว (8 ตัวขึ้นไปปลอดภัยกว่า)', saCreate: 'สร้างผู้ดูแลสูงสุด', saPwDiff: 'รหัสผ่านสองช่องไม่ตรงกัน',
  saWeakPw: (n) => `รหัสผ่าน ${n} ตัวเดาได้ง่าย\nคนที่รู้รหัสยังต้องเปิดอีเมลของคุณได้ด้วย แต่รหัสที่ยาวกว่าปลอดภัยกว่า\nใช้รหัสนี้ต่อไหม?`, saKeepPw: 'ใช้รหัสนี้',
  saClaim_exists: 'มีผู้ดูแลสูงสุดอยู่แล้ว', saClaim_not_owner: 'อีเมลนี้ไม่ใช่ของเจ้าของแอป', saClaim_bad_username: 'ชื่อผู้ใช้ใช้ได้เฉพาะ A–Z 0–9 . _ - (2–30 ตัว)',
  saClaim_short_password: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัว', saClaim_no_session: 'กรุณาเปิดลิงก์จากอีเมลอีกครั้ง', saClaim_x: 'ทำไม่สำเร็จ ลองใหม่อีกครั้ง',
  saUntil: (t) => `ผู้ดูแลสูงสุด · ใช้ได้ถึง ${t} (หลังจากนั้นต้องยืนยันใหม่)`, saLockBtn: 'ล็อก', saKidsApp: 'แอปของเด็ก',
  saInstallSub: 'แสดงปุ่ม "ติดตั้งเป็นแอป" ในเมนูของเด็ก (ค่าเริ่มต้น: ปิด)',
  saAi: 'รายละเอียดสำหรับ AI', saAiSub: 'ไฟล์ส่งต่องาน (HANDOFF.md) ที่อัปเดตทุกครั้งที่ AI แก้แอป กด "คัดลอก" แล้ววางในแชท AI ใหม่ AI จะเข้าใจแอปทั้งหมดและทำงานต่อได้',
  saHoOk: (v, n) => `เป็นปัจจุบัน: อัปเดตสำหรับเวอร์ชัน ${v} (${n} บรรทัด)`, saHoOld: (h, v) => `ยังไม่อัปเดต: ไฟล์เขียนไว้สำหรับเวอร์ชัน ${h} แต่แอปเป็นเวอร์ชัน ${v}`,
  saHoFail: 'โหลดไฟล์ส่งต่องานไม่ได้', saCopy: 'คัดลอกเป็นข้อความสั่ง AI', saDownload: 'ดาวน์โหลด .md', saCopied: 'คัดลอกแล้ว วางในแชท AI ได้เลย',
  saNext: 'กำลังจะมา', saN1: 'โปรแกรม: บันทึกแอปแต่ละแบบแยกกัน แต่ละโปรแกรมมีลิงก์ของตัวเอง ข้อมูลเดิมไม่หาย', saN2: 'ตั้งค่าโปรแกรม: ชื่อ คำ ธีม (คริสต์มาส อีสเตอร์ คริสตจักร) แบบอักษรและขนาด',
  saN3: 'จัดหน้าตาแบบลากวาง', saN4: 'ชุดอีสเตอร์: ฉาก 3 มิติ เพลง และการล่าไข่', saN5: 'ระบบเข้าสู่ระบบด้วยชื่อผู้ใช้สำหรับสมาชิก (เปิด/ปิดได้)', saN6: 'ส่งออก SQL และเครื่องมือวิเคราะห์ข้อมูล',
});
Object.assign(DICT.en, {
  g_super: 'Super admin', tab_super: 'Super admin page', m_super: 'Special switches and the details for AI', saTitle: 'Super admin',
  saCheckMail: 'Check your email', saSentTo: (e) => `A sign-in link was sent to ${e}`,
  saStep1: 'Open the email from Supabase called "Your sign-in link"', saStep2: 'Tap "Sign in" in the email (on the device where you want the super admin page)', saStep3: 'The app opens the super admin page by itself',
  saMailNote: 'The link works once and expires soon; open it within 20 minutes of entering the password · at most 2 emails an hour · check spam if you do not see it',
  saLocked: (m) => `Too many wrong tries; locked for ${m} minutes`, saRate: 'Too many emails; wait a while and try again (2 an hour)', saSendFail: "Couldn't send the email; try again",
  saWelcome: (u) => `Welcome, ${u}`, saNeedBoth: 'Two steps needed', saNeedPw: 'Enter the username and password, then open the new link sent by email',
  saOldLink: 'This link was opened before the password was entered. Enter the username and password again, then open the new link', saSendLink: 'Send the link by email',
  saLinkBad: 'The email link has expired or was already used; sign in again', saSetup: 'Set up the super admin',
  saSetupIntro: 'First time only: choose the super admin username and password. From then on, sign in with them and open the link sent by email.',
  saPw2: 'Password again', saPwHint: 'At least 4 characters (8 or more is safer)', saCreate: 'Create the super admin', saPwDiff: 'The two passwords are different',
  saWeakPw: (n) => `A ${n}-character password is easy to guess.\nSomeone who knows it would still need your email, but a longer one is safer.\nKeep this password?`, saKeepPw: 'Keep it',
  saClaim_exists: 'There is already a super admin', saClaim_not_owner: "This email is not the app owner's", saClaim_bad_username: 'Username: only A–Z 0–9 . _ - (2–30 characters)',
  saClaim_short_password: 'The password needs at least 4 characters', saClaim_no_session: 'Please open the link from the email again', saClaim_x: "Couldn't do that; try again",
  saUntil: (t) => `Super admin · until ${t} (then both steps again)`, saLockBtn: 'Lock', saKidsApp: "Kids' app",
  saInstallSub: 'Show "Install as an app" in the kids\' menu (default: off)',
  saAi: 'Details for AI', saAiSub: 'The handoff file (HANDOFF.md), updated every time an AI changes the app. Press "Copy", paste it into a new AI chat, and the AI understands the whole app and can carry on.',
  saHoOk: (v, n) => `Up to date: written for version ${v} (${n} lines)`, saHoOld: (h, v) => `Not updated: written for version ${h}, but the app is version ${v}`,
  saHoFail: "Couldn't load the handoff file", saCopy: 'Copy as an AI prompt', saDownload: 'Download .md', saCopied: 'Copied; paste it into the AI chat',
  saNext: 'Coming next', saN1: 'Programs: save each customised app separately, each with its own link; existing data kept', saN2: 'Program settings: name, wording, themes (Christmas, Easter, church), font and size',
  saN3: 'Drag-and-drop layout', saN4: 'Easter pack: 3D scene, music and an egg hunt', saN5: 'Username login for members (can be switched on/off)', saN6: 'SQL export and data analysis tools',
});

// ---- update 26: clearer super admin page, grouped music switches, "simple songs" for all songs
Object.assign(DICT.th, {
  saIntro: 'หน้านี้มีแค่คุณที่เข้าได้ ใช้ตั้งค่าที่ผู้ดูแลคนอื่นเปลี่ยนไม่ได้ และเก็บไฟล์อธิบายแอปสำหรับส่งให้ AI',
  saUntil: (t) => `เข้าอยู่ถึง ${t} หลังจากนั้นต้องเข้าสู่ระบบใหม่ (รหัสผ่าน + ลิงก์อีเมล)`,
  saOutBtn: 'ออกจากระบบผู้ดูแลสูงสุด', saOutHint: 'ใช้เมื่อเสร็จแล้ว หรือเมื่อใช้เครื่องของคนอื่น ครั้งหน้าต้องใส่รหัสผ่านและเปิดลิงก์อีเมลใหม่',
  saOutWarn: 'ออกจากระบบผู้ดูแลสูงสุดในเครื่องนี้?\nครั้งหน้าต้องใส่ Miruku + รหัสผ่าน แล้วเปิดลิงก์ในอีเมลอีกครั้ง',
  saHoRead: (n) => `อ่านไฟล์ส่งต่องาน (${n} หัวข้อ)`, saHoStart: 'เริ่มต้น', saHoLines: (n) => `${n} บรรทัด`,
  mg_app: 'ทั้งแอป', mg_see: 'สิ่งที่เด็กเห็นในหน้าเพลง', mg_text: 'เนื้อเพลงและคอร์ดในแอป', mg_tools: 'ปุ่มช่วยซ้อม', mg_sync: 'ตามวิดีโอ (ต้องแตะตามวิดีโอไว้ก่อน)',
  simpleSongs: 'ทุกเพลง: วิดีโอ + แผ่นเพลงต้นฉบับเท่านั้น', simpleSongsSub: 'เปิดอยู่ = ทุกเพลงแสดงแค่วิดีโอ YouTube และแผ่นเพลงต้นฉบับ ปิด = ใช้สวิตช์ด้านล่างและสวิตช์ของแต่ละเพลง',
  simpleOnNote: 'ตอนนี้ทุกเพลงแสดงแค่วิดีโอและแผ่นเพลงต้นฉบับ สวิตช์ของเพลงนี้จะใช้เมื่อปิดโหมดนี้ใน', simpleOnNote2: 'ตอนนี้ทุกเพลงแสดงแค่วิดีโอและแผ่นเพลงต้นฉบับ สวิตช์ด้านล่างจะใช้เมื่อปิดสวิตช์ด้านบน',
});
Object.assign(DICT.en, {
  saIntro: 'Only you can open this page. It holds the settings other admins cannot change, and the file that explains the app to an AI.',
  saUntil: (t) => `Signed in until ${t}; after that, sign in again (password + email link)`,
  saOutBtn: 'Sign out of super admin', saOutHint: 'Use it when you are done, or on someone else\'s phone. Next time you enter the password and open a new email link.',
  saOutWarn: 'Sign out of super admin on this device?\nNext time: Miruku + password, then open the email link again',
  saHoRead: (n) => `Read the handoff (${n} sections)`, saHoStart: 'Start', saHoLines: (n) => `${n} lines`,
  mg_app: 'Whole app', mg_see: 'What kids see on a song page', mg_text: 'In-app lyrics and chords', mg_tools: 'Practice buttons', mg_sync: 'Follow the video (needs a tap-along first)',
  simpleSongs: 'All songs: video + original sheet only', simpleSongsSub: 'On = every song shows only its YouTube video and the original song sheet. Off = the switches below and each song\'s own switches apply',
  simpleOnNote: 'Every song now shows only the video and the original sheet. This song\'s switches apply when that is turned off in', simpleOnNote2: 'Every song now shows only the video and the original sheet. The switches below apply when the switch above is off.',
});

// ---- update 27: programs
Object.assign(DICT.th, {
  progTitle: 'โปรแกรม', progSub: 'แต่ละโปรแกรม (เช่น คริสต์มาส อีสเตอร์ ค่ายฤดูร้อน) มีลิงก์ของตัวเอง และมีรายชื่อ คะแนน การเช็กชื่อ ร้านค้า เพลง และการตั้งค่าแยกกัน ข้อมูลไม่ปนกันและไม่ถูกลบ',
  progNew: 'สร้างโปรแกรมใหม่', progHere: 'ที่เปิดอยู่', progArchived: 'เก็บแล้ว', progCopy: 'คัดลอกลิงก์', progOpen: 'เปิดหน้าผู้ดูแล', progEdit: 'แก้ไข',
  progCopied: 'คัดลอกลิงก์แล้ว', progName: 'ชื่อโปรแกรม', progNameEg: 'เช่น Youth Alpha อีสเตอร์ 2027',
  progArchive: 'เก็บโปรแกรมนี้ (ซ่อนจากรายการ)', progArchiveHint: 'ข้อมูลไม่ถูกลบ ลิงก์ยังเปิดได้ เปิดคืนได้ทุกเมื่อ',
  progSlug: 'ชื่อในลิงก์ (ภาษาอังกฤษ)', progSlugHint: 'a–z ตัวเลข และ - เช่น easter-2027 · เปลี่ยนภายหลังไม่ได้',
  progFrom: 'เริ่มจากโปรแกรม', progFromHint: 'คัดลอกหมวดคะแนนและการตั้งค่าจากโปรแกรมนี้เสมอ (ไม่คัดลอกคะแนน การเช็กชื่อ หรือความคิดเห็น)',
  progPeople: 'คัดลอกรายชื่อเด็ก (เริ่มคะแนนที่ 0)', progShop: 'คัดลอกของรางวัล', progSongs: 'คัดลอกเพลง', progCreate: 'สร้าง',
  progSlugBad: 'ชื่อในลิงก์ต้องมีอย่างน้อย 2 ตัว (a–z, 0–9, -)', progSlugUsed: 'ชื่อในลิงก์นี้มีโปรแกรมอื่นใช้แล้ว', progMade: (n) => `สร้าง "${n}" แล้ว`,
  progNow: 'โปรแกรม', progUnknown: 'ไม่พบโปรแกรมในลิงก์นี้ จึงเปิดโปรแกรมหลักแทน',
});
Object.assign(DICT.en, {
  progTitle: 'Programs', progSub: 'Each program (e.g. Christmas, Easter, a summer camp) has its own link and its own people, points, attendance, shop, songs and settings. Nothing is mixed and nothing is deleted.',
  progNew: 'New program', progHere: 'open now', progArchived: 'archived', progCopy: 'Copy link', progOpen: 'Open admin', progEdit: 'Edit',
  progCopied: 'Link copied', progName: 'Program name', progNameEg: 'e.g. Youth Alpha Easter 2027',
  progArchive: 'Archive this program (hide it from lists)', progArchiveHint: 'No data is deleted, the link still opens, and it can be brought back any time',
  progSlug: 'Name in the link (English)', progSlugHint: 'a–z, numbers and -, e.g. easter-2027 · cannot be changed later',
  progFrom: 'Start from program', progFromHint: 'Always copies its point categories and settings (never points, attendance or feedback)',
  progPeople: 'Copy the kids list (points start at 0)', progShop: 'Copy the prizes', progSongs: 'Copy the songs', progCreate: 'Create',
  progSlugBad: 'The link name needs at least 2 characters (a–z, 0–9, -)', progSlugUsed: 'Another program already uses this link name', progMade: (n) => `Created "${n}"`,
  progNow: 'Program', progUnknown: 'No program has this link, so the main program opened instead',
});

// ---- update 28: program settings (super admin page)
Object.assign(DICT.th, {
  lookTitle: 'ตั้งค่าโปรแกรมนี้', lookSub: (n) => `ใช้กับ "${n}" เท่านั้น (โปรแกรมของลิงก์ที่เปิดอยู่)`,
  lookName: 'ชื่อบนแถบด้านบน', lookEmoji: 'อีโมจิ', lookPack: 'ชุดธีม', lookFont: 'แบบตัวอักษร', lookSize: 'ขนาดตัวอักษร',
  lookParts: 'ส่วนที่เปิดใช้', lookWords: 'เปลี่ยนคำในแอป', lookWordsSub: 'ไม่บังคับ', lookWordsHint: 'เว้นว่างไว้ = ใช้คำเดิม (คำเดิมแสดงเป็นตัวจาง)', lookSave: 'บันทึกการตั้งค่า',
  pack_christmas: '🎄 คริสต์มาส', pack_plain: '⛪ โบสถ์ (เรียบ ๆ)',
  feat_songs: 'เพลง', feat_shop: 'ร้านค้า', feat_feedback: 'ความคิดเห็น', feat_bible: 'พระคัมภีร์', feat_music: 'เสียงเพลงพื้นหลัง',
  feat_tree: 'ต้นไม้ 3 มิติ', feat_snow: 'หิมะ', feat_santa: 'ซานต้าโผล่', feat_festive: 'โหมดพิเศษ',
});
Object.assign(DICT.en, {
  lookTitle: 'This program’s settings', lookSub: (n) => `Only for "${n}" (the program of the link that is open)`,
  lookName: 'Name on the top bar', lookEmoji: 'Emoji', lookPack: 'Theme pack', lookFont: 'Font', lookSize: 'Text size',
  lookParts: 'Parts that are on', lookWords: 'Change words in the app', lookWordsSub: 'optional', lookWordsHint: 'Leave empty = normal words (shown faded)', lookSave: 'Save settings',
  pack_christmas: '🎄 Christmas', pack_plain: '⛪ Church (plain)',
  feat_songs: 'Songs', feat_shop: 'Shop', feat_feedback: 'Feedback', feat_bible: 'Bible', feat_music: 'Background music',
  feat_tree: '3D tree', feat_snow: 'Snow', feat_santa: 'Santa peeks', feat_festive: 'Special mode',
});

// ---- update 29: layout editor (super admin page)
Object.assign(DICT.th, {
  layTitle: 'จัดหน้าตา', laySub: 'ลาก ⠿ ด้วยนิ้วหรือเมาส์เพื่อเรียงลำดับ กด 👁️ เพื่อซ่อน/แสดง ดูตัวอย่างด้านข้าง แล้วกดบันทึก (ใช้กับโปรแกรมนี้เท่านั้น)',
  lay_tabs: 'แท็บด้านล่าง', lay_home: 'หน้าแรกของเด็ก', lay_menu: 'หน้าเมนู',
  // v31 member login
  mLoginTitle: 'เข้าสู่ระบบ', mLoginSub: 'ใส่ชื่อผู้ใช้และรหัสผ่านที่ผู้ใหญ่ให้ไว้ เพื่อดูคะแนนของหนู', mLoginSubAll: 'ต้องเข้าสู่ระบบก่อนจึงจะใช้แอปได้ ใส่ชื่อผู้ใช้และรหัสผ่านที่ผู้ใหญ่ให้ไว้',
  mLoginRowSub: 'ใช้ชื่อผู้ใช้และรหัสผ่านที่ผู้ใหญ่ให้', mLoginHint: 'เข้าสู่ระบบเพื่อดูคะแนนของหนู', mFillBoth: 'ใส่ชื่อผู้ใช้และรหัสผ่านให้ครบนะ', mSigning: 'รอสักครู่…',
  mWrong: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูก ลองใหม่อีกครั้งนะ', mLocked: (n) => `ใส่ผิดหลายครั้ง ลองใหม่อีก ${n} นาทีนะ`, mNoNet: 'ต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้งนะ',
  mForgot: 'ลืมรหัสผ่าน? บอกผู้ใหญ่ให้ตั้งรหัสใหม่ให้', mSignedAs: (n) => `เข้าสู่ระบบเป็น ${n}`, mAccountSub: 'เปลี่ยนรหัสผ่าน หรือออกจากระบบ',
  mUserLine: (u) => `ชื่อผู้ใช้: ${u}`, mChangePw: 'เปลี่ยนรหัสผ่าน', mPwOld: 'รหัสผ่านเดิม', mPwNew: 'รหัสผ่านใหม่ (อย่างน้อย 4 ตัว)', mPwAgain: 'รหัสผ่านใหม่อีกครั้ง',
  mPwShort: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัว', mPwMatch: 'รหัสผ่านใหม่สองช่องไม่ตรงกัน', mPwWrong: 'รหัสผ่านเดิมไม่ถูก', mPwDone: 'เปลี่ยนรหัสผ่านแล้ว', mLogout: 'ออกจากระบบ',
  mOnlyOwn: 'คะแนนแยกตามหมวดดูได้เฉพาะของตัวเอง', lay_account: 'เข้าสู่ระบบ (เมื่อเปิดระบบสมาชิก)',
  ev_member_login: 'เข้าสู่ระบบ', ev_member_logout: 'ออกจากระบบ', ev_member_pw: 'เปลี่ยนรหัสผ่าน', lt_members: 'บัญชีสมาชิก', lt_programs: 'โปรแกรม',
  tab_members: 'บัญชีสมาชิก', m_members: 'ชื่อผู้ใช้และรหัสผ่านของเด็ก', memMode: 'ระบบเข้าสู่ระบบของโปรแกรมนี้',
  lm_off: 'ปิด', lm_personal: 'เห็นคะแนนละเอียดเฉพาะของตัวเอง', lm_all: 'ต้องเข้าสู่ระบบก่อนดูทุกอย่าง',
  lm_off_sub: 'แอปเหมือนเดิม ไม่ต้องเข้าสู่ระบบ เด็กแตะชื่อตัวเอง', lm_personal_sub: 'ทุกคนเห็นอันดับ (ชื่อเล่น รูป คะแนน) แต่คะแนนแยกตามหมวดเห็นเฉพาะเด็กที่เข้าสู่ระบบ ของตัวเองเท่านั้น',
  lm_all_sub: 'ต้องเข้าสู่ระบบก่อน จึงจะเห็นอันดับ เพลง และของรางวัล ผู้ใหญ่ที่เข้าสู่ระบบเห็นทุกอย่างเสมอ',
  memOffHint: 'สร้างบัญชีไว้ก่อนได้ บัญชีจะใช้ได้เมื่อซูเปอร์แอดมินเปิดระบบเข้าสู่ระบบ', memAdd: 'เพิ่มบัญชี', memEdit: 'แก้ไขบัญชี', memCount: (n) => `${n} บัญชี`,
  memNone: 'ยังไม่มีบัญชี', memNoKid: 'ไม่ผูกกับเด็ก', memIsOff: 'ปิดอยู่', memLockedNow: 'ล็อก 15 นาที (ใส่รหัสผิด)', memLast: 'เข้าล่าสุด',
  memUserHint: 'ภาษาอังกฤษตัวเล็ก ตัวเลข . _ - ยาว 3–30 ตัว', memDisplay: 'ชื่อที่แสดง', memKid: 'เป็นบัญชีของเด็กคนไหน', memKidHint: 'เด็กที่เข้าสู่ระบบด้วยบัญชีนี้จะเห็นการ์ดคะแนนของคนนี้',
  memNewPw: 'ตั้งรหัสผ่านใหม่', memPwKeep: 'เว้นว่างไว้ = ใช้รหัสเดิม (ตั้งใหม่แล้วบัญชีที่ล็อกจะปลดล็อกด้วย)', memPwHint: 'อย่างน้อย 4 ตัว บอกรหัสนี้ให้เด็กเอง',
  memOff: 'ปิดบัญชี', memOn: 'เปิดบัญชี', memOffWarn: (n) => `ปิดบัญชี "${n}" ใช่ไหม?\nบัญชีนี้จะออกจากระบบทันทีและเข้าใช้ไม่ได้ (ข้อมูลไม่ถูกลบ เปิดใหม่ได้)`,
  memDup: 'ชื่อผู้ใช้นี้มีแล้วในโปรแกรมนี้',
  saLogin: 'ระบบเข้าสู่ระบบของสมาชิก', saLoginSub: 'เลือกว่าเด็กในโปรแกรมนี้ต้องเข้าสู่ระบบหรือไม่ (บัญชีสร้างที่หน้า "บัญชีสมาชิก")', saLoginAllWarn: 'เปลี่ยนเป็น "ต้องเข้าสู่ระบบก่อนดูทุกอย่าง" ใช่ไหม?\nเด็กที่ยังไม่มีบัญชีจะเห็นแค่หน้าเข้าสู่ระบบ',
  saLoginSaved: 'บันทึกระบบเข้าสู่ระบบแล้ว', saLoginAccts: (n) => `บัญชีในโปรแกรมนี้: ${n}`,
  lay_notice: 'ประกาศ', lay_me: 'การ์ดคะแนนของหนู', lay_rank: 'อันดับ', lay_verse: 'ข้อพระคัมภีร์ประจำสัปดาห์',
  layUp: 'เลื่อนขึ้น', layDown: 'เลื่อนลง', layShow: 'แสดง', layHide: 'ซ่อน', layLocked: 'ส่วนนี้ซ่อนไม่ได้',
  laySave: 'บันทึกการจัดหน้า', layReset: 'กลับเป็นแบบเดิม', layResetWarn: 'กลับไปใช้ลำดับเดิมและแสดงทุกส่วนของโปรแกรมนี้?',
});
Object.assign(DICT.en, {
  layTitle: 'Layout', laySub: 'Drag ⠿ with a finger or the mouse to reorder, press 👁️ to hide/show, check the preview, then save (this program only)',
  lay_tabs: 'Bottom tabs', lay_home: 'Kids’ home page', lay_menu: 'Menu page',
  // v31 member login
  mLoginTitle: 'Sign in', mLoginSub: 'Type the username and password an adult gave you to see your points', mLoginSubAll: 'Please sign in to use the app. Type the username and password an adult gave you',
  mLoginRowSub: 'Use the username and password an adult gave you', mLoginHint: 'Sign in to see your points', mFillBoth: 'Please type both the username and the password', mSigning: 'One moment…',
  mWrong: 'Wrong username or password. Please try again', mLocked: (n) => `Too many wrong tries. Try again in ${n} min`, mNoNet: 'No internet. Please try again',
  mForgot: 'Forgot your password? Ask an adult to set a new one', mSignedAs: (n) => `Signed in as ${n}`, mAccountSub: 'Change password or sign out',
  mUserLine: (u) => `Username: ${u}`, mChangePw: 'Change password', mPwOld: 'Old password', mPwNew: 'New password (4+ characters)', mPwAgain: 'New password again',
  mPwShort: 'The password needs at least 4 characters', mPwMatch: 'The two new passwords are not the same', mPwWrong: 'The old password is wrong', mPwDone: 'Password changed', mLogout: 'Sign out',
  mOnlyOwn: 'Points by category can only be seen for yourself', lay_account: 'Sign in (when member login is on)',
  ev_member_login: 'Signed in', ev_member_logout: 'Signed out', ev_member_pw: 'Changed password', lt_members: 'Member accounts', lt_programs: 'Programs',
  tab_members: 'Member accounts', m_members: "Kids' usernames and passwords", memMode: "This program's sign-in",
  lm_off: 'Off', lm_personal: 'Own details only', lm_all: 'Sign in to see anything',
  lm_off_sub: 'The app as before: no sign-in, kids tap their own name', lm_personal_sub: 'Everyone sees the ranking (nickname, avatar, points), but points by category are only shown to the signed-in kid, for themselves',
  lm_all_sub: 'Kids must sign in before they see the ranking, songs and prizes. Signed-in adults always see everything',
  memOffHint: 'You can make accounts now; they start working when the super admin switches member login on', memAdd: 'Add account', memEdit: 'Edit account', memCount: (n) => `${n} accounts`,
  memNone: 'No accounts yet', memNoKid: 'Not linked to a kid', memIsOff: 'Switched off', memLockedNow: 'Locked 15 min (wrong passwords)', memLast: 'Last sign-in',
  memUserHint: 'Small English letters, numbers, . _ -, 3–30 characters', memDisplay: 'Display name', memKid: "Which kid's account", memKidHint: "Signing in with this account shows this kid's points card",
  memNewPw: 'Set a new password', memPwKeep: 'Leave empty to keep the old one (a new one also unlocks a locked account)', memPwHint: 'At least 4 characters. Tell the kid yourself',
  memOff: 'Switch off', memOn: 'Switch on', memOffWarn: (n) => `Switch off the account "${n}"?\nIt is signed out at once and cannot sign in (nothing is deleted; you can switch it on again)`,
  memDup: 'This username already exists in this program',
  saLogin: 'Member login', saLoginSub: 'Choose whether kids in this program must sign in (accounts are made on the "Member accounts" page)', saLoginAllWarn: 'Change to "Sign in to see anything"?\nKids without an account will only see the sign-in page',
  saLoginSaved: 'Member login saved', saLoginAccts: (n) => `Accounts in this program: ${n}`,
  lay_notice: 'Announcement', lay_me: 'My points card', lay_rank: 'Ranking', lay_verse: 'Verse of the week',
  layUp: 'Move up', layDown: 'Move down', layShow: 'Show', layHide: 'Hide', layLocked: 'This part cannot be hidden',
  laySave: 'Save layout', layReset: 'Back to normal', layResetWarn: 'Go back to the normal order and show every part for this program?',
});

// ---- update 30: Easter pack
Object.assign(DICT.th, {
  pack_easter: '🐣 อีสเตอร์', lookPackHint: 'ฉาก 3 มิติและเพลงพื้นหลังของชุดธีมจะเปลี่ยนเมื่อเปิดแอปใหม่',
  eggFind: 'ไข่อีสเตอร์', eggAll: 'เจอไข่ครบแล้ว!', ev_egg_hunt: 'ล่าไข่อีสเตอร์',
  feat_tree: 'ฉาก 3 มิติ', feat_santa: 'ตัวละครโผล่ (ซานต้า / ลูกแกะ)', feat_festive: 'โหมดพิเศษ (ล่าไข่ในชุดอีสเตอร์)', feat_snow: 'หิมะ / กลีบดอกไม้',
});
Object.assign(DICT.en, {
  pack_easter: '🐣 Easter', lookPackHint: 'The pack’s 3D scene and background song change the next time the app is opened',
  eggFind: 'Easter egg', eggAll: 'You found every egg!', ev_egg_hunt: 'Easter egg hunt',
  feat_tree: '3D scene', feat_santa: 'Peeking friend (Santa / lamb)', feat_festive: 'Special mode (egg hunt in Easter)', feat_snow: 'Snow / petals',
});

// ---- update 32: admins per program, merged admin panel, who is online
Object.assign(DICT.th, {
  copyUserLink: 'คัดลอกลิงก์ของแอป', copyUserLinkSub: 'ลิงก์ที่เด็ก ๆ ใช้เปิดแอปของโปรแกรมนี้', userLinkCopied: 'คัดลอกลิงก์ผู้ใช้แล้ว',
  pendingMsg2: 'บัญชีนี้รอผู้ดูแลสูงสุดอนุมัติ และเลือกว่าจะเปิดโปรแกรมไหนได้บ้าง',
  noAccessMsg: 'บัญชีนี้ถูกปิด หรือยังไม่มีโปรแกรมที่เปิดได้ ติดต่อผู้ดูแลสูงสุด',
  otherProgMsg: (n) => `บัญชีนี้เปิดโปรแกรม "${n}" ไม่ได้`, otherProgYours: 'โปรแกรมที่บัญชีนี้เปิดได้:',
  g_settings: 'ตั้งค่า', g_kids: 'เด็ก ๆ',
  tab_admins: 'ผู้ดูแลและสิทธิ์', m_admins: 'เพิ่มผู้ดูแล อนุมัติ และเลือกสิทธิ์ต่อโปรแกรม',
  tab_programs: 'โปรแกรม', m_programs: 'ลิงก์ของแต่ละโปรแกรม สร้างใหม่ เปลี่ยนชื่อ เก็บเข้าคลัง',
  tab_look: 'หน้าตาโปรแกรมนี้', m_look: 'ชื่อ ธีม ตัวอักษร ส่วนต่าง ๆ การจัดหน้า ติดตั้งแอป',
  tab_online: 'ใครออนไลน์อยู่', m_online: 'ผู้ดูแลที่เปิดหน้าผู้ดูแลอยู่ตอนนี้ และอยู่หน้าไหน',
  tab_ai: 'รายละเอียดสำหรับ AI', m_ai: 'ไฟล์ส่งต่องาน (HANDOFF.md) คัดลอกเป็นคำสั่งให้ AI',
  logsSuperNote: 'เห็นได้เฉพาะผู้ดูแลสูงสุด',
  perm_points: 'คะแนนและเช็กชื่อ', perm_kids: 'รายชื่อเด็ก', perm_songs: 'เพลง', perm_shop: 'ร้านและการแลกรางวัล',
  perm_feedback: 'ความคิดเห็น', perm_notice: 'ประกาศและข้อพระคัมภีร์', perm_settings: 'ตั้งค่า',
  permSub_points: 'เช็กชื่อ ให้คะแนน ยกเลิกคะแนน', permSub_kids: 'เพิ่ม/แก้ไขเด็ก และบัญชีสมาชิก', permSub_songs: 'เพิ่ม/แก้ไขเพลง ซิงก์วิดีโอ',
  permSub_shop: 'ของรางวัล และให้รางวัลเด็ก', permSub_feedback: 'อ่านความคิดเห็น เปิด/ปิด และ QR', permSub_notice: 'ข้อความประกาศ และข้อพระคัมภีร์ประจำสัปดาห์',
  permSub_settings: 'หมวดคะแนน สวิตช์เพลง และตั้งค่าทั่วไป', permNone: 'ไม่มีสิทธิ์', permAll: 'ทุกสิทธิ์', permNoProg: 'ยังไม่มีโปรแกรม', permTickAll: 'เลือกทั้งหมด',
  lt_staffprog: 'สิทธิ์ผู้ดูแล', op_PASSWORD: 'ตั้งรหัสผ่านใหม่',
  clogNew: 'มีอะไรใหม่',
  saBadge: 'ผู้ดูแลสูงสุด', saBadgeSub: 'คุณทำได้ทุกอย่างที่ผู้ดูแลทำได้ และมีกลุ่ม "ผู้ดูแลสูงสุด" ด้านล่างเพิ่มเติม',
  lookPageSub: (n) => `ใช้กับโปรแกรมของลิงก์ที่เปิดอยู่: ${n}`,
  saN7: 'โหมดเด็ก / โหมดทั่วไป และหน้าจอคอมพิวเตอร์ที่ใช้พื้นที่เต็ม', saN8: 'ปรับตั้งค่าโปรแกรม: โลโก้รูปภาพ ลากเพื่อเรียง เลือกแบบของแต่ละส่วน',
  saN9: 'ตัวอย่างหน้าจอโทรศัพท์จริงพร้อมข้อมูลตัวอย่าง', saN10: 'ตัวนับผู้เข้าชมและความคิดเห็นบนหน้าแรกของเด็ก', saN11: 'โหมดปิดปรับปรุงต่อโปรแกรม',
  admIntro: 'ผู้ดูแลแต่ละคนเปิดได้เฉพาะโปรแกรมที่เลือก และทำได้เฉพาะสิทธิ์ที่ติ๊กไว้ ฐานข้อมูลตรวจสอบสิทธิ์ทุกครั้ง',
  admNew: 'สร้างบัญชีผู้ดูแล', admWaitingGrp: (n) => `รออนุมัติ (${n})`, admTeam: (n) => `ผู้ดูแล (${n})`,
  admSuperNote: 'บัญชีผู้ดูแลสูงสุดไม่อยู่ในรายการนี้ ผู้ดูแลสูงสุดทำได้ทุกอย่างเสมอ', admIsOff: 'ปิดอยู่', admWaiting: 'รออนุมัติ',
  admApprove: 'อนุมัติ', admName: 'ชื่อที่แสดง', admPwHint: 'อย่างน้อย 6 ตัว ผู้ดูแลสูงสุดพิมพ์เอง แล้วบอกเจ้าของบัญชี',
  admNewHint: 'บัญชีใหม่ยังเปิดโปรแกรมไหนไม่ได้ ขั้นต่อไปจะให้เลือกโปรแกรมและสิทธิ์', admCreate: 'สร้างบัญชี',
  admMade: (u) => `สร้างบัญชี @${u} แล้ว เลือกสิทธิ์ต่อได้เลย`, admDup: 'มีชื่อผู้ใช้นี้แล้ว', admLast: 'เข้าสู่ระบบล่าสุด',
  admWaitingSub: 'บัญชีนี้รออนุมัติ เลือกโปรแกรมและสิทธิ์ แล้วกดอนุมัติ', admActive: 'เปิดใช้บัญชี', admActiveSub: 'ปิดแล้วจะเข้าโปรแกรมไหนไม่ได้เลย (บัญชีไม่ถูกลบ เปิดใหม่ได้)',
  admPerms: 'โปรแกรมและสิทธิ์', admPermsSub: 'ติ๊กอย่างน้อย 1 สิทธิ์ในโปรแกรมที่ให้เปิดได้ โปรแกรมที่ไม่ติ๊กเลยจะเปิดไม่ได้',
  admApproveSave: 'อนุมัติและบันทึก', admPwTitle: 'รหัสผ่าน', admPwSet: 'ตั้งรหัสผ่านใหม่',
  admOffWarn: (n) => `ปิดบัญชี "${n}" ใช่ไหม?\nจะเข้าโปรแกรมไหนไม่ได้เลยจนกว่าจะเปิดใหม่ (ไม่มีอะไรถูกลบ)`, admOff: 'ปิดบัญชี',
  admNoProgWarn: (n) => `"${n}" ยังไม่มีโปรแกรมที่เปิดได้เลย บันทึกแบบนี้ใช่ไหม?`, admPwDone: (u) => `ตั้งรหัสผ่านใหม่ของ @${u} แล้ว`,
  onlineIntro: 'ผู้ดูแลที่เปิดหน้าผู้ดูแลในช่วง 10 นาทีที่ผ่านมา 🟢 = ยังเปิดอยู่ (ภายใน 2 นาที)', agoS: (n) => `${n} วินาทีที่แล้ว`, agoM: (n) => `${n} นาทีที่แล้ว`,
  onlineNone: 'ตอนนี้ไม่มีใครออนไลน์', onlineAuto: 'อัปเดตเองทุก 20 วินาที',
});
Object.assign(DICT.en, {
  copyUserLink: 'Copy app link', copyUserLinkSub: "The link kids use to open this program's app", userLinkCopied: 'User link copied',
  pendingMsg2: 'This account is waiting for the super admin to approve it and choose which programs it may open.',
  noAccessMsg: 'This account is switched off or has no program yet. Please contact the super admin.',
  otherProgMsg: (n) => `This account cannot open the program "${n}".`, otherProgYours: 'Programs this account can open:',
  g_settings: 'Settings', g_kids: 'Kids',
  tab_admins: 'Admins & permissions', m_admins: 'Add admins, approve, choose permissions per program',
  tab_programs: 'Programs', m_programs: "Each program's link; create, rename, archive",
  tab_look: "This program's look", m_look: 'Name, theme, font, parts, layout, install as app',
  tab_online: 'Who is online', m_online: 'Admins on the admin pages right now, and which page',
  tab_ai: 'Details for AI', m_ai: 'The handoff file (HANDOFF.md), copy as an AI prompt',
  logsSuperNote: 'only the super admin can see these',
  perm_points: 'Points & attendance', perm_kids: 'Kids list', perm_songs: 'Songs', perm_shop: 'Shop & prizes',
  perm_feedback: 'Feedback', perm_notice: 'Announcements & verse', perm_settings: 'Settings',
  permSub_points: 'Take attendance, give and undo points', permSub_kids: 'Add/edit kids and member accounts', permSub_songs: 'Add/edit songs, video sync',
  permSub_shop: 'Prizes, and giving prizes to kids', permSub_feedback: 'Read feedback, switch it on/off, QR', permSub_notice: 'The announcement line and verse of the week',
  permSub_settings: 'Point categories, music switches, general settings', permNone: 'no permissions', permAll: 'all permissions', permNoProg: 'no program yet', permTickAll: 'Tick all',
  lt_staffprog: 'Admin permissions', op_PASSWORD: 'New password set',
  clogNew: "What's new",
  saBadge: 'Super admin', saBadgeSub: 'You can do everything an admin can, plus the "Super admin" group below',
  lookPageSub: (n) => `For the program of the open link: ${n}`,
  saN7: 'Kids mode / Normal mode, and a full-width layout on computers', saN8: 'Program settings polish: picture logo, drag to order, a choice for each part',
  saN9: 'A real phone preview with sample data', saN10: "Visits and feedback counters on the kids' home page", saN11: 'Maintenance mode per program',
  admIntro: 'Each admin can open only the programs you choose and do only what is ticked. The database checks this every time.',
  admNew: 'Create an admin account', admWaitingGrp: (n) => `Waiting for approval (${n})`, admTeam: (n) => `Admins (${n})`,
  admSuperNote: 'The super admin account is not in this list; the super admin can always do everything.', admIsOff: 'switched off', admWaiting: 'waiting for approval',
  admApprove: 'Approve', admName: 'Display name', admPwHint: 'At least 6 characters. The super admin types it and tells the account owner.',
  admNewHint: 'A new account cannot open any program yet; next you choose its programs and permissions.', admCreate: 'Create account',
  admMade: (u) => `Account @${u} created; choose its permissions now`, admDup: 'This username already exists', admLast: 'Last sign-in',
  admWaitingSub: 'This account is waiting. Choose programs and permissions, then approve.', admActive: 'Account switched on', admActiveSub: 'When off, it cannot open any program (nothing is deleted; it can be switched on again)',
  admPerms: 'Programs and permissions', admPermsSub: 'Tick at least one permission in each program it may open. A program with nothing ticked cannot be opened.',
  admApproveSave: 'Approve and save', admPwTitle: 'Password', admPwSet: 'Set new password',
  admOffWarn: (n) => `Switch off "${n}"?\nThey cannot open any program until switched on again (nothing is deleted).`, admOff: 'Switch off',
  admNoProgWarn: (n) => `"${n}" has no program they can open. Save like this?`, admPwDone: (u) => `New password set for @${u}`,
  onlineIntro: 'Admins who had an admin page open in the last 10 minutes. 🟢 = still open (within 2 minutes).', agoS: (n) => `${n} s ago`, agoM: (n) => `${n} min ago`,
  onlineNone: 'Nobody is online right now', onlineAuto: 'Updates by itself every 20 seconds',
});

// v33: Kids mode / Normal mode, PC side menu
Object.assign(DICT.th, {
  lookMode: 'รูปแบบแอป', mode_kids: '🧒 โหมดเด็ก (สนุก ตัวใหญ่ มีอีโมจิ)', mode_normal: '💼 โหมดปกติ (เรียบ ดูเป็นมืออาชีพ สำหรับผู้ใหญ่)',
  lookModeHint: 'โหมดปกติ: สีเรียบ ไอคอนเส้นแทนอีโมจิ และปิดฉาก 3 มิติ หิมะ ตัวละครโผล่ โหมดพิเศษ และเพลงพื้นหลังให้ (เปิดกลับได้ด้านล่าง)',
  sideKids: 'ไปหน้าแอปผู้ใช้',
});
Object.assign(DICT.en, {
  lookMode: 'App style', mode_kids: '🧒 Kids mode (playful, big, emoji)', mode_normal: '💼 Normal mode (calm, professional, for adults)',
  lookModeHint: 'Normal mode: calm colours, line icons instead of emoji, and the 3D scene, falling snow, peeking friend, special mode and music are switched off (you can switch them on again below)',
  sideKids: 'Open the users’ app',
});

// v34: program settings polish (logo picture + size, a choice for each playful part)
Object.assign(DICT.th, {
  lookLogo: 'โลโก้', logo_emoji: '😀 อีโมจิ', logo_image: '🖼️ รูปภาพ', lookLogoUp: '📷 เลือกรูปโลโก้', lookLogoChange: '📷 เปลี่ยนรูป',
  lookLogoSize: 'ขนาดโลโก้', lookLogoNone: 'ยังไม่ได้เลือกรูป', lookLogoHint: 'รูปจะถูกย่อให้เล็กลงก่อนอัปโหลด (PNG พื้นใสดูดีที่สุด)',
  lookLogoNeed: 'กรุณาเลือกรูปโลโก้ก่อน หรือเปลี่ยนกลับเป็นอีโมจิ', lookOnOff: 'หน้าที่เปิดใช้',
  lookParts: 'ส่วนตกแต่ง (เลือกแบบของแต่ละส่วน)',
  part_fall: 'สิ่งที่ตกลงมา', part_scene: 'ฉาก 3 มิติ', part_friend: 'ตัวละครโผล่', part_special: 'โหมดพิเศษ (แตะต้นไม้ 5 ครั้ง)', part_music: 'เพลงพื้นหลัง',
  opt_off: '🚫 ปิด', opt_snow: '❄️ หิมะ', opt_petals: '🌸 กลีบดอกไม้', opt_tree: '🎄 ต้นคริสต์มาส', opt_cross: '✝️ กางเขนบนเนินเขา',
  opt_santa: '🎅 ซานต้า', opt_lamb: '🐑 ลูกแกะ', opt_dove: '🕊️ นกพิราบ', opt_gifts: '🎁 กล่องของขวัญ', opt_eggs: '🥚 ล่าไข่อีสเตอร์',
  opt_jingle: '🔔 Jingle Bells', opt_easter: '🎺 Easter Hymn',
  lookPartsHint: 'การเลือกชุดธีมจะตั้งค่าเริ่มต้นให้ทุกส่วน แล้วเปลี่ยนทีละส่วนได้ ฉาก 3 มิติจะเปลี่ยนเมื่อเปิดแอปใหม่',
});
Object.assign(DICT.en, {
  lookLogo: 'Logo', logo_emoji: '😀 Emoji', logo_image: '🖼️ Picture', lookLogoUp: '📷 Choose a logo picture', lookLogoChange: '📷 Change picture',
  lookLogoSize: 'Logo size', lookLogoNone: 'No picture chosen yet', lookLogoHint: 'The picture is made smaller before upload (a PNG with a clear background looks best)',
  lookLogoNeed: 'Choose a logo picture first, or switch back to emoji', lookOnOff: 'Pages that are on',
  lookParts: 'Decorations (choose each part)',
  part_fall: 'Falling', part_scene: '3D scene', part_friend: 'Peeking friend', part_special: 'Special mode (tap the tree 5 times)', part_music: 'Background music',
  opt_off: '🚫 Off', opt_snow: '❄️ Snow', opt_petals: '🌸 Petals', opt_tree: '🎄 Christmas tree', opt_cross: '✝️ Cross on the hill',
  opt_santa: '🎅 Santa', opt_lamb: '🐑 Lamb', opt_dove: '🕊️ Dove', opt_gifts: '🎁 Gift boxes', opt_eggs: '🥚 Easter egg hunt',
  opt_jingle: '🔔 Jingle Bells', opt_easter: '🎺 Easter Hymn',
  lookPartsHint: 'Choosing a pack sets every part to its default; then change any part on its own. The 3D scene changes the next time the app is opened',
});
// v35: real mobile preview, detailed change log switch, kids' pages open full on phones
Object.assign(DICT.th, {
  tab_phone: 'ตัวอย่างบนมือถือ', m_phone: 'ดูแอปของเด็ก ๆ จริง ๆ ในกรอบมือถือ ด้วยข้อมูลตัวอย่าง',
  pfSub: 'นี่คือแอปของเด็ก ๆ จริง ๆ แต่ใช้เด็ก คะแนน เพลง และของรางวัลตัวอย่าง กดเล่นได้ทุกอย่าง ไม่มีอะไรถูกบันทึก (โหลดใหม่ = เริ่มใหม่)',
  pfLookSub: 'สิ่งที่เปลี่ยนในหน้านี้จะเห็นทันทีที่นี่ ก่อนกดบันทึก (ข้อมูลตัวอย่าง ไม่มีอะไรถูกบันทึก)',
  pfSample: 'ข้อมูลตัวอย่าง · ไม่บันทึก', pfReload: 'โหลดใหม่', pf_phone: 'มือถือ', pf_tablet: 'แท็บเล็ต',
  saAdminsGrp: 'ผู้ดูแล', clogDetailT: 'ผู้ดูแลเห็นบันทึกการเปลี่ยนแปลงแบบละเอียด',
  clogDetailSub: 'เปิด = ผู้ดูแลของโปรแกรมนี้เห็นบันทึกทั้งหมดแบบละเอียดในหน้า "เวอร์ชันและสิ่งที่เปลี่ยน" (ส่งออก Excel ยังเป็นของผู้ดูแลสูงสุดเท่านั้น) ปิด = เห็นแค่ "มีอะไรใหม่" แบบสั้น',
  sheetGrab: 'เลื่อนลงเพื่อดูต้นไม้ / แตะเพื่อสลับ',
});
Object.assign(DICT.en, {
  tab_phone: 'Phone preview', m_phone: "See the real kids' app in a phone frame with sample data",
  pfSub: "This is the real kids' app with sample kids, points, songs and prizes. Tap anything; nothing is saved (reload = start again).",
  pfLookSub: 'Changes on this page show here at once, before you press Save (sample data, nothing is saved).',
  pfSample: 'Sample data · not saved', pfReload: 'Reload', pf_phone: 'Phone', pf_tablet: 'Tablet',
  saAdminsGrp: 'Admins', clogDetailT: 'Admins see the detailed change log',
  clogDetailSub: 'On = this program\'s admins see the full detailed change log on the "Version & changes" page (the Excel export stays super admin only). Off = only the short "What\'s new".',
  sheetGrab: 'Pull down to see the tree / tap to switch',
});

// v36 (roadmap step 6): visits and feedback counters on the kids' home page
Object.assign(DICT.th, {
  hcVisits: 'ครั้งที่เปิดแอป', hcFeedback: 'ความคิดเห็น', secHomeCount: 'ตัวเลขบนหน้าแรกของเด็ก',
  swVisits: 'แสดงจำนวนครั้งที่เปิดแอป', swVisitsSub: 'ทุกคนเห็นบนหน้าแรก นับทุกครั้งที่มีคนเปิดแอป ไม่ถูกลบเมื่อล้างบันทึกกิจกรรมเด็ก',
  swFbCount: 'แสดงจำนวนความคิดเห็น', swFbCountSub: 'ทุกคนเห็นบนหน้าแรก เป็นแค่ตัวเลข ไม่แสดงชื่อหรือข้อความ',
});
Object.assign(DICT.en, {
  hcVisits: 'visits', hcFeedback: 'feedback', secHomeCount: 'Numbers on the kids\' home page',
  swVisits: 'Show visits', swVisitsSub: 'Everyone sees it on the home page. Counts every time someone opens the app; clearing the kids\' activity log does not reset it',
  swFbCount: 'Show feedback count', swFbCountSub: 'Everyone sees it on the home page. Only the number, never names or messages',
});

// v37 (roadmap step 7): simpler admin panel (tabs inside one menu item) and maintenance mode per program
Object.assign(DICT.th, {
  sub_admins: 'ผู้ดูแล', sub_online: 'ออนไลน์ตอนนี้', sub_about: 'เวอร์ชันและสิ่งที่เปลี่ยน', sub_ai: 'รายละเอียดสำหรับ AI',
  sub_settings: 'ทั่วไป', sub_pcats: 'หมวดคะแนน', sub_musicset: 'เพลงและเสียง',
  m_settings: 'คำแนะนำ คะแนนการมาร่วม หมวดคะแนน เพลง', saUntilShort: (t) => `ผู้ดูแลสูงสุดใช้ได้ถึง ${t} น. (แล้วยืนยันตัวตนใหม่)`,
  mtTitle: 'ปิดปรับปรุงชั่วคราว', mtSub: 'เดี๋ยวกลับมานะ ขอบคุณที่รอ', mtColour: 'เปลี่ยนสี', mtSoundOn: 'ปิดเสียง', mtSoundOff: 'เปิดเสียง',
  mtBar: 'โปรแกรมนี้ปิดปรับปรุงอยู่ เด็กและผู้ดูแลคนอื่นเห็นแค่หน้าปิดปรับปรุง (แตะเพื่อปิด)',
  mtLabel: 'ปิดปรับปรุง', mtIsOn: (s) => `เปิดอยู่ · ${s}`, mtIsOff: 'ไม่ได้ปิดปรับปรุง', mtTurnOn: 'เริ่มปิดปรับปรุง', mtTurnOff: 'เลิกปิดปรับปรุง',
  mtScene: 'ฉากที่ทุกคนจะเห็น', mt_tree: '🎄 ต้นคริสต์มาส', mt_bunny: '🐰 กระต่ายเฝ้าไข่',
  mtWhat: 'ระหว่างปิดปรับปรุง เด็กและผู้ดูแลคนอื่นจะเห็นแค่ฉากนี้กับคำว่า "ปิดปรับปรุงชั่วคราว" และแก้ไขข้อมูลอะไรไม่ได้เลย ผู้ดูแลสูงสุดยังใช้ได้ทุกอย่าง',
  mtWarnOn: (n) => `เริ่มปิดปรับปรุง "${n}"?\nเด็กและผู้ดูแลคนอื่นจะใช้โปรแกรมนี้ไม่ได้จนกว่าจะเลิกปิดปรับปรุง`,
  mtWarnOff: (n) => `เลิกปิดปรับปรุง "${n}"?\nทุกคนจะกลับมาใช้ได้ตามปกติ`,
  mtDoneOn: (n) => `"${n}" ปิดปรับปรุงแล้ว`, mtDoneOff: (n) => `"${n}" กลับมาใช้ได้แล้ว`,
  mtBlocked: 'โปรแกรมนี้ปิดปรับปรุงอยู่ จึงยังบันทึกไม่ได้',
});
Object.assign(DICT.en, {
  sub_admins: 'Admins', sub_online: 'Online now', sub_about: 'Version & changes', sub_ai: 'Details for AI',
  sub_settings: 'General', sub_pcats: 'Point categories', sub_musicset: 'Music',
  m_settings: 'Tips, attendance points, point categories, music', saUntilShort: (t) => `super admin until ${t} (then sign in again)`,
  mtTitle: 'Under maintenance', mtSub: "We'll be back soon. Thanks for waiting!", mtColour: 'Colour', mtSoundOn: 'Sound off', mtSoundOff: 'Sound on',
  mtBar: 'This program is under maintenance. Kids and other admins see only the maintenance page (tap to switch it off)',
  mtLabel: 'Maintenance', mtIsOn: (s) => `on · ${s}`, mtIsOff: 'off', mtTurnOn: 'Start maintenance', mtTurnOff: 'End maintenance',
  mtScene: 'Scene everyone will see', mt_tree: '🎄 Christmas tree', mt_bunny: '🐰 Bunny looking after eggs',
  mtWhat: 'During maintenance, kids and other admins see only this scene and the words "Under maintenance", and cannot change anything. The super admin can still do everything.',
  mtWarnOn: (n) => `Start maintenance for "${n}"?\nKids and other admins cannot use this program until you end it`,
  mtWarnOff: (n) => `End maintenance for "${n}"?\nEveryone can use it again as normal`,
  mtDoneOn: (n) => `"${n}" is under maintenance`, mtDoneOff: (n) => `"${n}" is open again`,
  mtBlocked: 'This program is under maintenance, so nothing can be saved right now',
});

// v38 (roadmap step 8): folding menu groups, settings search, cleaner export page, data tools for the super admin
Object.assign(DICT.th, {
  g_people: 'คน', g_content: 'เนื้อหา', g_program: 'โปรแกรม', g_data: 'ข้อมูล',
  sub_programs: 'โปรแกรม', sub_look: 'หน้าตา', sub_phone: 'ตัวอย่างบนมือถือ',
  findPh: 'ค้นหาการตั้งค่า', findNone: 'ไม่พบ ลองคำอื่น', dangerZone: 'ระวัง',
  xd_summary: 'คะแนนและการมาของแต่ละคน', xd_points: 'ทุกครั้งที่ให้คะแนน', xd_att: 'การเช็กชื่อทุกวัน', xd_feedback: 'ความคิดเห็นของเด็ก',
  xd_shop: 'ของรางวัลในร้าน', xd_redeem: 'ใครแลกอะไรไปบ้าง', xd_adminlog: 'ผู้ดูแลเปลี่ยนอะไรบ้าง', xd_kidlog: 'เด็กเปิดหน้าไหน พร้อมสรุป',
  tab_data: 'เครื่องมือข้อมูล', m_data: 'ไฟล์ SQL ช่องพิมพ์ SQL และกราฟสรุป',
  dtIntro: (n) => `ข้อมูลของ "${n}" ทุกอย่างในหน้านี้ใช้สำเนาในเครื่องนี้ จึงไม่เปลี่ยนหรือลบข้อมูลจริง`,
  dtFiles: 'ดาวน์โหลดข้อมูล', dtSqlFile: 'ไฟล์ SQL (ทุกตาราง)', dtJsonAll: 'JSON (ทุกตาราง)',
  dtSqlSub: 'ไฟล์ .sql เปิดได้ทั้ง PostgreSQL และ SQLite (โหลดลงฐานข้อมูลว่าง)', dtCsv: 'CSV ทีละตาราง', dtRows: (n) => `${n} แถว`,
  dtBox: 'ช่องพิมพ์ SQL', dtBoxSub: 'ใช้ SQLite กับสำเนาข้อมูลในเครื่องนี้ ลองได้เต็มที่ ข้อมูลจริงไม่เปลี่ยน (กด Ctrl+Enter เพื่อรัน)',
  dtExamples: 'ตัวอย่างคำสั่ง', dtRun: 'รัน', dtResCsv: 'ส่งออกผลลัพธ์ CSV', dtNoRows: 'รันแล้ว ไม่มีแถวให้แสดง', dtFirst: (n) => `แสดง ${n} แถวแรก`,
  dtSchema: 'ตารางและคอลัมน์', dtInsights: 'สรุปภาพรวม', dtSeeNums: 'ดูตัวเลข',
  dtEx_top: 'เด็ก 10 อันดับแรก', dtEx_day: 'จำนวนคนมาแต่ละวัน', dtEx_cat: 'คะแนนตามหมวด', dtEx_rate: 'อัตราการมาของแต่ละคน (JOIN)',
  dtEx_run: 'คะแนนสะสมรายวัน (window function)', dtEx_prize: 'ของรางวัลที่แลกบ่อย',
  dtT_kids: 'เด็ก', dtT_days: 'วันที่เช็กชื่อ', dtT_rate: 'อัตราการมาเฉลี่ย', dtT_rateSub: 'วันที่มา ÷ วันที่เช็กชื่อ', dtT_points: 'คะแนนที่ให้ทั้งหมด',
  dtT_median: 'คะแนนกลาง (มัธยฐาน)', dtT_meanSd: (m, s) => `เฉลี่ย ${m} · SD ${s}`,
  dtC_day: 'คนมาแต่ละวัน', dtC_cat: 'คะแนนตามหมวด', dtC_came: 'เด็กมากี่วัน', dtC_cameSub: 'แกนนอน = จำนวนวันที่มา, ความสูง = จำนวนเด็ก', dtDaysCame: 'จำนวนวันที่มา', dtC_top: 'เด็ก 10 อันดับแรก',
});
Object.assign(DICT.en, {
  g_people: 'People', g_content: 'Content', g_program: 'Program', g_data: 'Data',
  sub_programs: 'Programs', sub_look: 'Look', sub_phone: 'Phone preview',
  findPh: 'Search settings', findNone: 'Nothing found. Try another word', dangerZone: 'Careful',
  xd_summary: "Each kid's points and attendance", xd_points: 'Every time points were given', xd_att: 'Every attendance day', xd_feedback: "Kids' comments",
  xd_shop: 'Prizes in the shop', xd_redeem: 'Who got which prize', xd_adminlog: 'What admins changed', xd_kidlog: 'Pages kids opened, with a summary',
  tab_data: 'Data tools', m_data: 'SQL file, SQL box and charts',
  dtIntro: (n) => `Data of "${n}". Everything on this page uses a copy on this device, so the live data never changes`,
  dtFiles: 'Download the data', dtSqlFile: 'SQL file (all tables)', dtJsonAll: 'JSON (all tables)',
  dtSqlSub: 'The .sql file works in PostgreSQL and SQLite (load it into an empty database)', dtCsv: 'CSV, one table at a time', dtRows: (n) => `${n} rows`,
  dtBox: 'SQL box', dtBoxSub: 'SQLite on a copy of the data on this device. Try anything: the live data never changes (Ctrl+Enter runs)',
  dtExamples: 'Example queries', dtRun: 'Run', dtResCsv: 'Export result as CSV', dtNoRows: 'Done. No rows to show', dtFirst: (n) => `showing the first ${n}`,
  dtSchema: 'Tables and columns', dtInsights: 'Quick insights', dtSeeNums: 'See the numbers',
  dtEx_top: 'Top 10 kids', dtEx_day: 'Kids present per day', dtEx_cat: 'Points per category', dtEx_rate: 'Attendance rate per kid (JOIN)',
  dtEx_run: 'Running total of points (window function)', dtEx_prize: 'Most popular prizes',
  dtT_kids: 'Kids', dtT_days: 'Attendance days', dtT_rate: 'Average attendance', dtT_rateSub: 'days present ÷ attendance days', dtT_points: 'Points given',
  dtT_median: 'Median points', dtT_meanSd: (m, s) => `mean ${m} · SD ${s}`,
  dtC_day: 'Kids present per day', dtC_cat: 'Points per category', dtC_came: 'How many days kids came', dtC_cameSub: 'across = days present, height = number of kids', dtDaysCame: 'Days present', dtC_top: 'Top 10 kids',
});
// v39: admin activity in the kids' activity log
Object.assign(DICT.th, {
  xlStaff: 'รวมการใช้งานของผู้ดูแลด้วย', xlStaffSub: 'ปกติจะไม่รวม: เมื่อผู้ดูแลเข้าสู่ระบบในเครื่องนั้น การใช้งานจะถูกทำเครื่องหมายว่าเป็นของผู้ดูแล (ข้อมูลยังเก็บไว้ครบ ไม่มีการลบ)',
  xc_bystaff: 'โดยผู้ดูแล', yes: 'ใช่',
});
Object.assign(DICT.en, {
  xlStaff: 'Include admin activity', xlStaffSub: 'Left out by default: while an admin is signed in on a phone, its activity is marked as admin activity (everything is still kept, nothing is deleted)',
  xc_bystaff: 'By an admin', yes: 'Yes',
});
// v40: ranking ties and zero points; errors that stay with a retry
Object.assign(DICT.th, {
  tie: 'เสมอ', tieWith: (n) => `เสมอ ${n} คน`, noPtsYet: 'ยังไม่มีคะแนน', startPts: 'เริ่มเก็บคะแนนกันเลย!',
  errTry: 'ลองใหม่', errKid: 'โหลดไม่ได้ ลองใหม่อีกครั้งนะ',
  errRetry: 'ไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองใหม่', errAgain: 'บันทึกไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วกดปุ่มเดิมอีกครั้ง',
});
Object.assign(DICT.en, {
  tie: 'Tied', tieWith: (n) => `tied, ${n} kids`, noPtsYet: 'No points yet', startPts: "Let's start collecting points!",
  errTry: 'Try again', errKid: "Couldn't load. Let's try again",
  errRetry: "Didn't go through. Check the internet and try again", errAgain: "Couldn't save. Check the internet, then tap the same button again",
});
// v40 polish: Give points step 2 puts the minus amounts in their own labelled row
Object.assign(DICT.th, { addPts: 'เพิ่มคะแนน', removePts: 'ลบคะแนน' });
Object.assign(DICT.en, { addPts: 'Add points', removePts: 'Remove points' });
// v40 distill: Normal mode wording. Every Thai text that calls the reader "หนู" (the kids' word) says "คุณ" instead;
// a few texts get their own adult wording. A word the super admin set for the program (look.words) still wins.
Object.assign(DICT.th, { ptsUnit: 'คะแนน' });
Object.assign(DICT.en, { ptsUnit: 'pts' });
// v40 delight: the shop knows who is looking (youHave / canGet / needMore are the old shop keys, used again)
Object.assign(DICT.th, { shopPickMe: 'แตะชื่อหนูที่หน้าแรก|ดูว่าแลกอะไรได้บ้าง' });
Object.assign(DICT.en, { shopPickMe: 'Tap your name on the home page|to see what you can get' });
// v41: attendance on a phone (one-line rows, everyone here)
Object.assign(DICT.th, { allHere: (n) => `ทุกคนที่รอเช็กมา (${n})`, allHereConfirm: (n) => `บันทึก "มา" ให้ ${n} คนที่ยังรอเช็ก?\nคนที่บันทึก "ลา" หรือ "ขาด" แล้วจะไม่เปลี่ยน`, attTapHint: 'แตะชื่อ = มา' });
Object.assign(DICT.en, { allHere: (n) => `Rest are here (${n})`, allHereConfirm: (n) => `Save "Here" for the ${n} still waiting?\nAnyone already on Leave or Absent stays as is`, attTapHint: 'Tap a name = Here' });
// v41: kid detail folds the categories that are still at 0
Object.assign(DICT.th, { zeroCats: (n) => `ยังไม่มีคะแนนอีก ${n} หมวด` });
Object.assign(DICT.en, { zeroCats: (n) => `${n} more with no points yet` });
// v41: prizes — icon guessed from the name, sold out; redeem list folds kids with nothing to spend
Object.assign(DICT.th, { soldOut: 'หมดแล้ว', soldOutKid: 'ของชิ้นนี้หมดแล้ว รอของใหม่นะ', soldOutSw: 'ของหมดแล้ว (ยังโชว์ในร้าน แต่แลกไม่ได้)',
  prizeAutoIcon: 'ถ้าเลือก 🎁 แอปจะเลือกรูปให้เองจากชื่อของ (เช่น "ขนม" → 🍪)', rdZero: (n) => `ยังไม่มีคะแนนให้แลก ${n} คน`, rdNobody: 'ยังไม่มีใครมีคะแนนพอแลกของ' });
Object.assign(DICT.en, { soldOut: 'Sold out', soldOutKid: 'This one is sold out. More coming soon!', soldOutSw: 'Sold out (still shown in the shop, but can\'t be redeemed)',
  prizeAutoIcon: 'Leave it on 🎁 and the app picks a picture from the name (e.g. "snack" → 🍪)', rdZero: (n) => `${n} with no points to spend yet`, rdNobody: 'Nobody has points to spend yet' });
Object.assign(DICT.th, { clogHintOff: 'ตอนนี้ผู้ดูแลของโปรแกรมนี้เห็นแค่ "มีอะไรใหม่" แบบสั้น', clogHintOn: 'ตอนนี้ผู้ดูแลของโปรแกรมนี้เห็นบันทึกแบบละเอียดนี้ด้วย', clogHintGo: 'เปลี่ยนที่ หน้าตาโปรแกรมนี้ → ผู้ดูแล' });
Object.assign(DICT.en, { clogHintOff: 'This program\'s admins see only the short "What\'s new" now.', clogHintOn: 'This program\'s admins see this detailed log too.', clogHintGo: 'Change it in This program\'s look → Admins' });
Object.assign(DICT.th, { switchMe: (n) => `เปลี่ยนเป็น ${n} ใช่ไหม?` });
Object.assign(DICT.en, { switchMe: (n) => `Switch to ${n}?` });
Object.assign(DICT.th, { hideInstead: 'ซ่อนแทน', hideInsteadNote: 'ซ่อน = ชื่อหายจากหน้าเด็ก แต่คะแนนและการเช็กชื่อยังอยู่ครบ กดแสดงกลับได้ทุกเมื่อ', delForGood: (n) => `ลบ "${n}" ถาวร` });
Object.assign(DICT.en, { hideInstead: 'Hide instead', hideInsteadNote: 'Hide = the name leaves the kids\' pages, but all points and attendance stay. You can show it again any time.', delForGood: (n) => `Delete "${n}" for good` });
Object.assign(DICT.th, { homeToday: 'งานวันนี้', homeNeeds: 'ต้องทำต่อ', homeAllSet: 'ไม่มีอะไรค้าง ✓', open: 'เปิด' });
Object.assign(DICT.en, { homeToday: "Today's jobs", homeNeeds: 'Still to do', homeAllSet: 'Nothing waiting ✓', open: 'Open' });
Object.assign(DICT.th, { errSignin: 'การเข้าสู่ระบบหมดเวลาแล้ว เข้าสู่ระบบใหม่แล้วลองอีกครั้ง', errPerm: 'บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ ถามผู้ดูแลสูงสุด', errDup: 'มีชื่อหรือข้อมูลนี้อยู่แล้ว ลองเปลี่ยนชื่อ', errValue: 'มีค่าที่ใส่ไม่ได้ เช็กตัวเลขหรือความยาวข้อความ', errServer: (m) => `บันทึกไม่สำเร็จ: ${m}` });
Object.assign(DICT.en, { errSignin: 'Your sign-in ran out. Sign in again, then try again', errPerm: "This account isn't allowed to do this. Ask the super admin", errDup: 'That name or item is already there. Try another name', errValue: 'Something typed is not allowed. Check the numbers or the text length', errServer: (m) => `Couldn't save: ${m}` });
Object.assign(DICT.th, { detailsPh: 'เปียโน\nร้องเพลง', attPtsNote: (n) => `มา = +${n} ⭐ ต่อคน` });
Object.assign(DICT.en, { detailsPh: 'Piano\nSinging', attPtsNote: (n) => `Here = +${n} ⭐ each` });
// v43
Object.assign(DICT.th, { pickHereToday: (n) => `เลือกคนที่มาวันนี้ (${n})`, hereToday: 'มาวันนี้', emptyShopSub: 'ของรางวัลกำลังจะมาเร็ว ๆ นี้ สะสมดาวรอไว้ก่อนนะ ⭐', addPrizes: 'เพิ่มของรางวัล', rdExplain: 'คะแนนอันดับ = ดาวทั้งหมดที่เคยได้ (ไม่ลดเมื่อแลก) · ใช้แลกได้ = ดาวที่เหลือหลังหักของที่แลกไปแล้ว', stHere: (a, b) => `${a}/${b} มาแล้ววันนี้`, stPrizes: (n) => `มีของรางวัล ${n} ชิ้น`, editKidT: (n) => `แก้ไข ${n}` });
Object.assign(DICT.en, { pickHereToday: (n) => `Pick today's kids (${n})`, hereToday: 'Here today', emptyShopSub: 'Prizes are coming soon. Keep collecting stars ⭐', addPrizes: 'Add prizes', rdExplain: 'Ranking points = every star ever earned (they do not go down after a prize) · Points to spend = stars left after prizes already taken', stHere: (a, b) => `${a}/${b} here today`, stPrizes: (n) => `${n} prizes in the shop`, editKidT: (n) => `Edit ${n}` });
// v44
Object.assign(DICT.th, { stWait: (n) => `รอเช็ก ${n} คน`, stTapFinish: 'เช็กครบแล้ว กด "เช็กชื่อเสร็จแล้ว" ได้เลย', rdWhy: 'ⓘ คะแนนสองแบบต่างกันอย่างไร',
  rdWhyRank: 'คะแนนอันดับ = ดาวทั้งหมดที่เคยได้ ไม่ลดเมื่อแลกของ', rdWhySpend: 'ใช้แลกได้ = ดาวที่เหลือ หลังหักของที่แลกไปแล้ว' });
Object.assign(DICT.en, { stWait: (n) => `${n} still to check`, stTapFinish: 'Everyone checked: tap "Finish attendance"', rdWhy: 'ⓘ What is the difference?',
  rdWhyRank: 'Ranking points = every star ever earned. They do not go down after a prize.', rdWhySpend: 'Points to spend = stars left after prizes already taken.' });
const NORMAL = { th: {}, en: {} };
// v41 clarify: Normal mode also says "สมาชิก" / "member" instead of "เด็ก" / "kid" (admin menus, feedback, copy people…).
// Texts that name the two modes themselves ("โหมดเด็ก", "Kids mode") are left alone.
const adultTh = (x) => x.replaceAll('หนู', 'คุณ').replaceAll('เด็ก ๆ', 'สมาชิก').replaceAll('เด็กๆ', 'สมาชิก').replaceAll('เด็ก', 'สมาชิก');
const adultEn = (x) => x.replace(/\b([Kk])ids\b/g, (_, c) => c === 'K' ? 'Members' : 'members').replace(/\b([Kk])id\b/g, (_, c) => c === 'K' ? 'Member' : 'member');
const KEEP_TH = /โหมดเด็ก/, KEEP_EN = /Kids mode|kids mode/;
for (const [lang, fix, keep, rx] of [['th', adultTh, KEEP_TH, /หนู|เด็ก/], ['en', adultEn, KEEP_EN, /\b[Kk]ids?\b/]]) {
  for (const [k, v] of Object.entries(DICT[lang])) {
    const src = typeof v === 'function' ? String(v) : v;
    if (typeof src !== 'string' || !rx.test(src) || keep.test(src)) continue;
    NORMAL[lang][k] = typeof v === 'function' ? (...a) => fix(v(...a)) : fix(v);
  }
}
Object.assign(NORMAL.th, {
  noKids: 'ยังไม่มีรายชื่อ ผู้ดูแลจะเพิ่มชื่อให้',
  mLoginSub: 'ใส่ชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแล เพื่อดูคะแนนของคุณ', mLoginRowSub: 'ใช้ชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแล',
  mLoginSubAll: 'ต้องเข้าสู่ระบบก่อนจึงจะใช้แอปได้ ใส่ชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแล', mForgot: 'ลืมรหัสผ่าน? แจ้งผู้ดูแลให้ตั้งรหัสใหม่',
});
Object.assign(NORMAL.en, {
  tieWith: (n) => `tied, ${n} people`, noKids: 'No names yet. An admin will add them',
  mLoginSub: 'Type the username and password from your admin to see your points', mLoginRowSub: 'Use the username and password from your admin',
  mLoginSubAll: 'Please sign in to use the app. Type the username and password from your admin', mForgot: 'Forgot your password? Ask an admin to set a new one',
});
