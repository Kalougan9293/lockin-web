-- =============================================================================
-- LockIn — Copie prestataire (CC) sur les relances e-mail par tableau
-- =============================================================================

ALTER TABLE public.tableaux
  ADD COLUMN IF NOT EXISTS cc_creditor boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tableaux.cc_creditor IS
  'Si vrai, l''e-mail du compte prestataire est mis en CC sur chaque relance e-mail du tableau.';
