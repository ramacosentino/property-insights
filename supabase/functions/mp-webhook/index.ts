import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MP_API = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    // MercadoPago sends different notification types
    const { type, data } = body;

    // We care about subscription (preapproval) updates
    if (type !== "subscription_preapproval") {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the preapproval details from MP
    const preapprovalId = data?.id;
    if (!preapprovalId) throw new Error("No preapproval id in webhook data");

    const mpRes = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      throw new Error(`MP fetch error [${mpRes.status}]: ${err}`);
    }

    const preapproval = await mpRes.json();
    console.log("Preapproval details:", JSON.stringify(preapproval));

    const userId = preapproval.external_reference;
    if (!userId) throw new Error("No external_reference (user_id) in preapproval");

    // Map MP status to our status
    let status = "inactive";
    if (preapproval.status === "authorized") status = "active";
    else if (preapproval.status === "paused") status = "paused";
    else if (preapproval.status === "cancelled") status = "cancelled";
    else if (preapproval.status === "pending") status = "pending";

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await serviceClient
      .from("subscriptions")
      .update({
        status,
        mp_preapproval_id: preapprovalId,
        mp_payer_email: preapproval.payer_email || null,
        current_period_start: preapproval.auto_recurring?.start_date || null,
        current_period_end: preapproval.auto_recurring?.end_date || null,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("DB update error:", error);
      throw new Error(`DB update failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
