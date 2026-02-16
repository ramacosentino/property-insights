import { useState } from "react";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Property } from "@/lib/propertyData";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Target, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AnalysisResult {
  score_multiplicador: number;
  informe_breve: string;
  highlights: string[];
  lowlights: string[];
  estado_general: string;
}

const AnalysisCard = ({ property, onAnalyze, isAnalyzing }: {
  property: Property;
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
}) => {
  // Check if property already has analysis data from DB
  const raw = property as any;
  const hasAnalysis = raw.score_multiplicador != null;

  return (
    <div className="space-y-0">
      <PropertyCard property={property} />

      {hasAnalysis ? (
        <div className="rounded-b-2xl border border-t-0 border-border bg-card p-4 space-y-3 -mt-1">
          {/* Score */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Score Multiplicador</span>
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

          {/* Estado */}
          <div>
            <span className="text-xs text-muted-foreground font-medium">Estado General</span>
            <p className="text-sm text-foreground mt-0.5">{raw.estado_general}</p>
          </div>

          {/* Informe */}
          <div>
            <span className="text-xs text-muted-foreground font-medium">Informe</span>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{raw.informe_breve}</p>
          </div>

          {/* Highlights / Lowlights */}
          <div className="grid grid-cols-2 gap-3">
            {raw.highlights && raw.highlights.length > 0 && (
              <div>
                <span className="text-[10px] text-green-500 font-medium uppercase tracking-wider">Highlights</span>
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
                <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Lowlights</span>
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
                Analizando con IA... (esto toma ~1 min)
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
      title: "🤖 Análisis iniciado",
      description: "Scrapeando publicación y analizando con IA... (~1 min)",
    });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-property", {
        body: { property_id: propertyId },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Análisis completado",
          description: `Score: ${data.analysis.score_multiplicador}x — ${data.analysis.estado_general}`,
        });
        // Refresh properties to get updated data
        queryClient.invalidateQueries({ queryKey: ["properties"] });
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
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisProyectos;
