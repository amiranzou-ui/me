/* ═══════════════════════════════════════════════════════
   MATRIX.JS  —  Edit DATA and NODES to update your CV
═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
//  YOUR DATA — edit everything in here
// ─────────────────────────────────────────────────────────
const DATA = {
  name:    'Ameer Al-Butaihi',
  tag:     'Designer · Medical Physicist · AI Researcher',
  bio:     'I sit at the intersection of physics, intelligence, and form — building systems that are precise, felt, and sometimes beautiful.',

  contact: {
    email:    'amiranzou@outlook.com',
    location: 'Iraq',
  },

  coreSkills: [
    'Graphic Design',
    'AI / Machine Learning',
    'Medical Physics',
    'Vibe Coding',
  ],

  projects: [
    {
      title:  'Radiation Dose AI',
      role:   'Lead Researcher',
      desc:   'Deep learning model for automated dose prediction in radiotherapy planning.',
      impact: 'Reduced planning time significantly while maintaining clinical accuracy thresholds.',
      stack:  ['Python', 'TensorFlow', 'DICOM', 'Medical Imaging'],
      link:   null,
    },
    {
      title:  'Personal Portfolio',
      role:   'Designer & Developer',
      desc:   'This site — two-sided identity system, ambient music, interactive CV.',
      impact: 'Built entirely from scratch: spatial layout, Web Audio API, node graph, living sound state.',
      stack:  ['HTML', 'CSS', 'JavaScript', 'Web Audio API'],
      link:   'index.html',
    },
    {
      title:  'QA Automation System',
      role:   'Developer',
      desc:   'Automated quality assurance workflow for linear accelerator measurements.',
      impact: 'Replaced manual spreadsheet logging with real-time analysis and anomaly flagging.',
      stack:  ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
      link:   null,
    },
    {
      title:  'Visual Identity Work',
      role:   'Graphic Designer',
      desc:   'Brand systems, posters, and motion for various clients and personal projects.',
      impact: 'Dozens of identities built around conceptual clarity over decoration.',
      stack:  ['Illustrator', 'Photoshop', 'After Effects', 'Figma'],
      link:   'human.html',
    },
  ],

  skills: [
    { group: 'Physics & Clinical',  tags: ['Radiation Dosimetry', 'Radiotherapy Planning', 'Linac QA', 'DICOM', 'Monte Carlo Simulation'] },
    { group: 'AI & Code',           tags: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'JavaScript', 'Web APIs'] },
    { group: 'Design',              tags: ['Brand Identity', 'Typography', 'Motion', 'Illustrator', 'Photoshop', 'After Effects'] },
    { group: 'Research',            tags: ['Scientific Writing', 'Data Analysis', 'Experimental Design', 'Literature Review'] },
  ],

  experience: [
    { role: 'Medical Physicist',        company: 'Clinical Practice',     date: '2025' },
    { role: 'AI Research',              company: 'Independent / Academic', date: '2020 — present' },
    { role: 'Graphic Designer',         company: 'Freelance',              date: '2020 — present' },
    { role: 'Medical Physics',    company: 'University of Technology',     date: '2020 — 2024' },
  ],

  signals: [
    'I believe precision and poetry are the same thing approached from different directions.',
    'The best interfaces feel inevitable — you forget someone made them.',
    'Physics taught me that the most elegant solution is usually the correct one.',
    'I design like I measure: remove everything until only what matters remains.',
  ],
};

// ─────────────────────────────────────────────────────────
//  L3 NODE GRAPH — positions are % of container (x, y)
//  connections: array of node ids this node connects to
//  thinking: your reasoning path for the panel
// ─────────────────────────────────────────────────────────
const NODES = [
  {
    id:   'physics',
    type: 'timeline',
    x:    22, y: 30,
    title: 'Medical Physics',
    summary: 'Where it started. Precision as a language.',
    connections: ['ai', 'qa', 'research'],
    thinking: [
      { phase: 'origin',  text: 'Chose physics because I wanted to understand how things actually work, not just how to use them.' },
      { phase: 'tension', text: 'Clinical work is exact. But I kept asking why we weren\'t using the data we already had.' },
      { phase: 'pivot',   text: 'That question led me toward AI — not as a trend, but as a tool for the problems I already had.' },
    ],
  },
  {
    id:   'ai',
    type: 'project',
    x:    52, y: 22,
    title: 'AI / Machine Learning',
    summary: 'Taught machines to see what I was already looking at.',
    connections: ['physics', 'research', 'dose'],
    thinking: [
      { phase: 'idea',     text: 'Dose prediction by hand is slow. Patterns exist. Neural networks find patterns.' },
      { phase: 'attempt',  text: 'First model overfit completely — learned the machine, not the physics.' },
      { phase: 'failure',  text: 'Realized I was treating it as a CS problem. It\'s a physics problem that uses CS.' },
      { phase: 'pivot',    text: 'Added physics-informed constraints. Model behavior changed immediately.' },
      { phase: 'solution', text: 'Hybrid approach: domain knowledge as architecture, not just training signal.' },
    ],
  },
  {
    id:   'dose',
    type: 'project',
    x:    76, y: 38,
    title: 'Dose Prediction AI',
    summary: 'Deep learning model for radiotherapy planning.',
    connections: ['ai', 'physics', 'qa'],
    thinking: [
      { phase: 'problem',  text: 'Manual treatment planning takes hours. Errors are dangerous. Volume is increasing.' },
      { phase: 'approach', text: 'Train on historical plans — learn what good dosimetry looks like from the physicists who made it.' },
      { phase: 'insight',  text: 'The model\'s mistakes revealed blind spots in our own planning process.' },
      { phase: 'result',   text: 'Faster planning AND a new way to audit old plans.' },
    ],
  },
  {
    id:   'design',
    type: 'skill',
    x:    25, y: 62,
    title: 'Graphic Design',
    summary: 'Form as argument. Visual clarity as intellectual work.',
    connections: ['portfolio', 'typography', 'physics'],
    thinking: [
      { phase: 'start',   text: 'Started designing to make physics papers readable. Ended up caring about it on its own.' },
      { phase: 'tension', text: 'Design culture and science culture distrust each other. I learned to translate.' },
      { phase: 'belief',  text: 'Good design isn\'t decoration — it\'s compression. More meaning in less space.' },
    ],
  },
  {
    id:   'typography',
    type: 'thought',
    x:    12, y: 50,
    title: 'type is thought made visible',
    summary: 'Letterforms carry meaning before you read a single word.',
    connections: ['design', 'portfolio'],
    thinking: [
      { phase: 'notice',  text: 'You feel a typeface before you read it. That\'s not decoration — that\'s content.' },
      { phase: 'apply',   text: 'Every project: the type choice IS the argument, not a container for it.' },
    ],
  },
  {
    id:   'portfolio',
    type: 'project',
    x:    48, y: 70,
    title: 'This Website',
    summary: 'Two-sided identity. Each side its own world.',
    connections: ['design', 'ai', 'typography'],
    thinking: [
      { phase: 'concept',  text: 'Two modes of being — precise and felt. They needed two different visual languages.' },
      { phase: 'tension',  text: 'Most portfolios feel like resumés. I wanted it to feel like a place.' },
      { phase: 'decision', text: 'Split the site. Left = matrix (structured, professional). Right = human (warm, expressive).' },
      { phase: 'detail',   text: 'Every interaction has a physics metaphor underneath: portals, waves, presence.' },
    ],
  },
  {
    id:   'qa',
    type: 'project',
    x:    72, y: 62,
    title: 'QA Automation',
    summary: 'Replaced logging with real-time anomaly detection.',
    connections: ['physics', 'dose', 'research'],
    thinking: [
      { phase: 'problem',  text: 'Manual QA logs sit in spreadsheets. Nobody reviews them until something goes wrong.' },
      { phase: 'solution', text: 'Automate ingestion, run statistical process control, flag when we drift.' },
      { phase: 'outcome',  text: 'Found two systematic errors that had been within-tolerance but trending badly.' },
    ],
  },
  {
    id:   'research',
    type: 'thought',
    x:    45, y: 46,
    title: 'why I research',
    summary: 'Questions that don\'t have answers yet.',
    connections: ['physics', 'ai', 'qa'],
    thinking: [
      { phase: 'drive',   text: 'Clinical work solves known problems. Research means the problem itself is the question.' },
      { phase: 'method',  text: 'I prefer small, deep questions to wide, shallow ones. One real insight over ten incremental ones.' },
      { phase: 'future',  text: 'Want to work on AI systems that reason about physical constraints, not just patterns.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────
//  RUNTIME
// ─────────────────────────────────────────────────────────
let currentLevel  = 1;
let activeNode    = null;
let nodeEls       = {};    // id → DOM element
let connLines     = [];    // SVG line elements

const nav    = document.getElementById('mx-nav');
const l1     = document.getElementById('mx-l1');
const l2     = document.getElementById('mx-l2');
const l3     = document.getElementById('mx-l3');
const graph  = document.getElementById('mx-graph');
const svg    = document.getElementById('mx-graph-svg');
const panel  = document.getElementById('mx-node-panel');
const panelBody  = document.getElementById('mx-panel-body');
const panelClose = document.getElementById('mx-panel-close');
const pills  = document.querySelectorAll('.mx-pill');

// ── Level switching ───────────────────────────────────────
function goLevel(n) {
  currentLevel = n;

  l2.classList.toggle('open', n === 2);
  l3.classList.toggle('open', n === 3);
  nav.classList.toggle('dark', n === 3);

  pills.forEach(p => p.classList.toggle('active', +p.dataset.level === n));

  if (n === 3) {
    setTimeout(renderConnections, 80);
  }
  if (n !== 3) {
    closePanel();
  }
}

pills.forEach(p => {
  p.addEventListener('click', () => goLevel(+p.dataset.level));
});

// ── Build L1 — Fast CV ────────────────────────────────────
function buildL1() {
  const wrap = document.createElement('div');
  wrap.className = 'mx-l1-wrap';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'mx-hero';
  hero.innerHTML = `
    <div class="mx-hero-tag">${DATA.tag}</div>
    <div class="mx-name">${DATA.name}</div>
    <p class="mx-bio">${DATA.bio}</p>
    <div class="mx-hero-btns">
      <button class="mx-btn mx-btn-primary" id="mx-cv-btn">Full CV</button>
      <button class="mx-btn mx-btn-ghost"   id="mx-sys-btn">System View</button>
    </div>`;
  wrap.appendChild(hero);

  // Core skills
  const skills = document.createElement('div');
  skills.className = 'mx-quick';
  skills.innerHTML = `<div class="mx-quick-label">Core</div>
    <div class="mx-core-skills">${DATA.coreSkills.map(s =>
      `<span class="mx-core-skill">${s}</span>`).join('')}</div>`;
  wrap.appendChild(skills);

  // Projects compact
  const projWrap = document.createElement('div');
  projWrap.className = 'mx-quick';
  projWrap.innerHTML = `<div class="mx-quick-label">Selected Work</div>`;
  const projList = document.createElement('div');
  projList.className = 'mx-l1-projects';
  DATA.projects.forEach(p => {
    const row = document.createElement('div');
    row.className = 'mx-l1-proj';
    row.innerHTML = `
      <span class="mx-l1-proj-title">${p.title}</span>
      <span class="mx-l1-proj-desc">${p.desc}</span>
      ${p.link ? `<a class="mx-l1-proj-link" href="${p.link}">view →</a>` : '<span class="mx-l1-proj-link"></span>'}`;
    projList.appendChild(row);
  });
  projWrap.appendChild(projList);
  wrap.appendChild(projWrap);

  // Bottom CTA
  const cta = document.createElement('div');
  cta.className = 'mx-l1-explore';
  cta.innerHTML = `
    <p class="mx-l1-explore-text">There's more structure underneath — and a graph of how it all connects.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="mx-btn mx-btn-ghost" id="mx-cv-btn2">Full CV</button>
      <button class="mx-btn mx-btn-ghost" id="mx-sys-btn2">System →</button>
    </div>`;
  wrap.appendChild(cta);

  l1.appendChild(wrap);

  // Wire buttons
  document.getElementById('mx-cv-btn').addEventListener('click',  () => goLevel(2));
  document.getElementById('mx-sys-btn').addEventListener('click', () => goLevel(3));
  document.getElementById('mx-cv-btn2').addEventListener('click', () => goLevel(2));
  document.getElementById('mx-sys-btn2').addEventListener('click', () => goLevel(3));
}

// ── Build L2 — Full CV ────────────────────────────────────
function buildL2() {
  const inner = document.getElementById('mx-l2-inner');

  // Top bar
  const topbar = document.createElement('div');
  topbar.className = 'mx-l2-topbar';
  topbar.innerHTML = `
    <div>
      <div class="mx-l2-topbar-name">${DATA.name}</div>
      <div class="mx-l2-topbar-role">${DATA.tag}</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:11px;color:var(--ink3);">${DATA.contact.location}</span>
      <a class="mx-btn mx-btn-ghost" href="mailto:${DATA.contact.email}" style="font-size:9px;">email</a>
    </div>`;
  inner.appendChild(topbar);

  // Projects section
  const projSec = createSection('01', 'Projects');
  DATA.projects.forEach(p => {
    const row = document.createElement('div');
    row.className = 'mx-proj';
    row.innerHTML = `
      <div class="mx-proj-body">
        <div class="mx-proj-title">${p.title}</div>
        <div class="mx-proj-role">${p.role}</div>
        <div class="mx-proj-impact">${p.impact}</div>
        <div class="mx-proj-stack">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
      </div>
      <div class="mx-proj-side">${p.link ? `<a class="mx-proj-link" href="${p.link}">view →</a>` : ''}</div>`;
    projSec.appendChild(row);
  });
  inner.appendChild(projSec);

  // Skills section
  const skillSec = createSection('02', 'Skills');
  const grid = document.createElement('div');
  grid.className = 'mx-skills-grid';
  DATA.skills.forEach(g => {
    const col = document.createElement('div');
    col.innerHTML = `<div class="mx-skill-group-label">${g.group}</div>
      <div class="mx-tags">${g.tags.map(t => `<span>${t}</span>`).join('')}</div>`;
    grid.appendChild(col);
  });
  skillSec.appendChild(grid);
  inner.appendChild(skillSec);

  // Experience section
  const expSec = createSection('03', 'Experience');
  DATA.experience.forEach(e => {
    const item = document.createElement('div');
    item.className = 'mx-exp-item';
    item.innerHTML = `
      <div>
        <div class="mx-exp-role">${e.role}</div>
        <div class="mx-exp-company">${e.company}</div>
      </div>
      <div class="mx-exp-date">${e.date}</div>`;
    expSec.appendChild(item);
  });
  inner.appendChild(expSec);

  // Signals section
  const sigSec = createSection('04', 'Signals');
  const sigList = document.createElement('div');
  sigList.className = 'mx-signals';
  DATA.signals.forEach(s => {
    const el = document.createElement('div');
    el.className = 'mx-signal';
    el.textContent = s;
    sigList.appendChild(el);
  });
  sigSec.appendChild(sigList);
  inner.appendChild(sigSec);

  // Footer / export
  const footer = document.createElement('div');
  footer.className = 'mx-l2-footer';
  footer.innerHTML = `
    <button class="mx-btn mx-btn-ghost" id="mx-print-btn">Export PDF</button>
    <span style="font-size:10px;color:var(--ink3);">${DATA.contact.email}</span>`;
  inner.appendChild(footer);

  document.getElementById('mx-print-btn').addEventListener('click', () => window.print());
}

function createSection(num, title) {
  const sec = document.createElement('div');
  sec.className = 'mx-section';
  sec.innerHTML = `<div class="mx-section-hd">
    <span class="mx-section-num">${num}</span>
    <span class="mx-section-title">${title}</span>
  </div>`;
  return sec;
}

// ── Build L3 — Node graph ─────────────────────────────────
function buildL3() {
  nodeEls = {};

  NODES.forEach(node => {
    const el = document.createElement('div');
    el.className = 'mx-node';
    el.dataset.type = node.type;
    el.dataset.id   = node.id;
    el.style.left   = node.x + '%';
    el.style.top    = node.y + '%';
    el.innerHTML = `
      <div class="mx-node-type">${node.type}</div>
      <div class="mx-node-title">${node.title}</div>
      <div class="mx-node-summary">${node.summary}</div>`;

    el.addEventListener('mouseenter', () => highlightNode(node.id));
    el.addEventListener('mouseleave', () => clearHighlight());
    el.addEventListener('click',      () => openPanel(node.id));

    graph.appendChild(el);
    nodeEls[node.id] = el;
  });

  // Legend
  const legend = document.createElement('div');
  legend.className = 'mx-graph-legend';
  const types = [
    { label: 'project',  color: 'var(--c-project)'  },
    { label: 'skill',    color: 'var(--c-skill)'     },
    { label: 'thought',  color: 'var(--c-thought)'   },
    { label: 'timeline', color: 'var(--c-timeline)'  },
  ];
  types.forEach(t => {
    const item = document.createElement('div');
    item.className = 'mx-legend-item';
    item.innerHTML = `<div class="mx-legend-dot" style="background:${t.color}"></div>${t.label}`;
    legend.appendChild(item);
  });
  l3.querySelector('.mx-graph-wrap').appendChild(legend);
}

// ── SVG Connections ───────────────────────────────────────
function renderConnections() {
  // Clear old lines
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  connLines = [];

  const wrap = svg.parentElement;
  const wRect = wrap.getBoundingClientRect();

  // Build unique pairs
  const drawn = new Set();
  NODES.forEach(node => {
    node.connections.forEach(targetId => {
      const key = [node.id, targetId].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);

      const aEl = nodeEls[node.id];
      const bEl = nodeEls[targetId];
      if (!aEl || !bEl) return;

      const aRect = aEl.getBoundingClientRect();
      const bRect = bEl.getBoundingClientRect();

      const x1 = aRect.left + aRect.width  / 2 - wRect.left;
      const y1 = aRect.top  + aRect.height / 2 - wRect.top;
      const x2 = bRect.left + bRect.width  / 2 - wRect.left;
      const y2 = bRect.top  + bRect.height / 2 - wRect.top;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.dataset.a = node.id;
      line.dataset.b = targetId;
      svg.appendChild(line);
      connLines.push(line);
    });
  });
}

// ── Highlight / dim ───────────────────────────────────────
function highlightNode(id) {
  const node = NODES.find(n => n.id === id);
  if (!node) return;
  const related = new Set([id, ...node.connections]);

  Object.entries(nodeEls).forEach(([nid, el]) => {
    if (related.has(nid)) {
      el.classList.remove('dimmed');
      if (nid === id) el.classList.add('focus');
      else el.classList.add('connected');
    } else {
      el.classList.add('dimmed');
      el.classList.remove('focus', 'connected');
    }
  });

  connLines.forEach(line => {
    const isActive = (line.dataset.a === id || line.dataset.b === id);
    line.classList.toggle('active', isActive);
  });
}

function clearHighlight() {
  if (activeNode) return; // panel is open, keep highlight
  Object.values(nodeEls).forEach(el => {
    el.classList.remove('dimmed', 'focus', 'connected');
  });
  connLines.forEach(l => l.classList.remove('active'));
}

// ── Node panel ────────────────────────────────────────────
function openPanel(id) {
  const node = NODES.find(n => n.id === id);
  if (!node) return;
  activeNode = id;
  highlightNode(id);

  const typeClass = node.type;
  let html = `
    <div class="mx-panel-type ${typeClass}">${node.type}</div>
    <div class="mx-panel-title">${node.title}</div>
    <div class="mx-panel-summary">${node.summary}</div>`;

  if (node.thinking && node.thinking.length) {
    html += `<div class="mx-thinking-label">Thinking Path</div>
      <div class="mx-thinking-path">`;
    node.thinking.forEach(step => {
      html += `<div class="mx-thinking-step">
        <span class="mx-step-phase">${step.phase}</span>
        <span class="mx-step-text">${step.text}</span>
      </div>`;
    });
    html += `</div>`;
  }

  if (node.connections.length) {
    html += `<div class="mx-panel-connections">
      <div class="mx-panel-conn-label">Connected</div>`;
    node.connections.forEach(cid => {
      const cn = NODES.find(n => n.id === cid);
      if (!cn) return;
      html += `<div class="mx-panel-conn-item" data-goto="${cid}">${cn.title}</div>`;
    });
    html += `</div>`;
  }

  panelBody.innerHTML = html;
  panel.classList.add('open');

  // click connected items to jump
  panelBody.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => openPanel(el.dataset.goto));
  });
}

function closePanel() {
  activeNode = null;
  panel.classList.remove('open');
  clearHighlight();
}

panelClose.addEventListener('click', closePanel);

// close panel on graph background click
l3.querySelector('.mx-graph-wrap').addEventListener('click', e => {
  if (e.target === graph || e.target === svg || e.target === l3.querySelector('.mx-graph-wrap')) {
    closePanel();
  }
});

// ── Resize: re-render connections ─────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentLevel === 3) renderConnections();
  }, 120);
});

// ── Keyboard ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (panel.classList.contains('open')) { closePanel(); return; }
    if (currentLevel === 3) { goLevel(1); return; }
    if (currentLevel === 2) { goLevel(1); return; }
  }
});

// ── Init ──────────────────────────────────────────────────
buildL1();
buildL2();
buildL3();

// ── Nav back → portal ─────────────────────────────────────
const navBack = document.querySelector('.mx-nav-back');
if (navBack) {
  navBack.addEventListener('click', e => {
    e.preventDefault();
    window.Core.portal('index.html', '#f0ebe0', e.clientX, e.clientY);
  });
}
