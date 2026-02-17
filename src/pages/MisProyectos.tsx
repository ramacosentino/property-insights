import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Property } from "@/lib/propertyData";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search, Loader2, CheckCircle, AlertCircle, Archive, ArrowUpDown } from "lucide-react";
import { NeighborhoodStats } from "@/lib/propertyData";
import { useToast } from "@/hooks/use-toast";
import { getSurfaceType, getMinSurfaceEnabled, getRenovationCosts } from "@/pages/Settings";
import { useQueryClient } from "@tanstack/react-query";
import AnalysisCard, { UserAnalysis } from "@/components/AnalysisCard";


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
