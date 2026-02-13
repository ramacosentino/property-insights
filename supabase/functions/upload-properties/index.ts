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

function trimOrNull(val: string | undefined): string | null {
  if (!val) return null;
  const t = val.trim();
  return t === "" ? null : t;
}

// CSV column order (header-based mapping)
const HEADER_MAP: Record<string, string> = {
  external_id: "external_id",
  property_type: "property_type",
  title: "title",
  url: "url",
  price: "price",
  currency: "currency",
  location: "location",
  neighborhood: "neighborhood",
  city: "city",
  scraped_at: "scraped_at",
  address: "address",
  street: "street",
  expenses: "expenses",
  description: "description",
  surface_total: "surface_total",
  surface_covered: "surface_covered",
  rooms: "rooms",
  bathrooms: "bathrooms",
  parking: "parking",
  bedrooms: "bedrooms",
  age_years: "age_years",
  price_per_m2_total: "price_per_m2_total",
  price_per_m2_covered: "price_per_m2_covered",
  toilettes: "toilettes",
  disposition: "disposition",
  orientation: "orientation",
  luminosity: "luminosity",
};

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

    const lines = csv.split("\n").filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "CSV must have a header and at least one data row" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse header to get column indices
    const headerLine = lines[0].replace(/^\uFEFF/, ""); // strip BOM
    const headers = headerLine.split(delimiter).map((h: string) => h.trim().toLowerCase());
    const colIndex = new Map<string, number>();
    headers.forEach((h: string, i: number) => {
      if (HEADER_MAP[h]) colIndex.set(HEADER_MAP[h], i);
    });

    const getCol = (row: string[], col: string): string | undefined => {
      const idx = colIndex.get(col);
      return idx !== undefined ? row[idx] : undefined;
    };

    const dataLines = lines.slice(1);
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    const batchSize = 100;
    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const rows: Record<string, unknown>[] = [];

      for (const line of batch) {
        const cols = line.split(delimiter);
        const externalId = trimOrNull(getCol(cols, "external_id"));
        if (!externalId) {
          skipped++;
          continue;
        }

        const price = parseNum(getCol(cols, "price"));
        if (!price || price <= 0) {
          skipped++;
          continue;
        }

        const row: Record<string, unknown> = {
          external_id: externalId,
          price,
          currency: trimOrNull(getCol(cols, "currency")) || "USD",
          url: trimOrNull(getCol(cols, "url")),
          location: trimOrNull(getCol(cols, "location")),
          neighborhood: trimOrNull(getCol(cols, "neighborhood")) || "Sin barrio",
          city: trimOrNull(getCol(cols, "city")) || "Sin ciudad",
          property_type: trimOrNull(getCol(cols, "property_type")),
          title: trimOrNull(getCol(cols, "title")),
          address: trimOrNull(getCol(cols, "address")),
          street: trimOrNull(getCol(cols, "street")),
          expenses: parseNum(getCol(cols, "expenses")),
          description: trimOrNull(getCol(cols, "description")),
          surface_total: parseNum(getCol(cols, "surface_total")),
          surface_covered: parseNum(getCol(cols, "surface_covered")),
          rooms: parseNum(getCol(cols, "rooms")),
          bedrooms: parseNum(getCol(cols, "bedrooms")),
          bathrooms: parseNum(getCol(cols, "bathrooms")),
          toilettes: parseNum(getCol(cols, "toilettes")),
          parking: parseNum(getCol(cols, "parking")),
          age_years: parseNum(getCol(cols, "age_years")),
          disposition: trimOrNull(getCol(cols, "disposition")),
          orientation: trimOrNull(getCol(cols, "orientation")),
          luminosity: trimOrNull(getCol(cols, "luminosity")),
          price_per_m2_total: parseNum(getCol(cols, "price_per_m2_total")),
          price_per_m2_covered: parseNum(getCol(cols, "price_per_m2_covered")),
          scraped_at: getCol(cols, "scraped_at")?.trim()
            ? new Date(getCol(cols, "scraped_at")!.trim()).toISOString()
            : new Date().toISOString(),
        };

        rows.push(row);
      }

      if (rows.length === 0) continue;

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
