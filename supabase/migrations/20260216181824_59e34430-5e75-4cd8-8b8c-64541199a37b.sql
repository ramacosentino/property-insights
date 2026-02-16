-- New columns for potential value and adjusted opportunity indicators
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS valor_potencial_m2 numeric,
  ADD COLUMN IF NOT EXISTS valor_potencial_total numeric,
  ADD COLUMN IF NOT EXISTS comparables_count integer,
  ADD COLUMN IF NOT EXISTS oportunidad_ajustada numeric,
  ADD COLUMN IF NOT EXISTS oportunidad_neta numeric;