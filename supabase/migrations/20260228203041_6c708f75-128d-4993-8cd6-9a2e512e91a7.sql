
CREATE OR REPLACE FUNCTION public.compute_price_per_m2()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Compute price_per_m2_total if price and surface_total are available
  IF NEW.price IS NOT NULL AND NEW.price > 0 AND NEW.surface_total IS NOT NULL AND NEW.surface_total > 0 THEN
    NEW.price_per_m2_total := ROUND((NEW.price / NEW.surface_total)::numeric, 2);
  END IF;

  -- Compute price_per_m2_covered if price and surface_covered are available
  IF NEW.price IS NOT NULL AND NEW.price > 0 AND NEW.surface_covered IS NOT NULL AND NEW.surface_covered > 0 THEN
    NEW.price_per_m2_covered := ROUND((NEW.price / NEW.surface_covered)::numeric, 2);
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_compute_price_per_m2
  BEFORE INSERT OR UPDATE OF price, surface_total, surface_covered
  ON public.properties
  FOR EACH ROW
  WHEN (NEW.price_per_m2_total IS NULL OR NEW.price_per_m2_covered IS NULL)
  EXECUTE FUNCTION public.compute_price_per_m2();
