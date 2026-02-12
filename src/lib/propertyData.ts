import Papa from "papaparse";
import csvFile from "@/data/properties.csv?raw";

export interface Property {
  id: string;
  popularity: number;
  externalId: string;
  price: number;
  currency: string;
  pricePerSqm: number;
  expenses: number | null;
  location: string;
  neighborhood: string;
  province: string;
  totalArea: number | null;
  coveredArea: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  url: string;
  scrapedAt: string;
  // Computed
  opportunityScore: number; // % below neighborhood median (positive = cheaper)
  isTopOpportunity: boolean;
  isNeighborhoodDeal: boolean;
}

export interface NeighborhoodStats {
  name: string;
  province: string;
  medianPricePerSqm: number;
  avgPricePerSqm: number;
  count: number;
  minPricePerSqm: number;
  maxPricePerSqm: number;
}

function parseNum(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function loadProperties(): { properties: Property[]; neighborhoodStats: Map<string, NeighborhoodStats> } {
  const parsed = Papa.parse(csvFile, {
    delimiter: ";",
    header: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data as string[][];
  // Skip header
  const dataRows = rows.slice(1);

  // First pass: parse all valid properties
  const rawProperties: Omit<Property, "opportunityScore" | "isTopOpportunity" | "isNeighborhoodDeal">[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length < 17) continue;

    const pricePerSqm = parseNum(row[4]);
    const price = parseNum(row[2]);
    
    // Skip if no valid price_per_sqm or it's an extreme outlier (> 15000 USD/m²)
    if (!pricePerSqm || pricePerSqm <= 0 || pricePerSqm > 15000) continue;
    if (!price || price <= 0) continue;

    rawProperties.push({
      id: `prop-${i}`,
      popularity: parseNum(row[0]) ?? 0,
      externalId: row[1],
      price,
      currency: row[3] || "USD",
      pricePerSqm,
      expenses: parseNum(row[5]),
      location: row[6] || "",
      neighborhood: row[7] || "Sin barrio",
      province: row[8] || "Sin provincia",
      totalArea: parseNum(row[9]),
      coveredArea: parseNum(row[10]),
      rooms: parseNum(row[11]),
      bedrooms: parseNum(row[12]),
      bathrooms: parseNum(row[13]),
      parking: parseNum(row[14]),
      url: row[15] || "",
      scrapedAt: row[16] || "",
    });
  }

  // Compute neighborhood stats
  const neighborhoodMap = new Map<string, number[]>();
  for (const p of rawProperties) {
    const key = p.neighborhood;
    if (!neighborhoodMap.has(key)) neighborhoodMap.set(key, []);
    neighborhoodMap.get(key)!.push(p.pricePerSqm);
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

  // Sort by pricePerSqm to find global top opportunities
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
      isNeighborhoodDeal: opportunityScore > 40, // 40%+ below neighborhood median
    };
  });

  return { properties, neighborhoodStats };
}

// Size ranges
export function getSizeRange(area: number | null): string {
  if (!area) return "Sin dato";
  if (area < 100) return "< 100 m²";
  if (area < 200) return "100-200 m²";
  if (area < 400) return "200-400 m²";
  if (area < 700) return "400-700 m²";
  return "700+ m²";
}

// Price ranges
export function getPriceRange(price: number): string {
  if (price < 100000) return "< 100K";
  if (price < 200000) return "100K-200K";
  if (price < 400000) return "200K-400K";
  if (price < 700000) return "400K-700K";
  return "700K+";
}

// Rooms label
export function getRoomsLabel(rooms: number | null): string {
  if (!rooms) return "Sin dato";
  if (rooms === 1) return "1 amb";
  if (rooms === 2) return "2 amb";
  if (rooms === 3) return "3 amb";
  if (rooms === 4) return "4 amb";
  return "5+ amb";
}
