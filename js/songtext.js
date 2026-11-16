// Song text: the lyrics-with-chords format, chord parsing, key change, and turning pasted song sheets
// into that format. Pure functions (no app state), moved out of app.js in v25.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// =============================================================== SONGS
// Lyrics with chords: "[G]Jingle bells" (chords in brackets), "# Chorus" (section name),
// or the usual "chords on the line above the words" layout.
export const CHORD_TOKEN = /^\(?[A-G][#b]?(?:maj|min|m|dim|aug|sus|add|M|°|ø|\+)?\d*(?:(?:sus|add|maj|b|#)\d+)*\)?(?:\/[A-G][#b]?)?\)?$/;
export const isChordLine = (line) => {
  const toks = line.trim().split(/\s+/).filter(x => !/^(\||\/|-|–|\(x?\d+\)|x\d+|\*?\)|[A-Za-z]\)|\*|intro:?|outro:?|interlude:?)$/i.test(x));
  return toks.length > 0 && toks.every(x => CHORD_TOKEN.test(x));
};
export const ZERO_W = /[ัิ-ฺ็-๎̀-ͯ]/;      // Thai vowels/tone marks above or below: no width
export function splitAtColumns(text, cols) {          // map visual columns of a chord line onto the lyric line
  const idx = []; let col = 0, ci = 0;
  for (let i = 0; i <= text.length && ci < cols.length; i++) {
    while (ci < cols.length && col >= cols[ci]) { let j = i; while (j < text.length && ZERO_W.test(text[j])) j++; idx.push(j); ci++; }
    if (i < text.length && !ZERO_W.test(text[i])) col++;
  }
  while (idx.length < cols.length) idx.push(text.length);
  return idx;
}
export function parseSong(content) {
  const out = [], lines = String(content || '').replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, '    '), sec = /^\s*(?:#\s*(.+?)|\{(?:c:|comment:)?\s*(.+?)\})\s*$/.exec(line);
    if (sec) { out.push({ k: 'sec', text: sec[1] || sec[2] }); continue; }
    if (!line.trim()) { if (out.length && out[out.length - 1].k !== 'gap') out.push({ k: 'gap' }); continue; }
    if (!/\[[^\]]+\]/.test(line) && isChordLine(line)) {
      const next = lines[i + 1];
      if (next && next.trim() && !isChordLine(next) && !/^\s*#/.test(next) && !/\[[^\]]+\]/.test(next)) {
        const cols = [], names = [], re = /\S+/g; let m;
        while ((m = re.exec(line))) if (CHORD_TOKEN.test(m[0])) { cols.push(m.index); names.push(m[0].replace(/[()]/g, '')); }
        const lyric = next.replace(/\t/g, '    '), at = splitAtColumns(lyric, cols), segs = [];
        if (at[0] > 0) segs.push({ ch: '', ly: lyric.slice(0, at[0]) });
        at.forEach((a, j) => segs.push({ ch: names[j], ly: lyric.slice(a, at[j + 1] ?? lyric.length) || ' ' }));
        out.push({ k: 'line', segs }); i++; continue;
      }
      out.push({ k: 'chords', text: line.trim() }); continue;
    }
    const segs = [], re = /\[([^\]]+)\]/g; let last = 0, ch = '', m;
    while ((m = re.exec(line))) { if (m.index > last || ch) segs.push({ ch, ly: line.slice(last, m.index) }); ch = m[1].trim(); last = re.lastIndex; }
    segs.push({ ch, ly: line.slice(last) });
    out.push({ k: 'line', segs: segs.filter(s => s.ch || s.ly) });
  }
  while (out.length && out[out.length - 1].k === 'gap') out.pop();
  // which language each part is in (Thai letters = Thai), and a number for every line (for karaoke timing)
  let part = [], parts = [part], li = 0;
  out.forEach(x => { if (x.k === 'sec' || x.k === 'gap') { part = [x]; parts.push(part); } else part.push(x); });
  parts.forEach(items => {
    const words = items.filter(x => x.k === 'line').map(x => x.segs.map(g => g.ly).join('')).join(' ');
    const lang = /[\u0E00-\u0E7F]/.test(words) ? 'th' : /[A-Za-z]/.test(words) ? 'en' : 'any';
    items.forEach(x => { x.lang = lang; });
  });
  out.forEach(x => { if (x.k === 'line' || x.k === 'chords') x.li = li++; });
  return out;
}
export const songLangs = (parsed) => new Set(parsed.map(x => x.lang).filter(l => l === 'th' || l === 'en'));
export const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const noteIdx = (n) => { const i = SHARPS.indexOf(n); return i >= 0 ? i : FLATS.indexOf(n); };
export const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);
export function shiftNote(n, by, flats) { const i = noteIdx(n); return i < 0 ? n : (flats ? FLATS : SHARPS)[(i + by + 120) % 12]; }
export function transposeChord(ch, by, flats) {
  if (!by) return ch;
  return ch.replace(/^([A-G][#b]?)/, (r) => shiftNote(r, by, flats)).replace(/\/([A-G][#b]?)/, (_, b) => '/' + shiftNote(b, by, flats));
}
export function keyAfter(key, by) {
  const m = /^([A-G][#b]?)(m?)$/.exec(String(key || '').trim()); if (!m) return key;
  const sharpName = shiftNote(m[1], by, false) + m[2], flatName = shiftNote(m[1], by, true) + m[2];
  return FLAT_KEYS.has(flatName) ? flatName : sharpName;
}
export function renderSong(parsed, { by = 0, flats = false, chords = true, lang = 'all' } = {}) {
  const tc = (c) => esc(transposeChord(c, by, flats));
  return parsed.map(x => {
    if (lang !== 'all' && x.lang !== 'any' && x.lang !== lang) return '';
    if (x.k === 'sec') return `<div class="sec">${esc(x.text)}</div>`;
    if (x.k === 'gap') return '<div class="gap"></div>';
    if (x.k === 'chords') return chords ? `<div class="ln chords-only" data-li="${x.li}">${x.text.split(/(\s+)/).map(tok => CHORD_TOKEN.test(tok) ? `<b class="ch">${tc(tok.replace(/[()]/g, ''))}</b>` : tok.trim() ? `<span class="sep">${esc(tok)}</span>` : ' ').join('')}</div>` : '';
    const has = chords && x.segs.some(s => s.ch);
    if (!has) return `<div class="ln plain" data-li="${x.li}">${esc(x.segs.map(s => s.ly).join(''))}</div>`;
    return `<div class="ln" data-li="${x.li}">${x.segs.map(s => `<span class="sg"><b class="ch">${s.ch ? tc(s.ch) : ''}</b><span class="ly">${esc(s.ly) || '&nbsp;'}</span></span>`).join('')}</div>`;
  }).join('');
}
// Text copied from a Word / Google Docs song sheet: the chord line sits over the words using spaces in a
// proportional font. Measure both lines in that kind of font and put each chord in [brackets] right before
// the letter it sits over, so it stays in place on every screen.
export const measureCtx = document.createElement('canvas').getContext('2d');
export const SHEET_FONT = '16px Tahoma, "Leelawadee UI", "Noto Sans Thai", sans-serif';
export function chordsIntoWords(text) {
  measureCtx.font = SHEET_FONT;
  const TAB = 36;                                               // a Word tab stop (half an inch) at this size
  const w = (str) => { let x = 0; str.split('\t').forEach((part, j) => { if (j) x = (Math.floor(x / TAB) + 1) * TAB; x += measureCtx.measureText(part).width; }); return x; };
  const lines = String(text || '').replace(/\r/g, '').replace(/\u00a0/g, ' ').split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], next = lines[i + 1];
    const isLyric = (l) => l != null && l.trim() && !isChordLine(l) && !/^\s*#/.test(l) && !/\[[^\]]+\]/.test(l);
    if (!/\[[^\]]+\]/.test(line) && isChordLine(line) && isLyric(next)) {
      const marks = [], re = /\S+/g; let m;
      while ((m = re.exec(line))) if (CHORD_TOKEN.test(m[0])) marks.push({ x: w(line.slice(0, m.index)), ch: m[0].replace(/[()]/g, '') });
      const lyric = next, at = [];
      marks.forEach(({ x }) => {
        let best = 0, bestD = Infinity;
        for (let k = 0; k <= lyric.length; k++) { const d = Math.abs(w(lyric.slice(0, k)) - x); if (d < bestD) { bestD = d; best = k; } }
        while (best < lyric.length && ZERO_W.test(lyric[best])) best++;         // never split a letter from its vowel/tone mark
        at.push(best);
      });
      let res = lyric;
      for (let j = marks.length - 1; j >= 0; j--) {
        const pos = Math.max(at[j], j < marks.length - 1 ? 0 : 0);
        if (pos >= res.length) res = res.replace(/\s*$/, '') + ' [' + marks[j].ch + ']';
        else res = res.slice(0, pos) + '[' + marks[j].ch + ']' + res.slice(pos);
      }
      out.push(res.replace(/\t/g, ' ').trim()); i++; continue;
    }
    out.push(/^\s*#/.test(line) || isChordLine(line) ? line.trim() : line.replace(/\t/g, ' ').trim());
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
// A whole song sheet pasted at once -> one piece of text per song, found by the song titles
export function splitSheet(text, songs) {
  const norm = (x) => String(x || '').replace(/[์\s'’".,!]/g, '').toLowerCase();
  const byTitle = new Map(songs.map(x => [norm(x.title), x]));
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const found = new Map(), preamble = new Set();
  let cur = null, justTitled = false;
  for (const line of lines) {
    const n = norm(line);
    const hit = n && byTitle.get(n);
    if (hit) { cur = hit; found.set(hit.id, []); justTitled = true; continue; }
    if (!cur) { if (n) preamble.add(n); continue; }
    if (n && preamble.has(n)) continue;                                     // page header repeated on every page
    if (justTitled && n && (n === norm(cur.subtitle) || n === norm(cur.title))) continue;   // second title line ("Joy to the world")
    if (n) justTitled = false;
    found.get(cur.id).push(line);
  }
  return [...found.entries()].map(([id, ls]) => ({ song: songs.find(x => x.id === id), content: chordsIntoWords(ls.join('\n')) }))
    .filter(x => x.content.trim());
}
export const ytId = (u) => { const m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/.exec(u || '') || /^([\w-]{11})$/.exec(String(u || '').trim()); return m ? m[1] : ''; };
