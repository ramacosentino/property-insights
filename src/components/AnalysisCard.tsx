import { Property, NeighborhoodStats } from "@/lib/propertyData";
import PropertyCard from "@/components/PropertyCard";
import NeighborhoodSection from "@/components/NeighborhoodSection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Loader2, TrendingUp, TrendingDown, DollarSign, Target, Wrench, Info } from "lucide-react";

export interface UserAnalysis {
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
  onAnalyze?: (id: string) => void;
  isAnalyzing?: boolean;
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
            const avgM2 = raw.valor_potencial_m2;
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

          {/* Re-analyze button */}
          {onAnalyze && (
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
          )}
        </div>
        </TooltipProvider>
      ) : onAnalyze ? (
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
      ) : null}
    </div>
  );
};

export default AnalysisCard;
