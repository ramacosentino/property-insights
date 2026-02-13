
-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  popularity INTEGER DEFAULT 0,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  price_per_sqm NUMERIC,
  expenses NUMERIC,
  location TEXT,
  neighborhood TEXT,
  province TEXT,
  total_area NUMERIC,
  covered_area NUMERIC,
  rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking INTEGER,
  url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Public read (same as geocoded_addresses - it's public listing data)
CREATE POLICY "Anyone can read properties"
ON public.properties FOR SELECT
USING (true);

-- Only service role can insert/update (edge function uses service role)
CREATE POLICY "Service role can insert properties"
ON public.properties FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update properties"
ON public.properties FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete properties"
ON public.properties FOR DELETE
USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX idx_properties_external_id ON public.properties (external_id);
CREATE INDEX idx_properties_neighborhood ON public.properties (neighborhood);
CREATE INDEX idx_properties_price_per_sqm ON public.properties (price_per_sqm);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
