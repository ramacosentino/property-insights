import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, NeighborhoodStats } from "@/lib/propertyData";

interface DBPropertyRow {
  id: string;
  external_id: string;
  popularity: number | null;
  price: number | null;
  currency: string | null;
  price_per_sqm: number | null;
  expenses: number | null;
  location: string | null;
  neighborhood: string | null;
  province: string | null;
  total_area: number | null;
  covered_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  url: string | null;
  scraped_at: string | null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeStats(rows: DBPropertyRow[]): {
  properties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
} {
  // Filter valid rows
  const valid = rows.filter(
    (r) => r.price && r.price > 0 && r.price_per_sqm && r.price_per_sqm > 0 && r.price_per_sqm <= 15000
  );

  const rawProperties = valid.map((r) => ({
    id: r.id,
    popularity: r.popularity ?? 0,
    externalId: r.external_id,
    price: r.price!,
    currency: r.currency || "USD",
    pricePerSqm: r.price_per_sqm!,
    expenses: r.expenses,
    location: r.location || "",
    neighborhood: r.neighborhood || "Sin barrio",
    province: r.province || "Sin provincia",
    totalArea: r.total_area,
    coveredArea: r.covered_area,
    rooms: r.rooms,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    parking: r.parking,
    url: r.url || "",
    scrapedAt: r.scraped_at || "",
  }));

  // Neighborhood stats
  const neighborhoodMap = new Map<string, number[]>();
  for (const p of rawProperties) {
    if (!neighborhoodMap.has(p.neighborhood)) neighborhoodMap.set(p.neighborhood, []);
    neighborhoodMap.get(p.neighborhood)!.push(p.pricePerSqm);
  }

  const neighborhoodStats = new Map<string, NeighborhoodStats>();
  for (const [name, values] of neighborhoodMap) {
    const sorted = [...values].sort((a, b) => a - b);
    const sample = rawProperties.find((p) => p.neighborhood === name);
    neighborhoodStats.set(name, {
      name,
      province: sample?.province || "",
      medianPricePerSqm: median(values),
      avgPricePerSqm: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
      minPricePerSqm: sorted[0],
      maxPricePerSqm: sorted[sorted.length - 1],
    });
  }

  // Top 10% by price
  const sortedByPrice = [...rawProperties].sort((a, b) => a.pricePerSqm - b.pricePerSqm);
  const top10Percent = Math.ceil(sortedByPrice.length * 0.1);
  const topIds = new Set(sortedByPrice.slice(0, top10Percent).map((p) => p.id));

  // Compute opportunity scores
  const properties: Property[] = rawProperties.map((p) => {
    const stats = neighborhoodStats.get(p.neighborhood);
    const neighborhoodMedian = stats?.medianPricePerSqm || p.pricePerSqm;
    const opportunityScore = ((neighborhoodMedian - p.pricePerSqm) / neighborhoodMedian) * 100;

    return {
      ...p,
      opportunityScore,
      isTopOpportunity: topIds.has(p.id),
      isNeighborhoodDeal: opportunityScore > 40,
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

    if (data) allRows.push(...(data as DBPropertyRow[]));
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
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
