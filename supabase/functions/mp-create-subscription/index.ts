import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MP_API = "https://api.mercadopago.com";

interface PlanConfig {
  id: string;
  basePlan: string;
  reason: string;
  amount: number;
  frequency: number;
  frequencyType: string;
}

const PLANS: Record<string, PlanConfig> = {
  pro_monthly: {
    id: "pro_monthly",
    basePlan: "pro",
    reason: "Urbanna Pro – Mensual",
    amount: 20000,
    frequency: 1,
    frequencyType: "months",
  },
  pro_annual: {
    id: "pro_annual",
    basePlan: "pro",
    reason: "Urbanna Pro – Anual",
    amount: 200000,
    frequency: 12,
    frequencyType: "months",
  },
  premium_monthly: {
    id: "premium_monthly",
    basePlan: "premium",
    reason: "Urbanna Premium – Mensual",
    amount: 100000,
    frequency: 1,
    frequencyType: "months",
  },
  premium_annual: {
    id: "premium_annual",
    basePlan: "premium",
    reason: "Urbanna Premium – Anual",
    amount: 1000000,
    frequency: 12,
    frequencyType: "months",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    const userEmail = user.email || "";

    const { planId, backUrl } = await req.json();
    const plan = PLANS[planId];
    if (!plan) throw new Error(`Invalid plan: ${planId}`);

    // Create preapproval (subscription) directly
    const mpRes = await fetch(`${MP_API}/preapproval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: plan.reason,
        auto_recurring: {
          frequency: plan.frequency,
          frequency_type: plan.frequencyType,
          transaction_amount: plan.amount,
          currency_id: "ARS",
        },
        payer_email: userEmail,
        back_url: backUrl || "https://ramatest.lovable.app/planes",
        external_reference: userId,
        status: "pending",
      }),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      throw new Error(`MercadoPago error [${mpRes.status}]: ${err}`);
    }

    const mpData = await mpRes.json();

    // Upsert subscription record
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("subscriptions").upsert(
      {
        user_id: userId,
        plan: plan.basePlan,
        status: "pending",
        mp_preapproval_id: mpData.id,
        mp_payer_email: userEmail,
      },
      { onConflict: "user_id" }
    );

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, id: mpData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating subscription:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
