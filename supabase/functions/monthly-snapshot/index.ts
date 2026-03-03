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

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const squareDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
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
  surface_total: number | null;
  surface_covered: number | null;
  expenses: number | null;
  scraped_at: string | null;
  status: string;
  removed_at: string | null;
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
    let yearMonth = body.year_month as string | undefined;
    if (!yearMonth) {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      yearMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    }

    // Parse year_month to get date range for "new this month" and "removed this month"
    const [ym_year, ym_month] = yearMonth.split("-").map(Number);
    const monthStart = new Date(ym_year, ym_month - 1, 1).toISOString();
    const monthEnd = new Date(ym_year, ym_month, 1).toISOString();

    console.log(`Computing monthly snapshot for ${yearMonth}...`);

    // Fetch ALL active properties (paginated)
    const allRows: PropertyRow[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("properties")
        .select("neighborhood, norm_neighborhood, norm_locality, city, property_type, price, price_per_m2_total, price_per_m2_covered, surface_total, surface_covered, expenses, scraped_at, status, removed_at")
        .or(`status.eq.active,and(status.eq.removed,removed_at.gte.${monthStart})`)
        .gt("price", 0)
        .range(from, from + pageSize - 1);

      if (error) { console.error("Error fetching:", error); break; }
      if (data) allRows.push(...(data as unknown as PropertyRow[]));
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }

    console.log(`Fetched ${allRows.length} properties for snapshot`);

    type GroupKey = string;
    const groups = new Map<GroupKey, { neighborhood: string; city: string; propertyType: string | null; rows: PropertyRow[] }>();

    for (const row of allRows) {
      const nbh = row.norm_neighborhood || row.neighborhood || "Sin barrio";
      const city = row.norm_locality || row.city || "";
      const type = row.property_type || "otro";

      const typeKey = `${nbh}|||${type}`;
      if (!groups.has(typeKey)) groups.set(typeKey, { neighborhood: nbh, city, propertyType: type, rows: [] });
      groups.get(typeKey)!.rows.push(row);

      const allKey = `${nbh}|||__all__`;
      if (!groups.has(allKey)) groups.set(allKey, { neighborhood: nbh, city, propertyType: null, rows: [] });
      groups.get(allKey)!.rows.push(row);
    }

    const statsRows: Record<string, unknown>[] = [];
    for (const [, group] of groups) {
      const pm2t = group.rows.map(r => r.price_per_m2_total).filter((v): v is number => v != null && v > 0);
      const pm2c = group.rows.map(r => r.price_per_m2_covered).filter((v): v is number => v != null && v > 0);
      const prices = group.rows.map(r => r.price).filter((v): v is number => v != null && v > 0);
      const surfTot = group.rows.map(r => r.surface_total).filter((v): v is number => v != null && v > 0);
      const surfCov = group.rows.map(r => r.surface_covered).filter((v): v is number => v != null && v > 0);
      const exps = group.rows.map(r => r.expenses).filter((v): v is number => v != null && v > 0);

      // New listings this month (scraped_at within the month)
      const newCount = group.rows.filter(r => r.scraped_at && r.scraped_at >= monthStart && r.scraped_at < monthEnd).length;

      // Removed this month
      const removedCount = group.rows.filter(r => r.status === "removed" && r.removed_at && r.removed_at >= monthStart && r.removed_at < monthEnd).length;

      // Days on market for removed properties this month
      const daysOnMarket: number[] = [];
      for (const r of group.rows) {
        if (r.status === "removed" && r.removed_at && r.scraped_at) {
          const days = (new Date(r.removed_at).getTime() - new Date(r.scraped_at).getTime()) / (1000 * 60 * 60 * 24);
          if (days > 0 && days < 365) daysOnMarket.push(days);
        }
      }

      statsRows.push({
        year_month: yearMonth,
        neighborhood: group.neighborhood,
        city: group.city,
        property_type: group.propertyType,
        property_count: group.rows.length,
        // Price per m2 total
        median_price_m2_total: pm2t.length > 0 ? round2(median(pm2t)) : null,
        avg_price_m2_total: pm2t.length > 0 ? round2(avg(pm2t)) : null,
        min_price_m2_total: pm2t.length > 0 ? Math.min(...pm2t) : null,
        max_price_m2_total: pm2t.length > 0 ? Math.max(...pm2t) : null,
        percentile_25_m2_total: pm2t.length > 0 ? round2(percentile(pm2t, 25)) : null,
        percentile_75_m2_total: pm2t.length > 0 ? round2(percentile(pm2t, 75)) : null,
        stddev_m2_total: pm2t.length > 1 ? round2(stddev(pm2t)) : null,
        // Price per m2 covered
        median_price_m2_covered: pm2c.length > 0 ? round2(median(pm2c)) : null,
        avg_price_m2_covered: pm2c.length > 0 ? round2(avg(pm2c)) : null,
        percentile_25_m2_covered: pm2c.length > 0 ? round2(percentile(pm2c, 25)) : null,
        percentile_75_m2_covered: pm2c.length > 0 ? round2(percentile(pm2c, 75)) : null,
        stddev_m2_covered: pm2c.length > 1 ? round2(stddev(pm2c)) : null,
        // Price total
        median_price_total: prices.length > 0 ? Math.round(median(prices)) : null,
        avg_price_total: prices.length > 0 ? Math.round(avg(prices)) : null,
        // Surface
        median_surface_total: surfTot.length > 0 ? round2(median(surfTot)) : null,
        median_surface_covered: surfCov.length > 0 ? round2(median(surfCov)) : null,
        // Expenses
        median_expenses: exps.length > 0 ? round2(median(exps)) : null,
        // Market dynamics
        new_listings_count: newCount,
        removed_count: removedCount,
        avg_days_on_market: daysOnMarket.length > 0 ? round2(avg(daysOnMarket)) : null,
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
