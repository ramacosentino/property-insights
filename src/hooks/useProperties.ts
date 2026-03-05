import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, NeighborhoodStats } from "@/lib/propertyData";
import { computeSegmentedFactorPremiums, getPropertyFactorAdjustment } from "@/lib/priceFactors";
import { useSurfacePreference, SurfaceType } from "@/contexts/SurfacePreferenceContext";
import { useMemo } from "react";

interface DBPropertyRow {
  id: string;
  external_id: string;
  property_type: string | null;
  title: string | null;
  url: string | null;
  price: number | null;
  currency: string | null;
  location: string | null;
  neighborhood: string | null;
  city: string | null;
  norm_neighborhood: string | null;
  norm_locality: string | null;
  norm_province: string | null;
  scraped_at: string | null;
  address: string | null;
  street: string | null;
  expenses: number | null;
  description: string | null;
  surface_total: number | null;
  surface_covered: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilettes: number | null;
  parking: number | null;
  age_years: number | null;
  disposition: string | null;
  orientation: string | null;
  luminosity: string | null;
  price_per_m2_total: number | null;
  price_per_m2_covered: number | null;
  created_at: string;
  score_multiplicador: number | null;
  informe_breve: string | null;
  highlights: string[] | null;
  lowlights: string[] | null;
  estado_general: string | null;
  valor_potencial_m2: number | null;
  valor_potencial_total: number | null;
  comparables_count: number | null;
  oportunidad_ajustada: number | null;
  oportunidad_neta: number | null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeIQRBounds(values: number[], multiplier = 4): { lower: number; upper: number } {
  if (values.length < 3) return { lower: -Infinity, upper: Infinity };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return { lower: q1 - multiplier * iqr, upper: q3 + multiplier * iqr };
}

/** Get the relevant USD/m² value for a property based on surface preference */
function getM2Value(
  p: { pricePerM2Total: number | null; pricePerM2Covered: number | null },
  surfaceType: SurfaceType
): number | null {
  if (surfaceType === "covered") {
    return p.pricePerM2Covered ?? p.pricePerM2Total;
  }
  return p.pricePerM2Total;
}

/** Maps DB rows to raw property objects (no scoring) */
function mapRows(rows: DBPropertyRow[]) {
  return rows
    .filter((r) => r.price && r.price > 0)
    .map((r) => ({
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
      description: r.description,
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
      informe_breve: r.informe_breve,
      highlights: r.highlights,
      lowlights: r.lowlights,
      estado_general: r.estado_general,
      valor_potencial_m2: r.valor_potencial_m2,
      valor_potencial_total: r.valor_potencial_total,
      comparables_count: r.comparables_count,
      oportunidad_ajustada: r.oportunidad_ajustada,
      oportunidad_neta: r.oportunidad_neta,
    }));
}

type RawProperty = ReturnType<typeof mapRows>[number];

function computeStats(rawProperties: RawProperty[], surfaceType: SurfaceType): {
  properties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
} {
  // --- IQR outlier detection per neighborhood + propertyType ---
  const groupKey = (p: { neighborhood: string; propertyType: string | null }) =>
    `${p.neighborhood}|||${p.propertyType || ""}`;

  const groupValues = new Map<string, number[]>();
  for (const p of rawProperties) {
    const m2 = getM2Value(p, surfaceType);
    if (!m2 || m2 <= 0) continue;
    const key = groupKey(p);
    if (!groupValues.has(key)) groupValues.set(key, []);
    groupValues.get(key)!.push(m2);
  }

  const groupBounds = new Map<string, { lower: number; upper: number }>();
  for (const [key, values] of groupValues) {
    groupBounds.set(key, computeIQRBounds(values, 4));
  }

  const isOutlier = (p: RawProperty): boolean => {
    const m2 = getM2Value(p, surfaceType);
    if (!m2 || m2 <= 0) return false;
    const bounds = groupBounds.get(groupKey(p));
    if (!bounds) return false;
    return m2 < bounds.lower || m2 > bounds.upper;
  };

  const outlierIds = new Set(rawProperties.filter(isOutlier).map((p) => p.id));

  // --- Neighborhood stats (excluding outliers) ---
  const neighborhoodMap = new Map<string, number[]>();
  for (const p of rawProperties) {
    const m2 = getM2Value(p, surfaceType);
    if (!m2 || m2 <= 0) continue;
    if (outlierIds.has(p.id)) continue;
    if (!neighborhoodMap.has(p.neighborhood)) neighborhoodMap.set(p.neighborhood, []);
    neighborhoodMap.get(p.neighborhood)!.push(m2);
  }

  const neighborhoodStats = new Map<string, NeighborhoodStats>();
  for (const [name, values] of neighborhoodMap) {
    const sorted = [...values].sort((a, b) => a - b);
    const sample = rawProperties.find((p) => p.neighborhood === name);
    neighborhoodStats.set(name, {
      name,
      city: sample?.city || "",
      medianPricePerSqm: median(values),
      avgPricePerSqm: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
      minPricePerSqm: sorted[0],
      maxPricePerSqm: sorted[sorted.length - 1],
    });
  }

  // --- Neighborhood + type median (excluding outliers) for opportunity score ---
  const groupMedians = new Map<string, number>();
  for (const [key, values] of groupValues) {
    const bounds = groupBounds.get(key)!;
    const filtered = values.filter((v) => v >= bounds.lower && v <= bounds.upper);
    if (filtered.length > 0) groupMedians.set(key, median(filtered));
  }

  // --- Factor premiums for adjusted opportunity score ---
  const nonOutlierProps = rawProperties.filter((p) => !outlierIds.has(p.id)) as unknown as Property[];
  const factorPremiums = computeSegmentedFactorPremiums(nonOutlierProps);

  // --- Top 10% by price (excluding outliers) ---
  const withPrice = rawProperties.filter((p) => {
    const m2 = getM2Value(p, surfaceType);
    return m2 && m2 > 0 && !outlierIds.has(p.id);
  });
  const sortedByPrice = [...withPrice].sort((a, b) => 
    (getM2Value(a, surfaceType) ?? 0) - (getM2Value(b, surfaceType) ?? 0)
  );
  const top10Percent = Math.ceil(sortedByPrice.length * 0.1);
  const topIds = new Set(sortedByPrice.slice(0, top10Percent).map((p) => p.id));

  const properties: Property[] = rawProperties.map((p) => {
    const m2 = getM2Value(p, surfaceType);
    const hasPriceData = m2 != null && m2 > 0;
    const isOlr = outlierIds.has(p.id);
    const canScore = hasPriceData && !isOlr;

    let opportunityScore = 0;
    if (canScore) {
      const key = groupKey(p);
      const typeMedian = groupMedians.get(key);
      const baseMedian = typeMedian ?? neighborhoodStats.get(p.neighborhood)?.medianPricePerSqm ?? 0;
      if (baseMedian > 0) {
        const factorAdj = getPropertyFactorAdjustment(p as unknown as Property, factorPremiums);
        const expectedPrice = baseMedian * (1 + factorAdj);
        opportunityScore = ((expectedPrice - m2!) / expectedPrice) * 100;
      }
    }

    return {
      ...p,
      opportunityScore,
      isTopOpportunity: canScore && topIds.has(p.id),
      isNeighborhoodDeal: canScore && opportunityScore > 40,
    };
  });

  return { properties, neighborhoodStats };
}

async function fetchAllProperties(): Promise<RawProperty[]> {
  const allRows: DBPropertyRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Error fetching properties:", error);
      break;
    }

    if (data) allRows.push(...(data as unknown as DBPropertyRow[]));
    hasMore = (data?.length || 0) === pageSize;
    from += pageSize;
  }

  return mapRows(allRows);
}

export function useProperties() {
  const { surfaceType } = useSurfacePreference();
  
  // Fetch raw rows once — surfaceType does NOT trigger refetch
  const rawQuery = useQuery({
    queryKey: ["properties-raw"],
    queryFn: fetchAllProperties,
    staleTime: 5 * 60 * 1000,
  });

  // Compute stats from cached rows when surfaceType changes (no refetch)
  const computed = useMemo(() => {
    if (!rawQuery.data) return undefined;
    return computeStats(rawQuery.data, surfaceType);
  }, [rawQuery.data, surfaceType]);

  return {
    data: computed,
    isLoading: rawQuery.isLoading,
    error: rawQuery.error,
    isError: rawQuery.isError,
    refetch: rawQuery.refetch,
  };
}
