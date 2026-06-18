-- Keep application-owned objects separate from PostgreSQL's public schema.
-- Domain tables will be introduced by explicit migrations in later versions.
CREATE SCHEMA IF NOT EXISTS shiftarc AUTHORIZATION CURRENT_USER;

COMMENT ON SCHEMA shiftarc IS 'ShiftARC application-owned database objects';
