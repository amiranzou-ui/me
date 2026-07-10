-- Table/function grants for the Data API roles.
-- Disabling "Automatically expose new tables" during project setup (a
-- deliberate choice, see ARCHITECTURE.md) means these aren't automatic —
-- RLS policies control which ROWS are visible, but each role still needs a
-- base GRANT to touch the table at all.

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;

grant execute on function public.is_owner() to anon, authenticated, service_role;
grant execute on function public.set_updated_at() to anon, authenticated, service_role;
