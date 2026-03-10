import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, NeighborhoodStats } from "@/lib/propertyData";
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
  highlights: string[] | null;
  lowlights: string[] | null;
  estado_general: string | null;
  valor_potencial_m2: number | null;
  valor_potencial_total: number | null;
  comparables_count: number | null;
  oportunidad_ajustada: number | null;
  oportunidad_neta: number | null;
  // Pre-computed scores
  opportunity_score_total: number | null;
  opportunity_score_covered: number | null;
  is_outlier_total: boolean | null;
  is_outlier_covered: boolean | null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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

/** Maps DB rows to Property objects using pre-computed scores */
function mapRowsWithScores(rows: DBPropertyRow[], surfaceType: SurfaceType): {
  properties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
} {
  const mapped = rows
    .filter((r) => r.price && r.price > 0)
    .map((r) => {
      const isOutlier = surfaceType === "covered"
        ? (r.is_outlier_covered ?? false)
        : (r.is_outlier_total ?? false);

      const opportunityScore = surfaceType === "covered"
        ? (r.opportunity_score_covered ?? 0)
        : (r.opportunity_score_total ?? 0);

      // Build consistent location from normalized fields
      const normHood = r.norm_neighborhood || r.neighborhood || "Sin barrio";
      const normCity = r.norm_locality || r.norm_province || r.city || "Sin ciudad";
      // For the display location: prefer normalized neighborhood + city
      const displayLocation = normHood !== "Sin barrio"
        ? `${normHood}, ${normCity}`
        : r.location || normCity;

      return {
        id: r.id,
        externalId: r.external_id,
        propertyType: r.property_type,
        title: r.title,
        url: r.url || "",
        price: r.price!,
        currency: r.currency || "USD",
        location: displayLocation,
        neighborhood: normHood,
        city: normCity,
        normNeighborhood: r.norm_neighborhood,
        normLocality: r.norm_locality,
        normProvince: r.norm_province,
        scrapedAt: r.scraped_at || "",
        createdAt: r.created_at,
        address: r.address,
        street: r.street,
        expenses: r.expenses,
        description: null as string | null,
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
        informe_breve: null as string | null,
        highlights: r.highlights,
        lowlights: r.lowlights,
        estado_general: r.estado_general,
        valor_potencial_m2: r.valor_potencial_m2,
        valor_potencial_total: r.valor_potencial_total,
        comparables_count: r.comparables_count,
        oportunidad_ajustada: r.oportunidad_ajustada,
        oportunidad_neta: r.oportunidad_neta,
        opportunityScore: isOutlier ? 0 : opportunityScore,
        isTopOpportunity: false, // computed below
        isNeighborhoodDeal: !isOutlier && opportunityScore > 40,
        _isOutlier: isOutlier,
      };
    });

  // Compute neighborhood stats (lightweight — just medians from pre-filtered data)
  const neighborhoodMap = new Map<string, number[]>();
  for (const p of mapped) {
    const m2 = getM2Value(p, surfaceType);
    if (!m2 || m2 <= 0 || p._isOutlier) continue;
    if (!neighborhoodMap.has(p.neighborhood)) neighborhoodMap.set(p.neighborhood, []);
    neighborhoodMap.get(p.neighborhood)!.push(m2);
  }

  const neighborhoodStats = new Map<string, NeighborhoodStats>();
  for (const [name, values] of neighborhoodMap) {
    const sorted = [...values].sort((a, b) => a - b);
    const sample = mapped.find((p) => p.neighborhood === name);
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

  // Top 10% by price (excluding outliers)
  const withPrice = mapped.filter((p) => {
    const m2 = getM2Value(p, surfaceType);
    return m2 && m2 > 0 && !p._isOutlier;
  });
  const sortedByPrice = [...withPrice].sort(
    (a, b) => (getM2Value(a, surfaceType) ?? 0) - (getM2Value(b, surfaceType) ?? 0)
  );
  const top10Percent = Math.ceil(sortedByPrice.length * 0.1);
  const topIds = new Set(sortedByPrice.slice(0, top10Percent).map((p) => p.id));

  // Finalize properties (strip internal _isOutlier)
  const properties: Property[] = mapped.map((p) => {
    const { _isOutlier, ...rest } = p;
    return {
      ...rest,
      isTopOpportunity: !_isOutlier && topIds.has(p.id),
    };
  });

  return { properties, neighborhoodStats };
}

// Only select columns actually used by the frontend
const PROPERTY_SELECT = [
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
  "updated_at", "status",
].join(",");

// ─── Delta sync state (module-level singleton) ───────────────────
let cachedRows: DBPropertyRow[] | null = null;
let lastSyncTimestamp: string | null = null;

async function fetchPaginated(
  filter?: { updatedAfter?: string }
): Promise<DBPropertyRow[]> {
  const allRows: DBPropertyRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("status", "active")
      .range(from, from + pageSize - 1);

    if (filter?.updatedAfter) {
      query = query.gt("updated_at", filter.updatedAfter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching properties:", error);
      break;
    }
    if (data) allRows.push(...(data as unknown as DBPropertyRow[]));
    hasMore = (data?.length || 0) === pageSize;
    from += pageSize;
  }

  return allRows;
}

/**
 * Fetches all properties on first call, then only changed rows on subsequent calls.
 * Merges delta into cached data and removes properties no longer active.
 */
async function fetchWithDeltaSync(): Promise<DBPropertyRow[]> {
  if (!cachedRows || !lastSyncTimestamp) {
    // Full initial load
    console.log("[properties] Full initial load...");
    const rows = await fetchPaginated();
    cachedRows = rows;
    lastSyncTimestamp = rows.reduce(
      (max, r) => ((r as any).updated_at > max ? (r as any).updated_at : max),
      ""
    );
    console.log(`[properties] Loaded ${rows.length} properties`);
    return cachedRows;
  }

  // Delta sync — only fetch rows updated since last sync
  console.log(`[properties] Delta sync since ${lastSyncTimestamp}...`);
  const delta = await fetchPaginated({ updatedAfter: lastSyncTimestamp });

  if (delta.length === 0) {
    console.log("[properties] No changes since last sync");
    return cachedRows;
  }

  console.log(`[properties] ${delta.length} changed properties`);

  // Build a map for fast merge
  const rowMap = new Map(cachedRows.map((r) => [r.id, r]));

  // Also check for removed properties (status changed to 'removed')
  // by fetching recently updated non-active rows
  const removedRows = await fetchRemovedSince(lastSyncTimestamp);
  const removedIds = new Set(removedRows.map((r) => r.id));

  // Apply delta
  for (const row of delta) {
    rowMap.set(row.id, row);
  }

  // Remove properties that are no longer active
  for (const id of removedIds) {
    rowMap.delete(id);
  }

  cachedRows = Array.from(rowMap.values());

  // Update timestamp
  const allTimestamps = delta.map((r) => (r as any).updated_at as string);
  if (removedRows.length > 0) {
    allTimestamps.push(...removedRows.map((r) => (r as any).updated_at as string));
  }
  const maxDelta = allTimestamps.reduce((max, t) => (t > max ? t : max), lastSyncTimestamp);
  lastSyncTimestamp = maxDelta;

  return cachedRows;
}

/** Fetch IDs of properties that were removed/deactivated since last sync */
async function fetchRemovedSince(since: string): Promise<{ id: string; updated_at: string }[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, updated_at")
    .neq("status", "active")
    .gt("updated_at", since)
    .limit(1000);

  if (error) {
    console.error("Error fetching removed properties:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

/** Reset cache — useful after manual data changes */
export function resetPropertiesCache() {
  cachedRows = null;
  lastSyncTimestamp = null;
}

export function useProperties() {
  const { surfaceType } = useSurfacePreference();
  const queryClient = useQueryClient();

  const rawQuery = useQuery({
    queryKey: ["properties-raw"],
    queryFn: fetchWithDeltaSync,
    staleTime: 5 * 60 * 1000,
    // On window refocus, only do delta sync (not full refetch)
    refetchOnWindowFocus: true,
  });

  const computed = useMemo(() => {
    if (!rawQuery.data) return undefined;
    return mapRowsWithScores(rawQuery.data, surfaceType);
  }, [rawQuery.data, surfaceType]);

  return {
    data: computed,
    isLoading: rawQuery.isLoading,
    error: rawQuery.error,
    isError: rawQuery.isError,
    refetch: rawQuery.refetch,
    /** Force a full reload (clears cache) */
    hardRefetch: () => {
      resetPropertiesCache();
      queryClient.invalidateQueries({ queryKey: ["properties-raw"] });
    },
  };
}
