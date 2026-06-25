(function () {
  'use strict';

  /* ── Audio context (lazy, unlocked on first interaction) ───── */
  let audioCtx     = null;
  let ambientGain  = null;
  let audioReady   = false;

  function getCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx || null;
  }

  function unlockAudio() {
    if (audioReady) return;
    const ctx = getCtx();
    if (!ctx) return;
    audioReady = true;
    startAmbient(ctx);
    scheduleAtmosphericEvents(ctx);
  }

  /* ── Ambient archive hum ─────────────────────────────────────── */
  function startAmbient(ctx) {
    if (ambientGain) return;
    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0;
    ambientGain.connect(ctx.destination);

    // Low tone clusters
    [42, 84, 168].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.014 / (i + 1);
      osc.connect(g).connect(ambientGain);
      osc.start();
    });

    // Ventilation noise
    const nLen = ctx.sampleRate * 4;
    const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nd   = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = nBuf; nSrc.loop = true;
    const nFlt = ctx.createBiquadFilter();
    nFlt.type = 'lowpass'; nFlt.frequency.value = 200;
    const nG = ctx.createGain(); nG.gain.value = 0.005;
    nSrc.connect(nFlt).connect(nG).connect(ambientGain);
    nSrc.start();

    ambientGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);
  }

  function scheduleAtmosphericEvents(ctx) {
    const delay = 30000 + Math.random() * 35000;
    setTimeout(() => {
      if (!audioReady) return;
      const r = Math.random();
      if      (r < 0.35) sndClick(ctx, 0.055);
      else if (r < 0.65) sndProjectorRattle(ctx);
      else               sndDistantSlam(ctx);
      scheduleAtmosphericEvents(ctx);
    }, delay);
  }

  /* ── Sound primitives ──────────────────────────────────────── */
  function sndClick(ctx, vol) {
    if (!ctx) return;
    const len = ctx.sampleRate * 0.042;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.007));
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol || 0.18;
    src.connect(g).connect(ctx.destination); src.start();
  }

  function sndBoom(ctx) {
    if (!ctx) return;
    const dur = 1.6;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(68, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(16, ctx.currentTime + dur);
    g.gain.setValueAtTime(0.17, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
    // noise layer
    const nLen = ctx.sampleRate * dur;
    const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = Math.random()*2-1;
    const nSrc = ctx.createBufferSource(); nSrc.buffer = nBuf;
    const nF = ctx.createBiquadFilter(); nF.type = 'lowpass'; nF.frequency.value = 110;
    const nG = ctx.createGain();
    nG.gain.setValueAtTime(0.07, ctx.currentTime);
    nG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    nSrc.connect(nF).connect(nG).connect(ctx.destination); nSrc.start();
  }

  function sndProjectorStart(ctx) {
    if (!ctx) return;
    let t = ctx.currentTime + 0.05; let interval = 0.22; const end = t + 1.3;
    while (t < end) {
      const len = ctx.sampleRate * 0.022;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.004));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); g.gain.value = 0.13;
      src.connect(g).connect(ctx.destination); src.start(t);
      interval = Math.max(0.033, interval * 0.77); t += interval;
    }
  }

  function sndElevatorMove(ctx) {
    if (!ctx) return;
    const dur = 1.3;
    const osc = ctx.createOscillator(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 50;
    f.type = 'lowpass'; f.frequency.value = 85;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.058, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.058, ctx.currentTime + dur - 0.22);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.connect(f).connect(g).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
  }

  function sndDing(ctx) {
    if (!ctx) return;
    [[880, 0.26, 2.2],[2418, 0.085, 0.9]].forEach(([freq, vol, dur]) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(g).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
    });
  }

  function sndProjectorRattle(ctx) {
    if (!ctx) return;
    for (let i = 0; i < 6; i++) {
      const len = ctx.sampleRate * 0.018;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let j = 0; j < len; j++) d[j] = (Math.random()*2-1) * 0.5;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); g.gain.value = 0.035 + Math.random() * 0.03;
      src.connect(g).connect(ctx.destination);
      src.start(ctx.currentTime + i * (0.1 + Math.random() * 0.09));
    }
  }

  function sndDistantSlam(ctx) {
    if (!ctx) return;
    const len = ctx.sampleRate * 0.65;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.08));
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const g = ctx.createGain(); g.gain.value = 0.055;
    src.connect(f).connect(g).connect(ctx.destination); src.start();
  }

  /* ── Chapter data ─────────────────────────────────────────── */
  const CHAPTERS = [
    { cat:'photography', roman:'I',   num:'01', label:'CHAPTER I',   title:'Photography',    tagline:'to remember. because some things are too beautiful to just walk past.' },
    { cat:'posters',     roman:'II',  num:'02', label:'CHAPTER II',  title:'Posters',        tagline:'life taught me something. I made a poster about it.' },
    { cat:'patterns',    roman:'III', num:'03', label:'CHAPTER III', title:'Graphics',       tagline:'this is what I do. grids, shapes, and making things feel right.' },
    { cat:'music',       roman:'IV',  num:'04', label:'CHAPTER IV',  title:'Music',          tagline:'what I had on repeat. the songs that stayed.' },
    { cat:'cooking',     roman:'V',   num:'05', label:'CHAPTER V',   title:'Food Decisions', tagline:'things i made. things i felt.' },
    { cat:'3d',          roman:'VI',  num:'06', label:'CHAPTER VI',  title:'3D',             tagline:'geometry and I are still figuring each other out.' },
  ];

  /* ── DOM refs ─────────────────────────────────────────────── */
  const archiveHall  = document.getElementById('archive-hall');
  const transOverlay = document.getElementById('trans-overlay');
  const chapterCard  = document.getElementById('chapter-card');
  const elevatorEl   = document.getElementById('elevator-overlay');
  const elCounter    = document.getElementById('el-counter');
  const elStatus     = document.getElementById('el-status');
  const lightLeak    = document.querySelector('.cc-light-leak');
  const bgNumeral    = document.querySelector('.ah-bg-numeral');
  const layout       = document.querySelector('.layout');
  const catBtns      = document.querySelectorAll('.cat');
  const pickScreen   = document.getElementById('pick-screen');

  let currentFloor  = '00';
  let insideChapter = false;
  const visited     = new Set();
  const navBack     = document.querySelector('.nav-back');

  /* ── Nav-back: return to archive when inside a chapter ───────── */
  if (navBack) {
    navBack.addEventListener('click', e => {
      if (!insideChapter) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      returnToArchive();
    }, true); // capture phase fires before human.js bubble listener
  }

  function returnToArchive() {
    sndBoom(getCtx());
    trans('visible');
    setTimeout(() => {
      trans('hold');
      if (layout) layout.style.opacity = '0';
      archiveHall.classList.add('visible');
      insideChapter  = false;
      currentFloor   = '00'; // reset to lobby so next chapter always ascends from 00
      if (navBack) navBack.textContent = '← home';
      setTimeout(() => trans('fading'), 80);
    }, 700);
  }

  /* ── Intercept pick-screen, show archive hall instead ──────── */
  if (pickScreen) {
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class' && pickScreen.classList.contains('visible')) {
          pickScreen.classList.remove('visible');
          pickScreen.style.display = 'none';
          obs.disconnect();
          if (archiveHall) archiveHall.classList.add('visible');
          break;
        }
      }
    });
    obs.observe(pickScreen, { attributes: true });
  }

  /* ── Chapter hover: update background numeral ─────────────── */
  const chapterEls = document.querySelectorAll('.ah-chapter');
  chapterEls.forEach(ch => {
    ch.addEventListener('mouseenter', () => {
      const d = CHAPTERS.find(c => c.cat === ch.dataset.cat);
      if (d && bgNumeral) bgNumeral.textContent = d.roman;
      unlockAudio();
      sndClick(getCtx(), 0.07);
    });
    ch.addEventListener('click', () => {
      const d = CHAPTERS.find(c => c.cat === ch.dataset.cat);
      if (d) enterChapter(d);
    });
  });

  /* ── Chapter entry sequence ───────────────────────────────── */
  function enterChapter(data) {
    unlockAudio();
    const ctx = getCtx();
    sndClick(ctx, 0.22);

    // 1. Fade to black
    trans('visible');
    setTimeout(() => {
      archiveHall.classList.remove('visible');
      trans('hold');
      showChapterCard(data, ctx);
    }, 720);
  }

  function showChapterCard(data, ctx) {
    document.querySelector('.cc-ch-label').textContent   = data.label;
    document.querySelector('.cc-ch-title').textContent   = data.title;
    document.querySelector('.cc-ch-tagline').textContent = data.tagline;

    chapterCard.classList.add('visible');
    setTimeout(() => sndProjectorStart(ctx), 240);
    if (lightLeak) {
      setTimeout(() => { lightLeak.classList.add('flash'); }, 450);
      setTimeout(() => { lightLeak.classList.remove('flash'); }, 1900);
    }

    // After 4.5s: card exits → elevator (long enough to actually read)
    setTimeout(() => {
      chapterCard.classList.remove('visible');
      setTimeout(() => { trans('fading'); startElevator(data, ctx); }, 600);
    }, 4500);
  }

  function startElevator(data, ctx) {
    const fromNum = currentFloor;
    const toNum   = data.num;

    document.getElementById('el-from').textContent = fromNum;
    document.getElementById('el-to').textContent   = toNum;
    elCounter.textContent = fromNum;
    elCounter.classList.remove('arrived', 'tick');
    elStatus.textContent  = 'ASCENDING';
    elStatus.classList.remove('arrived');

    elevatorEl.classList.add('visible', 'moving');
    setTimeout(() => sndElevatorMove(ctx), 150);

    const from  = parseInt(fromNum, 10);
    const to    = parseInt(toNum,   10);
    const steps = Math.abs(to - from) || 1;
    const step  = Math.min(420, Math.max(150, 1300 / steps));

    let cur = from;
    const tick = () => {
      cur++;
      const label = cur < 10 ? '0' + cur : '' + cur;
      elCounter.textContent = label;
      elCounter.classList.remove('tick');
      void elCounter.offsetWidth;
      elCounter.classList.add('tick');
      sndClick(ctx, 0.055);

      if (cur < to) {
        setTimeout(tick, step);
      } else {
        // Arrived
        elevatorEl.classList.remove('moving');
        elCounter.classList.add('arrived');
        elStatus.textContent = 'ARRIVED';
        elStatus.classList.add('arrived');
        currentFloor = toNum;
        setTimeout(() => sndDing(ctx), 80);

        // Pause at arrival floor, then fade to black → reveal content → fade in
        setTimeout(() => {
          trans('visible');
          setTimeout(() => {
            elevatorEl.classList.remove('visible');
            trans('hold');
            revealContent(data.cat, () => {
              setTimeout(() => trans('fading'), 320);
            });
          }, 620);
        }, 2000);
      }
    };
    setTimeout(tick, 460);
  }

  /* ── Reveal content ──────────────────────────────────────── */
  function revealContent(catId, onDone) {
    visited.add(catId);
    insideChapter = true;
    if (navBack) navBack.textContent = '← archive';

    // Suppress cat-reveal since we showed the chapter card
    const catReveal = document.getElementById('cat-reveal');
    if (catReveal) catReveal.style.visibility = 'hidden';

    // Activate sidebar button (triggers human.js / cooking.js section logic)
    catBtns.forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.cat[data-cat="${catId}"]`);
    if (btn) setTimeout(() => btn.click(), 40);

    // Show layout
    if (layout) {
      layout.style.opacity = '0';
      layout.classList.add('entering');
      layout.style.transition = 'opacity 0.9s ease';
      setTimeout(() => { layout.style.opacity = '1'; }, 200);
      setTimeout(() => layout.classList.remove('entering'), 1400);
    }

    // Reveal bottom sections + restore cat-reveal
    setTimeout(() => {
      ['.home-loop', '.page-bridge', '.closing'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.classList.add('revealed');
      });
      if (catReveal) catReveal.style.visibility = '';
      if (onDone) onDone();
    }, 900);
  }

  /* ── Transition helper ───────────────────────────────────── */
  function trans(state) {
    transOverlay.classList.remove('visible', 'hold', 'fading');
    if (state) transOverlay.classList.add(state);
  }

  /* ── Final scene ─────────────────────────────────────────── */
  const homeLoop = document.querySelector('.home-loop');
  if (homeLoop) {
    let finalTriggered = false;
    const obs = new IntersectionObserver(entries => {
      if (finalTriggered) return;
      if (entries[0].isIntersecting && visited.size >= 2) {
        finalTriggered = true;
        obs.disconnect();
        setTimeout(() => triggerFinalScene(), 2800);
      }
    }, { threshold: 0.5 });
    obs.observe(homeLoop);
  }

  function triggerFinalScene() {
    const ctx   = getCtx();
    const scene = document.getElementById('final-scene');
    if (!scene) return;

    // Mark visited chapters in status list
    scene.querySelectorAll('.fs-status-item[data-cat]').forEach(item => {
      if (visited.has(item.dataset.cat)) item.classList.add('visited');
    });

    scene.style.opacity = '0';
    scene.style.transition = 'none';
    scene.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scene.style.transition = 'opacity 1.5s ease';
      scene.style.opacity    = '1';
    }));

    const statusEl  = scene.querySelector('.fs-status');
    const items     = scene.querySelectorAll('.fs-status-item');
    const completeEl = scene.querySelector('.fs-complete');
    const nextEl    = scene.querySelector('.fs-next');
    const endEl     = scene.querySelector('.fs-end');

    // Stage 1: archive status
    items.forEach((item, i) => {
      setTimeout(() => {
        item.style.opacity    = '1';
        item.style.transition = 'opacity 0.6s ease';
        sndClick(ctx, 0.05);
      }, i * 300 + 800);
    });

    const statusDur = items.length * 300 + 1800;

    // Stage 2: MEMORY ARCHIVE COMPLETE
    setTimeout(() => {
      if (statusEl) { statusEl.style.opacity = '0'; statusEl.style.transition = 'opacity 1s ease'; }
      setTimeout(() => {
        if (completeEl) { completeEl.style.opacity = '1'; completeEl.style.transition = 'opacity 1.4s ease'; }

        // Stage 3: THE NEXT CHAPTER
        setTimeout(() => {
          if (completeEl) { completeEl.style.opacity = '0'; }
          setTimeout(() => {
            if (nextEl) { nextEl.style.opacity = '1'; nextEl.style.transition = 'opacity 1.4s ease'; sndDing(ctx); }

            // Stage 4: 2026 — |
            setTimeout(() => {
              if (nextEl) { nextEl.style.opacity = '0'; nextEl.style.transition = 'opacity 1.1s ease'; }
              setTimeout(() => {
                if (endEl) { endEl.style.opacity = '1'; endEl.style.transition = 'opacity 1.5s ease'; }
              }, 1100);
            }, 3600);
          }, 1100);
        }, 3200);
      }, 1100);
    }, statusDur);
  }

  /* ── Disable magnetic pull on text-style sidebar buttons ─────── */
  // archive.js attaches these AFTER human.js, so in same-element
  // listener order they fire last and clear the transform
  catBtns.forEach(btn => {
    btn.addEventListener('mousemove', () => { btn.style.transform = 'none'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

})();
