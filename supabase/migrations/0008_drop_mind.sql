-- Removes the Mind subsystem tables, cut by the owner in July 2026 (see
-- ARCHITECTURE.md "What's dropped" and the design doc's concept ledger).
-- They were created in 0001 but never used: no rows, no code reads them.
-- Destructive, so it is kept separate and optional — check they are empty
-- before running:  select count(*) from mind_nodes;  (and the other two)

drop table if exists mind_journal_entries;
drop table if exists mind_connections;
drop table if exists mind_nodes;
drop type if exists mind_connection_type;
drop type if exists mind_visibility_mode;
drop type if exists mind_node_type;
