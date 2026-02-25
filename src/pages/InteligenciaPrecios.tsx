import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { computeFactorAnalysis, getPropertyTypes, FactorAnalysis } from "@/lib/priceFactors";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, BarChart3, Loader2, Sparkles, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ─── AI Insights types ──────────────────────────────────────────
interface AIFactorInsight {
  name: string;
  weight: number;
  interpretation: string;
  recommendation: string;
}
interface AIAnalysis {
  executive_summary: string;
  factors: AIFactorInsight[];
  top_opportunity_signals: string[];
}

// ─── Helpers ────────────────────────────────────────────────────
function relevanceColor(relevance: number) {
  if (relevance >= 60) return "bg-destructive/10 text-destructive";
  if (relevance >= 30) return "bg-warning/10 text-warning-foreground";
  return "bg-muted text-muted-foreground";
}
function relevanceLabel(relevance: number) {
  if (relevance >= 60) return "Alto impacto";
  if (relevance >= 30) return "Impacto medio";
  return "Bajo impacto";
}
function premiumColor(premium: number) {
  if (premium > 5) return "hsl(var(--accent))";
  if (premium < -5) return "hsl(var(--primary))";
  return "hsl(var(--muted-foreground))";
}

// ─── Factor Card ────────────────────────────────────────────────
function FactorCard({ factor, aiInsight }: { factor: FactorAnalysis; aiInsight?: AIFactorInsight }) {
  const [expanded, setExpanded] = useState(false);

  const chartData = factor.levels.map(l => ({
    name: l.label,
    premium: l.premium,
    mediana: l.medianPriceM2,
    count: l.count,
    isReference: l.isReference ?? false,
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {factor.displayName}
              <Badge variant="outline" className={relevanceColor(factor.relevance)}>
                {relevanceLabel(factor.relevance)}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">{factor.description}</CardDescription>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold tabular-nums">{factor.impactRange.toFixed(1)}%</span>
            <p className="text-[10px] text-muted-foreground">rango de impacto</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {chartData.length > 0 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={v => `${v > 0 ? "+" : ""}${v}%`} fontSize={10} />
                <YAxis type="category" dataKey="name" width={90} fontSize={10} tick={{ fill: "hsl(var(--foreground))" }} />
                <RTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, _name: string, entry: any) => [
                    `${value > 0 ? "+" : ""}${value}% | USD ${entry.payload.mediana}/m² (${entry.payload.count} props)${entry.payload.isReference ? " [ref]" : ""}`,
                    "Premium",
                  ]}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Bar dataKey="premium" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {chartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.isReference ? "hsl(var(--muted-foreground))" : premiumColor(d.premium)}
                      fillOpacity={d.isReference ? 0.35 : 0.85}
                      strokeDasharray={d.isReference ? "4 2" : undefined}
                      stroke={d.isReference ? "hsl(var(--muted-foreground))" : undefined}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {aiInsight && (
          <div className="border-t pt-3 space-y-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline w-full text-left"
            >
              <Sparkles className="h-3 w-3" />
              Análisis IA (peso: {aiInsight.weight}/100)
              {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>
            {expanded && (
              <div className="space-y-1.5 text-xs text-muted-foreground animate-in fade-in-0 slide-in-from-top-1">
                <p><span className="font-medium text-foreground">Interpretación:</span> {aiInsight.interpretation}</p>
                <p><span className="font-medium text-foreground">Recomendación:</span> {aiInsight.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
const InteligenciaPrecios = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useProperties();
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  const propertyTypes = useMemo(() => {
    if (!data?.properties) return [];
    return getPropertyTypes(data.properties);
  }, [data?.properties]);

  const factors = useMemo(() => {
    if (!data?.properties) return [];
    return computeFactorAnalysis(data.properties, selectedType);
  }, [data?.properties, selectedType]);

  const topFactor = factors[0];
  const filteredProps = selectedType
    ? data?.properties.filter(p => p.propertyType === selectedType) ?? []
    : data?.properties ?? [];
  const totalProperties = filteredProps.length;
  const withPriceData = filteredProps.filter(p => p.pricePerM2Total && p.pricePerM2Total > 0).length;

  const handleAIAnalysis = async () => {
    if (factors.length === 0) return;
    setAILoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("compute-price-model", {
        body: { factors },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setAIAnalysis(result);
      toast({ title: "Análisis IA completado", description: "Los factores fueron analizados por el modelo de regresión." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "No se pudo completar el análisis IA", variant: "destructive" });
    } finally {
      setAILoading(false);
    }
  };

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <div className="container px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Inteligencia de Precios</h2>
          <p className="text-muted-foreground">
            Factores que impactan el USD/m² y su relevancia para detectar oportunidades reales.
          </p>
          {propertyTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="sm"
                variant={selectedType === undefined ? "default" : "outline"}
                onClick={() => setSelectedType(undefined)}
              >
                Todos los tipos
              </Button>
              {propertyTypes.map(t => (
                <Button
                  key={t}
                  size="sm"
                  variant={selectedType === t ? "default" : "outline"}
                  onClick={() => setSelectedType(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Cargando propiedades...</p>
          </div>
        ) : (
          <>
            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <BarChart3 className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                  <p className="text-2xl font-bold tabular-nums">{factors.length}</p>
                  <p className="text-xs text-muted-foreground">Factores analizados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1.5 text-accent" />
                  <p className="text-2xl font-bold tabular-nums">{withPriceData.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Props con datos de precio</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  {topFactor ? (
                    <>
                      <ArrowUpRight className="h-5 w-5 mx-auto mb-1.5 text-destructive" />
                      <p className="text-2xl font-bold tabular-nums">{topFactor.impactRange.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">Mayor rango: {topFactor.displayName}</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Sin datos</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <Sparkles className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                  <Button
                    size="sm"
                    onClick={handleAIAnalysis}
                    disabled={aiLoading || factors.length === 0}
                    className="mt-1"
                  >
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    {aiAnalysis ? "Reanalizar con IA" : "Analizar con IA"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1">Regresión multivariable</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Executive Summary */}
            {aiAnalysis && (
              <Card className="mb-8 border-primary/20 bg-primary/[0.03]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Resumen del Modelo IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{aiAnalysis.executive_summary}</p>
                  {aiAnalysis.top_opportunity_signals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Señales de oportunidad
                      </p>
                      <ul className="space-y-1">
                        {aiAnalysis.top_opportunity_signals.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <ArrowDownRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* How it works */}
            <Card className="mb-8 bg-muted/30">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">¿Cómo funciona el análisis de factores?</p>
                    <p>
                      El análisis se segmenta por <span className="font-semibold">tipo de propiedad</span> para comparaciones justas (ej: deptos vs. deptos).
                      Para cada factor, calculamos la <span className="font-semibold">mediana de USD/m²</span> excluyendo propiedades sin ese dato, y la comparamos contra la mediana del segmento.
                      Las barras <span className="opacity-40">tenues</span> muestran "Sin dato" como referencia, sin afectar el cálculo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {factors.map(f => {
                const aiInsight = aiAnalysis?.factors.find(
                  af => af.name.toLowerCase() === f.displayName.toLowerCase()
                );
                return <FactorCard key={f.name} factor={f} aiInsight={aiInsight} />;
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default InteligenciaPrecios;
