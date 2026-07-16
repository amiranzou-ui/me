"use client";

import { useEffect, useRef } from "react";
import { raf, throttle } from "@/lib/world/core";

const MEM_FRAGS = [
  { text: "Baghdad, 2025", style: { top: "7%", right: "2%" }, fi: 0, depth: 1.2, vert: false },
  { text: "2:14 AM", style: { top: "24%", left: "1%" }, fi: 1, depth: 0.8, vert: false },
  { text: "taken after work", style: { top: "40%", right: "0.5%" }, fi: 2, depth: 1.4, vert: true },
  { text: "almost walked past this", style: { top: "58%", left: "1%" }, fi: 3, depth: 1, vert: false },
  { text: "still one of my favorites", style: { top: "74%", right: "2%" }, fi: 4, depth: 0.9, vert: false },
  { text: "stayed on repeat for 11 days", style: { top: "88%", left: "0.5%" }, fi: 5, depth: 1.3, vert: true },
];

// Touch-only stand-in for the 120-particle ambient canvas: a handful of
// CSS-animated motes (compositor transform/opacity only, no per-frame JS).
// Hidden by default; shown via the @media (pointer: coarse) rule in
// human.css, same convention as .cursor-dot/.cursor-ring's touch handling.
// Positions are fixed (not Math.random()) so server/client markup matches —
// same reasoning as MEM_FRAGS above.
const TOUCH_MOTES = [
  { "--tm-x": "8%", "--tm-delay": "0s", "--tm-dur": "16s" },
  { "--tm-x": "19%", "--tm-delay": "2.4s", "--tm-dur": "21s" },
  { "--tm-x": "31%", "--tm-delay": "5.1s", "--tm-dur": "17.5s" },
  { "--tm-x": "44%", "--tm-delay": "1.2s", "--tm-dur": "23s" },
  { "--tm-x": "58%", "--tm-delay": "7.8s", "--tm-dur": "18.5s" },
  { "--tm-x": "67%", "--tm-delay": "3.6s", "--tm-dur": "20s" },
  { "--tm-x": "76%", "--tm-delay": "9.5s", "--tm-dur": "16.8s" },
  { "--tm-x": "85%", "--tm-delay": "0.8s", "--tm-dur": "22.4s" },
  { "--tm-x": "92%", "--tm-delay": "6.2s", "--tm-dur": "19s" },
  { "--tm-x": "13%", "--tm-delay": "11s", "--tm-dur": "24s" },
];

/**
 * Ported from legacy/js/human.js (cursor dot/ring/glow + 120-particle
 * ambient canvas) and legacy/js/human-memory.js (depth-parallax memory
 * fragments). Merged into one shared rAF task like the original's
 * "single merged RAF task: ring + glow + particles" comment.
 */
export default function CursorFx() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fragRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const hasPointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let mouseX = 0,
      mouseY = 0;
    let tGlowX = window.innerWidth / 2,
      tGlowY = window.innerHeight / 2;
    let ringX = 0,
      ringY = 0;
    let glowX = tGlowX,
      glowY = tGlowY;

    const onMove = throttle((e: Event) => {
      const me = e as MouseEvent;
      mouseX = me.clientX;
      mouseY = me.clientY;
      tGlowX = me.clientX;
      tGlowY = me.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = mouseX + "px";
        dotRef.current.style.top = mouseY + "px";
      }
    }, 16);
    document.addEventListener("mousemove", onMove);

    // ── Ambient particles ──
    // Skipped entirely on touch: 120 particles redrawn to a full-viewport
    // canvas every frame is pure cost with no payoff there (no cursor to
    // animate around). Touch gets the CSS-only .cursor-touch-mote spans
    // instead — compositor-driven, zero per-frame JS.
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    if (!isTouch) {
      resize();
      window.addEventListener("resize", resize);
    }

    const particles = isTouch
      ? []
      : Array.from({ length: 120 }, () => ({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -(Math.random() * 0.28 + 0.08),
          r: Math.random() * 1.1 + 0.4,
          a: Math.random() * 0.28 + 0.07,
        }));

    // ── Memory fragment parallax state ──
    let fmx = window.innerWidth / 2;
    let fmy = window.innerHeight / 2;
    const fragState = MEM_FRAGS.map(() => ({ x: 0, y: 0 }));
    const onMoveFrags = (e: Event) => {
      const me = e as MouseEvent;
      fmx = me.clientX;
      fmy = me.clientY;
    };
    if (hasPointer && !reducedMotion) document.addEventListener("mousemove", onMoveFrags);

    raf.add("human-ui", () => {
      if (ringRef.current) {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ringRef.current.style.left = ringX + "px";
        ringRef.current.style.top = ringY + "px";
      }
      if (glowRef.current && !isTouch) {
        glowX += (tGlowX - glowX) * 0.07;
        glowY += (tGlowY - glowY) * 0.07;
        // transform instead of left/top — Chrome counts left/top position
        // changes on a 520px element as layout shift (CLS), even though it's
        // position:fixed and affects no other element's layout.
        glowRef.current.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
      }

      if (!isTouch) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -4) {
            p.y = canvas.height + 4;
            p.x = Math.random() * canvas.width;
          }
          if (p.x < -4) p.x = canvas.width + 4;
          if (p.x > canvas.width + 4) p.x = -4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(196,180,154,${p.a})`;
          ctx.fill();
        }
      }

      if (hasPointer && !reducedMotion) {
        const nx = (fmx / window.innerWidth - 0.5) * 2;
        const ny = (fmy / window.innerHeight - 0.5) * 2;
        MEM_FRAGS.forEach((frag, i) => {
          const state = fragState[i];
          const targetX = nx * 18 * frag.depth;
          const targetY = ny * 10 * frag.depth;
          state.x += (targetX - state.x) * 0.025;
          state.y += (targetY - state.y) * 0.025;
          const el = fragRefs.current[i];
          if (el) {
            el.style.setProperty("--dx", state.x.toFixed(2) + "px");
            el.style.setProperty("--dy", state.y.toFixed(2) + "px");
          }
        });
      }
    });

    // ring expand on interactive elements
    const interactive = Array.from(document.querySelectorAll("a, button, .cell"));
    const onEnter = () => ringRef.current?.classList.add("expand");
    const onLeave = () => ringRef.current?.classList.remove("expand");
    interactive.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousemove", onMoveFrags);
      if (!isTouch) window.removeEventListener("resize", resize);
      raf.remove("human-ui");
      interactive.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 3 }} />
      <div className="cursor-glow" ref={glowRef} />
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
      <div className="cursor-touch-motes" aria-hidden="true">
        {TOUCH_MOTES.map((m, i) => (
          <span key={i} className="cursor-touch-mote" style={m as React.CSSProperties} />
        ))}
      </div>
      {MEM_FRAGS.map((f, i) => (
        <span
          key={i}
          ref={(el) => {
            fragRefs.current[i] = el;
          }}
          className={`mem-frag${f.vert ? " vert" : ""}`}
          style={{ ...f.style, "--fi": f.fi } as unknown as React.CSSProperties}
          aria-hidden="true"
        >
          {f.text}
        </span>
      ))}
    </>
  );
}
