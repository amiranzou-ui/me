# Ameer Al-Butaihi — AmeerStudio

A personal site built as one building standing on the seam between day and night. The daylit **Day Wing** (Matrix) holds the work: a Workshop of project bays along a brass time strip, the Records Room with the CV, the Type Case of skills, the Plan Room's thinking network. The lamp-lit **Night Tower** (Human) holds the life: photography, posters, graphics, a listening room, a kitchen, an unfinished 3D floor. The **Seam** joins them: the lobby, the elevator, and the portrait window at the top. Content comes from Supabase and is edited in a private Studio. Live at [ameerstudio.site](https://ameerstudio.site).

The design is in the AmeerStudio 3D World Design Document; the architecture and its reasons are in `ARCHITECTURE.md`.

---

## Places (every one is a URL)

| Station | Path |
|---|---|
| The Approach | `/` |
| Threshold Lobby | `/lobby` |
| Front Desk · Workshop · a bay | `/desk` · `/work` · `/work/<project>` |
| Records Room · Type Case · School Desk | `/records` · `/skills` · `/work/origin` |
| Plan Room · a thought | `/thinking` · `/thinking/<node>` |
| Archive Hall · a floor | `/archive` · `/archive/<chapter>` |
| Roof Study | `/roof` |
| Deep Archive (hidden) | `/below` |
| Studio (private) | `/studio` |

Old URLs redirect: `/matrix` → `/desk`, `/human` → `/archive`, `/project/<slug>` → `/work/<slug>`, `/intro` → `/`.

Every station also renders as a plain HTML page ("Read as page"), which is what screen readers, crawlers and devices without WebGL get.

---

## Structure

```text
src/
├── app/(world)/          — the world layout (mounts the 3D shell once) + one catch-all station route
├── app/studio/           — the private CMS: CV, projects, experience, skills, thinking, gallery, tracks
├── app/actions/friend.ts — the friend word, checked on the server
├── world/
│   ├── stations.ts       — the station registry: URLs, cameras, map, objects, zones (single source of truth)
│   ├── layout.ts         — building geometry: where every room, bay, print and record sits
│   ├── route.ts          — walks and elevator rides between stations
│   ├── store.ts          — state shared by the HTML layer and the canvas
│   ├── actions.ts        — everything a visitor can do (go, open, play, …)
│   ├── audio/engine.ts   — one Web Audio graph: procedural ambience, positional music
│   ├── scene/            — the canvas: camera rig, light rig, dust, zone streaming, kit, zones
│   ├── ui/               — HUD, sheets, map, quick navigation, accessibility mirror, arrival
│   └── docs/             — station documents (the HTML version of every place)
├── lib/world/content.ts  — builds the world's content from Supabase (tag-cached)
scripts/assets/           — Blender → GLB pipeline, font copier
assets/models-src/        — drop .glb exports here
supabase/migrations/      — schema (0006–0008 belong to the world)
```

## Stack

Next.js 16 (App Router) · TypeScript · React Three Fiber + three.js (+ drei, selectively) · zustand · Web Audio · Supabase (Postgres, Storage, Auth) · Tailwind (Studio only) · Vercel.

---

## Running locally

```bash
npm install
```

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
# optional
FRIEND_WORD=...            # the tower door's word (defaults to the current one)
NEXT_PUBLIC_SITE_URL=...   # for the sitemap and metadata
```

```bash
npm run dev            # http://localhost:3000
npm run build && npm run start
npm run lint
npm run assets:models  # optimise assets/models-src/*.glb into public/world/models
npm run assets:fonts   # refresh the 3D text faces in public/fonts
```

### Database

Apply `supabase/migrations/0006_world.sql` (additive: project dates, bay size, accent, the project pinboard table, print weight, friends-only prints, room kits). The world works without it, deriving those values, but the Studio's new fields need it. `0007_locked_floor_privacy.sql` makes locked floors private at the database level; run it after the world is live. `0008_drop_mind.sql` removes the unused Mind tables (optional, destructive).
