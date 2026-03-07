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
  normNeighborhood: string | null;
  normLocality: string | null;
  normProvince: string | null;
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
  createdAt: string;
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

// Rooms label
export function getRoomsLabel(rooms: number | null): string {
  if (!rooms) return "Sin dato";
  if (rooms === 1) return "1 amb";
  if (rooms === 2) return "2 amb";
  if (rooms === 3) return "3 amb";
  if (rooms === 4) return "4 amb";
  return "5+ amb";
}
