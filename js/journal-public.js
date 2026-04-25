// journal-public.js — parchment letter style on Human.html
(function () {
'use strict';

const STORE_KEY = 'mind_journal_v1';
const visits    = parseInt(localStorage.getItem('mind_v') || '1');
const hour      = new Date().getHours();
const TILTS     = [-1.1, 0.6, -0.7, 1.0, -0.4, 0.9, -1.3, 0.5];

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
}

function isPublic(entry) {
  if (!entry.visibility?.public) return false;
  const c = entry.visibility.conditions || {};
  if (c.minVisits && visits < c.minVisits) return false;
  if (c.hourRange) {
    const [s, e] = c.hourRange;
    const inside = s <= e ? (hour >= s && hour < e) : (hour >= s || hour < e);
    if (!inside) return false;
  }
  return true;
}

function sortEntries(entries) {
  const seed = visits * 13 + hour * 3;
  return [...entries].sort((a, b) => {
    const diff = b.date - a.date;
    if (Math.abs(diff) < 86_400_000 && (a.date + seed) % 9 === 0) return -diff;
    return diff;
  });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Ink: split text into word spans ──────────────
function inkIn(textEl, cardDelay) {
  const raw   = textEl.dataset.raw || '';
  const words = raw.split(/(\s+)/);
  textEl.innerHTML = '';
  words.forEach((chunk, i) => {
    if (/^\s+$/.test(chunk)) {
      textEl.appendChild(document.createTextNode(chunk));
      return;
    }
    const span = document.createElement('span');
    span.className = 'jnlp-word';
    span.textContent = chunk;
    span.style.animationDelay = (cardDelay + i * 0.055) + 's';
    textEl.appendChild(span);
  });
}

// ── Dust particles ────────────────────────────────
function spawnDust(container) {
  for (let i = 0; i < 20; i++) {
    const el    = document.createElement('div');
    el.className = 'jnlp-dust';
    const size  = 1.2 + Math.random() * 2.8;
    const dur   = 10  + Math.random() * 14;
    const delay = -(Math.random() * dur);
    el.style.cssText = [
      `width:${size}px`, `height:${size}px`,
      `left:${5 + Math.random()*90}%`,
      `top:${8  + Math.random()*85}%`,
      `--dur:${dur}s`,
      `--delay:${delay}s`,
      `--tx:${(Math.random()-.5)*16}px`,
      `--tx2:${(Math.random()-.5)*10}px`,
      `--ty:${-(18+Math.random()*28)}px`,
      `--ty2:${-(36+Math.random()*28)}px`,
      `--peak:${(0.20+Math.random()*0.30).toFixed(2)}`,
      `animation-delay:${delay}s`,
    ].join(';');
    container.appendChild(el);
  }
}

// ── Build one parchment card ──────────────────────
function buildCard(entry, idx) {
  const cardDelay = idx * 0.22 + 0.35;

  const card = document.createElement('div');
  card.className = 'jnlp-entry';
  card.style.setProperty('--jnlp-rot', TILTS[idx % TILTS.length] + 'deg');
  card.style.setProperty('--card-i', idx);

  const glow = document.createElement('div');
  glow.className = 'jnlp-entry-glow';
  card.appendChild(glow);

  const textEl = document.createElement('div');
  textEl.className = 'jnlp-text';
  textEl.dataset.raw = entry.text || '';
  inkIn(textEl, cardDelay);
  card.appendChild(textEl);

  const dateEl = document.createElement('span');
  dateEl.className   = 'jnlp-date';
  dateEl.textContent = formatDate(entry.date);
  card.appendChild(dateEl);

  return card;
}

// ── Render ────────────────────────────────────────
function render() {
  const section = document.getElementById('journal');
  if (!section) return;

  const entries = sortEntries(load().filter(isPublic));

  spawnDust(section);

  const intro = document.createElement('p');
  intro.className = 'jnlp-intro';
  intro.textContent = 'things I chose to share.';
  section.appendChild(intro);

  const list = document.createElement('div');
  list.className = 'jnlp-list';

  if (entries.length === 0) {
    list.innerHTML = '<p class="jnlp-empty">nothing shared yet.</p>';
  } else {
    entries.forEach((entry, i) => list.appendChild(buildCard(entry, i)));
  }

  section.appendChild(list);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', render);
} else {
  render();
}

})();
