/**
 * mind-author.js — Inline visual author mode for mind.html
 * Activated by window.MindAuthor.activate()
 * Reads/writes same localStorage as editor.html
 */
(function () {
'use strict';

const STORE_KEY = 'mind_nodes_v1';
const CONNS_KEY = 'mind_connections_meta_v1';

let nodes    = [];
let connMeta = [];
let active   = false;
let selected = null;
let dragging = null;   // { id, startX, startY, origX, origY }
let connecting = null; // { fromId } — drag from anchor to create connection

let amBar    = null;
let amPanel  = null;
let amSVG    = null;
let amStyle  = null;

// ── Persistence ───────────────────────────────────────────
function load() {
  try { nodes    = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { nodes    = []; }
  try { connMeta = JSON.parse(localStorage.getItem(CONNS_KEY) || '[]'); } catch { connMeta = []; }
  nodes.forEach(n => { n.connections = connMeta.filter(c => c.from === n.id).map(c => c.to); });
}

function save() {
  nodes.forEach(n => { n.connections = connMeta.filter(c => c.from === n.id).map(c => c.to); });
  localStorage.setItem(STORE_KEY, JSON.stringify(nodes));
  localStorage.setItem(CONNS_KEY, JSON.stringify(connMeta));
}

function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// ── Styles ────────────────────────────────────────────────
function injectStyles() {
  if (amStyle) return;
  amStyle = document.createElement('style');
  amStyle.textContent = `
    #am-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 8100;
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 9px 20px;
      background: rgba(6,4,2,0.94);
      border-bottom: 1px solid rgba(255,200,60,0.14);
      backdrop-filter: blur(10px);
      font-family: 'Inter', sans-serif;
    }
    .am-title  { font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,220,100,0.75); }
    .am-sep    { color: rgba(255,200,60,0.18); font-size: 11px; }
    .am-count  { font-size: 9px; color: rgba(200,185,160,0.35); letter-spacing: 0.5px; }
    .am-hint   { font-size: 8px; color: rgba(200,185,160,0.22); letter-spacing: 0.5px; margin-left: auto; }
    .am-btn {
      background: none; border: 1px solid rgba(255,200,60,0.22);
      color: rgba(255,220,100,0.65); padding: 4px 13px;
      font-family: 'Inter', sans-serif; font-size: 8px;
      letter-spacing: 1.5px; text-transform: uppercase;
      cursor: pointer; border-radius: 1px;
      transition: all 0.2s;
    }
    .am-btn:hover { border-color: rgba(255,200,60,0.60); color: rgba(255,230,120,1); }
    .am-btn.exit  { border-color: rgba(180,100,70,0.22); color: rgba(200,130,90,0.55); }
    .am-btn.exit:hover { border-color: rgba(200,90,60,0.55); color: rgba(220,110,80,1); }

    #am-svg {
      position: fixed; inset: 40px 0 0; pointer-events: none; z-index: 8000;
      width: 100%; height: calc(100% - 40px);
    }

    .am-node-el {
      cursor: grab !important;
      outline: 1px solid rgba(255,200,60,0.15) !important;
      transition: outline-color 0.25s, color 0.25s !important;
    }
    .am-node-el:hover { outline-color: rgba(255,200,60,0.50) !important; }
    .am-node-el.am-sel {
      outline: 1px solid rgba(255,200,60,0.80) !important;
      text-shadow: 0 0 14px rgba(255,200,60,0.35) !important;
    }
    .am-node-el.am-drag { cursor: grabbing !important; opacity: 0.75; z-index: 8050 !important; }

    .am-badge {
      position: absolute; top: -15px; left: 0;
      font-size: 8px; color: rgba(255,200,60,0.45);
      pointer-events: none; white-space: nowrap;
    }
    .am-coord {
      position: absolute; bottom: -15px; left: 0;
      font-size: 8px; color: rgba(200,185,160,0.30);
      font-family: 'Inter', sans-serif; pointer-events: none; white-space: nowrap;
    }
    .am-anchor {
      position: absolute; right: -10px; top: 50%;
      transform: translateY(-50%);
      width: 9px; height: 9px; border-radius: 50%;
      border: 1px solid rgba(255,200,60,0.35);
      background: rgba(6,4,2,0.8);
      cursor: crosshair; font-size: 7px; color: rgba(255,200,60,0.5);
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.2s, background 0.2s;
      pointer-events: auto;
    }
    .am-anchor:hover { border-color: rgba(255,200,60,0.9); background: rgba(40,30,5,0.9); }
    .am-void { color: rgba(255,200,60,0.30) !important; font-size: 13px !important; }
    .am-conn-line { cursor: pointer; pointer-events: stroke; }

    /* Inspector panel */
    #am-panel {
      position: fixed; top: 40px; right: 0; bottom: 0; width: 270px;
      z-index: 8200;
      background: rgba(5,3,1,0.97);
      border-left: 1px solid rgba(255,200,60,0.08);
      transform: translateX(100%);
      transition: transform 0.38s cubic-bezier(0.2,0,0.1,1);
      overflow-y: auto; padding: 18px 16px 48px;
      font-family: 'Inter', sans-serif;
    }
    #am-panel::-webkit-scrollbar { width: 0; }
    #am-panel.open { transform: translateX(0); }

    .ap-id    { font-size: 8px; color: rgba(200,185,160,0.22); margin-bottom: 14px; letter-spacing: 0.5px; }
    .ap-lbl   { display: block; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,200,60,0.32); margin: 14px 0 5px; }
    .ap-lbl:first-of-type { margin-top: 0; }
    .ap-ctrl  {
      width: 100%; background: rgba(255,200,60,0.03);
      border: 1px solid rgba(255,200,60,0.10); color: rgba(212,207,201,0.72);
      font-family: 'Cormorant Garamond', serif; font-size: 13px;
      padding: 7px 9px; outline: none; resize: vertical;
      transition: border-color 0.2s; box-sizing: border-box;
    }
    .ap-ctrl:focus { border-color: rgba(255,200,60,0.38); }
    select.ap-ctrl, input[type="number"].ap-ctrl { font-family: 'Inter', sans-serif; font-size: 11px; }
    input[type="range"].ap-ctrl { padding: 4px 0; cursor: pointer; }
    .ap-row   { display: flex; gap: 8px; }
    .ap-row > div { flex: 1; }
    .ap-ew-row { display: flex; justify-content: space-between; align-items: baseline; }
    .ap-ew-val { font-size: 9px; color: rgba(255,200,60,0.45); }

    .ap-conn-list { display: flex; flex-direction: column; gap: 0; margin-top: 4px; }
    .ap-conn-row  {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 0; border-bottom: 1px solid rgba(255,200,60,0.05);
      font-size: 10px;
    }
    .ap-conn-dir   { font-size: 9px; color: rgba(255,200,60,0.35); flex-shrink: 0; }
    .ap-conn-name  { flex: 1; color: rgba(200,185,160,0.50); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
    .ap-conn-type  { font-size: 8px; border: none; background: transparent; color: rgba(255,200,60,0.35); cursor: pointer; outline: none; padding: 0; }
    .ap-conn-x     { background: none; border: none; color: rgba(180,90,70,0.45); cursor: pointer; font-size: 14px; padding: 0 2px; transition: color 0.2s; flex-shrink: 0; }
    .ap-conn-x:hover { color: rgba(220,100,80,1); }
    .ap-none { font-size: 9px; color: rgba(200,185,160,0.22); }

    .ap-actions { display: flex; gap: 8px; margin-top: 20px; }
    .ap-save { flex: 1; }
    .ap-del  { border-color: rgba(180,80,60,0.22) !important; color: rgba(200,100,80,0.55) !important; }
    .ap-del:hover { border-color: rgba(200,80,60,0.55) !important; color: rgba(220,100,80,1) !important; }

    /* temp connection line */
    .am-conn-temp { position: fixed; pointer-events: none; z-index: 8300; }
  `;
  document.head.appendChild(amStyle);
}

// ── Activate / deactivate ─────────────────────────────────
function activate() {
  if (active) return;
  active = true;
  load();
  injectStyles();
  buildBar();
  buildSVG();
  buildPanel();
  renderAll();
  drawConnections();
}

function deactivate() {
  if (!active) return;
  active = false; selected = null; dragging = null; connecting = null;

  amBar?.remove();   amBar   = null;
  amPanel?.remove(); amPanel = null;
  amSVG?.remove();   amSVG   = null;
  amStyle?.remove(); amStyle = null;

  // strip author classes from all node elements
  document.querySelectorAll('.am-node-el').forEach(el => {
    el.classList.remove('am-node-el', 'am-sel', 'am-drag');
    el.style.cursor = '';
    el.querySelector('.am-badge')?.remove();
    el.querySelector('.am-coord')?.remove();
    el.querySelector('.am-anchor')?.remove();
    el._amBound = false;
  });

  // remove void placeholders that visitors don't see
  document.querySelectorAll('.am-void-placeholder').forEach(el => el.remove());
}

// ── Top bar ───────────────────────────────────────────────
function buildBar() {
  amBar = document.createElement('div');
  amBar.id = 'am-bar';
  amBar.innerHTML = `
    <span class="am-title">✦ author</span>
    <span class="am-sep">·</span>
    <span class="am-count" id="am-count"></span>
    <button class="am-btn" id="am-add">+ node</button>
    <span class="am-hint">double-click empty space to place · drag to move · drag ◦ to connect</span>
    <button class="am-btn exit" id="am-exit">exit</button>
  `;
  document.body.appendChild(amBar);
  document.getElementById('am-add').addEventListener('click', () => addNodeAt(
    30 + Math.random() * 40, 25 + Math.random() * 50
  ));
  document.getElementById('am-exit').addEventListener('click', deactivate);
  refreshCount();
}

function refreshCount() {
  const el = document.getElementById('am-count');
  if (el) el.textContent = `${nodes.length} nodes · ${connMeta.length} connections`;
}

// ── SVG connections ───────────────────────────────────────
const CONN_CLR = {
  logical:      'rgba(200,185,160,0.22)',
  contradiction:'rgba(200, 90, 80,0.40)',
  echo:         'rgba( 90,140,185,0.38)',
  hidden:       'rgba(200,185,160,0.07)',
};
const CONN_DASH = { logical:'none', contradiction:'none', echo:'2,4', hidden:'4,8' };

function buildSVG() {
  amSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  amSVG.id = 'am-svg';
  document.body.appendChild(amSVG);
}

function drawConnections() {
  if (!amSVG) return;
  while (amSVG.firstChild) amSVG.removeChild(amSVG.firstChild);

  const vw = window.innerWidth, vh = window.innerHeight - 40;

  connMeta.forEach(conn => {
    const from = nodes.find(n => n.id === conn.from);
    const to   = nodes.find(n => n.id === conn.to);
    if (!from || !to) return;

    const ax = from.position.x / 100 * vw;
    const ay = from.position.y / 100 * (window.innerHeight) - 40;
    const bx = to.position.x   / 100 * vw;
    const by = to.position.y   / 100 * (window.innerHeight) - 40;
    const cx1 = ax + (bx - ax) * 0.45, cx2 = bx - (bx - ax) * 0.45;
    const d   = `M${ax},${ay} C${cx1},${ay} ${cx2},${by} ${bx},${by}`;

    const isRelated = selected && (conn.from === selected || conn.to === selected);

    // hit area
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
    hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', '12');
    hit.style.cursor = 'pointer';
    hit.dataset.cid  = conn.id;
    hit.addEventListener('click', e => { e.stopPropagation(); cycleConnType(conn.id); });
    amSVG.appendChild(hit);

    // visible line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', CONN_CLR[conn.type] || CONN_CLR.logical);
    path.setAttribute('stroke-width', isRelated ? '1.8' : '1');
    path.setAttribute('stroke-dasharray', CONN_DASH[conn.type] || 'none');
    amSVG.appendChild(path);

    // type label on related connections
    if (isRelated && conn.type !== 'logical') {
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', mx); txt.setAttribute('y', my - 6);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', 'rgba(255,200,60,0.35)');
      txt.setAttribute('font-size', '8'); txt.setAttribute('font-family', 'Inter, sans-serif');
      txt.setAttribute('letter-spacing', '1');
      txt.textContent = conn.type;
      amSVG.appendChild(txt);
    }
  });
}

function cycleConnType(cid) {
  const types  = ['logical','echo','contradiction','hidden'];
  const conn   = connMeta.find(c => c.id === cid);
  if (!conn) return;
  conn.type = types[(types.indexOf(conn.type) + 1) % types.length];
  save(); drawConnections();
  if (selected) populatePanel(selected);
}

// ── Render all nodes in author mode ───────────────────────
function renderAll() {
  const surface = document.getElementById('surface');
  if (!surface) return;

  nodes.forEach(node => {
    try {
      // Ensure node has required fields
      if (!node.position) node.position = { x: 30 + Math.random() * 40, y: 25 + Math.random() * 50 };
      if (!node.visibility) node.visibility = { public: true, conditions: { minVisits: 1 } };

      let el = document.querySelector(`.mind-node[data-id="${node.id}"]`);

      if (!el) {
        el = document.createElement('div');
        el.className   = 'mind-node am-void-placeholder';
        el.dataset.id  = node.id;
        el.style.cssText = `position:absolute;font-family:'Cormorant Garamond',serif;font-size:13px;`;
        surface.appendChild(el);
      } else {
        // Clear any raw text nodes left by mind-nodes.js (el.textContent = ...) so we
        // don't end up with duplicate visible text once we insert the .am-text span.
        Array.from(el.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) child.remove();
        });
      }

      refreshNodeEl(el, node);
      bindNodeEl(el, node.id);
    } catch (err) {
      console.warn('[mind-author] renderAll error for node', node?.id, err);
    }
  });

  // Safety pass — re-read localStorage fresh to catch any nodes not yet in memory
  try {
    const fresh = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    fresh.forEach(fn => { if (!nodes.find(n => n.id === fn.id)) nodes.push(fn); });
    const freshConns = JSON.parse(localStorage.getItem(CONNS_KEY) || '[]');
    freshConns.forEach(fc => { if (!connMeta.find(c => c.id === fc.id)) connMeta.push(fc); });
  } catch {}

  // Bind ALL elements that have data-id — both .mind-node (nodes system)
  // and .fragment (hardcoded fragments that are now seeded into storage)
  document.querySelectorAll('[data-id].mind-node, [data-id].fragment').forEach(el => {
    if (el.classList.contains('am-node-el')) return;
    const id = el.dataset.id;
    if (!id) return;

    let node = nodes.find(n => n.id === id);
    if (!node) {
      // Still not found — reconstruct from DOM as fallback
      node = {
        id, type: 'text',
        content: (el.textContent || '').trim().slice(0, 300),
        fragment: null,
        visibility: { public: true, conditions: { minVisits: 1 } },
        emotionWeight: 0.5,
        position: { x: parseFloat(el.style.left) || 30, y: parseFloat(el.style.top) || 50 },
        connections: [], delay: 1.2,
      };
      nodes.push(node);
    }

    try {
      refreshNodeEl(el, node);
      bindNodeEl(el, node.id);
    } catch (err) {
      console.warn('[mind-author] safety pass error for', id, err);
    }
  });

  refreshCount();
}

function refreshNodeEl(el, node) {
  el.style.left  = node.position.x + '%';
  el.style.top   = node.position.y + '%';
  const opacity  = 0.18 + (node.emotionWeight ?? 0.5) * 0.32;
  el.style.color = node.type === 'void'
    ? 'rgba(255,200,60,0.28)'
    : `rgba(212,207,201,${opacity})`;

  // update label text
  const text = node.type === 'void'
    ? '∅'
    : (node.content || '—').slice(0, 65) + ((node.content || '').length > 65 ? '…' : '');
  let textSpan = el.querySelector('.am-text');
  if (!textSpan) {
    textSpan = document.createElement('span');
    textSpan.className = 'am-text';
    // Insert before any existing non-am- child (img, etc.) or at start
    const firstNonAm = Array.from(el.children).find(c => !c.className.startsWith('am-'));
    el.insertBefore(textSpan, firstNonAm || el.firstChild);
  }
  textSpan.textContent = text;
  // Hide the underlying img in author mode so the text label shows clearly
  const img = el.querySelector('img.node-image');
  if (img) img.style.opacity = '0.3';

  // badge
  let badge = el.querySelector('.am-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'am-badge';
    el.appendChild(badge);
  }
  const v = node.visibility?.public;
  badge.textContent = (v === true ? '◉ ' : v === 'partial' ? '◎ ' : '○ ') + node.type;

  // coord
  let coord = el.querySelector('.am-coord');
  if (!coord) {
    coord = document.createElement('span');
    coord.className = 'am-coord';
    el.appendChild(coord);
  }
  coord.textContent = `${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}`;

  // anchor for drawing connections
  let anchor = el.querySelector('.am-anchor');
  if (!anchor) {
    anchor = document.createElement('div');
    anchor.className = 'am-anchor';
    anchor.title     = 'drag to connect';
    anchor.textContent = '◦';
    el.appendChild(anchor);
    anchor.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();
      connecting = { fromId: el.dataset.id };
    });
  }

  el.classList.add('am-node-el');
  el.classList.toggle('am-sel', node.id === selected);
  el.style.position = 'absolute';
}

function bindNodeEl(el, id) {
  if (el._amBound) return;
  el._amBound = true;

  // Mousedown — starts drag only, does not select
  el.addEventListener('mousedown', e => {
    if (!active || e.target.classList.contains('am-anchor')) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    dragging = { id, startX: e.clientX, startY: e.clientY, origX: node.position.x, origY: node.position.y };
    el.classList.add('am-drag');
  });

  // Click — selects node and opens inspector, stops propagation so surface never fires
  el.addEventListener('click', e => {
    if (!active) return;
    e.stopPropagation();
    e.stopImmediatePropagation(); // prevent mind-nodes.js click handler from also firing
    let node = nodes.find(n => n.id === id);
    if (!node) {
      load();
      node = nodes.find(n => n.id === id);
      if (!node) return;
    }
    selectNode(id);
  }, true); // capture phase: fires before mind-nodes.js bubble listener
}

// ── Mouse events ──────────────────────────────────────────
let tempLineEl = null;

document.addEventListener('mousemove', e => {
  if (!active) return;

  // node drag
  if (dragging) {
    const node = nodes.find(n => n.id === dragging.id);
    if (!node) return;
    const dx = (e.clientX - dragging.startX) / window.innerWidth  * 100;
    const dy = (e.clientY - dragging.startY) / window.innerHeight * 100;
    node.position.x = Math.max(1, Math.min(96, dragging.origX + dx));
    node.position.y = Math.max(1, Math.min(96, dragging.origY + dy));
    const el = document.querySelector(`.mind-node[data-id="${dragging.id}"]`);
    if (el) {
      el.style.left = node.position.x + '%';
      el.style.top  = node.position.y + '%';
      const coord = el.querySelector('.am-coord');
      if (coord) coord.textContent = `${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}`;
    }
    drawConnections();
    return;
  }

  // connection drag: draw temp line
  if (connecting) {
    const from = nodes.find(n => n.id === connecting.fromId);
    if (!from) return;
    const fx = from.position.x / 100 * window.innerWidth;
    const fy = from.position.y / 100 * window.innerHeight;
    const len   = Math.hypot(e.clientX - fx, e.clientY - fy);
    const angle = Math.atan2(e.clientY - fy, e.clientX - fx) * 180 / Math.PI;
    if (!tempLineEl) {
      tempLineEl = document.createElement('div');
      tempLineEl.className = 'am-conn-temp';
      tempLineEl.style.cssText = 'height:1px;transform-origin:0 50%;background:rgba(255,200,60,0.35);';
      document.body.appendChild(tempLineEl);
    }
    tempLineEl.style.left      = fx + 'px';
    tempLineEl.style.top       = fy + 'px';
    tempLineEl.style.width     = len + 'px';
    tempLineEl.style.transform = `rotate(${angle}deg)`;
  }
});

document.addEventListener('mouseup', e => {
  if (!active) return;

  if (dragging) {
    save();
    document.querySelector(`.mind-node[data-id="${dragging.id}"]`)?.classList.remove('am-drag');
    dragging = null;
    return;
  }

  if (connecting) {
    tempLineEl?.remove(); tempLineEl = null;
    const target = e.target.closest('.am-node-el');
    if (target && target.dataset.id !== connecting.fromId) {
      const exists = connMeta.some(c => c.from === connecting.fromId && c.to === target.dataset.id);
      if (!exists) {
        connMeta.push({ id: uid(), from: connecting.fromId, to: target.dataset.id, type: 'logical' });
        save(); drawConnections();
        if (selected) populatePanel(selected);
        refreshCount();
      }
    }
    connecting = null;
  }
});

// ── Surface click → deselect ─────────────────────────────
document.getElementById('surface')?.addEventListener('click', e => {
  if (!active) return;
  if (e.target.closest('.mind-node')) return;
  deselect();
});

// ── Surface double-click → place node ────────────────────
document.getElementById('surface')?.addEventListener('dblclick', e => {
  if (!active) return;
  if (e.target.closest('.mind-node')) return;
  const x = e.clientX / window.innerWidth  * 100;
  const y = e.clientY / window.innerHeight * 100;
  addNodeAt(x, y);
});

// ── Node CRUD ─────────────────────────────────────────────
function addNodeAt(x, y) {
  const node = {
    id: uid(), type: 'text', content: '',  fragment: null,
    visibility: { public: true, conditions: { minVisits: 1 } },
    emotionWeight: 0.5,
    position: { x: Math.max(2, Math.min(95, x)), y: Math.max(6, Math.min(94, y)) },
    connections: [], delay: 1.2,
  };
  nodes.push(node);
  save();
  renderAll();
  drawConnections();
  refreshCount();
  selectNode(node.id);
}

function deleteNode(id) {
  nodes    = nodes.filter(n => n.id !== id);
  connMeta = connMeta.filter(c => c.from !== id && c.to !== id);
  save();
  document.querySelector(`.mind-node[data-id="${id}"]`)?.remove();
  deselect();
  drawConnections();
  refreshCount();
}

// ── Selection ─────────────────────────────────────────────
function selectNode(id) {
  selected = id;
  document.querySelectorAll('.am-node-el').forEach(el =>
    el.classList.toggle('am-sel', el.dataset.id === id));
  drawConnections();
  populatePanel(id);
  amPanel && amPanel.classList.add('open');
}

function deselect() {
  selected = null;
  document.querySelectorAll('.am-node-el').forEach(el => el.classList.remove('am-sel'));
  drawConnections();
  amPanel && amPanel.classList.remove('open');
}

// ── Inspector panel ───────────────────────────────────────
function buildPanel() {
  amPanel = document.createElement('div');
  amPanel.id = 'am-panel';
  document.body.appendChild(amPanel);
}

function populatePanel(id) {
  if (!amPanel) return;
  const node = nodes.find(n => n.id === id);
  if (!node) return;

  const related = connMeta.filter(c => c.from === id || c.to === id);
  const connRows = related.length
    ? related.map(c => {
        const oid   = c.from === id ? c.to : c.from;
        const other = nodes.find(n => n.id === oid);
        const dir   = c.from === id ? '→' : '←';
        const name  = (other?.content || oid).slice(0, 24);
        const types = ['logical','echo','contradiction','hidden'];
        return `<div class="ap-conn-row">
          <span class="ap-conn-dir">${dir}</span>
          <span class="ap-conn-name" title="${other?.content || ''}">${name}</span>
          <select class="ap-conn-type" data-cid="${c.id}">
            ${types.map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <button class="ap-conn-x" data-cid="${c.id}">×</button>
        </div>`;
      }).join('')
    : '<span class="ap-none">none — drag ◦ to connect</span>';

  const vis = String(node.visibility?.public ?? true);

  amPanel.innerHTML = `
    <div class="ap-id">${node.id}</div>

    <label class="ap-lbl">type</label>
    <select class="ap-ctrl" id="ap-type">
      ${['text','image','audio','void'].map(t =>
        `<option value="${t}" ${node.type===t?'selected':''}>${t}</option>`).join('')}
    </select>

    <label class="ap-lbl">content</label>
    <textarea class="ap-ctrl" id="ap-content" rows="4">${node.content || ''}</textarea>

    <label class="ap-lbl">fragment <span style="opacity:.4;font-size:8px">— shown when visibility=partial</span></label>
    <input class="ap-ctrl" id="ap-fragment" value="${node.fragment || ''}" placeholder="overheard version…">

    <label class="ap-lbl">visibility</label>
    <select class="ap-ctrl" id="ap-vis">
      <option value="true"    ${vis==='true'   ?'selected':''}>◉ public</option>
      <option value="partial" ${vis==='partial'?'selected':''}>◎ partial</option>
      <option value="false"   ${vis==='false'  ?'selected':''}>○ private</option>
    </select>

    <div class="ap-row">
      <div>
        <label class="ap-lbl">min visits</label>
        <input class="ap-ctrl" id="ap-minv" type="number" min="1" value="${node.visibility?.conditions?.minVisits || 1}">
      </div>
      <div>
        <label class="ap-lbl">delay (s)</label>
        <input class="ap-ctrl" id="ap-delay" type="number" step="0.1" value="${node.delay || 1.2}">
      </div>
    </div>

    <div class="ap-ew-row">
      <label class="ap-lbl" style="margin:14px 0 5px">emotion weight</label>
      <span class="ap-ew-val" id="ap-ew-val">${(node.emotionWeight ?? 0.5).toFixed(2)}</span>
    </div>
    <input class="ap-ctrl" id="ap-ew" type="range" min="0" max="1" step="0.05" value="${node.emotionWeight ?? 0.5}">

    <label class="ap-lbl">connections <span style="opacity:.4;font-size:8px">— click line to cycle type</span></label>
    <div class="ap-conn-list">${connRows}</div>

    <div class="ap-actions">
      <button class="am-btn ap-save" id="ap-save">save</button>
      <button class="am-btn ap-del"  id="ap-del">delete</button>
    </div>
  `;

  amPanel.querySelector('#ap-ew').addEventListener('input', function () {
    amPanel.querySelector('#ap-ew-val').textContent = parseFloat(this.value).toFixed(2);
  });

  amPanel.querySelectorAll('.ap-conn-type').forEach(sel => {
    sel.addEventListener('change', () => {
      const c = connMeta.find(c => c.id === sel.dataset.cid);
      if (c) { c.type = sel.value; save(); drawConnections(); }
    });
  });

  amPanel.querySelectorAll('.ap-conn-x').forEach(btn => {
    btn.addEventListener('click', () => {
      connMeta = connMeta.filter(c => c.id !== btn.dataset.cid);
      save(); drawConnections(); populatePanel(id); refreshCount();
    });
  });

  amPanel.querySelector('#ap-save').addEventListener('click', () => {
    const rawVis = amPanel.querySelector('#ap-vis').value;
    node.type          = amPanel.querySelector('#ap-type').value;
    node.content       = amPanel.querySelector('#ap-content').value.trim();
    node.fragment      = amPanel.querySelector('#ap-fragment').value.trim() || null;
    node.visibility.public = rawVis === 'true' ? true : rawVis === 'false' ? false : 'partial';
    node.visibility.conditions = node.visibility.conditions || {};
    node.visibility.conditions.minVisits = parseInt(amPanel.querySelector('#ap-minv').value) || 1;
    node.delay         = parseFloat(amPanel.querySelector('#ap-delay').value) || 1.2;
    node.emotionWeight = parseFloat(amPanel.querySelector('#ap-ew').value) ?? 0.5;
    save();
    const el = document.querySelector(`.mind-node[data-id="${id}"]`);
    if (el) refreshNodeEl(el, node);
    drawConnections();
    populatePanel(id);
  });

  amPanel.querySelector('#ap-del').addEventListener('click', () => deleteNode(id));
}

// ── Keyboard ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!active) return;
  if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.key === 'Escape') { selected ? deselect() : deactivate(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected) deleteNode(selected);
  if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (selected) amPanel?.querySelector('#ap-save')?.click(); }
});

window.addEventListener('resize', () => { if (active) drawConnections(); });

// ── Export ────────────────────────────────────────────────
window.MindAuthor = { activate, deactivate, isActive: () => active };

})();
