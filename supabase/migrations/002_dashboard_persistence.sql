-- =============================================================================
-- LockIn — Persistance dashboard (tableaux, relances, lignes factures)
-- À exécuter dans le SQL Editor Supabase (une seule fois).
-- Prérequis : extension pgcrypto (gen_random_uuid) — activée par défaut sur Supabase.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE tableaux
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tableaux (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name                text        NOT NULL DEFAULT 'Tableau 1',
  left_columns        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  hidden_left_columns jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tableaux_left_columns_is_array
    CHECK (jsonb_typeof(left_columns) = 'array'),
  CONSTRAINT tableaux_hidden_left_columns_is_array
    CHECK (jsonb_typeof(hidden_left_columns) = 'array'),
  CONSTRAINT tableaux_name_not_blank
    CHECK (char_length(trim(name)) > 0)
);

COMMENT ON TABLE public.tableaux IS
  'Tableau de bord d''un prestataire (colonnes gauche + config masquée).';
COMMENT ON COLUMN public.tableaux.left_columns IS
  'ColumnDef[] visible : [{ "id": "uuid", "label": "Nom" }, ...]';
COMMENT ON COLUMN public.tableaux.hidden_left_columns IS
  'ColumnDef[] masquées via × — données lignes conservées côté values.';

CREATE INDEX IF NOT EXISTS tableaux_user_id_idx
  ON public.tableaux (user_id);

CREATE INDEX IF NOT EXISTS tableaux_user_id_created_at_idx
  ON public.tableaux (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. TABLE relance_steps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relance_steps (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tableau_id       uuid        NOT NULL REFERENCES public.tableaux (id) ON DELETE CASCADE,
  name             text        NOT NULL,
  days             integer     NOT NULL,
  message_template text        NOT NULL DEFAULT '',
  ordre            integer     NOT NULL DEFAULT 0,

  CONSTRAINT relance_steps_name_not_blank
    CHECK (char_length(trim(name)) > 0),
  CONSTRAINT relance_steps_ordre_non_negative
    CHECK (ordre >= 0),
  CONSTRAINT relance_steps_unique_ordre_per_tableau
    UNIQUE (tableau_id, ordre)
);

COMMENT ON TABLE public.relance_steps IS
  'Étapes de relance configurées (Configurer) — max 7 côté app.';
COMMENT ON COLUMN public.relance_steps.days IS
  'Jours relatifs : index 0 vs date client, suivants vs relance précédente.';
COMMENT ON COLUMN public.relance_steps.ordre IS
  'Position 0-based dans la séquence de relances du tableau.';

CREATE INDEX IF NOT EXISTS relance_steps_tableau_id_idx
  ON public.relance_steps (tableau_id);

CREATE INDEX IF NOT EXISTS relance_steps_tableau_id_ordre_idx
  ON public.relance_steps (tableau_id, ordre);

-- ---------------------------------------------------------------------------
-- 3. TABLE lignes_factures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lignes_factures (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tableau_id  uuid        NOT NULL REFERENCES public.tableaux (id) ON DELETE CASCADE,
  values      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lignes_factures_values_is_object
    CHECK (jsonb_typeof(values) = 'object')
);

COMMENT ON TABLE public.lignes_factures IS
  'Lignes client / facture d''un tableau.';
COMMENT ON COLUMN public.lignes_factures.values IS
  'Record<columnId, string> — ex. { "nom": "Marie Martin", "statut": "paye" }.';

CREATE INDEX IF NOT EXISTS lignes_factures_tableau_id_idx
  ON public.lignes_factures (tableau_id);

CREATE INDEX IF NOT EXISTS lignes_factures_tableau_id_created_at_idx
  ON public.lignes_factures (tableau_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — tableaux
-- ---------------------------------------------------------------------------
ALTER TABLE public.tableaux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tableaux_select_own ON public.tableaux;
CREATE POLICY tableaux_select_own
  ON public.tableaux
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS tableaux_insert_own ON public.tableaux;
CREATE POLICY tableaux_insert_own
  ON public.tableaux
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tableaux_update_own ON public.tableaux;
CREATE POLICY tableaux_update_own
  ON public.tableaux
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tableaux_delete_own ON public.tableaux;
CREATE POLICY tableaux_delete_own
  ON public.tableaux
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY — relance_steps (via tableaux.user_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.relance_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS relance_steps_select_own ON public.relance_steps;
CREATE POLICY relance_steps_select_own
  ON public.relance_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = relance_steps.tableau_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS relance_steps_insert_own ON public.relance_steps;
CREATE POLICY relance_steps_insert_own
  ON public.relance_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = relance_steps.tableau_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS relance_steps_update_own ON public.relance_steps;
CREATE POLICY relance_steps_update_own
  ON public.relance_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = relance_steps.tableau_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = relance_steps.tableau_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS relance_steps_delete_own ON public.relance_steps;
CREATE POLICY relance_steps_delete_own
  ON public.relance_steps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = relance_steps.tableau_id
        AND t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY — lignes_factures (via tableaux.user_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.lignes_factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lignes_factures_select_own ON public.lignes_factures;
CREATE POLICY lignes_factures_select_own
  ON public.lignes_factures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = lignes_factures.tableau_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lignes_factures_insert_own ON public.lignes_factures;
CREATE POLICY lignes_factures_insert_own
  ON public.lignes_factures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = lignes_factures.tableau_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lignes_factures_update_own ON public.lignes_factures;
CREATE POLICY lignes_factures_update_own
  ON public.lignes_factures
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = lignes_factures.tableau_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = lignes_factures.tableau_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS lignes_factures_delete_own ON public.lignes_factures;
CREATE POLICY lignes_factures_delete_own
  ON public.lignes_factures
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tableaux t
      WHERE t.id = lignes_factures.tableau_id
        AND t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Droits rôle authenticated (lecture/écriture via RLS)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tableaux TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relance_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lignes_factures TO authenticated;
