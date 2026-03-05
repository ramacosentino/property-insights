import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Estimate renovation cost per m² based on score_multiplicador (defaults) */
function defaultRenovationCostPerM2(score: number): number {
  if (score >= 1.0) return 0;
  if (score >= 0.9) return 100;
  if (score >= 0.8) return 200;
  if (score >= 0.7) return 350;
  if (score >= 0.55) return 500;
  return 700;
}

/** Get renovation cost using user-configured costs or defaults */
function getRenovationCostPerM2(score: number, customCosts?: Record<string, number>): number {
  if (!customCosts || Object.keys(customCosts).length === 0) {
    return defaultRenovationCostPerM2(score);
  }
  const thresholds = Object.entries(customCosts)
    .map(([k, v]) => ({ min: parseFloat(k), cost: Number(v) }))
    .filter(t => !isNaN(t.min) && isFinite(t.min) && !isNaN(t.cost))
    .sort((a, b) => b.min - a.min);

  if (thresholds.length === 0) return defaultRenovationCostPerM2(score);

  for (const t of thresholds) {
    if (score >= t.min) return t.cost;
  }
  return thresholds[thresholds.length - 1].cost;
}

/** Calculate Q3 (75th percentile) of an array */
function q3(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.75);
  return sorted[Math.min(idx, sorted.length - 1)];
}

/** Calculate median of an array */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Enforce consistency between score and estado_general */
function enforceEstado(s: number): string {
  if (s >= 1.0) return "Excelente";
  if (s >= 0.9) return "Buen estado";
  if (s >= 0.8) return "Aceptable";
  if (s >= 0.7) return "Necesita mejoras";
  if (s >= 0.55) return "Refacción parcial";
  return "Refacción completa";
}

/** Calculate comparables-based metrics */
async function calculateComparables(prop: any, property_id: string, supabase: any) {
  const surfaceTotal = prop.surface_total ? Number(prop.surface_total) : null;
  if (!surfaceTotal || surfaceTotal <= 0 || !prop.property_type) {
    return { valorPotencialM2: null, valorPotencialTotal: null, valorPotencialMedianM2: null, comparablesCount: 0, oportunidadAjustada: null };
  }

  const surfaceMin = surfaceTotal * 0.6;
  const surfaceMax = surfaceTotal * 1.4;
  const pricePerM2 = prop.price_per_m2_total ? Number(prop.price_per_m2_total) : null;

  // Try neighborhood first (use norm_neighborhood with fallback)
  const neighborhoodCol = prop.norm_neighborhood ? "norm_neighborhood" : "neighborhood";
  const neighborhoodVal = prop.norm_neighborhood || prop.neighborhood;

  let { data: comparables } = await supabase
    .from("properties")
    .select("price_per_m2_total")
    .eq("property_type", prop.property_type)
    .eq(neighborhoodCol, neighborhoodVal)
    .gte("surface_total", surfaceMin)
    .lte("surface_total", surfaceMax)
    .gt("price_per_m2_total", 0)
    .eq("status", "active")
    .neq("id", property_id);

  // Fallback to city if <3 comparables
  if (!comparables || comparables.length < 3) {
    console.log(`Only ${comparables?.length || 0} in neighborhood, falling back to city...`);
    const cityCol = prop.norm_locality ? "norm_locality" : "city";
    const cityVal = prop.norm_locality || prop.city;
    const { data: cityComparables } = await supabase
      .from("properties")
      .select("price_per_m2_total")
      .eq("property_type", prop.property_type)
      .eq(cityCol, cityVal)
      .gte("surface_total", surfaceMin)
      .lte("surface_total", surfaceMax)
      .gt("price_per_m2_total", 0)
      .eq("status", "active")
      .neq("id", property_id);

    if (cityComparables && cityComparables.length >= 3) {
      comparables = cityComparables;
    }
  }

  if (!comparables || comparables.length < 3) {
    console.log(`Insufficient comparables: ${comparables?.length || 0}`);
    return { valorPotencialM2: null, valorPotencialTotal: null, valorPotencialMedianM2: null, comparablesCount: 0, oportunidadAjustada: null };
  }

  const prices = comparables.map((c: any) => Number(c.price_per_m2_total));
  const comparablesCount = prices.length;
  const q3Val = Math.round(q3(prices));
  const medianVal = Math.round(median(prices));
  const valorPotencialM2 = Math.round((medianVal + q3Val) / 2);
  const valorPotencialTotal = Math.round(valorPotencialM2 * surfaceTotal);

  let oportunidadAjustada: number | null = null;
  if (pricePerM2 && pricePerM2 > 0 && medianVal > 0) {
    oportunidadAjustada = ((medianVal - pricePerM2) / medianVal) * 100;
  }

  console.log(`Comparables: ${comparablesCount}, Median: ${medianVal}, Q3: ${q3Val}, Potential: ${valorPotencialM2}/m², Total: USD ${valorPotencialTotal}`);

  return { valorPotencialM2, valorPotencialTotal, valorPotencialMedianM2: medianVal, comparablesCount, oportunidadAjustada };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // --- Auth: validate JWT or service role ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  let authenticatedUserId: string;

  if (token === serviceKey) {
    authenticatedUserId = "__service_role__";
  } else {
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    authenticatedUserId = claimsData.claims.sub as string;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { property_id, user_id, surface_type = "total", min_surface_enabled = true, renovation_costs = null } = await req.json();

    if (!property_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "property_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (authenticatedUserId !== "__service_role__" && authenticatedUserId !== user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get property from DB
    const { data: prop, error: propError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (propError || !prop) {
      return new Response(
        JSON.stringify({ success: false, error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Read pre-existing score from property (must come pre-enriched)
    const score = prop.score_multiplicador != null ? Number(prop.score_multiplicador) : 0.85;
    const highlights: string[] = prop.highlights || [];
    const lowlights: string[] = prop.lowlights || [];
    const informe: string = prop.informe_breve || "";
    const estado: string = prop.estado_general || enforceEstado(score);

    if (prop.score_multiplicador == null) {
      console.warn(`Property ${property_id} has no pre-enriched score, using default 0.85`);
    }

    // 3. Calculate comparables (step 6)
    const compResult = await calculateComparables(prop, property_id, supabase);
    let { valorPotencialM2, valorPotencialTotal, valorPotencialMedianM2, comparablesCount } = compResult;

    let oportunidadAjustada: number | null = null;
    if (compResult.oportunidadAjustada != null) {
      oportunidadAjustada = Math.round(compResult.oportunidadAjustada * score * 100) / 100;
    }

    // 4. Calculate user-specific oportunidad_neta (step 7)
    const useCovered = surface_type === "covered";
    const surfaceTotal = prop.surface_total ? Number(prop.surface_total) : null;
    let renovSurface: number | null;
    if (useCovered) {
      const covered = prop.surface_covered ? Number(prop.surface_covered) : null;
      if (covered && surfaceTotal && min_surface_enabled && score < 0.7 && covered < surfaceTotal / 2) {
        renovSurface = Math.round(surfaceTotal / 2);
        console.log(`Min surface floor applied: covered=${covered}, total/2=${renovSurface}`);
      } else {
        renovSurface = covered || surfaceTotal;
      }
    } else {
      renovSurface = surfaceTotal;
    }

    let oportunidadNeta: number | null = null;
    const currentPrice = prop.price ? Number(prop.price) : 0;
    if (currentPrice > 0 && valorPotencialTotal && valorPotencialTotal > 0) {
      const renovCostPerM2 = getRenovationCostPerM2(score, renovation_costs);
      const renovCostTotal = renovCostPerM2 * (renovSurface || surfaceTotal || 0);
      oportunidadNeta = Math.round(valorPotencialTotal - currentPrice - renovCostTotal);
      console.log(`Renov: USD ${renovCostPerM2}/m² (${renovCostTotal} total), Neta: USD ${oportunidadNeta}`);
    }

    // 5. Update shared metrics on properties table (step 8a)
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        valor_potencial_m2: valorPotencialM2,
        valor_potencial_total: valorPotencialTotal,
        comparables_count: comparablesCount,
        oportunidad_ajustada: oportunidadAjustada,
      })
      .eq("id", property_id);

    if (updateError) {
      console.error("Error updating properties:", updateError);
    }

    // 6. Save user-specific data to user_property_analysis (step 8b)
    const userAnalysisData = {
      user_id,
      property_id,
      score_multiplicador: score,
      informe_breve: informe,
      highlights,
      lowlights,
      estado_general: estado,
      valor_potencial_m2: valorPotencialM2,
      valor_potencial_total: valorPotencialTotal,
      valor_potencial_median_m2: valorPotencialMedianM2,
      comparables_count: comparablesCount,
      oportunidad_ajustada: oportunidadAjustada,
      oportunidad_neta: oportunidadNeta,
    };

    const { error: upsertError } = await supabase
      .from("user_property_analysis")
      .upsert(userAnalysisData, { onConflict: "user_id,property_id" });

    if (upsertError) {
      console.error("DB upsert error:", upsertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analysis saved: user=${user_id}, property=${property_id}, score=${score}, comparables=${comparablesCount}, neta=${oportunidadNeta}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          score_multiplicador: score,
          informe_breve: informe,
          highlights,
          lowlights,
          estado_general: estado,
          valor_potencial_m2: valorPotencialM2,
          valor_potencial_total: valorPotencialTotal,
          valor_potencial_median_m2: valorPotencialMedianM2,
          comparables_count: comparablesCount,
          oportunidad_ajustada: oportunidadAjustada,
          oportunidad_neta: oportunidadNeta,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analyze error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
