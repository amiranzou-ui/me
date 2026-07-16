# Ameer Al-Butaihi — Personal Website

A two-sided personal site — "Matrix" (CV/portfolio) and "Human" (photography, music, and everything else) — built with Next.js and backed by Supabase, with a private Studio for managing all content without touching code. Live at [ameerstudio.site](https://ameerstudio.site).

---

## Pages

| Page | Path | Description |
|---|---|---|
| Landing | `/` | Two-sided split — Matrix and Human |
| Intro | `/intro` | First-visit-only entrance sequence |
| Matrix | `/matrix` | CV — overview, full timeline, skills, system-view node graph |
| Human | `/human` | Friend-gated archive: photography, posters, graphics, music, food, 3D |
| Project | `/project/[slug]` | Auto-generated page per published project, with related content |
| Studio | `/studio` | Private, owner-only CMS for every content type above |

---

## Structure

```text
/
├── src/app/            — routes (App Router)
│   └── studio/          — the private CMS: CV, projects, gallery, tracks
├── src/components/      — human/, matrix/, studio/, world/ (ported cursor/ambient effects)
├── src/lib/              — Supabase clients, domain types, ported core/effects utilities
├── src/styles/           — one stylesheet per page/feature
├── scripts/              — one-off Supabase data migration scripts
├── supabase/migrations/  — schema
└── public/               — static assets (CV PDF, profile photo)
```

---

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Storage, Auth) · self-hosted fonts via `next/font`

Content lives in Supabase, not in the code — the Studio is how new projects, photos, and tracks get published. See `ARCHITECTURE.md` for the full rationale behind these decisions.

---

## Running locally

```bash
npm install
```

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then:

```bash
npm run dev
```

`npm run build && npm run start` for a production build; `npm run lint` for ESLint.
