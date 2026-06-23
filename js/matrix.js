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
    phone:    '+964 774 151 3345',
    location: 'Baghdad, Iraq',
  },

  links: [
    {
      label: 'LinkedIn',
      url:   'https://www.linkedin.com/in/abdulameeralbutaihi',
      icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    },
    {
      label: 'Behance',
      url:   'https://www.behance.net/amiranzou',
      icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.202.836 1.72 1.887 1.72.668 0 1.402-.337 1.59-1.309h4.069zm-7.917-3.958h3.818c-.118-1.061-.671-1.591-1.838-1.591-1.148 0-1.806.535-1.98 1.591zM10.073 8c1.265 0 2.2.388 2.8 1.164.6.776.9 1.931.9 3.464 0 1.588-.293 2.777-.88 3.567-.587.79-1.574 1.225-2.82 1.225H2V8h8.073zm-.457 2H5v2h4.616c.77 0 1.152-.394 1.152-1.181 0-.734-.382-1.098-1.152-1.098v.279zM5 14.5v2.5h4.927c.871 0 1.307-.434 1.307-1.302 0-.832-.436-1.198-1.307-1.198H5z"/></svg>`,
    },
    {
      label: 'Instagram',
      url:   'https://www.instagram.com/ameer.is.off',
      icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    },
    {
      label: 'GitHub',
      url:   'https://github.com/amiranzou-ui',
      icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
    },
  ],

  summary: 'Graphic Designer with hands-on experience in branding, social media management, and visual communication across retail and healthcare environments. Skilled in creating digital and print assets that align with brand identity and audience needs. Experienced in managing end-to-end visual content for active social media platforms and developing promotional materials including campaigns, ads, and physical branding. Strong focus on clarity, consistency, and detail-driven design execution.',

  coreSkills: [
    'Graphic Design',
    'Social Media Management',
    'Brand Identity',
    'Visual Communication',
  ],

  projects: [
    {
      title:   'I.G.F.I.C Medical Center',
      role:    'Social Media Manager & Graphic Designer',
      desc:    'Full visual identity and social media management for a medical imaging center.',
      impact:  'Manages all digital content, campaigns, and print materials — from billboards to daily posts — with a unified brand direction.',
      stack:   ['Photoshop', 'Illustrator', 'InDesign', 'Social Media'],
      behance: 'https://www.behance.net/amiranzou',
      link:    null,
    },
    {
      title:   'Bershka',
      role:    'Graphic Designer',
      desc:    'Visual content for one of the world\'s largest fast-fashion retail brands.',
      impact:  'Produced marketing and promotional materials aligned with global brand aesthetic across seasonal campaigns.',
      stack:   ['Photoshop', 'Illustrator', 'InDesign'],
      behance: 'https://www.behance.net/amiranzou',
      link:    null,
    },
    {
      title:   'Personal Portfolio',
      role:    'Designer & Developer',
      desc:    'This site — a two-sided identity system with ambient sound and an interactive CV.',
      impact:  'Built entirely from scratch: spatial layout, node graph, living sound state, and cinematic transitions.',
      stack:   ['HTML', 'CSS', 'JavaScript', 'Web Audio API'],
      behance: null,
      link:    'index.html',
    },
    {
      title:   'Data Ship',
      role:    'Graphic Design Intern',
      desc:    'Early career work across digital and print — building the foundations of visual identity systems.',
      impact:  'Contributed to branded materials and social assets while developing a consistent, cross-project visual language.',
      stack:   ['Photoshop', 'Illustrator', 'Figma'],
      behance: 'https://www.behance.net/amiranzou',
      link:    null,
    },
  ],

  skills: [
    { group: 'Design Tools',        tags: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Figma'] },
    { group: 'Graphic Design',      tags: ['Visual Identity', 'Branding Systems', 'Layout Composition', 'Typography', 'Print Design'] },
    { group: 'Social Media',        tags: ['Content Creation', 'Campaign Visuals', 'Promotional Design', 'Digital Advertising'] },
    { group: 'Brand Management',    tags: ['Visual Consistency', 'Brand Guidelines', 'Audience-Focused Execution', 'Art Direction'] },
  ],

  experience: [
    {
      role:    'Social Media Manager & Graphic Designer',
      company: 'I.G.F.I.C – Medical Imaging Center',
      date:    '2025 — Present',
      points:  [
        'Manage the clinic\'s social media platforms and overall visual communication.',
        'Design digital content including posts, campaigns, and advertisements aligned with brand identity.',
        'Create print materials such as billboards, posters, and promotional assets.',
        'Develop consistent visual direction to strengthen audience engagement and brand recognition.',
        'Handle day-to-day content needs including design requests and visual updates.',
      ],
    },
    {
      role:    'Graphic Designer',
      company: 'Bershka',
      date:    'Sep 2024 — Jan 2025',
      points:  [
        'Produced visual content aligned with brand aesthetic for marketing and promotional use.',
        'Collaborated with marketing and merchandising teams to support seasonal campaigns.',
        'Designed digital and print materials to enhance product presentation and visibility.',
        'Ensured consistency with brand guidelines across multiple deliverables.',
      ],
    },
    {
      role:    'Graphic Design Intern',
      company: 'Data Ship',
      date:    'Sep 2021 — Mar 2022',
      points:  [
        'Assisted in creating visual content for digital and print media.',
        'Supported marketing team in developing branded materials and social media assets.',
        'Contributed to maintaining consistent visual identity across projects.',
        'Worked collaboratively within design and development teams.',
      ],
    },
  ],

  education: [
    { degree: 'Bachelor\'s Degree', school: 'University of Technology — Baghdad, Iraq', date: 'Sep 2020 — Jun 2024' },
  ],

  languages: [
    { lang: 'Arabic',  level: 'Native' },
    { lang: 'English', level: 'Fluent' },
    { lang: 'German',  level: 'A2' },
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

// ── Build L1 — Overview (editorial grid) ─────────────────
function buildL1() {
  const wrap = document.createElement('div');
  wrap.className = 'mx-l1-wrap';

  // Dark cinematic poster
  const [firstName, lastName] = DATA.name.split(' ');
  const header = document.createElement('div');
  header.className = 'mx-l1-poster';
  header.innerHTML = `
    <div class="mx-poster-grain"></div>
    <div class="mx-poster-reg mx-poster-reg-tl"></div>
    <div class="mx-poster-reg mx-poster-reg-tr"></div>
    <div class="mx-poster-ring mx-poster-ring-3"></div>
    <div class="mx-poster-ring mx-poster-ring-1"><div class="mx-poster-ring-dot"></div></div>
    <div class="mx-poster-ring mx-poster-ring-2"><div class="mx-poster-ring-dot2"></div></div>
    <div class="mx-poster-top">
      <span class="mx-poster-tag">${DATA.tag}</span>
      <span class="mx-poster-meta">${DATA.contact.location} · ${new Date().getFullYear()}</span>
    </div>
    <div class="mx-poster-name-block">
      <span class="mx-poster-name-line">${firstName}</span>
      <span class="mx-poster-name-line">${lastName}</span>
    </div>
    <div class="mx-poster-stat-col" aria-hidden="true">
      <div class="mx-poster-stat">
        <span class="mx-stat-n">4+</span>
        <span class="mx-stat-l">YRS<br>DESIGN</span>
      </div>
      <div class="mx-poster-stat">
        <span class="mx-stat-n">3</span>
        <span class="mx-stat-l">BRANDS<br>BUILT</span>
      </div>
      <div class="mx-poster-stat">
        <span class="mx-stat-n">50+</span>
        <span class="mx-stat-l">PROJECTS<br>DONE</span>
      </div>
    </div>
    <div class="mx-poster-rule"></div>
    <div class="mx-poster-bottom">
      <div class="mx-poster-quote">
        <span class="mx-quote-mark">"</span>
        <p class="mx-poster-bio">${DATA.bio.split('.')[0]}.</p>
      </div>
      <div class="mx-poster-actions">
        <div class="mx-poster-btns">
          <button class="mx-btn mx-btn-primary" id="mx-cv-btn">Full CV</button>
          <button class="mx-btn mx-btn-ghost"   id="mx-sys-btn">System View</button>
        </div>
        <div class="mx-social-links">
          ${DATA.links.map(l => `<a class="mx-social-link" href="${l.url}" target="_blank" rel="noopener">${l.icon}<span>${l.label}</span></a>`).join('')}
        </div>
      </div>
    </div>`;
  wrap.appendChild(header);

  // Skills marquee
  const allSkills = DATA.skills.flatMap(g => g.tags);
  const items = allSkills.map(s => `<span>${s}</span><span class="mx-marquee-dot">·</span>`).join('');
  const marquee = document.createElement('div');
  marquee.className = 'mx-marquee';
  marquee.innerHTML = `<div class="mx-marquee-track">${items.repeat(4)}</div>`;
  wrap.appendChild(marquee);

  // Project cards grid
  const grid = document.createElement('div');
  grid.className = 'mx-l1-grid';
  DATA.projects.forEach((p, i) => {
    const href    = p.behance || p.link;
    const external = !!p.behance;
    const card = href ? document.createElement('a') : document.createElement('div');
    card.className = 'mx-l1-card';
    if (href) {
      card.href = href;
      if (external) { card.target = '_blank'; card.rel = 'noopener'; }
    }
    const linkLabel = p.behance ? 'View on Behance →' : 'View →';
    card.innerHTML = `
      <div class="mx-l1-card-num">0${i + 1}</div>
      <div class="mx-l1-card-title">${p.title}</div>
      <div class="mx-l1-card-role">${p.role}</div>
      <div class="mx-l1-card-desc">${p.desc}</div>
      ${href ? `<span class="mx-l1-card-link">${linkLabel}</span>` : ''}`;
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  // Bottom bar
  const bar = document.createElement('div');
  bar.className = 'mx-l1-bar';
  bar.innerHTML = `
    <p class="mx-l1-bar-text">More structure underneath — and a graph of how it all connects.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="mx-btn mx-btn-ghost" id="mx-cv-btn2">Full CV</button>
      <button class="mx-btn mx-btn-ghost" id="mx-sys-btn2">System →</button>
      <a class="mx-btn mx-btn-ghost" href="Abdulameer_Albutaihi_CV.pdf" download>↓ CV PDF</a>
    </div>`;
  wrap.appendChild(bar);

  l1.appendChild(wrap);

  document.getElementById('mx-cv-btn').addEventListener('click',  () => goLevel(2));
  document.getElementById('mx-sys-btn').addEventListener('click', () => goLevel(3));
  document.getElementById('mx-cv-btn2').addEventListener('click', () => goLevel(2));
  document.getElementById('mx-sys-btn2').addEventListener('click', () => goLevel(3));
}

// ── Build L2 — Full CV (sidebar layout) ──────────────────
function buildL2() {
  const inner = document.getElementById('mx-l2-inner');

  const layout = document.createElement('div');
  layout.className = 'mx-l2-layout';

  // Sidebar
  const sb = document.createElement('div');
  sb.className = 'mx-l2-sb';
  sb.innerHTML = `
    <div class="mx-l2-sb-name">${DATA.name}</div>
    <div class="mx-l2-sb-role">${DATA.tag.replace(' · ', '<br>')}</div>
    <div class="mx-l2-sb-block">
      <span>${DATA.contact.location}</span>
      <a href="tel:${DATA.contact.phone}">${DATA.contact.phone}</a>
      <a href="mailto:${DATA.contact.email}">${DATA.contact.email}</a>
    </div>
    <div class="mx-l2-sb-block mx-social-links" style="flex-direction:column;gap:14px;">
      ${DATA.links.map(l => `<a class="mx-social-link" href="${l.url}" target="_blank" rel="noopener">${l.icon}<span>${l.label}</span></a>`).join('')}
    </div>
    <div class="mx-l2-sb-dl">
      <a class="mx-btn mx-btn-primary" href="Abdulameer_Albutaihi_CV.pdf" download>Download CV</a>
      <a class="mx-btn mx-btn-ghost"   href="Abdulameer_Albutaihi_CV.pdf" target="_blank" rel="noopener">View PDF</a>
    </div>`;
  layout.appendChild(sb);

  // Main content
  const main = document.createElement('div');
  main.className = 'mx-l2-main';

  const sumSec = createSection('00', 'Summary');
  const sumEl = document.createElement('p');
  sumEl.className = 'mx-summary';
  sumEl.textContent = DATA.summary;
  sumSec.appendChild(sumEl);
  main.appendChild(sumSec);

  const expSec = createSection('01', 'Experience');
  DATA.experience.forEach(e => {
    const item = document.createElement('div');
    item.className = 'mx-exp-item';
    item.innerHTML = `
      <div class="mx-exp-header">
        <div>
          <div class="mx-exp-role">${e.role}</div>
          <div class="mx-exp-company">${e.company}</div>
        </div>
        <div class="mx-exp-date">${e.date}</div>
      </div>
      ${e.points ? `<ul class="mx-exp-points">${e.points.map(pt => `<li>${pt}</li>`).join('')}</ul>` : ''}`;
    expSec.appendChild(item);
  });
  main.appendChild(expSec);

  const skillSec = createSection('02', 'Skills');
  const skillGrid = document.createElement('div');
  skillGrid.className = 'mx-skills-grid';
  DATA.skills.forEach(g => {
    const col = document.createElement('div');
    col.innerHTML = `<div class="mx-skill-group-label">${g.group}</div>
      <div class="mx-tags">${g.tags.map(t => `<span>${t}</span>`).join('')}</div>`;
    skillGrid.appendChild(col);
  });
  skillSec.appendChild(skillGrid);
  main.appendChild(skillSec);

  const eduSec = createSection('03', 'Education');
  DATA.education.forEach(e => {
    const item = document.createElement('div');
    item.className = 'mx-exp-item';
    item.innerHTML = `
      <div class="mx-exp-header">
        <div>
          <div class="mx-exp-role">${e.degree}</div>
          <div class="mx-exp-company">${e.school}</div>
        </div>
        <div class="mx-exp-date">${e.date}</div>
      </div>`;
    eduSec.appendChild(item);
  });
  main.appendChild(eduSec);

  const langSec = createSection('04', 'Languages');
  const langRow = document.createElement('div');
  langRow.className = 'mx-lang-row';
  DATA.languages.forEach(l => {
    const el = document.createElement('div');
    el.className = 'mx-lang-item';
    el.innerHTML = `<span class="mx-lang-name">${l.lang}</span><span class="mx-lang-level">${l.level}</span>`;
    langRow.appendChild(el);
  });
  langSec.appendChild(langRow);
  main.appendChild(langSec);

  const sigSec = createSection('05', 'Signals');
  const sigList = document.createElement('div');
  sigList.className = 'mx-signals';
  DATA.signals.forEach(s => {
    const el = document.createElement('div');
    el.className = 'mx-signal';
    el.textContent = s;
    sigList.appendChild(el);
  });
  sigSec.appendChild(sigList);
  main.appendChild(sigSec);

  layout.appendChild(main);
  inner.appendChild(layout);
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
