(function () {
  // Inject CSS: disable drag and selection on images
  const s = document.createElement('style');
  s.textContent = 'img{-webkit-user-drag:none;user-select:none;-webkit-user-select:none;}';
  document.head.appendChild(s);

  function shield(img) {
    img.draggable = false;
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart',   e => e.preventDefault());
  }

  function applyAll() {
    document.querySelectorAll('img').forEach(shield);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', applyAll)
    : applyAll();

  // Cover dynamically injected images (lightbox, cooking overlay, etc.)
  new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IMG') shield(node);
        node.querySelectorAll && node.querySelectorAll('img').forEach(shield);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
