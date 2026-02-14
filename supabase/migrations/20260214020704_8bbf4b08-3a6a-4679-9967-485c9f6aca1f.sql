ALTER TABLE public.geocoded_addresses ALTER COLUMN source SET DEFAULT 'pending';

-- Fix existing records that have source='nominatim' but were never actually geocoded
UPDATE public.geocoded_addresses SET source = 'pending' WHERE lat IS NULL AND source = 'nominatim';