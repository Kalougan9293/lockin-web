-- =============================================================================
-- LockIn — Correction RLS : retirer les policies « public », restreindre à
-- authenticated (+ service_role pour l'admin / cron).
-- À exécuter dans le SQL Editor Supabase (une seule fois).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Utilitaire : supprime toutes les policies RLS d'une table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.drop_all_policies_on_table(target_table regclass)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = target_table::text
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', pol.policyname, target_table);
  END LOOP;
END;
$$;

-- =============================================================================
-- A. clients_lockin
--    Clé propriétaire : id_client (= auth.users.id)
-- =============================================================================
ALTER TABLE public.clients_lockin ENABLE ROW LEVEL SECURITY;

SELECT public.drop_all_policies_on_table('public.clients_lockin'::regclass);

-- Lecture : uniquement sa propre fiche
CREATE POLICY clients_lockin_select_own
  ON public.clients_lockin
  FOR SELECT
  TO authenticated
  USING (id_client = auth.uid());

-- Création à l'inscription (id_client doit être l'utilisateur connecté)
CREATE POLICY clients_lockin_insert_own
  ON public.clients_lockin
  FOR INSERT
  TO authenticated
  WITH CHECK (id_client = auth.uid());

-- Mise à jour profil
CREATE POLICY clients_lockin_update_own
  ON public.clients_lockin
  FOR UPDATE
  TO authenticated
  USING (id_client = auth.uid())
  WITH CHECK (id_client = auth.uid());

-- API admin / signup (service_role uniquement)
CREATE POLICY clients_lockin_service_role_all
  ON public.clients_lockin
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.clients_lockin FROM PUBLIC;
REVOKE ALL ON public.clients_lockin FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.clients_lockin TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients_lockin TO service_role;

-- =============================================================================
-- B. tables_configurations
--    Clé propriétaire attendue : user_id (= auth.users.id)
--    Note LockIn : le code applicatif utilise la table « tableaux » (section C).
--    Exécutez la section qui correspond à votre schéma Supabase.
-- =============================================================================
DO $$
BEGIN
  IF to_regclass('public.tables_configurations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tables_configurations ENABLE ROW LEVEL SECURITY';
    PERFORM public.drop_all_policies_on_table('public.tables_configurations'::regclass);

    EXECUTE $policy$
      CREATE POLICY tables_configurations_select_own
        ON public.tables_configurations
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY tables_configurations_insert_own
        ON public.tables_configurations
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY tables_configurations_update_own
        ON public.tables_configurations
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY tables_configurations_delete_own
        ON public.tables_configurations
        FOR DELETE
        TO authenticated
        USING (user_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY tables_configurations_service_role_all
        ON public.tables_configurations
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;

    REVOKE ALL ON public.tables_configurations FROM PUBLIC;
    REVOKE ALL ON public.tables_configurations FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables_configurations TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables_configurations TO service_role;
  END IF;
END;
$$;

-- =============================================================================
-- C. tableaux (dashboard LockIn — si vous n'avez pas tables_configurations)
--    Ré-applique des policies authenticated propres (écrase les policies public).
-- =============================================================================
ALTER TABLE public.tableaux ENABLE ROW LEVEL SECURITY;

SELECT public.drop_all_policies_on_table('public.tableaux'::regclass);

CREATE POLICY tableaux_select_own
  ON public.tableaux
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY tableaux_insert_own
  ON public.tableaux
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY tableaux_update_own
  ON public.tableaux
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY tableaux_delete_own
  ON public.tableaux
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY tableaux_service_role_all
  ON public.tableaux
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.tableaux FROM PUBLIC;
REVOKE ALL ON public.tableaux FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tableaux TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tableaux TO service_role;

-- ---------------------------------------------------------------------------
-- Nettoyage fonction utilitaire (optionnel)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.drop_all_policies_on_table(regclass);
