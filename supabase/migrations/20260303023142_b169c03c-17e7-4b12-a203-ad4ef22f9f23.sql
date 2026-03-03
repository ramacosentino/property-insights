-- Monthly neighborhood statistics snapshots
CREATE TABLE public.monthly_neighborhood_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month text NOT NULL,  -- '2026-02'
  neighborhood text NOT NULL,
  city text,
  property_type text,  -- null = all types combined
  property_count integer NOT NULL DEFAULT 0,
  median_price_m2_total numeric,
  avg_price_m2_total numeric,
  median_price_m2_covered numeric,
  avg_price_m2_covered numeric,
  median_price_total numeric,
  avg_price_total numeric,
  min_price_m2_total numeric,
  max_price_m2_total numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year_month, neighborhood, property_type)
);

ALTER TABLE public.monthly_neighborhood_stats ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read stats
CREATE POLICY "Authenticated users can read monthly stats"
ON public.monthly_neighborhood_stats
FOR SELECT
USING (true);

-- Only service role can write
CREATE POLICY "Service role can insert monthly stats"
ON public.monthly_neighborhood_stats
FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can update monthly stats"
ON public.monthly_neighborhood_stats
FOR UPDATE
USING (auth.role() = 'service_role'::text);

-- Add status column to properties for tracking availability
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add last_checked_at for URL validation tracking
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

CREATE INDEX idx_properties_status ON public.properties (status);
CREATE INDEX idx_monthly_stats_yearmonth ON public.monthly_neighborhood_stats (year_month);