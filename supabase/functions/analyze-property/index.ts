import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Estimate renovation cost per m² based on score_multiplicador (defaults) */
function defaultRenovationCostPerM2(score: number): number {
  if (score >= 1.0) return 0;
  if (score >= 0.9) return 100;
  if (score >= 0.8) return 200;
  if (score >= 0.7) return 350;
  if (score >= 0.55) return 500;
  return 700;
}

/** Get renovation cost using user-configured costs or defaults */
function getRenovationCostPerM2(score: number, customCosts?: Record<string, number>): number {
  if (!customCosts || Object.keys(customCosts).length === 0) {
    return defaultRenovationCostPerM2(score);
  }
  const thresholds = Object.entries(customCosts)
    .map(([k, v]) => ({ min: parseFloat(k), cost: Number(v) }))
    .filter(t => !isNaN(t.min) && isFinite(t.min) && !isNaN(t.cost))
    .sort((a, b) => b.min - a.min);

  if (thresholds.length === 0) return defaultRenovationCostPerM2(score);

  for (const t of thresholds) {
    if (score >= t.min) return t.cost;
  }
  return thresholds[thresholds.length - 1].cost;
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

/** Enforce consistency between score and estado_general */
function enforceEstado(s: number): string {
  if (s >= 1.0) return "Excelente";
  if (s >= 0.9) return "Buen estado";
  if (s >= 0.8) return "Aceptable";
  if (s >= 0.7) return "Necesita mejoras";
  if (s >= 0.55) return "Refacción parcial";
  return "Refacción completa";
}

/** Scrape property with Firecrawl (with retry on timeout) */
async function scrapeProperty(url: string, firecrawlKey: string) {
  const waitTimes = [5000, 10000];
  for (let attempt = 0; attempt < waitTimes.length; attempt++) {
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "screenshot", "links"],
        onlyMainContent: true,
        waitFor: waitTimes[attempt],
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (scrapeResponse.ok && scrapeData.success) {
      return { success: true, data: scrapeData };
    }

    const isTimeout = scrapeData?.code === "SCRAPE_TIMEOUT";
    if (isTimeout && attempt < waitTimes.length - 1) {
      console.log(`Scrape timeout (attempt ${attempt + 1}), retrying with longer wait...`);
      continue;
    }

    console.error("Firecrawl error:", JSON.stringify(scrapeData));
    return { success: false, error: scrapeData.error || "Unknown error" };
  }
  return { success: false, error: "All scrape attempts failed" };
}

/** Call AI to analyze property */
async function analyzeWithAI(prop: any, markdown: string, screenshot: string | null, lovableKey: string) {
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
- SÉ MUY CRÍTICO Y REALISTA. No todas las propiedades son "excelentes".
- La MAYORÍA debe estar entre 0.85 y 1.15
- Solo casos excepcionales merecen >1.25 o <0.70
- Si ves problemas, mencionálos sin suavizar
- PROPIEDADES EN MAL ESTADO: Si la propiedad está deteriorada, abandonada, necesita demolición parcial, tiene problemas estructurales severos, o es claramente inhabitable sin obras mayores, el score DEBE ser ≤ 0.55 (Refacción completa). No tengas miedo de dar scores de 0.40-0.55 cuando la evidencia lo justifica.
- Si la descripción o las imágenes muestran una propiedad "a reciclar", "a refaccionar", "ideal para demoler y construir", o similar, eso indica Refacción completa (score ≤ 0.55).
- CRÍTICO: el estado_general DEBE ser consistente con el score:
  • score ≥ 1.0 → "Excelente"
  • score 0.90–0.99 → "Buen estado"
  • score 0.80–0.89 → "Aceptable"
  • score 0.70–0.79 → "Necesita mejoras"
  • score 0.55–0.69 → "Refacción parcial"
  • score < 0.55 → "Refacción completa"

RESPONDE SOLO CON ESTE JSON (sin markdown, sin explicaciones):
{
    "estado_general": "Debe coincidir con el rango del score (ver tabla arriba)",
    "highlights": ["Punto positivo 1", "Punto positivo 2", "..."],
    "lowlights": ["Punto negativo 1", "Punto negativo 2", "..."],
    "score_multiplicador": 0.85,
    "informe_breve": "Resumen de 2-3 oraciones sobre la propiedad, su estado y valor relativo."
}`;

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
    return { success: false, status: aiResponse.status, error: errorText };
  }

  const aiData = await aiResponse.json();
  const aiText = aiData.choices?.[0]?.message?.content || "";

  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { success: false, status: 500, error: "AI did not return valid JSON" };
  }

  try {
    const analysis = JSON.parse(jsonMatch[0]);
    const score = typeof analysis.score_multiplicador === "number"
      ? Math.round(analysis.score_multiplicador * 100) / 100
      : 1.0;
    return {
      success: true,
      score,
      highlights: Array.isArray(analysis.highlights) ? analysis.highlights : [],
      lowlights: Array.isArray(analysis.lowlights) ? analysis.lowlights : [],
      informe_breve: typeof analysis.informe_breve === "string" ? analysis.informe_breve : "",
      estado_general: enforceEstado(score),
    };
  } catch {
    return { success: false, status: 500, error: "AI returned malformed JSON" };
  }
}

/** Calculate comparables-based metrics */
function calculateComparables(
  prop: any,
  property_id: string,
  supabase: any,
) {
  return async () => {
    const surfaceTotal = prop.surface_total ? Number(prop.surface_total) : null;
    if (!surfaceTotal || surfaceTotal <= 0 || !prop.property_type) {
      return { valorPotencialM2: null, valorPotencialTotal: null, valorPotencialMedianM2: null, comparablesCount: 0, oportunidadAjustada: null };
    }

    const surfaceMin = surfaceTotal * 0.6;
    const surfaceMax = surfaceTotal * 1.4;
    const pricePerM2 = prop.price_per_m2_total ? Number(prop.price_per_m2_total) : null;

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

    // Fallback to city if <3 comparables
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

    if (!comparables || comparables.length < 3) {
      console.log(`Insufficient comparables: ${comparables?.length || 0}`);
      return { valorPotencialM2: null, valorPotencialTotal: null, valorPotencialMedianM2: null, comparablesCount: 0, oportunidadAjustada: null };
    }

    const prices = comparables.map((c: any) => Number(c.price_per_m2_total));
    const comparablesCount = prices.length;
    const q3Val = Math.round(q3(prices));
    const medianVal = Math.round(median(prices));
    const valorPotencialM2 = Math.round((medianVal + q3Val) / 2);
    const valorPotencialTotal = Math.round(valorPotencialM2 * surfaceTotal);

    let oportunidadAjustada: number | null = null;
    if (pricePerM2 && pricePerM2 > 0) {
      const med = median(prices);
      if (med > 0) {
        const pctBelowMedian = ((med - pricePerM2) / med) * 100;
        // We need the score to calculate this, but we'll pass it in later
        oportunidadAjustada = pctBelowMedian; // raw pctBelowMedian, will be multiplied by score later
      }
    }

    console.log(`Comparables: ${comparablesCount}, Median: ${medianVal}, Q3: ${q3Val}, Avg: ${valorPotencialM2}, Valor potencial: USD ${valorPotencialTotal}`);

    return { valorPotencialM2, valorPotencialTotal, valorPotencialMedianM2: medianVal, comparablesCount, oportunidadAjustada };
  };
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
    const { property_id, user_id, surface_type = "total", min_surface_enabled = true, renovation_costs = null, force = false } = await req.json();
    console.log("Received renovation_costs:", JSON.stringify(renovation_costs));

    if (!property_id) {
      return new Response(
        JSON.stringify({ success: false, error: "property_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id is required" }),
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

    // 2. Check if shared analysis already exists (skip if force=true)
    const hasExistingAnalysis = !force && prop.score_multiplicador != null;
    let score: number;
    let highlights: string[];
    let lowlights: string[];
    let informe: string;
    let estado: string;

    if (hasExistingAnalysis) {
      // Reuse existing shared analysis — skip scraping and AI
      console.log(`Reusing existing analysis for property ${property_id}: score=${prop.score_multiplicador}`);
      score = Number(prop.score_multiplicador);
      highlights = prop.highlights || [];
      lowlights = prop.lowlights || [];
      informe = prop.informe_breve || "";
      estado = prop.estado_general || enforceEstado(score);
    } else {
      // Run full scrape + AI analysis
      console.log(`No existing analysis for property ${property_id}, running full analysis...`);

      // Scrape
      const scrapeResult = await scrapeProperty(prop.url, firecrawlKey);
      if (!scrapeResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: `Scraping failed: ${scrapeResult.error}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const markdown = scrapeResult.data?.data?.markdown || scrapeResult.data?.markdown || "";
      const screenshot = scrapeResult.data?.data?.screenshot || scrapeResult.data?.screenshot || null;
      console.log(`Scraped: ${markdown.length} chars markdown, screenshot: ${!!screenshot}`);

      // AI analysis
      const aiResult = await analyzeWithAI(prop, markdown, screenshot, lovableKey);
      if (!aiResult.success) {
        if (aiResult.status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded. Intentá de nuevo en unos minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (aiResult.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: "Créditos de IA agotados." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: `AI analysis failed: ${aiResult.error}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      score = aiResult.score!;
      highlights = aiResult.highlights!;
      lowlights = aiResult.lowlights!;
      informe = aiResult.informe_breve!;
      estado = aiResult.estado_general!;
    }

    // 3. Calculate comparables (always recalculate — prices may change)
    const calcComparables = calculateComparables(prop, property_id, supabase);
    const compResult = await calcComparables();

    let { valorPotencialM2, valorPotencialTotal, valorPotencialMedianM2, comparablesCount } = compResult;
    let oportunidadAjustada: number | null = null;

    if (compResult.oportunidadAjustada != null) {
      // Multiply raw pctBelowMedian by score
      oportunidadAjustada = Math.round(compResult.oportunidadAjustada * score * 100) / 100;
    }

    // 4. Calculate user-specific oportunidad_neta
    const useCovered = surface_type === "covered";
    const surfaceTotal = prop.surface_total ? Number(prop.surface_total) : null;
    let renovSurface: number | null;
    if (useCovered) {
      const covered = prop.surface_covered ? Number(prop.surface_covered) : null;
      if (covered && surfaceTotal && min_surface_enabled && score < 0.7 && covered < surfaceTotal / 2) {
        renovSurface = Math.round(surfaceTotal / 2);
        console.log(`Min surface floor applied: covered=${covered}, total/2=${renovSurface}`);
      } else {
        renovSurface = covered || surfaceTotal;
      }
    } else {
      renovSurface = surfaceTotal;
    }

    let oportunidadNeta: number | null = null;
    const currentPrice = prop.price ? Number(prop.price) : 0;
    if (currentPrice > 0 && valorPotencialTotal && valorPotencialTotal > 0) {
      const renovCostPerM2 = getRenovationCostPerM2(score, renovation_costs);
      const renovCostTotal = renovCostPerM2 * (renovSurface || surfaceTotal || 0);
      oportunidadNeta = Math.round(valorPotencialTotal - currentPrice - renovCostTotal);
      console.log(`Renov cost: USD ${renovCostPerM2}/m² (${renovCostTotal} total), Oportunidad neta: USD ${oportunidadNeta}`);
    }

    // 5. Save shared analysis to properties table (if new)
    if (!hasExistingAnalysis) {
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
        })
        .eq("id", property_id);

      if (updateError) {
        console.error("Error saving shared analysis to properties:", updateError);
      } else {
        console.log(`Shared analysis saved to properties table for ${property_id}`);
      }
    }

    // 6. Save user-specific data to user_property_analysis
    const userAnalysisData = {
      user_id,
      property_id,
      score_multiplicador: score,
      informe_breve: informe,
      highlights,
      lowlights,
      estado_general: estado,
      valor_potencial_m2: valorPotencialM2,
      valor_potencial_total: valorPotencialTotal,
      valor_potencial_median_m2: valorPotencialMedianM2,
      comparables_count: comparablesCount,
      oportunidad_ajustada: oportunidadAjustada,
      oportunidad_neta: oportunidadNeta,
    };

    const { error: upsertError } = await supabase
      .from("user_property_analysis")
      .upsert(userAnalysisData, { onConflict: "user_id,property_id" });

    if (upsertError) {
      console.error("DB upsert error:", upsertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analysis saved for user ${user_id}, property ${property_id}: score=${score}, reused=${hasExistingAnalysis}`);

    return new Response(
      JSON.stringify({
        success: true,
        reused: hasExistingAnalysis,
        analysis: {
          score_multiplicador: score,
          informe_breve: informe,
          highlights,
          lowlights,
          estado_general: estado,
          valor_potencial_m2: valorPotencialM2,
          valor_potencial_total: valorPotencialTotal,
          valor_potencial_median_m2: valorPotencialMedianM2,
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
