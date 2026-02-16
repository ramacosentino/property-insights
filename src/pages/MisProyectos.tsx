import { useState } from "react";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Property } from "@/lib/propertyData";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Target, Wrench, Info } from "lucide-react";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import { NeighborhoodStats } from "@/lib/propertyData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getSurfaceType, getMinSurfaceEnabled } from "@/pages/Settings";
import { useQueryClient } from "@tanstack/react-query";

interface AnalysisResult {
  score_multiplicador: number;
  informe_breve: string;
  highlights: string[];
  lowlights: string[];
  estado_general: string;
}

const AnalysisCard = ({ property, onAnalyze, isAnalyzing, allProperties, neighborhoodStats }: {
  property: Property;
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
  allProperties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
}) => {
  // Check if property already has analysis data from DB
  const raw = property as any;
  const hasAnalysis = raw.score_multiplicador != null;

  return (
    <div className="space-y-0">
      <PropertyCard property={property} />

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
                    Multiplicador de valor: 1.0 = promedio. Mayor a 1 = mejor que el promedio. Se usa para ajustar el precio estimado post-renovación.
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
          {raw.valor_potencial_total != null && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Valor Potencial (renovado)</span>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] text-xs">
                    Precio estimado si la propiedad estuviera en condiciones premium. Se calcula con el cuartil superior (Q3) del USD/m² de propiedades comparables (mismo tipo, tamaño similar, misma zona).
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  USD {raw.valor_potencial_total.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  USD {raw.valor_potencial_m2?.toLocaleString()}/m² · {raw.comparables_count} comp.
                </span>
              </div>
            </div>
          )}

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
                          Combina qué tan barata está la propiedad vs. el mercado con su estado físico. 10 = muy barata y en gran estado. 0 = cara y en mal estado.
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
                // Calculate breakdown for display
                const precio = raw.price || 0;
                const valorPot = raw.valor_potencial_total || 0;
                const renovCost = valorPot - precio - raw.oportunidad_neta;

                return (
                <div className="rounded-lg border border-border bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">Ganancia Neta Est.</span>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-2.5 w-2.5 text-muted-foreground/50" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px] text-xs space-y-1">
                        <p className="font-semibold">Valor potencial − Precio − Refacción</p>
                        <p>USD {valorPot.toLocaleString()} − USD {precio.toLocaleString()} − USD {Math.round(renovCost).toLocaleString()}</p>
                        <p className="text-muted-foreground">= USD {raw.oportunidad_neta.toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={`text-base font-bold font-mono ${
                    raw.oportunidad_neta > 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {raw.oportunidad_neta > 0 ? "+" : ""}USD {(raw.oportunidad_neta / 1000).toFixed(0)}K
                  </span>
                  <p className="text-[9px] text-muted-foreground mt-0.5">potencial − precio − renov.</p>
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
                  Resumen generado por IA sobre el estado, características y valor relativo de la propiedad.
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
                  <Tooltip>
                    <TooltipTrigger><Info className="h-2.5 w-2.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">
                      Aspectos positivos detectados por la IA en la publicación y fotos.
                    </TooltipContent>
                  </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger><Info className="h-2.5 w-2.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">
                      Aspectos negativos o riesgos detectados por la IA.
                    </TooltipContent>
                  </Tooltip>
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

          {/* Re-analyze button */}
          <button
            onClick={() => onAnalyze(property.id)}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
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

  const preselected = properties.filter((p) => selectedIds.has(p.id));

  const handleAnalyze = async (propertyId: string) => {
    setAnalyzingIds((prev) => new Set([...prev, propertyId]));

    toast({
      title: "🤖 Analizando...",
      description: "Esto puede demorar unos segundos.",
    });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-property", {
        body: { property_id: propertyId, surface_type: getSurfaceType(), min_surface_enabled: getMinSurfaceEnabled() },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Análisis completado",
          description: `Score: ${data.analysis.score_multiplicador}x — ${data.analysis.estado_general}`,
        });
        // Force refresh properties to get updated data
        await queryClient.refetchQueries({ queryKey: ["properties"] });
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

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Mis Proyectos</h2>
            <p className="text-muted-foreground">
              {count > 0
                ? `${count} propiedad${count !== 1 ? "es" : ""} preseleccionada${count !== 1 ? "s" : ""}`
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : preselected.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sin propiedades preseleccionadas</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Navegá el mapa o la lista de propiedades y hacé click en la estrella ⭐ para agregar propiedades a tu preselección.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preselected.map((p) => (
              <AnalysisCard
                key={p.id}
                property={p}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzingIds.has(p.id)}
                allProperties={properties}
                neighborhoodStats={data?.neighborhoodStats ?? new Map()}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisProyectos;
