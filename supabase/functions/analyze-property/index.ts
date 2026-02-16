import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Estimate renovation cost per m² based on score_multiplicador */
function estimateRenovationCostPerM2(score: number): number {
  if (score >= 1.0) return 0;
  if (score >= 0.9) return 100;
  if (score >= 0.8) return 200;
  if (score >= 0.7) return 350;
  if (score >= 0.6) return 500;
  return 700;
}

/** Calculate Q3 (75th percentile) of an array */
function q3(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.75);
  return sorted[Math.min(idx, sorted.length - 1)];
}

/** Calculate median of an array */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!lovableKey) {
    return new Response(
      JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { property_id, surface_type = "total", min_surface_enabled = true } = await req.json();

    if (!property_id) {
      return new Response(
        JSON.stringify({ success: false, error: "property_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get property from DB
    const { data: prop, error: propError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (propError || !prop) {
      return new Response(
        JSON.stringify({ success: false, error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prop.url) {
      return new Response(
        JSON.stringify({ success: false, error: "Property has no URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing property ${property_id}: ${prop.url}`);

    // 2. Scrape with Firecrawl
    console.log("Scraping with Firecrawl...");
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: prop.url,
        formats: ["markdown", "screenshot", "links"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error("Firecrawl error:", JSON.stringify(scrapeData));
      return new Response(
        JSON.stringify({ success: false, error: `Scraping failed: ${scrapeData.error || "Unknown error"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot || null;

    console.log(`Scraped: ${markdown.length} chars markdown, screenshot: ${!!screenshot}`);

    // 3. Build prompt
    const prompt = `Eres un tasador inmobiliario experto en Argentina con 20 años de experiencia.

INFORMACIÓN DE LA PROPIEDAD (de nuestra base de datos):
- Tipo: ${prop.property_type || "N/A"}
- Precio: ${prop.currency || "USD"} ${prop.price ? Number(prop.price).toLocaleString() : "N/A"}
- Superficie: ${prop.surface_total || "N/A"} m² totales, ${prop.surface_covered || "N/A"} m² cubiertos
- Ambientes: ${prop.rooms || "N/A"}
- Dormitorios: ${prop.bedrooms || "N/A"}
- Baños: ${prop.bathrooms || "N/A"}
- Ubicación: ${prop.neighborhood || "N/A"}, ${prop.city || "N/A"}
- Descripción DB: ${(prop.description || "N/A").substring(0, 500)}

CONTENIDO SCRAPEADO DE LA PUBLICACIÓN:
${markdown.substring(0, 4000)}

ANALIZA LA INFORMACIÓN Y LA IMAGEN (screenshot de la publicación):

CRITERIOS DE SCORING (MULTIPLICADOR DE VALOR):
Base = 1.0 (propiedad promedio: estado aceptable, luz normal, sin lujos ni problemas)

FACTORES QUE SUMAN/RESTAN:

1. ESTADO FÍSICO:
   • Impecable/A estrenar/Recién reformado: +0.20 a +0.25
   • Muy buen estado (bien mantenido, limpio): +0.10 a +0.15
   • Estado aceptable (uso normal, pequeños detalles): 0
   • Necesita mejoras (pintura, arreglos menores): -0.10 a -0.15
   • Refacción parcial necesaria: -0.20 a -0.25
   • Refacción completa: -0.30 a -0.40

2. LUMINOSIDAD:
   • Excepcional (muy luminosa, ventanales grandes, orientación norte): +0.15
   • Muy buena (buena luz natural): +0.08 a +0.12
   • Normal: 0
   • Poca luz: -0.08 a -0.12
   • Muy oscura: -0.15 a -0.20

3. TERMINACIONES Y CALIDAD:
   • Premium (porcelanato, cocina integrada moderna, baños de diseño): +0.15
   • Muy buenas: +0.08 a +0.12
   • Estándar: 0
   • Básicas: -0.03 a -0.07
   • Viejas/Deterioradas: -0.10 a -0.15

4. DISEÑO Y DISTRIBUCIÓN:
   • Diseño arquitectónico destacado: +0.10 a +0.15
   • Distribución funcional estándar: 0
   • Distribución obsoleta: -0.05 a -0.10

5. EXTRAS Y AMENITIES:
   • Vista premium + terraza + amenities: +0.15
   • Vista abierta o terraza grande: +0.08 a +0.12
   • Sin extras: 0
   • Vista a medianera: -0.05 a -0.08

6. PROBLEMAS CRÍTICOS:
   • Humedad visible: -0.15 a -0.25
   • Problemas estructurales: -0.20 a -0.30
   • Instalaciones precarias: -0.10 a -0.15

IMPORTANTE:
- SÉ CRÍTICO Y REALISTA. No todas las propiedades son "excelentes".
- La MAYORÍA debe estar entre 0.85 y 1.15
- Solo casos excepcionales merecen >1.25 o <0.70
- Si ves problemas, mencionálos sin suavizar
- CRÍTICO: el estado_general DEBE ser consistente con el score:
  • score ≥ 1.0 → "Excelente"
  • score 0.90–0.99 → "Buen estado"
  • score 0.80–0.89 → "Aceptable"
  • score 0.70–0.79 → "Necesita mejoras"
  • score 0.60–0.69 → "Refacción parcial"
  • score < 0.60 → "Refacción completa"

RESPONDE SOLO CON ESTE JSON (sin markdown, sin explicaciones):
{
    "estado_general": "Debe coincidir con el rango del score (ver tabla arriba)",
    "highlights": ["Punto positivo 1", "Punto positivo 2", "..."],
    "lowlights": ["Punto negativo 1", "Punto negativo 2", "..."],
    "score_multiplicador": 0.85,
    "informe_breve": "Resumen de 2-3 oraciones sobre la propiedad, su estado y valor relativo."
}`;

    // 4. Call Lovable AI (Gemini with vision)
    console.log("Calling Lovable AI...");

    const messages: any[] = [
      { role: "system", content: "Eres un tasador inmobiliario experto. Respondé SOLO con JSON válido, sin markdown ni explicaciones." },
    ];

    if (screenshot) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: screenshot } },
          { type: "text", text: prompt },
        ],
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI gateway error ${aiResponse.status}:`, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Intentá de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `AI analysis failed: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response:", aiText.substring(0, 200));

    // 5. Parse JSON from AI response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "AI did not return valid JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analysis: any;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "AI returned malformed JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const score = typeof analysis.score_multiplicador === "number"
      ? Math.round(analysis.score_multiplicador * 100) / 100
      : 1.0;
    const highlights = Array.isArray(analysis.highlights) ? analysis.highlights : [];
    const lowlights = Array.isArray(analysis.lowlights) ? analysis.lowlights : [];
    const informe = typeof analysis.informe_breve === "string" ? analysis.informe_breve : "";

    // Enforce consistency between score and estado_general
    const enforceEstado = (s: number): string => {
      if (s >= 1.0) return "Excelente";
      if (s >= 0.9) return "Buen estado";
      if (s >= 0.8) return "Aceptable";
      if (s >= 0.7) return "Necesita mejoras";
      if (s >= 0.6) return "Refacción parcial";
      return "Refacción completa";
    };
    const estado = enforceEstado(score);
    const aiEstado = typeof analysis.estado_general === "string" ? analysis.estado_general : "";
    if (aiEstado && aiEstado !== estado) {
      console.log(`Estado corrected: AI said "${aiEstado}" but score ${score} maps to "${estado}"`);
    }

    // 6. Calculate Valor Potencial from comparables
    console.log("Querying comparables...");
    let valorPotencialM2: number | null = null;
    let valorPotencialTotal: number | null = null;
    let comparablesCount = 0;
    let oportunidadAjustada: number | null = null;
    let oportunidadNeta: number | null = null;

    // Comparables & valor potencial ALWAYS use surface_total / price_per_m2_total
    // Only renovation cost uses the surface_type toggle
    const useCovered = surface_type === "covered";
    const surfaceTotal = prop.surface_total ? Number(prop.surface_total) : null;
    const pricePerM2 = prop.price_per_m2_total ? Number(prop.price_per_m2_total) : null;
    
    // Surface for renovation cost calculation only
    let renovSurface: number | null;
    if (useCovered) {
      const covered = prop.surface_covered ? Number(prop.surface_covered) : null;
      if (covered && surfaceTotal && min_surface_enabled && covered < surfaceTotal / 2) {
        // Min surface floor: if covered < total/2, use total/2 (likely needs expansion)
        renovSurface = Math.round(surfaceTotal / 2);
        console.log(`Min surface floor applied: covered=${covered}, total/2=${renovSurface}`);
      } else {
        renovSurface = covered || surfaceTotal;
      }
    } else {
      renovSurface = surfaceTotal;
    }

    console.log(`surface_type: ${surface_type}, min_surface: ${min_surface_enabled}, surfaceTotal: ${surfaceTotal}, renovSurface: ${renovSurface}, pricePerM2: ${pricePerM2}`);

    if (surfaceTotal && surfaceTotal > 0 && prop.property_type) {
      const surfaceMin = surfaceTotal * 0.6;
      const surfaceMax = surfaceTotal * 1.4;

      // Try neighborhood first
      let { data: comparables } = await supabase
        .from("properties")
        .select("price_per_m2_total")
        .eq("property_type", prop.property_type)
        .eq("neighborhood", prop.neighborhood)
        .gte("surface_total", surfaceMin)
        .lte("surface_total", surfaceMax)
        .gt("price_per_m2_total", 0)
        .neq("id", property_id);

      // Fallback to city if <3 comparables in neighborhood
      if (!comparables || comparables.length < 3) {
        console.log(`Only ${comparables?.length || 0} in neighborhood, falling back to city...`);
        const { data: cityComparables } = await supabase
          .from("properties")
          .select("price_per_m2_total")
          .eq("property_type", prop.property_type)
          .eq("city", prop.city)
          .gte("surface_total", surfaceMin)
          .lte("surface_total", surfaceMax)
          .gt("price_per_m2_total", 0)
          .neq("id", property_id);

        if (cityComparables && cityComparables.length >= 3) {
          comparables = cityComparables;
        }
      }

      if (comparables && comparables.length >= 3) {
        const prices = comparables.map((c: any) => Number(c.price_per_m2_total));
        comparablesCount = prices.length;

        // Q3 = upper quartile → premium m2 value
        valorPotencialM2 = Math.round(q3(prices));
        valorPotencialTotal = Math.round(valorPotencialM2 * surfaceTotal);

        console.log(`Comparables: ${comparablesCount}, Q3 USD/m²: ${valorPotencialM2}, Valor potencial: USD ${valorPotencialTotal}`);

        // Calculate opportunity indicators if we have price data
        if (pricePerM2 && pricePerM2 > 0) {
          const med = median(prices);

          if (med > 0) {
            // % below median (can be negative if above median)
            const pctBelowMedian = ((med - pricePerM2) / med) * 100;

            // Indicador 1: Oportunidad Ajustada (simple)
            // Higher = better opportunity. Discount × quality multiplier
            oportunidadAjustada = Math.round(pctBelowMedian * score * 100) / 100;

            // Indicador 2: Oportunidad Neta (with renovation cost)
            const currentPrice = prop.price ? Number(prop.price) : 0;
            if (currentPrice > 0 && valorPotencialTotal > 0) {
              const renovCostPerM2 = estimateRenovationCostPerM2(score);
              const renovCostTotal = renovCostPerM2 * (renovSurface || surfaceTotal);
              // Net gain = potential value - current price - renovation cost
              oportunidadNeta = Math.round(valorPotencialTotal - currentPrice - renovCostTotal);

              console.log(`Renov cost: USD ${renovCostPerM2}/m² (${renovCostTotal} total), Oportunidad neta: USD ${oportunidadNeta}`);
            }
          }
        }
      } else {
        console.log(`Insufficient comparables: ${comparables?.length || 0} (need ≥10)`);
      }
    }

    // 7. Update property in DB
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        score_multiplicador: score,
        informe_breve: informe,
        highlights,
        lowlights,
        estado_general: estado,
        valor_potencial_m2: valorPotencialM2,
        valor_potencial_total: valorPotencialTotal,
        comparables_count: comparablesCount,
        oportunidad_ajustada: oportunidadAjustada,
        oportunidad_neta: oportunidadNeta,
      })
      .eq("id", property_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analysis saved for ${property_id}: score=${score}, valorPotencial=${valorPotencialTotal}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          score_multiplicador: score,
          informe_breve: informe,
          highlights,
          lowlights,
          estado_general: estado,
          valor_potencial_m2: valorPotencialM2,
          valor_potencial_total: valorPotencialTotal,
          comparables_count: comparablesCount,
          oportunidad_ajustada: oportunidadAjustada,
          oportunidad_neta: oportunidadNeta,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analyze error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
