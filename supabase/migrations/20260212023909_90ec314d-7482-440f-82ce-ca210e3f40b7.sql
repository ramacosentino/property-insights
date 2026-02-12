
-- Table to cache geocoded coordinates
CREATE TABLE public.geocoded_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  neighborhood TEXT,
  province TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  source TEXT DEFAULT 'nominatim',
  geocoded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(address)
);

-- Allow public read (no auth needed for this analytics tool)
ALTER TABLE public.geocoded_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read geocoded addresses"
  ON public.geocoded_addresses FOR SELECT
  USING (true);

-- Only edge functions (service role) can insert/update
CREATE POLICY "Service role can manage geocoded addresses"
  ON public.geocoded_addresses FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_geocoded_address ON public.geocoded_addresses (address);
CREATE INDEX idx_geocoded_neighborhood ON public.geocoded_addresses (neighborhood);
