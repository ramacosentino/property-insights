import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Property } from "@/lib/propertyData";
import { getOpportunityLabel } from "@/lib/opportunityLabels";
import { Columns, X, ExternalLink, Sparkles, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSurfaceType, getMinSurfaceEnabled, getRenovationCosts } from "@/pages/Settings";

interface CompareAnalysis {
  score_multiplicador: number | null;
  estado_general: string | null;
  highlights: string[] | null;
  lowlights: string[] | null;
  valor_potencial_total: number | null;
  oportunidad_ajustada: number | null;
  oportunidad_neta: number | null;
  comparables_count: number | null;
}

const MAX_COMPARE = 4;

type HighlightDir = "min" | "max" | "none";

interface RowDef {
  label: string;
  getValue: (p: Property, a: CompareAnalysis | null) => number | null;
  format: (p: Property, a: CompareAnalysis | null) => string;
  subtext?: (p: Property) => string | undefined;
  best: HighlightDir;
}

const Comparador = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const { selectedIds } = usePreselection();
  const { toast } = useToast();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [analyses, setAnalyses] = useState<Record<string, CompareAnalysis>>({});
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  // Pre-populate with first 2 preselected that have analysis
  useEffect(() => {
    if (!user || compareIds.length > 0) return;
    supabase
      .from("user_property_analysis")
      .select("property_id, score_multiplicador, estado_general, highlights, lowlights, valor_potencial_total, oportunidad_ajustada, oportunidad_neta, comparables_count")
      .eq("user_id", user.id)
      .then(({ data: rows }) => {
        if (!rows) return;
        const analysisMap: Record<string, CompareAnalysis> = {};
        rows.forEach((r: any) => { analysisMap[r.property_id] = r; });
        setAnalyses(analysisMap);
        const analyzedPreselected = [...selectedIds].filter(id => analysisMap[id]);
        setCompareIds(analyzedPreselected.slice(0, 2));
      });
  }, [user, selectedIds]);

  const addProperty = (id: string) => {
    if (compareIds.length >= MAX_COMPARE || compareIds.includes(id)) return;
    setCompareIds([...compareIds, id]);
    setSearchTerm("");
    setAiAnalysis(""); // Reset AI analysis when properties change
  };

  const removeProperty = (id: string) => {
    setCompareIds(compareIds.filter(cid => cid !== id));
    setAiAnalysis("");
  };

  const compared = useMemo(() =>
    compareIds.map(id => properties.find(p => p.id === id)).filter(Boolean) as Property[],
    [compareIds, properties]
  );

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const s = searchTerm.toLowerCase();
    return properties
      .filter(p =>
        !compareIds.includes(p.id) &&
        (p.location?.toLowerCase().includes(s) || p.neighborhood?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s) || p.street?.toLowerCase().includes(s))
      )
      .slice(0, 8);
  }, [searchTerm, properties, compareIds]);

  const getAnalysis = (p: Property): CompareAnalysis | null => {
    if (analyses[p.id]) return analyses[p.id];
    if (p.score_multiplicador != null) return {
      score_multiplicador: p.score_multiplicador,
      estado_general: p.estado_general ?? null,
      highlights: p.highlights ?? null,
      lowlights: p.lowlights ?? null,
      valor_potencial_total: p.valor_potencial_total ?? null,
      oportunidad_ajustada: p.oportunidad_ajustada ?? null,
      oportunidad_neta: p.oportunidad_neta ?? null,
      comparables_count: p.comparables_count ?? null,
    };
    return null;
  };

  // Row definitions with best-direction for highlighting
  const rows: RowDef[] = [
    { label: "Precio", best: "min", getValue: p => p.price, format: p => `USD ${p.price.toLocaleString()}` },
    { label: "USD/m²", best: "min", getValue: p => p.pricePerM2Total ?? null, format: p => p.pricePerM2Total ? `$${p.pricePerM2Total.toLocaleString()}` : "—" },
    { label: "Superficie total", best: "max", getValue: p => p.surfaceTotal ?? null, format: p => p.surfaceTotal ? `${p.surfaceTotal} m²` : "—" },
    { label: "Sup. cubierta", best: "max", getValue: p => p.surfaceCovered ?? null, format: p => p.surfaceCovered ? `${p.surfaceCovered} m²` : "—" },
    { label: "Ambientes", best: "max", getValue: p => p.rooms ?? null, format: p => p.rooms ? `${p.rooms}` : "—" },
    { label: "Dormitorios", best: "max", getValue: p => p.bedrooms ?? null, format: p => p.bedrooms ? `${p.bedrooms}` : "—" },
    { label: "Baños", best: "max", getValue: p => p.bathrooms ?? null, format: p => p.bathrooms ? `${p.bathrooms}` : "—" },
    { label: "Cocheras", best: "max", getValue: p => p.parking ?? null, format: p => p.parking ? `${p.parking}` : "—" },
    { label: "Antigüedad", best: "min", getValue: p => p.ageYears ?? null, format: p => p.ageYears != null ? `${p.ageYears} años` : "—" },
    { label: "Disposición", best: "none", getValue: () => null, format: p => p.disposition || "—" },
    {
      label: "Oportunidad", best: "max",
      getValue: p => p.opportunityScore,
      format: p => { const lbl = getOpportunityLabel(p.opportunityScore); return `${lbl.emoji} ${lbl.shortText}`; },
      subtext: p => `${Math.abs(p.opportunityScore).toFixed(0)}% ${p.opportunityScore >= 0 ? "bajo" : "sobre"} mediana`,
    },
    {
      label: "Estado general", best: "none",
      getValue: () => null,
      format: (p, a) => a?.estado_general || "Sin análisis",
    },
    {
      label: "x Valor", best: "max",
      getValue: (_, a) => a?.score_multiplicador ?? null,
      format: (_, a) => a?.score_multiplicador != null ? `${a.score_multiplicador.toFixed(2)}x` : "—",
    },
    {
      label: "Valor potencial", best: "max",
      getValue: (_, a) => a?.valor_potencial_total ?? null,
      format: (_, a) => a?.valor_potencial_total ? `USD ${a.valor_potencial_total.toLocaleString()}` : "—",
    },
    {
      label: "Ganancia neta est.", best: "max",
      getValue: (_, a) => a?.oportunidad_neta ?? null,
      format: (_, a) => a?.oportunidad_neta != null ? `${a.oportunidad_neta > 0 ? "+" : ""}USD ${(a.oportunidad_neta / 1000).toFixed(0)}K` : "—",
    },
  ];

  // Compute best values per row
  const bestValues = useMemo(() => {
    if (compared.length < 2) return new Map<string, number | null>();
    const map = new Map<string, number | null>();
    rows.forEach(row => {
      if (row.best === "none") { map.set(row.label, null); return; }
      const values = compared.map(p => row.getValue(p, getAnalysis(p))).filter((v): v is number => v != null);
      if (values.length < 2) { map.set(row.label, null); return; }
      const allEqual = values.every(v => v === values[0]);
      if (allEqual) { map.set(row.label, null); return; }
      map.set(row.label, row.best === "min" ? Math.min(...values) : Math.max(...values));
    });
    return map;
  }, [compared, analyses]);

  const isWinner = (row: RowDef, p: Property) => {
    const best = bestValues.get(row.label);
    if (best == null) return false;
    return row.getValue(p, getAnalysis(p)) === best;
  };

  // Analyze a single property
  const analyzeProperty = useCallback(async (propertyId: string): Promise<CompareAnalysis | null> => {
    if (!user) return null;
    try {
      const costs = getRenovationCosts();
      const renovationCosts: Record<string, number> = {};
      costs.forEach(c => { renovationCosts[`${c.minScore}`] = c.costPerM2; });

      const { data, error } = await supabase.functions.invoke("analyze-property", {
        body: { property_id: propertyId, user_id: user.id, surface_type: getSurfaceType(), min_surface_enabled: getMinSurfaceEnabled(), renovation_costs: renovationCosts },
      });
      if (error) throw error;
      if (data?.success) {
        const a: CompareAnalysis = {
          score_multiplicador: data.analysis.score_multiplicador,
          estado_general: data.analysis.estado_general,
          highlights: data.analysis.highlights,
          lowlights: data.analysis.lowlights,
          valor_potencial_total: data.analysis.valor_potencial_total,
          oportunidad_ajustada: data.analysis.oportunidad_ajustada,
          oportunidad_neta: data.analysis.oportunidad_neta,
          comparables_count: data.analysis.comparables_count,
        };
        return a;
      }
    } catch (err) {
      console.error("Auto-analysis error for", propertyId, err);
    }
    return null;
  }, [user]);

  // AI comparison — auto-analyzes unanalyzed properties first
  const runAiComparison = useCallback(async () => {
    if (compared.length < 2) return;
    setAiLoading(true);
    setAiAnalysis("");

    // Step 1: auto-analyze any unanalyzed properties
    const unanalyzed = compared.filter(p => !getAnalysis(p));
    if (unanalyzed.length > 0) {
      toast({ title: "🔍 Analizando propiedades...", description: `${unanalyzed.length} propiedad${unanalyzed.length > 1 ? "es" : ""} sin análisis previo.` });
      const newIds = new Set(unanalyzed.map(p => p.id));
      setAnalyzingIds(newIds);

      const results = await Promise.all(unanalyzed.map(async (p) => {
        const result = await analyzeProperty(p.id);
        setAnalyzingIds(prev => { const next = new Set(prev); next.delete(p.id); return next; });
        return { id: p.id, analysis: result };
      }));

      const updatedAnalyses = { ...analyses };
      let anyFailed = false;
      results.forEach(r => {
        if (r.analysis) {
          updatedAnalyses[r.id] = r.analysis;
        } else {
          anyFailed = true;
        }
      });
      setAnalyses(updatedAnalyses);

      if (anyFailed) {
        toast({ title: "⚠️ Algunas propiedades no pudieron analizarse", description: "Se compararán con los datos disponibles.", variant: "destructive" });
      }
    }

    // Step 2: run AI comparison
    const propsPayload = compared.map(p => {
      const a = getAnalysis(p) || (analyses[p.id] ?? null);
      return {
        title: `${p.propertyType || ""} - ${p.location || p.street}, ${p.neighborhood}`,
        propertyType: p.propertyType,
        location: p.location,
        neighborhood: p.neighborhood,
        price: p.price,
        pricePerM2Total: p.pricePerM2Total,
        surfaceTotal: p.surfaceTotal,
        surfaceCovered: p.surfaceCovered,
        rooms: p.rooms,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        parking: p.parking,
        ageYears: p.ageYears,
        disposition: p.disposition,
        score: a?.score_multiplicador,
        estado: a?.estado_general,
        opportunityScore: p.opportunityScore,
        valorPotencial: a?.valor_potencial_total,
        gananciaNeta: a?.oportunidad_neta,
        highlights: a?.highlights,
        lowlights: a?.lowlights,
      };
    });

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ properties: propsPayload }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Error desconocido" }));
        toast({ title: "Error", description: err.error || "No se pudo generar el análisis", variant: "destructive" });
        setAiLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { setAiLoading(false); return; }

      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiAnalysis(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("AI comparison error:", e);
      toast({ title: "Error", description: "No se pudo conectar con el servicio de IA", variant: "destructive" });
    }
    setAiLoading(false);
  }, [compared, analyses, toast, analyzeProperty]);

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-4">
        Compará hasta {MAX_COMPARE} propiedades analizadas lado a lado.
      </p>

        {/* Property selector */}
        {compareIds.length < MAX_COMPARE && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscá una propiedad analizada para agregar..."
                className="w-full px-4 py-2.5 rounded-full border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProperty(p.id)}
                      className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {[
                            p.propertyType ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1) : "",
                            [p.street || p.location || "", p.neighborhood].filter(Boolean).join(", ")
                          ].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">USD {p.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="mt-3">
                <span className="text-[11px] text-muted-foreground font-medium">Tus proyectos guardados:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[...selectedIds]
                    .filter(id => !compareIds.includes(id))
                    .slice(0, 10)
                    .map(id => {
                      const p = properties.find(pp => pp.id === id);
                      if (!p) return null;
                      const typeName = p.propertyType ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1) : "";
                      const addr = p.street || p.location || p.neighborhood;
                      const priceK = p.price >= 1000000 ? `$${(p.price / 1000000).toFixed(1)}M` : `$${(p.price / 1000).toFixed(0)}K`;
                      const chipLabel = [typeName, addr, priceK].filter(Boolean).join(" · ");
                      return (
                        <button
                          key={id}
                          onClick={() => addProperty(id)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-medium border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                        >
                          {chipLabel}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comparison table */}
        {compared.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Columns className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Seleccioná propiedades para comparar</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Buscá propiedades analizadas arriba o seleccionalas desde tus proyectos guardados.
            </p>
          </div>
        ) : (
          <>
            <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-40">Métrica</th>
                    {compared.map(p => {
                      const typeName = p.propertyType ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1) : "";
                      const address = p.street || p.location || "";
                      const titleText = [typeName, [address, p.neighborhood].filter(Boolean).join(", ")].filter(Boolean).join(" - ");
                      const priceText = `USD ${p.price >= 1000000 ? (p.price / 1000000).toFixed(1) + "M" : (p.price / 1000).toFixed(0) + "K"}`;
                      return (
                        <th key={p.id} className="px-4 py-3 text-left min-w-[180px]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-foreground line-clamp-2">{titleText}</span>
                              <span className="text-[11px] text-primary font-medium block">{priceText}</span>
                              {analyzingIds.has(p.id) && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Analizando...
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground hover:text-primary">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <button onClick={() => removeProperty(p.id)} className="p-1 text-muted-foreground hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.label} className={`border-b border-border/50 ${ri % 2 === 0 ? "" : "bg-secondary/20"}`}>
                      <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground">{row.label}</td>
                      {compared.map(p => {
                        const winner = isWinner(row, p);
                        const a = getAnalysis(p);
                        const text = row.format(p, a);
                        const sub = row.subtext?.(p);
                        return (
                          <td key={p.id} className={`px-4 py-2.5 ${winner ? "bg-primary/5" : ""}`}>
                            <span className={`text-sm font-mono ${winner ? "font-bold text-primary" : "text-foreground"}`}>
                              {text}
                            </span>
                            {winner && <span className="ml-1.5 text-[10px] text-primary">★</span>}
                            {sub && <span className="block text-[10px] text-muted-foreground">{sub}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Highlights */}
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground align-top">✅ Pros</td>
                    {compared.map(p => {
                      const a = getAnalysis(p);
                      return (
                        <td key={p.id} className="px-4 py-2.5 align-top">
                          {a?.highlights && a.highlights.length > 0 ? (
                            <ul className="space-y-0.5">
                              {a.highlights.map((h, i) => (
                                <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1">
                                  <span className="text-primary mt-0.5 shrink-0">✓</span> {h}
                                </li>
                              ))}
                            </ul>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Lowlights */}
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground align-top">❌ Contras</td>
                    {compared.map(p => {
                      const a = getAnalysis(p);
                      return (
                        <td key={p.id} className="px-4 py-2.5 align-top">
                          {a?.lowlights && a.lowlights.length > 0 ? (
                            <ul className="space-y-0.5">
                              {a.lowlights.map((l, i) => (
                                <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1">
                                  <span className="text-destructive mt-0.5 shrink-0">✕</span> {l}
                                </li>
                              ))}
                            </ul>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI Comparison */}
            {compared.length >= 2 && (
              <div className="mt-6">
                {!aiAnalysis && !aiLoading && (() => {
                  const unanalyzedCount = compared.filter(p => !getAnalysis(p)).length;
                  return (
                    <button
                      onClick={runAiComparison}
                      disabled={analyzingIds.size > 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all mx-auto disabled:opacity-50"
                    >
                      {analyzingIds.size > 0 ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Analizando...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {unanalyzedCount > 0
                            ? `Analizar (${unanalyzedCount}) y comparar con IA`
                            : "Análisis IA: ¿Cuál es mejor inversión?"}
                        </>
                      )}
                    </button>
                  );
                })()}
                {(aiLoading || aiAnalysis) && (
                  <div className="glass-card rounded-2xl p-6 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Análisis comparativo IA</h3>
                      {aiLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
                    </div>
                    <div className="prose prose-sm max-w-none text-foreground/90 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-foreground [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5 [&_strong]:text-foreground">
                      {aiAnalysis.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
                        if (line.startsWith("- ")) return <li key={i} className="text-sm list-disc ml-4">{line.slice(2)}</li>;
                        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-sm">{line.slice(2, -2)}</p>;
                        if (line.trim() === "") return <br key={i} />;
                        return <p key={i} className="text-sm">{line}</p>;
                      })}
                    </div>
                    {!aiLoading && aiAnalysis && (
                      <button
                        onClick={runAiComparison}
                        className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Sparkles className="h-3 w-3" />
                        Regenerar análisis
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default Comparador;
