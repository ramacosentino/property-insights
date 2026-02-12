import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract normalized geographic fields from Nominatim address details.
 * Priority mapping for Argentina:
 * - norm_neighborhood: suburb > neighbourhood > city_district
 * - norm_locality: city > town > municipality > city_district
 * - norm_province: state
 */
function extractNormalizedGeo(address: any): {
  norm_neighborhood: string | null;
  norm_locality: string | null;
  norm_province: string | null;
} {
  if (!address) return { norm_neighborhood: null, norm_locality: null, norm_province: null };

  const norm_neighborhood =
    address.suburb || address.neighbourhood || address.city_district || null;

  const norm_locality =
    address.city || address.town || address.municipality || address.city_district || null;

  const norm_province = address.state || null;

  return { norm_neighborhood, norm_locality, norm_province };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let addresses: any[] = [];
    let autonomousMode = false;

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
      // Fetch rows with null lat OR null norm_locality (need re-geocoding for normalization)
      const { data: uncached, error } = await supabase
        .from("geocoded_addresses")
        .select("address, neighborhood, province")
        .or("lat.is.null,norm_locality.is.null")
        .not("lat", "eq", 0) // skip "not_found" entries
        .limit(50);

      if (error) {
        console.error("Error fetching uncached addresses:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!uncached || uncached.length === 0) {
        return new Response(
          JSON.stringify({ message: "All addresses geocoded and normalized", geocoded: 0, remaining: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      addresses = uncached.map((row: any) => ({
        address: row.address,
        neighborhood: row.neighborhood,
        province: row.province,
      }));
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

    // Geocode batch — up to 45 per call
    const results: any[] = [];
    const batchSize = Math.min(addresses.length, 45);

    for (let i = 0; i < batchSize; i++) {
      const item = addresses[i];
      const query = `${item.address}, ${item.neighborhood || ""}, ${item.province || ""}, Argentina`;

      try {
        // Use addressdetails=1 to get structured location data
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ar&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "User-Agent": "LovableAnalytics/1.0" },
        });
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
            source: "nominatim",
          }, { onConflict: "address" });

          results.push({ ...item, lat, lng, ...normalized, source: "nominatim" });
        } else {
          await supabase.from("geocoded_addresses").upsert({
            address: item.address,
            neighborhood: item.neighborhood,
            province: item.province,
            lat: 0,
            lng: 0,
            source: "not_found",
          }, { onConflict: "address" });

          results.push({ ...item, lat: null, lng: null, source: "not_found" });
        }
      } catch (e) {
        console.error(`Geocoding failed for: ${item.address}`, e);
        results.push({ ...item, lat: null, lng: null, source: "error" });
      }

      if (i < batchSize - 1) await sleep(DELAY_MS);
    }

    const remaining = addresses.length - batchSize;

    return new Response(
      JSON.stringify({
        results,
        remaining,
        total: addresses.length,
        geocoded: batchSize,
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
