
-- Enable pg_net for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: auto-seed geocoded_addresses when a property is inserted/updated
CREATE OR REPLACE FUNCTION public.sync_property_to_geocoded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act if address is not null
  IF NEW.address IS NOT NULL AND NEW.address <> '' THEN
    INSERT INTO public.geocoded_addresses (address, source)
    VALUES (NEW.address, 'pending')
    ON CONFLICT (address) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on properties table
CREATE TRIGGER trg_sync_geocoded
AFTER INSERT OR UPDATE OF address ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_to_geocoded();
