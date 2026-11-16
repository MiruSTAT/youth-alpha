// The app's version and its change history, shown to admins (For adults → Version & changes)
// and exportable to Excel there.
//
// HOW TO ADD A RELEASE (for people and AIs working on this app):
//  1. Raise VERSION here, every ?v= (index.html and the js imports) and V in sw.js to the same number.
//  2. Add a version at the TOP of the newest update group in UPDATES (or start a new group when the work
//     has a new theme). Every change gets one item: { a: area, th: Thai text, en: English text }.
//     Areas: kids | admin | songs | data | look | speed | safety | fix.
//  3. Write each item so an admin understands it without opening the app: what changed, where, and what
//     it means for them. One change per item. Thai and English say the same thing.
//  4. Never rewrite or remove old entries; they are the record of what happened.
//
// Numbers match the ?v= the app carried at the time. Versions 1–3 come from before version numbers were
// used and are numbered here in order; 4 and 6 were never released.
export const VERSION = '24';

export const AREAS = {
  kids: ['เด็ก', 'Kids'], admin: ['ผู้ดูแล', 'Admins'], songs: ['เพลง', 'Songs'], data: ['ข้อมูล', 'Data'],
  look: ['หน้าตา', 'Look'], speed: ['ความเร็ว', 'Speed'], safety: ['ความปลอดภัย', 'Safety'], fix: ['แก้ปัญหา', 'Fixes'],
};

export const UPDATES = [
  { id: 'prizes', th: 'อัปเดตของรางวัลและใช้งานออฟไลน์', en: 'Prizes & offline update',
    versions: [
      { v: '24', date: '2026-11-16', commit: '',
        items: [
          { a: 'speed', th: 'โหมดพิเศษ (แตะต้นไม้ 5 ครั้ง) ไม่หน่วงแล้ว: แสงทองรอบปุ่มต่าง ๆ เป็นแสงนิ่ง เหลือแสงกระพริบแค่การ์ดของเด็กเอง (เดิมกระพริบพร้อมกัน 30 จุด) ของขวัญที่บินลดจาก 32 เป็น 20 และในฉาก 3 มิติจาก 26 เป็น 18', en: 'The special mode (5 taps on the tree) no longer lags: the gold glow around buttons is now steady and only the kid\'s own card pulses (it was 30 pulsing glows at once); flying presents cut from 32 to 20, and from 26 to 18 in the 3D scene' },
          { a: 'speed', th: 'ต้นคริสต์มาส 3 มิติหยุดวาดเมื่อเลื่อนหน้าจอจนต้นไม้ถูกบังหมด และจะลดความละเอียดเองถ้าเครื่องช้า', en: 'The 3D tree stops drawing when the page is scrolled over it, and lowers its detail by itself on slow phones' },
          { a: 'speed', th: 'หิมะวาด 30 ครั้งต่อวินาที (เดิม 60) แถบด้านบนไม่เบลอพื้นหลังแล้ว และเพลง Joy to the World ใช้เสียงที่เบากว่าสำหรับแนวประสาน', en: 'Snow is drawn 30 times a second (was 60), the top bar no longer blurs what is behind it, and Joy to the World uses lighter sounds for the harmony parts' },
          { a: 'speed', th: 'วัดผลบนมือถือจำลองที่ช้า: โหมดพิเศษจากประมาณ 9 เป็น 33 ภาพต่อวินาที และหลังปิดโหมดพิเศษจาก 15 เป็น 40', en: 'Measured on a slowed-down test phone: the special mode went from about 9 to 33 frames a second, and after it ends from 15 to 40' },
          { a: 'kids', th: 'แตะของรางวัลในร้านแล้วจะขยายใหญ่ เห็นรูป ชื่อ ราคา และบอกว่าคะแนนพอแลกหรือยังขาดอีกเท่าไร (เห็นรูปที่อัปโหลดชัดขึ้น)', en: 'Tapping a prize in the shop shows it big, with its picture, name and price, and says whether the kid has enough points or how many are missing (uploaded pictures are now easy to see)' },
          { a: 'kids', th: 'ตัวเลือก "ติดตั้งเป็นแอป" ในเมนูของเด็ก (ซ่อนไว้ก่อน ผู้ดูแลสูงสุดจะเปิดได้ในเวอร์ชันถัดไป): Android ติดตั้งจาก Chrome ได้เลย iPhone มีขั้นตอนบอก', en: '"Install as an app" option in the kids\' menu (hidden for now; the super admin can switch it on from the next version): installs straight from Chrome on Android, with steps for iPhone' },
          { a: 'look', th: 'ไอคอนแอปแบบใหม่หลายขนาด สำหรับหน้าจอโทรศัพท์ Android และ iPhone', en: 'New app icons in several sizes for Android and iPhone home screens' },
          { a: 'admin', th: 'รายการเปลี่ยนแปลงละเอียดขึ้น จัดเป็นกลุ่มอัปเดต แต่ละข้อบอกส่วนที่เปลี่ยน และส่งออกเป็น Excel ได้', en: 'The change log is more detailed, grouped into updates, with the area of each change, and can be exported to Excel' },
        ] },
      { v: '23', date: '2026-11-16', commit: 'a53033b',
        items: [
          { a: 'admin', th: 'หน้า "แลกของรางวัล": เลือกเด็ก (เห็นคะแนนที่ใช้แลกได้) เลือกของ แล้วยืนยัน ของที่แพงเกินเป็นสีจางและบอกว่าขาดอีกเท่าไร', en: '"Give a prize" page: pick a kid (with their points to spend), pick a prize, confirm. Prizes that cost too much are greyed out and say how many points are missing' },
          { a: 'data', th: 'การแลกหัก "คะแนนที่ใช้แลกได้" เท่านั้น คะแนนอันดับไม่ลด ระบบฐานข้อมูลตรวจซ้ำว่าคะแนนพอ และทุกการแลกถูกบันทึกในประวัติการแก้ไข', en: 'A prize only takes off "points to spend"; ranking points never drop. The database checks the balance again, and every prize given is recorded in the change history' },
          { a: 'admin', th: 'ปุ่ม "คืนคะแนน" ยกเลิกการแลก (มีคำเตือนบอกชื่อเด็กและชื่อของ)', en: '"Give points back" cancels a prize (with a warning naming the kid and the prize)' },
          { a: 'kids', th: 'เด็กเห็น "ใช้แลกได้" บนการ์ดของตัวเอง ในหน้ารายละเอียด และในร้านค้า', en: 'Kids see their points to spend on their card, in their detail page and in the shop' },
          { a: 'admin', th: 'หน้า "ประกาศและข้อพระคัมภีร์": ข้อความ 1 บรรทัดบนสุดของหน้าแรกเด็ก และข้อพระคัมภีร์ประจำสัปดาห์ (แสดงใต้อันดับและในเมนูพระคัมภีร์) ผู้ดูแลทุกคนแก้ได้', en: '"Announcement & verse" page: one line at the top of the kids\' home page, and a verse of the week (under the ranking and in the Bible menu). Every adult can edit it' },
          { a: 'admin', th: 'หน้า "สรุปประจำสัปดาห์": คะแนนที่ให้ จำนวนที่มารอบล่าสุด เครื่องที่เปิดแอป ความคิดเห็น เด็กที่ไม่ได้มา 2 รอบติดกัน 5 อันดับคะแนนเพิ่มมากสุด เพลงที่เปิดบ่อย และของที่แลกไป (7 วันล่าสุด)', en: '"Weekly summary" page for the last 7 days: points given, how many came last round, phones that opened the app, feedback, kids who missed 2 rounds in a row, the top 5 gainers, most opened songs and prizes given' },
          { a: 'kids', th: 'ใช้ได้แม้ไม่มีอินเทอร์เน็ต: อันดับ ร้านค้า และเพลง (เนื้อเพลง คอร์ด แผ่นเพลง) แสดงข้อมูลล่าสุดที่เก็บไว้ มีบรรทัดเล็ก ๆ บอกว่าไม่มีเน็ต วิดีโอยังต้องใช้เน็ต', en: 'Works without internet: ranking, shop and songs (lyrics, chords, sheets) show the last saved data with a small "no internet" line. Videos still need internet' },
          { a: 'speed', th: 'แอปเปิดเร็วขึ้นเมื่อเน็ตช้า: ไฟล์ของแอปเก็บไว้ในเครื่อง ถ้าเน็ตช้าเกิน 3.5 วินาทีจะใช้ฉบับที่เก็บไว้', en: 'The app opens faster on slow Wi-Fi: its files are kept on the phone, and the saved copy is used if the network takes over 3.5 seconds' },
          { a: 'admin', th: 'หน้า "เวอร์ชันและสิ่งที่เปลี่ยน": เลขเวอร์ชัน ตรวจว่าเครื่องนี้เป็นรุ่นล่าสุดหรือไม่ (มีปุ่มอัปเดต) และรายการสิ่งที่เปลี่ยนทุกเวอร์ชัน', en: '"Version & changes" page: the version number, whether this phone has the latest one (with an update button), and every version\'s changes' },
          { a: 'data', th: 'Excel มีแผ่นงาน "ของรางวัลที่แลก" และแผ่นสรุปมีคะแนนที่แลกไปและคะแนนที่ใช้แลกได้', en: 'Excel export gained a "prizes given" sheet, and the summary sheet shows points spent and points to spend' },
        ] },
    ] },
  { id: 'songs', th: 'อัปเดตเพลง', en: 'Songs update',
    versions: [
      { v: '22', date: '2026-11-15', commit: '107faef',
        items: [
          { a: 'songs', th: 'สวิตช์ "แผ่นเพลงต้นฉบับอย่างเดียว" (แถวสีเหลืองบนสุด) ในการ์ดของแต่ละเพลง: เปิดแล้วปิดอย่างอื่นทั้งหมดของเพลงนั้น เด็กเห็นแค่แผ่นเพลง ปิดแล้วเปิดกลับทั้งหมด', en: '"Original sheet only" switch (yellow row at the top) on each song\'s card: turning it on switches off everything else for that song so kids see only the sheet; turning it off brings everything back' },
          { a: 'songs', th: 'เปิดสวิตช์อื่นเมื่อไรก็ออกจากโหมดแผ่นเพลงอย่างเดียวเอง', en: 'Turning any other switch on ends "sheet only" by itself' },
          { a: 'kids', th: 'แผ่นเพลงต้นฉบับเปิดให้เห็นเสมอ ไม่ต้องแตะแถบเพื่อเปิด', en: 'The original song sheet is always shown open; no bar to tap first' },
        ] },
      { v: '21', date: '2026-11-15', commit: '88bf31d',
        items: [
          { a: 'songs', th: 'การ์ด "เด็กเห็นอะไรในเพลงนี้" ในหน้าแก้ไขเพลง: เปิด/ปิด 13 อย่างแยกทีละเพลง (เนื้อเพลงและคอร์ดในแอป วิดีโอ เครื่องเคาะ จุดจังหวะ เลื่อน ความเร็ว จังหวะตามวิดีโอ เนื้อเพลงตามวิดีโอ คอร์ด เปลี่ยนคีย์ ขนาดตัวอักษร สลับภาษา แผ่นเพลง) บันทึกทันที', en: '"What kids see in this song" card in the song editor: 13 on/off switches per song (in-app lyrics and chords, video, metronome, beat dots, scroll, speed, beat and lyrics following the video, chords, key change, text size, language switch, sheet), saved straight away' },
          { a: 'songs', th: 'สวิตช์ที่ถูกปิดทั้งแอปในตั้งค่าเพลง จะเป็นสีเทาในการ์ดของแต่ละเพลง', en: 'A switch that is off for the whole app in Music settings is greyed out on each song\'s card' },
          { a: 'songs', th: 'ปิด "เนื้อเพลงและคอร์ดในแอป" ได้ เมื่อบางเพลงต้องการให้เห็นแค่แผ่นเพลง', en: '"In-app lyrics and chords" can be switched off for songs that should show only the sheet' },
        ] },
      { v: '20', date: '2026-11-15', commit: 'b298a6a',
        items: [
          { a: 'songs', th: 'อ่านแผ่นเพลงจากรูปแม่นขึ้น: คอร์ดถูกจับจากรูปร่างตัวอักษร (เทียบกับตัวอักษรหลายแบบ) แทนการอ่านเป็นข้อความ ไม่สับสน D กับ B หรือ A กับ E และไม่พลาดคอร์ดตัวเดียวอย่าง C', en: 'Sheet reading is more accurate: chords are matched by the shape of the letters (against several fonts) instead of text reading, so D/B and A/E no longer get mixed up and single chords like C are not missed' },
          { a: 'songs', th: 'คอร์ดที่อยู่ในคีย์ของเพลงได้น้ำหนักมากกว่า คอร์ดสองตัวที่ติดกันถูกแยกออก และแถวคอร์ดถูกหาจากรูปโดยตรง (รองรับหน้าแบบ 2 คอลัมน์)', en: 'Chords in the song\'s key get a head start, two chords printed close together are split, and chord rows are found on the picture itself (two-column pages work)' },
          { a: 'songs', th: 'ภาษาไทยดีขึ้น: สระและวรรณยุกต์อยู่กับบรรทัดที่ถูกต้อง คอร์ดไม่แยกตัวอักษรออกจากสระ และคอร์ดอยู่ก่อนสระหน้า (เ แ โ ใ ไ)', en: 'Better Thai: vowel and tone marks stay with the right line, chords never split a letter from its marks, and chords go before leading vowels (เ แ โ ใ ไ)' },
          { a: 'fix', th: 'ทดสอบกับแผ่นเพลงจริงทั้ง 5 เพลง: แถวคอร์ดถูกต้องและเรียงถูกทุกแถว', en: 'Tested on all 5 real sheets: every chord row came out correct and in order' },
        ] },
      { v: '19', date: '2026-11-15', commit: '63f0a2e',
        items: [
          { a: 'admin', th: 'หน้า "ตั้งค่าเพลง" (ผู้ดูแลหลัก): เปิด/ปิดทุกอย่างของเพลงสำหรับเด็กทั้งแอป แบ่งเป็น "ทั้งแอป" (เพลงพื้นหลัง แท็บเพลง โหมดพิเศษ เสียงวิ้ง) และ "หน้าเพลง" (13 อย่าง)', en: '"Music settings" page (main admin): every music feature on or off for all kids, in two groups: whole app (background music, songs tab, special mode, its tap sound) and song page (13 features)' },
          { a: 'songs', th: 'ปุ่ม "✨ อ่านเนื้อเพลง" บนรูปแผ่นเพลง: อ่านเนื้อเพลงและคอร์ดจากรูปลงช่องเนื้อเพลงให้เอง อัปโหลดรูปใหม่จะอ่านทันที (ถามก่อนถ้ามีเนื้อเพลงอยู่แล้ว)', en: '"✨ Read lyrics" button on each sheet picture fills the lyrics box with words and chords; a newly uploaded picture is read straight away (it asks first if the box already has lyrics)' },
          { a: 'songs', th: 'ปุ่ม "เติมจังหวะอัตโนมัติจนจบเพลง": แตะตามจังหวะแค่ 8 ครั้ง แล้วแอปเติมที่เหลือด้วยความเร็วเดียวกันจนจบวิดีโอ', en: '"Auto-fill the beat to the end" button: tap just 8 beats and the app fills the rest at the same tempo until the video ends' },
        ] },
      { v: '18', date: '2026-11-15', commit: '1dc6e13',
        items: [
          { a: 'songs', th: 'ปุ่ม "📋 วางเนื้อเพลงทั้งแผ่น" ในหน้าเพลงของผู้ดูแล: วางเอกสารแผ่นเพลงทั้งไฟล์ (Word / Google Docs) แอปแยกเป็นเพลงตามชื่อเพลงเอง', en: '"📋 Paste the whole song sheet" button on the admin songs page: paste the whole sheet document (Word / Google Docs) and the app splits it into songs by title' },
          { a: 'songs', th: 'คอร์ดอยู่ตรงคำเดิมเหมือนต้นฉบับ (วัดตำแหน่งด้วยตัวอักษรแบบเดียวกับในเอกสาร) ใช้ได้ทั้งตอนวางทั้งแผ่นและวางในช่องเนื้อเพลง', en: 'Chords stay over the same words as in the original (positions measured in the same kind of font), both when pasting the whole sheet and pasting into the lyrics box' },
          { a: 'safety', th: 'มีหน้าสรุปพร้อมคำเตือนก่อนแทนที่เนื้อเพลงเดิม บอกว่าพบกี่เพลง แต่ละเพลงกี่บรรทัด และเพลงไหนไม่พบ', en: 'A summary with a warning appears before old lyrics are replaced: how many songs were found, the lines in each, and which songs were not found' },
        ] },
      { v: '17', date: '2026-11-15', commit: '7aa89e5, 336ab1f',
        items: [
          { a: 'songs', th: 'ผู้ดูแลแตะตามจังหวะและแตะทุกบรรทัดพร้อมวิดีโอได้ (หน้า "ซิงก์กับวิดีโอ") แล้วจังหวะและเนื้อเพลงของเด็กจะตามวิดีโอ', en: 'Admins can tap along to the beat and to each lyric line with the video ("Sync with the video" page), and then the kids\' beat and lyrics follow the video' },
          { a: 'kids', th: 'คาราโอเกะ: บรรทัดที่กำลังร้องสว่างขึ้นและหน้าจอเลื่อนตาม เครื่องเคาะและจุดจังหวะตรงกับวิดีโอ', en: 'Karaoke: the line being sung lights up and the page follows it; the metronome and beat dots land on the video\'s beat' },
          { a: 'kids', th: 'ปุ่มสลับ ไทย / English / ทั้งหมด เมื่อเพลงมีทั้งสองภาษา', en: 'Thai / English / All switch when a song has both languages' },
          { a: 'songs', th: 'ทุกเพลงมีคอร์ดเป็นตัวอักษรในแอป จึงเปลี่ยนคีย์ได้ทุกเพลง', en: 'Every song has its chords as text in the app, so every song can change key' },
          { a: 'songs', th: 'แผ่นเพลงต้นฉบับย้ายไปอยู่ในแถบที่แตะเพื่อเปิด (เปลี่ยนเป็นเปิดเสมอในเวอร์ชัน 22)', en: 'The original sheet moved into a tap-to-open bar (changed to always open in version 22)' },
          { a: 'look', th: 'โหมดพิเศษเล่น Joy to the World ตามโน้ตจริง 4 แนว (SATB) ที่ 92 จังหวะต่อนาที ครบ 4 ท่อน และลดอาการหน่วง', en: 'The special mode plays the real 4-part (SATB) score of Joy to the World at 92 beats a minute, all 4 verses, with less lag' },
          { a: 'songs', th: 'เพิ่มวิดีโอของ ความสุขวันคริสต์มาส (BFC Choir) และ Jingle Bells ตามที่ทีมเลือก', en: 'Videos added for ความสุขวันคริสต์มาส (BFC Choir) and Jingle Bells, as chosen by the team' },
        ] },
      { v: '16', date: '2026-11-15', commit: '26b747d',
        items: [
          { a: 'kids', th: 'แท็บ 🎵 เพลง: รายชื่อเพลงคริสต์มาส 5 เพลง เปิดแต่ละเพลงเห็นเนื้อเพลงพร้อมคอร์ด คีย์ ความเร็ว และวิดีโอ YouTube (โหลดเมื่อแตะ)', en: '🎵 Songs tab: the 5 Christmas songs; each song shows lyrics with chords, key, tempo and its YouTube video (loads when tapped)' },
          { a: 'kids', th: 'แถบล่างในเพลง: เครื่องเคาะจังหวะ เลื่อนอัตโนมัติ ความเร็ว 0.5–1.25 เท่า และตั้งค่า (ขนาดตัวอักษร แสดงคอร์ด เปลี่ยนคีย์ ♭ ♯)', en: 'Bar at the bottom of a song: metronome, auto-scroll, speed 0.5–1.25×, and display settings (text size, chords on/off, key ♭ ♯)' },
          { a: 'admin', th: 'หน้าแก้ไขเพลง: ชื่อ คีย์ ความเร็ว จังหวะ เนื้อเพลงพร้อมคอร์ด ดูตัวอย่าง รูปแผ่นเพลง ลิงก์ YouTube และเครดิต', en: 'Song editor: title, key, tempo, beats, lyrics with chords, live preview, sheet pictures, YouTube link and credits' },
          { a: 'admin', th: 'อัปโหลดรูปจากโทรศัพท์ได้ (รูปเด็ก ไอคอนของรางวัล ไอคอนหมวดคะแนน แผ่นเพลง) รูปถูกย่อขนาดก่อนอัปโหลด', en: 'Pictures can be uploaded from the phone (kid avatars, prize and category icons, song sheets); they are shrunk before uploading' },
          { a: 'admin', th: 'QR สำหรับความคิดเห็น: ดูตัวอย่างและดาวน์โหลดเป็นโปสเตอร์ไปพิมพ์', en: 'Feedback QR code: preview it and download a poster to print' },
          { a: 'kids', th: 'ซานต้าโผล่มาทักทายจากขอบจอเป็นระยะ แตะแล้วมีของขวัญกระจาย', en: 'Santa peeks in from the screen edge now and then; tap him for presents' },
          { a: 'kids', th: 'โหมดพิเศษ: แตะต้นคริสต์มาส 5 ครั้งเร็ว ๆ มีแสงทอง ของขวัญบิน และเพลง Joy to the World แตะอีก 5 ครั้งเพื่อปิด', en: 'Special mode: tap the Christmas tree 5 times quickly for a golden flash, flying presents and Joy to the World; 5 more taps turn it off' },
          { a: 'kids', th: 'เมนูเครดิตเพลง บอกที่มาของเพลงและวิดีโอ', en: 'Song credits in the menu, showing where each song and video comes from' },
        ] },
    ] },
  { id: 'admin', th: 'อัปเดตเครื่องมือผู้ดูแลและความปลอดภัยของข้อมูล', en: 'Admin tools & data safety update',
    versions: [
      { v: '15', date: '2026-11-14', commit: '9109d21',
        items: [
          { a: 'safety', th: 'ประวัติการแก้ไขของผู้ดูแล: ทุกการเพิ่ม แก้ไข ลบ ถูกบันทึกพร้อมชื่อผู้ทำและค่าก่อน/หลัง ลบหรือแก้ไม่ได้ (ล็อกในฐานข้อมูล)', en: 'Admin change history: every add, change and delete is recorded with who did it and the before/after values; it cannot be edited or deleted (locked in the database)' },
          { a: 'data', th: 'บันทึกการใช้งานของเด็ก: เด็กดูหรือแตะอะไร (ไม่เก็บชื่อที่พิมพ์) ใช้ดูภายหลังว่าส่วนไหนถูกใช้บ่อย', en: 'Kids\' activity log: what kids view and tap (no typed names stored), to see later which parts get used' },
          { a: 'safety', th: 'ล้างบันทึกการใช้งานของเด็กได้เฉพาะผู้ดูแลหลักที่ใส่รหัสผ่านอีกครั้งภายใน 2 นาที และการล้างถูกบันทึกในประวัติ', en: 'The kids\' activity log can only be cleared by the main admin after re-entering the password within 2 minutes, and the clearing is recorded' },
          { a: 'data', th: 'ส่งออกประวัติการแก้ไข บันทึกการใช้งาน และสรุปการใช้งาน เป็น Excel (เวลาไทย อ่านเข้าใจง่าย)', en: 'Change history, activity log and activity summary export to Excel (Thai time, readable wording)' },
          { a: 'look', th: 'นำแถบเตือนด้านบนออก และแสงเรืองรอบปุ่มเป็นขอบมน', en: 'Removed the alert banner at the top; the glow around buttons follows their rounded corners' },
        ] },
      { v: '14', date: '2026-11-14', commit: '77c98f4',
        items: [
          { a: 'safety', th: 'ความคิดเห็นของเด็กลบไม่ได้ แม้แต่ผู้ดูแลหลัก (ล็อกในฐานข้อมูล)', en: 'Kids\' feedback can never be deleted, not even by the main admin (locked in the database)' },
          { a: 'safety', th: 'ก่อนลบทุกครั้งมีคำเตือนที่บอกชื่อของสิ่งที่จะลบ เช่น ชื่อเด็ก ชื่อของรางวัล หรือคะแนนที่จะยกเลิก', en: 'Every delete first shows a warning naming exactly what will go, such as the kid, the prize or the points being undone' },
          { a: 'admin', th: 'แตะสถานะเช็กชื่อซ้ำเพื่อล้าง ต้องยืนยันก่อน', en: 'Tapping an attendance status again to clear it now asks first' },
        ] },
      { v: '13', date: '2026-11-14', commit: 'e571848',
        items: [
          { a: 'kids', th: 'ร้านค้าไม่มีหมวดแล้ว ของรางวัลวางบนชั้นร้านเลย เรียงจากราคาถูกไปแพง', en: 'The shop has no categories any more: prizes sit straight on the stand, cheapest first' },
          { a: 'admin', th: 'เพิ่มของรางวัลไม่ต้องเลือกหมวด', en: 'Adding a prize no longer needs a category' },
        ] },
      { v: '12', date: '2026-11-14', commit: '328e4ed',
        items: [
          { a: 'admin', th: 'เช็กชื่อหลายคนพร้อมกัน: ปุ่ม "เลือกหลายคน" แล้วกด มา / ลา / ขาด ทีเดียว', en: 'Mark many kids at once: "Select many", then tap Here / Leave / Absent once' },
          { a: 'data', th: 'คะแนนโบนัสต้องเป็นบวกเสมอ (ตรวจทั้งในแอปและฐานข้อมูล)', en: 'Bonus points must always be positive (checked in the app and the database)' },
          { a: 'admin', th: 'มีหัวใจลอยขึ้นเมื่อเปิดหน้าความคิดเห็นแล้วมีความคิดเห็นใหม่', en: 'Hearts float up when the feedback page has new feedback' },
          { a: 'kids', th: 'เมนูพระคัมภีร์: ลิงก์อ่านพระคัมภีร์ภาษาไทยฟรี (YouVersion) และดาวน์โหลดแอปสำหรับ Android / iPhone', en: 'Bible menu: free Thai Bible reading (YouVersion) and app downloads for Android / iPhone' },
          { a: 'look', th: 'จุดแดงเตือนของผู้ดูแลเรืองแสงให้เห็นชัด และเพลงพื้นหลังไม่ดับเมื่อเข้าหน้าผู้ดูแล', en: 'Admin red reminders glow so they stand out, and the background music keeps playing on admin pages' },
        ] },
      { v: '11', date: '2026-11-14', commit: 'e91a355',
        items: [
          { a: 'admin', th: 'เมนูผู้ดูแลจัดเป็นกลุ่ม: ประจำวัน / เด็ก ๆ / คะแนนและของรางวัล / ระบบ', en: 'Admin menu grouped: Daily / Kids / Points & prizes / System' },
          { a: 'data', th: 'ส่งออก Excel ทีละแผ่นงานได้ หรือทั้งหมดในไฟล์เดียว', en: 'Excel export one sheet at a time, or everything in one file' },
          { a: 'admin', th: 'สวิตช์เปิด/ปิดรับความคิดเห็นแทนการตั้งเวลา ปิดแล้วมีคำเตือนก่อน', en: 'An on/off switch for feedback replaces the timer; turning it off asks first' },
        ] },
      { v: '10', date: '2026-11-14', commit: 'f640ff7',
        items: [
          { a: 'data', th: 'นำเรื่องเงิน ตารางกิจกรรม และตัวจับเวลากิจกรรมออกตามที่ทีมตัดสินใจ (ข้อมูลเดิมยังอยู่ในฐานข้อมูล)', en: 'Money, the schedule and the activity timer removed, as the team decided (old data is still in the database)' },
          { a: 'look', th: 'ปุ่มเพลงย้ายจากเมนูไปไว้บนแถบด้านบน และตัวอักษรในธีมสีอ่อนอ่านชัดขึ้น', en: 'The music button moved from the menu to the top bar, and text on the light theme got clearer' },
          { a: 'data', th: 'ปุ่มส่งออกความคิดเห็นเป็น Excel', en: 'Button to export feedback to Excel' },
        ] },
      { v: '9', date: '2026-11-14', commit: '6ca269e',
        items: [
          { a: 'look', th: 'ธีม "ขาวหิมะ" เป็นค่าเริ่มต้น', en: '"Snow white" became the default theme' },
          { a: 'data', th: 'ส่งออกข้อมูลทั้งหมดเป็นไฟล์ Excel (สรุปรายคน คะแนน การมาร่วม ความคิดเห็น ร้านค้า)', en: 'Export all data to an Excel file (summary per kid, points, attendance, feedback, shop)' },
          { a: 'admin', th: 'ตั้งได้ว่าคำแนะนำ (ลูกศร) จะโผล่ซ้ำทุกกี่วัน', en: 'Admins set how often the tips (arrows) come back' },
        ] },
      { v: '8', date: '2026-11-14', commit: '3a42c4f',
        items: [
          { a: 'kids', th: 'หน้าแรกเป็นอันดับ แตะชื่อตัวเองแล้วกด "นี่คือฉัน" การ์ดของฉันจะอยู่บนสุด', en: 'The ranking became the home page; tap your name and "This is me" to keep your card at the top' },
          { a: 'kids', th: 'แท็บเมนู รวมความคิดเห็น ภาษา วิธีใช้ และทางเข้าผู้ดูแล', en: 'Menu tab with feedback, language, how-to and the way in for adults' },
          { a: 'look', th: 'ธีมสี 4 แบบ: คืนคริสต์มาส ขาวหิมะ แดงคริสต์มาส ป่าสน', en: '4 colour themes: Christmas night, Snow white, Christmas red, Pine forest' },
          { a: 'kids', th: 'ความคิดเห็นของเด็ก: เลือกอารมณ์ เขียนข้อความ ส่งพร้อมชื่อหรือไม่ใส่ชื่อก็ได้ วันละครั้ง', en: 'Kids\' feedback: pick a mood, write a message, with or without a name, once a day' },
          { a: 'data', th: 'หมวดคะแนนมีรายละเอียดย่อย เช่น ดนตรี: เปียโน / ร้องเพลง / ซ้อมดนตรี', en: 'Point categories can have details, e.g. Music: piano / singing / practice' },
          { a: 'admin', th: 'จุดแดงบนเมนูผู้ดูแลบอกสิ่งที่ยังต้องทำ เช่น ยังไม่มีเด็ก ร้านว่าง เช็กชื่อยังไม่เสร็จ', en: 'Red dots on the admin menu show what still needs doing, such as no kids yet, an empty shop or unfinished attendance' },
        ] },
      { v: '7', date: '2026-11-14', commit: 'cbffb24',
        items: [
          { a: 'kids', th: 'ร้านของรางวัล: ชั้นวางของ แตะของแล้วเด้งออกมา (ถุงขนมมีมันฝรั่งกระจาย)', en: 'Prize shop: a stand with shelves; tapping a prize makes it pop out (chip bags spill chips)' },
          { a: 'admin', th: 'สรุปการมาร่วม: แต่ละคนมา ลา ขาด กี่ครั้ง จากทั้งหมดกี่รอบ', en: 'Attendance totals: how often each kid came, took leave or was absent, out of how many rounds' },
          { a: 'kids', th: 'คำแนะนำการใช้งานครั้งแรกเป็นลูกศรชี้ทีละปุ่ม', en: 'First-time tutorial with arrows pointing at each button' },
          { a: 'look', th: 'หิมะตกทั้งหน้าจอ และเพลง Jingle Bells เต็มเพลง', en: 'Snow falling over the whole screen, and the full Jingle Bells song' },
          { a: 'admin', th: 'แก้ไขหมวดคะแนนได้: ชื่อไทย/อังกฤษ ไอคอน และข้อความอธิบายที่เด็กแตะดูได้', en: 'Point categories can be edited: Thai/English name, icon and an explanation kids can tap to read' },
        ] },
    ] },
  { id: 'launch', th: 'เปิดตัว', en: 'Launch',
    versions: [
      { v: '5', date: '2026-11-14', commit: '9347b28',
        items: [
          { a: 'fix', th: 'แก้ต้นคริสต์มาสยืดเมื่อเปิดลิงก์ใน LINE', en: 'Fixed the stretched tree when the link is opened inside LINE' },
          { a: 'speed', th: 'เริ่มใช้เลขเวอร์ชันกับไฟล์ของแอป โทรศัพท์จึงได้ไฟล์ใหม่ทุกครั้งที่อัปเดต', en: 'Version numbers added to the app\'s files so phones get new files after each update' },
        ] },
      { v: '3', date: '2026-11-14', commit: '09f9735',
        items: [
          { a: 'fix', th: 'แก้ต้นคริสต์มาสยืดบนมือถือ', en: 'Fixed the stretched tree on phones' },
          { a: 'safety', th: 'ผู้ดูแลเข้าสู่ระบบด้วยชื่อผู้ใช้ (ไม่ต้องใช้อีเมล) และนำปุ่มสมัครบัญชีออกจากหน้าสาธารณะ', en: 'Adults log in with a username (no email needed), and the public sign-up button was removed' },
        ] },
      { v: '2', date: '2026-11-14', commit: '629b143',
        items: [
          { a: 'data', th: 'เชื่อมต่อฐานข้อมูลจริง (Supabase) ข้อมูลเก็บออนไลน์และทุกเครื่องเห็นเหมือนกัน', en: 'Connected the real database (Supabase): data is stored online and every phone sees the same' },
        ] },
      { v: '1', date: '2026-11-14', commit: 'd3c1536',
        items: [
          { a: 'kids', th: 'เด็กแตะชื่อตัวเองเพื่อดูคะแนนและอันดับ ไม่ต้องเข้าสู่ระบบ เห็นแค่ชื่อเล่น รูป และคะแนน', en: 'Kids tap their name to see points and rank, with no login; only nickname, avatar and points are shown' },
          { a: 'admin', th: 'ผู้ดูแล: เช็กชื่อ (มา / ลา / ขาด ได้คะแนนอัตโนมัติเมื่อมา) ให้คะแนนตามทักษะ และจัดการรายชื่อเด็ก', en: 'Adults: attendance (Here / Leave / Absent, with automatic points for coming), points by skill, and the kids list' },
          { a: 'look', th: 'ต้นคริสต์มาส 3 มิติที่หมุนและแตะได้ พร้อมเพลงคริสต์มาสที่สร้างในเครื่อง สลับภาษาไทย / อังกฤษ', en: 'A 3D Christmas tree to spin and tap, Christmas music made on the phone, and a Thai / English switch' },
          { a: 'safety', th: 'ผู้ดูแลคนแรกเป็นผู้ดูแลหลัก คนอื่นต้องได้รับอนุมัติ และกฎในฐานข้อมูลกันไม่ให้คนทั่วไปเห็นข้อมูลส่วนตัว', en: 'The first adult becomes the main admin, others need approval, and database rules keep personal data hidden from the public' },
        ] },
    ] },
];

// flat list, newest first: [{ v, date, commit, update, items }]
export const CHANGELOG = UPDATES.flatMap(u => u.versions.map(x => ({ ...x, update: u })));
