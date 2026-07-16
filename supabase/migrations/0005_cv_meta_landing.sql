-- Extends cv_meta with the fields the landing page's profile panel needs
-- (previously hardcoded in src/app/page.tsx) so name/tag/links/photo and the
-- two split-screen taglines are editable from the Studio like everything else.

alter table cv_meta add column if not exists profile_asset_id uuid references assets(id) on delete set null;
alter table cv_meta add column if not exists currently_label text not null default '';
alter table cv_meta add column if not exists currently_value text not null default '';
alter table cv_meta add column if not exists matrix_side_desc text[] not null default '{}';
alter table cv_meta add column if not exists human_side_desc text[] not null default '{}';

-- Seed with the current hardcoded copy so the landing page renders
-- identically the moment this runs, before anyone edits it in the Studio.
update cv_meta set
  currently_label = 'Building',
  currently_value = 'This website, apparently',
  matrix_side_desc = array['Graphic Designer.', 'Social Media Manager.', 'Visual problem-solver.'],
  human_side_desc = array['Live music.', 'Curious mind.', 'Something else entirely.']
where id = 1;
