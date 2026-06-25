/**
 * world.js — Living World Layer
 *
 * Systems:
 *  1. Cinematic Entry       — GSAP film-like opacity sequence (no transform conflicts)
 *  2. Cursor Aura           — large soft glow with delayed follow + world bias
 *  3. Living Divider        — canvas bezier curve reacts to cursor
 *  4. Profile Gravity       — magnetic attraction + float + parallax eyes + gravity field
 *  5. Cursor Distortion     — glass-like backdrop-filter lens
 *  6. Dust Particles        — cinematic canvas ambient dust
 *  7. Ambient Worlds        — human/matrix breath modulation
 *  8. Liquid Crossing       — ripple when cursor crosses divider
 *  9. Breathing World       — imperceptible slow scale pulse on container
 * 10. Matrix Glitch         — rare ambient distortion events on left side
 *
 * Depends on: js/core.js (window.Core), GSAP 3.x (window.gsap — optional)
 */
(function () {
  'use strict';

  const { raf, lerp, clamp, dom } = window.Core;
  const gsap          = window.gsap || null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasPointer    = !window.matchMedia('(pointer: coarse)').matches;

  // ── DOM refs ──────────────────────────────────────────────
  const container  = dom.qs('#container');
  const leftSide   = dom.qs('#left');
  const rightSide  = dom.qs('#right');
  const leftInner  = dom.qs('#left .side-inner');
  const rightInner = dom.qs('#right .side-inner');
  const dividerEl  = dom.qs('#divider-el');
  const divCanvas  = dom.qs('#divider-canvas');
  const aura       = dom.qs('#cursor-aura');
  const distortEl  = dom.qs('#cursor-distort');
  const dustCanvas = dom.qs('#dust-canvas');
  const pnNode     = dom.qs('#pn-toggle');
  const pnWrap     = pnNode && dom.qs('.pn-wrap', pnNode);
  const pnImg      = pnNode && dom.qs('.pn-img',  pnNode);
  const ambA       = dom.qs('#ambient-a');
  const ambB       = dom.qs('#ambient-b');

  // ── Shared mutable state ─────────────────────────────────
  let mx = window.innerWidth  / 2;
  let my = window.innerHeight / 2;

  // Divider targets (written by onMove, read by divider RAF closure)
  let dBendT  = 0, dBend  = 0;
  let dGlowT  = 0, dGlow  = 0;
  let dShiftT = 0, dShift = 0;

  // Magnetic targets
  let magTX = 0, magTY = 0, magCX = 0, magCY = 0;
  let glowT = 0, glowC = 0;

  // Parallax / gravity lerp values
  let imgX = 0,  imgY  = 0;
  let biasT = 0.5;

  // Distort + aura current positions
  let auraX = mx, auraY = my;
  let distX = mx, distY = my;

  // Side-crossing tracker
  let lastSide = null;

  // Entry gate — certain RAFs wait for the sequence to finish
  let entryDone = reducedMotion || !gsap;

  // ═══════════════════════════════════════════════════
  // 1. CINEMATIC ENTRY
  // Entry uses opacity-only GSAP animations to avoid conflicting
  // with CSS-defined transforms (translateX -50%, side-inner transitions).
  // ═══════════════════════════════════════════════════
  if (gsap && !reducedMotion) {
    document.documentElement.classList.add('entry-ready');

    gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        document.documentElement.classList.remove('entry-ready');
        entryDone = true;
      },
    })
    // 1. World fades in from dark
    .to('#container',        { opacity: 1, duration: 1.1, ease: 'power1.inOut' }, 0.15)
    // 2. Divider line materialises
    .to('#divider-canvas',   { opacity: 1, duration: 0.85, ease: 'power2.inOut' }, 0.3)
    // 3. Human side appears
    .to('#right .side-inner',{ opacity: 1, duration: 0.72 }, 0.85)
    // 4. Matrix side appears
    .to('#left .side-inner', { opacity: 1, duration: 0.72 }, 0.95)
    // 5. Profile node fades in (world.js RAF already controls its transform)
    .to('.profile-node',     { opacity: 1, duration: 0.85, ease: 'power2.out' }, 1.3)
    // 6. Structural chrome
    .to('.frame-corner',     { opacity: 1, duration: 0.4, stagger: 0.07 }, 1.75)
    .to('.corner',           { opacity: 1, duration: 0.5 }, 1.85);
  }

  // ═══════════════════════════════════════════════════
  // CURSOR TRACKING
  // ═══════════════════════════════════════════════════
  if (hasPointer) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      onMove(e);
    }, { passive: true });
  }

  // ═══════════════════════════════════════════════════
  // 2. CURSOR AURA — large soft glow, world-bias size
  // ═══════════════════════════════════════════════════
  if (aura && hasPointer) {
    raf.add('aura', () => {
      auraX = lerp(auraX, mx, 0.062);
      auraY = lerp(auraY, my, 0.062);
      aura.style.left = auraX + 'px';
      aura.style.top  = auraY + 'px';

      // Size: smaller/sharper on Matrix side, larger/softer on Human side
      biasT = lerp(biasT, mx / window.innerWidth, 0.025);
      const sz = Math.round(lerp(480, 660, biasT));
      aura.style.width  = sz + 'px';
      aura.style.height = sz + 'px';
    });
  }

  // ═══════════════════════════════════════════════════
  // 3. LIVING DIVIDER — canvas bezier curve
  // ═══════════════════════════════════════════════════
  if (divCanvas && dividerEl) {
    dividerEl.classList.add('canvas-active'); // hides CSS ::before/::after visuals

    const dCtx     = divCanvas.getContext('2d');
    const DIV_W    = 24;
    let   dH       = window.innerHeight;
    let   scanPos  = 0.1;
    const SCAN_LEN = 0.22;

    function resizeDiv() {
      dH = window.innerHeight;
      divCanvas.width  = DIV_W;
      divCanvas.height = dH;
    }
    resizeDiv();
    window.addEventListener('resize', resizeDiv, { passive: true });

    // Mirror CSS :has(:hover) opacity fade on the original divider
    [leftSide, rightSide].forEach(s => {
      s.addEventListener('mouseenter', () => { divCanvas.style.opacity = '0.3'; });
      s.addEventListener('mouseleave', () => { divCanvas.style.opacity = '1';   });
    });

    raf.add('divider', ts => {
      dBend  = lerp(dBend,  dBendT,  0.07);
      dGlow  = lerp(dGlow,  dGlowT,  0.06);
      dShift = lerp(dShift, dShiftT, 0.06);

      divCanvas.style.left = `calc(50% + ${dShift.toFixed(2)}px)`;
      scanPos = (scanPos + 0.0014 + dGlow * 0.0008) % 1;

      dCtx.clearRect(0, 0, DIV_W, dH);
      const cx  = DIV_W / 2;
      const cpx = cx + dBend * 0.7; // bezier control point shifts toward cursor

      // ── Main line ──
      const mg = dCtx.createLinearGradient(0, 0, 0, dH);
      mg.addColorStop(0,    'rgba(212,201,180,0)');
      mg.addColorStop(0.14, `rgba(212,201,180,${(0.7  + dGlow * 0.3).toFixed(2)})`);
      mg.addColorStop(0.86, `rgba(212,201,180,${(0.7  + dGlow * 0.3).toFixed(2)})`);
      mg.addColorStop(1,    'rgba(212,201,180,0)');
      dCtx.beginPath();
      dCtx.moveTo(cx, 0);
      dCtx.bezierCurveTo(cpx, dH * 0.33, cpx, dH * 0.67, cx, dH);
      dCtx.strokeStyle = mg;
      dCtx.lineWidth   = 1;
      dCtx.stroke();

      // ── Proximity glow halo ──
      if (dGlow > 0.04) {
        dCtx.beginPath();
        dCtx.moveTo(cx, dH * 0.14);
        dCtx.bezierCurveTo(cpx, dH * 0.33, cpx, dH * 0.67, cx, dH * 0.86);
        dCtx.strokeStyle = `rgba(196,98,45,${(dGlow * 0.09).toFixed(3)})`;
        dCtx.lineWidth   = 6 + dGlow * 8;
        dCtx.stroke();
      }

      // ── Animated scan light ──
      const sY1  = (scanPos - SCAN_LEN * 0.5) * dH;
      const sY2  = (scanPos + SCAN_LEN * 0.5) * dH;
      const sg   = dCtx.createLinearGradient(0, sY1, 0, sY2);
      sg.addColorStop(0,   'rgba(196,98,45,0)');
      sg.addColorStop(0.5, `rgba(196,98,45,${(0.75 + dGlow * 0.25).toFixed(2)})`);
      sg.addColorStop(1,   'rgba(196,98,45,0)');
      dCtx.beginPath();
      dCtx.moveTo(cx, Math.max(0, sY1));
      dCtx.lineTo(cx, Math.min(dH, sY2));
      dCtx.strokeStyle = sg;
      dCtx.lineWidth   = 2.5;
      dCtx.lineCap     = 'round';
      dCtx.stroke();

      // ── Center diamond ──
      dCtx.save();
      dCtx.translate(cx, dH / 2);
      dCtx.rotate(Math.PI / 4);
      dCtx.fillStyle = `rgba(212,201,180,${(0.75 + dGlow * 0.25).toFixed(2)})`;
      dCtx.fillRect(-2.5, -2.5, 5, 5);
      dCtx.restore();
    });
  }

  // ═══════════════════════════════════════════════════
  // 4. PROFILE NODE — gravity + float + parallax eyes
  // ═══════════════════════════════════════════════════
  const PN_RADIUS = 165;

  if (pnNode && hasPointer) {
    raf.add('pn', ts => {
      if (!entryDone) return;

      magCX = lerp(magCX, magTX, 0.09);
      magCY = lerp(magCY, magTY, 0.09);
      glowC = lerp(glowC, glowT,  0.07);

      // Float + magnetic combined transform
      const floatY = Math.sin(ts * 0.00055) * 4;
      pnNode.style.transform =
        `translateX(calc(-50% + ${magCX.toFixed(2)}px)) ` +
        `translateY(${(floatY + magCY).toFixed(2)}px)`;

      // Proximity glow on the wrap
      if (pnWrap) {
        if (glowC > 0.015) {
          const g = glowC;
          pnWrap.style.boxShadow   = `0 0 ${(g * 18).toFixed(1)}px ${(g * 5).toFixed(1)}px rgba(196,98,45,${(g * 0.12).toFixed(3)})`;
          pnWrap.style.borderColor = `rgba(196,${Math.round(180 + g * 22)},${Math.round(154 + g * 20)},${(0.35 + g * 0.4).toFixed(2)})`;
        } else {
          pnWrap.style.boxShadow   = '';
          pnWrap.style.borderColor = '';
        }
      }

      // Parallax eyes — portrait tracks cursor
      if (pnImg) {
        const W = window.innerWidth, H = window.innerHeight;
        imgX = lerp(imgX, clamp((mx - W / 2) / (W / 2), -1, 1) * 3.2, 0.04);
        imgY = lerp(imgY, clamp((my - H / 2) / (H / 2), -1, 1) * 2.8, 0.04);
        pnImg.style.transform = `translate(${imgX.toFixed(2)}px, ${imgY.toFixed(2)}px)`;
      }

      // Gravity field — side content softly pulled toward the profile node
      const centerProx = Math.max(0, 1 - Math.abs((mx / window.innerWidth) - 0.5) * 2.5);
      const pull = centerProx * 3;
      if (leftInner)  leftInner.style.transform  = `translateX(${( pull * 0.25).toFixed(2)}px)`;
      if (rightInner) rightInner.style.transform = `translateX(${(-pull * 0.25).toFixed(2)}px)`;
    });
  }

  // ═══════════════════════════════════════════════════
  // 5. CURSOR DISTORTION — close-following glass lens
  // ═══════════════════════════════════════════════════
  if (distortEl && hasPointer) {
    raf.add('distort', () => {
      distX = lerp(distX, mx, 0.18);
      distY = lerp(distY, my, 0.18);
      distortEl.style.left = distX + 'px';
      distortEl.style.top  = distY + 'px';
    });
  }

  // ═══════════════════════════════════════════════════
  // 6. DUST PARTICLES — sparse cinematic ambient dust
  // ═══════════════════════════════════════════════════
  if (dustCanvas) {
    const pCtx = dustCanvas.getContext('2d');
    let pW = 0, pH = 0;

    function resizeDust() {
      pW = dustCanvas.width  = window.innerWidth;
      pH = dustCanvas.height = window.innerHeight;
    }
    resizeDust();
    window.addEventListener('resize', resizeDust, { passive: true });

    const dust = Array.from({ length: 18 }, () => ({
      x:       Math.random() * window.innerWidth,
      y:       Math.random() * window.innerHeight,
      r:       0.35 + Math.random() * 1.1,
      vx:      (Math.random() - 0.5) * 0.05,
      vy:      -(0.018 + Math.random() * 0.055),
      opacity: 0.04 + Math.random() * 0.1,
      phase:   Math.random() * Math.PI * 2,
    }));

    raf.add('dust', ts => {
      pCtx.clearRect(0, 0, pW, pH);
      dust.forEach(p => {
        pCtx.globalAlpha = p.opacity * (0.82 + Math.sin(ts * 0.00038 + p.phase) * 0.18);
        pCtx.fillStyle   = '#c4b49a';
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4)    { p.y = pH + 4; p.x = Math.random() * pW; }
        if (p.x < -4)      p.x = pW + 4;
        if (p.x > pW + 4)  p.x = -4;
      });
      pCtx.globalAlpha = 1;
    });
  }

  // ═══════════════════════════════════════════════════
  // 7. AMBIENT WORLDS — slow breath modulation
  // ═══════════════════════════════════════════════════
  if (ambA || ambB) {
    raf.add('ambient', ts => {
      const b = 0.7 + Math.sin(ts * 0.000022) * 0.3; // ~285s cycle
      if (ambA) ambA.style.opacity = (0.18 + b * 0.82).toFixed(3);
      if (ambB) ambB.style.opacity = (0.14 + b * 0.86).toFixed(3);
    });
  }

  // ═══════════════════════════════════════════════════
  // 8. LIQUID CROSSING — ripple on divider crossing
  // ═══════════════════════════════════════════════════
  function spawnCrossing(x, y) {
    if (!gsap) return;
    const el = document.createElement('div');
    el.className  = 'crossing-ripple';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    document.body.appendChild(el);
    gsap.to(el, {
      scale: 9, opacity: 0,
      duration: 0.72, ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }

  // ═══════════════════════════════════════════════════
  // 9. BREATHING WORLD — container slow scale pulse
  // ═══════════════════════════════════════════════════
  if (container && !reducedMotion) {
    raf.add('breathe', ts => {
      if (!entryDone) return;
      const s = 1 + Math.sin(ts * 0.000088) * 0.003; // ~71s cycle, ±0.3%
      container.style.transform = `scale(${s.toFixed(5)})`;
    });
  }

  // ═══════════════════════════════════════════════════
  // 10. MATRIX GLITCH — rare ambient distortion on left side
  // ═══════════════════════════════════════════════════
  (function scheduleGlitch() {
    if (reducedMotion || !leftSide) return;
    setTimeout(() => {
      if (!document.hidden) {
        leftSide.classList.add('glitching');
        setTimeout(() => leftSide.classList.remove('glitching'), 300);
        // Occasional double-hit
        if (Math.random() > 0.45) {
          setTimeout(() => {
            leftSide.classList.add('glitching');
            setTimeout(() => leftSide.classList.remove('glitching'), 180);
          }, 500);
        }
      }
      scheduleGlitch();
    }, 16000 + Math.random() * 26000); // every 16–42 seconds
  }());

  // ═══════════════════════════════════════════════════
  // CURSOR MOVE DISPATCH
  // ═══════════════════════════════════════════════════
  function onMove(e) {
    const W    = window.innerWidth;
    const divX = W / 2;

    // ── Magnetic ──
    if (pnNode) {
      const r    = pnNode.getBoundingClientRect();
      const cx   = r.left + r.width  / 2;
      const cy   = r.top  + r.height / 2;
      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < PN_RADIUS) {
        const t = 1 - dist / PN_RADIUS;
        const l = dist > 0.1 ? dist : 0.1;
        magTX = (dx / l) * t * 9;
        magTY = (dy / l) * t * 3.5;
        glowT = t;
      } else {
        magTX = 0; magTY = 0; glowT = 0;
      }
    }

    // ── Divider ──
    const dDist = Math.abs(e.clientX - divX);
    const prox  = clamp(1 - dDist / 290, 0, 1);
    const side  = e.clientX < divX ? -1 : 1;
    dBendT  = side * prox * 4.5;
    dGlowT  = prox;
    dShiftT = side * prox * 2.2;

    // ── Crossing ──
    const curSide = e.clientX < divX ? 'L' : 'R';
    if (lastSide && lastSide !== curSide) spawnCrossing(e.clientX, e.clientY);
    lastSide = curSide;
  }

})();
