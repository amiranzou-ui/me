-- Phase 0 foundational schema — see ARCHITECTURE.md for full rationale.
-- Real content migration (Matrix/Human/Mind data) happens in later phases;
-- this migration only creates structure, RLS, and the cv_meta singleton row.

create extension if not exists "pgcrypto";

-- ── Enums ─────────────────────────────────────────────────────────────
create type content_status as enum ('draft', 'published', 'archived');
create type category_kind as enum ('gallery', 'music', 'placeholder');
create type matrix_node_type as enum ('timeline', 'skill', 'project', 'thought');
create type mind_node_type as enum ('text', 'image', 'audio', 'void');
create type mind_visibility_mode as enum ('public', 'private', 'partial');
create type mind_connection_type as enum ('logical', 'contradiction', 'echo', 'hidden');

-- ── Owner check (single trusted editor, no roles table) ─────────────
-- Update the email below if the Studio login ends up using a different address.
create or replace function is_owner() returns boolean
language sql stable
as $$
  select auth.jwt() ->> 'email' = 'amiranzou@outlook.com';
$$;

create or replace function set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Cross-cutting ─────────────────────────────────────────────────────
create table assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  width int,
  height int,
  blurhash text,
  mime text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table content_relations (
  id uuid primary key default gen_random_uuid(),
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  relation_label text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Human-side gallery (unified across categories, see ARCHITECTURE.md) ─
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  roman text,
  tagline text,
  kind category_kind not null default 'gallery',
  is_locked boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  title text,
  caption text,
  alt_text text,
  asset_id uuid references assets(id) on delete set null,
  sort_order int not null default 0,
  status content_status not null default 'draft',
  tags text[] not null default '{}',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  year int,
  mood text[] not null default '{}',
  fragment text,
  side text,
  room text,
  note text,
  storage_path text,
  duration_seconds int,
  sort_order int not null default 0,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Matrix (CV) side ──────────────────────────────────────────────────
create table cv_meta (
  id int primary key default 1,
  name text,
  tag text,
  bio text,
  contact jsonb not null default '{}'::jsonb,
  links jsonb not null default '[]'::jsonb,
  summary text,
  core_skills text[] not null default '{}',
  signals text[] not null default '{}',
  education jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint cv_meta_singleton check (id = 1)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  role text,
  description text,
  impact text,
  stack text[] not null default '{}',
  behance_url text,
  external_url text,
  status content_status not null default 'draft',
  cover_asset_id uuid references assets(id) on delete set null,
  sort_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table experience (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  company text,
  date_label text,
  points text[] not null default '{}',
  sort_order int not null default 0
);

create table skills_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  tags text[] not null default '{}',
  sort_order int not null default 0
);

-- The CV page's own "system view" graph — distinct from the Mind subsystem's
-- node graph below, despite the similar shape. Do not conflate the two.
create table matrix_nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null unique,
  type matrix_node_type not null,
  x numeric,
  y numeric,
  title text,
  summary text,
  connections text[] not null default '{}',
  thinking jsonb not null default '[]'::jsonb,
  sort_order int not null default 0
);

-- ── Mind subsystem (hidden node-graph journal) ───────────────────────
create table mind_nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null unique,
  type mind_node_type not null default 'text',
  content text,
  fragment text,
  visibility_mode mind_visibility_mode not null default 'public',
  conditions jsonb not null default '{}'::jsonb,
  emotion_weight numeric(3,2) not null default 0.5,
  position_x numeric not null default 50,
  position_y numeric not null default 50,
  delay_seconds numeric not null default 0,
  connections text[] not null default '{}',
  parent_node_key text references mind_nodes(node_key) on delete set null,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mind_connections (
  id uuid primary key default gen_random_uuid(),
  from_node_key text not null references mind_nodes(node_key) on delete cascade,
  to_node_key text not null references mind_nodes(node_key) on delete cascade,
  type mind_connection_type not null default 'logical'
);

create table mind_journal_entries (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  entry_date timestamptz not null default now(),
  visibility_public boolean not null default true,
  min_visits int,
  hour_range int4range,
  status content_status not null default 'draft'
);

-- ── updated_at triggers ───────────────────────────────────────────────
create trigger set_updated_at before update on gallery_items
  for each row execute function set_updated_at();
create trigger set_updated_at before update on tracks
  for each row execute function set_updated_at();
create trigger set_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger set_updated_at before update on mind_nodes
  for each row execute function set_updated_at();
create trigger set_updated_at before update on cv_meta
  for each row execute function set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────
-- Pattern: public read (unconditional for small always-public tables, or
-- status='published' for content with a draft/publish workflow); write
-- restricted to the single owner via is_owner(). No roles table — see
-- ARCHITECTURE.md's "deliberate simplification" note.

alter table assets enable row level security;
create policy "public_read" on assets for select using (true);
create policy "owner_all" on assets for all using (is_owner()) with check (is_owner());

alter table content_relations enable row level security;
create policy "public_read" on content_relations for select using (true);
create policy "owner_all" on content_relations for all using (is_owner()) with check (is_owner());

alter table categories enable row level security;
create policy "public_read" on categories for select using (true);
create policy "owner_all" on categories for all using (is_owner()) with check (is_owner());

alter table gallery_items enable row level security;
create policy "public_read_published" on gallery_items for select using (status = 'published');
create policy "owner_all" on gallery_items for all using (is_owner()) with check (is_owner());

alter table tracks enable row level security;
create policy "public_read_published" on tracks for select using (status = 'published');
create policy "owner_all" on tracks for all using (is_owner()) with check (is_owner());

alter table cv_meta enable row level security;
create policy "public_read" on cv_meta for select using (true);
create policy "owner_all" on cv_meta for all using (is_owner()) with check (is_owner());

alter table projects enable row level security;
create policy "public_read_published" on projects for select using (status = 'published');
create policy "owner_all" on projects for all using (is_owner()) with check (is_owner());

alter table experience enable row level security;
create policy "public_read" on experience for select using (true);
create policy "owner_all" on experience for all using (is_owner()) with check (is_owner());

alter table skills_groups enable row level security;
create policy "public_read" on skills_groups for select using (true);
create policy "owner_all" on skills_groups for all using (is_owner()) with check (is_owner());

alter table matrix_nodes enable row level security;
create policy "public_read" on matrix_nodes for select using (true);
create policy "owner_all" on matrix_nodes for all using (is_owner()) with check (is_owner());

alter table mind_nodes enable row level security;
create policy "public_read_published" on mind_nodes for select using (status = 'published');
create policy "owner_all" on mind_nodes for all using (is_owner()) with check (is_owner());

alter table mind_connections enable row level security;
create policy "public_read" on mind_connections for select using (true);
create policy "owner_all" on mind_connections for all using (is_owner()) with check (is_owner());

alter table mind_journal_entries enable row level security;
create policy "public_read_published" on mind_journal_entries for select using (status = 'published');
create policy "owner_all" on mind_journal_entries for all using (is_owner()) with check (is_owner());

-- ── Seed the cv_meta singleton row (structure only, no real content yet) ─
insert into cv_meta (id) values (1);
