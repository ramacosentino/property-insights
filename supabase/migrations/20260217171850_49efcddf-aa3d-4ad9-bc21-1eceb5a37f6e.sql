
-- Add normalized geocoding columns to properties
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS norm_neighborhood text,
  ADD COLUMN IF NOT EXISTS norm_locality text,
  ADD COLUMN IF NOT EXISTS norm_province text;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_properties_norm_neighborhood ON public.properties (norm_neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_norm_locality ON public.properties (norm_locality);
CREATE INDEX IF NOT EXISTS idx_properties_norm_province ON public.properties (norm_province);

-- Create a trigger function to auto-sync normalized data from geocoded_addresses 
-- whenever a property is inserted/updated
CREATE OR REPLACE FUNCTION public.sync_norm_from_geocoded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.address IS NOT NULL AND NEW.address <> '' THEN
    SELECT g.norm_neighborhood, g.norm_locality, g.norm_province
    INTO NEW.norm_neighborhood, NEW.norm_locality, NEW.norm_province
    FROM public.geocoded_addresses g
    WHERE g.address = NEW.address
      AND (g.norm_neighborhood IS NOT NULL OR g.norm_locality IS NOT NULL OR g.norm_province IS NOT NULL)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on property insert/update to pull norm data
CREATE TRIGGER sync_property_norm_data
BEFORE INSERT OR UPDATE OF address ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_norm_from_geocoded();

-- Also create a trigger on geocoded_addresses to push norm data back to properties
-- when geocoding completes
CREATE OR REPLACE FUNCTION public.push_norm_to_properties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.address IS NOT NULL AND (NEW.norm_neighborhood IS NOT NULL OR NEW.norm_locality IS NOT NULL OR NEW.norm_province IS NOT NULL) THEN
    UPDATE public.properties
    SET norm_neighborhood = NEW.norm_neighborhood,
        norm_locality = NEW.norm_locality,
        norm_province = NEW.norm_province
    WHERE address = NEW.address
      AND (norm_neighborhood IS DISTINCT FROM NEW.norm_neighborhood 
        OR norm_locality IS DISTINCT FROM NEW.norm_locality 
        OR norm_province IS DISTINCT FROM NEW.norm_province);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_geocoded_norm_to_properties
AFTER INSERT OR UPDATE OF norm_neighborhood, norm_locality, norm_province ON public.geocoded_addresses
FOR EACH ROW
EXECUTE FUNCTION public.push_norm_to_properties();
