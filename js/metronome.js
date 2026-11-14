// Metronome for the song player: sample-accurate clicks (Web Audio look-ahead scheduler),
// accented first beat, and a callback on every beat for the on-screen beat dots.
let ctx = null, out = null, timer = 0, nextTime = 0, beat = 0;
const state = { running: false, bpm: 100, beats: 4, onBeat: null };

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

export const metro = {
  get running() { return state.running; },
  set onBeat(fn) { state.onBeat = fn; },
  start(bpm, beats = 4) {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.7; out.connect(ctx.destination);
    }
    ctx.resume();
    state.bpm = Math.max(20, Math.min(300, bpm)); state.beats = beats || 4;
    beat = 0; nextTime = ctx.currentTime + 0.08; state.running = true;
    clearInterval(timer); timer = setInterval(schedule, 25); schedule();
    return true;
  },
  // change tempo without restarting the bar
  setBpm(bpm) { state.bpm = Math.max(20, Math.min(300, bpm)); },
  stop() { state.running = false; clearInterval(timer); state.onBeat?.(-1); },
};
document.addEventListener('visibilitychange', () => { if (document.hidden && state.running) metro.stop(); });
