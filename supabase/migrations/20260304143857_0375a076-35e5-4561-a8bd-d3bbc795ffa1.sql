
-- Composite indexes for frequently filtered queries on properties
CREATE INDEX IF NOT EXISTS idx_properties_norm_neighborhood_type ON public.properties (norm_neighborhood, property_type);
CREATE INDEX IF NOT EXISTS idx_properties_norm_locality ON public.properties (norm_locality);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_price_per_m2_total ON public.properties (price_per_m2_total);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_type_price ON public.properties (property_type, price);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_price_m2 ON public.properties (norm_neighborhood, property_type, price_per_m2_total);

-- Index for geocoded_addresses bounding box queries
CREATE INDEX IF NOT EXISTS idx_geocoded_lat_lng ON public.geocoded_addresses (lat, lng);

-- RPC: compute median price_per_m2_total per neighborhood+type group
CREATE OR REPLACE FUNCTION public.neighborhood_medians(
  p_neighborhoods text[] DEFAULT NULL,
  p_property_types text[] DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_surface_min numeric DEFAULT NULL,
  p_rooms_min int DEFAULT NULL,
  p_rooms_max int DEFAULT NULL,
  p_parking_min int DEFAULT NULL,
  p_cities text[] DEFAULT NULL,
  p_excluded_neighborhoods text[] DEFAULT NULL
)
RETURNS TABLE(
  group_neighborhood text,
  group_property_type text,
  median_price_m2 numeric,
  property_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH filtered AS (
    SELECT
      COALESCE(norm_neighborhood, neighborhood) AS grp_neighborhood,
      COALESCE(property_type, '') AS grp_type,
      price_per_m2_total
    FROM public.properties
    WHERE price > 0
      AND price_per_m2_total > 0
      AND url IS NOT NULL
      AND (p_property_types IS NULL OR property_type = ANY(p_property_types))
      AND (p_neighborhoods IS NULL OR norm_neighborhood = ANY(p_neighborhoods))
      AND (p_excluded_neighborhoods IS NULL OR norm_neighborhood IS NULL OR NOT (norm_neighborhood = ANY(p_excluded_neighborhoods)))
      AND (p_cities IS NULL OR norm_locality = ANY(p_cities))
      AND (p_price_min IS NULL OR price >= p_price_min)
      AND (p_price_max IS NULL OR price <= p_price_max)
      AND (p_surface_min IS NULL OR surface_total >= p_surface_min)
      AND (p_rooms_min IS NULL OR rooms >= p_rooms_min)
      AND (p_rooms_max IS NULL OR rooms <= p_rooms_max)
      AND (p_parking_min IS NULL OR p_parking_min = 0 OR parking >= p_parking_min)
  ),
  ranked AS (
    SELECT
      grp_neighborhood,
      grp_type,
      price_per_m2_total,
      ROW_NUMBER() OVER (PARTITION BY grp_neighborhood, grp_type ORDER BY price_per_m2_total) AS rn,
      COUNT(*) OVER (PARTITION BY grp_neighborhood, grp_type) AS cnt
    FROM filtered
  )
  SELECT
    grp_neighborhood AS group_neighborhood,
    grp_type AS group_property_type,
    ROUND(AVG(price_per_m2_total)::numeric, 2) AS median_price_m2,
    MAX(cnt) AS property_count
  FROM ranked
  WHERE rn IN (FLOOR((cnt + 1) / 2.0)::int, CEIL((cnt + 1) / 2.0)::int)
  GROUP BY grp_neighborhood, grp_type;
$$;
