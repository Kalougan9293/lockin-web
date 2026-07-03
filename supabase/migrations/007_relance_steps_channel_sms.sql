-- =============================================================================
-- LockIn — Canal de relance (email / sms / both) + modèle SMS
-- =============================================================================

ALTER TABLE public.relance_steps
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';

ALTER TABLE public.relance_steps
  ADD COLUMN IF NOT EXISTS sms_template text NOT NULL DEFAULT '';

ALTER TABLE public.relance_steps
  DROP CONSTRAINT IF EXISTS relance_steps_channel_valid;

ALTER TABLE public.relance_steps
  ADD CONSTRAINT relance_steps_channel_valid
    CHECK (channel IN ('email', 'sms', 'both'));

COMMENT ON COLUMN public.relance_steps.channel IS
  'Canal d''envoi : email, sms ou both (e-mail + SMS).';

COMMENT ON COLUMN public.relance_steps.sms_template IS
  'Message SMS brut (max 160 caractères), variables [Nom], [Référence], etc.';
