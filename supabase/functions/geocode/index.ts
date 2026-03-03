import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DELAY_MS = 100; // Google allows ~50 req/sec, but we stay conservative

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean address for geocoding:
 * - Remove "al" between street name and number ("Potosí al 800" → "Potosí 800")
 * - Remove "entre X y Z" clauses
 * - Remove floor/dept info (e.g. "2º A", "Piso 3", "Depto B")
 * - Normalize whitespace
 */
function cleanAddress(raw: string): string {
  let s = raw;
  s = s.replace(/\bal\s+(\d)/gi, "$1");
  s = s.replace(/\bentre\s+.+?\s+[ye]\s+\S+/gi, "");
  s = s.replace(/\b(piso|depto|dpto|departamento|unidad)\s*\S*/gi, "");
  s = s.replace(/\d+[°º]\s*[A-Za-z]?\b/g, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/,\s*$/, "");
  return s;
}

function extractNormalizedGeo(components: any[]): {
  norm_neighborhood: string | null;
  norm_locality: string | null;
  norm_province: string | null;
} {
  if (!components || !Array.isArray(components)) {
    return { norm_neighborhood: null, norm_locality: null, norm_province: null };
  }

  let norm_neighborhood: string | null = null;
  let norm_locality: string | null = null;
  let norm_province: string | null = null;
  let adminLevel1: string | null = null;
  let adminLevel2: string | null = null;
  let rawLocality: string | null = null;

  for (const c of components) {
    const types: string[] = c.types || [];
    if (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood")) {
      norm_neighborhood = norm_neighborhood || c.long_name;
    }
    if (types.includes("locality")) {
      rawLocality = c.long_name;
    }
    if (types.includes("administrative_area_level_1")) {
      adminLevel1 = c.long_name;
    }
    if (types.includes("administrative_area_level_2")) {
      adminLevel2 = c.long_name;
    }
  }

  // Province: normalize CABA variants
  const isCaba = adminLevel1 === "Ciudad Autónoma de Buenos Aires" ||
    adminLevel1 === "Cdad. Autónoma de Buenos Aires" ||
    adminLevel1 === "CABA";

  norm_province = adminLevel1;

  if (isCaba) {
    // For CABA: locality is always "Buenos Aires", Google often returns postal code as locality
    norm_locality = "Buenos Aires";
    norm_province = "Ciudad Autónoma de Buenos Aires";
  } else if (rawLocality && !/^[A-Z]\d{3,}/.test(rawLocality)) {
    // Normal locality (not a postal code pattern)
    norm_locality = rawLocality;
  } else if (adminLevel2) {
    // Fallback to partido/department if locality looks like postal code
    norm_locality = adminLevel2;
  } else {
    norm_locality = rawLocality;
  }

  return { norm_neighborhood, norm_locality, norm_province };
}

/**
 * Paginated fetch of all rows from a table/query.
 */
async function fetchAllRows(supabase: any, table: string, select: string, filters?: (q: any) => any): Promise<any[]> {
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (filters) query = filters(query);
    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${table} (offset ${from}):`, error);
      break;
    }

    allRows.push(...(data || []));
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allRows;
}

/**
 * Auto-seed: find properties whose address is not yet in geocoded_addresses and insert them.
 */
async function autoSeedMissingAddresses(supabase: any): Promise<number> {
  const allProps = await fetchAllRows(supabase, "properties", "address, neighborhood, city", (q: any) => q.not("address", "is", null));

  if (allProps.length === 0) return 0;

  const existingRows = await fetchAllRows(supabase, "geocoded_addresses", "address");
  const existingSet = new Set(existingRows.map((r: any) => r.address));

  const toInsertMap = new Map<string, any>();
  for (const p of allProps) {
    if (p.address && !existingSet.has(p.address) && !toInsertMap.has(p.address)) {
      toInsertMap.set(p.address, {
        address: p.address,
        neighborhood: p.neighborhood,
        province: p.city,
        lat: null,
        lng: null,
        source: "pending",
      });
    }
  }

  const toInsert = Array.from(toInsertMap.values());
  if (toInsert.length === 0) return 0;

  let seeded = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500);
    const { error } = await supabase
      .from("geocoded_addresses")
      .upsert(batch, { onConflict: "address" });
    if (error) {
      console.error("Error seeding batch:", error);
    } else {
      seeded += batch.length;
    }
  }

  console.log(`Auto-seeded ${seeded} new addresses into geocoded_addresses`);
  return seeded;
}

/**
 * Geocode a single address using Google Maps Geocoding API.
 * Returns { lat, lng, address_components, formatted_address } or null.
 */
async function geocodeWithGoogle(
  query: string,
  apiKey: string,
  bounds?: string
): Promise<{ lat: number; lng: number; address_components: any[]; formatted_address: string } | null> {
  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    region: "ar",
    language: "es",
  });

  // Bias results to Argentina bounding box
  if (bounds) {
    params.set("bounds", bounds);
  }

  const url = `${GOOGLE_GEOCODE_URL}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.warn(`Google Geocoding HTTP ${res.status} for: ${query}`);
    return null;
  }

  const data = await res.json();

  if (data.status === "OK" && data.results && data.results.length > 0) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address_components: result.address_components || [],
      formatted_address: result.formatted_address || "",
    };
  }

  if (data.status === "ZERO_RESULTS") {
    return null;
  }

  if (data.status === "OVER_QUERY_LIMIT" || data.status === "REQUEST_DENIED") {
    console.error(`Google Geocoding error: ${data.status} - ${data.error_message || ""}`);
    throw new Error(`Google API: ${data.status}`);
  }

  console.warn(`Google Geocoding status: ${data.status} for: ${query}`);
  return null;
}

// Argentina bounding box for biasing
const AR_BOUNDS = "-55.0,-73.5|-21.0,-53.5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let addresses: any[] = [];
    let autonomousMode = false;
    let fallbackMode = false;
    let neighborhoodFallbackMode = false;
    let retryVariantsMode = false;

    try {
      const body = await req.json();
      if (body?.addresses && Array.isArray(body.addresses) && body.addresses.length > 0) {
        addresses = body.addresses;
      }
    } catch {
      // No body — autonomous mode
    }

    if (addresses.length === 0) {
      autonomousMode = true;

      // Step 0: Check for flagged addresses
      const { data: flagged, error: flagError } = await supabase
        .from("geocoded_addresses")
        .select("address, neighborhood, province")
        .eq("source", "flagged")
        .limit(50);

      if (!flagError && flagged && flagged.length > 0) {
        console.log(`Found ${flagged.length} flagged addresses to retry`);
        retryVariantsMode = true;
        addresses = flagged.map((row: any) => ({
          address: row.address,
          neighborhood: row.neighborhood,
          province: row.province,
        }));
      }

      if (addresses.length === 0) {
        const seeded = await autoSeedMissingAddresses(supabase);

        // Fetch pending rows
        const { data: uncached, error } = await supabase
          .from("geocoded_addresses")
          .select("address, neighborhood, province")
          .is("lat", null)
          .limit(50);

        if (error) {
          console.error("Error fetching uncached addresses:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!uncached || uncached.length === 0) {
          // Check not_found to retry with Google (may succeed where LocationIQ failed)
          const { data: notFound, error: nfError } = await supabase
            .from("geocoded_addresses")
            .select("address, neighborhood, province")
            .eq("source", "not_found")
            .limit(50);

          if (nfError || !notFound || notFound.length === 0) {
            // Try not_found_final too
            const { data: notFoundFinal } = await supabase
              .from("geocoded_addresses")
              .select("address, neighborhood, province")
              .eq("source", "not_found_final")
              .limit(50);

            if (!notFoundFinal || notFoundFinal.length === 0) {
              // Try needs_manual
              const { data: needsManual } = await supabase
                .from("geocoded_addresses")
                .select("address, neighborhood, province")
                .eq("source", "needs_manual")
                .limit(50);

              if (!needsManual || needsManual.length === 0) {
                console.log("All addresses geocoded. Nothing to do.");
                return new Response(
                  JSON.stringify({ message: "All addresses geocoded", geocoded: 0, seeded, remaining: 0 }),
                  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }

              console.log(`Retrying ${needsManual.length} needs_manual addresses with Google`);
              fallbackMode = true;
              addresses = needsManual.map((row: any) => ({
                address: row.address,
                neighborhood: row.neighborhood,
                province: row.province,
              }));
            } else {
              console.log(`Retrying ${notFoundFinal.length} not_found_final addresses with Google`);
              fallbackMode = true;
              neighborhoodFallbackMode = true;
              addresses = notFoundFinal.map((row: any) => ({
                address: row.address,
                neighborhood: row.neighborhood,
                province: row.province,
              }));
            }
          } else {
            console.log(`Retrying ${notFound.length} not_found addresses with Google`);
            fallbackMode = true;
            addresses = notFound.map((row: any) => ({
              address: row.address,
              neighborhood: row.neighborhood,
              province: row.province,
            }));
          }
        } else {
          console.log(`Found ${uncached.length} pending addresses to geocode`);
          addresses = uncached.map((row: any) => ({
            address: row.address,
            neighborhood: row.neighborhood,
            province: row.province,
          }));
        }
      }
    }

    // In client mode, insert missing addresses into the table
    if (!autonomousMode) {
      const { data: cached } = await supabase
        .from("geocoded_addresses")
        .select("address, lat, lng")
        .in("address", addresses.map((a: any) => a.address));

      const cachedMap = new Map(
        (cached || []).map((c: any) => [c.address, { lat: c.lat, lng: c.lng }])
      );

      const newAddresses = addresses.filter((a: any) => !cachedMap.has(a.address));
      if (newAddresses.length > 0) {
        await supabase.from("geocoded_addresses").upsert(
          newAddresses.map((a: any) => ({
            address: a.address,
            neighborhood: a.neighborhood,
            province: a.province,
            lat: null,
            lng: null,
            source: "pending",
          })),
          { onConflict: "address" }
        );
      }

      const toGeocode = addresses.filter(
        (a: any) => !cachedMap.has(a.address) || !cachedMap.get(a.address)?.lat
      );

      if (toGeocode.length === 0) {
        return new Response(
          JSON.stringify({
            results: addresses.map((a: any) => ({
              ...a,
              ...(cachedMap.get(a.address) || {}),
              source: "cache",
            })),
            remaining: 0,
            total: addresses.length,
            cached: cachedMap.size,
            geocoded: 0,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      addresses = toGeocode;
    }

    // Geocode batch using Google Maps
    const results: any[] = [];
    const batchSize = Math.min(addresses.length, 50);
    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batchSize; i++) {
      const item = addresses[i];
      const cleanAddr = cleanAddress(item.address);

      // Build query: Google is smart enough to handle most formats directly
      let query: string;
      if (neighborhoodFallbackMode && (item.neighborhood || item.province)) {
        // Last resort: just neighborhood + city
        const parts = [item.neighborhood, item.province].filter(Boolean);
        query = `${parts.join(", ")}, Argentina`;
        console.log(`Neighborhood fallback for "${item.address}": "${query}"`);
      } else if (fallbackMode || retryVariantsMode) {
        // For retries, add more context
        const parts = [cleanAddr];
        if (item.neighborhood) parts.push(item.neighborhood);
        if (item.province) parts.push(item.province);
        parts.push("Argentina");
        query = parts.join(", ");
        console.log(`Retry query for "${item.address}": "${query}"`);
      } else {
        query = `${cleanAddr}, Argentina`;
      }

      try {
        const result = await geocodeWithGoogle(query, googleApiKey, AR_BOUNDS);

        if (result) {
          const normalized = extractNormalizedGeo(result.address_components);

          // Fallback: if Google couldn't resolve locality, use CSV city field
          if (!normalized.norm_locality && item.province) {
            normalized.norm_locality = item.province;
          }

          await supabase.from("geocoded_addresses").upsert({
            address: item.address,
            neighborhood: item.neighborhood,
            province: item.province,
            lat: result.lat,
            lng: result.lng,
            norm_neighborhood: normalized.norm_neighborhood,
            norm_locality: normalized.norm_locality,
            norm_province: normalized.norm_province,
            raw_address_details: {
              address_components: result.address_components,
              formatted_address: result.formatted_address,
            },
            source: retryVariantsMode ? "google_retry" : (fallbackMode ? "google_fallback" : "google"),
          }, { onConflict: "address" });

          results.push({ ...item, lat: result.lat, lng: result.lng, ...normalized, source: "google" });
          successCount++;
        } else {
          // Not found — mark appropriately
          const source = neighborhoodFallbackMode
            ? "not_found_forever"
            : fallbackMode
              ? "not_found_final"
              : "not_found";

          await supabase.from("geocoded_addresses").upsert({
            address: item.address,
            neighborhood: item.neighborhood,
            province: item.province,
            lat: 0,
            lng: 0,
            source,
          }, { onConflict: "address" });

          results.push({ ...item, lat: null, lng: null, source: "not_found" });
          notFoundCount++;
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (errMsg.includes("OVER_QUERY_LIMIT")) {
          console.warn(`Rate limited at item ${i + 1}/${batchSize}. Stopping batch.`);
          break;
        }

        console.error(`Geocoding failed for: ${item.address}`, e);
        await supabase.from("geocoded_addresses").upsert({
          address: item.address,
          lat: 0,
          lng: 0,
          source: "error",
        }, { onConflict: "address" });
        results.push({ ...item, lat: null, lng: null, source: "error" });
        errorCount++;
      }

      if (i < batchSize - 1) await sleep(DELAY_MS);
    }

    const remaining = addresses.length - batchSize;

    console.log(`Geocoded batch: ${successCount} ok, ${notFoundCount} not found, ${errorCount} errors. Remaining: ${remaining}`);

    return new Response(
      JSON.stringify({
        results,
        remaining,
        total: addresses.length,
        geocoded: batchSize,
        success: successCount,
        notFound: notFoundCount,
        errors: errorCount,
        autonomous: autonomousMode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Geocode error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
