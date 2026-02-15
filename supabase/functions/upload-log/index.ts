import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action, source, filename, log_id, status, csv } = await req.json();

    if (action === "create_log") {
      // Store CSV if provided
      let fileUrl: string | null = null;
      if (csv && typeof csv === "string") {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const safeName = (filename || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${timestamp}_${safeName}`;
          const { error: storageError } = await supabase.storage
            .from("upload-csvs")
            .upload(storagePath, csv, { contentType: "text/csv", upsert: false });
          if (!storageError) {
            fileUrl = storagePath;
          } else {
            console.error("CSV storage error:", storageError.message);
          }
        } catch (e) {
          console.error("CSV storage exception:", e);
        }
      }

      const { data, error } = await supabase
        .from("upload_logs")
        .insert({ source: source || "api", filename: filename || null, status: "running", file_url: fileUrl })
        .select("id")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "finalize_log" && log_id) {
      await supabase
        .from("upload_logs")
        .update({ status: status || "success", finished_at: new Date().toISOString() })
        .eq("id", log_id);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload log error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
