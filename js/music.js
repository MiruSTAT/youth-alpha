// "Jingle Bells" (James Lord Pierpont, 1857 — public domain melody),
// played with a synthesized bell sound. No audio files needed.
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

let ctx = null, master = null, playing = false, timer = null, nextTime = 0, idx = 0, beatPos = 0;

function bell(freq, t, dur, vol = 0.25) {
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
  o1.type = 'sine'; o1.frequency.value = freq * 2;       // bright bell partial
  o2.type = 'triangle'; o2.frequency.value = freq * 2 * 2.01;
  const g2 = ctx.createGain(); g2.gain.value = 0.25;
  o1.connect(g); o2.connect(g2).connect(g); g.connect(master);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 1.2));
  o1.start(t); o2.start(t); o1.stop(t + dur * 1.3 + 0.4); o2.stop(t + dur * 1.3 + 0.4);
}
function bassNote(freq, t, dur) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  o.connect(g).connect(master);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}
function sleighBell(t) {
  const len = 0.08, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = 0.06;
  s.buffer = buf; s.connect(f).connect(g).connect(master); s.start(t);
}

function schedule() {
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

export const music = {
  get playing() { return playing; },
  start() {
    if (playing) return;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    }
    ctx.resume();
    playing = true; idx = 0; beatPos = 0; nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 100); schedule();
    localStorage.setItem('ya_music', 'on');
  },
  stop() {
    playing = false; clearInterval(timer);
    if (ctx) ctx.suspend();
    localStorage.setItem('ya_music', 'off');
  },
  toggle() { playing ? this.stop() : this.start(); return playing; },
  // little "ding" when points pop
  ding() {
    if (!ctx || !playing) return;
    const t = ctx.currentTime;
    [N.C5, N.C5 * 1.26, N.C5 * 1.5].forEach((f, i) => bell(f / 2, t + i * 0.08, 0.4, 0.2));
  },
  wantsMusic() { return localStorage.getItem('ya_music') !== 'off'; },
};
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else if (playing) ctx.resume();
});
