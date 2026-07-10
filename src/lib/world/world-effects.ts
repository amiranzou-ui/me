/**
 * World Effects — the "living world" atmosphere layer for the landing page.
 * Ported near-verbatim from legacy/js/world.js per ARCHITECTURE.md: same
 * DOM ids/classes, same easing/physics constants, same single shared rAF
 * loop from ./core. Returns a cleanup function so a React client component
 * can call this in useEffect and tear it down on unmount.
 *
 * Not yet ported from the original: the GSAP-driven cinematic entry
 * sequence (systems 1) — GSAP isn't part of the new stack. The equivalent
 * opacity choreography should be rebuilt with Framer Motion as a follow-up;
 * for now entry is treated as already-complete (matches the original's own
 * no-GSAP fallback behavior).
 */
import { raf, lerp, clamp, dom } from "./core";

export function initWorldEffects(): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasPointer = !window.matchMedia("(pointer: coarse)").matches;

  const cleanups: Array<() => void> = [];
  const addCleanup = (fn: () => void) => cleanups.push(fn);

  // ── DOM refs ──────────────────────────────────────────────
  const container = dom.qs<HTMLElement>("#container");
  const leftSide = dom.qs<HTMLElement>("#left");
  const rightSide = dom.qs<HTMLElement>("#right");
  const leftInner = dom.qs<HTMLElement>("#left .side-inner");
  const rightInner = dom.qs<HTMLElement>("#right .side-inner");
  const dividerEl = dom.qs<HTMLElement>("#divider-el");
  const divCanvas = dom.qs<HTMLCanvasElement>("#divider-canvas");
  const aura = dom.qs<HTMLElement>("#cursor-aura");
  const distortEl = dom.qs<HTMLElement>("#cursor-distort");
  const dustCanvas = dom.qs<HTMLCanvasElement>("#dust-canvas");
  const pnNode = dom.qs<HTMLElement>("#pn-toggle");
  const pnWrap = pnNode ? dom.qs<HTMLElement>(".pn-wrap", pnNode) : null;
  const pnImg = pnNode ? dom.qs<HTMLElement>(".pn-img", pnNode) : null;
  const ambA = dom.qs<HTMLElement>("#ambient-a");
  const ambB = dom.qs<HTMLElement>("#ambient-b");

  // ── Shared mutable state ─────────────────────────────────
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;

  let dBendT = 0,
    dBend = 0;
  let dGlowT = 0,
    dGlow = 0;
  let dShiftT = 0,
    dShift = 0;

  let magTX = 0,
    magTY = 0,
    magCX = 0,
    magCY = 0;
  let glowT = 0,
    glowC = 0;

  let imgX = 0,
    imgY = 0;
  let biasT = 0.5;

  let auraX = mx,
    auraY = my;
  let distX = mx,
    distY = my;

  let lastSide: "L" | "R" | null = null;

  // Cinematic entry isn't ported yet (no GSAP in this stack) — treat as done.
  const entryDone = true;

  // ═══════════════════════════════════════════════════
  // CURSOR TRACKING
  // ═══════════════════════════════════════════════════
  function onMove(e: MouseEvent) {
    const W = window.innerWidth;
    const divX = W / 2;

    // ── Magnetic ──
    if (pnNode) {
      const r = pnNode.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < PN_RADIUS) {
        const t = 1 - dist / PN_RADIUS;
        const l = dist > 0.1 ? dist : 0.1;
        magTX = (dx / l) * t * 9;
        magTY = (dy / l) * t * 3.5;
        glowT = t;
      } else {
        magTX = 0;
        magTY = 0;
        glowT = 0;
      }
    }

    // ── Divider ──
    const dDist = Math.abs(e.clientX - divX);
    const prox = clamp(1 - dDist / 290, 0, 1);
    const side = e.clientX < divX ? -1 : 1;
    dBendT = side * prox * 4.5;
    dGlowT = prox;
    dShiftT = side * prox * 2.2;

    // ── Crossing ──
    const curSide: "L" | "R" = e.clientX < divX ? "L" : "R";
    if (lastSide && lastSide !== curSide) spawnCrossing(e.clientX, e.clientY);
    lastSide = curSide;
  }

  if (hasPointer) {
    const handler = (e: Event) => {
      const me = e as MouseEvent;
      mx = me.clientX;
      my = me.clientY;
      onMove(me);
    };
    document.addEventListener("mousemove", handler, { passive: true });
    addCleanup(() => document.removeEventListener("mousemove", handler));
  }

  // ═══════════════════════════════════════════════════
  // 2. CURSOR AURA — large soft glow, world-bias size
  // ═══════════════════════════════════════════════════
  if (aura && hasPointer) {
    raf.add("aura", () => {
      auraX = lerp(auraX, mx, 0.062);
      auraY = lerp(auraY, my, 0.062);
      aura.style.left = auraX + "px";
      aura.style.top = auraY + "px";

      biasT = lerp(biasT, mx / window.innerWidth, 0.025);
      const sz = Math.round(lerp(480, 660, biasT));
      aura.style.width = sz + "px";
      aura.style.height = sz + "px";
    });
    addCleanup(() => raf.remove("aura"));
  }

  // ═══════════════════════════════════════════════════
  // 3. LIVING DIVIDER — canvas bezier curve
  // ═══════════════════════════════════════════════════
  if (divCanvas && dividerEl) {
    dividerEl.classList.add("canvas-active");

    const dCtx = divCanvas.getContext("2d")!;
    const DIV_W = 24;
    let dH = window.innerHeight;
    let scanPos = 0.1;
    const SCAN_LEN = 0.22;

    function resizeDiv() {
      dH = window.innerHeight;
      divCanvas!.width = DIV_W;
      divCanvas!.height = dH;
    }
    resizeDiv();
    window.addEventListener("resize", resizeDiv, { passive: true });
    addCleanup(() => window.removeEventListener("resize", resizeDiv));

    const onEnter = () => {
      divCanvas.style.opacity = "0.3";
    };
    const onLeave = () => {
      divCanvas.style.opacity = "1";
    };
    [leftSide, rightSide].forEach((s) => {
      s?.addEventListener("mouseenter", onEnter);
      s?.addEventListener("mouseleave", onLeave);
    });
    addCleanup(() => {
      [leftSide, rightSide].forEach((s) => {
        s?.removeEventListener("mouseenter", onEnter);
        s?.removeEventListener("mouseleave", onLeave);
      });
    });

    raf.add("divider", () => {
      dBend = lerp(dBend, dBendT, 0.07);
      dGlow = lerp(dGlow, dGlowT, 0.06);
      dShift = lerp(dShift, dShiftT, 0.06);

      divCanvas.style.left = `calc(50% + ${dShift.toFixed(2)}px)`;
      scanPos = (scanPos + 0.0014 + dGlow * 0.0008) % 1;

      dCtx.clearRect(0, 0, DIV_W, dH);
      const cx = DIV_W / 2;
      const cpx = cx + dBend * 0.7;

      const mg = dCtx.createLinearGradient(0, 0, 0, dH);
      mg.addColorStop(0, "rgba(212,201,180,0)");
      mg.addColorStop(0.14, `rgba(212,201,180,${(0.7 + dGlow * 0.3).toFixed(2)})`);
      mg.addColorStop(0.86, `rgba(212,201,180,${(0.7 + dGlow * 0.3).toFixed(2)})`);
      mg.addColorStop(1, "rgba(212,201,180,0)");
      dCtx.beginPath();
      dCtx.moveTo(cx, 0);
      dCtx.bezierCurveTo(cpx, dH * 0.33, cpx, dH * 0.67, cx, dH);
      dCtx.strokeStyle = mg;
      dCtx.lineWidth = 1;
      dCtx.stroke();

      if (dGlow > 0.04) {
        dCtx.beginPath();
        dCtx.moveTo(cx, dH * 0.14);
        dCtx.bezierCurveTo(cpx, dH * 0.33, cpx, dH * 0.67, cx, dH * 0.86);
        dCtx.strokeStyle = `rgba(196,98,45,${(dGlow * 0.09).toFixed(3)})`;
        dCtx.lineWidth = 6 + dGlow * 8;
        dCtx.stroke();
      }

      const sY1 = (scanPos - SCAN_LEN * 0.5) * dH;
      const sY2 = (scanPos + SCAN_LEN * 0.5) * dH;
      const sg = dCtx.createLinearGradient(0, sY1, 0, sY2);
      sg.addColorStop(0, "rgba(196,98,45,0)");
      sg.addColorStop(0.5, `rgba(196,98,45,${(0.75 + dGlow * 0.25).toFixed(2)})`);
      sg.addColorStop(1, "rgba(196,98,45,0)");
      dCtx.beginPath();
      dCtx.moveTo(cx, Math.max(0, sY1));
      dCtx.lineTo(cx, Math.min(dH, sY2));
      dCtx.strokeStyle = sg;
      dCtx.lineWidth = 2.5;
      dCtx.lineCap = "round";
      dCtx.stroke();

      dCtx.save();
      dCtx.translate(cx, dH / 2);
      dCtx.rotate(Math.PI / 4);
      dCtx.fillStyle = `rgba(212,201,180,${(0.75 + dGlow * 0.25).toFixed(2)})`;
      dCtx.fillRect(-2.5, -2.5, 5, 5);
      dCtx.restore();
    });
    addCleanup(() => raf.remove("divider"));
  }

  // ═══════════════════════════════════════════════════
  // 4. PROFILE NODE — gravity + float + parallax eyes
  // ═══════════════════════════════════════════════════
  const PN_RADIUS = 165;

  if (pnNode) {
    raf.add("pn", (ts) => {
      if (!entryDone) return;

      if (hasPointer) {
        magCX = lerp(magCX, magTX, 0.09);
        magCY = lerp(magCY, magTY, 0.09);
        glowC = lerp(glowC, glowT, 0.07);
      }

      const floatY = Math.sin(ts * 0.00055) * 4;
      pnNode.style.transform =
        `translateX(calc(-50% + ${magCX.toFixed(2)}px)) ` +
        `translateY(${(floatY + magCY).toFixed(2)}px)`;

      if (hasPointer) {
        if (pnWrap) {
          if (glowC > 0.015) {
            const g = glowC;
            pnWrap.style.boxShadow = `0 0 ${(g * 18).toFixed(1)}px ${(g * 5).toFixed(1)}px rgba(196,98,45,${(g * 0.12).toFixed(3)})`;
            pnWrap.style.borderColor = `rgba(196,${Math.round(180 + g * 22)},${Math.round(154 + g * 20)},${(0.35 + g * 0.4).toFixed(2)})`;
          } else {
            pnWrap.style.boxShadow = "";
            pnWrap.style.borderColor = "";
          }
        }

        if (pnImg) {
          const W = window.innerWidth,
            H = window.innerHeight;
          imgX = lerp(imgX, clamp((mx - W / 2) / (W / 2), -1, 1) * 3.2, 0.04);
          imgY = lerp(imgY, clamp((my - H / 2) / (H / 2), -1, 1) * 2.8, 0.04);
          pnImg.style.transform = `translate(${imgX.toFixed(2)}px, ${imgY.toFixed(2)}px)`;
        }

        const centerProx = Math.max(0, 1 - Math.abs(mx / window.innerWidth - 0.5) * 2.5);
        const pull = centerProx * 3;
        if (leftInner) leftInner.style.transform = `translateX(${(pull * 0.25).toFixed(2)}px)`;
        if (rightInner) rightInner.style.transform = `translateX(${(-pull * 0.25).toFixed(2)}px)`;
      }
    });
    addCleanup(() => raf.remove("pn"));
  }

  // ═══════════════════════════════════════════════════
  // 5. CURSOR DISTORTION — close-following glass lens
  // ═══════════════════════════════════════════════════
  if (distortEl && hasPointer) {
    raf.add("distort", () => {
      distX = lerp(distX, mx, 0.18);
      distY = lerp(distY, my, 0.18);
      distortEl.style.left = distX + "px";
      distortEl.style.top = distY + "px";
    });
    addCleanup(() => raf.remove("distort"));
  }

  // ═══════════════════════════════════════════════════
  // 6. DUST PARTICLES — sparse cinematic ambient dust
  // ═══════════════════════════════════════════════════
  if (dustCanvas) {
    const pCtx = dustCanvas.getContext("2d")!;
    let pW = 0,
      pH = 0;

    function resizeDust() {
      pW = dustCanvas!.width = window.innerWidth;
      pH = dustCanvas!.height = window.innerHeight;
    }
    resizeDust();
    window.addEventListener("resize", resizeDust, { passive: true });
    addCleanup(() => window.removeEventListener("resize", resizeDust));

    const dust = Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.35 + Math.random() * 1.1,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -(0.018 + Math.random() * 0.055),
      opacity: 0.04 + Math.random() * 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    raf.add("dust", (ts) => {
      pCtx.clearRect(0, 0, pW, pH);
      dust.forEach((p) => {
        pCtx.globalAlpha = p.opacity * (0.82 + Math.sin(ts * 0.00038 + p.phase) * 0.18);
        pCtx.fillStyle = "#c4b49a";
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) {
          p.y = pH + 4;
          p.x = Math.random() * pW;
        }
        if (p.x < -4) p.x = pW + 4;
        if (p.x > pW + 4) p.x = -4;
      });
      pCtx.globalAlpha = 1;
    });
    addCleanup(() => raf.remove("dust"));
  }

  // ═══════════════════════════════════════════════════
  // 7. AMBIENT WORLDS — slow breath modulation
  // ═══════════════════════════════════════════════════
  if (ambA || ambB) {
    raf.add("ambient", (ts) => {
      const b = 0.7 + Math.sin(ts * 0.000022) * 0.3;
      if (ambA) ambA.style.opacity = (0.18 + b * 0.82).toFixed(3);
      if (ambB) ambB.style.opacity = (0.14 + b * 0.86).toFixed(3);
    });
    addCleanup(() => raf.remove("ambient"));
  }

  // ═══════════════════════════════════════════════════
  // 8. LIQUID CROSSING — ripple on divider crossing
  // ═══════════════════════════════════════════════════
  function spawnCrossing(x: number, y: number) {
    const el = document.createElement("div");
    el.className = "crossing-ripple";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.transition = "transform 0.72s cubic-bezier(0.16,1,0.3,1), opacity 0.72s ease-out";
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = "translate(-50%,-50%) scale(9)";
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 760);
  }

  // ═══════════════════════════════════════════════════
  // 9. BREATHING WORLD — container slow scale pulse
  // ═══════════════════════════════════════════════════
  if (container && !reducedMotion) {
    raf.add("breathe", (ts) => {
      if (!entryDone) return;
      const s = 1 + Math.sin(ts * 0.000088) * 0.003;
      container.style.transform = `scale(${s.toFixed(5)})`;
    });
    addCleanup(() => raf.remove("breathe"));
  }

  // ═══════════════════════════════════════════════════
  // 10. MATRIX GLITCH — rare ambient distortion on left side
  // ═══════════════════════════════════════════════════
  let glitchTimer: ReturnType<typeof setTimeout> | null = null;
  let glitchCancelled = false;
  if (!reducedMotion && leftSide) {
    const scheduleGlitch = () => {
      glitchTimer = setTimeout(() => {
        if (glitchCancelled) return;
        if (!document.hidden) {
          leftSide.classList.add("glitching");
          setTimeout(() => leftSide.classList.remove("glitching"), 300);
          if (Math.random() > 0.45) {
            setTimeout(() => {
              leftSide.classList.add("glitching");
              setTimeout(() => leftSide.classList.remove("glitching"), 180);
            }, 500);
          }
        }
        scheduleGlitch();
      }, 16000 + Math.random() * 26000);
    };
    scheduleGlitch();
    addCleanup(() => {
      glitchCancelled = true;
      if (glitchTimer) clearTimeout(glitchTimer);
    });
  }

  // ═══════════════════════════════════════════════════
  // 11. ATMOSPHERE PARALLAX (no-ops gracefully if atm layers absent)
  // ═══════════════════════════════════════════════════
  const atmHuman = dom.qs<HTMLElement>(".atm-human");
  const atmMatrix = dom.qs<HTMLElement>(".atm-matrix");

  if ((atmHuman || atmMatrix) && hasPointer) {
    let atmHX = 0,
      atmHY = 0;
    let atmMX = 0,
      atmMY = 0;

    raf.add("atm", () => {
      const normX = (mx / window.innerWidth - 0.5) * 2;
      const normY = (my / window.innerHeight - 0.5) * 2;

      atmHX = lerp(atmHX, -normX * 14, 0.011);
      atmHY = lerp(atmHY, -normY * 9, 0.011);

      atmMX = lerp(atmMX, normX * 10, 0.015);
      atmMY = lerp(atmMY, normY * 6, 0.015);

      if (atmHuman) atmHuman.style.transform = `translate(${atmHX.toFixed(2)}px,${atmHY.toFixed(2)}px)`;
      if (atmMatrix) atmMatrix.style.transform = `translate(${atmMX.toFixed(2)}px,${atmMY.toFixed(2)}px)`;
    });
    addCleanup(() => raf.remove("atm"));
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
