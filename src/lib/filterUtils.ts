// Shared filter utility functions and constants
// Extracted from MapView.tsx and PropertyList.tsx to eliminate duplication

export function getParkingLabel(parking: number | null): string {
  if (!parking || parking === 0) return "Sin cochera";
  if (parking === 1) return "1 cochera";
  if (parking === 2) return "2 cocheras";
  return "3+ cocheras";
}

export function getBedroomsLabel(bedrooms: number | null): string {
  if (!bedrooms) return "Sin dato";
  if (bedrooms === 1) return "1 dorm";
  if (bedrooms === 2) return "2 dorm";
  if (bedrooms === 3) return "3 dorm";
  if (bedrooms === 4) return "4 dorm";
  return "5+ dorm";
}

export function getBathroomsLabel(bathrooms: number | null): string {
  if (!bathrooms) return "Sin dato";
  if (bathrooms === 1) return "1 baño";
  if (bathrooms === 2) return "2 baños";
  if (bathrooms === 3) return "3 baños";
  return "4+ baños";
}

export function formatPrice(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return v.toString();
}

// Filter category keys
export const ROOMS_KEYS = ["1 amb", "2 amb", "3 amb", "4 amb", "5+ amb"];
export const PARKING_KEYS = ["Sin cochera", "1 cochera", "2 cocheras", "3+ cocheras"];
export const PROPERTY_TYPE_KEYS = ["departamento", "casa", "ph", "terreno"];
export const BEDROOMS_KEYS = ["1 dorm", "2 dorm", "3 dorm", "4 dorm", "5+ dorm"];
export const BATHROOMS_KEYS = ["1 baño", "2 baños", "3 baños", "4+ baños"];
export const DISPOSITION_KEYS = ["Frente", "Contrafrente", "Interno", "Lateral"];
export const ORIENTATION_KEYS = ["Norte", "Sur", "Este", "Oeste", "Noreste", "Noroeste", "Sudeste", "Sudoeste"];

// Range filter caps
export const PRICE_CAP = 2000000;
export const SURFACE_CAP = 2000;
export const SURFACE_COVERED_CAP = 800;
export const AGE_CAP = 50;
export const EXPENSES_CAP = 1000000;

// Condition (score) tiers — 6 levels
export const CONDITION_TIERS = [
  { value: "excelente", label: "Excelente", minScore: 1.0, maxScore: Infinity },
  { value: "buen_estado", label: "Buen estado", minScore: 0.9, maxScore: 0.99 },
  { value: "aceptable", label: "Aceptable", minScore: 0.8, maxScore: 0.89 },
  { value: "necesita_mejoras", label: "Necesita mejoras", minScore: 0.7, maxScore: 0.79 },
  { value: "refaccion_parcial", label: "Refacción parcial", minScore: 0.55, maxScore: 0.69 },
  { value: "refaccion_completa", label: "Refacción completa", minScore: 0, maxScore: 0.54 },
] as const;

export const CONDITION_KEYS = CONDITION_TIERS.map((t) => t.value);
export const ALL_CONDITION_VALUES = CONDITION_KEYS;

/** Get the condition tier value for a given score. Returns null if score is null. */
export function getConditionTier(score: number | null): string | null {
  if (score == null) return null;
  for (const tier of CONDITION_TIERS) {
    if (score >= tier.minScore) return tier.value;
  }
  return "refaccion_completa";
}

/** Check if a property passes the condition filter. NULL scores always pass (inclusive). */
export function applyConditionFilter(score: number | null, selectedTiers: Set<string>): boolean {
  if (selectedTiers.size === 0) return true; // no filter active
  if (score == null) return true; // NULL scores always included
  const tier = getConditionTier(score);
  return tier ? selectedTiers.has(tier) : true;
}
