/**
 * Human page — category system, lightbox, cursor FX, ambient particles.
 * Depends on: js/core.js, js/secret.js
 *
 * Fixes vs. old Human.js:
 *  - Secret word + showMindEntry removed (now in js/secret.js — one canonical copy)
 *  - portalTo removed (now Core.portal)
 *  - 3 separate RAF loops merged into one shared Core.raf task
 *  - setInterval for nav status replaced with clearable setTimeout chain
 *  - mousemove listener throttled (was raw, fired every pixel)
 *  - cooking section cleanup on section switch (overlay + state)
 *  - null guards on all DOM queries
 */
(function () {
  'use strict';

  const { raf, throttle, portal, dom, events } = window.Core;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  // ── Reveal banner ──────────────────────────────────────────
  const catReveal     = dom.qs('#cat-reveal');
  const catRevealLine = dom.qs('#cat-reveal-line');

  function showReveal(text, cb) {
    if (!catReveal || !catRevealLine) { cb && cb(); return; }
    catRevealLine.textContent = text;
    catReveal.classList.add('show');
    setTimeout(() => {
      catReveal.classList.remove('show');
      setTimeout(() => cb && cb(), 500);
    }, 1600);
  }

  // ── Scroll-reveal for masonry cells ───────────────────────
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  function observeCells(container) {
    if (!container) return;
    container.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('visible');
      revealObserver.observe(cell);
    });
  }

  function cascadeCells(container) {
    if (!container) return;
    const cells = [...container.querySelectorAll('.cell')];
    cells.forEach((cell, i) => {
      cell.style.setProperty('--ci', i);
      cell.classList.remove('visible');
    });
    container.classList.add('cascading');
    setTimeout(() => {
      container.classList.remove('cascading');
      cells.forEach(cell => cell.classList.add('visible'));
    }, cells.length * 60 + 700);
  }

  // ── Section management ─────────────────────────────────────
  function showSection(id, cascade) {
    // Tell cooking module to clean up if it was open
    events.emit('section:change', { to: id });

    dom.qsa('.masonry, .soon-panel, .ck-section, .h-section').forEach(el => {
      el.classList.remove('active');
      el.style.display = 'none';
    });

    const next = dom.qs('#' + id);
    if (!next) return;

    const isSoon = next.classList.contains('soon-panel');
    next.style.display = isSoon ? 'flex' : 'block';
    next.style.opacity  = '0';

    if (isSoon) {
      next.querySelectorAll('.soon-line').forEach(el => {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
      });
    }

    next.classList.add('active');
    setTimeout(() => { next.style.opacity = '1'; }, 30);
    cascade ? cascadeCells(next) : observeCells(next);
  }

  // ── Pick screen → category ─────────────────────────────────
  const cats       = dom.qsa('.cat');
  const layout     = dom.qs('.layout');
  const pickScreen = dom.qs('#pick-screen');

  if (layout) layout.style.opacity = '0';

  showReveal("this is the part of me that doesn't fit in a CV.", () => {
    if (pickScreen) pickScreen.classList.add('visible');
  });

  dom.qsa('.pick-panel', pickScreen || document).forEach(panel => {
    panel.addEventListener('click', () => {
      const target  = panel.dataset.cat;
      const tagline = panel.dataset.tagline || '';

      dom.qsa('.pick-panel').forEach(p => p.classList.add('closing'));

      setTimeout(() => {
        if (pickScreen) pickScreen.style.display = 'none';
        cats.forEach(b => {
          b.classList.remove('active');
          if (b.dataset.cat === target) b.classList.add('active');
        });
        showReveal(tagline, () => {
          if (layout) {
            layout.classList.add('entering');
            layout.style.transition = 'opacity 0.6s ease';
            layout.style.opacity    = '1';
          }
          showSection(target, true);

          // Reveal bottom sections now that a category has been chosen
          ['.home-loop', '.page-bridge', '.closing'].forEach(sel => {
            const el = dom.qs(sel);
            if (el) el.classList.add('revealed');
          });

          setTimeout(() => layout && layout.classList.remove('entering'), 1200);
        });
      }, 500);
    });
  });

  // ── Category switching (sidebar) ───────────────────────────
  cats.forEach(btn => {
    btn.addEventListener('click', () => {
      const target  = btn.dataset.cat;
      const tagline = btn.dataset.tagline || '';
      cats.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // flash tagline briefly without blocking section load
      if (catReveal && catRevealLine && tagline) {
        catRevealLine.textContent = tagline;
        catReveal.classList.add('show');
        setTimeout(() => catReveal.classList.remove('show'), 1400);
        setTimeout(() => showSection(target, false), 500);
      } else {
        showSection(target, false);
      }
    });
  });

  // ── Lightbox ───────────────────────────────────────────────
  const lightbox = dom.qs('#lightbox');
  const lbImg    = dom.qs('#lb-img');
  const lbClose  = dom.qs('#lb-close');
  const lbPrev   = dom.qs('#lb-prev');
  const lbNext   = dom.qs('#lb-next');
  let lbImages = [], lbIndex = 0;

  const isLightboxOpen = () => !!(lightbox && lightbox.classList.contains('open'));

  function openLightbox(imgs, index) {
    lbImages = imgs; lbIndex = index;
    if (lbImg) lbImg.src = lbImages[lbIndex];
    lightbox && lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox && lightbox.classList.remove('open');
  }

  function showLbImage(rawIndex) {
    if (!lbImages.length || !lbImg) return;
    const newIndex = ((rawIndex % lbImages.length) + lbImages.length) % lbImages.length;
    const dir      = rawIndex > lbIndex ? 1 : -1;
    lbImg.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.6,1), opacity 0.28s ease';
    lbImg.style.transform  = `translateX(${-dir * 55}px)`;
    lbImg.style.opacity    = '0';
    setTimeout(() => {
      lbImg.src             = lbImages[newIndex];
      lbIndex               = newIndex;
      lbImg.style.transition = 'none';
      lbImg.style.transform  = `translateX(${dir * 55}px)`;
      lbImg.style.opacity    = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        lbImg.style.transition = 'transform 0.32s cubic-bezier(0.2,0,0,1), opacity 0.28s ease';
        lbImg.style.transform  = 'translateX(0)';
        lbImg.style.opacity    = '1';
      }));
    }, 280);
  }

  const contentEl = dom.qs('.content');
  if (contentEl) {
    contentEl.addEventListener('click', e => {
      const cell = e.target.closest('.cell');
      if (!cell) return;
      const activeMasonry = dom.qs('.masonry.active:not(.soon-panel)');
      if (!activeMasonry) return;
      const allImgs    = [...activeMasonry.querySelectorAll('.cell img')].map(img => img.src);
      const clickedImg = cell.querySelector('img') && cell.querySelector('img').src;
      if (clickedImg) openLightbox(allImgs, allImgs.indexOf(clickedImg));
    });
  }

  if (lbClose)  lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  if (lbPrev)   lbPrev.addEventListener('click', e => { e.stopPropagation(); showLbImage(lbIndex - 1); });
  if (lbNext)   lbNext.addEventListener('click', e => { e.stopPropagation(); showLbImage(lbIndex + 1); });

  document.addEventListener('keydown', e => {
    if (!isLightboxOpen()) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showLbImage(lbIndex - 1);
    if (e.key === 'ArrowRight') showLbImage(lbIndex + 1);
  });

  // ── Mouse tracking (throttled) ────────────────────────────
  let mouseX = 0, mouseY = 0;
  let tGlowX  = window.innerWidth / 2;
  let tGlowY  = window.innerHeight / 2;
  const cursorDot = dom.qs('.cursor-dot');

  document.addEventListener('mousemove', throttle(e => {
    mouseX  = e.clientX;
    mouseY  = e.clientY;
    tGlowX  = e.clientX;
    tGlowY  = e.clientY;
    if (cursorDot) {
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top  = mouseY + 'px';
    }
  }, 16));

  // ── Cursor ring ────────────────────────────────────────────
  const cursorRing = dom.qs('.cursor-ring');
  let ringX = 0, ringY = 0;

  // ── Cursor glow (desktop only) ─────────────────────────────
  const cursorGlow = !isTouch ? document.createElement('div') : null;
  if (cursorGlow) { cursorGlow.className = 'cursor-glow'; document.body.appendChild(cursorGlow); }
  let glowX = tGlowX, glowY = tGlowY;

  // ── Ambient particles ──────────────────────────────────────
  const pCanvas = document.createElement('canvas');
  pCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;';
  document.body.insertBefore(pCanvas, document.body.firstChild);
  const pCtx = pCanvas.getContext('2d');

  function resizePCanvas() {
    pCanvas.width  = window.innerWidth;
    pCanvas.height = window.innerHeight;
  }
  resizePCanvas();
  window.addEventListener('resize', resizePCanvas);

  const ptcls = Array.from({ length: 120 }, () => ({
    x:  Math.random() * window.innerWidth,
    y:  Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -(Math.random() * 0.28 + 0.08),
    r:  Math.random() * 1.1 + 0.4,
    a:  Math.random() * 0.28 + 0.07,
  }));

  // ── Single merged RAF task: ring + glow + particles ────────
  raf.add('human-ui', () => {
    // cursor ring lerp
    if (cursorRing) {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top  = ringY + 'px';
    }

    // glow lerp
    glowX += (tGlowX - glowX) * 0.07;
    glowY += (tGlowY - glowY) * 0.07;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top  = glowY + 'px';

    // particles
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    for (let i = 0; i < ptcls.length; i++) {
      const p = ptcls[i];
      p.x += p.vx; p.y += p.vy;
      if (p.y < -4)                    { p.y = pCanvas.height + 4; p.x = Math.random() * pCanvas.width; }
      if (p.x < -4)                      p.x = pCanvas.width + 4;
      if (p.x > pCanvas.width + 4)       p.x = -4;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(196,180,154,${p.a})`;
      pCtx.fill();
    }
  });

  // ── Ring expand on interactive elements ───────────────────
  dom.qsa('a, button, .cell').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing && cursorRing.classList.add('expand'));
    el.addEventListener('mouseleave', () => cursorRing && cursorRing.classList.remove('expand'));
  });

  // ── Nav + pick-back → portal ───────────────────────────────
  dom.qsa('.nav-back, .nav-name, .pick-back').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      portal('index.html', '#f0ebe0', e.clientX, e.clientY);
    });
  });

  // ── Text scramble ──────────────────────────────────────────
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&';

  function scrambleEl(el) {
    const original = el.dataset.original || (el.dataset.original = el.textContent);
    if (el._scrambleTimer) { clearInterval(el._scrambleTimer); el._scrambleTimer = null; }
    let frame = 0, total = 16;
    el._scrambleTimer = setInterval(() => {
      el.textContent = original.split('').map((ch, i) => {
        if (ch === ' ' || ch === '.' || ch === '←') return ch;
        if (frame / total > i / original.length) return ch;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');
      if (++frame > total) {
        el.textContent = original;
        clearInterval(el._scrambleTimer);
        el._scrambleTimer = null;
      }
    }, 32);
  }

  dom.qsa('.cat-label, .nav-back, .nav-name').forEach(el => {
    el.addEventListener('mouseenter', () => scrambleEl(el));
  });

  // ── Magnetic pull on sidebar buttons ──────────────────────
  cats.forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.28;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.28;
      btn.style.transform = `translate(${dx}px,${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.5s cubic-bezier(0.2,0,0,1),border-color 0.4s,color 0.4s,background 0.4s';
      btn.style.transform  = '';
      setTimeout(() => { btn.style.transition = ''; }, 500);
    });
  });

  // ── Typewriter on category label ──────────────────────────
  let _typeTimer = null;
  function typeLabel(el) {
    if (!el) return;
    const txt = el.textContent;
    el.textContent = '';
    let i = 0;
    if (_typeTimer) { clearInterval(_typeTimer); _typeTimer = null; }
    _typeTimer = setInterval(() => {
      el.textContent = txt.slice(0, ++i);
      if (i >= txt.length) { clearInterval(_typeTimer); _typeTimer = null; }
    }, 55);
  }
  cats.forEach(btn => {
    btn.addEventListener('click', () => setTimeout(() => typeLabel(btn.querySelector('.cat-label')), 100));
  });

  // ── Home-loop (bottom bar) ─────────────────────────────────
  const homeLoop = dom.qs('.home-loop');
  const hlLeft   = dom.qs('#hl-left');
  const hlRight  = dom.qs('#hl-right');

  if (homeLoop && hlLeft && hlRight) {
    let hlTimer = null;
    function expandHl(add, remove) {
      clearTimeout(hlTimer);
      homeLoop.classList.remove(remove);
      homeLoop.classList.add(add);
      hlTimer = setTimeout(() => homeLoop.classList.remove(add), 5000);
    }
    hlLeft.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        if (homeLoop.classList.contains('hl-touch-left')) { clearTimeout(hlTimer); portal('matrix.html', '#f0ebe0', e.clientX, e.clientY); }
        else expandHl('hl-touch-left', 'hl-touch-right');
      } else {
        portal('matrix.html', '#f0ebe0', e.clientX, e.clientY);
      }
    });
    hlRight.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        // Reset closing state on panels
        dom.qsa('.pick-panel').forEach(p => p.classList.remove('closing'));
        // Re-show pick screen
        if (pickScreen) {
          pickScreen.style.display = '';
          pickScreen.classList.remove('visible');
          void pickScreen.offsetHeight; // force reflow so animation re-triggers
          pickScreen.classList.add('visible');
        }
        // Hide layout until they pick again
        if (layout) layout.style.opacity = '0';
      }, 350);
    });
  }

  // ── Triple-click profile image → mind entry (desktop only) ──
  if (!isTouch) {
    let mindClicks = 0, mindTimer = null;
    const hlProfileImg = dom.qs('.hl-profile');
    if (hlProfileImg) {
      hlProfileImg.addEventListener('click', e => {
        e.stopPropagation();
        clearTimeout(mindTimer);
        if (++mindClicks >= 3) {
          mindClicks = 0;
          window.SecretWord.showMindEntry(true);
        } else {
          mindTimer = setTimeout(() => { mindClicks = 0; }, 1800);
        }
      });
    }
  }

  // ── Secret word ────────────────────────────────────────────
  window.SecretWord.init({
    isBlocked: () => isLightboxOpen(),
  });

})();
