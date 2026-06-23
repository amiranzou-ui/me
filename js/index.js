/**
 * Index page — archive landing.
 * Depends on: js/core.js, js/secret.js
 */
(function () {
  'use strict';

  const { portal, dom } = window.Core;

  const arcMatrix = dom.qs('#arc-matrix');
  const arcHuman  = dom.qs('#arc-human');

  if (!arcMatrix || !arcHuman) return;

  arcMatrix.addEventListener('click', e => {
    portal('matrix.html', '#f2ece0', e.clientX, e.clientY);
  });

  arcHuman.addEventListener('click', e => {
    portal('human.html', '#141008', e.clientX, e.clientY);
  });

  // ── Profile panel ──────────────────────────────────────────
  const pnToggle   = dom.qs('#pn-toggle');
  const pnPanel    = dom.qs('#pn-panel');
  const pnBackdrop = dom.qs('#pn-backdrop');

  function openPanel()  {
    pnPanel    && pnPanel.classList.add('open');
    pnBackdrop && pnBackdrop.classList.add('open');
  }
  function closePanel() {
    pnPanel    && pnPanel.classList.remove('open');
    pnBackdrop && pnBackdrop.classList.remove('open');
  }

  if (pnToggle)   pnToggle.addEventListener('click', () => pnPanel.classList.contains('open') ? closePanel() : openPanel());
  if (pnBackdrop) pnBackdrop.addEventListener('click', closePanel);

  // ── Music link on card ─────────────────────────────────────
  const musicLink    = dom.qs('#pnp-music-link');
  const listeningVal = dom.qs('#pnp-listening-val');

  const savedTitle = (() => { try { return localStorage.getItem('music_title_v1') || ''; } catch(e) { return ''; } })();
  if (listeningVal) listeningVal.textContent = savedTitle ? '♫ ' + savedTitle : '♫ Open the room';

  if (musicLink) {
    musicLink.addEventListener('click', e => {
      e.stopPropagation();
      try { sessionStorage.setItem('mc_autoopen', '1'); } catch(_) {}
      portal('human.html', '#141008', e.clientX, e.clientY);
    });
  }

  // ── Secret word ────────────────────────────────────────────
  window.SecretWord.init();
})();
