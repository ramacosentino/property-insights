
-- Add new columns
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS toilettes integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS age_years integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS disposition text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS orientation text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS luminosity text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_per_m2_total numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_per_m2_covered numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS surface_total numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS surface_covered numeric;

-- Migrate existing data from old columns to new ones
UPDATE public.properties SET surface_total = total_area WHERE total_area IS NOT NULL AND surface_total IS NULL;
UPDATE public.properties SET surface_covered = covered_area WHERE covered_area IS NOT NULL AND surface_covered IS NULL;
UPDATE public.properties SET price_per_m2_total = price_per_sqm WHERE price_per_sqm IS NOT NULL AND price_per_m2_total IS NULL;
UPDATE public.properties SET city = province WHERE province IS NOT NULL AND city IS NULL;

-- Drop old columns that are being replaced
ALTER TABLE public.properties DROP COLUMN IF EXISTS total_area;
ALTER TABLE public.properties DROP COLUMN IF EXISTS covered_area;
ALTER TABLE public.properties DROP COLUMN IF EXISTS price_per_sqm;
ALTER TABLE public.properties DROP COLUMN IF EXISTS province;
ALTER TABLE public.properties DROP COLUMN IF EXISTS popularity;
