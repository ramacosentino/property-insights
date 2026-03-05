import { supabase } from "@/integrations/supabase/client";
import { Property } from "./propertyData";

export interface GeocodedProperty {
  id: string;
  lat: number;
  lng: number;
}

export interface CachedGeoData {
  lat: number;
  lng: number;
  norm_neighborhood?: string | null;
  norm_locality?: string | null;
  norm_province?: string | null;
}

// Fetch cached geocoded coordinates + normalized geo from DB
// Supports optional bounding box to limit data transfer
// Fires all page requests in parallel without waiting for count
const MAX_PARALLEL_PAGES = 10; // supports up to 10,000 geocoded addresses
const GEO_PAGE_SIZE = 1000;

function buildGeoQuery(bounds?: { south: number; north: number; west: number; east: number }) {
  let query = supabase
    .from("geocoded_addresses")
    .select("address, lat, lng, norm_neighborhood, norm_locality, norm_province")
    .not("lat", "is", null)
    .neq("lat", 0);

  if (bounds) {
    query = query
      .gte("lat", bounds.south)
      .lte("lat", bounds.north)
      .gte("lng", bounds.west)
      .lte("lng", bounds.east);
  }
  return query;
}

export async function fetchCachedCoordinates(bounds?: {
  south: number; north: number; west: number; east: number;
}): Promise<Map<string, CachedGeoData>> {
  const map = new Map<string, CachedGeoData>();

  // Fire all pages in parallel — no sequential dependency
  const requests = [];
  for (let i = 0; i < MAX_PARALLEL_PAGES; i++) {
    const from = i * GEO_PAGE_SIZE;
    requests.push(buildGeoQuery(bounds).range(from, from + GEO_PAGE_SIZE - 1));
  }

  const results = await Promise.all(requests);

  for (const result of results) {
    if (result.error) {
      console.error("Error fetching cached coordinates page:", result.error);
      continue;
    }
    for (const row of result.data || []) {
      if (row.lat && row.lng) {
        map.set(row.address, {
          lat: row.lat,
          lng: row.lng,
          norm_neighborhood: row.norm_neighborhood,
          norm_locality: row.norm_locality,
          norm_province: row.norm_province,
        });
      }
    }
  }

  return map;
}

// Trigger geocoding for a batch of properties
export async function geocodeBatch(
  properties: Property[]
): Promise<{ geocoded: number; remaining: number }> {
  const addresses = properties.map((p) => ({
    address: p.address || p.location,
    neighborhood: p.neighborhood,
    province: p.city,
    id: p.id,
  }));

  const { data, error } = await supabase.functions.invoke("geocode", {
    body: { addresses },
  });

  if (error) {
    console.error("Geocoding error:", error);
    return { geocoded: 0, remaining: properties.length };
  }

  return {
    geocoded: data?.geocoded || 0,
    remaining: data?.remaining || 0,
  };
}
