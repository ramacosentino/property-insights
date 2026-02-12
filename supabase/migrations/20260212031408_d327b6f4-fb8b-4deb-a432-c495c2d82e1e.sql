
-- Add normalized geographic columns to geocoded_addresses
ALTER TABLE public.geocoded_addresses
  ADD COLUMN IF NOT EXISTS norm_neighborhood text,
  ADD COLUMN IF NOT EXISTS norm_locality text,
  ADD COLUMN IF NOT EXISTS norm_province text,
  ADD COLUMN IF NOT EXISTS raw_address_details jsonb;
