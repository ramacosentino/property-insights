import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, NeighborhoodStats } from "@/lib/propertyData";

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
  score_multiplicador: number | null;
  informe_breve: string | null;
  highlights: string[] | null;
  lowlights: string[] | null;
  estado_general: string | null;
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

function computeStats(rows: DBPropertyRow[]): {
  properties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
} {
  const valid = rows.filter((r) => r.price && r.price > 0);

  const rawProperties = valid.map((r) => ({
    id: r.id,
    externalId: r.external_id,
    propertyType: r.property_type,
    title: r.title,
    url: r.url || "",
    price: r.price!,
    currency: r.currency || "USD",
    location: r.location || "",
    neighborhood: r.neighborhood || "Sin barrio",
    city: r.city || "Sin ciudad",
    scrapedAt: r.scraped_at || "",
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
  }));

  // --- IQR outlier detection per neighborhood + propertyType ---
  const groupKey = (p: { neighborhood: string; propertyType: string | null }) =>
    `${p.neighborhood}|||${p.propertyType || ""}`;

  const groupValues = new Map<string, number[]>();
  for (const p of rawProperties) {
    if (!p.pricePerM2Total || p.pricePerM2Total <= 0) continue;
    const key = groupKey(p);
    if (!groupValues.has(key)) groupValues.set(key, []);
    groupValues.get(key)!.push(p.pricePerM2Total);
  }

  const groupBounds = new Map<string, { lower: number; upper: number }>();
  for (const [key, values] of groupValues) {
    groupBounds.set(key, computeIQRBounds(values, 4));
  }

  const isOutlier = (p: typeof rawProperties[0]): boolean => {
    if (!p.pricePerM2Total || p.pricePerM2Total <= 0) return false;
    const bounds = groupBounds.get(groupKey(p));
    if (!bounds) return false;
    return p.pricePerM2Total < bounds.lower || p.pricePerM2Total > bounds.upper;
  };

  const outlierIds = new Set(rawProperties.filter(isOutlier).map((p) => p.id));

  // --- Neighborhood stats (excluding outliers) ---
  const neighborhoodMap = new Map<string, number[]>();
  for (const p of rawProperties) {
    if (!p.pricePerM2Total || p.pricePerM2Total <= 0) continue;
    if (outlierIds.has(p.id)) continue;
    if (!neighborhoodMap.has(p.neighborhood)) neighborhoodMap.set(p.neighborhood, []);
    neighborhoodMap.get(p.neighborhood)!.push(p.pricePerM2Total);
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

  // --- Top 10% by price (excluding outliers) ---
  const withPrice = rawProperties.filter((p) => p.pricePerM2Total && p.pricePerM2Total > 0 && !outlierIds.has(p.id));
  const sortedByPrice = [...withPrice].sort((a, b) => (a.pricePerM2Total ?? 0) - (b.pricePerM2Total ?? 0));
  const top10Percent = Math.ceil(sortedByPrice.length * 0.1);
  const topIds = new Set(sortedByPrice.slice(0, top10Percent).map((p) => p.id));

  const properties: Property[] = rawProperties.map((p) => {
    const hasPriceData = p.pricePerM2Total != null && p.pricePerM2Total > 0;
    const isOlr = outlierIds.has(p.id);
    const canScore = hasPriceData && !isOlr;

    let opportunityScore = 0;
    if (canScore) {
      const key = groupKey(p);
      const typeMedian = groupMedians.get(key);
      const neighborhoodMedian = typeMedian ?? neighborhoodStats.get(p.neighborhood)?.medianPricePerSqm ?? 0;
      if (neighborhoodMedian > 0) {
        opportunityScore = ((neighborhoodMedian - p.pricePerM2Total!) / neighborhoodMedian) * 100;
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

async function fetchAllProperties(): Promise<DBPropertyRow[]> {
  const allRows: DBPropertyRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .range(from, from + pageSize - 1);

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

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const rows = await fetchAllProperties();
      return computeStats(rows);
    },
    staleTime: 5 * 60 * 1000,
  });
}
