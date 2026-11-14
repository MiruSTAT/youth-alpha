// Read a song-sheet picture (for admins): finds the words and the chords, and puts each chord
// in [brackets] in front of the letter it sits over. Runs in the browser with Tesseract (Thai + English);
// the reading engine (~8 MB) is downloaded the first time only.
const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const CHORD = /^\(?[A-G][#b]?(?:maj|min|m|dim|aug|sus|add|M|°|\+)?\d*(?:(?:sus|add|maj|b|#)\d+)*\)?(?:\/[A-G][#b]?)?\)?$/;
const SKIP = /^(\||\/|-|–|\(x?\d+\)|x\d+|\*?\)|[A-Za-z]\)|\*|intro:?|outro:?|interlude:?)$/i;
const ZERO_W = /[ัิ-ฺ็-๎]/;
const THAI = /[฀-๿]/;

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = TESS; s.onload = () => res(window.Tesseract); s.onerror = rej; document.head.appendChild(s); });
}
// common reading slips in chord names: "Ern" -> "Em", "Brn" -> "Bm", "C#rn" -> "C#m"
// (Thai and Latin letters look alike: a chord "C" is often read as the Thai digit "๐")
const fixChord = (w) => w.replace(/^๐/, 'C').replace(/[๐-๙]/g, (d) => String(d.charCodeAt(0) - 0x0E50)).replace(/rn/g, 'm').replace(/^([A-G])[,.]$/, '$1');
const isChordWord = (w) => CHORD.test(fixChord(w)) || SKIP.test(w);

// bigger, sharper picture reads better
async function prepare(src) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const k = Math.min(3, Math.max(1, 1800 / img.naturalWidth));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export async function readSheet(src, { onProgress, skipTitles = [] } = {}) {
  const T = await loadTesseract();
  const canvas = await prepare(src);
  const worker = await T.createWorker(['tha', 'eng'], 1, { logger: (m) => { if (m.status === 'recognizing text') onProgress?.(m.progress * 0.7); } });
  let chordReader = null;
  try {
    const { data } = await worker.recognize(canvas);
    let lines = collect(data);
    // Chords: Thai reading often mixes up C, G and ๐ or skips lone letters, so every chord row is
    // cut into its separate chord names and each one is read on its own by an English chord reader.
    const ink = inkMap(canvas);
    const rows = [...lines.filter(looksLikeChords), ...missedRows(data, lines, ink)];
    if (rows.length) {
      chordReader = await T.createWorker('eng', 1);
      await chordReader.setParameters({ tessedit_char_whitelist: 'ABCDEFGmajsudi#b/0123456789+', tessedit_pageseg_mode: '8' });
      for (let k = 0; k < rows.length; k++) {
        const l = rows[k], found = [];
        for (const tk of tokens(ink, l)) {
          const r = await chordReader.recognize(crop(canvas, tk));
          const name = fixChord((r.data.text || '').replace(/\s+/g, ''));
          if (CHORD.test(name)) found.push({ text: name, bbox: { x0: tk.x0, x1: tk.x1, y0: tk.y0, y1: tk.y1 } });
        }
        if (found.length) { l.words = found; l.chords = true; if (l.missed) lines.push(l); }
        else if (!l.missed && l.conf < 60) l.drop = true;                 // not chords and barely readable: a speck or underline
        onProgress?.(0.7 + 0.3 * (k + 1) / rows.length);
      }
      lines = lines.filter(l => !l.drop).sort((a, b) => a.block - b.block || a.box.y0 - b.box.y0);
    }
    return rebuild(lines, skipTitles);
  } finally { worker.terminate(); chordReader?.terminate(); }
}

// which pixels are ink (dark or coloured text on the white page)
function inkMap(canvas) {
  const { width: W, height: H } = canvas, d = canvas.getContext('2d').getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < m.length; i++, p += 4) m[i] = (d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11) < 150 ? 1 : 0;
  return { m, W, H };
}
// rows of ink inside a text block that the first reading did not return (a row of chords only)
function missedRows(data, lines, ink) {
  const out = [], hs = lines.map(l => l.h).sort((a, b) => a - b), medH = hs[hs.length >> 1] || 20;
  (data.blocks || []).forEach((b, bi) => {
    const { x0, x1, y0, y1 } = b.bbox, taken = lines.filter(l => l.block === bi).map(l => [l.box.y0 - 2, l.box.y1 + 2]);
    let start = -1;
    for (let y = y0; y <= y1 + 1; y++) {
      let has = false;
      if (y <= y1) for (let x = x0; x <= x1 && !has; x++) has = ink.m[y * ink.W + x] === 1;
      if (has && start < 0) start = y;
      if (!has && start >= 0) {
        const h = y - start, mid = (start + y) / 2;
        if (h > medH * 0.35 && h < medH * 1.3 && !taken.some(([a, c]) => mid >= a && mid <= c))
          out.push({ block: bi, blockBox: b.bbox, words: [], box: { x0, x1, y0: start, y1: y }, h, missed: true });
        start = -1;
      }
    }
  });
  return out;
}
// split a chord row into separate chord names by the empty space between them
function tokens(ink, l) {
  const bx = l.blockBox || l.box, x0 = Math.max(0, Math.min(bx.x0, l.box.x0) - 4), x1 = Math.min(ink.W - 1, Math.max(bx.x1, l.box.x1) + 4);
  const y0 = Math.max(0, l.box.y0 - 2), y1 = Math.min(ink.H - 1, l.box.y1 + 2), h = y1 - y0, out = [];
  let cur = null, gap = 0;
  for (let x = x0; x <= x1; x++) {
    let has = false;
    for (let y = y0; y <= y1 && !has; y++) has = ink.m[y * ink.W + x] === 1;
    if (has) { if (!cur) cur = { x0: x, x1: x, y0, y1 }; cur.x1 = x; gap = 0; }
    else if (cur && ++gap > h * 0.45) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out.filter(t => t.x1 - t.x0 > 2);
}
// one chord name, cut out with a white border (single words read best this way)
function crop(canvas, t) {
  const pad = Math.round((t.y1 - t.y0) * 0.5), w = t.x1 - t.x0 + pad * 2, h = t.y1 - t.y0 + pad * 2;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.drawImage(canvas, t.x0, t.y0, t.x1 - t.x0 + 1, t.y1 - t.y0 + 1, pad, pad, t.x1 - t.x0 + 1, t.y1 - t.y0 + 1);
  return c;
}

function collect(data) {
  const lines = [];
  (data.blocks || []).forEach((b, bi) => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => {
    const words = (l.words || []).filter(w => w.text && w.text.trim() && w.confidence > 20);
    if (!words.length) return;
    const line = { block: bi, blockBox: b.bbox, words, box: l.bbox, h: l.bbox.y1 - l.bbox.y0, conf: l.confidence };
    if (l.confidence < 60 && !looksLikeChords(line)) return;                // smudges, underlines, decorations
    lines.push(line);
  })));
  // drop thin leftovers (underlines, specks) that are much shorter than a text line
  const hs = lines.map(l => l.h).sort((a, b) => a - b), medH = hs[hs.length >> 1] || 20;
  return lines.filter(l => l.h >= medH * 0.7 || looksLikeChords(l));
}
// short "words" with wide gaps and no Thai letters: probably a chord line
function looksLikeChords(l) {
  const ws = l.words.map(w => w.text.trim());
  if (!ws.every(w => w.length <= 6 && !/[ก-๏]/.test(w))) return false;
  if (ws.every(w => isChordWord(w))) return true;
  const gaps = l.words.slice(1).map((w, i) => w.bbox.x0 - l.words[i].bbox.x1);
  return ws.length === 1 ? ws[0].length <= 4 : gaps.some(g => g > l.h * 1.2);
}

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
        if (!ZERO_W.test(wt[0]) && (!thaiJoin || gap > cw * 0.9)) text += ' ';                     // Thai is read letter by letter: only a wide gap is a real space
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
    if (chordLine && next && next.box.y0 - l.box.y1 < medH * 1.2 && Math.abs(next.box.x0 - l.box.x0) < medH * 12 && !isChordLineObj(next)) {
      const { text, marks } = lineText(next);
      const ins = [];
      l.words.forEach(w => {
        const name = fixChord(w.text.trim()).replace(/[()]/g, '');
        if (!CHORD.test(name)) return;
        const cx = w.bbox.x0;
        let at = text.length;
        const hit = marks.find(m => m.x1 > cx + 2);                         // first letter that ends to the right of the chord's start
        if (hit && cx < marks[marks.length - 1].x1) at = hit.i;
        while (at > 0 && at < text.length && ZERO_W.test(text[at])) at--;    // a vowel/tone mark sits on its letter: chord goes before the letter
        ins.push({ at, name });
      });
      let res = text;
      ins.sort((a, b) => b.at - a.at).forEach(({ at, name }) => {
        res = at >= res.length ? res.replace(/\s*$/, '') + ' [' + name + ']' : res.slice(0, at) + '[' + name + ']' + res.slice(at);
      });
      out.push(res.trim());
      lastBottom = next.box.y1; i++;
      continue;
    }
    out.push(chordLine ? l.words.map(w => { const x = w.text.trim(); return CHORD.test(fixChord(x)) ? fixChord(x) : x; }).join(' ') : asText);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
