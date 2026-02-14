import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOCATIONIQ_URL = "https://us1.locationiq.com/v1/search";
const DELAY_MS = 500; // Safe rate for sustained LocationIQ usage (~2 req/sec limit)

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
  // Remove "al" before a number: "Potosí al 800" → "Potosí 800"
  s = s.replace(/\bal\s+(\d)/gi, "$1");
  // Remove "entre ... y ..." or "entre ... e ..."
  s = s.replace(/\bentre\s+.+?\s+[ye]\s+\S+/gi, "");
  // Remove floor/dept: "2º A", "Piso 3", "Depto B", "PB", "1°B"
  s = s.replace(/\b(piso|depto|dpto|departamento|unidad)\s*\S*/gi, "");
  s = s.replace(/\d+[°º]\s*[A-Za-z]?\b/g, "");
  // Normalize spaces
  s = s.replace(/\s{2,}/g, " ").trim();
  // Remove trailing comma
  s = s.replace(/,\s*$/, "");
  return s;
}

function extractNormalizedGeo(address: any): {
  norm_neighborhood: string | null;
  norm_locality: string | null;
  norm_province: string | null;
} {
  if (!address) return { norm_neighborhood: null, norm_locality: null, norm_province: null };
  return {
    norm_neighborhood: address.suburb || address.neighbourhood || address.city_district || null,
    norm_locality: address.city || address.town || address.municipality || address.city_district || null,
    norm_province: address.state || null,
  };
}

/**
 * Paginated fetch of all rows from a table/query.
 * Supabase limits to 1000 rows per request.
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
 * Uses pagination to handle >1000 rows.
 */
async function autoSeedMissingAddresses(supabase: any): Promise<number> {
  const allProps = await fetchAllRows(supabase, "properties", "address, neighborhood, city", (q: any) => q.not("address", "is", null));

  if (allProps.length === 0) {
    console.log("No properties found for seeding");
    return 0;
  }

  const existingRows = await fetchAllRows(supabase, "geocoded_addresses", "address");
  const existingSet = new Set(existingRows.map((r: any) => r.address));

  // Deduplicate by address
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

  // Insert in batches of 500
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const locationiqKey = Deno.env.get("LOCATIONIQ_API_KEY");
    
    if (!locationiqKey) {
      return new Response(
        JSON.stringify({ error: "LOCATIONIQ_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let addresses: any[] = [];
    let autonomousMode = false;
    let fallbackMode = false;
    let neighborhoodFallbackMode = false;

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

      // Step 1: Auto-seed any missing addresses from properties table
      const seeded = await autoSeedMissingAddresses(supabase);

      // Step 2: Fetch pending rows to geocode (lat IS NULL = never attempted)
      const { data: uncached, error } = await supabase
        .from("geocoded_addresses")
        .select("address, neighborhood, province")
        .is("lat", null)
        .limit(30);

      if (error) {
        console.error("Error fetching uncached addresses:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 3: If no pending, check for not_found addresses to retry with fallback
      if (!uncached || uncached.length === 0) {
        const { data: notFound, error: nfError } = await supabase
          .from("geocoded_addresses")
          .select("address, neighborhood, province")
          .eq("source", "not_found")
          .limit(30);

        if (nfError || !notFound || notFound.length === 0) {
          // Step 4: For not_found_final, assign generic neighborhood coords from properties table
          const { data: finalFails, error: ffError } = await supabase
            .from("geocoded_addresses")
            .select("address")
            .eq("source", "not_found_final")
            .limit(30);

          if (ffError || !finalFails || finalFails.length === 0) {
            console.log("All addresses geocoded. Nothing to do.");
            return new Response(
              JSON.stringify({ message: "All addresses geocoded", geocoded: 0, seeded, remaining: 0 }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Look up the real neighborhood from properties and geocode that
          const failAddresses = finalFails.map((f: any) => f.address);
          const { data: props } = await supabase
            .from("properties")
            .select("address, neighborhood, city")
            .in("address", failAddresses);

          if (!props || props.length === 0) {
            console.log("No matching properties for final fails.");
            return new Response(
              JSON.stringify({ message: "All addresses geocoded", geocoded: 0, seeded, remaining: 0 }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log(`Final fallback: geocoding ${props.length} addresses by neighborhood+city`);
          fallbackMode = true;
          neighborhoodFallbackMode = true;
          addresses = props.map((p: any) => ({
            address: p.address,
            neighborhood: p.neighborhood,
            province: p.city,
          }));
        } else {
          console.log(`Retrying ${notFound.length} not_found addresses with fallback query`);
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

    // Geocode batch using LocationIQ
    const results: any[] = [];
    const batchSize = Math.min(addresses.length, 30);
    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batchSize; i++) {
      const item = addresses[i];
      // In fallback mode, use neighborhood + city instead of the full noisy address
      let query: string;
      if (fallbackMode && (item.neighborhood || item.province)) {
        const parts = [item.neighborhood, item.province].filter(Boolean);
        query = `${parts.join(", ")}, Argentina`;
        console.log(`Fallback query for "${item.address}": "${query}"`);
      } else {
        const cleanAddr = cleanAddress(item.address);
        query = `${cleanAddr}, Argentina`;
      }

      try {
        const params = new URLSearchParams({
          key: locationiqKey,
          q: query,
          format: "json",
          limit: "1",
          countrycodes: "ar",
          addressdetails: "1",
        });
        const url = `${LOCATIONIQ_URL}?${params.toString()}`;
        const res = await fetch(url);

        if (res.status === 429) {
          console.warn(`Rate limited at item ${i + 1}/${batchSize}. Waiting 2s and retrying...`);
          await sleep(2000);
          // Retry once
          const retryRes = await fetch(url);
          if (retryRes.status === 429) {
            console.warn(`Still rate limited. Stopping batch early.`);
            break;
          }
          if (!retryRes.ok) {
            console.warn(`HTTP ${retryRes.status} on retry for: ${item.address}`);
            errorCount++;
            await sleep(DELAY_MS);
            continue;
          }
          const retryData = await retryRes.json();
          if (retryData && retryData.length > 0) {
            const lat = parseFloat(retryData[0].lat);
            const lng = parseFloat(retryData[0].lon);
            const addressDetails = retryData[0].address || {};
            const normalized = extractNormalizedGeo(addressDetails);

            await supabase.from("geocoded_addresses").upsert({
              address: item.address,
              neighborhood: item.neighborhood,
              province: item.province,
              lat,
              lng,
              norm_neighborhood: normalized.norm_neighborhood,
              norm_locality: normalized.norm_locality,
              norm_province: normalized.norm_province,
              raw_address_details: addressDetails,
              source: "locationiq",
            }, { onConflict: "address" });

            results.push({ ...item, lat, lng, ...normalized, source: "locationiq" });
            successCount++;
          }
          await sleep(DELAY_MS);
          continue;
        }

        if (!res.ok) {
          const errorBody = await res.text();
          // LocationIQ returns 404 for not found
          if (res.status === 404) {
            await supabase.from("geocoded_addresses").upsert({
              address: item.address,
              neighborhood: item.neighborhood,
              province: item.province,
              lat: 0,
              lng: 0,
              source: neighborhoodFallbackMode ? "not_found_forever" : (fallbackMode ? "not_found_final" : "not_found"),
            }, { onConflict: "address" });
            results.push({ ...item, lat: null, lng: null, source: "not_found" });
            notFoundCount++;
            await sleep(DELAY_MS);
            continue;
          }
          console.warn(`HTTP ${res.status} for: ${item.address}. Body: ${errorBody}`);
          results.push({ ...item, lat: null, lng: null, source: "error" });
          errorCount++;
          await sleep(DELAY_MS);
          continue;
        }

        const data = await res.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const addressDetails = data[0].address || {};
          const normalized = extractNormalizedGeo(addressDetails);

          await supabase.from("geocoded_addresses").upsert({
            address: item.address,
            neighborhood: item.neighborhood,
            province: item.province,
            lat,
            lng,
            norm_neighborhood: normalized.norm_neighborhood,
            norm_locality: normalized.norm_locality,
            norm_province: normalized.norm_province,
            raw_address_details: addressDetails,
            source: neighborhoodFallbackMode ? "locationiq_neighborhood" : (fallbackMode ? "locationiq_fallback" : "locationiq"),
          }, { onConflict: "address" });

          results.push({ ...item, lat, lng, ...normalized, source: "locationiq" });
          successCount++;
        } else {
          await supabase.from("geocoded_addresses").upsert({
            address: item.address,
            neighborhood: item.neighborhood,
            province: item.province,
            lat: 0,
            lng: 0,
            source: neighborhoodFallbackMode ? "not_found_forever" : (fallbackMode ? "not_found_final" : "not_found"),
          }, { onConflict: "address" });

          results.push({ ...item, lat: null, lng: null, source: "not_found" });
          notFoundCount++;
        }
      } catch (e) {
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
