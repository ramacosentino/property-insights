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
