// Metronome for the song player: sample-accurate clicks (Web Audio look-ahead scheduler),
// accented first beat, and a callback on every beat for the on-screen beat dots.
import { lowerBound } from './videosync.js?v=21';
let ctx = null, out = null, timer = 0, nextTime = 0, beat = 0;
const state = { running: false, bpm: 100, beats: 4, onBeat: null };
let fol = null, folTimer = 0;     // "follow the video" mode

function click(t, accent) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = accent ? 1760 : 1175;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.08);
  // a tiny "wood" knock under the tone
  const len = Math.floor(ctx.sampleRate * 0.02), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
  f.type = 'bandpass'; f.frequency.value = accent ? 2600 : 2000; ng.gain.value = accent ? 0.5 : 0.3;
  n.buffer = buf; n.connect(f).connect(ng).connect(out); n.start(t);
}

function schedule() {
  const spb = 60 / state.bpm;
  while (nextTime < ctx.currentTime + 0.12) {
    const b = beat % state.beats, t = nextTime;
    click(t, b === 0);
    const delay = Math.max(0, (t - ctx.currentTime) * 1000);
    setTimeout(() => { if (state.running) state.onBeat?.(b); }, delay);
    nextTime += spb; beat++;
  }
}

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.7; out.connect(ctx.destination);
  }
  ctx.resume();
  return true;
}
// follow mode: clicks and beat dots land on the beat times saved for the video
function followTick() {
  const f = fol; if (!f) return;
  if (!f.clock.playing) { f.idx = -1; return; }
  const v = f.clock.now(), rate = f.clock.rate || 1;
  if (f.idx < 0 || v < f.lastV - 0.05 || v > f.lastV + 0.6) f.idx = lowerBound(f.beats, v - f.offset - 0.01);
  f.lastV = v;
  while (f.idx < f.beats.length) {
    const i = f.idx, dv = f.beats[i] + f.offset - v;
    if (dv > 0.12 * rate) break;
    f.idx++;
    if (dv < -0.03) continue;
    const wait = Math.max(0, dv / rate);
    if (f.sound && ctx) click(ctx.currentTime + wait, i % f.perBar === 0);
    setTimeout(() => { if (fol === f && f.clock.playing) f.onBeat?.(i % f.perBar); }, wait * 1000);
  }
}

export const metro = {
  get running() { return state.running; },
  get following() { return !!fol; },
  set onBeat(fn) { state.onBeat = fn; },
  follow({ clock, beats, perBar = 4, offset = 0, sound = false, onBeat = null }) {
    this.stop(); ensure();
    fol = { clock, beats, perBar, offset, sound, onBeat, idx: -1, lastV: 0 };
    folTimer = setInterval(followTick, 20);
  },
  setSound(on) { if (fol) { fol.sound = on; if (on) ensure(); } },
  setOffset(sec) { if (fol) { fol.offset = sec; fol.idx = -1; } },
  start(bpm, beats = 4) {
    if (fol) this.stop();
    if (!ensure()) return false;
    state.bpm = Math.max(20, Math.min(300, bpm)); state.beats = beats || 4;
    beat = 0; nextTime = ctx.currentTime + 0.08; state.running = true;
    clearInterval(timer); timer = setInterval(schedule, 25); schedule();
    return true;
  },
  // change tempo without restarting the bar
  setBpm(bpm) { state.bpm = Math.max(20, Math.min(300, bpm)); },
  stop() {
    state.running = false; clearInterval(timer); state.onBeat?.(-1);
    if (fol) { fol.onBeat?.(-1); fol = null; clearInterval(folTimer); }
  },
};
document.addEventListener('visibilitychange', () => { if (document.hidden && state.running) metro.stop(); });
