-- =============================================================================
-- LockIn — Domaine d'activité sur clients_lockin
-- À exécuter dans le SQL Editor Supabase (une seule fois).
-- =============================================================================

ALTER TABLE public.clients_lockin
  ADD COLUMN IF NOT EXISTS domaine_activite text;

COMMENT ON COLUMN public.clients_lockin.domaine_activite IS
  'Secteur d''activité du prestataire (inscription).';

ALTER TABLE public.clients_lockin
  DROP CONSTRAINT IF EXISTS clients_lockin_domaine_activite_valid;

ALTER TABLE public.clients_lockin
  ADD CONSTRAINT clients_lockin_domaine_activite_valid
  CHECK (
    domaine_activite IS NULL
    OR domaine_activite IN (
      'Sport',
      'Transport',
      'Commerce',
      'Restauration',
      'Santé',
      'Bâtiment',
      'Services',
      'Autre'
    )
  );
