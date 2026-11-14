// Keeping the app in time with a YouTube video.
// The YouTube player only reports its position every so often, so we keep our own smooth clock
// and nudge it gently towards each report (and jump straight to it after a seek).
export function videoClock(yt) {
  let anchorV = 0, anchorP = performance.now(), rate = 1, playing = false, lastRaw = null;
  const poll = () => {
    let st, raw;
    try { st = yt.getPlayerState(); raw = Number(yt.getCurrentTime()) || 0; rate = Number(yt.getPlaybackRate()) || 1; } catch { return; }
    const now = performance.now(), was = playing;
    playing = st === 1;
    if (!playing || !was) { anchorV = raw; anchorP = now; lastRaw = raw; return; }
    if (raw !== lastRaw) {
      lastRaw = raw;
      const est = anchorV + (now - anchorP) / 1000 * rate, err = raw - est;
      if (Math.abs(err) > 0.35) { anchorV = raw; anchorP = now; }        // jumped (seek) or stalled
      else { anchorV = est + err * 0.15; anchorP = now; }
    }
  };
  const timer = setInterval(poll, 30); poll();
  return {
    get playing() { return playing; },
    get rate() { return rate; },
    now() { return playing ? anchorV + (performance.now() - anchorP) / 1000 * rate : anchorV; },
    stop() { clearInterval(timer); },
  };
}

// Taps from the tap-along -> clean beat times: fills in a missed tap, ignores double taps,
// and evens out the small wobble of a human finger while still following the singers' tempo.
export function cleanBeats(taps) {
  const t = [...taps].sort((a, b) => a - b);
  if (t.length < 4) return t;
  const iv = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b), med = iv[iv.length >> 1];
  const filled = [t[0]];
  for (let i = 1; i < t.length; i++) {
    const prev = filled[filled.length - 1], gap = t[i] - prev;
    if (gap < med * 0.5) continue;                                // double tap
    const n = Math.max(1, Math.round(gap / med));
    for (let k = 1; k < n; k++) filled.push(prev + gap * k / n);  // missed tap(s)
    filled.push(t[i]);
  }
  return filled.map((_, i) => {                                   // straight-line fit over the nearest beats
    const a = Math.max(0, i - 4), b = Math.min(filled.length - 1, i + 4), n = b - a + 1;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let j = a; j <= b; j++) { sx += j; sy += filled[j]; sxx += j * j; sxy += j * filled[j]; }
    const den = n * sxx - sx * sx, slope = den ? (n * sxy - sx * sy) / den : 0;
    return Math.round(((sy - slope * sx) / n + slope * i) * 1000) / 1000;
  });
}
export const bpmOf = (beats) => {
  if (beats.length < 2) return 0;
  const iv = beats.slice(1).map((x, i) => x - beats[i]).sort((a, b) => a - b);
  return Math.round(60 / iv[iv.length >> 1]);
};
// short fingerprint of the lyrics, so line timings are only used for the words they were made for
export function hashText(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
// index of the first item in a sorted list that is >= x
export function lowerBound(arr, x, key = (v) => v) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; key(arr[m]) < x ? lo = m + 1 : hi = m; }
  return lo;
}
