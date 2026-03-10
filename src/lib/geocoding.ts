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
// Uses parallel pagination with large batches for speed
const GEO_PAGE_SIZE = 1000;
const PARALLEL_PAGES = 8; // fire 8 pages in parallel (covers up to 8000 rows)

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

function processRows(rows: any[], map: Map<string, CachedGeoData>) {
  for (const row of rows) {
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

export async function fetchCachedCoordinates(bounds?: {
  south: number; north: number; west: number; east: number;
}): Promise<Map<string, CachedGeoData>> {
  const map = new Map<string, CachedGeoData>();

  // Fire all pages in parallel batches until we get all data
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 30) { // safety cap at 30k rows
    const requests = [];
    for (let i = 0; i < PARALLEL_PAGES; i++) {
      const from = (page + i) * GEO_PAGE_SIZE;
      requests.push(buildGeoQuery(bounds).range(from, from + GEO_PAGE_SIZE - 1));
    }

    const results = await Promise.all(requests);

    hasMore = false;
    let allEmpty = true;
    for (const result of results) {
      if (result.error) {
        console.error("Error fetching cached coordinates page:", result.error);
        continue;
      }
      const rows = result.data || [];
      if (rows.length > 0) allEmpty = false;
      processRows(rows, map);
      if (rows.length === GEO_PAGE_SIZE) hasMore = true;
    }

    if (allEmpty) break;
    page += PARALLEL_PAGES;
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
