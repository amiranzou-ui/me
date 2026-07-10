/**
 * Core — shared foundation for the world/atmosphere layer.
 * Ported near-verbatim from legacy/js/core.js. Kept as a plain module-level
 * singleton (not React state) since raf/events are meant to be genuinely
 * global — one shared rAF loop for the whole page, exactly like the original.
 */

const DEV = process.env.NODE_ENV !== "production";

export const log = {
  info: (...a: unknown[]) => DEV && console.info("[Core]", ...a),
  warn: (...a: unknown[]) => DEV && console.warn("[Core]", ...a),
  error: (...a: unknown[]) => console.error("[Core]", ...a),
};

// ── EventBus ──────────────────────────────────────────────
type Listener = (data?: unknown) => void;
const _listeners = new Map<string, Listener[]>();

export const events = {
  on(event: string, fn: Listener) {
    const list = _listeners.get(event) ?? [];
    list.push(fn);
    _listeners.set(event, list);
    return () => events.off(event, fn);
  },
  off(event: string, fn: Listener) {
    const list = _listeners.get(event);
    if (!list) return;
    _listeners.set(
      event,
      list.filter((f) => f !== fn),
    );
  },
  emit(event: string, data?: unknown) {
    const list = _listeners.get(event);
    if (!list) return;
    list.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        log.error(`EventBus "${event}":`, e);
      }
    });
  },
};

// ── Single shared RAF loop ────────────────────────────────
// All animated systems register here — one rAF call per frame total.
type RafTask = (ts: number) => void;
const _tasks = new Map<string, RafTask>();
let _rafId: number | null = null;

function _tick(ts: number) {
  _rafId = requestAnimationFrame(_tick);
  _tasks.forEach((fn, id) => {
    try {
      fn(ts);
    } catch (e) {
      log.error(`RAF task "${id}":`, e);
      _tasks.delete(id);
    }
  });
}

export const raf = {
  add(id: string, fn: RafTask) {
    _tasks.set(id, fn);
    if (_rafId === null) _rafId = requestAnimationFrame(_tick);
  },
  remove(id: string) {
    _tasks.delete(id);
    if (_tasks.size === 0 && _rafId !== null) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  },
  has(id: string) {
    return _tasks.has(id);
  },
};

// ── Math ──────────────────────────────────────────────────
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ── Portal transition ─────────────────────────────────────
// Exact technique from legacy/js/core.js: a fixed circular div, sized to
// always cover the viewport from any origin point, scaled from 0 to 1 over
// 720ms, then hard-navigates. Kept verbatim per ARCHITECTURE.md.
let _portalActive = false;
export function portal(url: string, color: string, x: number, y: number) {
  if (_portalActive) return;
  _portalActive = true;
  const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.6;
  const el = document.createElement("div");
  el.style.cssText = [
    "position:fixed",
    "border-radius:50%",
    "pointer-events:none",
    "z-index:9999",
    `width:${size}px`,
    `height:${size}px`,
    `left:${x}px`,
    `top:${y}px`,
    "transform:translate(-50%,-50%) scale(0)",
    `background:${color}`,
    "transition:transform 0.72s cubic-bezier(0.7,0,0.3,1)",
  ].join(";");
  document.body.appendChild(el);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.style.transform = "translate(-50%,-50%) scale(1)";
    }),
  );
  setTimeout(() => {
    window.location.href = url;
  }, 720);
}

// ── Safe DOM helpers ──────────────────────────────────────
export const dom = {
  qs<T extends Element = Element>(sel: string, ctx: ParentNode = document): T | null {
    return ctx.querySelector<T>(sel);
  },
  qsa<T extends Element = Element>(sel: string, ctx: ParentNode = document): T[] {
    return [...ctx.querySelectorAll<T>(sel)];
  },
};
