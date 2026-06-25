(function () {
  'use strict';

  const { raf, events, dom } = window.Core;
  const hasPointer  = window.matchMedia('(pointer: fine)').matches;
  const reducedMot  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // grain is handled purely by CSS (animation on body::after background-position)
  // no canvas needed — zero JS overhead for the cursor RAF loop

  // ── Depth parallax for memory fragments ───────────────────────
  const frags = dom.qsa('.mem-frag');
  if (frags.length && hasPointer && !reducedMot) {
    let mx = window.innerWidth  / 2;
    let my = window.innerHeight / 2;
    const fragState = Array.from(frags).map(() => ({ x: 0, y: 0 }));
    const FRAG_SPEED = 0.025;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    raf.add('mem-frags', () => {
      const nx = (mx / window.innerWidth  - 0.5) * 2;
      const ny = (my / window.innerHeight - 0.5) * 2;

      frags.forEach((frag, i) => {
        const state  = fragState[i];
        const depth  = parseFloat(frag.dataset.depth || '1');
        const target_x = nx * 18 * depth;
        const target_y = ny * 10 * depth;
        state.x += (target_x - state.x) * FRAG_SPEED;
        state.y += (target_y - state.y) * FRAG_SPEED;
        frag.style.setProperty('--dx', state.x.toFixed(2) + 'px');
        frag.style.setProperty('--dy', state.y.toFixed(2) + 'px');
      });
    });
  }

  // ── Tagline banner update on section change ────────────────────
  const taglineEl   = dom.qs('.mem-tagline');
  const taglineText = dom.qs('.mem-tagline-text');
  const taglineLbl  = dom.qs('.mem-tagline-label');

  const TAGLINES = {
    photography : { label: '01 — Photography', text: 'to remember. because some things are too beautiful to just walk past.' },
    posters     : { label: '02 — Posters',     text: 'life taught me something. I made a poster about it.' },
    patterns    : { label: '03 — Graphics',    text: 'this is what I do. grids, shapes, and making things feel right.' },
    music       : { label: '04 — Music',       text: 'what I had on repeat. the songs that stayed.' },
    cooking     : { label: '05 — Food Decisions', text: 'things i made. things i felt.' },
    '3d'        : { label: '07 — 3D',          text: 'geometry and I are still figuring each other out.' },
  };

  function updateTagline(cat) {
    if (!taglineEl || !taglineText || !taglineLbl) return;
    const data = TAGLINES[cat];
    if (!data) return;
    taglineEl.classList.remove('visible');
    setTimeout(() => {
      taglineLbl.textContent = data.label;
      taglineText.textContent = data.text;
      taglineEl.classList.add('visible');
    }, 250);
  }

  events.on('section:change', ({ to }) => updateTagline(to));

  // Show tagline for whichever section becomes active on first load
  setTimeout(() => {
    const activeCat = dom.qs('.cat.active');
    if (activeCat) updateTagline(activeCat.dataset.cat);
  }, 2200);

  // ── Slow reveal entry sequence ─────────────────────────────────
  // Stage 0: atmosphere (already CSS animated)
  // Stage 1: content layout fades in (handled by human.js)
  // Stage 2: memory fragments stagger (already CSS animated via --fi)
  // We just need to ensure tagline shows on first category select

})();
