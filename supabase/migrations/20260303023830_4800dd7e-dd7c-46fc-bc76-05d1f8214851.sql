
-- 1. Add analytics columns to monthly_neighborhood_stats
ALTER TABLE public.monthly_neighborhood_stats
  ADD COLUMN IF NOT EXISTS percentile_25_m2_total numeric,
  ADD COLUMN IF NOT EXISTS percentile_75_m2_total numeric,
  ADD COLUMN IF NOT EXISTS stddev_m2_total numeric,
  ADD COLUMN IF NOT EXISTS percentile_25_m2_covered numeric,
  ADD COLUMN IF NOT EXISTS percentile_75_m2_covered numeric,
  ADD COLUMN IF NOT EXISTS stddev_m2_covered numeric,
  ADD COLUMN IF NOT EXISTS new_listings_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS removed_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS median_surface_total numeric,
  ADD COLUMN IF NOT EXISTS median_surface_covered numeric,
  ADD COLUMN IF NOT EXISTS median_expenses numeric,
  ADD COLUMN IF NOT EXISTS avg_days_on_market numeric;

-- 2. Add removed_at to properties for soft delete tracking
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS removed_at timestamp with time zone;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_properties_removed_at ON public.properties (removed_at) WHERE removed_at IS NOT NULL;
