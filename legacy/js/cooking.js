(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  //  ADD YOUR FOOD MOMENTS HERE
  //
  //  1. Put images in  images/cooking/  folder
  //  2. Add entries:
  //       {
  //         src:   'images/cooking/filename.png',
  //         hover: 'one line — what you felt',        ← shown on card (Arabic ok)
  //         text:  ['line one', 'line two'],           ← shown when expanded (1–2 lines)
  //       }
  // ─────────────────────────────────────────────────────────────────
  const MOMENTS = [
    {
      src:   'images/cooking/1.png',
      hover: 'يمكن اول مره اسوي شي بالمطبخ وحدي',
      text:  ['وهذا الكلاص حرفيا حبيته وكالعادة هيجي نهايات ويه الاشياء الأحبها '],
    },
    {
      src:   'images/cooking/2.png',
      hover: 'واهنا حسيت سويت ماعون بسعر $69',
      text:  ['طبعا سويته واني عايد مادة مرتين ورسبت بيها (حسيت نفسي غبي بشكل مخيف)'],
    },
    {
      src:   'images/cooking/3.png',
      hover: 'الطعم يجنن صراحه ',
      text:  ['بس عرفت ليش نحتاج female touch '],
    },
    {
      src:   'images/cooking/4.png',
      hover: 'واهنا عرفت لازم ابدي اصور اكثر ',
      text:  ['...'],
    },
    {
      src:   'images/cooking/5.png',
      hover: 'the pic changes when ur friend is black and white',
      text:  ['but i still feel like the same idiot who can only make 2 dishes and burns everything'],
    },
    {
      src:   'images/cooking/6.png',
      hover: 'and here i was really proud of myself for making something that looks like the original recipe',
      text:  ['but it tasted like garbage and i had to throw it away after one bite'],
    },
    {
      src:   'images/cooking/7.png',
      hover: 'its not even that bad but it just looks so sad and pathetic and i cant even look at it without feeling like a failure',
      text:  ['i just want to be good at something and cooking is supposed to be fun but it just makes me feel like a useless piece of trash who cant even boil water without burning it'],
    },
  ];
  // ─────────────────────────────────────────────────────────────────

  let expanded = -1;
  let section  = null;
  let overlay  = null;
  let isActive = false;   // true only while the cooking section is shown

  // ── Build the grid (runs once) ────────────────────────────
  function buildGrid() {
    section = document.getElementById('cooking');
    if (!section || section.dataset.built) return;
    section.dataset.built = '1';

    const grid = document.createElement('div');
    grid.className = 'ck-grid';

    MOMENTS.forEach((m, i) => {
      const card  = document.createElement('div');
      card.className = 'ck-card';

      const rot   = (Math.random() - 0.5) * 3;
      const nudge = (Math.random() - 0.5) * 12;
      card.style.setProperty('--rot',   `${rot.toFixed(2)}deg`);
      card.style.setProperty('--nudge', `${nudge.toFixed(1)}px`);
      if (i % 3 === 1) card.classList.add('ck-wide');

      const img   = document.createElement('img');
      img.src     = m.src;
      img.alt     = '';
      img.loading = 'lazy';

      const label = document.createElement('span');
      label.className   = 'ck-label';
      label.textContent = m.hover;

      const hint = document.createElement('span');
      hint.className = 'ck-hint';

      card.append(img, label, hint);
      card.addEventListener('click', () => openMoment(i));
      grid.appendChild(card);
    });

    section.appendChild(grid);

    // Full-screen overlay
    overlay = document.createElement('div');
    overlay.id = 'ck-overlay';
    overlay.innerHTML = `
      <div class="ck-exp-inner">
        <img class="ck-exp-img" src="" alt="">
        <div class="ck-exp-text"></div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeMoment(); });
    overlay.addEventListener('wheel', e => {
      e.preventDefault();
      if (expanded < 0) return;
      const next = e.deltaY > 0
        ? (expanded + 1) % MOMENTS.length
        : (expanded - 1 + MOMENTS.length) % MOMENTS.length;
      openMoment(next);
    }, { passive: false });
    document.body.appendChild(overlay);
  }

  // ── Open / close a moment ─────────────────────────────────
  function openMoment(i) {
    if (!overlay) return;
    const m   = MOMENTS[i];
    expanded  = i;

    const img = overlay.querySelector('.ck-exp-img');
    const txt = overlay.querySelector('.ck-exp-text');
    if (img) img.src = m.src;
    if (txt) txt.innerHTML = m.text.map(l => `<p>${l}</p>`).join('');

    overlay.classList.add('open');
    document.querySelectorAll('.ck-card').forEach((c, idx) =>
      c.classList.toggle('ck-active', idx === i));
  }

  function closeMoment() {
    if (!overlay) return;
    expanded = -1;
    overlay.classList.remove('open');
    document.querySelectorAll('.ck-card').forEach(c => c.classList.remove('ck-active'));
  }

  // ── Keyboard — only fires when cooking section is active ──
  document.addEventListener('keydown', e => {
    if (!isActive) return;
    if (expanded < 0) {
      if (e.key === 'Escape') deactivate();
      return;
    }
    if (e.key === 'Escape')     closeMoment();
    if (e.key === 'ArrowRight') openMoment((expanded + 1) % MOMENTS.length);
    if (e.key === 'ArrowLeft')  openMoment((expanded - 1 + MOMENTS.length) % MOMENTS.length);
  });

  // ── Activate / deactivate section ────────────────────────
  function activate() {
    buildGrid();
    isActive = true;
    if (section) {
      section.style.display = 'block';
      section.classList.add('active');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        section.classList.add('ck-revealed');
      }));
    }
  }

  function deactivate() {
    isActive = false;
    closeMoment();
    if (section) {
      section.classList.remove('ck-revealed', 'active');
    }
  }

  // ── Listen for section changes from human.js ─────────────
  // If Core is available use the event bus; otherwise fall back to
  // a MutationObserver watching the section's active class.
  if (window.Core) {
    window.Core.events.on('section:change', ({ to }) => {
      if (to !== 'cooking') deactivate();
    });
  }

  // ── Entry from pick screen ────────────────────────────────
  function enterFromPick() {
    buildGrid();

    const pickScreen  = document.getElementById('pick-screen');
    const catReveal   = document.getElementById('cat-reveal');
    const catLine     = document.getElementById('cat-reveal-line');
    const layout      = document.querySelector('.layout');
    const tagline     = 'things i made. things i felt.';

    document.querySelectorAll('.pick-panel').forEach(p => p.classList.add('closing'));
    document.querySelectorAll('.cat').forEach(b => b.classList.remove('active'));
    const cookBtn = document.querySelector('.cat-cooking');
    if (cookBtn) cookBtn.classList.add('active');

    setTimeout(() => {
      if (pickScreen) pickScreen.style.display = 'none';

      document.querySelectorAll('.masonry, .soon-panel, .ck-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
      });

      if (layout) {
        layout.classList.add('entering');
        layout.style.transition = 'opacity 0.6s ease';
        layout.style.opacity    = '1';
      }

      // Show the tagline reveal (was missing before)
      if (catReveal && catLine) {
        catLine.textContent = tagline;
        catReveal.classList.add('show');
        setTimeout(() => {
          catReveal.classList.remove('show');
          setTimeout(() => {
            activate();
            if (layout) setTimeout(() => layout.classList.remove('entering'), 1200);
          }, 500);
        }, 1600);
      } else {
        activate();
        if (layout) setTimeout(() => layout.classList.remove('entering'), 1200);
      }
    }, 500);
  }

  // ── Entry from sidebar cat button ─────────────────────────
  function enterFromCat() {
    const catReveal = document.getElementById('cat-reveal');
    const catLine   = document.getElementById('cat-reveal-line');

    document.querySelectorAll('.masonry, .soon-panel, .ck-section, .h-section').forEach(el => {
      el.classList.remove('active');
      el.style.display = 'none';
    });

    document.querySelectorAll('.cat').forEach(b => b.classList.remove('active'));
    if (catBtn) catBtn.classList.add('active');

    if (catReveal && catLine) {
      catLine.textContent = 'things i made. things i felt.';
      catReveal.classList.add('show');
      setTimeout(() => catReveal.classList.remove('show'), 1400);
      setTimeout(() => activate(), 500);
    } else {
      activate();
    }
  }

  // ── Wire buttons ──────────────────────────────────────────
  const catBtn   = document.querySelector('.cat-cooking');
  const pickPanel = document.querySelector('.pick-cooking');

  if (catBtn) {
    catBtn.addEventListener('click', e => {
      e.stopPropagation();
      enterFromCat();
    }, true);
  }

  if (pickPanel) {
    pickPanel.addEventListener('click', e => {
      e.stopPropagation();
      enterFromPick();
    }, true);
  }

})();
