-- =============================================================================
-- LockIn — Réponses e-mail entrantes (webhook n8n → /api/incoming-reply)
-- À exécuter dans le SQL Editor Supabase (une seule fois).
-- Prérequis : 003_relance_deliveries.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.incoming_replies (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id     uuid        NOT NULL REFERENCES public.relance_deliveries (id) ON DELETE CASCADE,
  tableau_id      uuid        NOT NULL REFERENCES public.tableaux (id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  ligne_id        uuid        REFERENCES public.lignes_factures (id) ON DELETE SET NULL,
  sender_email    text        NOT NULL DEFAULT '',
  subject         text        NOT NULL DEFAULT '',
  body            text        NOT NULL DEFAULT '',
  notified_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.incoming_replies IS
  'Réponses e-mail des débiteurs routées vers le créancier (B2B2C) via n8n.';

CREATE INDEX IF NOT EXISTS incoming_replies_user_id_idx
  ON public.incoming_replies (user_id);

CREATE INDEX IF NOT EXISTS incoming_replies_tableau_id_idx
  ON public.incoming_replies (tableau_id);

CREATE INDEX IF NOT EXISTS incoming_replies_delivery_id_idx
  ON public.incoming_replies (delivery_id);

CREATE INDEX IF NOT EXISTS incoming_replies_created_at_idx
  ON public.incoming_replies (created_at DESC);

ALTER TABLE public.incoming_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incoming_replies_service_role_all ON public.incoming_replies;
CREATE POLICY incoming_replies_service_role_all
  ON public.incoming_replies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS incoming_replies_select_own ON public.incoming_replies;
CREATE POLICY incoming_replies_select_own
  ON public.incoming_replies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.incoming_replies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incoming_replies TO service_role;
