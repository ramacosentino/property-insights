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
    name: "bathrooms", displayName: "Baños",
    description: "Tener un solo baño resta valor. A partir de dos, el impacto es menor y se correlaciona con el tamaño.",
    extract: p => {
      if (!p.bathrooms) return "Sin dato";
      if (p.bathrooms === 1) return "1 baño";
      if (p.bathrooms === 2) return "2 baños";
      return "3+ baños";
    },
  },
  {
    name: "parking", displayName: "Cochera",
    description: "La cochera agrega un premium significativo, especialmente en zonas donde el m² es más caro.",
    extract: p => {
      if (p.parking == null) return "Sin dato";
      if (p.parking === 0) return "Sin cochera";
      if (p.parking === 1) return "1 cochera";
      return "2+ cocheras";
    },
  },
  {
    name: "ageYears", displayName: "Antigüedad",
    description: "A estrenar y pocos años tienen un premium claro. Más allá de eso, importa más el estado de conservación que la edad.",
    extract: p => {
      if (p.ageYears == null) return "Sin dato";
      if (p.ageYears === 0) return "A estrenar";
      if (p.ageYears <= 5) return "1-5 años";
      if (p.ageYears <= 15) return "6-15 años";
      if (p.ageYears <= 30) return "16-30 años";
      if (p.ageYears <= 50) return "31-50 años";
      return "50+ años";
    },
  },
  {
    name: "surfaceRange", displayName: "Rango de Superficie",
    description: "A mayor superficie, menor USD/m² (economía de escala). Es uno de los factores más consistentes.",
    extract: p => {
      if (!p.surfaceTotal) return "Sin dato";
      if (p.surfaceTotal < 35) return "< 35 m²";
      if (p.surfaceTotal < 50) return "35-50 m²";
      if (p.surfaceTotal < 80) return "50-80 m²";
      if (p.surfaceTotal < 120) return "80-120 m²";
      if (p.surfaceTotal < 200) return "120-200 m²";
      return "200+ m²";
    },
  },
  {
    name: "coverageRatio", displayName: "Ratio Cubierto/Total",
    description: "Más superficie cubierta = más valor/m². Pero no tener nada descubierto (terraza, balcón) también resta. Hay un sweet spot.",
    extract: p => {
      if (!p.surfaceTotal || !p.surfaceCovered || p.surfaceTotal === 0) return "Sin dato";
      const r = p.surfaceCovered / p.surfaceTotal;
      if (r >= 0.98) return "100% cubierto (sin exterior)";
      if (r >= 0.85) return "85-98% cubierto";
      if (r >= 0.7) return "70-85%";
      if (r >= 0.5) return "50-70%";
      return "< 50% cubierto";
    },
  },
  {
    name: "rooms", displayName: "Ambientes",
    description: "Los ambientes correlacionan con la superficie, así que su impacto directo en USD/m² es ambiguo. Se muestra como referencia.",
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
    name: "orientation", displayName: "Orientación",
    description: "Sur es peor. El impacto es menor pero relevante si la propiedad no es luminosa.",
    extract: p => p.orientation || "Sin dato",
  },
  {
    name: "disposition", displayName: "Disposición",
    description: "Frente, contrafrente e interno. En la práctica tiene bajo impacto directo en el USD/m².",
    extract: p => p.disposition || "Sin dato",
  },
  {
    name: "luminosity", displayName: "Luminosidad",
    description: "La luminosidad impacta en el valor, pero el dato reportado en avisos puede no ser del todo confiable.",
    extract: p => p.luminosity || "Sin dato",
  },
];

// ─── Types ───────────────────────────────────────────────────────
export interface FactorLevel {
  label: string;
  count: number;
  medianPriceM2: number;
  premium: number; // % vs overall median
  isReference?: boolean; // true for "Sin dato" levels shown but excluded from calculations
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

// ─── Get available property types ────────────────────────────────
export function getPropertyTypes(properties: Property[]): string[] {
  const types = new Set<string>();
  for (const p of properties) {
    if (p.propertyType) types.add(p.propertyType);
  }
  return Array.from(types).sort();
}

// ─── Factor Analysis (for visualization) ─────────────────────────
export function computeFactorAnalysis(properties: Property[], propertyType?: string): FactorAnalysis[] {
  // Filter by property type if specified
  const filtered = propertyType
    ? properties.filter(p => p.propertyType === propertyType)
    : properties;

  const valid = filtered.filter(p => p.pricePerM2Total && p.pricePerM2Total > 0);
  if (valid.length === 0) return [];

  // Baseline median excludes "Sin dato" properties per factor, but we use overall median of the segment
  const overallMedian = median(valid.map(p => p.pricePerM2Total!));
  const results: FactorAnalysis[] = [];

  for (const def of FACTOR_DEFS) {
    const groups = new Map<string, number[]>();
    for (const p of valid) {
      const key = def.extract(p);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p.pricePerM2Total!);
    }

    // Compute baseline median excluding "Sin dato" for this factor
    const nonSinDatoValues: number[] = [];
    for (const [label, values] of groups) {
      if (label !== "Sin dato") nonSinDatoValues.push(...values);
    }
    const factorBaseline = nonSinDatoValues.length > 0 ? median(nonSinDatoValues) : overallMedian;

    const levels: FactorLevel[] = [];
    for (const [label, values] of groups) {
      if (values.length < 3) continue;
      const med = median(values);
      const isSinDato = label === "Sin dato";
      levels.push({
        label,
        count: values.length,
        medianPriceM2: Math.round(med),
        premium: Math.round(((med - factorBaseline) / factorBaseline) * 1000) / 10,
        isReference: isSinDato,
      });
    }
    levels.sort((a, b) => b.medianPriceM2 - a.medianPriceM2);

    // Impact range excludes "Sin dato" reference levels
    const nonRefPremiums = levels.filter(l => !l.isReference).map(l => l.premium);
    const range = nonRefPremiums.length > 1 ? Math.max(...nonRefPremiums) - Math.min(...nonRefPremiums) : 0;

    results.push({
      name: def.name,
      displayName: def.displayName,
      description: def.description,
      levels,
      baselineMedian: Math.round(factorBaseline),
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
