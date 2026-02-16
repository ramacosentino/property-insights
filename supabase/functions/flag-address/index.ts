import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { address, lat, lng, manual } = body;

    if (!address) {
      return new Response(
        JSON.stringify({ error: "address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manual correction: user provided lat/lng directly
    if (manual && lat != null && lng != null) {
      const { error } = await supabase
        .from("geocoded_addresses")
        .update({
          lat,
          lng,
          source: "manual",
          geocoded_at: new Date().toISOString(),
        })
        .eq("address", address);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: "manual_correction", address, lat, lng }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flag for re-geocoding: reset lat/lng and set source to 'flagged'
    const { error } = await supabase
      .from("geocoded_addresses")
      .update({
        lat: null,
        lng: null,
        source: "flagged",
        raw_address_details: null,
        norm_neighborhood: null,
        norm_locality: null,
        norm_province: null,
      })
      .eq("address", address);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, action: "flagged_for_retry", address }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
