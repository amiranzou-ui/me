// mind-nodes.js — Node System (visitor layer)
// Reads from localStorage (written by editor.html) and renders on #surface.

(function () {
'use strict';

const STORE_KEY    = 'mind_nodes_v1';
const INTERACT_KEY = 'mind_interactions_v1';

const surface = document.getElementById('surface');
const cursor  = document.getElementById('mind-cursor');
const visits  = parseInt(localStorage.getItem('mind_v') || '1');
const hour    = new Date().getHours();

let nodes        = loadNodes();
let interactions = loadInteractions();
let activeNodeEl = null;
let liveThreads  = [];

// ── Persistence ───────────────────────────────────────────
function loadNodes() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
}

function loadInteractions() {
  try { return JSON.parse(localStorage.getItem(INTERACT_KEY) || '{}'); }
  catch { return {}; }
}

function saveInteractions() { localStorage.setItem(INTERACT_KEY, JSON.stringify(interactions)); }

function recordInteraction(id) {
  interactions[id] = Date.now();
  saveInteractions();
  window.MindSystem?.recordInteraction();
}

// ── Visibility ────────────────────────────────────────────
function isVisible(node) {
  const v = node.visibility;
  if (v.public === false) return false;
  const c = v.conditions || {};
  if (c.minVisits && visits < c.minVisits) return false;
  if (c.maxVisits && visits > c.maxVisits) return false;
  if (c.hourRange) {
    const [s, e] = c.hourRange;
    const inside = s <= e ? (hour >= s && hour < e) : (hour >= s || hour < e);
    if (!inside) return false;
  }
  if (c.afterInteraction && !interactions[c.afterInteraction]) return false;
  return true;
}

function resolvedContent(node) {
  if (node.visibility.public === 'partial') {
    return node.fragment || (node.content || '').split('.')[0] + '…';
  }
  return node.content || '';
}

// ── Emergent connections ───────────────────────────────────
function emergentConnections(node, visibleNodes) {
  const seed   = visits * 17 + hour * 3;
  const weight = node.emotionWeight ?? 0.5;
  const pool   = visibleNodes.filter(n =>
    n.id !== node.id &&
    !(node.connections || []).includes(n.id) &&
    Math.abs((n.emotionWeight ?? 0.5) - weight) < 0.28
  );
  if (!pool.length) return [];
  const count  = Math.min(2, pool.length);
  const picked = [];
  for (let i = 0; i < count; i++) picked.push(pool[(seed + i * 11) % pool.length]);
  return picked;
}

// ── Thread rendering ──────────────────────────────────────
function clearThreads() {
  liveThreads.forEach(el => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 900);
  });
  liveThreads = [];
}

function drawThread(x1, y1, x2, y2, opts = {}) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const ax = x1/100*vw, ay = y1/100*vh;
  const bx = x2/100*vw, by = y2/100*vh;
  const len   = Math.hypot(bx-ax, by-ay);
  const angle = Math.atan2(by-ay, bx-ax) * 180 / Math.PI;

  const el = document.createElement('div');
  el.className = 'node-thread' + (opts.emergent ? ' emergent' : '');
  el.style.cssText = `left:${ax}px;top:${ay}px;width:${len}px;transform:rotate(${angle}deg);`;
  surface.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.opacity = opts.emergent ? '0.6' : '1';
  }));
  if (opts.pulse) {
    const dot = document.createElement('div');
    dot.className = 'thread-pulse';
    el.appendChild(dot);
  }
  liveThreads.push(el);
}

// ── Node rendering ────────────────────────────────────────
function renderNode(node, visibleNodes) {
  const existing = surface.querySelector(`.mind-node[data-id="${node.id}"]`);
  if (existing) existing.remove();

  if (node.type === 'void') return; // void nodes are invisible to visitors

  const el      = document.createElement('div');
  const opacity = 0.18 + (node.emotionWeight ?? 0.5) * 0.32;
  const content = resolvedContent(node);

  el.className     = 'mind-node' + (node.type === 'audio' ? ' audio-node' : '');
  el.dataset.id    = node.id;
  el.style.cssText = `left:${node.position.x}%;top:${node.position.y}%;color:rgba(212,207,201,0);`;

  if (node.type === 'image') {
    const img = document.createElement('img');
    img.src       = content;
    img.className = 'node-image';
    el.appendChild(img);
  } else {
    el.textContent = content;
  }

  // delayed fade-in
  const jitter   = (Math.random() - 0.5) * 0.16;
  const appearAt = Math.max(0, (node.delay || 1.2) + jitter) * 1000;
  setTimeout(() => {
    el.style.transition = 'color 1.4s cubic-bezier(0.4,0,0.6,1)';
    el.style.color      = `rgba(212,207,201,${opacity})`;
  }, appearAt);

  // hover
  el.addEventListener('mouseenter', () => {
    el.style.transition = 'color 0.5s cubic-bezier(0.2,0,0,1)';
    el.style.color      = 'rgba(212,207,201,0.85)';
    if (cursor) cursor.classList.add('hover');
  });
  el.addEventListener('mouseleave', () => {
    if (activeNodeEl !== el) {
      el.style.transition = 'color 1.4s cubic-bezier(0,0,0.4,1)';
      el.style.color      = `rgba(212,207,201,${opacity})`;
    }
    if (cursor) cursor.classList.remove('hover');
  });

  // click: reveal connections
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (activeNodeEl === el) {
      clearThreads();
      el.classList.remove('node-active');
      el.style.color = `rgba(212,207,201,${opacity})`;
      activeNodeEl   = null;
      return;
    }
    if (activeNodeEl) {
      clearThreads();
      activeNodeEl.classList.remove('node-active');
    }
    activeNodeEl = el;
    el.classList.add('node-active');
    recordInteraction(node.id);
    revealConnections(node, visibleNodes);
    window.MindSystem?.setFocus(node.id, e.clientX, e.clientY);
  });

  surface.appendChild(el);
}

function revealConnections(node, visibleNodes) {
  const nx = node.position.x, ny = node.position.y;
  (node.connections || []).forEach((cid, i) => {
    const target = visibleNodes.find(n => n.id === cid);
    if (!target) return;
    setTimeout(() => drawThread(nx, ny, target.position.x, target.position.y, { pulse: true }), i * 130);
  });
  emergentConnections(node, visibleNodes).forEach((target, i) => {
    const baseDelay = (node.connections || []).length * 130;
    setTimeout(() => drawThread(nx, ny, target.position.x, target.position.y, { emergent: true }), baseDelay + 200 + i * 260);
  });
}

// ── Collapse on bare click ────────────────────────────────
surface.addEventListener('click', () => {
  if (!activeNodeEl) return;
  clearThreads();
  activeNodeEl.classList.remove('node-active');
  activeNodeEl = null;
});

// ── Init ──────────────────────────────────────────────────
function init() {
  const visible = nodes.filter(isVisible);
  visible.forEach(node => renderNode(node, visible));
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
