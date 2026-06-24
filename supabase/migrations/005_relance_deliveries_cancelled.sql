-- =============================================================================
-- LockIn — Statut cancelled + annulation auto des relances en file si Payé
-- =============================================================================

ALTER TABLE public.relance_deliveries
  DROP CONSTRAINT IF EXISTS relance_deliveries_status_valid;

ALTER TABLE public.relance_deliveries
  ADD CONSTRAINT relance_deliveries_status_valid
  CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'cancelled'));

COMMENT ON COLUMN public.relance_deliveries.status IS
  'pending → queued (cron) → sent | failed ; cancelled si facture payée';

-- ---------------------------------------------------------------------------
-- Trigger : facture payée → annuler les relances encore en file
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_queued_deliveries_when_ligne_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_statut text;
  old_statut text;
BEGIN
  new_statut := COALESCE(NEW.values->>'statut', '');
  old_statut := COALESCE(OLD.values->>'statut', '');

  IF new_statut = 'paye' AND old_statut IS DISTINCT FROM 'paye' THEN
    UPDATE public.relance_deliveries
    SET status = 'cancelled'
    WHERE ligne_id = NEW.id
      AND status IN ('queued', 'pending');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lignes_factures_cancel_deliveries_on_paid ON public.lignes_factures;

CREATE TRIGGER lignes_factures_cancel_deliveries_on_paid
  AFTER UPDATE OF values ON public.lignes_factures
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_queued_deliveries_when_ligne_paid();

-- ---------------------------------------------------------------------------
-- RLS : l'utilisateur peut passer ses relances en file → cancelled (si Payé)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS relance_deliveries_update_cancel_own ON public.relance_deliveries;

CREATE POLICY relance_deliveries_update_cancel_own
  ON public.relance_deliveries
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('queued', 'pending')
    AND EXISTS (
      SELECT 1
      FROM public.lignes_factures lf
      JOIN public.tableaux t ON t.id = lf.tableau_id
      WHERE lf.id = relance_deliveries.ligne_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'cancelled'
    AND EXISTS (
      SELECT 1
      FROM public.lignes_factures lf
      JOIN public.tableaux t ON t.id = lf.tableau_id
      WHERE lf.id = relance_deliveries.ligne_id
        AND t.user_id = auth.uid()
    )
  );

GRANT UPDATE ON public.relance_deliveries TO authenticated;
