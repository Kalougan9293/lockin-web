-- =============================================================================
-- LockIn — Journal d'envoi des relances (intégration n8n / cron)
-- À exécuter dans le SQL Editor Supabase (une seule fois).
-- Prérequis : 002_dashboard_persistence.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE relance_deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relance_deliveries (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ligne_id            uuid        NOT NULL REFERENCES public.lignes_factures (id) ON DELETE CASCADE,
  step_id             uuid        NOT NULL REFERENCES public.relance_steps (id) ON DELETE CASCADE,
  tableau_id          uuid        NOT NULL REFERENCES public.tableaux (id) ON DELETE CASCADE,
  scheduled_for       date        NOT NULL,
  status              text        NOT NULL DEFAULT 'pending',
  sent_at             timestamptz,
  provider            text,
  provider_message_id text,
  error_message       text,
  idempotency_key     text        NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT relance_deliveries_idempotency_key_unique
    UNIQUE (idempotency_key),

  CONSTRAINT relance_deliveries_status_valid
    CHECK (status IN ('pending', 'queued', 'sent', 'failed'))
);

COMMENT ON TABLE public.relance_deliveries IS
  'Journal des relances programmées et réellement envoyées (cron n8n).';
COMMENT ON COLUMN public.relance_deliveries.scheduled_for IS
  'Date prévue d''envoi (échéance facture + days de l''étape).';
COMMENT ON COLUMN public.relance_deliveries.status IS
  'pending → queued (cron) → sent | failed';
COMMENT ON COLUMN public.relance_deliveries.idempotency_key IS
  'Clé unique anti-doublon, ex. "{ligne_id}:{step_id}:{scheduled_for}".';

CREATE INDEX IF NOT EXISTS relance_deliveries_status_idx
  ON public.relance_deliveries (status);

CREATE INDEX IF NOT EXISTS relance_deliveries_scheduled_for_idx
  ON public.relance_deliveries (scheduled_for);

CREATE INDEX IF NOT EXISTS relance_deliveries_status_scheduled_for_idx
  ON public.relance_deliveries (status, scheduled_for);

CREATE INDEX IF NOT EXISTS relance_deliveries_tableau_id_idx
  ON public.relance_deliveries (tableau_id);

CREATE INDEX IF NOT EXISTS relance_deliveries_ligne_id_idx
  ON public.relance_deliveries (ligne_id);

CREATE INDEX IF NOT EXISTS relance_deliveries_step_id_idx
  ON public.relance_deliveries (step_id);

-- Index partiel : requêtes quotidiennes du cron (relances à traiter)
CREATE INDEX IF NOT EXISTS relance_deliveries_cron_pending_idx
  ON public.relance_deliveries (scheduled_for)
  WHERE status IN ('pending', 'queued');

-- ---------------------------------------------------------------------------
-- 2. Trigger updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_relance_deliveries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS relance_deliveries_set_updated_at ON public.relance_deliveries;

CREATE TRIGGER relance_deliveries_set_updated_at
  BEFORE UPDATE ON public.relance_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_relance_deliveries_updated_at();

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.relance_deliveries ENABLE ROW LEVEL SECURITY;

-- Cron / API serveur (service_role) : accès complet explicite
DROP POLICY IF EXISTS relance_deliveries_service_role_all ON public.relance_deliveries;
CREATE POLICY relance_deliveries_service_role_all
  ON public.relance_deliveries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Utilisateur connecté : lecture seule sur ses propres tableaux
DROP POLICY IF EXISTS relance_deliveries_select_own ON public.relance_deliveries;
CREATE POLICY relance_deliveries_select_own
  ON public.relance_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = relance_deliveries.tableau_id
        AND t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Droits
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.relance_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relance_deliveries TO service_role;
