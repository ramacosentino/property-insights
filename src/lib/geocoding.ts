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
// Uses parallel pagination for faster loading
export async function fetchCachedCoordinates(bounds?: {
  south: number; north: number; west: number; east: number;
}): Promise<Map<string, CachedGeoData>> {
  const map = new Map<string, CachedGeoData>();
  const pageSize = 1000;

  // First request to get count estimate + first page
  let baseQuery = supabase
    .from("geocoded_addresses")
    .select("address, lat, lng, norm_neighborhood, norm_locality, norm_province", { count: "exact" })
    .not("lat", "is", null)
    .neq("lat", 0);

  if (bounds) {
    baseQuery = baseQuery
      .gte("lat", bounds.south)
      .lte("lat", bounds.north)
      .gte("lng", bounds.west)
      .lte("lng", bounds.east);
  }

  const { data: firstPage, error, count } = await baseQuery.range(0, pageSize - 1);

  if (error) {
    console.error("Error fetching cached coordinates:", error);
    return map;
  }

  // Process first page
  for (const row of firstPage || []) {
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

  // If there are more pages, fetch them in parallel
  const totalRows = count ?? firstPage?.length ?? 0;
  if (totalRows > pageSize) {
    const remainingPages = Math.ceil((totalRows - pageSize) / pageSize);
    const parallelRequests = [];

    for (let i = 0; i < remainingPages; i++) {
      const from = (i + 1) * pageSize;
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

      parallelRequests.push(query.range(from, from + pageSize - 1));
    }

    const results = await Promise.all(parallelRequests);

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
