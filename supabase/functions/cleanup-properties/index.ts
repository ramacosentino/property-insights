import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Hard-deletes properties that have been soft-deleted (status = 'removed')
 * for more than 3 months. Run monthly after the snapshot.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    const cutoffISO = cutoff.toISOString();

    console.log(`Cleaning up properties removed before ${cutoffISO}...`);

    // Count first
    const { count, error: countErr } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "removed")
      .lt("removed_at", cutoffISO);

    if (countErr) {
      console.error("Count error:", countErr);
      return new Response(
        JSON.stringify({ success: false, error: countErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const total = count || 0;
    console.log(`Found ${total} properties to hard-delete`);

    if (total === 0) {
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: "No properties to clean up" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete in batches to avoid timeouts
    let deleted = 0;
    const batchSize = 200;

    while (deleted < total) {
      const { data: batch, error: fetchErr } = await supabase
        .from("properties")
        .select("id")
        .eq("status", "removed")
        .lt("removed_at", cutoffISO)
        .limit(batchSize);

      if (fetchErr || !batch || batch.length === 0) break;

      const ids = batch.map(r => r.id);
      const { error: delErr } = await supabase
        .from("properties")
        .delete()
        .in("id", ids);

      if (delErr) {
        console.error("Delete batch error:", delErr);
        break;
      }

      deleted += ids.length;
      console.log(`Deleted ${deleted}/${total}...`);
    }

    console.log(`Cleanup complete: ${deleted} properties hard-deleted`);

    return new Response(
      JSON.stringify({ success: true, deleted, cutoff_date: cutoffISO }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
