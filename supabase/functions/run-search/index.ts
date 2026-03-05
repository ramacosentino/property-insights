import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // --- Auth: validate JWT and verify user_id ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authenticatedUserId = claimsData.claims.sub as string;
  // --- End auth ---

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { search_id, filters, user_id, surface_type = "total", min_surface_enabled = true, renovation_costs = null } = await req.json();

    // Condition tier ranges for filtering by score_multiplicador
    const CONDITION_RANGES: Record<string, { min: number; max: number }> = {
      excelente: { min: 1.0, max: Infinity },
      buen_estado: { min: 0.9, max: 0.999 },
      aceptable: { min: 0.8, max: 0.899 },
      necesita_mejoras: { min: 0.7, max: 0.799 },
      refaccion_parcial: { min: 0.55, max: 0.699 },
      refaccion_completa: { min: 0, max: 0.549 },
    };

    if (!search_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "search_id and user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user_id matches authenticated user
    if (authenticatedUserId !== user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to filtering
    await supabase.from("search_runs").update({ status: "filtering" }).eq("id", search_id);

    // 1. Build query with filters
    let query = supabase
      .from("properties")
      .select("id, price, price_per_m2_total, surface_total, surface_covered, neighborhood, norm_neighborhood, norm_locality, norm_province, city, property_type, rooms, parking, url, score_multiplicador")
      .gt("price", 0)
      .gt("price_per_m2_total", 0)
      .not("url", "is", null);

    // Apply filters
    if (filters.property_types?.length > 0) {
      query = query.in("property_type", filters.property_types);
    }
    if (filters.neighborhoods?.length > 0) {
      query = query.in("norm_neighborhood", filters.neighborhoods);
    }
    if (filters.excluded_neighborhoods?.length > 0) {
      for (const excluded of filters.excluded_neighborhoods) {
        query = query.neq("norm_neighborhood", excluded);
      }
    }
    if (filters.cities?.length > 0) {
      query = query.in("norm_locality", filters.cities);
    }
    if (filters.price_min != null) {
      query = query.gte("price", filters.price_min);
    }
    if (filters.price_max != null) {
      query = query.lte("price", filters.price_max);
    }
    if (filters.surface_min != null) {
      query = query.gte("surface_total", filters.surface_min);
    }
    if (filters.surface_covered_min != null) {
      query = query.gte("surface_covered", filters.surface_covered_min);
    }
    if (filters.rooms_min != null) {
      query = query.gte("rooms", filters.rooms_min);
    }
    if (filters.rooms_max != null) {
      query = query.lte("rooms", filters.rooms_max);
    }
    if (filters.parking_min != null && filters.parking_min > 0) {
      query = query.gte("parking", filters.parking_min);
    }

    // Fetch all matching (paginated)
    const allMatched: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await query.range(from, from + pageSize - 1);
      if (error) {
        console.error("Query error:", error);
        break;
      }
      if (data) allMatched.push(...data);
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }

    console.log(`Filtered: ${allMatched.length} properties matched`);

    // 2. Compute medians via Postgres RPC (much faster than in-memory)
    const groupKey = (p: any) => `${p.norm_neighborhood || p.neighborhood}|||${p.property_type || ""}`;

    const { data: medianRows, error: medianErr } = await supabase.rpc("neighborhood_medians", {
      p_neighborhoods: filters.neighborhoods?.length > 0 ? filters.neighborhoods : null,
      p_property_types: filters.property_types?.length > 0 ? filters.property_types : null,
      p_price_min: filters.price_min ?? null,
      p_price_max: filters.price_max ?? null,
      p_surface_min: filters.surface_min ?? null,
      p_rooms_min: filters.rooms_min ?? null,
      p_rooms_max: filters.rooms_max ?? null,
      p_parking_min: filters.parking_min ?? null,
      p_cities: filters.cities?.length > 0 ? filters.cities : null,
      p_excluded_neighborhoods: filters.excluded_neighborhoods?.length > 0 ? filters.excluded_neighborhoods : null,
    });

    if (medianErr) {
      console.error("Median RPC error:", medianErr);
    }

    const groupMedians = new Map<string, number>();
    for (const row of medianRows || []) {
      const key = `${row.group_neighborhood}|||${row.group_property_type}`;
      groupMedians.set(key, Number(row.median_price_m2));
    }

    // Score each property: % below median (higher = better opportunity)
    const scored = allMatched.map((p) => {
      const med = groupMedians.get(groupKey(p)) || 0;
      const ppm2 = Number(p.price_per_m2_total);
      const pctBelow = med > 0 ? ((med - ppm2) / med) * 100 : 0;
      return { ...p, pctBelow };
    });

    // Sort by opportunity (highest pctBelow first)
    scored.sort((a, b) => b.pctBelow - a.pctBelow);

    // Filter by budget_max if provided (price + estimated renovation) with 10% tolerance
    let candidates = scored;
    if (filters.budget_max != null) {
      const budgetWithTolerance = filters.budget_max * 1.10;

      const estimateRenovCost = (price_per_m2: number, median: number, surface: number) => {
        const ratio = median > 0 ? price_per_m2 / median : 1;
        let costPerM2 = 0;
        if (ratio >= 1.0) costPerM2 = 0;
        else if (ratio >= 0.85) costPerM2 = 200;
        else if (ratio >= 0.7) costPerM2 = 350;
        else costPerM2 = 500;
        
        if (renovation_costs && Object.keys(renovation_costs).length > 0) {
          const score = ratio;
          const thresholds = Object.entries(renovation_costs)
            .map(([k, v]) => ({ min: parseFloat(k), cost: Number(v) }))
            .filter(t => !isNaN(t.min) && !isNaN(t.cost))
            .sort((a, b) => b.min - a.min);
          for (const t of thresholds) {
            if (score >= t.min) { costPerM2 = t.cost; break; }
          }
          if (thresholds.length > 0 && score < thresholds[thresholds.length - 1].min) {
            costPerM2 = thresholds[thresholds.length - 1].cost;
          }
        }
        return costPerM2 * surface;
      };

      candidates = scored.filter((p) => {
        const price = Number(p.price);
        const surface = Number(p.surface_total) || 0;
        const med = groupMedians.get(groupKey(p)) || 0;
        const renovCost = estimateRenovCost(Number(p.price_per_m2_total), med, surface);
        return (price + renovCost) <= budgetWithTolerance;
      });
    }

    // Take top 5% (min 10, max 15)
    const totalCandidates = candidates.length;
    let topCount = Math.ceil(totalCandidates * 0.05);
    topCount = Math.max(10, Math.min(20, topCount));
    topCount = Math.min(topCount, totalCandidates);
    const topCandidates = candidates.slice(0, topCount);

    console.log(`Selected ${topCandidates.length} candidates from ${totalCandidates}`);

    // 3. Check which candidates already have analysis (reuse)
    const candidateIds = topCandidates.map((c) => c.id);
    const { data: existingAnalyses } = await supabase
      .from("user_property_analysis")
      .select("property_id")
      .eq("user_id", user_id)
      .in("property_id", candidateIds);

    const alreadyAnalyzed = new Set((existingAnalyses || []).map((a: any) => a.property_id));
    const needsAnalysis = topCandidates.filter((c) => !alreadyAnalyzed.has(c.id));

    console.log(`Reusing ${alreadyAnalyzed.size} existing analyses, need to analyze ${needsAnalysis.length}`);

    await supabase.from("search_runs").update({
      status: "analyzing",
      total_matched: allMatched.length,
      candidates_count: topCandidates.length,
      analyzed_count: alreadyAnalyzed.size,
    }).eq("id", search_id);

    // 4. Analyze in parallel batches of 5
    let analyzedCount = alreadyAnalyzed.size;
    const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-property`;
    const BATCH_SIZE = 5;

    for (let i = 0; i < needsAnalysis.length; i += BATCH_SIZE) {
      const batch = needsAnalysis.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((candidate) =>
          fetch(analyzeUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              property_id: candidate.id,
              user_id,
              surface_type,
              min_surface_enabled,
              renovation_costs,
            }),
          })
        )
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value.ok) {
          analyzedCount++;
        } else {
          const reason = r.status === "rejected" ? r.reason : `status ${(r as any).value?.status}`;
          console.error(`Analysis failed:`, reason);
        }
      }

      await supabase.from("search_runs").update({
        analyzed_count: analyzedCount,
      }).eq("id", search_id);
    }

    // 6. Fetch analyses and rank by oportunidad_neta
    const { data: analyses } = await supabase
      .from("user_property_analysis")
      .select("property_id, oportunidad_neta")
      .eq("user_id", user_id)
      .in("property_id", candidateIds);

    const analysisMap = new Map((analyses || []).map((a: any) => [a.property_id, a.oportunidad_neta]));

    // Sort by oportunidad_neta descending, take top 10
    const ranked = candidateIds
      .map((id) => ({ id, neta: analysisMap.get(id) ?? -Infinity }))
      .sort((a, b) => (b.neta as number) - (a.neta as number))
      .slice(0, 10)
      .map((r) => r.id);

    // 7. Update search run as completed
    await supabase.from("search_runs").update({
      status: "completed",
      analyzed_count: analyzedCount,
      result_property_ids: ranked,
      completed_at: new Date().toISOString(),
    }).eq("id", search_id);

    console.log(`Search ${search_id} completed: ${ranked.length} results`);

    return new Response(
      JSON.stringify({ success: true, result_property_ids: ranked }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);

    // Try to mark as failed
    try {
      const { search_id } = await req.clone().json();
      if (search_id) {
        await supabase.from("search_runs").update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        }).eq("id", search_id);
      }
    } catch {}

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
