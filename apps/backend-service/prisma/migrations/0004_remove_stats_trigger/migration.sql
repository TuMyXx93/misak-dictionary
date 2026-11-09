-- ================================================================
-- 0004_remove_stats_trigger — Fix detectado por spec 003
-- El trigger trg_refresh_stats_campos ejecutaba REFRESH MATERIALIZED
-- VIEW CONCURRENTLY en cada INSERT/UPDATE/DELETE de palabrasm1_microcampos.
-- CONCURRENTLY no puede correr dentro de una transacción → Prisma fallaba
-- con DriverAdapterError al insertar cualquier término vinculado.
--
-- Fix arquitectónico: la vista materializada se refresjará por job
-- programado (espec posterior), no por trigger por-escritura.
-- ================================================================

DROP TRIGGER IF EXISTS trg_refresh_stats_campos ON palabrasm1_microcampos;
DROP FUNCTION IF EXISTS refresh_mv_stats_campos();
