import { Property } from "./propertyData";

// ─── Factor definitions ──────────────────────────────────────────
type PropLike = Pick<Property,
  "propertyType" | "rooms" | "bathrooms" | "parking" | "ageYears" |
  "surfaceTotal" | "surfaceCovered" | "disposition" | "orientation" |
  "luminosity"
>;

interface FactorDef {
  name: string;
  displayName: string;
  description: string;
  extract: (p: PropLike) => string;
}

export const FACTOR_DEFS: FactorDef[] = [
  {
    name: "propertyType", displayName: "Tipo de Propiedad",
    description: "El tipo de propiedad es uno de los factores más determinantes del precio por m².",
    extract: p => p.propertyType || "Sin dato",
  },
  {
    name: "rooms", displayName: "Ambientes",
    description: "La cantidad de ambientes refleja el tamaño funcional y afecta directamente la valuación.",
    extract: p => {
      if (!p.rooms) return "Sin dato";
      if (p.rooms === 1) return "Monoambiente";
      if (p.rooms === 2) return "2 amb.";
      if (p.rooms === 3) return "3 amb.";
      if (p.rooms === 4) return "4 amb.";
      return "5+ amb.";
    },
  },
  {
    name: "bathrooms", displayName: "Baños",
    description: "Más baños suelen indicar mejor categoría y mayor valor por m².",
    extract: p => {
      if (!p.bathrooms) return "Sin dato";
      if (p.bathrooms === 1) return "1 baño";
      if (p.bathrooms === 2) return "2 baños";
      return "3+ baños";
    },
  },
  {
    name: "parking", displayName: "Cochera",
    description: "La disponibilidad de cochera agrega un premium significativo al valor.",
    extract: p => {
      if (p.parking == null) return "Sin dato";
      if (p.parking === 0) return "Sin cochera";
      if (p.parking === 1) return "1 cochera";
      return "2+ cocheras";
    },
  },
  {
    name: "ageYears", displayName: "Antigüedad",
    description: "Las propiedades más nuevas tienden a cotizar más alto por m².",
    extract: p => {
      if (p.ageYears == null) return "Sin dato";
      if (p.ageYears === 0) return "A estrenar";
      if (p.ageYears <= 10) return "1-10 años";
      if (p.ageYears <= 30) return "11-30 años";
      if (p.ageYears <= 50) return "31-50 años";
      return "50+ años";
    },
  },
  {
    name: "coverageRatio", displayName: "Ratio Cubierto/Total",
    description: "Un mayor porcentaje de superficie cubierta suele indicar mejor aprovechamiento.",
    extract: p => {
      if (!p.surfaceTotal || !p.surfaceCovered || p.surfaceTotal === 0) return "Sin dato";
      const r = p.surfaceCovered / p.surfaceTotal;
      if (r >= 0.95) return "100% cubierto";
      if (r >= 0.7) return "70-95%";
      if (r >= 0.5) return "50-70%";
      return "< 50%";
    },
  },
  {
    name: "disposition", displayName: "Disposición",
    description: "La disposición (frente, contrafrente, interno) afecta luz, ruido y valuación.",
    extract: p => p.disposition || "Sin dato",
  },
  {
    name: "orientation", displayName: "Orientación",
    description: "La orientación determina la luz natural y puede influir en el precio.",
    extract: p => p.orientation || "Sin dato",
  },
  {
    name: "luminosity", displayName: "Luminosidad",
    description: "Propiedades con mejor luminosidad suelen tener una prima de precio.",
    extract: p => p.luminosity || "Sin dato",
  },
  {
    name: "surfaceRange", displayName: "Rango de Superficie",
    description: "El tamaño total impacta en el precio por m²: propiedades más grandes suelen tener menor USD/m².",
    extract: p => {
      if (!p.surfaceTotal) return "Sin dato";
      if (p.surfaceTotal < 50) return "< 50 m²";
      if (p.surfaceTotal < 100) return "50-100 m²";
      if (p.surfaceTotal < 200) return "100-200 m²";
      if (p.surfaceTotal < 500) return "200-500 m²";
      return "500+ m²";
    },
  },
];

// ─── Types ───────────────────────────────────────────────────────
export interface FactorLevel {
  label: string;
  count: number;
  medianPriceM2: number;
  premium: number; // % vs overall median
}

export interface FactorAnalysis {
  name: string;
  displayName: string;
  description: string;
  levels: FactorLevel[];
  baselineMedian: number;
  impactRange: number;
  relevance: number; // 0-100
}

// Premium map for adjustments
export type FactorPremiumMap = Map<string, Map<string, number>>; // factorName -> levelLabel -> premium%

// ─── Helpers ─────────────────────────────────────────────────────
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ─── Factor Analysis (for visualization) ─────────────────────────
export function computeFactorAnalysis(properties: Property[]): FactorAnalysis[] {
  const valid = properties.filter(p => p.pricePerM2Total && p.pricePerM2Total > 0);
  if (valid.length === 0) return [];

  const overallMedian = median(valid.map(p => p.pricePerM2Total!));
  const results: FactorAnalysis[] = [];

  for (const def of FACTOR_DEFS) {
    const groups = new Map<string, number[]>();
    for (const p of valid) {
      const key = def.extract(p);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p.pricePerM2Total!);
    }

    const levels: FactorLevel[] = [];
    for (const [label, values] of groups) {
      if (values.length < 3) continue;
      const med = median(values);
      levels.push({
        label,
        count: values.length,
        medianPriceM2: Math.round(med),
        premium: Math.round(((med - overallMedian) / overallMedian) * 1000) / 10,
      });
    }
    levels.sort((a, b) => b.medianPriceM2 - a.medianPriceM2);

    const premiums = levels.map(l => l.premium);
    const range = premiums.length > 1 ? Math.max(...premiums) - Math.min(...premiums) : 0;

    results.push({
      name: def.name,
      displayName: def.displayName,
      description: def.description,
      levels,
      baselineMedian: Math.round(overallMedian),
      impactRange: Math.round(range * 10) / 10,
      relevance: Math.min(100, Math.round(range * 1.5)),
    });
  }

  results.sort((a, b) => b.impactRange - a.impactRange);
  return results;
}

// ─── Factor Premiums (for opportunity adjustment) ─────────────────
export function computeFactorPremiums(properties: Property[]): FactorPremiumMap {
  const valid = properties.filter(p => p.pricePerM2Total && p.pricePerM2Total > 0);
  const overallMedian = median(valid.map(p => p.pricePerM2Total!));
  const map: FactorPremiumMap = new Map();

  for (const def of FACTOR_DEFS) {
    const groups = new Map<string, number[]>();
    for (const p of valid) {
      const key = def.extract(p);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p.pricePerM2Total!);
    }

    const levelMap = new Map<string, number>();
    for (const [label, values] of groups) {
      if (values.length < 3 || label === "Sin dato") continue;
      const med = median(values);
      levelMap.set(label, ((med - overallMedian) / overallMedian) * 100);
    }
    map.set(def.name, levelMap);
  }

  return map;
}

// ─── Property Factor Adjustment ──────────────────────────────────
export function getPropertyFactorAdjustment(
  property: PropLike,
  premiums: FactorPremiumMap
): number {
  let totalAdj = 0;
  let count = 0;

  for (const def of FACTOR_DEFS) {
    const label = def.extract(property);
    if (label === "Sin dato") continue;
    const levelMap = premiums.get(def.name);
    if (!levelMap) continue;
    const prem = levelMap.get(label);
    if (prem == null) continue;
    totalAdj += prem;
    count++;
  }

  if (count === 0) return 0;
  // Average adjustment, dampened to 40% to be conservative
  return (totalAdj / count / 100) * 0.4;
}
