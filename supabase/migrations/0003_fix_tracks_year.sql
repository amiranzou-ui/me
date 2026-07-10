-- tracks.year was mistakenly typed as int in 0001_init.sql, but the actual
-- data is a text label like "Archive 01", not a numeric year.
alter table tracks alter column year type text using year::text;
