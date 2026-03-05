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

/** Generate grid centers to cover a bounding box with overlapping circles */
function generateGridCenters(
  centerLat: number, centerLng: number, radiusMeters: number
): { lat: number; lng: number }[] {
  // For a large search area, create a grid of smaller search circles
  // Each circle has radius ~3km to maximize coverage per request (20 results each)
  const cellRadius = 3000; // 3km per cell
  
  // How many cells do we need in each direction?
  const cellsNeeded = Math.ceil(radiusMeters / (cellRadius * 1.5)); // overlap factor
  
  if (cellsNeeded <= 1) {
    return [{ lat: centerLat, lng: centerLng }];
  }
  
  const centers: { lat: number; lng: number }[] = [];
  const latStep = (cellRadius * 1.5) / 111320; // meters to degrees lat
  const lngStep = (cellRadius * 1.5) / (111320 * Math.cos(centerLat * Math.PI / 180));
  
  for (let i = -cellsNeeded; i <= cellsNeeded; i++) {
    for (let j = -cellsNeeded; j <= cellsNeeded; j++) {
      const lat = centerLat + i * latStep;
      const lng = centerLng + j * lngStep;
      // Only include if within the overall radius
      const dist = Math.sqrt(
        Math.pow((lat - centerLat) * 111320, 2) +
        Math.pow((lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180), 2)
      );
      if (dist <= radiusMeters * 1.2) {
        centers.push({ lat, lng });
      }
    }
  }
  
  return centers;
}

async function searchNearby(
  googleApiKey: string,
  types: string[],
  lat: number,
  lng: number,
  radius: number
): Promise<any[]> {
  const url = "https://places.googleapis.com/v1/places:searchNearby";
  const body = {
    includedTypes: types,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Math.min(radius, 50000),
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleApiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.types,places.formattedAddress",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error("Google Places API error:", response.status, await response.text());
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

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

    // Generate grid of search centers to cover the full area
    const gridCenters = generateGridCenters(center_lat, center_lng, radius_meters);
    const cellRadius = gridCenters.length === 1 ? radius_meters : 3500;
    
    console.log(`POI search: ${poi_type}, ${gridCenters.length} grid cells, radius=${radius_meters}m`);

    // Fire all grid searches in parallel (batched to avoid rate limits)
    const BATCH_SIZE = 10;
    const seenIds = new Set<string>();
    const allPlaces: any[] = [];

    for (let i = 0; i < gridCenters.length; i += BATCH_SIZE) {
      const batch = gridCenters.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(c => searchNearby(googleApiKey, googleTypes, c.lat, c.lng, cellRadius))
      );
      
      for (const places of results) {
        for (const p of places) {
          // Deduplicate by Google Place ID
          const placeId = p.id || `${p.location?.latitude}_${p.location?.longitude}`;
          if (!seenIds.has(placeId)) {
            seenIds.add(placeId);
            allPlaces.push({
              name: p.displayName?.text || "Sin nombre",
              lat: p.location?.latitude,
              lng: p.location?.longitude,
              address: p.formattedAddress || null,
              types: p.types || [],
            });
          }
        }
      }
    }

    console.log(`POI search complete: ${allPlaces.length} unique places found`);

    return new Response(
      JSON.stringify({ places: allPlaces, count: allPlaces.length }),
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
