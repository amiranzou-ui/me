# Architecture — Personal Website V2

This document is the binding blueprint for the migration from the current static vanilla HTML/CSS/JS site to Next.js + TypeScript + Tailwind + Framer Motion + Supabase. Implementation follows this document; it is not rewritten ad hoc while coding. Update it at the end of each phase if reality diverges from what's written here.

Full phase-by-phase execution plan lives alongside this repo's planning history; this document explains the *shape* of the system and *why*, not the day-to-day task list.

---

## Why this migration

The site is a hand-authored artifact — a cinematic "Matrix vs Human" split identity, custom canvas ambient effects — that is genuinely this person's permanent digital home, not a disposable portfolio project. Its problem isn't design, it's maintainability: every new project, photo, or song requires editing large JS files by hand. That breaks the creative workflow and doesn't scale to the 100+ projects / 500+ photos / 20+ categories this site should hold over the next 5-10 years.

The fix is architectural: separate content from presentation. The UI stays; the data becomes editable through a private Studio, backed by Supabase, without ever touching code again.

---

## What stays (preserved verbatim, not redesigned)

- **The Matrix / Human split-screen concept** — the site's core identity, not a reskinnable layout choice.
- **`portal()` circular-wipe page transition** — the exact DOM technique (a fixed circular div sized to `hypot(innerWidth,innerHeight)*2.6`, scaled from the click point over 720ms), ported as-is rather than rebuilt in Framer Motion's `AnimatePresence`.
- **`world.js`'s ambient effects** — cursor aura, the bezier "living divider," magnetic profile node, glass-lens cursor distortion, dust particles, breathing/ambient pulses, matrix-side glitch, parallax backgrounds — all ported nearly verbatim as TypeScript, still running on one shared `raf` loop.
- **The first-visit intro sequence** (`/intro`) — the three staggered fade-in lines + "Enter" link that a brand-new visitor sees once before the landing page, gated by the same `localStorage` `seen_intro` flag as before. This was accidentally left out of Phases 0-5 (deferred, then never revisited); closed during the Phase 7 pre-cutover content diff.
- **The landing page's `.atm-human`/`.atm-matrix` photo layers** — the blurred/grayscale portrait and archive-photo backgrounds behind each side, ported from `atmosphere.css`. Also missed in the original pass; `world-effects.ts` had already been written to parallax these elements gracefully once they existed, so this was a pure CSS/markup port, no JS changes needed.
- **Typography and color identity** — Cormorant Garamond + Inter, the cream/ink/accent-orange palette — same values, just tokenized into Tailwind theme + self-hosted fonts instead of a Google Fonts CDN link.
- **The Human-side "friend gate"** — the soft, client-side, intentionally-bypassable pacing mechanism for photography/cooking. It is not real security today and isn't meant to become real security; only its config (which categories are locked, the password) moves from hardcoded JS into the Studio.
- **The Studio's own aesthetic inherits from the public site** — Cormorant Garamond/Inter, the same color tokens, calm motion — so authoring content feels like an extension of the site's world, not a separate generic app.

## What's replaced

| From | To | Why |
|---|---|---|
| Hardcoded arrays in `matrix.js`/`human.html`/`archive.js`/`cooking.js`/`music.js` | Supabase Postgres tables | Content editable without code; single source of truth (fixes a confirmed 3-way duplication of category metadata across `human.html`, `human-memory.js`, and `archive.js`) |
| GitHub Pages (static-only) | Vercel | The Studio needs server-side auth middleware and dynamic data fetching, which static hosting can't serve |
| Google Fonts CDN link | `next/font` self-hosted | Real performance win, zero visual change |
| Raw images/audio committed to the repo | Supabase Storage, with true originals archived in a private `originals/` path and optimized derivatives served publicly | Satisfies "keep the original" literally without ever serving 17-28MB files to visitors |
| Inline `<svg>` strings stored as CV link icons | A named icon enum mapped to a component | Closes an avoidable stored-content XSS surface |

## What's dropped

- **The hidden node-graph "Mind" page** — was planned as Phase 4 (Supabase-backed nodes/connections/journal, editor tool ported from `editor.js`/`mind-author.js`). The owner decided during Phase 4 planning that the concept no longer fits the rest of the site and cut it before any schema or code was written. Nothing from the legacy `mind.html`/`editor.html`/`mind-*.js`/`editor.js` files is being ported; they remain untouched under `legacy/` as historical reference only.

## What's new

- **The Studio** — a private, single-owner content-authoring surface, deliberately not styled like a generic admin dashboard. Organized around the site's own mental model (a project library, a Human-side gallery grouped by chapter) rather than raw database tables. Workflow-first: publishing a project targets under 2 minutes, a gallery upload under 1 minute — measured, not assumed.
- **`content_relations`** — a polymorphic join table (`from_type`, `from_id`, `to_type`, `to_id`, `relation_label`) letting any content type reference any other (a project citing the photography, track, or journal entry that relates to it) without a schema migration when new content types appear later. Integrity is enforced at the application layer, not via database foreign keys, since Postgres can't natively constrain a column to "whichever table `from_type` names" — an accepted tradeoff given a single trusted editor.
- **`assets`** — one central media table (path, dimensions, blurhash, mime, size) referenced by projects, gallery items, and CV content alike, instead of ad hoc storage-path fields scattered per content type.
- **Dynamic `/project/[slug]` pages** — every published project automatically gets a real URL, with SEO metadata and any related content (via `content_relations`) rendered alongside it.

---

## Data flow

```
Studio (authenticated, single owner)
   │  writes
   ▼
Supabase Postgres  ──────────────┐
   │  (RLS: public read where     │
   │   status='published';        │  content_relations
   │   write = owner only)        │  (polymorphic links between
   ▼                              │   any two content rows)
Public Next.js pages              │
 (Server Components, ISR)  ◄──────┘
   │  reads published rows
   │  + resolves related content
   ▼
Visitor's browser
   │
   └─ Media: <Image>/<audio> requests rewritten through a custom
      next/image loader → Supabase Storage's image-transform
      endpoint (thumbnail/WebP on demand) or a signed/public
      Storage URL for audio streaming
```

Uploads follow a parallel path: Studio upload → true original stored untouched in `originals/` (never served) → one eager "display" derivative generated at upload time → additional sizes generated on-demand via the transform API and cached at the CDN edge.

---

## Schema overview

**Human-side gallery (unified, not one table per category)**
- `categories` (slug, label, roman, tagline, kind: gallery|music|placeholder, is_locked, sort_order) — single source of truth replacing the old 3-way duplication.
- `gallery_items` (category_id, title, caption, alt_text, asset_id, tags, status, `meta jsonb`) — the `meta` column absorbs category-specific shape (cooking's hover-caption/lines vs. photography's plain caption) so a brand-new category never requires a schema change.
- `tracks` (title, artist, year, mood, fragment, storage_path, ...) — music, kept structurally separate from image galleries since its shape and player differ entirely.

**Matrix (CV) side**
- `cv_meta` (singleton: bio, contact, links, summary, core skills, signals, education/languages as jsonb).
- `projects` (slug, title, role, desc, stack, status, cover_asset_id, ...) — drives `/project/[slug]`.
- `experience`, `skills_groups`.
- `matrix_nodes` — the CV page's own "system view" graph.

**Cross-cutting**
- `assets` — central media table.
- `content_relations` — polymorphic content-to-content links, surfaced in the Studio as one reusable "relate content" picker on every editor.

---

## Phase mechanics

Each phase leaves the site fully deployable on a Vercel preview URL. `ameerstudio.site` keeps serving the untouched current site from `main` via GitHub Pages until the final cutover — there is no point at which the live site is broken or half-migrated.

| Phase | Builds | Done when |
|---|---|---|
| 0 — Foundation | This document; `v2` branch scaffold (Next.js/TS/Tailwind); Supabase schema, RLS, owner auth (incl. `content_relations`); self-hosted fonts; color tokens; `core.js`/`world.js` ported and smoke-tested | Empty shell deployed to a Vercel preview |
| 1 — Matrix + Studio auth | Matrix tables populated via a one-off migration script; `/matrix` ported preserving graph interactions; Studio auth + CV/projects CRUD | `/matrix` preview matches the old page visually; a Studio edit shows up live |
| 2 — Human gallery + media pipeline | `categories`/`gallery_items`/`assets` + Storage + upload pipeline + Studio gallery CRUD/reorder; `/human` ported preserving the soft friend-gate (now driven by `categories.is_locked`) | `/human` preview shows real Supabase content; a test upload appears live with no code change |
| 3 — Music | `tracks` table + Studio CRUD + audio upload; `music.js` ported as-is (it already uses a plain `<audio>` element, no real Web Audio decode graph, so Storage streaming is a drop-in) | Player streams real tracks; Studio can add/reorder |
| 4 — ~~Mind system port~~ | Dropped — see "What's dropped" above. Not built. | — |
| 5 — Relations + dynamic project pages + SEO | `content_relations` picker wired into every Studio editor; `/project/[slug]` auto-generated pages rendering related content; metadata, sitemap, structured data | Every published project has a real URL, shows related content, with SEO metadata |
| 6 — Mobile pass + perf/a11y audit ✅ | Lighthouse (perf/a11y/best-practices/SEO) run on `/`, `/matrix`, `/human`, `/project/[slug]`; axe-core run against every gated state Lighthouse can't reach (friend gate, archive hall, music capsule paused/playing, all gallery categories); heavy per-frame Canvas effects (CursorFx's 120-particle ambient canvas, MusicCapsule's 46-particle dust canvas) skipped entirely on touch devices and replaced with a handful of CSS-only `@keyframes` motes — plain CSS, not Framer Motion (see rationale) | All four pages score 100 accessibility/best-practices/SEO, 92-96 performance under mobile-throttled emulation; axe-core clean on every gated state; mobile screenshot pass found and fixed one real layout bug (archive-hall's "3D" chapter number/title touching at 0 column-gap); touch devices confirmed to render fully static (zero-redraw) canvases while core functional animation (tonearm, visualizer) keeps working |
| 7 — Cutover | Final migration re-run against production; full content diff old vs. new; merge `v2` → `main`; DNS/CNAME repoint to Vercel; GitHub Pages disabled | `ameerstudio.site` serves the new site |

---

## Key rationale (so future decisions stay consistent with these, not re-litigate them)

- **Unified `gallery_items` + jsonb `meta`, not a table per category** — the only way "20+ categories without code changes" is actually true. A new category (say, "film") never needs a migration, just a new `categories` row and Studio support for whatever fields its `meta` shape wants.
- **Polymorphic `content_relations` over per-pair foreign keys** — a project-to-photo relation and a project-to-track relation would otherwise need separate join tables, and every future content type would need its own new join tables against every existing type. One generic table, validated in the app layer, avoids that combinatorial growth.
- **Verbatim-port the animation core instead of reimplementing in Framer Motion** — `core.js`/`world.js` are already highly tuned; a rewrite risks subtly different physics/easing for zero content-management benefit, directly against "must never feel templated."
- **The Studio is a product, not a CRUD scaffold** — because it's used weekly for years, its own feel matters as much as the public site's. A generic table-and-form admin panel would work functionally but fail the actual goal (effortless, enjoyable publishing).
- **Archive-but-don't-serve original media** — "keep the original" and "don't serve 27MB PNGs to visitors" both matter; storing untouched originals in a private path and serving generated derivatives satisfies both without contradiction.
- **Plain CSS over Framer Motion for the Phase 6 touch replacement** — `framer-motion` was never actually added as a dependency across Phases 1-5 (the Studio's motion needs turned out simple enough for CSS transitions); introducing it for the first time just for a few ambient touch-device dots wasn't worth a new dependency. The touch motes use `@keyframes` transform/opacity animation instead — compositor-driven, same practical effect (no per-frame JS cost), and consistent with how every other animation in this codebase is already built.
