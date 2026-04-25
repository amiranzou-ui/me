// mind-journal.js — completely independent journal system
// No dependency on node system, fragment system, or attention/thread systems.
(function () {
'use strict';

const STORE_KEY = 'mind_journal_v1';
const visits    = parseInt(localStorage.getItem('mind_v') || '1');
const hour      = new Date().getHours();

// ── Persistence ────────────────────────────────────────────
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
}

function save(entries) {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}

function uid() {
  return 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ── Visibility ─────────────────────────────────────────────
function isVisible(entry) {
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

// ── Sort: newest first, slight session jitter ──────────────
function sortEntries(entries) {
  const seed = visits * 13 + hour * 3;
  return [...entries].sort((a, b) => {
    const diff = b.date - a.date;
    // Swap adjacent same-day entries occasionally for organic feel
    if (Math.abs(diff) < 86_400_000 && (a.date + seed) % 9 === 0) return -diff;
    return diff;
  });
}

// ── Owner detection (loose — journal works fine without it) ─
function isOwner() {
  return !!(window.MindAuthor?.isActive?.());
}

// ── HTML helpers ───────────────────────────────────────────
function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(ts) {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

// ── Entry HTML ─────────────────────────────────────────────
function entryHTML(entry, owner) {
  const priv = !entry.visibility?.public ? ' · private' : '';
  return `
    <div class="jnl-entry" data-jid="${entry.id}">
      <div class="jnl-text">${esc(entry.text)}</div>
      <div class="jnl-meta">
        <span class="jnl-date">${formatDate(entry.date)}${priv}</span>
        ${owner ? `
          <span class="jnl-entry-actions">
            <button class="jnl-edit-btn" data-jid="${entry.id}">edit</button>
            <button class="jnl-del-btn"  data-jid="${entry.id}">delete</button>
          </span>` : ''}
      </div>
    </div>`;
}

// ── State ──────────────────────────────────────────────────
let overlay  = null;
let isOpen   = false;
let formOpen = false;

// ── Open / close ───────────────────────────────────────────
function openJournal() {
  if (isOpen) return;
  isOpen = true;

  const owner   = isOwner();
  const entries = load();
  const visible = owner ? entries : entries.filter(isVisible);
  const sorted  = sortEntries(visible);

  overlay = document.createElement('div');
  overlay.id = 'jnl-overlay';
  overlay.innerHTML = buildOverlay(sorted, owner);
  document.body.appendChild(overlay);

  // fade in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  }));

  bindEvents(owner);
}

function closeJournal() {
  if (!isOpen || !overlay) return;
  isOpen   = false;
  formOpen = false;
  overlay.style.transition = 'opacity 0.7s cubic-bezier(0.4,0,0.6,1)';
  overlay.style.opacity    = '0';
  setTimeout(() => { overlay?.remove(); overlay = null; }, 750);
  document.removeEventListener('keydown', onKey);
}

// ── Build overlay markup ───────────────────────────────────
function buildOverlay(sorted, owner) {
  const list = sorted.length
    ? sorted.map(e => entryHTML(e, owner)).join('')
    : '<p class="jnl-empty">nothing here yet.</p>';

  return `
    <div class="jnl-inner">
      <div class="jnl-header">
        <span class="jnl-title">journal</span>
        ${owner ? '<button class="jnl-owner-add" id="jnl-add" title="new entry">+</button>' : ''}
        ${owner ? '<a class="jnl-view-public" href="Human.html#journal" target="_blank" title="see public view">↗ public</a>' : ''}
        <button class="jnl-close-btn" id="jnl-close">×</button>
      </div>
      <div id="jnl-entry-list">${list}</div>
    </div>`;
}

// ── Bind overlay events ────────────────────────────────────
function bindEvents(owner) {
  overlay.querySelector('#jnl-close')?.addEventListener('click', closeJournal);

  // Click outside column closes
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeJournal();
  });

  document.addEventListener('keydown', onKey);

  if (owner) {
    overlay.querySelector('#jnl-add')?.addEventListener('click', () => showForm(null));
    rebindEntryActions();
  }
}

function onKey(e) {
  if (e.key === 'Escape') closeJournal();
}

// ── Entry owner actions ────────────────────────────────────
function rebindEntryActions() {
  overlay?.querySelectorAll('.jnl-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const entry = load().find(e => e.id === btn.dataset.jid);
      if (entry) showForm(entry);
    });
  });

  overlay?.querySelectorAll('.jnl-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // inline confirmation — no native confirm()
      const meta = btn.closest('.jnl-meta');
      if (!meta) return;
      meta.innerHTML = `
        <span class="jnl-del-confirm">
          delete?
          <button class="jnl-del-yes" data-jid="${btn.dataset.jid}">yes</button>
          <button class="jnl-del-no">no</button>
        </span>`;
      meta.querySelector('.jnl-del-yes').addEventListener('click', () => {
        const id = meta.querySelector('.jnl-del-yes').dataset.jid;
        save(load().filter(e => e.id !== id));
        refreshList();
      });
      meta.querySelector('.jnl-del-no').addEventListener('click', refreshList);
    });
  });
}

// ── Refresh entry list in place ────────────────────────────
function refreshList() {
  const owner   = isOwner();
  const entries = load();
  const visible = owner ? entries : entries.filter(isVisible);
  const sorted  = sortEntries(visible);
  const list    = overlay?.querySelector('#jnl-entry-list');
  if (!list) return;

  // remove form if present
  overlay?.querySelector('.jnl-form-wrap')?.remove();
  formOpen = false;

  list.innerHTML = sorted.length
    ? sorted.map(e => entryHTML(e, owner)).join('')
    : '<p class="jnl-empty">nothing here yet.</p>';

  if (owner) rebindEntryActions();
}

// ── Write / edit form ──────────────────────────────────────
function showForm(entry) {
  if (formOpen) return;
  formOpen = true;

  const isEdit  = !!entry;
  const wrap    = document.createElement('div');
  wrap.className = 'jnl-form-wrap';
  wrap.innerHTML = `
    <textarea class="jnl-form-textarea" id="jnl-ftext"
      placeholder="write…" rows="6">${isEdit ? esc(entry.text) : ''}</textarea>
    <div class="jnl-form-opts">
      <label class="jnl-opt-label">
        <input type="checkbox" id="jnl-fpub" ${!isEdit || entry.visibility?.public ? 'checked' : ''}>
        share on human page
      </label>
      <label class="jnl-opt-label">
        min visits
        <input class="jnl-opt-number" id="jnl-fminv" type="number" min="1"
          placeholder="any"
          value="${isEdit && entry.visibility?.conditions?.minVisits || ''}">
      </label>
    </div>
    <div class="jnl-form-actions">
      <button class="jnl-fbtn jnl-fbtn-save"   id="jnl-fsave">${isEdit ? 'save' : 'add'}</button>
      <button class="jnl-fbtn jnl-fbtn-cancel" id="jnl-fcancel">cancel</button>
    </div>`;

  // Insert before entry list
  const list = overlay.querySelector('#jnl-entry-list');
  overlay.querySelector('.jnl-inner').insertBefore(wrap, list);
  wrap.querySelector('#jnl-ftext').focus();

  wrap.querySelector('#jnl-fsave').addEventListener('click', () => {
    const text = wrap.querySelector('#jnl-ftext').value.trim();
    if (!text) return;

    const pub   = wrap.querySelector('#jnl-fpub').checked;
    const minv  = parseInt(wrap.querySelector('#jnl-fminv').value) || undefined;
    const vis   = { public: pub, conditions: minv ? { minVisits: minv } : {} };

    const all = load();
    if (isEdit) {
      const idx = all.findIndex(e => e.id === entry.id);
      if (idx !== -1) { all[idx].text = text; all[idx].visibility = vis; }
    } else {
      all.unshift({ id: uid(), text, date: Date.now(), visibility: vis });
    }
    save(all);
    refreshList();
  });

  wrap.querySelector('#jnl-fcancel').addEventListener('click', () => {
    wrap.remove();
    formOpen = false;
  });
}

// ── Trigger button ─────────────────────────────────────────
function createTrigger() {
  const btn   = document.createElement('button');
  btn.id      = 'jnl-trigger';
  btn.setAttribute('aria-label', 'open journal');

  const word  = 'journal';
  const total = word.length;

  // Build letter spans with staggered breathe timing
  word.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.className   = 'jnl-letter';
    span.textContent = ch;
    // Wave: each letter peaks at a different phase
    const delay = -(total - i) / total * 4;   // stagger across the 4s cycle
    span.style.animationDelay = delay + 's';
    btn.appendChild(span);
  });

  document.body.appendChild(btn);

  // Hover — swap animation for full glow + emit sparks
  btn.addEventListener('mouseenter', () => {
    btn.classList.add('jnl-trigger-hover');
    emitSparks(btn);
  });
  btn.addEventListener('mouseleave', () => {
    btn.classList.remove('jnl-trigger-hover');
    // restart breathe from current position smoothly
    btn.querySelectorAll('.jnl-letter').forEach((s, i) => {
      const delay = -(total - i) / total * 4;
      s.style.animationDelay = delay + 's';
    });
  });

  btn.addEventListener('click', openJournal);
}

// Emit small gold sparks around the trigger
function emitSparks(btn) {
  const rect   = btn.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const COLORS = [
    'rgba(255,220,100,',
    'rgba(255,200,60,',
    'rgba(220,180,80,',
    'rgba(255,240,180,',
  ];

  for (let i = 0; i < 18; i++) {
    const sp    = document.createElement('div');
    sp.className = 'jnl-spark';
    const angle = Math.random() * Math.PI * 2;
    const dist  = 14 + Math.random() * 38;
    const size  = 1.5 + Math.random() * 2.5;
    const dur   = 500 + Math.random() * 400;
    const col   = COLORS[Math.floor(Math.random() * COLORS.length)];

    sp.style.cssText = [
      `left:${cx + (Math.random() - 0.5) * rect.width * 0.8}px`,
      `top:${cy + (Math.random() - 0.5) * 6}px`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${col}0.85)`,
      `--tx:${Math.cos(angle) * dist}px`,
      `--ty:${Math.sin(angle) * dist - 10}px`,
      `--dur:${dur}ms`,
      `animation-delay:${Math.random() * 160}ms`,
    ].join(';');

    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), dur + 200);
  }
}

// ── Init ───────────────────────────────────────────────────
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', createTrigger);
} else {
  createTrigger();
}

window.MindJournal = { open: openJournal, close: closeJournal };

})();
