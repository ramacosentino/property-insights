import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ───────────────────────────────────────────────────────
interface PropertyRow {
  id: string;
  property_type: string | null;
  neighborhood: string | null;
  norm_neighborhood: string | null;
  price_per_m2_total: number | null;
  price_per_m2_covered: number | null;
  rooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  age_years: number | null;
  surface_total: number | null;
  surface_covered: number | null;
  disposition: string | null;
  orientation: string | null;
  luminosity: string | null;
}

// ─── Factor definitions (mirrors priceFactors.ts, excluding confounded) ──
interface FactorDef {
  name: string;
  extract: (p: PropertyRow) => string;
}

const FACTOR_DEFS: FactorDef[] = [
  {
    name: "parking",
    extract: (p) => {
      if (p.parking == null || p.parking === 0) return "Sin cochera o s/d";
      if (p.parking === 1) return "Con cochera";
      return "2+ cocheras";
    },
  },
  {
    name: "ageYears",
    extract: (p) => {
      if (p.age_years == null) return "Sin dato";
      if (p.age_years === 0) return "A estrenar";
      if (p.age_years <= 5) return "1-5 años";
      if (p.age_years <= 15) return "6-15 años";
      if (p.age_years <= 30) return "16-30 años";
      if (p.age_years <= 50) return "31-50 años";
      return "50+ años";
    },
  },
  {
    name: "surfaceRange",
    extract: (p) => {
      if (!p.surface_total) return "Sin dato";
      if (p.surface_total < 35) return "< 35 m²";
      if (p.surface_total < 50) return "35-50 m²";
      if (p.surface_total < 80) return "50-80 m²";
      if (p.surface_total < 120) return "80-120 m²";
      if (p.surface_total < 200) return "120-200 m²";
      return "200+ m²";
    },
  },
  {
    name: "coverageRatio",
    extract: (p) => {
      if (!p.surface_total || !p.surface_covered || p.surface_total === 0) return "Sin dato";
      const r = p.surface_covered / p.surface_total;
      if (r >= 0.98) return "100% cubierto (sin exterior)";
      if (r >= 0.85) return "85-98% cubierto";
      if (r >= 0.7) return "70-85%";
      if (r >= 0.5) return "50-70%";
      return "< 50% cubierto";
    },
  },
  { name: "disposition", extract: (p) => p.disposition || "Sin dato" },
  { name: "orientation", extract: (p) => p.orientation || "Sin dato" },
  { name: "luminosity", extract: (p) => p.luminosity || "Sin dato" },
  // rooms and bathrooms are confounded → excluded from adjustment
];

// ─── Helpers ─────────────────────────────────────────────────────
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function computeIQRBounds(values: number[], multiplier = 4): { lower: number; upper: number } {
  if (values.length < 3) return { lower: -Infinity, upper: Infinity };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return { lower: q1 - multiplier * iqr, upper: q3 + multiplier * iqr };
}

type SurfaceType = "total" | "covered";

function getM2(p: PropertyRow, st: SurfaceType): number | null {
  if (st === "covered") return p.price_per_m2_covered ?? p.price_per_m2_total;
  return p.price_per_m2_total;
}

function groupKey(p: PropertyRow): string {
  return `${p.norm_neighborhood || p.neighborhood || ""}|||${p.property_type || ""}`;
}

// ─── Factor premiums (segmented by property_type) ────────────────
type PremiumMap = Map<string, Map<string, number>>; // factor -> label -> premium%
type SegmentedPremiums = Map<string, PremiumMap>; // type -> PremiumMap

function computeSegmentedPremiums(props: PropertyRow[], st: SurfaceType): SegmentedPremiums {
  const byType = new Map<string, PropertyRow[]>();
  for (const p of props) {
    const t = p.property_type || "__all__";
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(p);
  }

  const result: SegmentedPremiums = new Map();

  const computeForGroup = (group: PropertyRow[]): PremiumMap => {
    const valid = group.filter((p) => {
      const v = getM2(p, st);
      return v != null && v > 0;
    });
    const overallMed = median(valid.map((p) => getM2(p, st)!));
    const map: PremiumMap = new Map();

    for (const def of FACTOR_DEFS) {
      const groups = new Map<string, number[]>();
      for (const p of valid) {
        const key = def.extract(p);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(getM2(p, st)!);
      }
      const levelMap = new Map<string, number>();
      for (const [label, values] of groups) {
        if (values.length < 3 || label === "Sin dato" || label === "Sin cochera o s/d") continue;
        const med = median(values);
        levelMap.set(label, ((med - overallMed) / overallMed) * 100);
      }
      map.set(def.name, levelMap);
    }
    return map;
  };

  for (const [type, group] of byType) {
    if (group.length < 10) continue;
    result.set(type, computeForGroup(group));
  }
  result.set("__all__", computeForGroup(props));
  return result;
}

function getFactorAdjustment(p: PropertyRow, segmented: SegmentedPremiums): number {
  const premiums = segmented.get(p.property_type || "__all__") ?? segmented.get("__all__");
  if (!premiums) return 0;

  let totalAdj = 0;
  let count = 0;

  for (const def of FACTOR_DEFS) {
    const label = def.extract(p);
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

// ─── Main computation ────────────────────────────────────────────
function computeScores(
  props: PropertyRow[],
  st: SurfaceType
): Map<string, { score: number; isOutlier: boolean }> {
  // 1. IQR outlier detection per group
  const groupVals = new Map<string, number[]>();
  for (const p of props) {
    const m2 = getM2(p, st);
    if (!m2 || m2 <= 0) continue;
    const key = groupKey(p);
    if (!groupVals.has(key)) groupVals.set(key, []);
    groupVals.get(key)!.push(m2);
  }

  const bounds = new Map<string, { lower: number; upper: number }>();
  for (const [key, values] of groupVals) {
    bounds.set(key, computeIQRBounds(values, 4));
  }

  const outlierIds = new Set<string>();
  for (const p of props) {
    const m2 = getM2(p, st);
    if (!m2 || m2 <= 0) continue;
    const b = bounds.get(groupKey(p));
    if (b && (m2 < b.lower || m2 > b.upper)) outlierIds.add(p.id);
  }

  // 2. Group medians (excluding outliers)
  const groupMedians = new Map<string, number>();
  for (const [key, values] of groupVals) {
    const b = bounds.get(key)!;
    const filtered = values.filter((v) => v >= b.lower && v <= b.upper);
    if (filtered.length > 0) groupMedians.set(key, median(filtered));
  }

  // 3. Factor premiums (excluding outliers)
  const nonOutliers = props.filter((p) => !outlierIds.has(p.id));
  const segPremiums = computeSegmentedPremiums(nonOutliers, st);

  // 4. Compute score per property
  const results = new Map<string, { score: number; isOutlier: boolean }>();
  for (const p of props) {
    const m2 = getM2(p, st);
    const isOutlier = outlierIds.has(p.id);
    const hasPriceData = m2 != null && m2 > 0;

    if (!hasPriceData || isOutlier) {
      results.set(p.id, { score: 0, isOutlier });
      continue;
    }

    const gKey = groupKey(p);
    const baseMedian = groupMedians.get(gKey) ?? 0;
    let score = 0;

    if (baseMedian > 0) {
      const factorAdj = getFactorAdjustment(p, segPremiums);
      const expectedPrice = baseMedian * (1 + factorAdj);
      score = ((expectedPrice - m2!) / expectedPrice) * 100;
    }

    results.set(p.id, { score: Math.round(score * 100) / 100, isOutlier });
  }

  return results;
}

// ─── Edge function ───────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    console.log("Fetching all active properties...");

    // Fetch all active properties with relevant columns
    const SELECT_COLS = [
      "id", "property_type", "neighborhood", "norm_neighborhood",
      "price_per_m2_total", "price_per_m2_covered",
      "rooms", "bathrooms", "parking", "age_years",
      "surface_total", "surface_covered",
      "disposition", "orientation", "luminosity",
    ].join(",");

    const allRows: PropertyRow[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("properties")
        .select(SELECT_COLS)
        .eq("status", "active")
        .range(from, from + pageSize - 1);

      if (error) throw error;
      if (data) allRows.push(...(data as unknown as PropertyRow[]));
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }

    console.log(`Loaded ${allRows.length} active properties`);

    // Compute scores for both surface types
    const totalScores = computeScores(allRows, "total");
    const coveredScores = computeScores(allRows, "covered");

    // Build SQL for batch update using a CTE
    const allUpdates = allRows.map((p) => ({
      id: p.id,
      ost: totalScores.get(p.id)?.score ?? 0,
      osc: coveredScores.get(p.id)?.score ?? 0,
      iot: totalScores.get(p.id)?.isOutlier ?? false,
      ioc: coveredScores.get(p.id)?.isOutlier ?? false,
    }));

    // Update in batches using upsert-like pattern
    let updated = 0;
    const batchSize = 500;

    for (let i = 0; i < allUpdates.length; i += batchSize) {
      const batch = allUpdates.slice(i, i + batchSize);

      // Build values for a raw SQL update via RPC
      // Since we can't do raw SQL, use parallel promises with eq filters
      const promises = batch.map((u) =>
        supabase
          .from("properties")
          .update({
            opportunity_score_total: u.ost,
            opportunity_score_covered: u.osc,
            is_outlier_total: u.iot,
            is_outlier_covered: u.ioc,
          })
          .eq("id", u.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        console.error(`Batch errors: ${errors.length}/${batch.length}`);
      }

      updated += batch.length;
      console.log(`Updated ${updated}/${allUpdates.length}...`);
    }

    console.log(`Done. Updated ${updated} properties.`);

    return new Response(
      JSON.stringify({ success: true, updated, total: allRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
