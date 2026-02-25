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
  /** If true, factor is confounded with surface and gets dampened relevance */
  confounded?: boolean;
}

export const FACTOR_DEFS: FactorDef[] = [
  {
    name: "parking", displayName: "Cochera",
    description: "La cochera agrega un premium significativo, especialmente en departamentos. En casas grandes, más cocheras correlaciona con mayor superficie.",
    extract: p => {
      if (p.parking == null) return "Sin cochera o s/d";
      if (p.parking === 0) return "Sin cochera o s/d";
      if (p.parking === 1) return "Con cochera";
      return "2+ cocheras";
    },
  },
  {
    name: "ageYears", displayName: "Antigüedad",
    description: "A estrenar y pocos años tienen un premium claro en departamentos y PH. En casas, el patrón puede invertirse (barrios premium consolidados tienen propiedades más antiguas).",
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
    name: "disposition", displayName: "Disposición",
    description: "Frente, contrafrente e interno. En la práctica tiene bajo impacto directo en el USD/m².",
    extract: p => p.disposition || "Sin dato",
  },
  {
    name: "orientation", displayName: "Orientación",
    description: "Sur es peor. El impacto es menor y no es determinante siempre que la propiedad sea luminosa.",
    extract: p => p.orientation || "Sin dato",
  },
  {
    name: "luminosity", displayName: "Luminosidad",
    description: "Muy luminoso es estrictamente mejor que luminoso, pero el impacto en USD/m² es bajo y el dato reportado en avisos puede no ser del todo confiable.",
    extract: p => p.luminosity || "Sin dato",
  },
  {
    name: "rooms", displayName: "Ambientes",
    description: "Confundido con superficie: el USD/m² cambia más por el tamaño que por la cantidad de ambientes. Se muestra como referencia.",
    confounded: true,
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
    description: "Confundido con superficie: más baños correlaciona con propiedades más grandes. Se muestra como referencia.",
    confounded: true,
    extract: p => {
      if (!p.bathrooms) return "Sin dato";
      if (p.bathrooms === 1) return "1 baño";
      if (p.bathrooms === 2) return "2 baños";
      return "3+ baños";
    },
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
  confounded?: boolean;
  /** True when the premium pattern is inverted vs typical expectation (e.g. older = more expensive) */
  invertedPattern?: boolean;
  invertedNote?: string;
}

// Premium map for adjustments
export type FactorPremiumMap = Map<string, Map<string, number>>; // factorName -> levelLabel -> premium%
// Segmented premium map: propertyType -> FactorPremiumMap
export type SegmentedFactorPremiumMap = Map<string, FactorPremiumMap>;

// ─── Segmentation ────────────────────────────────────────────────
export type SegmentationAxis = "propertyType" | "rooms";

export function getSegmentValues(properties: Property[], axis: SegmentationAxis): string[] {
  const values = new Set<string>();
  for (const p of properties) {
    const v = extractSegmentValue(p, axis);
    if (v) values.add(v);
  }
  return Array.from(values).sort();
}

function extractSegmentValue(p: Property, axis: SegmentationAxis): string | null {
  if (axis === "propertyType") return p.propertyType || null;
  if (axis === "rooms") {
    if (!p.rooms) return null;
    if (p.rooms === 1) return "Monoambiente";
    if (p.rooms === 2) return "2 ambientes";
    if (p.rooms === 3) return "3 ambientes";
    if (p.rooms === 4) return "4 ambientes";
    return "5+ ambientes";
  }
  return null;
}

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

// ─── Inverted pattern detection ──────────────────────────────────
/** For age factor: check if older properties have HIGHER median (inverted) */
function detectInvertedAge(levels: FactorLevel[]): { inverted: boolean; note?: string } {
  const nonRef = levels.filter(l => !l.isReference && l.label !== "Sin dato");
  if (nonRef.length < 2) return { inverted: false };
  
  // Check if the "oldest" level has a higher premium than the "newest"
  const ageOrder = ["A estrenar", "1-5 años", "6-15 años", "16-30 años", "31-50 años", "50+ años"];
  const sorted = nonRef.sort((a, b) => ageOrder.indexOf(a.label) - ageOrder.indexOf(b.label));
  
  const newest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  
  if (oldest && newest && oldest.premium > newest.premium + 5) {
    return {
      inverted: true,
      note: "Patrón inverso: las propiedades más antiguas tienen mayor USD/m², probablemente por estar en zonas premium consolidadas.",
    };
  }
  return { inverted: false };
}

// ─── Factor Analysis (for visualization) ─────────────────────────
export function computeFactorAnalysis(
  properties: Property[],
  segments?: { propertyType?: string; rooms?: string }
): FactorAnalysis[] {
  let filtered = properties;
  
  if (segments?.propertyType) {
    filtered = filtered.filter(p => p.propertyType === segments.propertyType);
  }
  if (segments?.rooms) {
    filtered = filtered.filter(p => {
      const label = extractSegmentValue(p, "rooms");
      return label === segments.rooms;
    });
  }

  const valid = filtered.filter(p => p.pricePerM2Total && p.pricePerM2Total > 0);
  if (valid.length === 0) return [];

  const overallMedian = median(valid.map(p => p.pricePerM2Total!));
  const results: FactorAnalysis[] = [];

  for (const def of FACTOR_DEFS) {
    // Skip rooms factor when already segmenting by rooms
    if (def.name === "rooms" && segments?.rooms) continue;
    
    const groups = new Map<string, number[]>();
    for (const p of valid) {
      const key = def.extract(p);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p.pricePerM2Total!);
    }

    // Compute baseline median excluding "Sin dato" and reference labels
    const nonSinDatoValues: number[] = [];
    for (const [label, values] of groups) {
      if (label !== "Sin dato" && label !== "Sin cochera o s/d") nonSinDatoValues.push(...values);
    }
    const factorBaseline = nonSinDatoValues.length > 0 ? median(nonSinDatoValues) : overallMedian;

    const levels: FactorLevel[] = [];
    for (const [label, values] of groups) {
      if (values.length < 3) continue;
      const med = median(values);
      const isRef = label === "Sin dato" || label === "Sin cochera o s/d";
      levels.push({
        label,
        count: values.length,
        medianPriceM2: Math.round(med),
        premium: Math.round(((med - factorBaseline) / factorBaseline) * 1000) / 10,
        isReference: isRef,
      });
    }
    levels.sort((a, b) => b.medianPriceM2 - a.medianPriceM2);

    // Impact range excludes reference levels
    const nonRefPremiums = levels.filter(l => !l.isReference).map(l => l.premium);
    const range = nonRefPremiums.length > 1 ? Math.max(...nonRefPremiums) - Math.min(...nonRefPremiums) : 0;

    // Dampen relevance for confounded factors
    const rawRelevance = Math.min(100, Math.round(range * 1.5));
    const relevance = def.confounded ? Math.min(rawRelevance, 25) : rawRelevance;

    // Detect inverted patterns for age
    let invertedPattern = false;
    let invertedNote: string | undefined;
    if (def.name === "ageYears") {
      const detection = detectInvertedAge(levels);
      invertedPattern = detection.inverted;
      invertedNote = detection.note;
    }

    results.push({
      name: def.name,
      displayName: def.displayName,
      description: def.description,
      levels,
      baselineMedian: Math.round(factorBaseline),
      impactRange: Math.round(range * 10) / 10,
      relevance,
      confounded: def.confounded,
      invertedPattern,
      invertedNote,
    });
  }

  results.sort((a, b) => b.impactRange - a.impactRange);
  return results;
}

// ─── Factor Premiums (for opportunity adjustment) ─────────────────
function computeFactorPremiumsForGroup(properties: Property[]): FactorPremiumMap {
  const valid = properties.filter(p => p.pricePerM2Total && p.pricePerM2Total > 0);
  const overallMedian = median(valid.map(p => p.pricePerM2Total!));
  const map: FactorPremiumMap = new Map();

  for (const def of FACTOR_DEFS) {
    if (def.confounded) continue;
    
    const groups = new Map<string, number[]>();
    for (const p of valid) {
      const key = def.extract(p);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p.pricePerM2Total!);
    }

    const levelMap = new Map<string, number>();
    for (const [label, values] of groups) {
      if (values.length < 3 || label === "Sin dato" || label === "Sin cochera o s/d") continue;
      const med = median(values);
      levelMap.set(label, ((med - overallMedian) / overallMedian) * 100);
    }
    map.set(def.name, levelMap);
  }

  return map;
}

/** Compute factor premiums segmented by property type */
export function computeSegmentedFactorPremiums(properties: Property[]): SegmentedFactorPremiumMap {
  const map: SegmentedFactorPremiumMap = new Map();
  
  // Group by property type
  const byType = new Map<string, Property[]>();
  for (const p of properties) {
    const type = p.propertyType || "__all__";
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(p);
  }
  
  // Compute premiums per type
  for (const [type, props] of byType) {
    if (props.length < 10) continue; // need enough data
    map.set(type, computeFactorPremiumsForGroup(props));
  }
  
  // Also compute a fallback for all properties
  map.set("__all__", computeFactorPremiumsForGroup(properties));
  
  return map;
}

// ─── Property Factor Adjustment ──────────────────────────────────
export function getPropertyFactorAdjustment(
  property: PropLike,
  segmentedPremiums: SegmentedFactorPremiumMap
): number {
  // Use type-specific premiums, fall back to global
  const premiums = segmentedPremiums.get(property.propertyType || "__all__")
    ?? segmentedPremiums.get("__all__");
  if (!premiums) return 0;

  let totalAdj = 0;
  let count = 0;

  for (const def of FACTOR_DEFS) {
    if (def.confounded) continue;
    const label = def.extract(property);
    if (label === "Sin dato" || label === "Sin cochera o s/d") continue;
    const levelMap = premiums.get(def.name);
    if (!levelMap) continue;
    const prem = levelMap.get(label);
    if (prem == null) continue;
    totalAdj += prem;
    count++;
  }

  if (count === 0) return 0;
  return (totalAdj / count / 100) * 0.4;
}
