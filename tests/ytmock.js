// test double for the YouTube IFrame API: a "video" whose clock runs on performance.now
(function () {
  function Player(el, opts) {
    const host = typeof el === 'string' ? document.getElementById(el) : el;
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;inset:0;background:#123;color:#fff;display:grid;place-items:center;font:20px sans-serif';
    box.textContent = '▶ mock video'; host.replaceWith(box); box.id = 'mockVideo';
    this._t = (opts.playerVars && opts.playerVars.start) || 0; this._p = performance.now(); this._st = 5; this._rate = 1;
    window.__yt = this;
    setTimeout(() => { opts.events && opts.events.onReady && opts.events.onReady({ target: this }); if (opts.playerVars && opts.playerVars.autoplay) this.playVideo(); }, 300);
    this._onState = opts.events && opts.events.onStateChange;
  }
  Player.prototype._now = function () { return this._st === 1 ? this._t + (performance.now() - this._p) / 1000 * this._rate : this._t; };
  Player.prototype.getCurrentTime = function () { return Math.floor(this._now() * 4) / 4; };   // coarse, like the real API
  Player.prototype.getPlayerState = function () { return this._st; };
  Player.prototype.getPlaybackRate = function () { return this._rate; };
  Player.prototype.setPlaybackRate = function (r) { this._t = this._now(); this._p = performance.now(); this._rate = r; };
  Player.prototype.playVideo = function () { this._t = this._now(); this._p = performance.now(); this._st = 1; this._onState && this._onState({ data: 1 }); };
  Player.prototype.pauseVideo = function () { this._t = this._now(); this._st = 2; this._onState && this._onState({ data: 2 }); };
  Player.prototype.seekTo = function (s) { this._t = s; this._p = performance.now(); };
  Player.prototype.destroy = function () {};
  Player.prototype.getDuration = function () { return 60; };
  window.YT = { Player };
  setTimeout(() => window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(), 50);
})();
