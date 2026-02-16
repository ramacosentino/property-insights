
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS score_multiplicador numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS informe_breve text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lowlights text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estado_general text DEFAULT NULL;
