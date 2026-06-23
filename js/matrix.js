/* ═══════════════════════════════════════════════════════
   MATRIX.JS  —  Edit DATA and NODES to update your CV
═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
//  YOUR DATA — edit everything in here
// ─────────────────────────────────────────────────────────
const DATA = {
  name:    'Abdulameer Albutaihi',
  tag:     'Graphic Designer · Social Media Manager',
  bio:     'I build the visual language brands speak. From healthcare to global retail — designing with clarity, consistency, and the belief that good design should feel inevitable.',

  contact: {
    email:    'amiranzou@outlook.com',
    location: 'Baghdad, Iraq',
  },

  coreSkills: [
    'Graphic Design',
    'Social Media Management',
    'Brand Identity',
    'Visual Communication',
  ],

  projects: [
    {
      title:  'I.G.F.I.C Medical Center',
      role:   'Social Media Manager & Graphic Designer',
      desc:   'Full visual identity and social media management for a medical imaging center.',
      impact: 'Manages all digital content, campaigns, and print materials — from billboards to daily posts — with a unified brand direction.',
      stack:  ['Photoshop', 'Illustrator', 'InDesign', 'Social Media'],
      link:   null,
    },
    {
      title:  'Bershka',
      role:   'Graphic Designer',
      desc:   'Visual content for one of the world\'s largest fast-fashion retail brands.',
      impact: 'Produced marketing and promotional materials aligned with global brand aesthetic across seasonal campaigns.',
      stack:  ['Photoshop', 'Illustrator', 'InDesign'],
      link:   null,
    },
    {
      title:  'Personal Portfolio',
      role:   'Designer & Developer',
      desc:   'This site — a two-sided identity system with ambient sound and an interactive CV.',
      impact: 'Built entirely from scratch: spatial layout, node graph, living sound state, and cinematic transitions.',
      stack:  ['HTML', 'CSS', 'JavaScript', 'Web Audio API'],
      link:   'index.html',
    },
    {
      title:  'Data Ship',
      role:   'Graphic Design Intern',
      desc:   'Early career work across digital and print — building the foundations of visual identity systems.',
      impact: 'Contributed to branded materials and social assets while developing a consistent, cross-project visual language.',
      stack:  ['Photoshop', 'Illustrator', 'Figma'],
      link:   null,
    },
  ],

  skills: [
    { group: 'Design Tools',        tags: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Figma'] },
    { group: 'Graphic Design',      tags: ['Visual Identity', 'Branding Systems', 'Layout Composition', 'Typography', 'Print Design'] },
    { group: 'Social Media',        tags: ['Content Creation', 'Campaign Visuals', 'Promotional Design', 'Digital Advertising'] },
    { group: 'Brand Management',    tags: ['Visual Consistency', 'Brand Guidelines', 'Audience-Focused Execution', 'Art Direction'] },
  ],

  experience: [
    { role: 'Social Media Manager & Graphic Designer', company: 'I.G.F.I.C – Medical Imaging Center', date: '2025 — Present' },
    { role: 'Graphic Designer',                        company: 'Bershka',                             date: 'Sep 2024 — Jan 2025' },
    { role: 'Graphic Design Intern',                   company: 'Data Ship',                           date: 'Sep 2021 — Mar 2022' },
    { role: 'Bachelor\'s Degree',                      company: 'University of Technology — Baghdad',  date: 'Sep 2020 — Jun 2024' },
  ],

  signals: [
    'Design is a conversation between the maker and the audience. I try to make sure they both leave understood.',
    'A consistent brand doesn\'t happen by accident — it\'s a system, and systems have logic.',
    'The best design work disappears into the thing it was made for.',
    'Typography is the first thing people read before they read a single word.',
  ],
};

// ─────────────────────────────────────────────────────────
//  L3 NODE GRAPH — positions are % of container (x, y)
//  connections: array of node ids this node connects to
//  thinking: your reasoning path for the panel
// ─────────────────────────────────────────────────────────
const NODES = [
  {
    id:   'design',
    type: 'timeline',
    x:    28, y: 30,
    title: 'Graphic Design',
    summary: 'Where everything starts. Form as a precise language.',
    connections: ['branding', 'typography', 'print', 'portfolio'],
    thinking: [
      { phase: 'origin',  text: 'I was drawn to design because it forces you to make decisions — every element is a choice, not an accident.' },
      { phase: 'tension', text: 'The hardest part is knowing when to stop. Good design is what you take away, not what you add.' },
      { phase: 'belief',  text: 'A design that needs explaining has already failed. Clarity is the whole job.' },
    ],
  },
  {
    id:   'branding',
    type: 'skill',
    x:    55, y: 20,
    title: 'Brand Identity',
    summary: 'Building the visual systems brands live inside.',
    connections: ['design', 'igfic', 'bershka', 'social'],
    thinking: [
      { phase: 'idea',     text: 'A brand is not a logo. It\'s a set of decisions that repeat consistently across everything.' },
      { phase: 'process',  text: 'I start with restrictions — what must this brand never look like? Then build inward from there.' },
      { phase: 'result',   text: 'When identity systems work, the brand feels like it always existed. That\'s the goal.' },
    ],
  },
  {
    id:   'social',
    type: 'skill',
    x:    78, y: 35,
    title: 'Social Media Management',
    summary: 'Visual content that earns attention without asking for it.',
    connections: ['branding', 'igfic'],
    thinking: [
      { phase: 'challenge', text: 'Social media content is consumed in half a second. The work has to work at that speed.' },
      { phase: 'approach',  text: 'Consistent visual language first — then messaging. People recognize the look before they read the copy.' },
      { phase: 'result',    text: 'Engagement follows identity. When the brand looks like itself, people trust it.' },
    ],
  },
  {
    id:   'igfic',
    type: 'project',
    x:    78, y: 60,
    title: 'I.G.F.I.C Medical Center',
    summary: 'Full visual ownership — digital and physical.',
    connections: ['branding', 'social', 'print'],
    thinking: [
      { phase: 'scope',    text: 'Healthcare design has to communicate trust before it communicates anything else.' },
      { phase: 'work',     text: 'Billboards, social posts, campaigns, and day-to-day content — all under one visual system.' },
      { phase: 'learning', text: 'Managing content end-to-end teaches you how identity degrades when you stop paying attention. I don\'t let it.' },
    ],
  },
  {
    id:   'bershka',
    type: 'project',
    x:    52, y: 68,
    title: 'Bershka',
    summary: 'Global retail. Brand aesthetic at scale.',
    connections: ['branding', 'design'],
    thinking: [
      { phase: 'context',  text: 'Working within an established global brand means your job is translation, not invention.' },
      { phase: 'process',  text: 'Seasonal campaigns: the aesthetic shifts but the DNA stays fixed. Learning to stretch without breaking.' },
      { phase: 'takeaway', text: 'Discipline under constraints. Fast delivery without losing the brand standard.' },
    ],
  },
  {
    id:   'print',
    type: 'skill',
    x:    22, y: 62,
    title: 'Print Design',
    summary: 'Physical objects carry weight digital can\'t replicate.',
    connections: ['design', 'igfic', 'branding'],
    thinking: [
      { phase: 'difference', text: 'Print is permanent. You can\'t push an update after a billboard goes up. That pressure makes you precise.' },
      { phase: 'craft',      text: 'Ink on paper has texture and intention. I design for that — not just for screen previews.' },
    ],
  },
  {
    id:   'typography',
    type: 'thought',
    x:    10, y: 42,
    title: 'type is thought made visible',
    summary: 'Letterforms carry meaning before you read a single word.',
    connections: ['design', 'portfolio'],
    thinking: [
      { phase: 'notice', text: 'You feel a typeface before you read it. That\'s not decoration — that\'s the first message.' },
      { phase: 'apply',  text: 'Every project: the type choice IS the argument, not a container for it.' },
    ],
  },
  {
    id:   'portfolio',
    type: 'project',
    x:    30, y: 78,
    title: 'This Website',
    summary: 'Two-sided identity. Each side its own world.',
    connections: ['design', 'typography'],
    thinking: [
      { phase: 'concept',  text: 'Two modes of being — professional and personal. They needed two completely different visual languages.' },
      { phase: 'tension',  text: 'Most portfolios feel like resumés. I wanted this to feel like a place you discover.' },
      { phase: 'decision', text: 'Matrix side: structured, precise. Human side: warm, expressive. Same person, different lenses.' },
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
