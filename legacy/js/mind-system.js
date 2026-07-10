// mind-system.js — Rule Engine + Attention Flow + Silence Layer
// Higher-order controller. Sits above all existing systems.
// Exposes window.MindSystem for integration with mind.js / mind-nodes.js.

(function () {
'use strict';

// ── System State ──────────────────────────────────────────
const State = {
  phase:            'arrival',   // arrival → exploration → depth → saturation
  emotionWeight:    0.3,         // 0–1, global emotional intensity
  silenceActive:    false,
  silenceUntil:     0,
  focusId:          null,
  interactionCount: 0,
  sessionStart:     Date.now(),
  visits:           parseInt(localStorage.getItem('mind_v') || '1'),
  hour:             new Date().getHours(),
};

// ── Phase engine ──────────────────────────────────────────
// Phases are time + interaction thresholds. Revisits compress the arrival phase.
const PHASES = [
  { name: 'arrival',     minInteractions: 0, minSeconds: 0   },
  { name: 'exploration', minInteractions: 2, minSeconds: 28  },
  { name: 'depth',       minInteractions: 5, minSeconds: 100 },
  { name: 'saturation',  minInteractions: 9, minSeconds: 260 },
];

function resolvePhase() {
  const secs = (Date.now() - State.sessionStart) / 1000;
  // revisit: skip arrival entirely
  const startIdx = State.visits > 1 ? 1 : 0;
  let result = PHASES[startIdx].name;
  for (let i = startIdx; i < PHASES.length; i++) {
    if (State.interactionCount >= PHASES[i].minInteractions &&
        secs >= PHASES[i].minSeconds) {
      result = PHASES[i].name;
    }
  }
  return result;
}

// ── Rule Engine ───────────────────────────────────────────
// Rules are evaluated in priority order. Each rule fires once per cooldown.
// They emit action objects; the engine applies them to State.

const Rules = [
  {
    id:       'arrival_opening_silence',
    priority: 10,
    when:     s => s.phase === 'arrival',
    then:     s => ({ silence: Math.max(0, 3800 - (Date.now() - s.sessionStart)) }),
    oneShot:  true, _fired: false,
  },
  {
    id:       'post_interaction_pause',
    priority: 7,
    when:     s => s.interactionCount > 0,
    then:     s => ({ silence: 1400 + Math.random() * 900 }),
    oneShot:  false, cooldown: 9000, _lastFired: 0,
  },
  {
    id:       'depth_emotion_rise',
    priority: 4,
    when:     s => s.phase === 'depth' && s.emotionWeight < 0.68,
    then:     s => ({ emotion: Math.min(s.emotionWeight + 0.06, 0.68) }),
    oneShot:  false, cooldown: 12000, _lastFired: 0,
  },
  {
    id:       'saturation_recession',
    priority: 4,
    when:     s => s.phase === 'saturation' && s.emotionWeight > 0.32,
    then:     s => ({ emotion: Math.max(s.emotionWeight - 0.04, 0.32) }),
    oneShot:  false, cooldown: 15000, _lastFired: 0,
  },
  {
    id:       'late_night_intensity',
    priority: 6,
    when:     s => s.hour >= 0 && s.hour < 4,
    then:     s => ({ emotion: Math.min(s.emotionWeight + 0.14, 0.82) }),
    oneShot:  true, _fired: false,
  },
  {
    id:       'exploration_attention_shift',
    priority: 3,
    when:     s => s.phase === 'exploration' && s.focusId !== null,
    then:     s => ({ attentionDrift: true }),
    oneShot:  false, cooldown: 22000, _lastFired: 0,
  },
  {
    id:       'depth_silence_window',
    priority: 5,
    when:     s => s.phase === 'depth',
    then:     s => ({ silence: 2200 + Math.random() * 1800 }),
    oneShot:  false, cooldown: 45000, _lastFired: 0,
  },
  {
    id:       'saturation_long_silence',
    priority: 8,
    when:     s => s.phase === 'saturation',
    then:     s => ({ silence: 4000 + Math.random() * 3000 }),
    oneShot:  false, cooldown: 60000, _lastFired: 0,
  },
];

function evaluateRules() {
  const now     = Date.now();
  State.phase   = resolvePhase();
  const actions = [];

  for (const rule of Rules.slice().sort((a, b) => b.priority - a.priority)) {
    if (rule.oneShot  && rule._fired) continue;
    if (rule.cooldown && now - rule._lastFired < rule.cooldown) continue;
    if (!rule.when(State)) continue;

    actions.push({ ruleId: rule.id, ...rule.then(State) });
    if (rule.oneShot) rule._fired = true;
    if (rule.cooldown) rule._lastFired = now;
  }
  return actions;
}

function applyActions(actions) {
  for (const a of actions) {
    if (a.silence     !== undefined) scheduleSilence(a.silence);
    if (a.emotion     !== undefined) setEmotion(a.emotion);
    if (a.attentionDrift)            driftAttention();
  }
}

// ── Silence Layer ─────────────────────────────────────────
// Silence is an active state: visual dimming, audio gate, no new events.
// CSS class body.sys-silence drives the visual; JS gates drive the logic.

const silenceListeners = { start: [], end: [] };

function scheduleSilence(duration) {
  if (State.silenceActive || duration <= 0) return;
  State.silenceActive = true;
  State.silenceUntil  = Date.now() + duration;

  document.body.classList.add('sys-silence');
  silenceListeners.start.forEach(fn => fn(duration));

  setTimeout(() => {
    State.silenceActive = false;
    document.body.classList.remove('sys-silence');
    silenceListeners.end.forEach(fn => fn());
  }, duration);
}

function gate(fn, { force = false } = {}) {
  if (!State.silenceActive || force) fn();
}

// ── Emotion system ────────────────────────────────────────
// Emotion weight drives a CSS variable that existing elements can read.

function setEmotion(value) {
  State.emotionWeight = Math.max(0, Math.min(1, value));
  document.documentElement.style.setProperty(
    '--sys-emotion', State.emotionWeight.toFixed(3)
  );
  // adjust grain subtly: deeper emotion = slightly more texture
  document.documentElement.style.setProperty(
    '--grain-opacity', (0.05 + State.emotionWeight * 0.05).toFixed(3)
  );
}

// ── Attention Flow ────────────────────────────────────────
// Attention is spatial: focusing on one node suppresses nearby ones.
// Suppression decays naturally; the map prevents over-suppressing.

const AttentionMap = new Map(); // elementId → { weight, el }
const DECAY_RATE   = 0.0018;   // per 100ms tick — slow drift back to baseline

function setFocus(id, clientX, clientY) {
  State.focusId = id;

  // boost the focused element
  const focusEl = document.querySelector(`[data-id="${id}"]`);
  if (focusEl) applyAttentionWeight(focusEl, id, 1.0);

  // spatially suppress neighbors within 320px
  document.querySelectorAll('.fragment:not(.opened), .mind-node').forEach(el => {
    const eid = el.dataset.id || ('frag_' + el.textContent.trim().slice(0, 16));
    if (eid === id) return;

    const r    = el.getBoundingClientRect();
    const cx   = (r.left + r.right) / 2;
    const cy   = (r.top + r.bottom) / 2;
    const dist = Math.hypot(cx - clientX, cy - clientY);

    if (dist < 320) {
      const current = AttentionMap.get(eid)?.weight ?? 0.5;
      const next    = Math.max(current - 0.28, 0.12);
      applyAttentionWeight(el, eid, next);
    }
  });
}

function applyAttentionWeight(el, id, weight) {
  if (!el) return;
  AttentionMap.set(id, { weight, el });
  // attention suppression uses opacity — doesn't interfere with color system
  if (weight < 0.85) {
    el.style.setProperty('--attention', weight.toFixed(3));
    el.classList.add('attention-modulated');
  } else {
    el.style.removeProperty('--attention');
    el.classList.remove('attention-modulated');
  }
}

// Drift: suppressed elements recover toward baseline over ~30s
function tickAttention() {
  if (State.silenceActive) return; // freeze attention during silence
  AttentionMap.forEach(({ weight, el }, id) => {
    if (weight >= 0.5) { AttentionMap.delete(id); return; }
    const next = Math.min(weight + DECAY_RATE, 0.5);
    if (el && el.isConnected) applyAttentionWeight(el, id, next);
    else AttentionMap.delete(id);
  });
}

// Deliberate drift: shift emphasis to an un-interacted element
function driftAttention() {
  const candidates = [...document.querySelectorAll('.fragment:not(.opened), .mind-node')]
    .filter(el => {
      const id = el.dataset.id || el.textContent.trim().slice(0, 16);
      return !AttentionMap.has(id) || AttentionMap.get(id).weight > 0.7;
    });

  if (!candidates.length) return;

  // pick a candidate that's been on screen longest (heuristic: low tab order index)
  const target = candidates[Math.floor(Math.random() * Math.min(candidates.length, 4))];
  const id     = target.dataset.id || target.textContent.trim().slice(0, 16);

  // gently suppress everything else
  document.querySelectorAll('.fragment:not(.opened), .mind-node').forEach(el => {
    const eid = el.dataset.id || el.textContent.trim().slice(0, 16);
    if (eid !== id) applyAttentionWeight(el, eid, 0.35);
  });

  // let the target recover to full
  applyAttentionWeight(target, id, 1.0);

  // after 7s, begin returning to normal
  setTimeout(() => {
    AttentionMap.forEach(({ el }, eid) => {
      if (el && el.isConnected) applyAttentionWeight(el, eid, 0.5);
    });
  }, 7000);
}

// ── Public API ────────────────────────────────────────────
window.MindSystem = {
  // State access
  state:          State,
  isSilent:       ()      => State.silenceActive,
  getPhase:       ()      => State.phase,
  getEmotion:     ()      => State.emotionWeight,

  // Silence
  gate,
  onSilenceStart: fn      => silenceListeners.start.push(fn),
  onSilenceEnd:   fn      => silenceListeners.end.push(fn),

  // Interaction registration — call from mind.js / mind-nodes.js
  recordInteraction: () => {
    State.interactionCount++;
    State.phase = resolvePhase();
    // each interaction triggers a short post-action silence
    if (!State.silenceActive) {
      setTimeout(() => scheduleSilence(1000 + Math.random() * 700), 250);
    }
  },

  // Attention — call on any meaningful focus event
  setFocus,
};

// ── Rule loop ─────────────────────────────────────────────
// Evaluates every 5s — rule engine is deliberate, not reactive.
// Attention ticks faster to keep drift smooth.

window.addEventListener('load', () => {
  setEmotion(State.emotionWeight); // initialize CSS variables

  // immediate first eval
  applyActions(evaluateRules());

  setInterval(() => { applyActions(evaluateRules()); }, 5000);
  setInterval(tickAttention, 100);
});

})();
