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
// "Joy to the World" (tune ANTIOCH, arr. Lowell Mason 1839 — public domain), majestic version:
// brass melody, organ pad, bass, timpani, bells and a hall reverb. Plays all four verses, then loops.
const midi = (n) => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); return 12 * (Number(m[3]) + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const hz = (n) => 440 * 2 ** ((midi(n) - 69) / 12);
const CH = { D: ['D3', 'F#3', 'A3', 'D4'], G: ['G2', 'B3', 'D4', 'G3'], A: ['A2', 'C#4', 'E3', 'A3'], A7: ['A2', 'C#4', 'G3', 'E4'], Bm: ['B2', 'D4', 'F#3', 'B3'], Em: ['E3', 'G3', 'B3', 'E4'] };
// [note, beats, chord-change]
const JOY = [
  ['D5', 1, 'D'], ['C#5', .75], ['B4', .25, 'G'], ['A4', 1.5, 'D'], ['G4', .5, 'G'], ['F#4', 1, 'D'], ['E4', 1, 'A'], ['D4', 1.5, 'D'],
  ['A4', .5, 'A'], ['B4', 1.5, 'G'], ['B4', .5], ['C#5', 1.5, 'A'], ['C#5', .5], ['D5', 1.5, 'D'],
  ['D5', .5], ['D5', .5], ['C#5', .5, 'A'], ['B4', .5, 'G'], ['A4', .75, 'D'], ['G4', .25], ['F#4', 1],
  ['F#4', .5], ['F#4', .5], ['F#4', .5], ['F#4', .5], ['F#4', .75], ['G4', .25], ['A4', 1.5],
  ['G4', .5, 'A7'], ['F#4', .5], ['E4', .5], ['E4', .5], ['E4', .75], ['F#4', .25], ['G4', 1.5],
  ['F#4', .5, 'D'], ['D5', 1], ['B4', .5, 'G'], ['A4', .75, 'D'], ['G4', .25], ['F#4', .5], ['G4', .5, 'G'], ['F#4', 1, 'D'], ['E4', 1, 'A7'], ['D4', 2, 'D'],
];
const JOY_BPM = 88;
// whole piece as a timeline (in beats): intro, 4 verses, big ending
function buildJoy() {
  const ev = []; let b = 0;
  ev.push({ b: 0, k: 'chord', ch: 'D', dur: 4, v: 0 }, { b: 0, k: 'roll', dur: 3.5 }, { b: 0, k: 'bass', n: 'D2', dur: 4 });
  b = 4;
  for (let v = 0; v < 4; v++) {
    const vStart = b; let chord = 'D', chordAt = b;
    const flush = (until) => { if (until > chordAt) ev.push({ b: chordAt, k: 'chord', ch: chord, dur: until - chordAt, v }); };
    JOY.forEach(([n, d, c], i) => {
      if (c && c !== chord) { flush(b); chord = c; chordAt = b; }
      if (c && (i === 0 || v === 3)) ev.push({ b, k: 'timp', n: CH[c][0] });
      ev.push({ b, k: 'lead', n, dur: d, v });
      b += d;
    });
    flush(b);
    b += 0.5;                                                  // breath between verses
    for (let x = Math.ceil(vStart); x < b; x += 1) ev.push({ b: x, k: 'pulse' });
  }
  ev.push({ b, k: 'chord', ch: 'D', dur: 6, v: 4 }, { b, k: 'roll', dur: 5 }, { b, k: 'lead', n: 'D5', dur: 5, v: 4 }, { b, k: 'bass', n: 'D2', dur: 6 });
  b += 8;
  ev.sort((x, y) => x.b - y.b);
  return { ev, len: b };
}
const JOY_TL = buildJoy();

let ctx = null, master = null, bus = null, rev = null, playing = false, timer = null, nextTime = 0, idx = 0, beatPos = 0;
let track = 'jingle', joyStart = 0, joyIdx = 0, joyChord = 'D', held = false, resumeAfter = false;

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
function sleighBell(t) {
  const len = 0.08, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = 0.06;
  s.buffer = buf; s.connect(f).connect(g).connect(bus); s.start(t);
}
// brass: two detuned saws through a filter that opens on each note
function brass(freq, t, dur, vol = 0.16) {
  const f = ctx.createBiquadFilter(), g = ctx.createGain(), o = out(1, 0.35);
  f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.07); f.frequency.exponentialRampToValueAtTime(1500, t + 0.35);
  [-7, 7].forEach(c => { const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = freq; s.detune.value = c; s.connect(f); s.start(t); s.stop(t + dur + 0.3); });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.05, dur - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
  f.connect(g).connect(o);
}
// organ / strings pad for the chord
function pad(notes, t, dur, vol = 0.05) {
  const o = out(1, 0.5);
  notes.forEach(n => {
    [1, 2].forEach((m, i) => {
      const s = ctx.createOscillator(), g = ctx.createGain(); s.type = i ? 'sine' : 'triangle'; s.frequency.value = hz(n) * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol / (i + 1), t + 0.18);
      g.gain.setValueAtTime(vol / (i + 1), t + Math.max(0.2, dur - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
      s.connect(g).connect(o); s.start(t); s.stop(t + dur + 0.6);
    });
  });
}
function timpani(freq, t, vol = 0.55) {
  const s = ctx.createOscillator(), g = ctx.createGain(), o = out(1, 0.4);
  s.type = 'sine'; s.frequency.setValueAtTime(freq * 1.5, t); s.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  s.connect(g).connect(o); s.start(t); s.stop(t + 1.4);
  const len = Math.floor(ctx.sampleRate * 0.12), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
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
    if (t < ctx.currentTime - 0.05) continue;
    const big = e.v === 3 || e.v === 4;
    if (e.k === 'lead') {
      brass(hz(e.n), t, e.dur * spb, big ? 0.19 : 0.15);
      if (big) brass(hz(e.n) / 2, t, e.dur * spb, 0.09);                      // last verse: octave below
      if (e.v === 1 || e.v === 3) bell(hz(e.n), t, e.dur * spb, 0.08);         // verses 2 and 4: bells on top
    } else if (e.k === 'chord') {
      joyChord = e.ch; pad(CH[e.ch], t, e.dur * spb, big ? 0.06 : 0.045);
    } else if (e.k === 'pulse') {
      bassNote(hz(CH[joyChord][0]) / (CH[joyChord][0].endsWith('2') ? 1 : 2), t, spb * 0.9, 0.22);
    } else if (e.k === 'bass') {
      bassNote(hz(e.n), t, e.dur * spb, 0.25);
    } else if (e.k === 'timp') {
      timpani(hz(e.n.replace(/\d/, '2')), t);
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
  idx = 0; beatPos = 0; nextTime = ctx.currentTime + 0.15;
  joyIdx = 0; joyStart = ctx.currentTime + 0.15; joyChord = 'D';
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
    const len = Math.floor(ctx.sampleRate * 0.35), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
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
