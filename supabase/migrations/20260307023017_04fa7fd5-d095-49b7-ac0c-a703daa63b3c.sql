ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS opportunity_score_total numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS opportunity_score_covered numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_outlier_total boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_outlier_covered boolean DEFAULT false;