CREATE OR REPLACE FUNCTION public.bulk_update_opportunity_scores(
  p_ids uuid[],
  p_score_total numeric[],
  p_score_covered numeric[],
  p_outlier_total boolean[],
  p_outlier_covered boolean[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  WITH vals AS (
    SELECT 
      unnest(p_ids) AS id,
      unnest(p_score_total) AS ost,
      unnest(p_score_covered) AS osc,
      unnest(p_outlier_total) AS iot,
      unnest(p_outlier_covered) AS ioc
  )
  UPDATE public.properties p
  SET 
    opportunity_score_total = v.ost,
    opportunity_score_covered = v.osc,
    is_outlier_total = v.iot,
    is_outlier_covered = v.ioc
  FROM vals v
  WHERE p.id = v.id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;