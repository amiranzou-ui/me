(function () {
  'use strict';

  const { raf, events, dom } = window.Core;
  const hasPointer  = window.matchMedia('(pointer: fine)').matches;
  const reducedMot  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Animated film grain canvas ─────────────────────────────────
  const grainCanvas = dom.qs('#mem-grain-canvas');
  if (grainCanvas && !reducedMot) {
    const gc = grainCanvas.getContext('2d');
    let gW, gH;

    function resizeGrain() {
      gW = grainCanvas.width  = window.innerWidth;
      gH = grainCanvas.height = window.innerHeight;
    }
    resizeGrain();
    window.addEventListener('resize', resizeGrain);

    // Use a small tile redrawn every ~3 frames, scaled up via drawImage
    const TILE = 200;
    const offscreen = document.createElement('canvas');
    offscreen.width  = TILE;
    offscreen.height = TILE;
    const oc = offscreen.getContext('2d');

    let grainFrame = 0;
    function drawGrain() {
      grainFrame++;
      if (grainFrame % 3 !== 0) return; // redraw every 3 RAF ticks ≈ 20fps grain
      const imageData = oc.createImageData(TILE, TILE);
      const data      = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        data[i]     = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = Math.random() * 60 + 20 | 0; // semi-transparent
      }
      oc.putImageData(imageData, 0, 0);
      gc.clearRect(0, 0, gW, gH);
      // tile the offscreen across the viewport
      for (let x = 0; x < gW; x += TILE) {
        for (let y = 0; y < gH; y += TILE) {
          gc.drawImage(offscreen, x, y);
        }
      }
    }

    raf.add('mem-grain', drawGrain);
  }

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
