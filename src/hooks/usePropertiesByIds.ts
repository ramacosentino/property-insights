import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/lib/propertyData";
import { useSurfacePreference, SurfaceType } from "@/contexts/SurfacePreferenceContext";
import { useMemo } from "react";

const PROPERTY_BY_ID_SELECT = [
  "id", "external_id", "property_type", "title", "url", "price", "currency",
  "location", "neighborhood", "city", "norm_neighborhood", "norm_locality", "norm_province",
  "scraped_at", "address", "street", "expenses", "surface_total", "surface_covered",
  "rooms", "bedrooms", "bathrooms", "toilettes", "parking", "age_years",
  "disposition", "orientation", "luminosity",
  "price_per_m2_total", "price_per_m2_covered", "created_at",
  "score_multiplicador", "highlights", "lowlights", "estado_general",
  "valor_potencial_m2", "valor_potencial_total", "comparables_count",
  "oportunidad_ajustada", "oportunidad_neta",
  "opportunity_score_total", "opportunity_score_covered",
  "is_outlier_total", "is_outlier_covered",
].join(",");

function mapRow(r: any, surfaceType: SurfaceType): Property {
  const isOutlier = surfaceType === "covered"
    ? (r.is_outlier_covered ?? false)
    : (r.is_outlier_total ?? false);

  const opportunityScore = surfaceType === "covered"
    ? (r.opportunity_score_covered ?? 0)
    : (r.opportunity_score_total ?? 0);

  return {
    id: r.id,
    externalId: r.external_id,
    propertyType: r.property_type,
    title: r.title,
    url: r.url || "",
    price: r.price!,
    currency: r.currency || "USD",
    location: r.location || "",
    neighborhood: r.norm_neighborhood || r.neighborhood || "Sin barrio",
    city: r.norm_locality || r.norm_province || r.city || "Sin ciudad",
    normNeighborhood: r.norm_neighborhood,
    normLocality: r.norm_locality,
    normProvince: r.norm_province,
    scrapedAt: r.scraped_at || "",
    createdAt: r.created_at,
    address: r.address,
    street: r.street,
    expenses: r.expenses,
    description: null,
    surfaceTotal: r.surface_total,
    surfaceCovered: r.surface_covered,
    rooms: r.rooms,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    toilettes: r.toilettes,
    parking: r.parking,
    ageYears: r.age_years,
    disposition: r.disposition,
    orientation: r.orientation,
    luminosity: r.luminosity,
    pricePerM2Total: r.price_per_m2_total,
    pricePerM2Covered: r.price_per_m2_covered,
    score_multiplicador: r.score_multiplicador,
    informe_breve: null,
    highlights: r.highlights,
    lowlights: r.lowlights,
    estado_general: r.estado_general,
    valor_potencial_m2: r.valor_potencial_m2,
    valor_potencial_total: r.valor_potencial_total,
    comparables_count: r.comparables_count,
    oportunidad_ajustada: r.oportunidad_ajustada,
    oportunidad_neta: r.oportunidad_neta,
    opportunityScore: isOutlier ? 0 : opportunityScore,
    isTopOpportunity: false,
    isNeighborhoodDeal: !isOutlier && opportunityScore > 40,
  };
}

async function fetchPropertiesByIds(ids: string[]): Promise<any[]> {
  if (ids.length === 0) return [];

  // Supabase .in() has a limit, batch in groups of 100
  const allRows: any[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_BY_ID_SELECT)
      .in("id", batch);

    if (error) {
      console.error("Error fetching properties by ids:", error);
      continue;
    }
    if (data) allRows.push(...data);
  }
  return allRows;
}

/**
 * Load only specific properties by their IDs.
 * Much lighter than useProperties when you only need a small subset.
 */
export function usePropertiesByIds(ids: Set<string> | string[]) {
  const { surfaceType } = useSurfacePreference();
  const idArray = useMemo(() => 
    Array.from(ids instanceof Set ? ids : ids).sort(),
    [ids]
  );
  const idKey = idArray.join(",");

  const query = useQuery({
    queryKey: ["properties-by-ids", idKey],
    queryFn: () => fetchPropertiesByIds(idArray),
    staleTime: 5 * 60 * 1000,
    enabled: idArray.length > 0,
  });

  const properties = useMemo(() => {
    if (!query.data) return [];
    return query.data
      .filter((r: any) => r.price && r.price > 0)
      .map((r: any) => mapRow(r, surfaceType));
  }, [query.data, surfaceType]);

  return {
    properties,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
