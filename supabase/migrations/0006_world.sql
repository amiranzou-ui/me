-- The 3D world (see the AmeerStudio 3D World Design Document, §29).
-- Additive only: every column is nullable or defaulted, so the current
-- site keeps working before and after this runs. The world reads these
-- fields when present and falls back to derived values when they aren't.

-- ── Projects become Workshop bays ─────────────────────────────────────
alter table projects add column if not exists year_start int;
alter table projects add column if not exists year_end int;
alter table projects add column if not exists experience_id uuid references experience(id) on delete set null;
alter table projects add column if not exists bay_size text not null default 'standard'
  check (bay_size in ('small', 'standard', 'large'));
alter table projects add column if not exists accent text;
-- Optional authored model for the bay's easel (path in the media bucket or
-- under /world/models). Null = the procedural easel with the cover print.
alter table projects add column if not exists hero_model_path text;

-- The pinboard: visuals that belong to one project.
create table if not exists project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  kind text not null default 'image' check (kind in ('image', 'video', 'pdf')),
  caption text,
  weight int not null default 1 check (weight between 1 and 3),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table project_media enable row level security;
create policy "public_read" on project_media for select using (
  exists (select 1 from projects p where p.id = project_id and p.status = 'published')
);
create policy "owner_all" on project_media for all using (is_owner()) with check (is_owner());
grant select on project_media to anon;
grant select, insert, update, delete on project_media to authenticated, service_role;

-- ── Gallery: hanging weight + the Darkroom's friends-only prints ─────
alter table gallery_items add column if not exists weight int not null default 1 check (weight between 1 and 3);
alter table gallery_items add column if not exists friends_only boolean not null default false;

-- ── Categories pick which room kit their floor uses ──────────────────
-- Null = derived from the slug (photography → gallery, posters → stair, …).
alter table categories add column if not exists room text
  check (room in ('gallery', 'stair', 'pattern', 'listening', 'kitchen', 'unfinished'));

-- ── Tracks: real duration for the record sleeves ─────────────────────
-- (duration_seconds already exists from 0001; nothing to add.)
