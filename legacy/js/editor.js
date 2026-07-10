'use strict';

// ── Config ────────────────────────────────────────────────
const NODES_KEY  = 'mind_nodes_v1';
const CONNS_KEY  = 'mind_connections_meta_v1';
const CANVAS_W   = 3000;
const CANVAS_H   = 2000;

// ── State ─────────────────────────────────────────────────
let nodes     = [];
let connMeta  = [];   // { id, from, to, type }
let selected  = null; // selected node id
let mode      = 'edit';
let panX = 0, panY = 0, scale = 1;

let dragging   = null; // { id, startX, startY, origX, origY }
let connecting = null; // { fromId }
let isPanning  = false;
let panStart   = { x: 0, y: 0 };

// ── DOM ───────────────────────────────────────────────────
const canvas     = document.getElementById('ed-canvas');
const canvasWrap = document.getElementById('ed-canvas-wrap');
const svg        = document.getElementById('ed-svg');

svg.setAttribute('width',  CANVAS_W);
svg.setAttribute('height', CANVAS_H);

// ── Persistence ───────────────────────────────────────────
function loadData() {
  try { nodes    = JSON.parse(localStorage.getItem(NODES_KEY)  || '[]'); } catch { nodes    = []; }
  try { connMeta = JSON.parse(localStorage.getItem(CONNS_KEY)  || '[]'); } catch { connMeta = []; }

  // migrate: ensure every node.connections entry has a connMeta record
  nodes.forEach(n => {
    (n.connections || []).forEach(toId => {
      if (!connMeta.find(c => c.from === n.id && c.to === toId)) {
        connMeta.push({ id: uid(), from: n.id, to: toId, type: 'logical' });
      }
    });
  });
}

function saveNodes() {
  // sync backward-compat connections array for mind-nodes.js
  nodes.forEach(n => {
    n.connections = connMeta.filter(c => c.from === n.id).map(c => c.to);
  });
  localStorage.setItem(NODES_KEY, JSON.stringify(nodes));
}

function saveConnMeta() {
  saveNodes();
  localStorage.setItem(CONNS_KEY, JSON.stringify(connMeta));
}

function uid() {
  return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ── Node CRUD ─────────────────────────────────────────────
function addNode(type) {
  // place near viewport center
  const cx = (canvasWrap.offsetWidth  / 2 - panX) / scale;
  const cy = (canvasWrap.offsetHeight / 2 - panY) / scale;
  const node = {
    id:      uid(),
    type,
    content: type === 'void' ? '' : '',
    fragment: null,
    visibility: { public: true, conditions: { minVisits: 1 } },
    emotionWeight: 0.5,
    position: {
      x: Math.min(93, Math.max(4, cx / CANVAS_W * 100 + (Math.random() - 0.5) * 6)),
      y: Math.min(90, Math.max(4, cy / CANVAS_H * 100 + (Math.random() - 0.5) * 6))
    },
    connections: [],
    delay: 1.2
  };
  nodes.push(node);
  saveNodes();
  renderNode(node);
  updateStatus();
  selectNode(node.id);
  return node;
}

function deleteNode(id) {
  nodes    = nodes.filter(n => n.id !== id);
  connMeta = connMeta.filter(c => c.from !== id && c.to !== id);
  saveConnMeta();
  canvas.querySelector(`.ec-node[data-id="${id}"]`)?.remove();
  renderConnections();
  if (selected === id) deselect();
  updateStatus();
}

function addConnection(fromId, toId, type = 'logical') {
  if (connMeta.find(c => c.from === fromId && c.to === toId)) return;
  connMeta.push({ id: uid(), from: fromId, to: toId, type });
  saveConnMeta();
  renderConnections();
  if (selected) populateInspector(selected);
  updateStatus();
}

function deleteConnection(connId) {
  connMeta = connMeta.filter(c => c.id !== connId);
  saveConnMeta();
  renderConnections();
  if (selected) populateInspector(selected);
  updateStatus();
}

// ── Canvas Transform ──────────────────────────────────────
function applyTransform() {
  canvas.style.transform = `translate(${panX}px,${panY}px) scale(${scale})`;
  document.getElementById('zoom-label').textContent = Math.round(scale * 100) + '%';
}

function fitView() {
  if (!nodes.length) return;
  const xs = nodes.map(n => n.position.x / 100 * CANVAS_W);
  const ys = nodes.map(n => n.position.y / 100 * CANVAS_H);
  const x0 = Math.min(...xs) - 100, x1 = Math.max(...xs) + 240;
  const y0 = Math.min(...ys) - 80,  y1 = Math.max(...ys) + 120;
  const ww = canvasWrap.offsetWidth, wh = canvasWrap.offsetHeight;
  scale = Math.min(ww / (x1 - x0), wh / (y1 - y0), 1.6) * 0.88;
  panX  = (ww  - (x0 + x1) * scale) / 2;
  panY  = (wh  - (y0 + y1) * scale) / 2;
  applyTransform();
}

function scrollToNode(id) {
  const n = nodes.find(n => n.id === id);
  if (!n) return;
  panX = canvasWrap.offsetWidth  / 2 - (n.position.x / 100 * CANVAS_W) * scale;
  panY = canvasWrap.offsetHeight / 2 - (n.position.y / 100 * CANVAS_H) * scale;
  applyTransform();
}

// ── Node Rendering ────────────────────────────────────────
const TYPE_ICONS = { text: '¶', image: '⬚', audio: '♩', void: '∅' };

function renderNode(node) {
  let el = canvas.querySelector(`.ec-node[data-id="${node.id}"]`);

  if (!el) {
    el = document.createElement('div');
    el.className  = 'ec-node';
    el.dataset.id = node.id;
    el.innerHTML  = `
      <div class="ec-node-top">
        <span class="ec-node-icon"></span>
        <span class="ec-node-vis"></span>
      </div>
      <div class="ec-node-body">
        <p class="ec-node-text"></p>
      </div>
      <div class="ec-node-anchor" title="drag to connect">◦</div>
    `;
    canvas.appendChild(el);
    bindNodeEvents(el, node.id);
  }

  // content
  const label = node.type === 'void'
    ? '∅'
    : (node.content || '').slice(0, 72) + ((node.content || '').length > 72 ? '…' : '');
  el.querySelector('.ec-node-text').textContent = label || '—';
  el.querySelector('.ec-node-icon').textContent = TYPE_ICONS[node.type] || '¶';
  el.querySelector('.ec-node-vis').textContent  = visBadge(node);

  // position
  el.style.left = node.position.x + '%';
  el.style.top  = node.position.y + '%';

  // state classes
  el.className = ['ec-node',
    'type-' + node.type,
    node.visibility.public === false    ? 'vis-private' : '',
    node.visibility.public === 'partial'? 'vis-partial'  : '',
    selected === node.id                ? 'is-selected'  : '',
    mode === 'preview' && !previewVisible(node) ? 'preview-hidden' : ''
  ].filter(Boolean).join(' ');

  return el;
}

function visBadge(n) {
  return n.visibility.public === true ? '◉' : n.visibility.public === 'partial' ? '◎' : '○';
}

function renderAllNodes() { nodes.forEach(n => renderNode(n)); }

// ── Connection Rendering ──────────────────────────────────
const CONN_STYLE = {
  logical:      { stroke: 'rgba(212,207,201,0.2)',  dash: 'none' },
  contradiction:{ stroke: 'rgba(190,110,100,0.3)',  dash: '7,4'  },
  echo:         { stroke: 'rgba(110,145,185,0.28)', dash: '2,3'  },
  hidden:       { stroke: 'rgba(212,207,201,0.06)', dash: '3,7'  }
};

function renderConnections() {
  svg.querySelectorAll('path.ec-conn, path.ec-conn-hl').forEach(p => p.remove());

  connMeta.forEach(conn => {
    const from = nodes.find(n => n.id === conn.from);
    const to   = nodes.find(n => n.id === conn.to);
    if (!from || !to) return;
    if (mode === 'preview' && (conn.type === 'hidden' || !previewVisible(from) || !previewVisible(to))) return;

    const ax = from.position.x / 100 * CANVAS_W;
    const ay = from.position.y / 100 * CANVAS_H;
    const bx = to.position.x   / 100 * CANVAS_W;
    const by = to.position.y   / 100 * CANVAS_H;

    // natural S-curve
    const cx1 = ax + (bx - ax) * 0.42;
    const cx2 = bx - (bx - ax) * 0.42;
    const d   = `M ${ax},${ay} C ${cx1},${ay} ${cx2},${by} ${bx},${by}`;

    const style = CONN_STYLE[conn.type] || CONN_STYLE.logical;

    // invisible wider hit area
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.setAttribute('d', d);
    hit.setAttribute('class', 'ec-conn-hit');
    hit.dataset.connId = conn.id;
    hit.addEventListener('click', e => { e.stopPropagation(); openConnEditor(conn); });
    svg.appendChild(hit);

    // visible line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'ec-conn' +
      (selected && (conn.from === selected || conn.to === selected) ? ' is-related' : ''));
    path.dataset.connId = conn.id;
    path.style.stroke      = style.stroke;
    path.style.strokeDasharray = style.dash;
    svg.appendChild(path);
  });
}

// temporary line while connecting
let tempLine = null;
function moveTempLine(fx, fy, tx, ty) {
  if (!tempLine) {
    tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('class', 'ec-conn-temp');
    svg.appendChild(tempLine);
  }
  tempLine.setAttribute('x1', fx); tempLine.setAttribute('y1', fy);
  tempLine.setAttribute('x2', tx); tempLine.setAttribute('y2', ty);
}
function clearTempLine() { tempLine?.remove(); tempLine = null; }

// ── Connection Editor popup ───────────────────────────────
function openConnEditor(conn) {
  document.getElementById('conn-popup')?.remove();
  const from = nodes.find(n => n.id === conn.from);
  const to   = nodes.find(n => n.id === conn.to);

  const pop = document.createElement('div');
  pop.id = 'conn-popup';
  pop.innerHTML = `
    <div class="cp-row">
      <span class="cp-label">connection type</span>
      <button class="cp-close" id="cp-close">×</button>
    </div>
    <div class="cp-row cp-names">
      <span class="cp-node">${(from?.content || from?.id || '').slice(0,18)}</span>
      <span class="cp-arrow">→</span>
      <span class="cp-node">${(to?.content || to?.id || '').slice(0,18)}</span>
    </div>
    <div class="cp-types">
      ${['logical','contradiction','echo','hidden'].map(t =>
        `<button class="cp-type ${conn.type === t ? 'active' : ''}" data-type="${t}">${t}</button>`
      ).join('')}
    </div>
    <button class="cp-del" id="cp-del">remove connection</button>
  `;
  document.body.appendChild(pop);

  pop.querySelectorAll('.cp-type').forEach(btn => {
    btn.addEventListener('click', () => {
      conn.type = btn.dataset.type;
      saveConnMeta();
      renderConnections();
      pop.querySelectorAll('.cp-type').forEach(b => b.classList.toggle('active', b.dataset.type === conn.type));
    });
  });

  pop.querySelector('#cp-close').addEventListener('click', () => pop.remove());
  pop.querySelector('#cp-del').addEventListener('click', () => {
    deleteConnection(conn.id);
    pop.remove();
  });
}

// ── Node Event Binding ────────────────────────────────────
function bindNodeEvents(el, nodeId) {
  el.addEventListener('mousedown', e => {
    if (e.target.closest('.ec-node-anchor')) return;
    e.stopPropagation();
    selectNode(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node || mode === 'preview') return;
    dragging = {
      id: nodeId,
      startX: e.clientX, startY: e.clientY,
      origX: node.position.x, origY: node.position.y
    };
    el.classList.add('is-dragging');
  });

  el.querySelector('.ec-node-anchor').addEventListener('mousedown', e => {
    if (mode === 'preview') return;
    e.stopPropagation();
    e.preventDefault();
    connecting = { fromId: nodeId };
    document.body.classList.add('body-connecting');
  });
}

// ── Selection ─────────────────────────────────────────────
function selectNode(id) {
  selected = id;
  canvas.querySelectorAll('.ec-node').forEach(el =>
    el.classList.toggle('is-selected', el.dataset.id === id));
  renderConnections();
  populateInspector(id);
  updateStatus();
}

function deselect() {
  selected = null;
  canvas.querySelectorAll('.ec-node').forEach(el => el.classList.remove('is-selected'));
  renderConnections();
  document.getElementById('insp-empty').hidden = false;
  document.getElementById('insp-form').hidden  = true;
  updateStatus();
}

// ── Inspector ─────────────────────────────────────────────
function populateInspector(id) {
  const node = nodes.find(n => n.id === id);
  if (!node) { deselect(); return; }

  document.getElementById('insp-empty').hidden = false; // keep both visible
  document.getElementById('insp-empty').hidden = true;
  document.getElementById('insp-form').hidden  = false;

  document.getElementById('insp-id-display').textContent = node.id;
  document.getElementById('insp-type-chip').textContent  = node.type;
  document.getElementById('insp-type').value    = node.type;
  document.getElementById('insp-content').value = node.content || '';
  document.getElementById('insp-fragment').value = node.fragment || '';
  document.getElementById('insp-vis').value     = String(node.visibility.public);
  document.getElementById('insp-minv').value    = node.visibility.conditions?.minVisits || 1;
  document.getElementById('insp-delay').value   = node.delay || 1.2;
  document.getElementById('insp-ew').value      = node.emotionWeight ?? 0.5;
  document.getElementById('insp-ew-val').textContent = (node.emotionWeight ?? 0.5).toFixed(2);

  // connections list
  const list   = document.getElementById('insp-conn-list');
  const related = connMeta.filter(c => c.from === id || c.to === id);

  if (!related.length) {
    list.innerHTML = '<span class="insp-none">no connections yet</span>';
    return;
  }

  list.innerHTML = related.map(c => {
    const otherId = c.from === id ? c.to : c.from;
    const other   = nodes.find(n => n.id === otherId);
    const dir     = c.from === id ? '→' : '←';
    const label   = (other?.content || otherId || '').slice(0, 22);
    return `
      <div class="conn-row" data-conn="${c.id}">
        <span class="conn-dir">${dir}</span>
        <span class="conn-lbl" title="${other?.content || ''}">${label}</span>
        <select class="conn-type-sel">
          ${['logical','contradiction','echo','hidden'].map(t =>
            `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`
          ).join('')}
        </select>
        <button class="conn-x" data-cid="${c.id}">×</button>
      </div>`;
  }).join('');

  list.querySelectorAll('.conn-type-sel').forEach((sel, i) => {
    sel.addEventListener('change', () => {
      related[i].type = sel.value;
      saveConnMeta();
      renderConnections();
    });
  });

  list.querySelectorAll('.conn-x').forEach(btn => {
    btn.addEventListener('click', () => deleteConnection(btn.dataset.cid));
  });
}

function saveFromInspector() {
  const node = nodes.find(n => n.id === selected);
  if (!node) return;
  const rawVis = document.getElementById('insp-vis').value;
  node.type         = document.getElementById('insp-type').value;
  node.content      = document.getElementById('insp-content').value.trim();
  node.fragment     = document.getElementById('insp-fragment').value.trim() || null;
  node.visibility.public = rawVis === 'true' ? true : rawVis === 'false' ? false : 'partial';
  node.visibility.conditions.minVisits = parseInt(document.getElementById('insp-minv').value) || 1;
  node.delay        = parseFloat(document.getElementById('insp-delay').value) || 1.2;
  node.emotionWeight = parseFloat(document.getElementById('insp-ew').value) ?? 0.5;
  saveNodes();
  renderNode(node);
  document.getElementById('insp-type-chip').textContent = node.type;
}

// ── Preview Mode ──────────────────────────────────────────
const previewVisits = parseInt(localStorage.getItem('mind_v') || '1');
const previewHour   = new Date().getHours();

function previewVisible(node) {
  if (node.visibility.public === false) return false;
  const c = node.visibility.conditions || {};
  if (c.minVisits && previewVisits < c.minVisits) return false;
  if (c.hourRange) {
    const [s, e] = c.hourRange;
    const ok = s <= e ? (previewHour >= s && previewHour < e) : (previewHour >= s || previewHour < e);
    if (!ok) return false;
  }
  return true;
}

function setMode(m) {
  mode = m;
  document.getElementById('btn-edit').classList.toggle('active', m === 'edit');
  document.getElementById('btn-preview').classList.toggle('active', m === 'preview');
  document.getElementById('ed-preview-badge').style.opacity = m === 'preview' ? '1' : '0';
  document.getElementById('sb-mode').textContent = m + ' mode';
  canvas.classList.toggle('in-preview', m === 'preview');
  renderAllNodes();
  renderConnections();
}

// ── Timeline ──────────────────────────────────────────────
const PHASE_BANDS = [
  { name: 'arrival',     min: 0,    max: 1.2  },
  { name: 'exploration', min: 1.2,  max: 2.2  },
  { name: 'depth',       min: 2.2,  max: 3.5  },
  { name: 'saturation',  min: 3.5,  max: Infinity }
];

function renderTimeline() {
  const track = document.getElementById('tl-track');
  track.innerHTML = PHASE_BANDS.map(band => {
    const band_nodes = nodes.filter(n => n.delay >= band.min && n.delay < band.max);
    return `
      <div class="tl-band">
        <div class="tl-band-name">${band.name}</div>
        <div class="tl-band-nodes">
          ${band_nodes.length
            ? band_nodes.map(n => `
                <div class="tl-chip" data-id="${n.id}" title="${n.content || n.id}">
                  <span class="tl-chip-icon">${TYPE_ICONS[n.type] || '¶'}</span>
                  <span class="tl-chip-label">${(n.content || n.type).slice(0, 16)}</span>
                  <span class="tl-chip-vis">${visBadge(n)}</span>
                </div>`).join('')
            : '<span class="tl-empty">—</span>'}
        </div>
      </div>`;
  }).join('');

  track.querySelectorAll('.tl-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectNode(chip.dataset.id);
      scrollToNode(chip.dataset.id);
    });
  });
}

// ── Smart Analyze ─────────────────────────────────────────
function analyzeGraph() {
  document.getElementById('ed-analysis')?.remove();
  canvas.querySelectorAll('.is-isolated').forEach(el => el.classList.remove('is-isolated'));

  const results = [];

  // isolated nodes
  const isolated = nodes.filter(n =>
    !connMeta.some(c => c.from === n.id || c.to === n.id));
  if (isolated.length) {
    results.push({
      label: `${isolated.length} isolated — no connections`,
      nodes: isolated.map(n => n.id),
      type: 'warn'
    });
    isolated.forEach(n => {
      canvas.querySelector(`.ec-node[data-id="${n.id}"]`)?.classList.add('is-isolated');
    });
  }

  // spatially close but not connected
  const prox = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = (a.position.x - b.position.x) * CANVAS_W / 100;
      const dy = (a.position.y - b.position.y) * CANVAS_H / 100;
      const connected = connMeta.some(c =>
        (c.from === a.id && c.to === b.id) || (c.from === b.id && c.to === a.id));
      if (Math.hypot(dx, dy) < 260 && !connected) {
        prox.push(`"${(a.content || a.type).slice(0,14)}" ↔ "${(b.content || b.type).slice(0,14)}"`);
      }
    }
  }
  if (prox.length) {
    results.push({ label: `proximity suggestions: ${prox.slice(0, 3).join(' · ')}`, type: 'info' });
  }

  // resonant pairs (similar emotion weight, unconnected)
  const resonant = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (a.type === 'void' || b.type === 'void') continue;
      const connected = connMeta.some(c =>
        (c.from === a.id && c.to === b.id) || (c.from === b.id && c.to === a.id));
      if (Math.abs((a.emotionWeight ?? 0.5) - (b.emotionWeight ?? 0.5)) < 0.08 && !connected) {
        resonant.push(`"${(a.content||'').slice(0,12)}" ↔ "${(b.content||'').slice(0,12)}"`);
      }
    }
  }
  if (resonant.length) {
    results.push({ label: `resonant (emotion): ${resonant.slice(0, 2).join(' · ')}`, type: 'info' });
  }

  // gaps in timeline
  const delays = nodes.map(n => n.delay).sort((a, b) => a - b);
  for (let i = 1; i < delays.length; i++) {
    if (delays[i] - delays[i - 1] > 1.4) {
      results.push({ label: `silence gap at ${delays[i-1].toFixed(1)}s–${delays[i].toFixed(1)}s`, type: 'silence' });
    }
  }

  if (!results.length) results.push({ label: 'graph appears well-formed.', type: 'ok' });

  showAnalysis(results);
}

function showAnalysis(results) {
  const el = document.createElement('div');
  el.id = 'ed-analysis';
  el.innerHTML = `
    <div class="an-header">
      <span>analysis</span>
      <button id="an-close">×</button>
    </div>
    ${results.map(r => `<div class="an-row type-${r.type}">· ${r.label}</div>`).join('')}
  `;
  document.body.appendChild(el);
  el.querySelector('#an-close').addEventListener('click', () => {
    el.remove();
    canvas.querySelectorAll('.is-isolated').forEach(e => e.classList.remove('is-isolated'));
  });
}

// ── Status bar ────────────────────────────────────────────
function updateStatus() {
  document.getElementById('sb-nodes').textContent = `${nodes.length} node${nodes.length !== 1 ? 's' : ''}`;
  document.getElementById('sb-conns').textContent = `${connMeta.length} connection${connMeta.length !== 1 ? 's' : ''}`;
  const sel = nodes.find(n => n.id === selected);
  document.getElementById('sb-sel').textContent = sel
    ? `"${(sel.content || sel.type).slice(0, 30)}"`
    : 'nothing selected';
}

// ── Global mouse events ───────────────────────────────────
document.addEventListener('mousemove', e => {
  // node dragging
  if (dragging) {
    const node = nodes.find(n => n.id === dragging.id);
    if (!node) return;
    const dx = (e.clientX - dragging.startX) / scale;
    const dy = (e.clientY - dragging.startY) / scale;
    node.position.x = Math.max(1, Math.min(96, dragging.origX + dx / CANVAS_W * 100));
    node.position.y = Math.max(1, Math.min(96, dragging.origY + dy / CANVAS_H * 100));
    const el = canvas.querySelector(`.ec-node[data-id="${dragging.id}"]`);
    if (el) { el.style.left = node.position.x + '%'; el.style.top = node.position.y + '%'; }
    renderConnections();
    return;
  }

  // connect drag: draw temp line
  if (connecting) {
    const from = nodes.find(n => n.id === connecting.fromId);
    if (!from) return;
    const wr = canvasWrap.getBoundingClientRect();
    const fx = from.position.x / 100 * CANVAS_W;
    const fy = from.position.y / 100 * CANVAS_H;
    const mx = (e.clientX - wr.left - panX) / scale;
    const my = (e.clientY - wr.top  - panY) / scale;
    moveTempLine(fx, fy, mx, my);
    return;
  }

  // canvas pan
  if (isPanning) {
    panX += e.clientX - panStart.x;
    panY += e.clientY - panStart.y;
    panStart = { x: e.clientX, y: e.clientY };
    applyTransform();
  }
});

document.addEventListener('mouseup', e => {
  if (dragging) {
    saveNodes();
    canvas.querySelector(`.ec-node[data-id="${dragging.id}"]`)?.classList.remove('is-dragging');
    dragging = null;
    renderTimeline();
    return;
  }

  if (connecting) {
    clearTempLine();
    document.body.classList.remove('body-connecting');
    const target = e.target.closest('.ec-node');
    if (target && target.dataset.id !== connecting.fromId) {
      addConnection(connecting.fromId, target.dataset.id, 'logical');
    }
    connecting = null;
    return;
  }

  isPanning = false;
});

// pan on empty canvas
canvasWrap.addEventListener('mousedown', e => {
  if (e.target === canvasWrap || e.target === canvas || e.target === svg) {
    isPanning  = true;
    panStart   = { x: e.clientX, y: e.clientY };
    deselect();
    document.getElementById('conn-popup')?.remove();
  }
});

// zoom via scroll
canvasWrap.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.92 : 1.08;
  const wr     = canvasWrap.getBoundingClientRect();
  const mx     = e.clientX - wr.left;
  const my     = e.clientY - wr.top;
  panX  = mx - (mx - panX) * factor;
  panY  = my - (my - panY) * factor;
  scale = Math.max(0.18, Math.min(2.2, scale * factor));
  applyTransform();
}, { passive: false });

// ── Toolbar bindings ──────────────────────────────────────
document.getElementById('btn-add-text').addEventListener('click',  () => addNode('text'));
document.getElementById('btn-add-image').addEventListener('click', () => addNode('image'));
document.getElementById('btn-add-audio').addEventListener('click', () => addNode('audio'));
document.getElementById('btn-add-void').addEventListener('click',  () => addNode('void'));
document.getElementById('btn-edit').addEventListener('click',    () => setMode('edit'));
document.getElementById('btn-preview').addEventListener('click', () => setMode('preview'));
document.getElementById('btn-fit').addEventListener('click', fitView);
document.getElementById('btn-analyze').addEventListener('click', analyzeGraph);
document.getElementById('btn-zoom-in').addEventListener('click',  () => { scale = Math.min(2.2, scale * 1.2); applyTransform(); });
document.getElementById('btn-zoom-out').addEventListener('click', () => { scale = Math.max(0.18, scale / 1.2); applyTransform(); });

// timeline toggle
document.getElementById('btn-timeline').addEventListener('click', () => {
  const tl = document.getElementById('ed-timeline');
  tl.classList.remove('collapsed');
  document.getElementById('tl-toggle').textContent = '▼';
  renderTimeline();
});
document.getElementById('tl-toggle').addEventListener('click', () => {
  const tl = document.getElementById('ed-timeline');
  tl.classList.toggle('collapsed');
  document.getElementById('tl-toggle').textContent = tl.classList.contains('collapsed') ? '▲' : '▼';
  if (!tl.classList.contains('collapsed')) renderTimeline();
});

// inspector
document.getElementById('btn-insp-save').addEventListener('click', saveFromInspector);
document.getElementById('btn-insp-del').addEventListener('click', () => {
  if (selected && confirm('delete this node?')) deleteNode(selected);
});
document.getElementById('insp-ew').addEventListener('input', function () {
  document.getElementById('insp-ew-val').textContent = parseFloat(this.value).toFixed(2);
});
document.getElementById('insp-type').addEventListener('change', function () {
  document.getElementById('insp-type-chip').textContent = this.value;
});

// keyboard
document.addEventListener('keydown', e => {
  if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === 'Escape')  { deselect(); document.getElementById('conn-popup')?.remove(); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected) deleteNode(selected);
  if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveFromInspector(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); fitView(); }
});

// ── Init ──────────────────────────────────────────────────
loadData();
renderAllNodes();
renderConnections();
updateStatus();

setTimeout(() => {
  if (nodes.length) fitView();
  else {
    // center empty canvas
    panX = canvasWrap.offsetWidth  / 2 - CANVAS_W / 2 * scale;
    panY = canvasWrap.offsetHeight / 2 - CANVAS_H / 2 * scale;
    applyTransform();
  }
}, 60);
