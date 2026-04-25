/**
 * SecretWord — canonical secret-word detection with audio feedback.
 * Extracted from Script.js / Human.js where it was duplicated.
 * Exposes: window.SecretWord
 *   .init({ isBlocked })  — attach keydown listener (call once per page)
 *   .showMindEntry(fromClick)
 */
(function () {
  'use strict';

  const SECRET = 'complicatedbuteasy';

  let _audioCtx  = null;
  let _droneOscs = null;
  let _droneGain = null;
  let _idx       = 0;

  // ── AudioContext (lazy) ───────────────────────────────────
  function _ac() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  // ── Click tone ────────────────────────────────────────────
  function _playClick(progress) {
    try {
      const ac     = _ac();
      const isLast = progress === 1;
      const len    = Math.floor(ac.sampleRate * (isLast ? 0.068 : 0.052));
      const decay  = isLast ? 7 : 9;
      const buf    = ac.createBuffer(1, len, ac.sampleRate);
      const d      = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      const src = ac.createBufferSource(); src.buffer = buf;
      const bp  = ac.createBiquadFilter();
      bp.type            = 'bandpass';
      bp.frequency.value = 600 + progress * 1000;
      bp.Q.value         = 0.5 + progress * 1.0;
      const g = ac.createGain();
      g.gain.value = 0.06 + progress * 0.16;
      src.connect(bp); bp.connect(g); g.connect(ac.destination);
      src.start(ac.currentTime + 0.022 + Math.random() * 0.042);
    } catch (e) {}
  }

  // ── Miss tone ─────────────────────────────────────────────
  function _playMiss() {
    try {
      const ac  = _ac();
      const len = Math.floor(ac.sampleRate * 0.025);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * 0.14;
      }
      const src = ac.createBufferSource(); src.buffer = buf;
      const lp  = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
      const g   = ac.createGain(); g.gain.value = 0.032;
      src.connect(lp); lp.connect(g); g.connect(ac.destination);
      src.start(ac.currentTime + 0.022 + Math.random() * 0.042);
    } catch (e) {}
  }

  // ── Drone ─────────────────────────────────────────────────
  function _startDrone() {
    if (_droneOscs) return;
    try {
      const ac  = _ac();
      _droneGain = ac.createGain();
      _droneGain.gain.setValueAtTime(0, ac.currentTime);
      _droneGain.connect(ac.destination);
      _droneOscs = [55, 55.6, 82.5].map((freq, i) => {
        const o  = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
        const og = ac.createGain(); og.gain.value = i === 0 ? 1 : 0.4;
        o.connect(og); og.connect(_droneGain); o.start(); return o;
      });
    } catch (e) {}
  }

  function _setDroneVol(progress) {
    if (!_droneGain) return;
    const shifted = Math.max(0, progress - (4 / SECRET.length));
    const vol = Math.pow(shifted * (SECRET.length / (SECRET.length - 4)), 1.7) * 0.042;
    try {
      const now = _ac().currentTime;
      _droneGain.gain.cancelScheduledValues(now);
      _droneGain.gain.setValueAtTime(_droneGain.gain.value, now);
      _droneGain.gain.setTargetAtTime(vol, now, 0.7);
    } catch (e) {}
  }

  function _stopDrone() {
    if (!_droneGain) return;
    try {
      const now = _ac().currentTime;
      _droneGain.gain.cancelScheduledValues(now);
      _droneGain.gain.setValueAtTime(_droneGain.gain.value, now);
      _droneGain.gain.setTargetAtTime(0, now, 0.35);
    } catch (e) {}
    setTimeout(() => {
      if (_droneOscs) _droneOscs.forEach(o => { try { o.stop(); } catch (e) {} });
      _droneOscs = null; _droneGain = null;
    }, 2400);
  }

  // ── Success chord ─────────────────────────────────────────
  function _playSuccess() {
    try {
      const ac = _ac();
      [[110, 0, 0.060], [138.59, 0.22, 0.050], [164.81, 0.48, 0.040], [220, 0.78, 0.032]]
        .forEach(([freq, t, vol]) => {
          const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
          const g = ac.createGain();
          g.gain.setValueAtTime(0, ac.currentTime + t);
          g.gain.linearRampToValueAtTime(vol, ac.currentTime + t + 1.4);
          g.gain.linearRampToValueAtTime(0,   ac.currentTime + t + 6);
          o.connect(g); g.connect(ac.destination);
          o.start(ac.currentTime + t);
          o.stop(ac.currentTime + t + 6);
        });
    } catch (e) {}
  }

  // ── Mind entry overlay ────────────────────────────────────
  function showMindEntry(fromClick) {
    const fadeDur  = fromClick ? '2.4s' : '1.6s';
    const line2Del = fromClick ? 1600 : 1200;
    const navDel   = fromClick ? 4800 : 3800;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:#080808;z-index:9999;cursor:default;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;
      opacity:0;transition:opacity ${fadeDur} ease;
    `;

    const line1 = document.createElement('p');
    line1.style.cssText = [
      "font-family:'Cormorant Garamond',serif", 'font-style:italic',
      'font-size:clamp(16px,2.2vw,30px)', 'color:rgba(212,207,201,0)',
      'letter-spacing:2px', 'text-align:center', 'max-width:480px',
      'line-height:1.5', 'transition:color 1.2s ease 0.8s',
    ].join(';');
    line1.textContent = 'you didn\u2019t just find something\u2026 you reached a part of me I usually don\u2019t let anyone see.';

    const line2 = document.createElement('p');
    line2.style.cssText = [
      "font-family:'Cormorant Garamond',serif", 'font-style:italic',
      'font-size:clamp(11px,1.2vw,16px)', 'color:rgba(212,207,201,0)',
      'letter-spacing:3px', 'text-align:center', 'transition:color 1.2s ease',
    ].join(';');
    line2.textContent = 'entering.';

    overlay.append(line1, line2);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => { line1.style.color = 'rgba(212,207,201,0.55)'; }, 100);
      setTimeout(() => { line2.style.color = 'rgba(212,207,201,0.22)'; }, line2Del);
      setTimeout(() => { window.location.href = 'mind.html'; }, navDel);
    }));
  }

  // ── Init: attach single keydown listener ──────────────────
  let _attached = false;
  function init(options) {
    if (_attached) return;
    _attached = true;
    const { isBlocked } = options || {};

    document.addEventListener('keydown', e => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isBlocked && isBlocked()) return;
      const ch = e.key.toLowerCase();

      if (ch === SECRET[_idx]) {
        _idx++;
        const progress = _idx / SECRET.length;
        _playClick(progress);
        if (_idx >= 4) { _startDrone(); _setDroneVol(progress); }

        if (_idx >= SECRET.length) {
          _idx = 0;
          _stopDrone();
          setTimeout(() => {
            _playSuccess();
            setTimeout(() => showMindEntry(false), 1400);
          }, 400);
        }
      } else {
        if (_idx > 1) { _playMiss(); _setDroneVol(0); }
        _idx = 0;
      }
    });
  }

  window.SecretWord = Object.freeze({ init, showMindEntry });
})();
