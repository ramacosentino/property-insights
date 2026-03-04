import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Batch analyze test: picks N properties below their neighborhood median
 * that don't have analysis yet, and analyzes them one by one.
 * Admin-only. Reports timing and credit consumption.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth: require admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  const supabase = createClient(supabaseUrl, serviceKey);

  // Verify admin role
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { limit = 10, dry_run = false } = await req.json().catch(() => ({}));
    const batchLimit = Math.min(limit, 50);

    console.log(`Batch analyze test: limit=${batchLimit}, dry_run=${dry_run}`);

    // 1. Get neighborhood medians (all neighborhoods, all property types)
    const { data: medianRows, error: medianErr } = await supabase.rpc("neighborhood_medians", {});
    if (medianErr) {
      throw new Error(`Median RPC error: ${medianErr.message}`);
    }

    const groupMedians = new Map<string, number>();
    for (const row of medianRows || []) {
      const key = `${row.group_neighborhood}|||${row.group_property_type}`;
      groupMedians.set(key, Number(row.median_price_m2));
    }
    console.log(`Loaded ${groupMedians.size} group medians`);

    // 2. Find properties below median without analysis (score_multiplicador IS NULL)
    const pageSize = 1000;
    const candidates: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore && candidates.length < batchLimit * 3) {
      const { data, error } = await supabase
        .from("properties")
        .select("id, price_per_m2_total, norm_neighborhood, neighborhood, property_type, url, price, surface_total, score_multiplicador")
        .gt("price", 0)
        .gt("price_per_m2_total", 0)
        .not("url", "is", null)
        .is("score_multiplicador", null)
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Query error:", error);
        break;
      }
      if (data) {
        // Filter: only those below their group median
        for (const p of data) {
          const key = `${p.norm_neighborhood || p.neighborhood}|||${p.property_type || ""}`;
          const med = groupMedians.get(key);
          if (med && Number(p.price_per_m2_total) < med) {
            candidates.push({ ...p, median: med, pctBelow: ((med - Number(p.price_per_m2_total)) / med) * 100 });
          }
        }
      }
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }

    // Sort by biggest opportunity first
    candidates.sort((a, b) => b.pctBelow - a.pctBelow);
    const selected = candidates.slice(0, batchLimit);

    console.log(`Found ${candidates.length} candidates below median, selected ${selected.length} for analysis`);

    if (dry_run) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          total_candidates: candidates.length,
          selected: selected.map((s) => ({
            id: s.id,
            price: s.price,
            price_per_m2: s.price_per_m2_total,
            median: s.median,
            pct_below: Math.round(s.pctBelow * 100) / 100,
            neighborhood: s.norm_neighborhood || s.neighborhood,
            type: s.property_type,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Analyze each one, tracking time and results
    const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-property`;
    const results: any[] = [];
    const startTime = Date.now();

    for (let i = 0; i < selected.length; i++) {
      const prop = selected[i];
      const propStart = Date.now();
      console.log(`[${i + 1}/${selected.length}] Analyzing ${prop.id} (${prop.norm_neighborhood || prop.neighborhood}, ${prop.property_type})...`);

      try {
        const resp = await fetch(analyzeUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_id: prop.id,
            user_id: userId,
            surface_type: "total",
            min_surface_enabled: true,
          }),
        });

        const data = await resp.json();
        const elapsed = Date.now() - propStart;

        results.push({
          id: prop.id,
          status: resp.ok ? "success" : "error",
          http_status: resp.status,
          elapsed_ms: elapsed,
          reused: data.reused || false,
          score: data.analysis?.score_multiplicador || null,
          oportunidad_neta: data.analysis?.oportunidad_neta || null,
          error: data.error || null,
          pct_below_median: Math.round(prop.pctBelow * 100) / 100,
        });

        console.log(`  → ${resp.ok ? "OK" : "FAIL"} in ${elapsed}ms (score=${data.analysis?.score_multiplicador || "N/A"})`);
      } catch (err) {
        const elapsed = Date.now() - propStart;
        results.push({
          id: prop.id,
          status: "error",
          elapsed_ms: elapsed,
          error: err instanceof Error ? err.message : "Unknown",
        });
        console.error(`  → Error in ${elapsed}ms:`, err);
      }

      // Small delay between requests to avoid rate limiting
      if (i < selected.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const totalElapsed = Date.now() - startTime;
    const succeeded = results.filter((r) => r.status === "success").length;
    const newAnalyses = results.filter((r) => r.status === "success" && !r.reused).length;
    const reused = results.filter((r) => r.status === "success" && r.reused).length;
    const failed = results.filter((r) => r.status === "error").length;
    const avgTime = results.length > 0
      ? Math.round(results.reduce((s, r) => s + (r.elapsed_ms || 0), 0) / results.length)
      : 0;

    const summary = {
      success: true,
      total_processed: results.length,
      succeeded,
      new_analyses: newAnalyses,
      reused,
      failed,
      total_elapsed_ms: totalElapsed,
      avg_elapsed_ms: avgTime,
      estimated_full_batch_hours: Math.round((avgTime * candidates.length) / 3600000 * 100) / 100,
      total_candidates_available: candidates.length,
      results,
    };

    console.log(`Batch complete: ${succeeded}/${results.length} ok, ${newAnalyses} new, ${reused} reused, ${failed} failed in ${totalElapsed}ms`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Batch error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
