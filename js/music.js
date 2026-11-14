// Background music, synthesized live (no audio files):
// "Jingle Bells" (James Lord Pierpont, 1857 — public domain melody) with bells,
// and a majestic "Joy to the World" for the special tree mode.
const N = { G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25, C3: 130.81, F3: 174.61, G2: 98.0 };
const q = 1, h = 2, w = 4, e = 0.5, dq = 1.5, dh = 3;
// Verse ("Dashing through the snow ...") — 16 bars
const VERSE = [
  ['G3', q], ['E4', q], ['D4', q], ['C4', q], ['G3', dh], ['G3', e], ['G3', e],
  ['G3', q], ['E4', q], ['D4', q], ['C4', q], ['A3', w],
  ['A3', q], ['F4', q], ['E4', q], ['D4', q], ['B3', w],
  ['G4', q], ['G4', q], ['F4', q], ['D4', q], ['E4', w],
  ['G3', q], ['E4', q], ['D4', q], ['C4', q], ['G3', w],
  ['G3', q], ['E4', q], ['D4', q], ['C4', q], ['A3', dh], ['A3', q],
  ['A3', q], ['F4', q], ['E4', q], ['D4', q], ['G4', q], ['G4', q], ['G4', q], ['G4', q],
  ['A4', q], ['G4', q], ['F4', q], ['D4', q], ['C4', w],
];
// Chorus ("Jingle bells, jingle bells ...") — 16 bars
const CHORUS = [
  ['E4', q], ['E4', q], ['E4', h], ['E4', q], ['E4', q], ['E4', h],
  ['E4', q], ['G4', q], ['C4', dq], ['D4', e], ['E4', w],
  ['F4', q], ['F4', q], ['F4', dq], ['F4', e], ['F4', q], ['E4', q], ['E4', q], ['E4', e], ['E4', e],
  ['E4', q], ['D4', q], ['D4', q], ['E4', q], ['D4', h], ['G4', h],
  ['E4', q], ['E4', q], ['E4', h], ['E4', q], ['E4', q], ['E4', h],
  ['E4', q], ['G4', q], ['C4', dq], ['D4', e], ['E4', w],
  ['F4', q], ['F4', q], ['F4', dq], ['F4', e], ['F4', q], ['E4', q], ['E4', q], ['E4', e], ['E4', e],
  ['G4', q], ['G4', q], ['F4', q], ['D4', q], ['C4', w],
];
// Full song: verse, chorus, chorus — then it loops
const MELODY = [...VERSE, ...CHORUS, ...CHORUS];
const BASS_VERSE = ['C3', 'C3', 'C3', 'F3', 'F3', 'G2', 'G2', 'C3', 'C3', 'C3', 'C3', 'F3', 'F3', 'G2', 'G2', 'C3'];
const BASS_CHORUS = ['C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'G2', 'C3', 'C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'G2', 'C3'];
const BASS = [...BASS_VERSE, ...BASS_CHORUS, ...BASS_CHORUS];
const BPM = 150;

// ---------------------------------------------------------------------------------------------
// "Joy to the World" — tune ANTIOCH as harmonised by Lowell Mason (1839), public domain.
// The four voices are copied note for note from the hymnal score (key D, 2/4 time).
// Each note is pitch:length in beats (a quarter note = 1); "|" ends a bar; "~" ties into the next note.
const SATB = {
  s: 'D5:1 C#5:.75 B4:.25 | A4:1.5 G4:.5 | F#4:1 E4:1 | D4:1.5 A4:.5 | B4:1.5 B4:.5 | C#5:1.5 C#5:.5 | D5:1.5 D5:.5 | D5:.5 C#5:.5 B4:.5 A4:.5 | A4:.75 G4:.25 F#4:.5 D5:.5 | D5:.5 C#5:.5 B4:.5 A4:.5 | A4:.75 G4:.25 F#4:.5 F#4:.5 | F#4:.5 F#4:.5 F#4:.5 F#4:.25 G4:.25 | A4:1.5 G4:.25 F#4:.25 | E4:.5 E4:.5 E4:.5 E4:.25 F#4:.25 | G4:1.5 F#4:.25 E4:.25 | D4:.5 D5:1 B4:.5 | A4:.75 G4:.25 F#4:.5 G4:.5 | F#4:1 E4:1 | D4:2',
  a: 'F#4:1 A4:.75 G4:.25 | F#4:1.5 E4:.5 | D4:1 C#4:1 | D4:1.5 D4:.5 | G4:1.5 G4:.5 | E4:1.5 E4:.5 | F#4:1.5 F#4:.5 | F#4:.5 A4:.5 G4:.5 F#4:.5 | F#4:.75 E4:.25 D4:.5 F#4:.5 | F#4:.5 A4:.5 G4:.5 F#4:.5 | F#4:.75 E4:.25 D4:.5 D4:.5 | D4:.5 D4:.5 D4:.5 D4:.25 E4:.25 | F#4:1.5 E4:.25 D4:.25 | C#4:.5 C#4:.5 C#4:.5 C#4:.25 D4:.25 | E4:1.5 D4:.25 C#4:.25 | D4:.5 F#4:1 G4:.5 | F#4:.75 E4:.25 D4:.5 E4:.5 | D4:1 C#4:1 | D4:2',
  t: 'D4:1 D4:.75 D4:.25 | D4:1.5 B3:.5 | A3:1.5 G3:.5 | F#3:1.5 D4:.5 | D4:1.5 D4:.5 | A3:1.5 A3:.5 | A3:1.5 A3:.5 | A3:1 D4:1 | D4:1.5 A3:.5 | A3:1 D4:1 | D4:1.5 r:.5 | r:1.5 A3:.5 | A3:.5 A3:.5 A3:.5 A3:.5 | A3:2~ | A3:1.5 A3:.25 G3:.25 | F#3:.5 A3:1 D4:.5 | D4:1.5 B3:.5 | A3:1 A3:.5 G3:.5 | F#3:2',
  b: 'D3:1 D3:.75 D3:.25 | D3:1.5 G2:.5 | A2:1 A2:1 | D3:1.5 F#3:.5 | G3:1.5 G3:.5 | A3:1.5 A3:.5 | D3:1.5 D3:.5 | D3:1 D3:1 | D3:1.5 D3:.5 | D3:1 D3:1 | D3:1.5 r:.5 | r:1.5 D3:.5 | D3:.5 D3:.5 D3:.5 D3:.5 | A3:1.5 A2:.5 | A2:.5 A2:.5 A2:.5 A2:.5 | D3:1.5 D3:.5 | D3:1.5 G2:.5 | A2:1 A2:1 | D3:2',
};
const JOY_BPM = 92, VERSE_BEATS = 38;
const midi = (n) => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); return 12 * (Number(m[3]) + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const hz = (n) => 440 * 2 ** ((midi(n) - 69) / 12);
function readVoice(str) {               // -> [{ b: start beat, n: note, d: length }], ties joined, rests dropped
  const out = []; let b = 0, tie = null;
  str.split(/\s+/).filter(x => x && x !== '|').forEach(tok => {
    const [n, dRaw] = tok.split(':'), tied = dRaw.endsWith('~'), d = Number(dRaw.replace('~', ''));
    if (n !== 'r') {
      if (tie && tie.n === n) tie.d += d; else out.push(tie = { b, n, d });
      if (!tied) tie = null;
    }
    b += d;
  });
  return out;
}
const VOICES = Object.fromEntries(Object.entries(SATB).map(([k, v]) => [k, readVoice(v)]));
// 4 verses back to back (as sung), timpani on the strong beats, a long last chord, then it starts again
function buildJoy() {
  const ev = [];
  for (let v = 0; v < 4; v++) {
    const off = v * VERSE_BEATS, last = v === 3;
    Object.entries(VOICES).forEach(([k, notes]) => notes.forEach((x, i) => {
      const end = last && i === notes.length - 1;                 // hold the very last chord
      ev.push({ b: off + x.b, k, n: x.n, d: end ? 6 : x.d, v });
    }));
    // timpani (tuned to D and A) on bar 1 of each phrase; on every bar in the last verse
    VOICES.b.forEach(x => {
      if (x.b % 2 !== 0) return;
      const bar = x.b / 2, pc = x.n[0];
      if ((pc === 'D' || pc === 'A') && (last || [0, 3, 7, 11, 15, 18].includes(bar))) ev.push({ b: off + x.b, k: 'timp', n: pc === 'D' ? 'D2' : 'A2' });
    });
  }
  const endB = 3 * VERSE_BEATS + 36;
  ev.push({ b: endB, k: 'roll', dur: 5 });
  ev.sort((x, y) => x.b - y.b);
  return { ev, len: endB + 8 };
}
const JOY_TL = buildJoy();

let ctx = null, master = null, bus = null, rev = null, playing = false, timer = null, nextTime = 0, idx = 0, beatPos = 0;
let track = 'jingle', joyStart = 0, joyIdx = 0, held = false, resumeAfter = false;

function out(dry = 1, wet = 0) {   // a voice's output: dry to the bus, some to the reverb
  const g = ctx.createGain(); g.gain.value = dry; g.connect(bus);
  if (wet && rev) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(rev); }
  return g;
}
function makeReverb() {
  const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
  rev = ctx.createConvolver(); rev.buffer = ir;
  const g = ctx.createGain(); g.gain.value = 0.55; rev.connect(g).connect(master);
}

function bell(freq, t, dur, vol = 0.25, dest) {
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
  o1.type = 'sine'; o1.frequency.value = freq * 2;       // bright bell partial
  o2.type = 'triangle'; o2.frequency.value = freq * 2 * 2.01;
  const g2 = ctx.createGain(); g2.gain.value = 0.25;
  o1.connect(g); o2.connect(g2).connect(g); g.connect(dest || bus);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 1.2));
  o1.start(t); o2.start(t); o1.stop(t + dur * 1.3 + 0.4); o2.stop(t + dur * 1.3 + 0.4);
}
function bassNote(freq, t, dur, vol = 0.18) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  o.connect(g).connect(bus);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}
const noiseCache = {};
function noise(sec, pow) {             // short decaying noise, made once and reused
  const key = sec + ':' + pow;
  if (!noiseCache[key]) {
    const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** pow;
    noiseCache[key] = buf;
  }
  return noiseCache[key];
}
function sleighBell(t) {
  const buf = noise(0.08, 1);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = 0.06;
  s.buffer = buf; s.connect(f).connect(g).connect(bus); s.start(t);
}
// brass: two detuned saws through a filter that opens on each note
function brass(freq, t, dur, vol = 0.16, peak = 3200) {
  const f = ctx.createBiquadFilter(), g = ctx.createGain(), o = out(1, 0.35);
  f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(Math.min(500, peak), t); f.frequency.exponentialRampToValueAtTime(peak, t + 0.06); f.frequency.exponentialRampToValueAtTime(Math.max(400, peak * 0.5), t + 0.35);
  [-7, 7].forEach(c => { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = freq; s.detune.value = c; s.connect(f); s.start(t); s.stop(t + dur + 0.3); });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.05, dur - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
  f.connect(g).connect(o);
}
function timpani(freq, t, vol = 0.55) {
  const s = ctx.createOscillator(), g = ctx.createGain(), o = out(1, 0.4);
  s.type = 'sine'; s.frequency.setValueAtTime(freq * 1.5, t); s.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  s.connect(g).connect(o); s.start(t); s.stop(t + 1.4);
  const buf = noise(0.12, 2);
  const n = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), ng = ctx.createGain();
  lp.type = 'lowpass'; lp.frequency.value = 500; ng.gain.value = vol * 0.6;
  n.buffer = buf; n.connect(lp).connect(ng).connect(o); n.start(t);
}

function scheduleJingle() {
  const spb = 60 / BPM;
  while (nextTime < ctx.currentTime + 0.3) {
    const [note, beats] = MELODY[idx];
    bell(N[note], nextTime, beats * spb);
    // bass + sleigh bells on every beat boundary inside this note
    for (let b = Math.ceil(beatPos - 1e-6); b < beatPos + beats - 1e-6; b++) {
      const bt = nextTime + (b - beatPos) * spb;
      sleighBell(bt);
      if (b % 4 === 0) bassNote(N[BASS[(b / 4) % BASS.length]], bt, 4 * spb * 0.9);
    }
    nextTime += beats * spb; beatPos += beats;
    idx++;
    if (idx >= MELODY.length) { idx = 0; beatPos = 0; nextTime += spb * 2; } // short pause, then loop
  }
}
function scheduleJoy() {
  const spb = 60 / JOY_BPM, ev = JOY_TL.ev;
  while (true) {
    if (joyIdx >= ev.length) { joyStart += JOY_TL.len * spb; joyIdx = 0; }
    const e = ev[joyIdx], t = joyStart + e.b * spb;
    if (t > ctx.currentTime + 0.3) break;
    joyIdx++;
    if (t < ctx.currentTime - 0.02) continue;
    const d = (e.d || 0) * spb;
    if (e.k === 's') {                                            // melody: trumpets
      brass(hz(e.n), t, d, e.v === 3 ? 0.18 : 0.15, 3400);
      if (e.v === 3) brass(hz(e.n) / 2, t, d, 0.07, 2400);        // last verse: doubled an octave below
      if (e.v === 1 || e.v === 3) bell(hz(e.n), t, d, 0.06);      // verses 2 and 4: bells on top
    } else if (e.k === 'a' || e.k === 't') {                      // inner voices: warm horns
      brass(hz(e.n), t, d, e.v === 3 ? 0.06 : 0.05, 1500);
    } else if (e.k === 'b') {                                     // bass line
      bassNote(hz(e.n), t, Math.max(0.2, d * 0.95), e.v === 3 ? 0.26 : 0.22);
      brass(hz(e.n), t, d, 0.035, 700);
    } else if (e.k === 'timp') {
      timpani(hz(e.n), t);
    } else if (e.k === 'roll') {
      for (let x = 0; x < e.dur * 6; x++) timpani(hz('D2'), t + x * spb / 6, 0.12 + 0.35 * (x / (e.dur * 6)));
    }
  }
}
function schedule() { track === 'joy' ? scheduleJoy() : scheduleJingle(); }

function ensureCtx() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  bus = ctx.createGain(); bus.connect(master);
  makeReverb();
  return true;
}
function restart() {
  idx = 0; beatPos = 0; nextTime = ctx.currentTime + 0.06;
  joyIdx = 0; joyStart = ctx.currentTime + 0.06;
  clearInterval(timer); timer = setInterval(schedule, 100); schedule();
}

export const music = {
  get playing() { return playing; },
  get track() { return track; },
  start() {
    if (held) { resumeAfter = true; return; }        // the song player is open: stay quiet
    if (playing || !ensureCtx()) return;
    ctx.resume();
    playing = true; restart();
    localStorage.setItem('ya_music', 'on');
  },
  stop(remember = true) {
    playing = false; clearInterval(timer);
    if (ctx) ctx.suspend();
    if (remember) localStorage.setItem('ya_music', 'off');
  },
  toggle() { playing ? this.stop() : this.start(); return playing; },
  // switch between the normal song and the special one, with a short fade
  setTrack(name) {
    if (name === track) return;
    track = name;
    if (!ctx || !playing) return;
    const old = bus; old.gain.setTargetAtTime(0, ctx.currentTime, 0.12); setTimeout(() => old.disconnect(), 1500);
    bus = ctx.createGain(); bus.connect(master);
    restart();
  },
  // pause the background music while the song player is open (does not change the kid's on/off choice)
  hold(on) {
    if (on === held) return;
    held = on;
    if (on) { resumeAfter = playing; if (playing) this.stop(false); }
    else if (resumeAfter) { resumeAfter = false; this.start(); }
  },
  // little "ding" when points pop
  ding() {
    if (!ctx || !playing) return;
    const t = ctx.currentTime;
    [N.C5, N.C5 * 1.26, N.C5 * 1.5].forEach((f, i) => bell(f / 2, t + i * 0.08, 0.4, 0.2));
  },
  // special mode: magic sparkle on every tap
  sfx() {
    if (!ctx || !playing) return;
    const t = ctx.currentTime;
    ['A5', 'D6', 'F#6', 'A6'].forEach((n, i) => bell(hz(n) / 2, t + i * 0.045, 0.25, 0.09, master));
    const buf = noise(0.35, 3);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = 0.05;
    s.buffer = buf; s.connect(f).connect(g).connect(master); s.start(t);
  },
  wantsMusic() { return localStorage.getItem('ya_music') !== 'off'; },
};
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else if (playing) ctx.resume();
});
