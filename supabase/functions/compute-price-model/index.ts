import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { factors } = await req.json();

    if (!factors || !Array.isArray(factors)) {
      return new Response(JSON.stringify({ error: "Missing factors data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build a summary for the AI
    const summary = factors.map((f: any) => ({
      factor: f.displayName,
      impactRange: f.impactRange,
      levels: f.levels.map((l: any) => ({
        label: l.label,
        count: l.count,
        medianUsdM2: l.medianPriceM2,
        premium: l.premium,
      })),
    }));

    const systemPrompt = `Sos un analista inmobiliario experto en el mercado argentino. 
Analizá los siguientes factores que impactan en el precio por metro cuadrado (USD/m²) de propiedades.

Para cada factor, devolvé:
1. Un peso relativo (weight) de 0 a 100 indicando cuánto impacta este factor en el precio
2. Una interpretación breve de por qué este factor importa
3. Una recomendación para inversores

También generá un resumen ejecutivo del modelo de precios.

IMPORTANTE: Respondé ÚNICAMENTE con el JSON del tool call, sin texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Datos de factores de precio:\n\n${JSON.stringify(summary, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "price_model_analysis",
              description: "Returns structured price factor analysis",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "string",
                    description: "Resumen ejecutivo del modelo de precios (2-3 oraciones)",
                  },
                  factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        weight: { type: "number", description: "0-100" },
                        interpretation: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["name", "weight", "interpretation", "recommendation"],
                    },
                  },
                  top_opportunity_signals: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3-5 señales que indican una buena oportunidad de inversión",
                  },
                },
                required: ["executive_summary", "factors", "top_opportunity_signals"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "price_model_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Intentá de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-price-model error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
