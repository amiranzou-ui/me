(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  //  ADD YOUR MUSIC
  //
  //  1. Put audio files inside the project folder:  music/
  //  2. Example path:  music/your-song.mp3
  //  3. Supported types:  .mp3  .ogg  .wav  .m4a
  //  3. Add an entry:
  //       { src: 'music/file.mp3', fragment: 'your memory here',
  //         title: 'Song Name', artist: 'Artist' }
  // ─────────────────────────────────────────────────────────────────
  const PLAYLIST = [
    {
      src: 'music/in the mood to love.mp3',
      mood: 'quiet',
      fragment: 'your memory here',
      title: 'In the Mood to Love',
      artist: 'Unknown Artist',
      year: 'Archive 01',
      side: 'Side A',
      room: 'Listening Room',
      note: 'A note kept warm in the dark. Needle down. Lamp low. Let the room remember before you do.',
    },
    {
      src: 'music/what-falling-in-love-feels-like.mp3',
      mood: 'quiet',
      fragment: 'what falling in love feels like',
      title: 'What Falling in Love Feels Like',
      artist: 'Unknown Artist',
      year: 'Archive 02',
      side: 'Side B',
      room: 'Listening Room',
      note: 'A softer room. A slower heartbeat. The kind of song that changes the air around it.',
    },
    // { src: 'music/your-file.mp3', fragment: 'your memory here', title: '...', artist: '...' },
  ];
  // ─────────────────────────────────────────────────────────────────

  const PRESENCE = [
    "i didn't skip this one",
    "this felt different back then",
    "i remember where i was",
    "some things don't need words",
    "still not sure why this stayed",
    "yeah. that.",
    "it was playing when —",
    "i kept this one",
  ];

  const TRACK_KEY = 'music_track_v1';

  const MOODS = {
    arabic:  { label: 'Arabic',  color: '#c4a06a', room: 'The Sharqi Room',   desc: 'When the oud speaks, the heart answers.' },
    quiet:   { label: 'Quiet',   color: '#8baab8', room: 'After Midnight',    desc: 'The hour when rooms remember themselves.' },
    english: { label: 'English', color: '#c4b49a', room: 'The Archive',       desc: 'Songs kept in a box under the bed.' },
    dancing: { label: 'Dancing', color: '#c4622d', room: 'Moving Alone',      desc: 'When the body knows before the mind does.' },
    jazz:    { label: 'Jazz',    color: '#7a8fc4', room: 'The Blue Hour',     desc: 'Smoke and brass and something unfinished.' },
    turkish: { label: 'Turkish', color: '#c4806a', room: 'The Bosphorus',     desc: "Melodies that cross water and don't come back." },
  };

  // ── State ─────────────────────────────────────────────
  let trackIdx      = loadSavedTrackIndex();
  let isPlaying     = false;
  let isOpen        = false;
  let plVisible     = false;
  let hasInteracted = false;
  let isIdle        = false;
  let lastActivity  = Date.now();
  let lastFrame     = Date.now();
  let listenTime    = 0;
  let presencePool  = shuffle([...PRESENCE]);
  let presenceActive = false;
  let presenceNextAt = 10000 + rand(7000);
  let activeMood = null;
  let moodDescEl = null, moodWatermarkEl = null, moodCountEl = null;

  // Vinyl — realistic spin with momentum
  let spinAngle   = 0;
  let spinSpeed   = 0;          // current deg/frame
  const SPIN_MAX  = 0.95;       // target speed when playing (deg/frame ≈ 33 RPM feel)
  let tiltX = 18, tiltY = -6, targetTiltX = 18, targetTiltY = -6;
  let breathPhase = 0;
  let glitchActive = false, glitchX = 0, glitchY = 0;
  let glitchTimer = null;

  // Visualizer
  let vizDist = 0, targetVizDist = 0;   // distortion 0–1
  let vizColl = 0, targetVizColl = 0;   // collapse  0–1
  let vizTimer = null;

  // ── Audio ─────────────────────────────────────────────
  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
  audio.volume = 0;
  audio.playsInline = true;
  audio.style.display = 'none';
  audio.setAttribute('aria-hidden', 'true');

  if (document.body && !document.body.contains(audio)) {
    document.body.appendChild(audio);
  }

  let analyser = null, freqData = null;
  let shouldResumeAfterHidden = false;
  let sfxCtx = null;
  let tonearmNoiseBuffer = null;

  function loadSavedTrackIndex() {
    const raw = parseInt(localStorage.getItem(TRACK_KEY) || '0', 10);
    if (Number.isFinite(raw) && raw >= 0 && raw < PLAYLIST.length) return raw;
    return 0;
  }

  function saveTrackIndex() {
    localStorage.setItem(TRACK_KEY, String(trackIdx));
  }

  function initAnalyser() {
    // Intentionally disabled: routing the main track through Web Audio
    // makes background playback less reliable across tabs/apps.
    analyser = null;
    freqData = null;
  }

  function ensureSfxCtx() {
    try {
      if (!sfxCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        sfxCtx = new Ctx();
      }
      if (sfxCtx.state === 'suspended') sfxCtx.resume().catch(() => {});
      if (!tonearmNoiseBuffer) {
        const len = Math.floor(sfxCtx.sampleRate * 0.18);
        tonearmNoiseBuffer = sfxCtx.createBuffer(1, len, sfxCtx.sampleRate);
        const data = tonearmNoiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t * 0.65);
        }
      }
      return sfxCtx;
    } catch (e) {
      return null;
    }
  }

  function playTonearmSfx(kind) {
    const ctx = ensureSfxCtx();
    if (!ctx) return;

    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(kind === 'on' ? 0.06 : 0.045, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'on' ? 0.16 : 0.13));
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = tonearmNoiseBuffer;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(kind === 'on' ? 1850 : 1350, now);
    band.Q.setValueAtTime(0.7, now);

    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.setValueAtTime(kind === 'on' ? 620 : 420, now);

    noise.connect(band);
    band.connect(high);
    high.connect(master);
    noise.start(now);
    noise.stop(now + (kind === 'on' ? 0.11 : 0.09));

    const thunk = ctx.createOscillator();
    const thunkGain = ctx.createGain();
    thunk.type = 'triangle';
    thunk.frequency.setValueAtTime(kind === 'on' ? 170 : 145, now);
    thunk.frequency.exponentialRampToValueAtTime(kind === 'on' ? 92 : 78, now + 0.07);
    thunkGain.gain.setValueAtTime(0.0001, now);
    thunkGain.gain.exponentialRampToValueAtTime(kind === 'on' ? 0.022 : 0.016, now + 0.006);
    thunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    thunk.connect(thunkGain);
    thunkGain.connect(master);
    thunk.start(now);
    thunk.stop(now + 0.09);
  }

  function syncMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      const track = PLAYLIST[trackIdx] || {};
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Untitled',
        artist: track.artist || 'Unknown Artist',
        album: 'Listening Room',
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('seekbackward', () => seekBy(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => seekBy(10));
      navigator.mediaSession.setActionHandler('previoustrack', () => goPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => goNext());
    } catch (e) {}
  }

  // ── DOM refs ──────────────────────────────────────────
  let capsule = null, backdrop = null, disc3d = null;
  let canvas = null, ctx2d = null;
  let fragmentEl = null, presenceEl = null;
  let controlsEl = null, playBtn = null, fillEl = null;
  let currentTimeEl = null, durationEl = null;
  let fragmentsEl = null;
  let tonearmEl = null;           // the arm element that swings
  let roomTitleEl = null, roomArtistEl = null, roomNoteEl = null;
  let roomYearEl = null, roomSideEl = null, roomRoomEl = null;
  let rafId = null, ctrlTimer = null;
  let catEq = null;
  let pendingLoadHandler = null;  // tracks the active loadedmetadata listener
  let autoNextTimer = null;       // handle for autoNext's delayed loadTrack
  let _manualSelect = false;      // true during the tick that selectTrack runs
  let _loadToken = 0;             // increments with every loadTrack call — stale handlers self-cancel
  let tonearmAngle = 0;
  let tonearmTargetAngle = 0;
  let tonearmDriftPhase = 0;
  let tonearmVisualProgress = 0;

  const TONEARM_PARKED = -58;
  const TONEARM_PLAY   = 6;
  const TONEARM_SWEEP  = 18;

  tonearmAngle = TONEARM_PARKED;
  tonearmTargetAngle = TONEARM_PARKED;

  // ── RAF loop ──────────────────────────────────────────
  function startRAF() {
    if (rafId) return;
    (function loop() {
      rafId = requestAnimationFrame(loop);
      const now = Date.now();
      const dt  = Math.min(now - lastFrame, 50);
      lastFrame = now;

      // Idle
      isIdle = (now - lastActivity) > 6000;
      const wake = isIdle ? 0.55 : 1.0;

      // Breathing
      breathPhase += dt * 0.00018;
      const breath = Math.sin(breathPhase) * 0.09;

      // Energy
      let energy = 0;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        for (let v of freqData) energy += v;
        energy /= freqData.length * 255;
      } else if (isPlaying) {
        energy = 0.14 + Math.sin(now * 0.0022) * 0.04 + Math.sin(now * 0.0007 + 1.4) * 0.03;
        energy = Math.max(0.06, energy);
      }

      // Spin — play smoothly, stop immediately on pause
      if (isPlaying) {
        const targetSpeed = SPIN_MAX * wake;
        spinSpeed += (targetSpeed - spinSpeed) * 0.018;
      } else {
        spinSpeed = 0;
      }
      spinAngle += spinSpeed;

      // Tilt
      tiltX += (targetTiltX - tiltX) * 0.055;
      tiltY += (targetTiltY - tiltY) * 0.055;
      const gx = glitchActive ? glitchX : 0;
      const gy = glitchActive ? glitchY : 0;

      if (disc3d) disc3d.style.transform =
        `rotateX(${(tiltX + gy).toFixed(2)}deg) rotateY(${(tiltY + gx).toFixed(2)}deg) rotateZ(${spinAngle.toFixed(2)}deg)`;

      if (isOpen) tickTonearm(dt, energy);

      // Viz interpolation
      vizDist += (targetVizDist - vizDist) * 0.007;
      vizColl += (targetVizColl - vizColl) * 0.007;

      drawViz(energy, wake);

      // Presence
      if (isPlaying) {
        listenTime += dt;
        if (!presenceActive && listenTime >= presenceNextAt) {
          showPresence();
          listenTime = 0;
          presenceNextAt = 13000 + rand(10000);
        }
      }

      syncEmotionState(energy);
    })();

    scheduleVizState();
    scheduleGlitch();
  }

  // ── Visualizer ────────────────────────────────────────
  function drawViz(energy, wake) {
    if (!ctx2d) return;
    ctx2d.clearRect(0, 0, 380, 380);
    const cx = 190, cy = 190, baseR = 132, maxH = 50;
    const bars = analyser ? freqData.length : 64;

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      let norm = (analyser && isPlaying) ? freqData[i] / 255 : 0.03;

      // distortion: noise variation on bar amplitude
      if (vizDist > 0.01) {
        const n = Math.sin(i * 2.5 + breathPhase * 3.5) * 0.5 + 0.5;
        norm = norm * (1 - vizDist) + (norm * (0.25 + n * 1.5)) * vizDist;
        norm = Math.min(1, Math.max(0, norm));
      }

      // collapse: fade one arc side
      const collW = Math.max(0, Math.cos(angle + 0.9));
      norm *= 1 - (vizColl * collW * 0.92);

      const len   = norm * maxH * wake + (isPlaying ? 1 : 0.4);
      const alpha = (0.18 + norm * 0.75) * wake;

      ctx2d.beginPath();
      ctx2d.moveTo(cx + Math.cos(angle) * baseR, cy + Math.sin(angle) * baseR);
      ctx2d.lineTo(cx + Math.cos(angle) * (baseR + len), cy + Math.sin(angle) * (baseR + len));
      ctx2d.strokeStyle = `rgba(196,160,100,${alpha.toFixed(3)})`;
      ctx2d.lineWidth = 1.8;
      ctx2d.lineCap = 'round';
      ctx2d.stroke();
    }
  }

  function scheduleVizState() {
    clearTimeout(vizTimer);
    vizTimer = setTimeout(() => {
      const r = Math.random();
      if (r < 0.42) {
        targetVizDist = 0;            targetVizColl = 0;          // calm
      } else if (r < 0.72) {
        targetVizDist = 0.4 + rand(0.4) / 1000; targetVizColl = rand(200) / 1000; // tension
      } else {
        targetVizDist = rand(300) / 1000; targetVizColl = 0.5 + rand(400) / 1000; // collapse
      }
      scheduleVizState();
    }, 7000 + rand(9000));
  }

  function scheduleGlitch() {
    clearTimeout(glitchTimer);
    glitchTimer = setTimeout(() => {
      if (isPlaying) {
        glitchX = (Math.random() - 0.5) * 22;
        glitchY = (Math.random() - 0.5) * 15;
        glitchActive = true;
        setTimeout(() => { glitchActive = false; }, 80 + rand(120));
      }
      scheduleGlitch();
    }, 24000 + rand(36000));
  }

  // ── Presence layer ────────────────────────────────────
  function showPresence() {
    if (!presenceEl || presenceActive) return;
    if (!presencePool.length) presencePool = shuffle([...PRESENCE]);
    const text = presencePool.shift();
    presenceActive = true;
    presenceEl.textContent = text;
    presenceEl.classList.add('visible');
    setTimeout(() => {
      presenceEl.classList.remove('visible');
      setTimeout(() => { presenceActive = false; }, 2200);
    }, 4800);
  }

  // ── Audio control ─────────────────────────────────────
  function fadeVol(from, to, ms) {
    const t0 = Date.now();
    (function tick() {
      const p = Math.min(1, (Date.now() - t0) / ms);
      audio.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(tick);
    })();
  }

  function loadTrack(andPlay, withOffset) {
    // Give this load a unique token — any older handler that fires will see a mismatched
    // token and silently bail, regardless of how many songs exist or how fast the user clicks.
    const myToken = ++_loadToken;

    if (pendingLoadHandler) {
      audio.removeEventListener('loadedmetadata', pendingLoadHandler);
      pendingLoadHandler = null;
    }

    if (andPlay) {
      // Attach listener BEFORE audio.src + audio.load() so cached audio never misses it
      pendingLoadHandler = function() {
        audio.removeEventListener('loadedmetadata', pendingLoadHandler);
        pendingLoadHandler = null;
        if (myToken !== _loadToken) return;   // a newer load superseded this one
        if (withOffset && audio.duration > 0)
          audio.currentTime = audio.duration * (0.2 + Math.random() * 0.4);
        doPlay(true);
      };
      audio.addEventListener('loadedmetadata', pendingLoadHandler);
    }

    audio.src = PLAYLIST[trackIdx].src;
    audio.load();
  }

  function selectTrack(index, autoplay = true, withOffset = false) {
    if (index < 0 || index >= PLAYLIST.length) return;
    _manualSelect = true;           // block autoNext for this tick
    clearTimeout(autoNextTimer);    // cancel any pending auto-advance timer
    trackIdx = index;
    saveTrackIndex();
    refreshFragment(true);
    loadTrack(autoplay, withOffset);
    setTimeout(() => { _manualSelect = false; }, 0);
  }

  function doPlay(fadeIn) {
    initAnalyser();
    playTonearmSfx('on');
    const startVolume = fadeIn ? 0 : Math.min(audio.volume, 0.35);
    audio.volume = startVolume;
    audio.play().catch(() => {});
    fadeVol(startVolume, 0.35, fadeIn ? 2000 : 600);
    isPlaying = true;
    tonearmVisualProgress = Math.max(tonearmVisualProgress, 0.08);
    if (playBtn) {
      playBtn.classList.add('is-playing');
      playBtn.setAttribute('aria-label', 'Pause');
      playBtn.title = 'Pause';
    }
    if (tonearmEl) tonearmEl.classList.add('playing');
    syncTonearm(false, false);
    syncCatBtn();
    syncMediaSession();
  }

  function doPause() {
    playTonearmSfx('off');
    audio.pause(); isPlaying = false;
    spinSpeed = 0;
    if (playBtn) {
      playBtn.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', 'Play');
      playBtn.title = 'Play';
    }
    if (tonearmEl) tonearmEl.classList.remove('playing');
    tonearmVisualProgress = 0;
    syncTonearm(true, false);
    syncCatBtn();
    syncMediaSession();
  }

  function togglePlay() {
    if (isPlaying) doPause();
    else if (!audio.src || audio.src === location.href) loadTrack(true, true);
    else doPlay(false);
  }

  // Immediate (user-initiated skip)
  function goPrev() {
    doPause();
    selectTrack((trackIdx - 1 + PLAYLIST.length) % PLAYLIST.length, true, false); // start from beginning
  }

  function goNext() {
    doPause();
    selectTrack((trackIdx + 1) % PLAYLIST.length, true, false); // start from beginning
  }

  // Auto-advance after silence gap
  function autoNext() {
    if (_manualSelect) return;   // user clicked a track in the same tick as song ended
    const nextIdx = (trackIdx + 1) % PLAYLIST.length;
    autoNextTimer = setTimeout(() => {
      if (_manualSelect) return;  // user clicked during the delay window
      trackIdx = nextIdx;
      saveTrackIndex();
      refreshFragment(true);
      loadTrack(true, false);
    }, 3000 + rand(2000));
  }

  function seekBy(seconds) {
    if (!audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    syncProgress();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function syncTonearm(forceParked, immediate = false) {
    if (!tonearmEl) return;
    let angle = TONEARM_PARKED;

    if (!forceParked) {
      const drift = Math.sin(tonearmDriftPhase) * 1.2 + Math.sin(tonearmDriftPhase * 0.45 + 1.1) * 0.55;
      const energyLift = Math.min(1, Math.max(0, _energy || 0)) * 0.6;
      angle = TONEARM_PLAY + tonearmVisualProgress * TONEARM_SWEEP + drift + energyLift;
    }

    tonearmTargetAngle = angle;
    if (immediate) tonearmAngle = angle;
    tonearmEl.style.setProperty('--tonearm-angle', `${tonearmAngle.toFixed(2)}deg`);
  }

  function tickTonearm(dt, energy) {
    if (!tonearmEl) return;
    tonearmDriftPhase += dt * (isPlaying ? 0.0012 : 0.0004);
    _energy = energy;
    if (isPlaying) {
      tonearmVisualProgress = Math.min(1, tonearmVisualProgress + dt / 90000);
    } else {
      tonearmVisualProgress = 0;
    }
    syncTonearm(!isPlaying);
    const ease = isPlaying ? Math.min(0.05, dt * 0.0018) : Math.min(0.08, dt * 0.0024);
    tonearmAngle += (tonearmTargetAngle - tonearmAngle) * ease;
    tonearmEl.style.setProperty('--tonearm-angle', `${tonearmAngle.toFixed(2)}deg`);
  }

  function syncProgress() {
    const hasDuration = Number.isFinite(audio.duration) && audio.duration > 0;
    if (fillEl) {
      fillEl.style.width = hasDuration ? (audio.currentTime / audio.duration * 100) + '%' : '0%';
    }
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (durationEl) durationEl.textContent = hasDuration ? formatTime(audio.duration) : '0:00';
  }

  // ── Display ───────────────────────────────────────────
  function refreshFragment(animate) {
    if (!fragmentEl) return;
    const track = PLAYLIST[trackIdx];
    const frag = track.fragment;
    if (animate) {
      fragmentEl.classList.add('fade');
      setTimeout(() => { fragmentEl.textContent = frag; fragmentEl.classList.remove('fade'); }, 340);
    } else {
      fragmentEl.textContent = frag;
    }
    if (fragmentsEl) fragmentsEl.querySelectorAll('.mc-frag-item[data-idx]').forEach(el =>
      el.classList.toggle('active', parseInt(el.dataset.idx, 10) === trackIdx));
    refreshRoomCard();
    syncCatBtn();
    syncMediaSession();
  }

  function refreshRoomCard() {
    const track = PLAYLIST[trackIdx] || {};
    if (roomTitleEl) roomTitleEl.textContent = track.title || 'Untitled Recording';
    if (roomArtistEl) roomArtistEl.textContent = track.artist || 'Unknown Artist';
    if (roomNoteEl) roomNoteEl.textContent = track.note || track.fragment || 'A memory left on the turntable.';
    if (roomYearEl) roomYearEl.textContent = track.year || `Archive ${String(trackIdx + 1).padStart(2, '0')}`;
    if (roomSideEl) roomSideEl.textContent = track.side || 'Side A';
    if (roomRoomEl) roomRoomEl.textContent = track.room || 'Listening Room';
  }

  function buildTrackList() {
    if (!fragmentsEl) return;
    fragmentsEl.innerHTML = '';

    const filtered = PLAYLIST.map((t, i) => ({ t, i }))
      .filter(({ t }) => !activeMood || t.mood === activeMood);

    if (moodCountEl) {
      moodCountEl.textContent = filtered.length === 1 ? '1 recording' : filtered.length + ' recordings';
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'mc-empty-state';
      const line = document.createElement('span');
      line.className = 'mc-empty-line';
      line.textContent = 'No recordings in this archive yet.';
      const sub = document.createElement('span');
      sub.className = 'mc-empty-sub';
      sub.textContent = 'Add tracks with mood: "' + activeMood + '"';
      empty.append(line, sub);
      fragmentsEl.appendChild(empty);
      return;
    }

    filtered.forEach(({ t, i }) => {
      const moodData = (t.mood && MOODS[t.mood]) ? MOODS[t.mood] : { color: '#c4b49a' };
      const item = document.createElement('div');
      item.className = 'mc-frag-item mc-pl-item';
      item.dataset.idx = i;

      const dot = document.createElement('span');
      dot.className = 'mc-frag-dot';
      dot.style.setProperty('--mc-dot-c', moodData.color);

      const body = document.createElement('span');
      body.className = 'mc-frag-body';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'mc-frag-title';
      titleSpan.textContent = t.title || 'Untitled';
      const subSpan = document.createElement('span');
      subSpan.className = 'mc-frag-sub';
      subSpan.textContent = t.fragment || '';
      body.append(titleSpan, subSpan);

      const yearSpan = document.createElement('span');
      yearSpan.className = 'mc-frag-year';
      yearSpan.textContent = t.year || '';

      item.append(dot, body, yearSpan);
      item.classList.toggle('active', i === trackIdx);
      item.addEventListener('click', () => {
        doPause();
        selectTrack(i, true, false);
      });
      fragmentsEl.appendChild(item);
    });
  }

  function setMood(key) {
    activeMood = key || null;
    const mood = activeMood ? MOODS[activeMood] : null;
    const color = mood ? mood.color : '#c4b49a';

    if (capsule) capsule.style.setProperty('--mc-mood-color', color);
    if (moodWatermarkEl) moodWatermarkEl.textContent = mood ? mood.room : 'Listening Room';

    if (moodDescEl) {
      moodDescEl.classList.add('mc-mood-desc-fade');
      setTimeout(() => {
        moodDescEl.textContent = mood ? mood.desc : 'Every song is a room. You choose which one to enter.';
        moodDescEl.classList.remove('mc-mood-desc-fade');
      }, 240);
    }

    document.querySelectorAll('.mc-mood-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === activeMood);
    });

    buildTrackList();
  }

  function syncCatBtn() {
    const btn = document.querySelector('.cat-music');
    if (!btn) return;
    catEq = catEq || btn.querySelector('.mc-cat-eq');
    btn.classList.toggle('mc-playing', isPlaying);
    if (catEq) catEq.classList.toggle('visible', isPlaying);
  }

  // ── Build UI ──────────────────────────────────────────
  function buildUI() {
    if (document.getElementById('music-capsule')) return;

    backdrop = document.createElement('div');
    backdrop.id = 'mc-backdrop';
    backdrop.addEventListener('click', closeCapsule);
    document.body.appendChild(backdrop);

    capsule = document.createElement('div');
    capsule.id = 'music-capsule';

    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
      const corner = document.createElement('div');
      corner.className = `mc-frame-corner mc-fc-${pos}`;
      capsule.appendChild(corner);
    });

    const topBar = document.createElement('div');
    topBar.className = 'mc-topbar';
    topBar.innerHTML = `
      <span class="mc-top-name">II</span>
      <button class="mc-top-back" type="button">← Back</button>
    `;
    topBar.querySelector('.mc-top-back').addEventListener('click', closeCapsule);
    capsule.appendChild(topBar);

    const topRule = document.createElement('div');
    topRule.className = 'mc-top-rule';
    capsule.appendChild(topRule);

    const esc = document.createElement('span');
    esc.className = 'mc-close-hint';
    esc.textContent = 'esc';
    esc.addEventListener('click', closeCapsule);
    capsule.appendChild(esc);

    const archiveHead = document.createElement('div');
    archiveHead.className = 'mc-archive-head';
    archiveHead.innerHTML = `
      <span class="mc-ah-label">Private Listening Archive</span>
      <span class="mc-ah-copy">Room Copy / After Midnight</span>
    `;
    capsule.appendChild(archiveHead);

    const playerCol = document.createElement('div');
    playerCol.className = 'mc-player-col';
    capsule.appendChild(playerCol);

    // 3D scene
    const scene = document.createElement('div');
    scene.className = 'mc-scene';

    canvas = document.createElement('canvas');
    canvas.className = 'mc-canvas';
    canvas.width = canvas.height = 380;
    ctx2d = canvas.getContext('2d');
    scene.appendChild(canvas);

    // Turntable platter (base beneath vinyl)
    const platter = document.createElement('div');
    platter.className = 'mc-platter';
    scene.appendChild(platter);

    disc3d = document.createElement('div');
    disc3d.className = 'mc-disc-3d';
    disc3d.innerHTML = '<div class="mc-disc-label"></div>';
    disc3d.addEventListener('click', togglePlay);
    scene.appendChild(disc3d);

    // Tonearm assembly
    const tonearmAssy  = document.createElement('div');
    tonearmAssy.className = 'mc-tonearm-assy';

    const tonearmPivot = document.createElement('div');
    tonearmPivot.className = 'mc-tonearm-pivot';

    tonearmEl = document.createElement('div');
    tonearmEl.className = 'mc-tonearm-arm';

    tonearmAssy.append(tonearmPivot, tonearmEl);
    scene.appendChild(tonearmAssy);

    const sceneMeta = document.createElement('div');
    sceneMeta.className = 'mc-scene-meta';
    sceneMeta.innerHTML = `
      <span class="mc-scene-tag">Needle Warm</span>
      <span class="mc-scene-tag">Lamp Low</span>
      <span class="mc-scene-tag">Room Tone</span>
    `;
    scene.appendChild(sceneMeta);

    playerCol.appendChild(scene);

    // Memory fragment (track label)
    fragmentEl = document.createElement('p');
    fragmentEl.className = 'mc-fragment-text';
    playerCol.appendChild(fragmentEl);

    // Presence text (rare emotional moments)
    presenceEl = document.createElement('p');
    presenceEl.className = 'mc-presence';
    capsule.appendChild(presenceEl);

    const roomPanel = document.createElement('div');
    roomPanel.className = 'mc-room-panel';
    capsule.appendChild(roomPanel);

    moodWatermarkEl = document.createElement('div');
    moodWatermarkEl.className = 'mc-room-watermark';
    moodWatermarkEl.textContent = 'Listening Room';
    roomPanel.appendChild(moodWatermarkEl);

    const moodRow = document.createElement('div');
    moodRow.className = 'mc-mood-row';
    Object.entries(MOODS).forEach(([key, m]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mc-mood-btn';
      btn.dataset.mood = key;
      btn.textContent = m.label;
      btn.style.setProperty('--mc-btn-c', m.color);
      btn.addEventListener('click', () => setMood(activeMood === key ? null : key));
      moodRow.appendChild(btn);
    });
    roomPanel.appendChild(moodRow);

    moodDescEl = document.createElement('p');
    moodDescEl.className = 'mc-mood-desc';
    moodDescEl.textContent = 'Every song is a room. You choose which one to enter.';
    roomPanel.appendChild(moodDescEl);

    const roomCard = document.createElement('div');
    roomCard.className = 'mc-room-card';
    roomCard.innerHTML = `
      <span class="mc-room-card-label">Now Playing</span>
      <span class="mc-room-card-stamp" id="mc-room-name">Listening Room</span>
      <h3 class="mc-room-title" id="mc-room-title">Untitled Recording</h3>
      <p class="mc-room-artist" id="mc-room-artist">Unknown Artist</p>
      <p class="mc-room-note" id="mc-room-note">A memory left on the turntable.</p>
    `;
    roomPanel.appendChild(roomCard);

    roomTitleEl  = roomCard.querySelector('#mc-room-title');
    roomArtistEl = roomCard.querySelector('#mc-room-artist');
    roomNoteEl   = roomCard.querySelector('#mc-room-note');
    roomRoomEl   = roomCard.querySelector('#mc-room-name');
    roomYearEl   = document.createElement('span');
    roomSideEl   = document.createElement('span');

    const trackHead = document.createElement('div');
    trackHead.className = 'mc-track-head';
    const trackHeadLabel = document.createElement('span');
    trackHeadLabel.textContent = 'Recordings';
    moodCountEl = document.createElement('span');
    moodCountEl.className = 'mc-mood-count';
    moodCountEl.textContent = PLAYLIST.length + ' in archive';
    trackHead.append(trackHeadLabel, moodCountEl);
    roomPanel.appendChild(trackHead);

    // Progress
    const prog = document.createElement('div');
    prog.className = 'mc-progress';
    fillEl = document.createElement('div');
    fillEl.className = 'mc-progress-fill';
    prog.appendChild(fillEl);
    prog.addEventListener('click', e => {
      if (audio.duration) audio.currentTime = (e.offsetX / prog.offsetWidth) * audio.duration;
    });
    playerCol.appendChild(prog);

    const timeRow = document.createElement('div');
    timeRow.className = 'mc-time-row';
    currentTimeEl = document.createElement('span');
    currentTimeEl.className = 'mc-time';
    currentTimeEl.textContent = '0:00';
    durationEl = document.createElement('span');
    durationEl.className = 'mc-time';
    durationEl.textContent = '0:00';
    timeRow.append(currentTimeEl, durationEl);
    playerCol.appendChild(timeRow);

    // Controls (hidden until hover)
    controlsEl = document.createElement('div');
    controlsEl.className = 'mc-controls';

    const prev = document.createElement('button');
    prev.className = 'mc-btn';
    prev.textContent = '« 10';
    prev.title = 'Back 10 seconds';
    prev.addEventListener('click', () => seekBy(-10));

    playBtn = document.createElement('button');
    playBtn.className = 'mc-btn mc-btn-play';
    playBtn.type = 'button';
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.title = 'Play';
    playBtn.innerHTML = `
      <span class="mc-btn-play-glyph">
        <span class="mc-icon-play"></span>
        <span class="mc-icon-pause"></span>
      </span>
    `;
    playBtn.addEventListener('click', togglePlay);

    const next = document.createElement('button');
    next.className = 'mc-btn';
    next.textContent = '10 »';
    next.title = 'Forward 10 seconds';
    next.addEventListener('click', () => seekBy(10));

    controlsEl.append(prev, playBtn, next);
    playerCol.appendChild(controlsEl);

    fragmentsEl = document.createElement('div');
    fragmentsEl.id = 'mc-playlist';
    roomPanel.appendChild(fragmentsEl);
    buildTrackList();

    const roomFoot = document.createElement('div');
    roomFoot.className = 'mc-room-foot';
    roomFoot.innerHTML = `
      <p class="mc-room-foot-line">For nights that only make sense at low volume.</p>
      <div class="mc-room-foot-ledger">
        <span>Baghdad</span>
        <span>After Midnight</span>
        <span>Room Copy</span>
      </div>
    `;
    roomPanel.appendChild(roomFoot);

    document.body.appendChild(capsule);

    // Mouse tilt
    scene.addEventListener('mousemove', e => {
      wakeUp();
      const r = scene.getBoundingClientRect();
      targetTiltX = 18 - ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * 9;
      targetTiltY = -6 + ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) * 9;
    });
    scene.addEventListener('mouseleave', () => { targetTiltX = 18; targetTiltY = -6; });

    // Scroll = skip
    capsule.addEventListener('wheel', e => {
      e.preventDefault(); wakeUp();
      if (e.deltaY > 0) goNext(); else goPrev();
    }, { passive: false });

    // Long press = reveal fragments
    let lpTimer = null;
    capsule.addEventListener('pointerdown', () => {
      lpTimer = setTimeout(() => { plVisible = true; fragmentsEl.classList.add('visible'); }, 600);
    });
    ['pointerup', 'pointercancel'].forEach(ev =>
      capsule.addEventListener(ev, () => clearTimeout(lpTimer)));

    capsule.addEventListener('mousemove', wakeUp);

    refreshFragment(false);
    refreshRoomCard();
    syncProgress();
    syncTonearm(true, true);
    startRAF();
  }

  // ── Controls visibility ───────────────────────────────
  function wakeUp() {
    lastActivity = Date.now();
    if (!controlsEl) return;
    controlsEl.classList.add('visible');
    clearTimeout(ctrlTimer);
    ctrlTimer = setTimeout(() => controlsEl.classList.remove('visible'), 2800);
  }

  // ── Open / close ──────────────────────────────────────
  function openCapsule() {
    buildUI();
    isOpen = true;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      backdrop.classList.add('open');

      // Open quietly: load the track if needed, but don't auto-play.
      const currentSrc = audio.getAttribute('src') || audio.src || '';
      const wantedSrc = PLAYLIST[trackIdx].src;
      const sameTrack = currentSrc.endsWith(wantedSrc);

      if (!sameTrack) {
        audio.src = wantedSrc;
        audio.load();
        audio.currentTime = 0;
      }

      isPlaying = !audio.paused && !audio.ended;
      if (!isPlaying) {
        tonearmVisualProgress = 0;
      } else {
        tonearmVisualProgress = Math.max(tonearmVisualProgress, 0.08);
      }

      if (playBtn) {
        playBtn.classList.toggle('is-playing', isPlaying);
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        playBtn.title = isPlaying ? 'Pause' : 'Play';
      }

      if (tonearmEl) tonearmEl.classList.toggle('playing', isPlaying);
      syncProgress();
      syncTonearm(!isPlaying, true);
      syncCatBtn();
      syncMediaSession();

      // Staggered visual reveal
      setTimeout(() => capsule.classList.add('open'),                        150);
      setTimeout(() => disc3d     && disc3d.classList.add('revealed'),       700);
      setTimeout(() => fragmentEl && fragmentEl.classList.add('revealed'),  1500);
      // Tonearm swings in after disc is fully visible
      setTimeout(() => {
        if (tonearmEl) tonearmEl.classList.toggle('playing', isPlaying);
        syncTonearm(!isPlaying, false);
      }, 1800);
    }));
  }

  function closeCapsule() {
    if (!capsule) return;
    isOpen = false;
    backdrop.classList.remove('open');
    capsule.classList.remove('open');
    disc3d?.classList.remove('revealed');
    fragmentEl?.classList.remove('revealed');
    tonearmEl?.classList.remove('playing');
    tonearmVisualProgress = 0;
    syncTonearm(true, true);
    spinSpeed = 0;
    if (playBtn) {
      playBtn.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', 'Play');
      playBtn.title = 'Play';
    }
    syncMediaSession();
  }

  // ── Audio events ──────────────────────────────────────
  audio.addEventListener('timeupdate', () => {
    syncProgress();
  });
  audio.addEventListener('loadedmetadata', syncProgress);
  audio.addEventListener('durationchange', syncProgress);
  audio.addEventListener('seeked', syncProgress);
  audio.addEventListener('ended', autoNext);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      shouldResumeAfterHidden = isPlaying && audio.paused === false;
      return;
    }
    if (shouldResumeAfterHidden && audio.paused) {
      audio.play().catch(() => {});
    }
    shouldResumeAfterHidden = false;
  });

  // ── Keyboard ─────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (!isOpen) return;
    wakeUp();
    if (e.key === 'Escape')                       { closeCapsule(); return; }
    if (e.key === ' ' || e.key === 'k')           { e.preventDefault(); togglePlay(); }
    if (e.key === 'ArrowRight' || e.key === 'l')  { e.preventDefault(); seekBy(10); }
    if (e.key === 'ArrowLeft'  || e.key === 'j')  { e.preventDefault(); seekBy(-10); }
    if (e.key === 'n') goNext();
    if (e.key === 'p') goPrev();
  });

  document.addEventListener('click', () => { hasInteracted = true; }, { once: true });

  // ── Global emotion state ──────────────────────────────
  window.musicEmotionState = {
    get playing()    { return isPlaying; },
    get trackIndex() { return trackIdx; },
    get fragment()   { return PLAYLIST[trackIdx]?.fragment; },
    get idle()       { return isIdle; },
    get energy()     { return _energy; },
    get vizState()   {
      if (vizDist > 0.3)  return 'tension';
      if (vizColl > 0.4)  return 'collapse';
      return 'calm';
    },
  };

  let _energy = 0;
  function syncEmotionState(e) { _energy = e; }

  // ── Wire pick screen + sidebar ────────────────────────
  const musicBtn = document.querySelector('.cat-music');
  if (!musicBtn) return;

  function openOnClick(e) {
    e.stopPropagation();
    hasInteracted = true;
    isOpen ? closeCapsule() : openCapsule();
  }

  musicBtn.addEventListener('click', openOnClick, true);

  const pickPanel = document.querySelector('.pick-music');
  if (pickPanel) {
    pickPanel.addEventListener('click', openOnClick, true);
  }

  // ── Helpers ───────────────────────────────────────────
  function rand(n) { return Math.random() * n; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

})();
