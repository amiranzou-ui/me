/**
 * Index page — split-screen landing.
 * Depends on: js/core.js, js/secret.js
 */
(function () {
  'use strict';

  const { portal, dom } = window.Core;

  const container = dom.qs('#container');
  const left      = dom.qs('#left');
  const right     = dom.qs('#right');

  if (!container || !left || !right) return;

  const isMobile = () => window.innerWidth <= 768;
  let collapseTimer = null;

  function expandSide(add, remove) {
    clearTimeout(collapseTimer);
    container.classList.remove(remove);
    container.classList.add(add);
    collapseTimer = setTimeout(() => container.classList.remove(add), 5000);
  }

  left.addEventListener('click', e => {
    if (isMobile()) {
      container.classList.contains('touch-left')
        ? clearTimeout(collapseTimer)
        : expandSide('touch-left', 'touch-right');
    } else {
      portal('matrix.html', '#f2ece0', e.clientX, e.clientY);
    }
  });

  right.addEventListener('click', e => {
    if (isMobile()) {
      if (container.classList.contains('touch-right')) {
        clearTimeout(collapseTimer);
        portal('Human.html', '#141008', e.clientX, e.clientY);
      } else {
        expandSide('touch-right', 'touch-left');
      }
    } else {
      portal('Human.html', '#141008', e.clientX, e.clientY);
    }
  });

  // ── Profile panel ─────────────────────────────────────────
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

  // ── Secret word ───────────────────────────────────────────
  window.SecretWord.init();
})();
