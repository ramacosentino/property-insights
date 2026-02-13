import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csv, delimiter = ";" } = await req.json();

    if (!csv || typeof csv !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "CSV string is required in 'csv' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse CSV
    const lines = csv.split("\n").filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "CSV must have a header and at least one data row" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip header row
    const dataLines = lines.slice(1);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const rows: Record<string, unknown>[] = [];

      for (const line of batch) {
        const cols = line.split(delimiter);
        if (cols.length < 16) {
          skipped++;
          continue;
        }

        const externalId = cols[1]?.trim();
        if (!externalId) {
          skipped++;
          continue;
        }

        const price = parseNum(cols[2]);
        const pricePerSqm = parseNum(cols[4]);
        if (!price || price <= 0 || !pricePerSqm || pricePerSqm <= 0 || pricePerSqm > 15000) {
          skipped++;
          continue;
        }

        rows.push({
          external_id: externalId,
          popularity: parseNum(cols[0]) ?? 0,
          price,
          currency: cols[3]?.trim() || "USD",
          price_per_sqm: pricePerSqm,
          expenses: parseNum(cols[5]),
          location: cols[6]?.trim() || null,
          neighborhood: cols[7]?.trim() || "Sin barrio",
          province: cols[8]?.trim() || "Sin provincia",
          total_area: parseNum(cols[9]),
          covered_area: parseNum(cols[10]),
          rooms: parseNum(cols[11]),
          bedrooms: parseNum(cols[12]),
          bathrooms: parseNum(cols[13]),
          parking: parseNum(cols[14]),
          url: cols[15]?.trim() || null,
          scraped_at: cols[16]?.trim() ? new Date(cols[16].trim()).toISOString() : new Date().toISOString(),
        });
      }

      if (rows.length === 0) continue;

      // Upsert: on conflict(external_id), update only non-null incoming fields
      const { data, error } = await supabase
        .from("properties")
        .upsert(rows, {
          onConflict: "external_id",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize)}: ${error.message}`);
      } else {
        // We can't easily distinguish insert vs update with upsert,
        // so we count all as processed
        inserted += data?.length || 0;
      }
    }

    console.log(`Upload complete: ${inserted} processed, ${skipped} skipped, ${errors.length} batch errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: inserted,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        total_lines: dataLines.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
