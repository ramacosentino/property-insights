import { supabase } from "@/integrations/supabase/client";
import { Property } from "./propertyData";

export interface GeocodedProperty {
  id: string;
  lat: number;
  lng: number;
}

// Fetch cached geocoded coordinates from DB
export async function fetchCachedCoordinates(): Promise<Map<string, { lat: number; lng: number }>> {
  const { data, error } = await supabase
    .from("geocoded_addresses")
    .select("address, lat, lng")
    .not("lat", "is", null);

  if (error) {
    console.error("Error fetching cached coordinates:", error);
    return new Map();
  }

  const map = new Map<string, { lat: number; lng: number }>();
  for (const row of data || []) {
    if (row.lat && row.lng) {
      map.set(row.address, { lat: row.lat, lng: row.lng });
    }
  }
  return map;
}

// Trigger geocoding for a batch of properties
export async function geocodeBatch(
  properties: Property[]
): Promise<{ geocoded: number; remaining: number }> {
  const addresses = properties.map((p) => ({
    address: p.location,
    neighborhood: p.neighborhood,
    province: p.province,
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
