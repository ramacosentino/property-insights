import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface PropertyRow {
  neighborhood: string;
  norm_neighborhood: string | null;
  norm_locality: string | null;
  city: string | null;
  property_type: string | null;
  price: number | null;
  price_per_m2_total: number | null;
  price_per_m2_covered: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    // Allow specifying year_month, default to previous month
    let yearMonth = body.year_month as string | undefined;
    if (!yearMonth) {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      yearMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    }

    console.log(`Computing monthly snapshot for ${yearMonth}...`);

    // Fetch ALL active properties (paginated)
    const allRows: PropertyRow[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("properties")
        .select("neighborhood, norm_neighborhood, norm_locality, city, property_type, price, price_per_m2_total, price_per_m2_covered")
        .eq("status", "active")
        .gt("price", 0)
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Error fetching properties:", error);
        break;
      }
      if (data) allRows.push(...(data as unknown as PropertyRow[]));
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }

    console.log(`Fetched ${allRows.length} active properties`);

    // Group by neighborhood (using norm_neighborhood if available) + property_type
    // We compute stats for each (neighborhood, type) pair AND a combined (neighborhood, null) entry
    type GroupKey = string; // "neighborhood|||type" or "neighborhood|||__all__"
    const groups = new Map<GroupKey, { neighborhood: string; city: string; propertyType: string | null; rows: PropertyRow[] }>();

    for (const row of allRows) {
      const nbh = row.norm_neighborhood || row.neighborhood || "Sin barrio";
      const city = row.norm_locality || row.city || "";
      const type = row.property_type || "otro";

      // Per type
      const typeKey = `${nbh}|||${type}`;
      if (!groups.has(typeKey)) groups.set(typeKey, { neighborhood: nbh, city, propertyType: type, rows: [] });
      groups.get(typeKey)!.rows.push(row);

      // Combined (all types)
      const allKey = `${nbh}|||__all__`;
      if (!groups.has(allKey)) groups.set(allKey, { neighborhood: nbh, city, propertyType: null, rows: [] });
      groups.get(allKey)!.rows.push(row);
    }

    // Compute stats per group
    const statsRows: Record<string, unknown>[] = [];
    for (const [, group] of groups) {
      const pm2t = group.rows.map(r => r.price_per_m2_total).filter((v): v is number => v != null && v > 0);
      const pm2c = group.rows.map(r => r.price_per_m2_covered).filter((v): v is number => v != null && v > 0);
      const prices = group.rows.map(r => r.price).filter((v): v is number => v != null && v > 0);

      statsRows.push({
        year_month: yearMonth,
        neighborhood: group.neighborhood,
        city: group.city,
        property_type: group.propertyType,
        property_count: group.rows.length,
        median_price_m2_total: pm2t.length > 0 ? Math.round(median(pm2t) * 100) / 100 : null,
        avg_price_m2_total: pm2t.length > 0 ? Math.round(avg(pm2t) * 100) / 100 : null,
        median_price_m2_covered: pm2c.length > 0 ? Math.round(median(pm2c) * 100) / 100 : null,
        avg_price_m2_covered: pm2c.length > 0 ? Math.round(avg(pm2c) * 100) / 100 : null,
        median_price_total: prices.length > 0 ? Math.round(median(prices)) : null,
        avg_price_total: prices.length > 0 ? Math.round(avg(prices)) : null,
        min_price_m2_total: pm2t.length > 0 ? Math.min(...pm2t) : null,
        max_price_m2_total: pm2t.length > 0 ? Math.max(...pm2t) : null,
      });
    }

    // Upsert in batches
    let upserted = 0;
    const batchSize = 100;
    for (let i = 0; i < statsRows.length; i += batchSize) {
      const batch = statsRows.slice(i, i + batchSize);
      const { error } = await supabase
        .from("monthly_neighborhood_stats")
        .upsert(batch, { onConflict: "year_month,neighborhood,property_type" });
      if (error) {
        console.error(`Batch upsert error:`, error);
      } else {
        upserted += batch.length;
      }
    }

    console.log(`Snapshot complete: ${upserted} stat rows for ${yearMonth}`);

    return new Response(
      JSON.stringify({ success: true, year_month: yearMonth, neighborhoods: groups.size, stats_rows: upserted, properties_counted: allRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Snapshot error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
