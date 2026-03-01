import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { properties } = await req.json();
    if (!properties || !Array.isArray(properties) || properties.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 properties required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertySummaries = properties.map((p: any, i: number) => {
      return `PROPIEDAD ${i + 1}: "${p.title}"
- Tipo: ${p.propertyType || "N/A"}
- Dirección: ${p.location || "N/A"}, ${p.neighborhood || "N/A"}
- Precio: USD ${p.price?.toLocaleString() || "N/A"}
- USD/m² total: ${p.pricePerM2Total || "N/A"}
- Superficie total: ${p.surfaceTotal || "N/A"} m²
- Superficie cubierta: ${p.surfaceCovered || "N/A"} m²
- Ambientes: ${p.rooms || "N/A"}, Dormitorios: ${p.bedrooms || "N/A"}, Baños: ${p.bathrooms || "N/A"}
- Cocheras: ${p.parking || "N/A"}
- Antigüedad: ${p.ageYears != null ? p.ageYears + " años" : "N/A"}
- Disposición: ${p.disposition || "N/A"}
- Score multiplicador: ${p.score != null ? p.score + "x" : "N/A"}
- Estado general: ${p.estado || "N/A"}
- Oportunidad: ${p.opportunityScore != null ? p.opportunityScore.toFixed(1) + "% vs mediana" : "N/A"}
- Valor potencial: USD ${p.valorPotencial?.toLocaleString() || "N/A"}
- Ganancia neta estimada: USD ${p.gananciaNeta?.toLocaleString() || "N/A"}
- Highlights: ${p.highlights?.join(", ") || "N/A"}
- Lowlights: ${p.lowlights?.join(", ") || "N/A"}`;
    }).join("\n\n");

    const systemPrompt = `Eres un asesor inmobiliario experto en inversiones en Argentina. 
Analizás propiedades de forma directa, práctica y con opiniones claras. 
Usás un tono profesional pero accesible. Respondé en español rioplatense.
Sé conciso pero contundente. No repitas datos que el usuario ya ve en la tabla.`;

    const userPrompt = `Compará estas ${properties.length} propiedades y dame un análisis de inversión:

${propertySummaries}

Estructura tu respuesta así:

## 🏆 Ranking general
Ordenalas de mejor a peor inversión y explicá brevemente por qué.

## 💰 Mejor para refacción y reventa
¿Cuál tiene más margen? Considerá el estado, costo de renovación estimado y ganancia neta.

## 🏠 Mejor para vivir
¿Cuál ofrece mejor calidad de vida considerando ubicación, estado y precio?

## 📈 Mejor relación precio/valor
¿Cuál está más subvaluada respecto al mercado?

## ⚠️ Riesgos a considerar
Mencioná riesgos específicos de cada propiedad.

## 💡 Veredicto final
En 2-3 oraciones, ¿cuál elegirías y por qué?

IMPORTANTE: Sé directo y opinionado. No digas "depende de tus objetivos" sin dar una recomendación concreta.`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intentá de nuevo en unos segundos." }), {
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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("compare error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
