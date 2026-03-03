-- Add alt_urls column to store alternate portal links for the same property
ALTER TABLE public.properties
ADD COLUMN alt_urls text[] DEFAULT '{}';

-- Add index on address for faster duplicate lookups during ingestion
CREATE INDEX IF NOT EXISTS idx_properties_address_lower ON public.properties (lower(address))
WHERE address IS NOT NULL;