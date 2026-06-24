/**
 * world.js — Living world layer.
 * Runs only on pointer devices. Handles:
 *   - Cursor aura (large soft glow that follows with lerp delay)
 *   - Profile node magnetic attraction + dynamic glow
 *   - Profile node float (sin-wave top offset via RAF)
 *   - Divider cursor-proximity reactivity
 *   - Ambient light modulation (slow breathing opacity)
 *   - World bias (Matrix ↔ Human) shifting aura size
 * Depends on: js/core.js  (window.Core)
 */
(function () {
  'use strict';

  // Touch/coarse devices: skip cursor-driven effects
  // CSS animations (grain, ambient drifts, pn-breathe, ripples) still apply
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const { raf, lerp, clamp, dom } = window.Core;

  // ── DOM refs ────────────────────────────────────────────
  const aura      = dom.qs('#cursor-aura');
  const pnNode    = dom.qs('#pn-toggle');
  const pnWrap    = pnNode && dom.qs('.pn-wrap', pnNode);
  const dividerEl = dom.qs('.divider');
  const ambA      = dom.qs('#ambient-a');
  const ambB      = dom.qs('#ambient-b');

  if (!aura || !pnNode || !dividerEl) return;

  // ══════════════════════════════════════
  // CURSOR TRACKING
  // ══════════════════════════════════════
  let mx = window.innerWidth  / 2;
  let my = window.innerHeight / 2;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    handleCursorMove(e);
  }, { passive: true });

  // ══════════════════════════════════════
  // CURSOR AURA — soft delayed glow
  // ══════════════════════════════════════
  let auraX = mx, auraY = my;

  raf.add('aura-follow', () => {
    auraX = lerp(auraX, mx, 0.065);
    auraY = lerp(auraY, my, 0.065);
    aura.style.left = auraX + 'px';
    aura.style.top  = auraY + 'px';
  });

  // ══════════════════════════════════════
  // PROFILE NODE — float + magnetic
  // ══════════════════════════════════════
  const PN_BASE_TOP = 28;   // matches CSS top: 28px
  const PN_RADIUS   = 160;  // magnetic field px

  let magTargetX = 0, magTargetY = 0;
  let magCurrentX = 0, magCurrentY = 0;
  let glowTarget  = 0, glowCurrent = 0;

  function handleMagnetic(e) {
    const rect = pnNode.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = e.clientX - cx;
    const dy   = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < PN_RADIUS) {
      const t   = 1 - dist / PN_RADIUS;
      const len = dist > 0 ? dist : 1;
      magTargetX = (dx / len) * t * 9;
      magTargetY = (dy / len) * t * 4;
      glowTarget = t;
    } else {
      magTargetX = 0;
      magTargetY = 0;
      glowTarget = 0;
    }
  }

  raf.add('pn-transform', ts => {
    // Float: gentle sin wave on the vertical axis
    const floatY = Math.sin(ts * 0.00055) * 4;

    // Lerp magnetic values for smooth entry and release
    magCurrentX = lerp(magCurrentX, magTargetX, 0.10);
    magCurrentY = lerp(magCurrentY, magTargetY, 0.10);
    glowCurrent = lerp(glowCurrent, glowTarget,  0.08);

    // Apply combined transform: center-X + magnetic + float-Y
    const tx = magCurrentX.toFixed(2);
    const ty = (floatY + magCurrentY).toFixed(2);
    pnNode.style.transform = `translateX(calc(-50% + ${tx}px)) translateY(${ty}px)`;

    // Dynamic glow on pn-wrap (only when not in CSS hover state)
    if (pnWrap && glowCurrent > 0.01) {
      const g = glowCurrent;
      pnWrap.style.boxShadow  = `0 0 ${(g * 16).toFixed(1)}px ${(g * 5).toFixed(1)}px rgba(196,98,45,${(g * 0.13).toFixed(3)})`;
      pnWrap.style.borderColor = `rgba(196,${Math.round(180 + g * 20)},${Math.round(154 + g * 20)},${(0.35 + g * 0.35).toFixed(2)})`;
    } else if (pnWrap && glowCurrent <= 0.01) {
      pnWrap.style.boxShadow  = '';
      pnWrap.style.borderColor = '';
    }
  });

  // ══════════════════════════════════════
  // DIVIDER — proximity reactivity
  // ══════════════════════════════════════
  let divGlowTarget  = 0, divGlowCurrent  = 0;
  let divShiftTarget = 0, divShiftCurrent = 0;

  function handleDivider(e) {
    const divX  = window.innerWidth / 2;
    const dist  = Math.abs(e.clientX - divX);
    const prox  = clamp(1 - dist / 280, 0, 1);
    const side  = e.clientX < divX ? -1 : 1;

    divGlowTarget  = prox;
    divShiftTarget = side * prox * 2.5;
  }

  raf.add('divider-react', () => {
    divGlowCurrent  = lerp(divGlowCurrent,  divGlowTarget,  0.06);
    divShiftCurrent = lerp(divShiftCurrent, divShiftTarget, 0.06);

    dividerEl.style.setProperty('--div-glow', divGlowCurrent.toFixed(3));
    dividerEl.style.setProperty('--div-x',    divShiftCurrent.toFixed(2) + 'px');
  });

  // ══════════════════════════════════════
  // WORLD BIAS — Matrix ↔ Human
  // Cursor X position shifts aura size:
  //   Matrix (left)  → smaller, more precise
  //   Human  (right) → larger, more diffuse
  // ══════════════════════════════════════
  let biasTarget  = 0.5;
  let biasCurrent = 0.5;

  function handleWorldBias(e) {
    biasTarget = clamp(e.clientX / window.innerWidth, 0, 1);
  }

  raf.add('world-bias', () => {
    biasCurrent = lerp(biasCurrent, biasTarget, 0.03);
    const size  = Math.round(lerp(490, 660, biasCurrent));
    aura.style.width  = size + 'px';
    aura.style.height = size + 'px';
  });

  // ══════════════════════════════════════
  // AMBIENT MODULATION — slow breath
  // ══════════════════════════════════════
  raf.add('ambient-breath', ts => {
    const breath = 0.72 + Math.sin(ts * 0.000022) * 0.28; // 0.44 .. 1.0, very slow
    if (ambA) ambA.style.opacity = (0.2 + breath * 0.8).toFixed(3);
    if (ambB) ambB.style.opacity = (0.15 + breath * 0.85).toFixed(3);
  });

  // ══════════════════════════════════════
  // DISPATCH
  // ══════════════════════════════════════
  function handleCursorMove(e) {
    handleMagnetic(e);
    handleDivider(e);
    handleWorldBias(e);
  }

})();
