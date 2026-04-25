/**
 * Core — shared foundation for all pages.
 * Exposes: window.Core
 *   .log       — dev-only logger
 *   .events    — EventBus (on / off / emit)
 *   .state     — AppState (get / set)
 *   .raf       — single shared RAF loop (add / remove)
 *   .throttle  — throttle(fn, ms)
 *   .debounce  — debounce(fn, ms)
 *   .clamp     — clamp(v, min, max)
 *   .lerp      — lerp(a, b, t)
 *   .rand      — rand(min, max)
 *   .portal    — portal(url, color, x, y)
 *   .dom       — { qs, qsa, on }
 */
(function () {
  'use strict';

  const DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // ── Logger ────────────────────────────────────────────────
  const log = {
    info:  (...a) => DEV && console.info( '[Core]', ...a),
    warn:  (...a) => DEV && console.warn( '[Core]', ...a),
    error: (...a) =>        console.error('[Core]', ...a),
  };

  // ── EventBus ──────────────────────────────────────────────
  const _listeners = Object.create(null);
  const events = {
    on(event, fn) {
      (_listeners[event] = _listeners[event] || []).push(fn);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      if (!_listeners[event]) return;
      _listeners[event].forEach(fn => {
        try { fn(data); } catch (e) { log.error(`EventBus "${event}":`, e); }
      });
    },
  };

  // ── AppState ──────────────────────────────────────────────
  const _state = {
    page:          document.body.dataset.page || 'unknown',
    activeSection: null,
    matrixLevel:   1,
    lightboxOpen:  false,
    cookingOpen:   false,
  };
  const state = {
    get(key)        { return key ? _state[key] : { ..._state }; },
    set(key, value) {
      const prev = _state[key];
      _state[key] = value;
      if (prev !== value) events.emit('state:' + key, { prev, value });
    },
  };

  // ── Single shared RAF loop ────────────────────────────────
  // All animated systems register here — one rAF call per frame total.
  const _tasks = new Map();
  let _rafId = null;

  function _tick(ts) {
    _rafId = requestAnimationFrame(_tick);
    _tasks.forEach((fn, id) => {
      try { fn(ts); }
      catch (e) { log.error(`RAF task "${id}":`, e); _tasks.delete(id); }
    });
  }

  const raf = {
    add(id, fn)  { _tasks.set(id, fn); if (!_rafId) _rafId = requestAnimationFrame(_tick); },
    remove(id)   { _tasks.delete(id); if (_tasks.size === 0 && _rafId) { cancelAnimationFrame(_rafId); _rafId = null; } },
    has(id)      { return _tasks.has(id); },
  };

  // ── Perf helpers ──────────────────────────────────────────
  function throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last < ms) return;
      last = now;
      return fn.apply(this, args);
    };
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ── Math ──────────────────────────────────────────────────
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp  = (a, b, t)     => a + (b - a) * t;
  const rand  = (min, max)    => min + Math.random() * (max - min);

  // ── Portal transition ─────────────────────────────────────
  let _portalActive = false;
  function portal(url, color, x, y) {
    if (_portalActive) return;
    _portalActive = true;
    const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.6;
    const el   = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'border-radius:50%', 'pointer-events:none', 'z-index:9999',
      `width:${size}px`, `height:${size}px`,
      `left:${x}px`, `top:${y}px`,
      'transform:translate(-50%,-50%) scale(0)',
      `background:${color}`,
      'transition:transform 0.72s cubic-bezier(0.7,0,0.3,1)',
    ].join(';');
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%,-50%) scale(1)';
    }));
    setTimeout(() => { window.location.href = url; }, 720);
  }

  // ── Safe DOM helpers ──────────────────────────────────────
  const dom = {
    qs:  (sel, ctx = document) => ctx.querySelector(sel),
    qsa: (sel, ctx = document) => [...ctx.querySelectorAll(sel)],
    on(el, type, fn, opts) {
      if (!el) { log.warn(`dom.on: null element for "${type}"`); return () => {}; }
      el.addEventListener(type, fn, opts);
      return () => el.removeEventListener(type, fn, opts);
    },
  };

  // ── Export ────────────────────────────────────────────────
  window.Core = Object.freeze({
    log, events, state, raf,
    throttle, debounce, clamp, lerp, rand,
    portal, dom,
  });

  log.info('loaded');
})();
