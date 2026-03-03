import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const isCaba = adminLevel1 === "Ciudad Autónoma de Buenos Aires" ||
    adminLevel1 === "Cdad. Autónoma de Buenos Aires" ||
    adminLevel1 === "CABA";

  norm_province = adminLevel1;

  if (isCaba) {
    norm_locality = "Buenos Aires";
    norm_province = "Ciudad Autónoma de Buenos Aires";
  } else if (rawLocality && !/^[A-Z]\d{3,}/.test(rawLocality)) {
    norm_locality = rawLocality;
  } else if (adminLevel2) {
    norm_locality = adminLevel2;
  } else {
    norm_locality = rawLocality;
  }

  return { norm_neighborhood, norm_locality, norm_province };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const PAGE_SIZE = 500;
  let updated = 0;
  let skipped = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("geocoded_addresses")
      .select("id, address, raw_address_details, norm_locality, norm_neighborhood, norm_province")
      .in("source", ["google", "google_retry", "google_fallback"])
      .not("raw_address_details", "is", null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data) {
      const components = row.raw_address_details?.address_components;
      if (!components) {
        skipped++;
        continue;
      }

      const newNorm = extractNormalizedGeo(components);

      // Only update if something changed
      if (
        newNorm.norm_locality !== row.norm_locality ||
        newNorm.norm_neighborhood !== row.norm_neighborhood ||
        newNorm.norm_province !== row.norm_province
      ) {
        const { error: upErr } = await supabase
          .from("geocoded_addresses")
          .update({
            norm_locality: newNorm.norm_locality,
            norm_neighborhood: newNorm.norm_neighborhood,
            norm_province: newNorm.norm_province,
          })
          .eq("id", row.id);

        if (upErr) {
          console.error(`Update error for ${row.address}:`, upErr);
        } else {
          updated++;
        }
      } else {
        skipped++;
      }
    }

    hasMore = data.length === PAGE_SIZE;
    offset += PAGE_SIZE;
    console.log(`Processed ${offset} rows so far, updated: ${updated}, skipped: ${skipped}`);
  }

  // Now sync norm fields to properties table
  console.log("Syncing norm fields to properties...");
  const { data: geoRows } = await supabase
    .from("geocoded_addresses")
    .select("address, norm_neighborhood, norm_locality, norm_province")
    .in("source", ["google", "google_retry", "google_fallback"])
    .not("norm_locality", "is", null);

  let propUpdated = 0;
  if (geoRows) {
    for (const g of geoRows) {
      const { error: pErr, count } = await supabase
        .from("properties")
        .update({
          norm_neighborhood: g.norm_neighborhood,
          norm_locality: g.norm_locality,
          norm_province: g.norm_province,
        })
        .eq("address", g.address);

      if (!pErr) propUpdated++;
    }
  }

  console.log(`Done. Geocoded updated: ${updated}, skipped: ${skipped}, properties synced: ${propUpdated}`);

  return new Response(
    JSON.stringify({
      geocoded_updated: updated,
      geocoded_skipped: skipped,
      properties_synced: propUpdated,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
