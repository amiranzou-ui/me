// ── Visit tracking ─────────────────────────────────────
const visits = parseInt(localStorage.getItem('mind_v') || '0') + 1;
localStorage.setItem('mind_v', visits);
const seenFragments = JSON.parse(localStorage.getItem('mind_seen') || '[]');

function markSeen(id) {
  if (!seenFragments.includes(id)) {
    seenFragments.push(id);
    localStorage.setItem('mind_seen', JSON.stringify(seenFragments));
  }
}

const hour   = new Date().getHours();
const isNight = hour >= 22 || hour < 5;
const isLate  = hour >= 0  && hour < 4;

// ── Fragment data ───────────────────────────────────────
// Three waves: peripheral (0.3–0.9) → mid (1.2–2.0) → deep (2.3–3.8)
// Thematic clusters: building/incompleteness share the left-center quadrant
const fragments = [
  // Wave 1 — sparse, peripheral, outward-facing
  { id:'f1',  text:"I think in systems. I feel in exceptions.",
    x:8,  y:12, delay:0.3 },
  { id:'f8',  text:"Some days I am the signal. Most days I am the noise.",
    x:38, y:21, delay:0.6 },
  { id:'f12', text:"I collect observations the way others collect objects.",
    x:65, y:5,  delay:0.9 },

  // Wave 2 — mid-ground, most fragments
  { id:'f4',  text:"Most conversations are two people waiting to speak.",
    x:70, y:22, delay:1.2 },
  { id:'f5',  text:"I distrust certainty in others. I envy it anyway.",
    x:14, y:67, delay:1.4 },
  { id:'f9',  text:"Precision is a form of care.",
    x:84, y:38, delay:1.6 },
  { id:'f3',  text:"I build things I don't fully understand.",
    x:24, y:44, delay:1.8,
    path:[
      { text:"that's the point.",                                       dx:22, dy:9,  delay:0.3 },
      { text:"or maybe I build to understand. I haven't decided.",      dx:18, dy:21, delay:0.7 }
    ]
  },
  { id:'f13', text:"I optimize systems. I haven't gotten to myself yet.",
    x:50, y:60, delay:2.0,
    path:[
      { text:"maybe that's intentional.",                               dx:16, dy:12, delay:0.5 }
    ]
  },

  // Wave 3 — deep, slower to surface
  { id:'f7',  text:"I am most myself when no one is watching.",
    x:76, y:54, delay:2.3,
    path:[
      { text:"that I perform even for myself, sometimes.",              dx:-14, dy:14, delay:0.4 }
    ]
  },
  { id:'f2',  text:"The version of me you see is already old.",
    x:62, y:72, delay:2.5 },
  { id:'f11', text:"Being good at something is not the same as belonging to it.",
    x:20, y:82, delay:2.7 },
  { id:'f10', text:"There are ideas I've had that I'm not ready for.",
    x:6,  y:50, delay:3.0,
    path:[
      { text:"they wait somewhere. I feel them occasionally.",          dx:24, dy:7,  delay:0.4 },
      { text:"I'm not sure if they grow or decay while I'm not looking.", dx:20, dy:19, delay:0.9 }
    ]
  },
  { id:'f15', text:"I don't know if I'm drawn to complexity or if I generate it to feel at home.",
    x:28, y:4,  delay:3.2 },
  // thematic neighbor of f3 + f13 — in the same vertical band
  { id:'f6',  text:"The unfinished thing is more honest.",
    x:42, y:88, delay:3.5 },
  { id:'f14', text:"Physics is math with consequences. Maybe everything is.",
    x:80, y:76, delay:3.8 },

  // Conditional — night only
  { id:'f16', text:"The clearest I think is about something I'm supposed to be ignoring.",
    x:54, y:42, delay:2.1,
    condition: () => isNight },

  // Conditional — late night only, ephemeral (disappears permanently)
  { id:'f17', text:"It's late. This is when the real thinking happens. Or the worst.",
    x:16, y:32, delay:2.8,
    condition: () => isLate,
    ephemeral: true,
    dimmed: true },

  // Conditional — revisit only, ephemeral
  { id:'f18', text:"you came back.",
    x:50, y:55, delay:1.4,
    condition: () => visits >= 2,
    ephemeral: true,
    centered: true },

  // Conditional — third visit+
  { id:'f19', text:"I have argued with myself more than with anyone else. I usually lose.",
    x:60, y:32, delay:2.4,
    condition: () => visits >= 3 }
];

const RULES = [
  "Never explain what you can demonstrate.",
  "Discomfort is information. Use it.",
  "The work is the proof. Everything else is noise.",
  "If you can't explain it simply, you're still learning it. Stay.",
  "Finish fewer things. Finish them better."
];

// ── Surface ─────────────────────────────────────────────
const surface = document.getElementById('surface');
const cursor  = document.getElementById('mind-cursor');

// ── Visit dots (appear after fragments, not immediately) ─
const markEl = document.createElement('div');
markEl.className = 'visit-marks';
markEl.style.opacity = '0';
markEl.style.transition = 'opacity 1.4s ease';
for (let i = 0; i < 3; i++) {
  const dot = document.createElement('div');
  dot.className = 'v-dot' + (i < Math.min(visits, 3) ? ' lit' : '');
  markEl.appendChild(dot);
}
document.body.appendChild(markEl);
setTimeout(() => { markEl.style.opacity = '1'; }, 2000);

// ── Render fragments ────────────────────────────────────
// Once fragments have been seeded into mind_nodes_v1, mind-nodes.js renders
// them — skip the old fragment loop to avoid duplicates.
const _seededIds = (() => {
  try { return new Set(JSON.parse(localStorage.getItem('mind_nodes_v1') || '[]').map(n => n.id)); }
  catch { return new Set(); }
})();
const _fragmentsHandledByNodes = fragments.every(f => _seededIds.has(f.id));

const renderedEls = [];

// per-wave easing: Wave 1 peripheral, Wave 2 mid, Wave 3 deep
function waveEasing(delay) {
  if (delay <= 0.9)  return 'cubic-bezier(0.2,0,0.8,1)';
  if (delay <= 2.0)  return 'cubic-bezier(0.4,0,0.6,1)';
  return                    'cubic-bezier(0.6,0,0.8,1)';
}

fragments.forEach(f => {
  if (_fragmentsHandledByNodes) return; // mind-nodes.js renders these now
  if (f.condition && !f.condition()) return;
  if (f.ephemeral && seenFragments.includes(f.id)) return;

  const el = document.createElement('div');
  el.className = 'fragment' + (f.path ? ' has-path' : '') + (f.ephemeral ? ' ephemeral' : '');
  el.dataset.id = f.id;
  el.textContent = f.text;

  const baseOpacity = f.dimmed ? 0.26 : 0.38;
  // ±80ms jitter so fragments don't feel mechanically spaced
  const jitter = (Math.random() - 0.5) * 0.16;
  const appearAt = Math.max(0, f.delay + jitter) * 1000;
  const easing = f.centered ? 'cubic-bezier(0.4,0,0.6,1)' : waveEasing(f.delay);

  el.style.cssText = `
    left:  ${f.centered ? '50%' : f.x + '%'};
    top:   ${f.centered ? '55%' : f.y + '%'};
    ${f.centered ? 'transform:translate(-50%,-50%);text-align:center;' : ''}
    --delay: ${f.delay}s;
    color: rgba(212,207,201,0);
  `;

  // fade in after delay using JS (avoids CSS animation conflicts)
  setTimeout(() => {
    el.style.transition = `color ${f.centered ? 2 : 1.4}s ${easing}`;
    el.style.color = `rgba(212,207,201,${baseOpacity})`;
  }, appearAt);

  // hover: fast in cubic, slow out cubic — emotional contrast
  el.addEventListener('mouseenter', () => {
    el.style.transition = 'color 0.5s cubic-bezier(0.2,0,0,1)';
    el.style.color = 'rgba(212,207,201,0.88)';
    cursor.classList.add('hover');
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'color 1.4s cubic-bezier(0,0,0.4,1)';
    el.style.color = `rgba(212,207,201,${baseOpacity})`;
    cursor.classList.remove('hover');
  });

  // ephemeral: mark seen after it surfaces
  if (f.ephemeral) {
    setTimeout(() => {
      markSeen(f.id);
      setTimeout(() => {
        el.style.transition = 'color 3s ease';
        el.style.color = 'rgba(212,207,201,0)';
        setTimeout(() => el.remove(), 3100);
      }, 5000);
    }, (f.delay + 0.1) * 1000);
  }

  // thought path — click with 80ms weight before spawning
  if (f.path) {
    el.addEventListener('click', () => {
      if (el.classList.contains('opened')) return;
      el.classList.add('opened');
      setTimeout(() => {
        el.style.transition = 'color 1s ease';
        el.style.color = `rgba(212,207,201,${baseOpacity * 0.45})`;

        f.path.forEach((child) => {
          const cx = document.createElement('div');
          cx.className = 'thought-child';
          cx.textContent = child.text;
          cx.style.cssText = `
            left: ${f.x + child.dx}%;
            top:  ${f.y + child.dy}%;
            color: rgba(212,207,201,0);
          `;
          surface.appendChild(cx);
          setTimeout(() => {
            cx.style.transition = 'color 1.2s ease';
            cx.style.color = 'rgba(212,207,201,0.22)';
          }, child.delay * 1000);

          cx.addEventListener('mouseenter', () => { cx.style.transition = 'color 0.5s'; cx.style.color = 'rgba(212,207,201,0.65)'; });
          cx.addEventListener('mouseleave', () => { cx.style.transition = 'color 1.2s'; cx.style.color = 'rgba(212,207,201,0.22)'; });

          drawLine(f.x, f.y, f.x + child.dx, f.y + child.dy, child.delay + 0.3);
        });
      }, 80);
    });
  }

  surface.appendChild(el);
  renderedEls.push({ el, baseOpacity });
});

// visit 4+: one fragment is imperceptibly brighter — permanent, no transition
if (visits >= 4 && renderedEls.length > 0) {
  const pick = renderedEls[Math.floor(Math.random() * renderedEls.length)];
  setTimeout(() => {
    pick.el.style.color = `rgba(212,207,201,${pick.baseOpacity + 0.14})`;
  }, 5000);
}

// ── Seed fragments into node storage (author mode needs them) ──
(function seedFragmentsToNodes() {
  const STORE_KEY = 'mind_nodes_v1';
  const CONNS_KEY = 'mind_connections_meta_v1';
  let stored = [];
  let conns  = [];
  try { stored = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch {}
  try { conns  = JSON.parse(localStorage.getItem(CONNS_KEY) || '[]'); } catch {}

  const existingIds = new Set(stored.map(n => n.id));
  let changed = false;

  fragments.forEach(f => {
    if (existingIds.has(f.id)) return;

    // Map condition functions to visibility conditions
    const conditions = { minVisits: 1 };
    if (f.condition) {
      const s = f.condition.toString();
      if      (s.includes('isLate'))      conditions.hourRange = [0, 4];
      else if (s.includes('isNight'))     conditions.hourRange = [22, 5];
      else if (s.includes('visits >= 3')) conditions.minVisits = 3;
      else if (s.includes('visits >= 2')) conditions.minVisits = 2;
    }

    stored.push({
      id: f.id, type: 'text', content: f.text, fragment: null,
      visibility: { public: true, conditions },
      emotionWeight: 0.5,
      position: { x: f.x ?? 30, y: f.y ?? 50 },
      connections: [], delay: f.delay ?? 1.2,
    });
    existingIds.add(f.id);
    changed = true;

    // Path children become connected nodes with afterInteraction condition
    (f.path || []).forEach((child, i) => {
      const cid = f.id + '_p' + i;
      if (existingIds.has(cid)) return;
      stored.push({
        id: cid, type: 'text', content: child.text, fragment: null,
        visibility: { public: true, conditions: { minVisits: 1, afterInteraction: f.id } },
        emotionWeight: 0.35,
        position: { x: (f.x ?? 30) + (child.dx ?? 0), y: (f.y ?? 50) + (child.dy ?? 0) },
        connections: [], delay: (f.delay ?? 1.2) + (child.delay ?? 0.5),
      });
      existingIds.add(cid);
      conns.push({ id: 'c_' + f.id + '_' + i, from: f.id, to: cid, type: 'logical' });
      // Add to parent's connections array
      const parent = stored.find(n => n.id === f.id);
      if (parent) parent.connections.push(cid);
      changed = true;
    });
  });

  if (changed) {
    localStorage.setItem(STORE_KEY, JSON.stringify(stored));
    localStorage.setItem(CONNS_KEY, JSON.stringify(conns));
  }
})();

// ── Connector line ──────────────────────────────────────
function drawLine(x1, y1, x2, y2, delay) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const ax = x1/100*vw, ay = y1/100*vh;
  const bx = x2/100*vw, by = y2/100*vh;
  const len   = Math.hypot(bx-ax, by-ay);
  const angle = Math.atan2(by-ay, bx-ax) * 180 / Math.PI;

  const line = document.createElement('div');
  line.className = 'thought-line';
  line.style.cssText = `
    left:${ax}px; top:${ay}px;
    width:${len}px;
    transform:rotate(${angle}deg);
    opacity:0; transition:opacity 1.8s ease;
  `;
  surface.appendChild(line);
  setTimeout(() => { line.style.opacity = '1'; }, Math.max(delay, 0) * 1000);
}

// ── Custom cursor ───────────────────────────────────────
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

// ── Author incantation system ─────────────────────────────
const AUTHOR_WORD = 'author';
let   authorIdx   = 0;
let   _spellAC    = null;

function _sac() {
  if (!_spellAC) _spellAC = new (window.AudioContext || window.webkitAudioContext)();
  return _spellAC;
}

// Each letter has a distinct magical voice
const SPELL_NOTES = [
  // 'a' — soft awakening shimmer: two detuned high sines, slow attack
  { freqs:[523.25,659.25], type:'sine',     vol:0.055, attack:0.06, decay:0.55, detune:6  },
  // 'u' — deep pull: low triangle with warm overtone
  { freqs:[164.81,246.94], type:'triangle', vol:0.065, attack:0.04, decay:0.70, detune:4  },
  // 't' — bright spark: rapid metallic pluck
  { freqs:[880,1108.73],   type:'sine',     vol:0.050, attack:0.005,decay:0.30, detune:10 },
  // 'h' — breathy chord: four-note whisper cluster
  { freqs:[349.23,440,523.25,659.25], type:'sine', vol:0.038, attack:0.09, decay:0.80, detune:2 },
  // 'o' — swelling round tone: pure A with harmonic fifth
  { freqs:[220,330,440],   type:'sine',     vol:0.060, attack:0.07, decay:0.90, detune:3  },
  // 'r' — full incantation climax: rich chord sweep + shimmer
  { freqs:[110,138.59,164.81,220,261.63,329.63], type:'sine', vol:0.072, attack:0.03, decay:1.60, detune:8 },
];

function playSpellLetter(idx) {
  try {
    const ac   = _sac();
    const note = SPELL_NOTES[idx];
    const now  = ac.currentTime;
    const isFinal = idx === AUTHOR_WORD.length - 1;

    // simple reverb via two delay taps
    const rev1 = ac.createDelay(0.5);  rev1.delayTime.value = 0.12;
    const rev2 = ac.createDelay(0.5);  rev2.delayTime.value = 0.28;
    const revG = ac.createGain();      revG.gain.value = isFinal ? 0.32 : 0.18;
    rev1.connect(revG); rev2.connect(revG); revG.connect(ac.destination);

    note.freqs.forEach((freq, fi) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();

      osc.type            = note.type;
      osc.frequency.value = freq;
      if (note.detune) osc.detune.value = (fi % 2 === 0 ? 1 : -1) * note.detune;

      // envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(note.vol, now + note.attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.attack + note.decay);

      osc.connect(gain);
      gain.connect(ac.destination);
      gain.connect(rev1);
      gain.connect(rev2);

      osc.start(now);
      osc.stop(now + note.attack + note.decay + 0.1);
    });

    // final 'r': extra shimmer sweep on top
    if (isFinal) {
      const sweep = ac.createOscillator();
      const swG   = ac.createGain();
      sweep.type  = 'sine';
      sweep.frequency.setValueAtTime(880, now);
      sweep.frequency.exponentialRampToValueAtTime(220, now + 1.8);
      swG.gain.setValueAtTime(0, now);
      swG.gain.linearRampToValueAtTime(0.04, now + 0.08);
      swG.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      sweep.connect(swG); swG.connect(ac.destination); swG.connect(rev1);
      sweep.start(now); sweep.stop(now + 1.9);
    }
  } catch (e) {}
}

// Small spark burst per letter (at cursor position)
function spellSpark(cx, cy, idx) {
  const progress = (idx + 1) / AUTHOR_WORD.length;
  const count = 4 + Math.floor(idx * 1.8);
  const GOLD  = ['rgba(255,220,100,','rgba(255,200,60,','rgba(220,180,80,','rgba(255,240,160,'];
  for (let i = 0; i < count; i++) {
    const sp    = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const dist  = 18 + Math.random() * (40 + progress * 60);
    const size  = 1.5 + Math.random() * (1.5 + progress * 2);
    const dur   = 380 + Math.random() * 320;
    const col   = GOLD[Math.floor(Math.random() * GOLD.length)];
    sp.style.cssText = [
      'position:fixed','border-radius:50%','pointer-events:none',`z-index:9997`,
      `width:${size}px`,`height:${size}px`,
      `left:${cx}px`,`top:${cy}px`,
      `background:${col}${0.7 + progress * 0.3})`,
      `box-shadow:0 0 ${size*2}px 1px ${col}0.5)`,
      'transform:translate(-50%,-50%)',
      `transition:transform ${dur}ms cubic-bezier(0.1,0,0.5,1),opacity ${dur*0.5}ms ease ${dur*0.45}ms`,
      'opacity:1',
    ].join(';');
    document.body.appendChild(sp);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sp.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px),calc(-50% + ${Math.sin(angle)*dist}px))`;
      sp.style.opacity   = '0';
    }));
    setTimeout(() => sp.remove(), dur + 100);
  }
}

// Full transition after final letter
function authorTransition() {
  const cx  = parseFloat(cursor.style.left) || window.innerWidth  / 2;
  const cy  = parseFloat(cursor.style.top)  || window.innerHeight / 2;
  const GOLD = ['rgba(255,220,100,','rgba(255,200,60,','rgba(220,180,80,','rgba(255,240,160,'];
  const RUNES = ['✦','⬡','◈','✧','⋆','⊕','◎','✺','❋','⊛','✴','❊','⬟','⊗','⬢'];

  // 1 — large spark explosion from cursor
  for (let i = 0; i < 55; i++) {
    const sp    = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const dist  = 80 + Math.random() * 280;
    const size  = 2  + Math.random() * 5;
    const delay = Math.random() * 220;
    const dur   = 700 + Math.random() * 600;
    const col   = GOLD[Math.floor(Math.random() * GOLD.length)];
    sp.style.cssText = [
      'position:fixed','border-radius:50%','pointer-events:none','z-index:9997',
      `width:${size}px`,`height:${size}px`,
      `left:${cx}px`,`top:${cy}px`,
      `background:${col}0.95)`,
      `box-shadow:0 0 ${size*3}px 2px ${col}0.7)`,
      'transform:translate(-50%,-50%)',
      `transition:transform ${dur}ms cubic-bezier(0.15,0,0.55,1) ${delay}ms,opacity ${dur*0.5}ms ease ${delay+dur*0.5}ms`,
      'opacity:1',
    ].join(';');
    document.body.appendChild(sp);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sp.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px),calc(-50% + ${Math.sin(angle)*dist}px))`;
      sp.style.opacity   = '0';
    }));
    setTimeout(() => sp.remove(), delay + dur + 100);
  }

  // 2 — magical circle ring expanding from cursor
  const ring = document.createElement('div');
  ring.style.cssText = [
    'position:fixed','border-radius:50%','pointer-events:none','z-index:9996',
    `left:${cx}px`,`top:${cy}px`,
    'width:0px','height:0px',
    'border:1.5px solid rgba(255,220,100,0.7)',
    'box-shadow:0 0 12px 3px rgba(255,200,60,0.3),inset 0 0 12px 3px rgba(255,200,60,0.1)',
    'transform:translate(-50%,-50%)',
    'transition:width 0.9s cubic-bezier(0.1,0,0.3,1),height 0.9s cubic-bezier(0.1,0,0.3,1),opacity 0.5s ease 0.55s',
    'opacity:1',
  ].join(';');
  document.body.appendChild(ring);
  const ringSize = Math.hypot(window.innerWidth, window.innerHeight) * 2.2;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.width   = ringSize + 'px';
    ring.style.height  = ringSize + 'px';
    ring.style.opacity = '0';
  }));
  setTimeout(() => ring.remove(), 1200);

  // 3 — rune symbols scatter across screen
  RUNES.forEach((rune, i) => {
    const el = document.createElement('div');
    el.textContent = rune;
    el.style.cssText = [
      'position:fixed','pointer-events:none','z-index:9997',
      `left:${10 + Math.random() * 80}%`,
      `top:${10  + Math.random() * 80}%`,
      "font-size:" + (14 + Math.random() * 18) + "px",
      'color:rgba(255,220,100,0)',
      `transition:color 0.4s ease ${i*55}ms,text-shadow 0.4s ease ${i*55}ms,opacity 0.6s ease ${300+i*55}ms`,
    ].join(';');
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.color      = 'rgba(255,220,100,0.55)';
      el.style.textShadow = '0 0 14px rgba(255,200,60,0.6)';
    }));
    setTimeout(() => { el.style.opacity = '0'; }, 300 + i * 55);
    setTimeout(() => el.remove(), 1400);
  });

  // 4 — fragments all glow in a wave then dissolve
  document.querySelectorAll('.fragment').forEach((el, i) => {
    setTimeout(() => {
      el.style.transition = 'color 0.35s ease,text-shadow 0.35s ease';
      el.style.color      = 'rgba(255,220,100,0.80)';
      el.style.textShadow = '0 0 22px rgba(255,200,60,0.65)';
    }, 60 + i * 22);
    setTimeout(() => {
      el.style.transition = 'color 0.6s ease,text-shadow 0.6s ease,opacity 0.8s ease';
      el.style.color      = 'rgba(255,220,100,0)';
      el.style.opacity    = '0';
    }, 500 + i * 18);
  });

  // 5 — dark magical overlay with spiral sparks converging to center
  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:9998','pointer-events:none',
      'background:radial-gradient(ellipse at 50% 50%,#150e00 0%,#080808 65%)',
      'opacity:0','transition:opacity 1.2s cubic-bezier(0.5,0,0.3,1)',
    ].join(';');
    document.body.appendChild(overlay);

    for (let i = 0; i < 30; i++) {
      const orb    = document.createElement('div');
      const radius = 120 + Math.random() * 240;
      const startA = Math.random() * Math.PI * 2;
      const size   = 1.5 + Math.random() * 3.5;
      const orX    = window.innerWidth  / 2 + Math.cos(startA) * radius;
      const orY    = window.innerHeight / 2 + Math.sin(startA) * radius;
      const col    = GOLD[Math.floor(Math.random() * GOLD.length)];
      const delay  = Math.random() * 700;
      const dur    = 800 + Math.random() * 500;
      orb.style.cssText = [
        'position:fixed','border-radius:50%','pointer-events:none','z-index:9999',
        `width:${size}px`,`height:${size}px`,
        `left:${orX}px`,`top:${orY}px`,
        `background:${col}1)`,
        `box-shadow:0 0 8px 2px ${col}0.7)`,
        'transform:translate(-50%,-50%)',
        `transition:left ${dur}ms cubic-bezier(0.4,0,0.1,1) ${delay}ms,top ${dur}ms cubic-bezier(0.4,0,0.1,1) ${delay}ms,opacity 300ms ease ${delay+dur-200}ms`,
        'opacity:1',
      ].join(';');
      document.body.appendChild(orb);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        orb.style.left    = window.innerWidth  / 2 + 'px';
        orb.style.top     = window.innerHeight / 2 + 'px';
        orb.style.opacity = '0';
      }));
      setTimeout(() => orb.remove(), delay + dur + 300);
    }

    requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
    setTimeout(() => {
      // Fade overlay back out revealing mind.html, then activate inline author mode
      overlay.style.transition = 'opacity 1.1s cubic-bezier(0.4,0,0.6,1)';
      overlay.style.opacity    = '0';

      // Show brief "✦ author mode" label
      const label = document.createElement('div');
      label.textContent = '✦ author mode';
      label.style.cssText = [
        'position:fixed','z-index:99999','top:50%','left:50%',
        'transform:translate(-50%,-50%)',
        'font:300 13px/1 "Cormorant Garamond",serif',
        'letter-spacing:0.22em','color:rgba(255,220,100,0)',
        'pointer-events:none','white-space:nowrap',
        'transition:color 0.7s ease',
      ].join(';');
      document.body.appendChild(label);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        label.style.color = 'rgba(255,220,100,0.85)';
      }));
      setTimeout(() => {
        label.style.color = 'rgba(255,220,100,0)';
        setTimeout(() => {
          label.remove();
          overlay.remove();
          window.MindAuthor?.activate();
        }, 750);
      }, 900);
    }, 1300);
  }, 380);
}

// ── Typing — individual drifting echo + rule unlock ───────
let typedBuffer = '';
let ruleIndex   = 0;

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { window.location.href = 'index.html'; return; }
  if (e.key.length !== 1) return;

  // author incantation — letter by letter detection
  const ch = e.key.toLowerCase();
  if (ch === AUTHOR_WORD[authorIdx]) {
    const cx = parseFloat(cursor.style.left) || window.innerWidth  / 2;
    const cy = parseFloat(cursor.style.top)  || window.innerHeight / 2;
    playSpellLetter(authorIdx);
    spellSpark(cx, cy, authorIdx);
    authorIdx++;
    if (authorIdx >= AUTHOR_WORD.length) {
      authorIdx = 0;
      setTimeout(authorTransition, 80);
      return;
    }
    return;
  } else {
    authorIdx = 0;
  }

  typedBuffer += ch;
  if (typedBuffer.length > 40) typedBuffer = typedBuffer.slice(-40);

  // each keypress = one drifting character — gated during system silence
  const cx = parseFloat(cursor.style.left) || window.innerWidth  / 2;
  const cy = parseFloat(cursor.style.top)  || window.innerHeight / 2;
  if (!window.MindSystem?.isSilent()) {
    const echo = document.createElement('div');
    echo.className = 'typed-echo';
    echo.textContent = e.key;
    echo.style.left = (cx + 10 + (Math.random() - 0.5) * 10) + 'px';
    echo.style.top  = (cy - 16) + 'px';
    document.body.appendChild(echo);
    setTimeout(() => echo.remove(), 4200);
  }

  // unlock a rule every 12 characters typed
  if (typedBuffer.length % 12 === 0 && ruleIndex < RULES.length) {
    spawnRule(RULES[ruleIndex++]);
  }
});

function spawnRule(text) {
  const el = document.createElement('div');
  el.className = 'mind-rule';
  el.textContent = text;
  el.style.cssText = `
    left:${10 + Math.random() * 62}%;
    top: ${12 + Math.random() * 68}%;
    color:rgba(212,207,201,0);
    transition:color 1.8s ease;
  `;
  surface.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.color = 'rgba(212,207,201,0.13)';
  }));
}

// ── Inactivity — three stages ───────────────────────────
const IDLE_POOLS = [
  {
    texts: ['still here?', 'you stayed.', 'still with me?'],
    baseDelay: 3 * 60 * 1000
  },
  {
    texts: ["that's longer than most.", "most people don't wait this long.", "you're different, aren't you."],
    baseDelay: 4 * 60 * 1000
  },
  {
    texts: [null],  // silent: brighten a fragment
    baseDelay: 5 * 60 * 1000
  }
];
let idleStage = 0;
let idleTimer = null;

function scheduleNextIdle() {
  if (idleStage >= IDLE_POOLS.length) return;
  const pool = IDLE_POOLS[idleStage];
  // ±20s jitter so messages don't feel metronomic
  const jitter = Math.round((Math.random() - 0.5) * 40000);
  idleTimer = setTimeout(() => {
    idleStage++;
    const text = pool.texts[Math.floor(Math.random() * pool.texts.length)];
    if (text) showStillHere(text);
    else      brightenFragment();
    scheduleNextIdle();
  }, pool.baseDelay + jitter);
}

function resetIdle() {
  clearTimeout(idleTimer);
  idleStage = 0;
  scheduleNextIdle();
}

function showStillHere(text) {
  // silence layer takes precedence — don't speak into a silence window
  if (window.MindSystem?.isSilent()) return;
  const el = document.createElement('div');
  el.className = 'still-here';
  el.textContent = text;
  el.style.opacity = '0';
  el.style.transition = 'opacity 2.5s ease';
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
  setTimeout(() => {
    el.style.transition = 'opacity 2s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 2100);
  }, 7000);
}

function brightenFragment() {
  const frags = document.querySelectorAll('.fragment:not(.opened)');
  if (!frags.length) return;
  const el = frags[Math.floor(Math.random() * frags.length)];
  el.style.transition = 'color 8s ease';
  el.style.color = 'rgba(212,207,201,0.6)';
  setTimeout(() => {
    el.style.transition = 'color 8s ease';
    el.style.color = 'rgba(212,207,201,0.38)';
  }, 8000);
}

document.addEventListener('mousemove', resetIdle);
document.addEventListener('keydown',   resetIdle);
resetIdle();

// ── Exit → portal ───────────────────────────────────────
document.getElementById('mind-exit').addEventListener('click', e => {
  e.preventDefault();
  const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.5;
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; border-radius:50%; pointer-events:none; z-index:9999;
    width:${size}px; height:${size}px;
    left:50%; top:50%;
    transform:translate(-50%,-50%) scale(0);
    background:#f0ebe0;
    transition:transform 0.72s cubic-bezier(0.7,0,0.3,1);
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.transform = 'translate(-50%,-50%) scale(1)';
  }));
  setTimeout(() => { window.location.href = 'index.html'; }, 720);
});
