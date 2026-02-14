CREATE TRIGGER trg_sync_property_to_geocoded
AFTER INSERT OR UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_to_geocoded();