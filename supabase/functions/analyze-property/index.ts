import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
    const { property_id } = await req.json();

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

    // 2. Scrape with Firecrawl (markdown + screenshot + links)
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

    // 3. Build prompt (same as Python script)
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

RESPONDE SOLO CON ESTE JSON (sin markdown, sin explicaciones):
{
    "estado_general": "Descripción del estado (ej: Muy buen estado, Regular, etc)",
    "highlights": ["Punto positivo 1", "Punto positivo 2", "..."],
    "lowlights": ["Punto negativo 1", "Punto negativo 2", "..."],
    "score_multiplicador": 1.15,
    "informe_breve": "Resumen de 2-3 oraciones sobre la propiedad, su estado y valor relativo."
}`;

    // 4. Call Lovable AI (Gemini with vision)
    console.log("Calling Lovable AI...");

    const messages: any[] = [
      { role: "system", content: "Eres un tasador inmobiliario experto. Respondé SOLO con JSON válido, sin markdown ni explicaciones." },
    ];

    // Build user message with image if available
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
          JSON.stringify({ success: false, error: "Créditos de IA agotados. Agregá créditos en Settings > Workspace > Usage." }),
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
      console.error("Could not extract JSON from AI response");
      return new Response(
        JSON.stringify({ success: false, error: "AI did not return valid JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analysis: any;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON parse error:", e);
      return new Response(
        JSON.stringify({ success: false, error: "AI returned malformed JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize
    const score = typeof analysis.score_multiplicador === "number"
      ? Math.round(analysis.score_multiplicador * 100) / 100
      : 1.0;
    const highlights = Array.isArray(analysis.highlights) ? analysis.highlights : [];
    const lowlights = Array.isArray(analysis.lowlights) ? analysis.lowlights : [];
    const informe = typeof analysis.informe_breve === "string" ? analysis.informe_breve : "";
    const estado = typeof analysis.estado_general === "string" ? analysis.estado_general : "Sin datos";

    // 6. Update property in DB
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        score_multiplicador: score,
        informe_breve: informe,
        highlights,
        lowlights,
        estado_general: estado,
      })
      .eq("id", property_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analysis saved for ${property_id}: score=${score}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: { score_multiplicador: score, informe_breve: informe, highlights, lowlights, estado_general: estado },
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
