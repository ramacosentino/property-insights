import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// POI type mapping: user-facing category → Google Places API types
const POI_TYPE_MAP: Record<string, string[]> = {
  transporte: ["subway_station", "train_station", "transit_station"],
  espacios_verdes: ["park"],
  gimnasios: ["gym"],
  supermercados: ["supermarket"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { poi_type, center_lat, center_lng, radius_meters = 5000 } = await req.json();

    if (!poi_type || !center_lat || !center_lng) {
      return new Response(
        JSON.stringify({ error: "poi_type, center_lat, center_lng required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleTypes = POI_TYPE_MAP[poi_type];
    if (!googleTypes) {
      return new Response(
        JSON.stringify({ error: `Unknown poi_type: ${poi_type}. Valid: ${Object.keys(POI_TYPE_MAP).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Places API (New) Nearby Search
    const url = "https://places.googleapis.com/v1/places:searchNearby";
    const body = {
      includedTypes: googleTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: center_lat, longitude: center_lng },
          radius: Math.min(radius_meters, 50000),
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "places.displayName,places.location,places.types,places.formattedAddress",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Places API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const places = (data.places || []).map((p: any) => ({
      name: p.displayName?.text || "Sin nombre",
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      address: p.formattedAddress || null,
      types: p.types || [],
    }));

    return new Response(
      JSON.stringify({ places, count: places.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("search-pois error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
