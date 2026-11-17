// v35 "Real mobile preview": sample data for the kids' app opened with ?demo=1 (inside the phone frame on the admin panel).
// Nothing here is ever saved: index.html swaps localStorage for an in-memory copy before any code runs,
// and data.js uses the local preview store (never Supabase) filled from demoDb(). Reloading the frame starts fresh.
export const DEMO = !!window.YA_DEMO;

export function demoDb() {
  const now = new Date(), iso = (daysAgo) => new Date(now - daysAgo * 864e5).toISOString();
  const day = (daysAgo) => iso(daysAgo).slice(0, 10);
  // the program shown: the parent page (admin panel) hands over its program's name and look; otherwise a plain sample
  let pr = null; try { pr = window.parent !== window ? window.parent.YA_DEMO_PROGRAM : null; } catch { pr = null; }
  const kids = [['มิน', '🐰'], ['ต้นกล้า', '🦊'], ['ใบเตย', '🦋'], ['ภูผา', '🦁'], ['น้ำหวาน', '🐱'], ['ข้าวปุ้น', '🐼'],
    ['ฟ้าใส', '⭐'], ['ปลาย', '🐧'], ['ซันนี่', '🌻'], ['โอ๊ต', '🐶'], ['แพรวา', '🦄'], ['เจได', '🐯']]
    .map(([nickname, avatar], i) => ({ id: 'demo-kid-' + (i + 1), nickname, avatar, grp: '', active: true, created_at: iso(30) }));
  const skills = ['music', 'english', 'thai', 'questions', 'bonus'];
  const points = [], attendance = [];
  kids.forEach((k, i) => {
    const visits = 6 - (i % 5);                                      // different totals, a few ties
    for (let w = 0; w < visits; w++) {
      const a = { id: `demo-att-${i}-${w}`, kid_id: k.id, day: day(w * 7 + 1), session: 'main', status: 'present', updated_at: iso(w * 7 + 1) };
      attendance.push(a);
      points.push({ id: `demo-pa-${i}-${w}`, kid_id: k.id, skill: 'attendance', amount: 10, note: a.day, attendance_id: a.id, created_at: a.updated_at });
    }
    for (let j = 0; j < 3 + (i % 4); j++)
      points.push({ id: `demo-p-${i}-${j}`, kid_id: k.id, skill: skills[(i + j) % skills.length], amount: 5 * (1 + ((i * 3 + j) % 4)), note: '', attendance_id: null, created_at: iso(j * 3 + 2) });
  });
  return {
    kids, points, attendance, rounds: [], money: [], schedule: [], feedback: [], audit: [], events: [], redemptions: [], members: [], msess: {}, admins: [],
    settings: { attendance_points: 10, fb_open: true, tip_days: 0,
      announce: 'ตัวอย่างประกาศ: สัปดาห์นี้ซ้อมร้องเพลงกันนะ', verse_text: 'จงรักกันและกัน เหมือนที่เรารักท่าน', verse_ref: 'ยอห์น 15:12' },
    cats: [{ id: 'demo-c1', name: 'ของเล่น', icon: '🧸', effect: '✨', sort: 1 }, { id: 'demo-c2', name: 'ขนม', icon: '🍬', effect: '✨', sort: 2 }],
    items: [['ตุ๊กตาหมี', '🧸', 120, 'demo-c1'], ['ลูกบอล', '⚽', 80, 'demo-c1'], ['สติกเกอร์', '⭐', 30, 'demo-c1'],
      ['ช็อกโกแลต', '🍫', 40, 'demo-c2'], ['ลูกอม', '🍬', 15, 'demo-c2']]
      .map(([name, icon, price, category_id], i) => ({ id: 'demo-item-' + i, name, icon, price, category_id, active: true, sort: i + 1 })),
    programs: [{ id: 1, slug: '', name: pr?.name || 'Youth Alpha', archived: false, look: pr?.look || {}, login_mode: 'off' }],
    loggedIn: false,
  };
}
