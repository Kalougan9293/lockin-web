-- =============================================================================
-- LockIn — Compteur imports IA (PDF/CSV) par mois
-- =============================================================================

ALTER TABLE public.clients_lockin
  ADD COLUMN IF NOT EXISTS imports_ia_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.clients_lockin
  ADD COLUMN IF NOT EXISTS imports_ia_month text;

COMMENT ON COLUMN public.clients_lockin.imports_ia_count IS
  'Nombre d''appels IA (1 par PDF ou CSV) sur le mois imports_ia_month.';

COMMENT ON COLUMN public.clients_lockin.imports_ia_month IS
  'Mois courant du compteur, format AAAA-MM (Europe/Paris).';

ALTER TABLE public.clients_lockin
  DROP CONSTRAINT IF EXISTS clients_lockin_imports_ia_count_nonneg;

ALTER TABLE public.clients_lockin
  ADD CONSTRAINT clients_lockin_imports_ia_count_nonneg
  CHECK (imports_ia_count >= 0);
