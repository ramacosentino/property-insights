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

function parseCSV(csv: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < csv.length) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === delimiter) {
        current.push(field);
        field = "";
        i++;
      } else if (ch === '\r') {
        i++;
      } else if (ch === '\n') {
        current.push(field);
        field = "";
        if (current.some(c => c.trim() !== "")) rows.push(current);
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field || current.length > 0) {
    current.push(field);
    if (current.some(c => c.trim() !== "")) rows.push(current);
  }

  return rows;
}

const HEADER_MAP: Record<string, string> = {
  external_id: "external_id", property_type: "property_type", title: "title",
  url: "url", price: "price", currency: "currency", location: "location",
  neighborhood: "neighborhood", city: "city", scraped_at: "scraped_at",
  address: "address", street: "street", expenses: "expenses",
  description: "description", surface_total: "surface_total",
  surface_covered: "surface_covered", rooms: "rooms", bathrooms: "bathrooms",
  parking: "parking", bedrooms: "bedrooms", age_years: "age_years",
  price_per_m2_total: "price_per_m2_total", price_per_m2_covered: "price_per_m2_covered",
  toilettes: "toilettes", disposition: "disposition", orientation: "orientation",
  luminosity: "luminosity", source: "source",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // --- Auth: require admin JWT OR static API key ---
  const authHeader = req.headers.get("Authorization");
  const apiKey = req.headers.get("x-api-key");
  const uploadApiKey = Deno.env.get("UPLOAD_API_KEY");

  let authenticated = false;

  // Method 1: Static API key
  if (apiKey && uploadApiKey && apiKey === uploadApiKey) {
    authenticated = true;
  }

  // Method 2: JWT + admin role
  if (!authenticated) {
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized: provide Authorization Bearer token or x-api-key header" }), {
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
    const userId = claimsData.claims.sub as string;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  // --- End auth ---

  try {
    const { csv, delimiter = ";", source = "api", filename, log_id } = await req.json();

    if (!csv || typeof csv !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "CSV string is required in 'csv' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allRows = parseCSV(csv, delimiter);

    if (allRows.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "CSV must have a header and at least one data row" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = allRows[0].map((h: string) => h.trim().toLowerCase().replace(/^\uFEFF/, ""));
    const colIndex = new Map<string, number>();
    headers.forEach((h: string, i: number) => {
      if (HEADER_MAP[h]) colIndex.set(HEADER_MAP[h], i);
    });

    const getCol = (row: string[], col: string): string | undefined => {
      const idx = colIndex.get(col);
      return idx !== undefined ? row[idx] : undefined;
    };

    const dataRows = allRows.slice(1);
    let inserted = 0;
    let skipped = 0;
    let merged = 0;
    const errors: string[] = [];

    const batchSize = 100;
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize);
      const rows: Record<string, unknown>[] = [];

      for (const cols of batch) {
        const externalId = trimOrNull(getCol(cols, "external_id"));
        if (!externalId) { skipped++; continue; }
        const price = parseNum(getCol(cols, "price"));
        if (!price || price <= 0) { skipped++; continue; }

        const address = trimOrNull(getCol(cols, "address"));
        const street = trimOrNull(getCol(cols, "street")) || address;
        const surfaceCovered = parseNum(getCol(cols, "surface_covered"));
        const surfaceTotal = parseNum(getCol(cols, "surface_total"));
        const propertyType = trimOrNull(getCol(cols, "property_type"));
        const url = trimOrNull(getCol(cols, "url"));

        // --- Cross-portal duplicate detection ---
        // Match by: address + property_type + precio ±5% + superficie exacta
        if (address && propertyType) {
          const surface = surfaceCovered || surfaceTotal;
          const priceLow = price * 0.95;
          const priceHigh = price * 1.05;

          let query = supabase
            .from("properties")
            .select("id, url, alt_urls, external_id")
            .neq("external_id", externalId)
            .eq("property_type", propertyType)
            .ilike("address", address)
            .gte("price", priceLow)
            .lte("price", priceHigh);

          if (surface && surface > 0) {
            if (surfaceCovered) {
              query = query.eq("surface_covered", surfaceCovered);
            } else if (surfaceTotal) {
              query = query.eq("surface_total", surfaceTotal);
            }
          }

          const { data: duplicates } = await query.limit(1);

          if (duplicates && duplicates.length > 0 && url) {
            const dup = duplicates[0];
            // Merge: add this URL to alt_urls of existing property
            const existingAltUrls: string[] = (dup.alt_urls as string[]) || [];
            const existingUrl = dup.url as string || "";
            // Don't add if already present
            if (url !== existingUrl && !existingAltUrls.includes(url)) {
              const newAltUrls = [...existingAltUrls, url];
              await supabase
                .from("properties")
                .update({ alt_urls: newAltUrls })
                .eq("id", dup.id);
              console.log(`Merged duplicate: ${externalId} → existing ${dup.external_id} (added alt_url)`);
              merged++;
            } else {
              console.log(`Duplicate already merged: ${externalId} → ${dup.external_id}`);
              skipped++;
            }
            continue; // skip inserting this row
          }
        }

        rows.push({
          external_id: externalId,
          price,
          currency: trimOrNull(getCol(cols, "currency")) || "USD",
          url,
          location: trimOrNull(getCol(cols, "location")),
          neighborhood: trimOrNull(getCol(cols, "neighborhood")) || "Sin barrio",
          city: trimOrNull(getCol(cols, "city")) || "Sin ciudad",
          property_type: propertyType,
          title: trimOrNull(getCol(cols, "title")),
          address,
          street,
          expenses: parseNum(getCol(cols, "expenses")),
          description: trimOrNull(getCol(cols, "description")),
          surface_total: surfaceTotal,
          surface_covered: surfaceCovered,
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
          source: trimOrNull(getCol(cols, "source")),
          scraped_at: getCol(cols, "scraped_at")?.trim()
            ? new Date(getCol(cols, "scraped_at")!.trim()).toISOString()
            : new Date().toISOString(),
        });
      }

      if (rows.length === 0) continue;

      const { data, error } = await supabase
        .from("properties")
        .upsert(rows, { onConflict: "external_id", ignoreDuplicates: false })
        .select("id");

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize)}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    console.log(`Upload complete: ${inserted} processed, ${merged} merged, ${skipped} skipped, ${errors.length} batch errors`);

    // Store CSV file in storage bucket
    let fileUrl: string | null = null;
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = (filename || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${timestamp}_${safeName}`;
      const { error: storageError } = await supabase.storage
        .from("upload-csvs")
        .upload(storagePath, csv, { contentType: "text/csv", upsert: false });
      if (!storageError) {
        fileUrl = storagePath;
      } else {
        console.error("CSV storage error:", storageError.message);
      }
    } catch (e) {
      console.error("CSV storage exception:", e);
    }

    // Log to upload_logs if log_id provided (update existing) or create new
    const logData = {
      finished_at: new Date().toISOString(),
      source: source || "manual",
      status: errors.length > 0 ? (inserted > 0 ? "partial" : "error") : "success",
      total_rows: dataRows.length,
      processed: inserted,
      skipped: skipped + merged,
      errors: errors.length > 0 ? errors : null,
      filename: filename || null,
      file_url: fileUrl,
    };

    if (log_id) {
      const { data: existing } = await supabase
        .from("upload_logs")
        .select("processed, skipped, total_rows, errors")
        .eq("id", log_id)
        .single();

      if (existing) {
        const prevErrors = (existing.errors as string[]) || [];
        const updatePayload: Record<string, unknown> = {
          finished_at: logData.finished_at,
          processed: (existing.processed || 0) + inserted,
          skipped: (existing.skipped || 0) + skipped + merged,
          total_rows: (existing.total_rows || 0) + dataRows.length,
          status: errors.length > 0 ? "partial" : logData.status,
          errors: [...prevErrors, ...errors].length > 0 ? [...prevErrors, ...errors] : null,
        };
        if (fileUrl) updatePayload.file_url = fileUrl;
        await supabase
          .from("upload_logs")
          .update(updatePayload)
          .eq("id", log_id);
      }
    } else {
      await supabase.from("upload_logs").insert(logData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: inserted,
        merged,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        total_lines: dataRows.length,
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
