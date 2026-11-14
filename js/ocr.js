// Read a song-sheet picture (for admins): finds the words and the chords, and puts each chord
// in [brackets] in front of the letter it sits over. Runs in the browser:
//  * words (Thai + English): Tesseract, downloaded the first time only (~8 MB)
//  * chords: every chord name is cut out and compared, shape by shape, with how each possible chord
//    looks when printed (several common fonts), and chords that belong to the song's key get a small
//    head start. Text readers often mix up D/B, A/E or miss lone letters; shapes do not.
const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const CHORD = /^\(?[A-G][#b]?(?:maj|min|m|dim|aug|sus|add|M|°|\+)?\d*(?:(?:sus|add|maj|b|#)\d+)*\)?(?:\/[A-G][#b]?)?\)?$/;
const SKIP = /^(\||\/|-|–|\(x?\d+\)|x\d+|\*?\)|[A-Za-z]\)|\*|intro:?|outro:?|interlude:?)$/i;
const ZERO_W = /[ัิ-ฺ็-๎]/;
const THAI = /[฀-๿]/;
const THAI_LETTER = /[ก-๏]/;

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = TESS; s.onload = () => res(window.Tesseract); s.onerror = rej; document.head.appendChild(s); });
}
// common reading slips in chord names ("Ern" -> "Em"; a chord "C" read as the Thai digit "๐")
const fixChord = (w) => w.replace(/^๐/, 'C').replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - 0x0E50)).replace(/rn/g, 'm').replace(/^([A-G])[,.]$/, '$1');
const isChordWord = (w) => CHORD.test(fixChord(w)) || SKIP.test(w);

// ------------------------------------------------------------- picture preparation
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
// typical height of a row of writing in the picture (to scale small pictures up the right amount)
function rowHeight(img) {
  const w = Math.min(img.naturalWidth, 1200), k = w / img.naturalWidth, h = Math.round(img.naturalHeight * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, runs = [];
  let run = 0;
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; if (d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11 < 140) n++; }
    if (n > 1) run++; else { if (run > 2) runs.push(run); run = 0; }
  }
  runs.sort((a, b) => a - b);
  return (runs[runs.length >> 1] || 16) / k;
}
// scale so a row of writing is ~70 px tall, then grey, stretch the contrast and sharpen a little
async function prepare(src) {
  const img = await loadImg(src);
  const rh = rowHeight(img);
  let k = Math.max(1, Math.min(5, 90 / rh));
  if (img.naturalWidth * k > 5000) k = 5000 / img.naturalWidth;
  const W = Math.round(img.naturalWidth * k), H = Math.round(img.naturalHeight * k);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, W, H);
  const id = g.getImageData(0, 0, W, H), d = id.data, gray = new Float32Array(W * H), hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) { const v = d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11; gray[i] = v; hist[v | 0]++; }
  const pct = (q) => { let a = 0; for (let v = 0; v < 256; v++) { a += hist[v]; if (a >= gray.length * q) return v; } return 255; };
  const lo = pct(0.01), hi = Math.max(lo + 40, pct(0.6));                 // ink ... paper
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    let v = gray[i];
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) v = v * 1.8 - (gray[i - 1] + gray[i + 1] + gray[i - W] + gray[i + W]) * 0.2;   // light sharpen
    v = Math.max(0, Math.min(255, (v - lo) * 255 / (hi - lo)));
    const p = i * 4; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
}

// ------------------------------------------------------------- main
export async function readSheet(src, { onProgress, skipTitles = [], key = '' } = {}) {
  const T = await loadTesseract();
  const canvas = await prepare(src);
  const worker = await T.createWorker(['tha', 'eng'], 1, { logger: (m) => { if (m.status === 'recognizing text') onProgress?.(m.progress * 0.75); } });
  try {
    const { data } = await worker.recognize(canvas);
    let lines = mergeRows(collect(data));
    // Chords are found on the picture itself: every row of ink that is mostly empty space with a few short
    // pieces is cut into its chord names, and each name is matched by shape (see matchChord).
    const ink = inkMap(canvas), shapes = chordShapes(key);
    const rows = chordRows(ink, shapes, (p) => onProgress?.(0.75 + 0.25 * p));
    rows.forEach(r => {
      // the text reader's guess for this row (often wrong letters) is replaced by the matched chords
      lines.forEach(l => { l.words = l.words.filter(w => { const cy = (w.bbox.y0 + w.bbox.y1) / 2; return !(cy >= r.y0 - 2 && cy <= r.y1 + 2 && w.bbox.x1 >= r.x0 - 4 && w.bbox.x0 <= r.x1 + 4); }); });
      const near = lines.filter(l => l.words.length && l.box.x1 >= r.x0 && l.box.x0 <= r.x1).sort((a, b) => Math.abs(a.box.y0 - r.y1) - Math.abs(b.box.y0 - r.y1))[0];
      lines.push({ block: near ? near.block : 0, words: r.words, box: { x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }, h: r.y1 - r.y0, chords: true, conf: 99 });
    });
    const realText = (l) => l.chords || l.words.map(w => w.text.trim()).join('').replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E.,'"`:;!\-_~|()]/g, '').length >= 2;
    lines = lines.filter(l => l.words.length && realText(l)).map(l => l.chords ? l : { ...l, box: boxOf(l.words), h: boxOf(l.words).y1 - boxOf(l.words).y0 });
    lines.sort((a, b) => a.block - b.block || a.box.y0 - b.box.y0);
    return rebuild(lines, skipTitles);
  } finally { worker.terminate(); }
}
const boxOf = (ws) => ({ x0: Math.min(...ws.map(w => w.bbox.x0)), x1: Math.max(...ws.map(w => w.bbox.x1)), y0: Math.min(...ws.map(w => w.bbox.y0)), y1: Math.max(...ws.map(w => w.bbox.y1)) });

// columns of writing (a two-column page is read one column at a time)
function columns(ink) {
  const cnt = new Uint32Array(ink.W);
  for (let y = 0; y < ink.H; y++) for (let x = 0; x < ink.W; x++) cnt[x] += ink.m[y * ink.W + x];
  const minGap = Math.max(40, ink.W * 0.05), cols = [];
  let x = 0;
  while (x < ink.W) {
    while (x < ink.W && cnt[x] === 0) x++;
    if (x >= ink.W) break;
    const s = x; let e = x, white = 0;
    while (x < ink.W) { if (cnt[x]) { e = x; white = 0; } else if (++white > minGap) break; x++; }
    cols.push({ x0: s, x1: e });
  }
  return cols;
}
// rows of ink in one column (Thai vowel/tone marks are kept with their line)
function inkRows(ink, x0, x1) {
  const runs = [];
  let start = -1;
  for (let y = 0; y <= ink.H; y++) {
    let has = false;
    if (y < ink.H) for (let x = x0; x <= x1 && !has; x++) has = ink.m[y * ink.W + x] === 1;
    if (has && start < 0) start = y;
    if (!has && start >= 0) { runs.push({ y0: start, y1: y - 1 }); start = -1; }
  }
  const hs = runs.map(r => r.y1 - r.y0 + 1).filter(h => h >= 4).sort((a, b) => a - b), med = hs[hs.length >> 1] || 12;
  const small = (r) => r.y1 - r.y0 + 1 < med * 0.45, out = [];
  // a thin run (vowel / tone marks) joins the line it is closest to
  runs.forEach((r, i) => {
    if (!small(r)) { out.push({ ...r }); return; }
    const prev = out[out.length - 1], next = runs.slice(i + 1).find(x => !small(x));
    const gp = prev ? r.y0 - prev.y1 : Infinity, gn = next ? next.y0 - r.y1 : Infinity;
    if (gn <= gp && gn <= med * 0.35) next.y0 = Math.min(next.y0, r.y0);
    else if (gp <= med * 0.35) prev.y1 = Math.max(prev.y1, r.y1);
  });
  return { rows: out, med };
}
function chordRows(ink, shapes, progress) {
  const found = [], cols = columns(ink), all = [];
  cols.forEach(c => { const { rows } = inkRows(ink, c.x0, c.x1); rows.forEach(r => all.push({ ...r, x0: c.x0, x1: c.x1 })); });
  const hs = all.map(r => r.y1 - r.y0 + 1).sort((a, b) => a - b), medRow = hs[hs.length >> 1] || 20;
  all.forEach((r0, i) => {
    let r = r0;
    const h = r.y1 - r.y0 + 1;
    if (h < medRow * 0.35 || h > medRow * 1.25) return;
    let tks = tokens(ink, { box: { x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 } });
    // little bits (vowel/tone marks of the line below that reach up into this row) are not chords
    const th = tks.map(t => t.y1 - t.y0 + 1).sort((a, b) => a - b), medT = th[th.length >> 1] || 0;
    tks = tks.filter(t => t.y1 - t.y0 + 1 >= medT * 0.55);
    if (!tks.length || tks.length > 16) return;
    const span = tks[tks.length - 1].x1 - tks[0].x0 + 1, used = tks.reduce((a, t) => a + t.x1 - t.x0 + 1, 0);
    if (tks.length > 3 && used / span > 0.55) return;                       // dense writing = words, not chords
    // a written word is long and flat; a chord name is short (C, Am, F#m, A7, Cmaj7)
    const capH = Math.max(...tks.map(t => t.y1 - t.y0 + 1));
    r = { ...r, y0: Math.min(...tks.map(t => t.y0)), y1: Math.max(...tks.map(t => t.y1)) };
    if (tks.some(t => (t.x1 - t.x0 + 1) > capH * 4.2)) return;
    const words = [];
    let good = 0, sum = 0, n = 0;
    tks.forEach(t => matchSplit(ink, t, shapes).forEach(m => { n++; sum += m.score; if (m.name) { good++; words.push({ text: m.name, bbox: { x0: m.t.x0, x1: m.t.x1, y0: m.t.y0, y1: m.t.y1 } }); } }));
    if (words.length && good >= Math.ceil(n * 0.7) && sum / n >= 0.7) found.push({ y0: r.y0, y1: r.y1, x0: tks[0].x0, x1: tks[tks.length - 1].x1, words });
    progress?.((i + 1) / all.length);
  });
  return found;
}
// one piece may be two chords written close together ("A D"): try cutting it at its widest gap
function matchSplit(ink, t, shapes) {
  const one = matchChord(ink, t, shapes);
  if (one.score >= 0.86) return [{ t, name: one.name, score: one.score }];
  const th = t.y1 - t.y0 + 1, cnt = [];
  for (let x = t.x0; x <= t.x1; x++) { let n = 0; for (let y = t.y0; y <= t.y1; y++) n += ink.m[y * ink.W + x]; cnt.push(n); }
  // weakest columns (where two names could touch), away from the edges
  const cuts = cnt.map((n, i) => ({ i, n })).filter(c => c.i > th * 0.4 && c.i < cnt.length - th * 0.4 && c.n <= Math.max(1, th * 0.08))
    .sort((a, b) => a.n - b.n).slice(0, 4);
  let bestPair = null;
  for (const c of cuts) {
    const x = t.x0 + c.i, a = tight(ink, { ...t, x1: x - 1 }), b = tight(ink, { ...t, x0: x + 1 });
    const ma = matchChord(ink, a, shapes), mb = matchChord(ink, b, shapes);
    if (ma.name && mb.name) { const sc = (ma.score + mb.score) / 2; if (!bestPair || sc > bestPair.sc) bestPair = { sc, r: [{ t: a, name: ma.name, score: ma.score }, { t: b, name: mb.name, score: mb.score }] }; }
  }
  if (bestPair && bestPair.sc > Math.max(one.score, 0.66) + 0.03) return bestPair.r;
  return [{ t, name: one.name, score: one.score }];
}

// which pixels are ink
function inkMap(canvas) {
  const { width: W, height: H } = canvas, d = canvas.getContext('2d').getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < m.length; i++, p += 4) m[i] = d[p] < 128 ? 1 : 0;
  return { m, W, H };
}
function collect(data) {
  const lines = [];
  (data.blocks || []).forEach((b, bi) => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => {
    const words = (l.words || []).filter(w => w.text && w.text.trim() && w.confidence > 20);
    if (!words.length) return;
    const line = { block: bi, blockBox: b.bbox, words, box: { ...l.bbox }, h: l.bbox.y1 - l.bbox.y0, conf: l.confidence };
    const letters = words.map(w => w.text.trim()).join('').replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E.,'"`:;!\-_~|]/g, '');
    if (letters.length < 2) return;                                          // a stray mark or dot
    if (l.confidence < 55) return;                                          // smudges, underlines, decorations
    lines.push(line);
  })));
  const hs = lines.map(l => l.h).sort((a, b) => a - b), medH = hs[hs.length >> 1] || 20;
  return lines;
}
// one printed line is sometimes returned as two pieces (a wide gap or brackets): join them back
function mergeRows(lines) {
  const hs = lines.map(l => l.h).sort((a, b) => a - b), medH = hs[hs.length >> 1] || 20, out = [];
  [...lines].sort((a, b) => a.box.y0 - b.box.y0 || a.box.x0 - b.box.x0).forEach(l => {
    const m = out.find(o => {
      const ov = Math.min(o.box.y1, l.box.y1) - Math.max(o.box.y0, l.box.y0);
      const gap = l.box.x0 > o.box.x1 ? l.box.x0 - o.box.x1 : o.box.x0 > l.box.x1 ? o.box.x0 - l.box.x1 : 0;
      return ov > Math.min(o.h, l.h) * 0.55 && gap < medH * 4;
    });
    if (!m) { out.push(l); return; }
    m.words = [...m.words, ...l.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
    m.box = { x0: Math.min(m.box.x0, l.box.x0), x1: Math.max(m.box.x1, l.box.x1), y0: Math.min(m.box.y0, l.box.y0), y1: Math.max(m.box.y1, l.box.y1) };
    m.h = m.box.y1 - m.box.y0; m.conf = Math.max(m.conf, l.conf);
    if (l.blockBox && m.blockBox) m.blockBox = { x0: Math.min(m.blockBox.x0, l.blockBox.x0), x1: Math.max(m.blockBox.x1, l.blockBox.x1), y0: m.blockBox.y0, y1: m.blockBox.y1 };
  });
  return out.sort((a, b) => a.block - b.block || a.box.y0 - b.box.y0);
}
// a row that is probably chords: short pieces, no Thai letters, starting with A–G (or misread as ๐)
// rows of ink inside a text block that the first reading did not return (a row of chords only)
// split a chord row into separate chord names by the empty space between them
function tokens(ink, l) {
  const bx = l.blockBox || l.box, x0 = Math.max(0, Math.min(bx.x0, l.box.x0) - 4), x1 = Math.min(ink.W - 1, Math.max(bx.x1, l.box.x1) + 4);
  const y0 = Math.max(0, l.box.y0 - 3), y1 = Math.min(ink.H - 1, l.box.y1 + 3);
  // height of the letters in this row -> a space between chords is wider than the gap between letters
  let top = y1, bot = y0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (ink.m[y * ink.W + x]) { if (y < top) top = y; if (y > bot) bot = y; break; }
  const cap = Math.max(4, bot - top), out = [];
  let cur = null, gap = 0;
  for (let x = x0; x <= x1; x++) {
    let has = false;
    for (let y = top; y <= bot && !has; y++) has = ink.m[y * ink.W + x] === 1;
    if (has) { if (!cur) cur = { x0: x, x1: x, y0: top, y1: bot }; cur.x1 = x; gap = 0; }
    else if (cur && ++gap > Math.max(2, cap * 0.24)) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out.filter(t => t.x1 - t.x0 > 1).map(t => tight(ink, t));
}
function tight(ink, t) {
  let y0 = t.y1, y1 = t.y0;
  for (let y = t.y0; y <= t.y1; y++) for (let x = t.x0; x <= t.x1; x++) if (ink.m[y * ink.W + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { ...t, y0: Math.min(y0, t.y1), y1: Math.max(y1, y0) };
}

// ------------------------------------------------------------- chord shapes
const NH = 24;                                                     // compare at this height
const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const QUALS = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'sus2', 'dim', 'aug', '6', '9', 'add9', 'm6', '7sus4'];
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const FONTS = ['Tahoma', 'Arial', 'sans-serif'];
const shapeCache = new Map();
// chords that fit the song's key get a little head start
function keyPrior(key) {
  const m = /^([A-G][#b]?)(m?)$/.exec(String(key || '').trim()); if (!m) return (name) => /dim|aug|6|9|sus2|7sus4/.test(name) ? -0.04 : 0;
  const r = PC[m[1]], minor = !!m[2];
  const strong = new Set(), weak = new Set(), add = (set, deg, q) => set.add(((r + deg) % 12) + q);
  if (!minor) {
    [[0, ''], [2, 'm'], [4, 'm'], [5, ''], [7, ''], [7, '7'], [9, 'm']].forEach(([d, q]) => add(strong, d, q));
    [[0, '7'], [0, 'maj7'], [2, '7'], [2, 'm7'], [4, '7'], [5, 'maj7'], [5, 'm'], [9, 'm7'], [10, ''], [11, 'dim'], [0, 'sus4'], [7, 'sus4'], [5, '6']].forEach(([d, q]) => add(weak, d, q));
  } else {
    [[0, 'm'], [3, ''], [5, 'm'], [7, 'm'], [7, ''], [7, '7'], [8, ''], [10, '']].forEach(([d, q]) => add(strong, d, q));
    [[0, 'm7'], [2, 'dim'], [5, 'm7'], [3, 'maj7'], [10, '7'], [11, 'dim']].forEach(([d, q]) => add(weak, d, q));
  }
  return (name) => {
    const mm = /^([A-G][#b]?)(.*?)(\/.*)?$/.exec(name); const id = PC[mm[1]] + mm[2];
    if (strong.has(id)) return 0.07;
    if (weak.has(id)) return 0.035;
    return /dim|aug|6|9|sus2|7sus4/.test(mm[2]) ? -0.05 : -0.02;          // unusual chords need a clearer match
  };
}
function bitmapFromCanvas(g, w, h) {
  const d = g.getImageData(0, 0, w, h).data, b = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < b.length; i++, p += 4) b[i] = d[p] < 128 ? 1 : 0;
  return b;
}
// a chord name as printed: tight around the ink, scaled to NH pixels high
function renderShape(text, font, weight) {
  const CW = 300, CH = 64;
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH); g.fillStyle = '#000'; g.font = `${weight} 40px ${font}`; g.textBaseline = 'alphabetic'; g.fillText(text, 6, 50);
  const b = bitmapFromCanvas(g, CW, CH);
  let x0 = CW, x1 = 0, y0 = CH, y1 = 0;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (b[y * CW + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return null;
  const w = Math.max(1, Math.round((x1 - x0 + 1) * NH / (y1 - y0 + 1)));
  const s = document.createElement('canvas'); s.width = w; s.height = NH;
  const sg = s.getContext('2d', { willReadFrequently: true }); sg.fillStyle = '#fff'; sg.fillRect(0, 0, w, NH);
  sg.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, w, NH);
  return { w, b: bitmapFromCanvas(sg, w, NH) };
}
function chordShapes(key) {
  const names = [];
  ROOTS.forEach(r => QUALS.forEach(q => names.push(r + q)));
  const list = [];
  for (const n of names) for (const f of FONTS) for (const wt of ['400', '700']) {
    const k = n + '|' + f + '|' + wt;
    if (!shapeCache.has(k)) shapeCache.set(k, renderShape(n, f, wt));
    const s = shapeCache.get(k); if (s) list.push({ name: n, ...s });
  }
  return { list, prior: keyPrior(key) };
}
// how alike two ink pictures are (allowing a pixel of wobble)
function likeness(a, aw, b, bw) {
  const W = aw, H = NH;
  const at = (arr, w, x, y) => (x >= 0 && y >= 0 && x < w && y < H) ? arr[y * w + x] : 0;
  const bs = (x, y) => at(b, bw, Math.round(x * bw / W), y);              // b stretched to a's width
  let aInk = 0, bInk = 0, aHit = 0, bHit = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const av = a[y * W + x], bv = bs(x, y);
    if (av) { aInk++; if (bv || bs(x - 1, y) || bs(x + 1, y) || bs(x, y - 1) || bs(x, y + 1)) aHit++; }
    if (bv) { bInk++; if (av || at(a, W, x - 1, y) || at(a, W, x + 1, y) || at(a, W, x, y - 1) || at(a, W, x, y + 1)) bHit++; }
  }
  if (!aInk || !bInk) return 0;
  const p = aHit / aInk, r = bHit / bInk;
  return 2 * p * r / (p + r || 1);
}
function matchChord(ink, t, shapes) {
  const tw = t.x1 - t.x0 + 1, th = t.y1 - t.y0 + 1;
  if (th < 4) return { name: null, score: 0 };
  const w = Math.max(1, Math.round(tw * NH / th)), a = new Uint8Array(w * NH);
  for (let y = 0; y < NH; y++) for (let x = 0; x < w; x++) a[y * w + x] = ink.m[(t.y0 + Math.floor(y * th / NH)) * ink.W + t.x0 + Math.floor(x * tw / w)];
  let best = null, bestS = 0, bestShape = 0;
  for (const s of shapes.list) {
    if (Math.abs(s.w - w) / w > 0.3) continue;                            // clearly a different length
    const sh = likeness(a, w, s.b, s.w), sc = sh + shapes.prior(s.name);
    if (sc > bestS) { bestS = sc; best = s.name; bestShape = sh; }
  }
  const exotic = best && /dim|aug|6|9|sus|maj7/.test(best);
  return { name: bestShape >= (exotic ? 0.8 : 0.66) ? best : null, score: bestShape };
}

// ------------------------------------------------------------- put it together as text
function rebuild(lines, skipTitles) {
  const norm = (x) => String(x || '').replace(/[์\s'’".,!:]/g, '').toLowerCase();
  const skip = new Set(skipTitles.filter(Boolean).map(norm));
  const hs = lines.map(l => l.h).sort((a, b) => a - b), medH = hs[hs.length >> 1] || 20;
  // one line of text, keeping where each letter is on the picture
  const lineText = (l) => {
    const widths = l.words.flatMap(w => (w.symbols || []).map(s => s.bbox.x1 - s.bbox.x0)).filter(x => x > 2).sort((a, b) => a - b);
    const cw = widths[widths.length >> 1] || medH * 0.5;                     // typical letter width on this line
    let text = '', marks = [], prev = null;
    l.words.forEach(w => {
      const wt = w.text.trim();
      if (prev) {
        const gap = w.bbox.x0 - prev.bbox.x1, thaiJoin = THAI.test(prev.text.trim().slice(-1)) && THAI.test(wt[0]);
        if (!ZERO_W.test(wt[0]) && (!thaiJoin || gap > cw * 0.9)) text += ' ';   // Thai is read letter by letter: only a wide gap is a real space
      }
      const syms = (w.symbols && w.symbols.length) ? w.symbols : [{ text: wt, bbox: w.bbox }];
      syms.forEach(sy => { marks.push({ i: text.length, x0: sy.bbox.x0, x1: sy.bbox.x1 }); text += sy.text; });
      prev = w;
    });
    return { text, marks };
  };
  const isChordLineObj = (l) => l.chords || (l.words.every(w => isChordWord(w.text.trim())) && l.words.some(w => CHORD.test(fixChord(w.text.trim()))));
  const out = [];
  let lastBottom = null, lastBlock = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (lastBlock !== null && (l.block !== lastBlock || l.box.y0 - lastBottom > medH * 1.6)) out.push('');
    lastBlock = l.block; lastBottom = l.box.y1;
    const asText = lineText(l).text.trim();
    if (skip.has(norm(asText))) continue;
    const chordLine = isChordLineObj(l);
    const next = lines[i + 1];
    if (chordLine && next && next.box.y0 - l.box.y1 < medH * 1.2 && !isChordLineObj(next)) {
      const { text, marks } = lineText(next);
      const ins = [];
      const letters = marks.filter(m => !ZERO_W.test(text[m.i]) && text[m.i] !== ' ');
      const ws = letters.map(m => m.x1 - m.x0).sort((a, b) => a - b), cw = ws[ws.length >> 1] || 10;
      const good = letters.filter(m => m.x1 - m.x0 <= cw * 3.5);            // letters with a believable box
      let minAt = 0;
      [...l.words].sort((a, b) => a.bbox.x0 - b.bbox.x0).forEach(w => {
        const name = fixChord(w.text.trim()).replace(/[()]/g, '');
        if (!CHORD.test(name)) return;
        const cx = w.bbox.x0;
        let at = text.length;
        const hit = good.find(m => m.x1 > cx + cw * 0.3);                    // the letter under the chord's left edge
        if (hit && cx < (good[good.length - 1]?.x1 ?? 0)) {
          at = hit.i;
          // the chord starts clearly before this letter: it belongs to the letter before (its box was misread)
          if (cx < hit.x0 - cw * 0.3 && at > 0 && text[at - 1] !== ' ') { at--; while (at > 0 && ZERO_W.test(text[at])) at--; }
        }
        while (at > 0 && at < text.length && ZERO_W.test(text[at])) at--;    // a vowel/tone mark sits on its letter: chord goes before the letter
        if (at > 0 && /[เแโใไ]/.test(text[at - 1])) at--;                   // and a Thai syllable starts with its leading vowel
        at = Math.max(at, minAt); minAt = at + 1;                            // keep the chords in their left-to-right order
        ins.push({ at: Math.min(at, text.length), name });
      });
      let res = '', last = 0;                                               // build left to right (keeps the order)
      ins.forEach(({ at, name }) => {
        const a = Math.min(at, text.length);
        res += text.slice(last, a) + (a >= text.length && res && !/\s$/.test(res) ? ' ' : '') + '[' + name + ']';
        last = a;
      });
      res += text.slice(last);
      out.push(res.trim());
      lastBottom = next.box.y1; i++;
      continue;
    }
    out.push(chordLine ? l.words.map(w => { const x = w.text.trim(); return CHORD.test(fixChord(x)) ? fixChord(x) : x; }).join(' ') : asText);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
