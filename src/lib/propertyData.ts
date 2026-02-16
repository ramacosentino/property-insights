import Papa from "papaparse";
import csvFile from "@/data/properties.csv?raw";

export interface Property {
  id: string;
  externalId: string;
  propertyType: string | null;
  title: string | null;
  url: string;
  price: number;
  currency: string;
  location: string;
  neighborhood: string;
  city: string;
  scrapedAt: string;
  address: string | null;
  street: string | null;
  expenses: number | null;
  description: string | null;
  surfaceTotal: number | null;
  surfaceCovered: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilettes: number | null;
  parking: number | null;
  ageYears: number | null;
  disposition: string | null;
  orientation: string | null;
  luminosity: string | null;
  pricePerM2Total: number | null;
  pricePerM2Covered: number | null;
  // AI analysis
  score_multiplicador?: number | null;
  informe_breve?: string | null;
  highlights?: string[] | null;
  lowlights?: string[] | null;
  estado_general?: string | null;
  // Potential value & opportunity
  valor_potencial_m2?: number | null;
  valor_potencial_total?: number | null;
  comparables_count?: number | null;
  oportunidad_ajustada?: number | null;
  oportunidad_neta?: number | null;
  // Computed
  opportunityScore: number;
  isTopOpportunity: boolean;
  isNeighborhoodDeal: boolean;
}

export interface NeighborhoodStats {
  name: string;
  city: string;
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
  const dataRows = rows.slice(1);

  const rawProperties: Omit<Property, "opportunityScore" | "isTopOpportunity" | "isNeighborhoodDeal">[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length < 17) continue;

    const price = parseNum(row[4]);
    const pricePerM2Total = parseNum(row[21]);
    
    if (!price || price <= 0) continue;

    rawProperties.push({
      id: `prop-${i}`,
      externalId: row[0],
      propertyType: row[1] || null,
      title: row[2] || null,
      url: row[3] || "",
      price,
      currency: row[5] || "USD",
      location: row[6] || "",
      neighborhood: row[7] || "Sin barrio",
      city: row[8] || "Sin ciudad",
      scrapedAt: row[9] || "",
      address: row[10] || null,
      street: row[11] || null,
      expenses: parseNum(row[12]),
      description: row[13] || null,
      surfaceTotal: parseNum(row[14]),
      surfaceCovered: parseNum(row[15]),
      rooms: parseNum(row[16]),
      bathrooms: parseNum(row[17]),
      parking: parseNum(row[18]),
      bedrooms: parseNum(row[19]),
      ageYears: parseNum(row[20]),
      pricePerM2Total: pricePerM2Total,
      pricePerM2Covered: parseNum(row[22]),
      toilettes: parseNum(row[23]),
      disposition: row[24] || null,
      orientation: row[25] || null,
      luminosity: row[26] || null,
    });
  }

  // Compute neighborhood stats using pricePerM2Total
  const neighborhoodMap = new Map<string, number[]>();
  for (const p of rawProperties) {
    if (!p.pricePerM2Total || p.pricePerM2Total <= 0) continue;
    const key = p.neighborhood;
    if (!neighborhoodMap.has(key)) neighborhoodMap.set(key, []);
    neighborhoodMap.get(key)!.push(p.pricePerM2Total);
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

  const propertiesWithPrice = rawProperties.filter((p) => p.pricePerM2Total && p.pricePerM2Total > 0);
  const sortedByPrice = [...propertiesWithPrice].sort((a, b) => (a.pricePerM2Total ?? 0) - (b.pricePerM2Total ?? 0));
  const top10Percent = Math.ceil(sortedByPrice.length * 0.1);
  const topIds = new Set(sortedByPrice.slice(0, top10Percent).map((p) => p.id));

  const properties: Property[] = rawProperties.map((p) => {
    const stats = neighborhoodStats.get(p.neighborhood);
    const neighborhoodMedian = stats?.medianPricePerSqm || p.pricePerM2Total || 0;
    const ppm2 = p.pricePerM2Total || 0;
    const opportunityScore = neighborhoodMedian > 0 ? ((neighborhoodMedian - ppm2) / neighborhoodMedian) * 100 : 0;

    return {
      ...p,
      opportunityScore,
      isTopOpportunity: topIds.has(p.id),
      isNeighborhoodDeal: opportunityScore > 40,
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
