import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Property } from "@/lib/propertyData";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Target, Wrench, Info, Archive, ArrowUpDown } from "lucide-react";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import { NeighborhoodStats } from "@/lib/propertyData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getSurfaceType, getMinSurfaceEnabled, getRenovationCosts } from "@/pages/Settings";
import { useQueryClient } from "@tanstack/react-query";

interface UserAnalysis {
  score_multiplicador: number | null;
  informe_breve: string | null;
  highlights: string[] | null;
  lowlights: string[] | null;
  estado_general: string | null;
  valor_potencial_m2: number | null;
  valor_potencial_total: number | null;
  valor_potencial_median_m2: number | null;
  comparables_count: number | null;
  oportunidad_ajustada: number | null;
  oportunidad_neta: number | null;
}

const AnalysisCard = ({ property, analysis, onAnalyze, isAnalyzing, allProperties, neighborhoodStats, onDiscard, onRestore, isDiscarded }: {
  property: Property;
  analysis: UserAnalysis | null;
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
  allProperties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
  onDiscard?: (id: string) => void;
  onRestore?: (id: string) => void;
  isDiscarded?: boolean;
}) => {
  const hasAnalysis = analysis?.score_multiplicador != null;
  const raw = analysis || {} as any;

  return (
    <div className="space-y-0 relative">
      <PropertyCard property={property} onDiscard={onDiscard} onRestore={onRestore} isDiscarded={isDiscarded} />

      {hasAnalysis ? (
        <TooltipProvider delayDuration={200}>
        <div className="rounded-b-2xl border border-t-0 border-border bg-card p-4 space-y-3 -mt-1">
          {/* Estado + x Valor — side by side */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">Estado General</span>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    Evaluación del estado físico, terminaciones y luminosidad de la propiedad según IA.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-foreground mt-0.5">{raw.estado_general}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-xs text-muted-foreground font-medium">x Valor</span>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    Multiplicador de valor: 1.0 = promedio. Mayor a 1 = mejor que el promedio.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={`text-lg font-bold font-mono ${
                raw.score_multiplicador >= 1.1 ? "text-green-500"
                : raw.score_multiplicador <= 0.9 ? "text-red-500"
                : "text-foreground"
              }`}>
                {raw.score_multiplicador >= 1.0 ? (
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="inline h-4 w-4 mr-1" />
                )}
                {raw.score_multiplicador.toFixed(2)}x
              </span>
            </div>
          </div>

          {/* Valor Potencial */}
          {raw.valor_potencial_total != null && (() => {
            const medianM2 = raw.valor_potencial_median_m2;
            // valor_potencial_m2 is now the average of median & Q3
            const avgM2 = raw.valor_potencial_m2;
            // Compute Q3 from avg = (median + Q3) / 2 → Q3 = 2*avg - median
            const q3M2 = medianM2 != null && avgM2 != null ? Math.round(2 * avgM2 - medianM2) : null;
            const surfaceTotal = property.surfaceTotal || 0;
            const medianTotal = medianM2 != null && surfaceTotal > 0 ? Math.round(medianM2 * surfaceTotal) : null;
            const q3Total = q3M2 != null && surfaceTotal > 0 ? Math.round(q3M2 * surfaceTotal) : null;

            return (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Valor Potencial (renovado)</span>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] text-xs">
                    Rango estimado entre la mediana y el cuartil superior (Q3) del USD/m² de comparables. El valor final es el promedio de ambos.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  USD {raw.valor_potencial_total.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {raw.comparables_count} comp.
                </span>
              </div>
              {medianTotal != null && q3Total != null && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span>Rango:</span>
                  <span className="text-foreground/70">USD {medianTotal.toLocaleString()}</span>
                  <span>–</span>
                  <span className="text-foreground/70">USD {q3Total.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span>USD/m²:</span>
                <span className="text-foreground/70">{medianM2?.toLocaleString() ?? "—"}</span>
                <span>–</span>
                <span className="text-foreground/70">{q3M2?.toLocaleString() ?? "—"}</span>
                <span className="ml-1">(prom: {avgM2?.toLocaleString() ?? "—"})</span>
              </div>
            </div>
            );
          })()}

          {/* Opportunity Indicators */}
          {(raw.oportunidad_ajustada != null || raw.oportunidad_neta != null) && (
            <div className="grid grid-cols-2 gap-2">
              {raw.oportunidad_ajustada != null && (() => {
                const clamped = Math.max(-40, Math.min(40, raw.oportunidad_ajustada));
                const score10 = Math.round(((clamped + 40) / 80) * 100) / 10;
                const scoreLabel = score10 >= 8 ? "Excelente" : score10 >= 6 ? "Buena" : score10 >= 4 ? "Regular" : "Baja";
                const scoreColor = score10 >= 8 ? "text-green-500" : score10 >= 6 ? "text-primary" : score10 >= 4 ? "text-yellow-500" : "text-red-500";

                const scoreMult = raw.score_multiplicador || 1;
                const pctBelow = Math.round(raw.oportunidad_ajustada / scoreMult);

                const priceDesc = pctBelow > 30 ? "Precio muy por debajo del mercado"
                  : pctBelow > 15 ? "Precio competitivo, debajo del mercado"
                  : pctBelow > 0 ? "Precio cercano al mercado"
                  : "Precio por encima del mercado";

                const stateDesc = scoreMult >= 1.1 ? "en excelente estado"
                  : scoreMult >= 0.9 ? "en buen estado"
                  : scoreMult >= 0.8 ? "necesita mejoras menores"
                  : scoreMult >= 0.7 ? "requiere refacción parcial"
                  : "necesita refacción completa";

                const conclusion = pctBelow > 15 && scoreMult >= 0.9
                  ? "Oportunidad directa, lista para comprar."
                  : pctBelow > 15 && scoreMult < 0.9
                  ? "Barata pero con inversión en obra."
                  : pctBelow > 0 && scoreMult >= 1.0
                  ? "Buen estado, precio justo."
                  : pctBelow <= 0
                  ? "Precio alto para la zona."
                  : "Valor competitivo post-renovación.";

                const desc = `${priceDesc}, ${stateDesc}. ${conclusion}`;

                return (
                  <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">Oportunidad</span>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-2.5 w-2.5 text-muted-foreground/50" /></TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-xs">
                          Combina qué tan barata está la propiedad vs. el mercado con su estado físico. 10 = muy barata y en gran estado.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-lg font-bold font-mono ${scoreColor}`}>
                        {score10.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/10</span>
                      <span className={`text-[10px] font-medium ml-auto ${scoreColor}`}>{scoreLabel}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                );
              })()}
              {raw.oportunidad_neta != null && (() => {
                const precio = property.price || 0;
                const valorPot = raw.valor_potencial_total || 0;
                const renovCost = Math.round(valorPot - precio - raw.oportunidad_neta);

                return (
                <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">Ganancia Neta Est.</span>
                  </div>
                  <span className={`text-base font-bold font-mono ${
                    raw.oportunidad_neta > 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {raw.oportunidad_neta > 0 ? "+" : ""}USD {(raw.oportunidad_neta / 1000).toFixed(0)}K
                  </span>
                  <div className="mt-1.5 space-y-0.5 text-[10px] font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Potencial</span>
                      <span className="text-foreground/70">USD {valorPot.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Precio</span>
                      <span className="text-foreground/70">− USD {precio.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Renovación</span>
                      <span className="text-foreground/70">− USD {renovCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
          )}

          {/* Informe */}
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">Informe</span>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs">
                  Resumen generado por IA sobre el estado y valor relativo de la propiedad.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{raw.informe_breve}</p>
          </div>

          {/* Highlights / Lowlights */}
          <div className="grid grid-cols-2 gap-3">
            {raw.highlights && raw.highlights.length > 0 && (
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-green-500 font-medium uppercase tracking-wider">Highlights</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {raw.highlights.map((h: string, i: number) => (
                    <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">✓</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {raw.lowlights && raw.lowlights.length > 0 && (
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Lowlights</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {raw.lowlights.map((l: string, i: number) => (
                    <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1">
                      <span className="text-red-400 mt-0.5">✕</span> {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Neighborhood Section */}
          <NeighborhoodSection
            property={property}
            allProperties={allProperties}
            neighborhoodStats={neighborhoodStats}
          />

          {/* Actions row */}
          <div className="flex gap-2">
            <button
              onClick={() => onAnalyze(property.id)}
              disabled={isAnalyzing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Re-analizando...
                </>
              ) : (
                <>
                  <Search className="h-3 w-3" />
                  Re-analizar
                </>
              )}
            </button>
          </div>
        </div>
        </TooltipProvider>
      ) : (
        <div className="rounded-b-2xl border border-t-0 border-border bg-card p-4 -mt-1">
          <button
            onClick={() => onAnalyze(property.id)}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando... unos segundos
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Analizar con IA
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const MisProyectos = () => {
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const { selectedIds, clear, count } = usePreselection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"active" | "discarded">("active");
  const [userAnalyses, setUserAnalyses] = useState<Record<string, UserAnalysis>>({});
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("none");

  // Fetch user analyses and discarded state
  useEffect(() => {
    if (!user) return;

    supabase
      .from("user_property_analysis")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data: analyses }) => {
        const map: Record<string, UserAnalysis> = {};
        (analyses ?? []).forEach((a: any) => {
          map[a.property_id] = {
            score_multiplicador: a.score_multiplicador,
            informe_breve: a.informe_breve,
            highlights: a.highlights,
            lowlights: a.lowlights,
            estado_general: a.estado_general,
            valor_potencial_m2: a.valor_potencial_m2,
            valor_potencial_total: a.valor_potencial_total,
            valor_potencial_median_m2: (a as any).valor_potencial_median_m2 ?? null,
            comparables_count: a.comparables_count,
            oportunidad_ajustada: a.oportunidad_ajustada,
            oportunidad_neta: a.oportunidad_neta,
          };
        });
        setUserAnalyses(map);
      });

    supabase
      .from("saved_projects")
      .select("property_id, discarded_at")
      .eq("user_id", user.id)
      .not("discarded_at", "is", null)
      .then(({ data: discarded }) => {
        setDiscardedIds(new Set((discarded ?? []).map((d: any) => d.property_id)));
      });
  }, [user]);

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const preselected = properties.filter((p) => selectedIds.has(p.id));
  const activeProjects = preselected.filter((p) => !discardedIds.has(p.id));
  const discardedProjects = preselected.filter((p) => discardedIds.has(p.id));

  const handleAnalyze = async (propertyId: string) => {
    if (!user) return;
    setAnalyzingIds((prev) => new Set([...prev, propertyId]));

    toast({
      title: "🤖 Analizando...",
      description: "Esto puede demorar unos segundos.",
    });

    try {
      const costs = getRenovationCosts();
      const renovationCosts: Record<string, number> = {};
      costs.forEach(c => {
        renovationCosts[`${c.minScore}`] = c.costPerM2;
      });
      const { data, error } = await supabase.functions.invoke("analyze-property", {
        body: { property_id: propertyId, user_id: user.id, surface_type: getSurfaceType(), min_surface_enabled: getMinSurfaceEnabled(), renovation_costs: renovationCosts },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Análisis completado",
          description: `Score: ${data.analysis.score_multiplicador}x — ${data.analysis.estado_general}`,
        });
        // Update local analysis cache
        setUserAnalyses((prev) => ({
          ...prev,
          [propertyId]: data.analysis,
        }));
      } else {
        throw new Error(data?.error || "Analysis failed");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({
        title: "❌ Error en análisis",
        description: err.message || "No se pudo completar el análisis",
        variant: "destructive",
      });
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  };

  const handleDiscard = async (propertyId: string) => {
    if (!user) return;
    await supabase
      .from("saved_projects")
      .update({ discarded_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("property_id", propertyId);
    setDiscardedIds((prev) => new Set([...prev, propertyId]));
    toast({ title: "Proyecto descartado", description: "Podés restaurarlo desde la pestaña Descartados." });
  };

  const handleRestore = async (propertyId: string) => {
    if (!user) return;
    await supabase
      .from("saved_projects")
      .update({ discarded_at: null })
      .eq("user_id", user.id)
      .eq("property_id", propertyId);
    setDiscardedIds((prev) => {
      const next = new Set(prev);
      next.delete(propertyId);
      return next;
    });
    toast({ title: "Proyecto restaurado" });
  };

  const baseProjects = tab === "active" ? activeProjects : discardedProjects;
  
  const displayProjects = [...baseProjects].sort((a, b) => {
    const aa = userAnalyses[a.id];
    const ab = userAnalyses[b.id];
    switch (sortBy) {
      case "ganancia":
        return (ab?.oportunidad_neta ?? -Infinity) - (aa?.oportunidad_neta ?? -Infinity);
      case "oportunidad": {
        const scoreA = aa?.oportunidad_ajustada != null ? ((Math.max(-40, Math.min(40, aa.oportunidad_ajustada)) + 40) / 80) * 10 : -1;
        const scoreB = ab?.oportunidad_ajustada != null ? ((Math.max(-40, Math.min(40, ab.oportunidad_ajustada)) + 40) / 80) * 10 : -1;
        return scoreB - scoreA;
      }
      case "precio":
        return (a.price ?? Infinity) - (b.price ?? Infinity);
      case "usdm2":
        return (a.pricePerM2Total ?? Infinity) - (b.pricePerM2Total ?? Infinity);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Mis Proyectos</h2>
            <p className="text-muted-foreground">
              {activeProjects.length > 0
                ? `${activeProjects.length} activo${activeProjects.length !== 1 ? "s" : ""}${discardedProjects.length > 0 ? ` · ${discardedProjects.length} descartado${discardedProjects.length !== 1 ? "s" : ""}` : ""}`
                : "Agregá propiedades usando la estrella ⭐ en cualquier vista"}
            </p>
          </div>
          {count > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar todo
            </button>
          )}
        </div>

        {/* Tabs */}
        {(activeProjects.length > 0 || discardedProjects.length > 0) && (
          <div className="flex gap-1 mb-6 border-b border-border">
            <button
              onClick={() => setTab("active")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                tab === "active"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              Activos ({activeProjects.length})
            </button>
            <button
              onClick={() => setTab("discarded")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                tab === "discarded"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              Descartados ({discardedProjects.length})
            </button>
          </div>
        )}

        {/* Sort */}
        {baseProjects.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-foreground"
            >
              <option value="none">Sin ordenar</option>
              <option value="ganancia">Ganancia Neta Est. ↓</option>
              <option value="oportunidad">Oportunidad ↓</option>
              <option value="precio">Precio ↑</option>
              <option value="usdm2">USD/m² ↑</option>
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {tab === "active" ? (
              <>
                <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sin propiedades activas</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Navegá el mapa o la lista de propiedades y hacé click en la estrella ⭐ para agregar propiedades a tu preselección.
                </p>
              </>
            ) : (
              <>
                <Archive className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sin proyectos descartados</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Los proyectos que descartes aparecerán acá. Podés restaurarlos en cualquier momento.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProjects.map((p) => (
              <AnalysisCard
                key={p.id}
                property={p}
                analysis={userAnalyses[p.id] || null}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzingIds.has(p.id)}
                allProperties={properties}
                neighborhoodStats={data?.neighborhoodStats ?? new Map()}
                onDiscard={handleDiscard}
                onRestore={handleRestore}
                isDiscarded={tab === "discarded"}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisProyectos;
