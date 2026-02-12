import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100; // respect 1 req/sec

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { addresses } = await req.json();

    if (!addresses || !Array.isArray(addresses)) {
      return new Response(JSON.stringify({ error: "addresses array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which are already cached
    const { data: cached } = await supabase
      .from("geocoded_addresses")
      .select("address, lat, lng")
      .in("address", addresses.map((a: any) => a.address));

    const cachedMap = new Map(
      (cached || []).map((c: any) => [c.address, { lat: c.lat, lng: c.lng }])
    );

    const toGeocode = addresses.filter((a: any) => !cachedMap.has(a.address));
    const results: any[] = [];

    // Return cached immediately
    for (const a of addresses) {
      if (cachedMap.has(a.address)) {
        results.push({ ...a, ...cachedMap.get(a.address), source: "cache" });
      }
    }

    // Geocode missing ones (batch with rate limit)
    const batchSize = Math.min(toGeocode.length, 20); // max 20 per call
    for (let i = 0; i < batchSize; i++) {
      const item = toGeocode[i];
      const query = `${item.address}, ${item.neighborhood || ""}, ${item.province || ""}, Argentina`;

      try {
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ar`;
        const res = await fetch(url, {
          headers: { "User-Agent": "LovableAnalytics/1.0" },
        });
        const data = await res.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          // Cache in DB
          await supabase.from("geocoded_addresses").upsert({
            address: item.address,
            neighborhood: item.neighborhood,
            province: item.province,
            lat,
            lng,
          }, { onConflict: "address" });

          results.push({ ...item, lat, lng, source: "nominatim" });
        } else {
          results.push({ ...item, lat: null, lng: null, source: "not_found" });
        }
      } catch (e) {
        console.error(`Geocoding failed for: ${item.address}`, e);
        results.push({ ...item, lat: null, lng: null, source: "error" });
      }

      if (i < batchSize - 1) await sleep(DELAY_MS);
    }

    const remaining = toGeocode.length - batchSize;

    return new Response(
      JSON.stringify({
        results,
        remaining,
        total: addresses.length,
        cached: cached?.length || 0,
        geocoded: batchSize,
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
