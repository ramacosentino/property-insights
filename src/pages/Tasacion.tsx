import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { Property, NeighborhoodStats } from "@/lib/propertyData";
import { getOpportunityLabel } from "@/lib/opportunityLabels";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calculator, Search, MapPin, TrendingDown, Home, DollarSign, BarChart3, Users, ExternalLink, Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const Tasacion = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const neighborhoodStats = data?.neighborhoodStats ?? new Map();

  const [neighborhood, setNeighborhood] = useState("");
  const [propertyType, setPropertyType] = useState("departamento");
  const [surfaceTotal, setSurfaceTotal] = useState<number | "">("");
  const [rooms, setRooms] = useState<number | "">(2);
  const [showResults, setShowResults] = useState(false);

  // Available neighborhoods
  const neighborhoods = useMemo(() =>
    Array.from(neighborhoodStats.keys()).sort(),
    [neighborhoodStats]
  );

  // Filtered neighborhood suggestions
  const neighborhoodSuggestions = useMemo(() => {
    if (!neighborhood || neighborhood.length < 2) return [];
    const s = neighborhood.toLowerCase();
    return neighborhoods.filter(n => n.toLowerCase().includes(s)).slice(0, 8);
  }, [neighborhood, neighborhoods]);

  // Comparables
  const comparables = useMemo(() => {
    if (!showResults || !neighborhood) return [];
    const matchNeighborhood = neighborhoods.find(n => n.toLowerCase() === neighborhood.toLowerCase());
    if (!matchNeighborhood) return [];

    let comps = properties.filter(p =>
      p.neighborhood.toLowerCase() === matchNeighborhood.toLowerCase() &&
      p.pricePerM2Total && p.pricePerM2Total > 0 &&
      p.price > 0
    );

    // Filter by type
    if (propertyType) {
      comps = comps.filter(p => p.propertyType === propertyType);
    }

    // Filter by surface range (±40%)
    if (surfaceTotal && typeof surfaceTotal === "number") {
      comps = comps.filter(p =>
        p.surfaceTotal && p.surfaceTotal >= surfaceTotal * 0.6 && p.surfaceTotal <= surfaceTotal * 1.4
      );
    }

    // Filter by rooms (±1)
    if (rooms && typeof rooms === "number") {
      comps = comps.filter(p =>
        p.rooms && Math.abs(p.rooms - rooms) <= 1
      );
    }

    return comps.sort((a, b) => (a.pricePerM2Total ?? 0) - (b.pricePerM2Total ?? 0));
  }, [showResults, neighborhood, propertyType, surfaceTotal, rooms, properties, neighborhoods]);

  // Valuation
  const valuation = useMemo(() => {
    if (comparables.length === 0) return null;
    const pricesM2 = comparables.map(p => p.pricePerM2Total!);
    const medianM2 = median(pricesM2);
    const avgM2 = pricesM2.reduce((a, b) => a + b, 0) / pricesM2.length;
    const minM2 = Math.min(...pricesM2);
    const maxM2 = Math.max(...pricesM2);
    const surf = typeof surfaceTotal === "number" ? surfaceTotal : median(comparables.map(p => p.surfaceTotal || 0).filter(Boolean));

    return {
      medianM2: Math.round(medianM2),
      avgM2: Math.round(avgM2),
      minM2: Math.round(minM2),
      maxM2: Math.round(maxM2),
      estimatedValue: Math.round(medianM2 * surf),
      rangeMin: Math.round(minM2 * surf),
      rangeMax: Math.round(maxM2 * surf),
      surface: surf,
      count: comparables.length,
    };
  }, [comparables, surfaceTotal]);

  // Competition analysis
  const competition = useMemo(() => {
    if (!showResults || !neighborhood) return null;
    const matchNeighborhood = neighborhoods.find(n => n.toLowerCase() === neighborhood.toLowerCase());
    if (!matchNeighborhood) return null;

    const allInZone = properties.filter(p =>
      p.neighborhood.toLowerCase() === matchNeighborhood.toLowerCase() &&
      p.price > 0
    );

    const sameType = allInZone.filter(p => p.propertyType === propertyType);
    const belowMedian = sameType.filter(p => {
      const stats = neighborhoodStats.get(matchNeighborhood);
      return stats && p.pricePerM2Total && p.pricePerM2Total < stats.medianPricePerSqm;
    });

    // Type breakdown
    const typeBreakdown = new Map<string, number>();
    allInZone.forEach(p => {
      const t = p.propertyType || "otro";
      typeBreakdown.set(t, (typeBreakdown.get(t) || 0) + 1);
    });

    return {
      totalInZone: allInZone.length,
      sameTypeCount: sameType.length,
      belowMedianCount: belowMedian.length,
      typeBreakdown: Array.from(typeBreakdown.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count, pct: Math.round((count / allInZone.length) * 100) })),
      zoneStats: neighborhoodStats.get(matchNeighborhood),
    };
  }, [showResults, neighborhood, propertyType, properties, neighborhoods, neighborhoodStats]);

  const handleTasar = () => {
    if (!neighborhood) return;
    setShowResults(true);
  };

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="container px-6 py-8 max-w-5xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Tasación</h2>
            </div>
            <p className="text-muted-foreground">
              Estimá el valor de mercado de una propiedad con datos comparables de la zona.
            </p>
          </div>

          {/* Input form */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Neighborhood */}
                <div className="relative">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Barrio / Localidad</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={neighborhood}
                      onChange={(e) => { setNeighborhood(e.target.value); setShowResults(false); }}
                      placeholder="Ej: Palermo, Belgrano..."
                      className="pl-9"
                    />
                  </div>
                  {neighborhoodSuggestions.length > 0 && !showResults && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {neighborhoodSuggestions.map(n => (
                        <button
                          key={n}
                          onClick={() => { setNeighborhood(n); }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/50 transition-colors"
                        >
                          {n}
                          {neighborhoodStats.get(n) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({neighborhoodStats.get(n)!.count} props · ${neighborhoodStats.get(n)!.medianPricePerSqm.toLocaleString()}/m²)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de propiedad</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="ph">PH</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Surface */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Superficie total (m²)</label>
                  <Input
                    type="number"
                    value={surfaceTotal}
                    onChange={(e) => { setSurfaceTotal(e.target.value ? Number(e.target.value) : ""); setShowResults(false); }}
                    placeholder="Ej: 85"
                  />
                </div>

                {/* Rooms */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ambientes</label>
                  <Input
                    type="number"
                    value={rooms}
                    onChange={(e) => { setRooms(e.target.value ? Number(e.target.value) : ""); setShowResults(false); }}
                    placeholder="Ej: 3"
                  />
                </div>
              </div>

              <Button onClick={handleTasar} disabled={!neighborhood} className="w-full md:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Tasar propiedad
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {showResults && (
            <>
              {/* Valuation result */}
              {valuation ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-primary/20 bg-primary/[0.03] md:col-span-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold">Valor estimado</span>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                          <TooltipContent className="max-w-[250px] text-xs">
                            Basado en la mediana de USD/m² de {valuation.count} comparables similares en la zona.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-3xl font-bold font-mono text-primary">
                        USD {valuation.estimatedValue.toLocaleString()}
                      </p>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Rango: USD {valuation.rangeMin.toLocaleString()} — USD {valuation.rangeMax.toLocaleString()}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Mediana USD/m²</p>
                          <p className="text-sm font-mono font-semibold">${valuation.medianM2.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Rango USD/m²</p>
                          <p className="text-sm font-mono">${valuation.minM2.toLocaleString()} – ${valuation.maxM2.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Comparables</p>
                          <p className="text-sm font-mono font-semibold">{valuation.count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Competition summary */}
                  {competition && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-semibold">Competencia</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Propiedades en la zona</p>
                            <p className="text-xl font-mono font-bold">{competition.totalInZone}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Mismo tipo ({propertyType})</p>
                            <p className="text-lg font-mono font-semibold">{competition.sameTypeCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Por debajo de mediana</p>
                            <p className="text-lg font-mono font-semibold text-primary">{competition.belowMedianCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="mb-6">
                  <CardContent className="pt-6 text-center py-12">
                    <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No se encontraron comparables con estos filtros.</p>
                    <p className="text-xs text-muted-foreground mt-1">Probá con una zona diferente o relajá los filtros.</p>
                  </CardContent>
                </Card>
              )}

              {/* Market composition */}
              {competition && competition.typeBreakdown.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Composición del mercado en {neighborhood}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {competition.typeBreakdown.map(({ type, count, pct }) => (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground capitalize w-28">{type}</span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${type === propertyType ? "bg-primary" : "bg-muted-foreground/30"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparables list */}
              {comparables.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      Comparables encontrados ({comparables.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-[10px] font-semibold text-muted-foreground uppercase">
                            <th className="text-left py-2 px-2">Dirección</th>
                            <th className="text-right py-2 px-2">USD/m²</th>
                            <th className="text-right py-2 px-2">Precio</th>
                            <th className="text-right py-2 px-2">m²</th>
                            <th className="text-right py-2 px-2">Amb.</th>
                            <th className="text-center py-2 px-2">Valoración</th>
                            <th className="py-2 px-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {comparables.slice(0, 30).map(p => {
                            const lbl = getOpportunityLabel(p.opportunityScore);
                            return (
                              <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                                <td className="py-2 px-2">
                                  <span className="text-xs">{p.location || p.neighborhood}</span>
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-xs font-semibold">
                                  ${(p.pricePerM2Total ?? 0).toLocaleString()}
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-xs text-muted-foreground">
                                  ${p.price.toLocaleString()}
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-xs text-muted-foreground">
                                  {p.surfaceTotal ?? "—"}
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-xs text-muted-foreground">
                                  {p.rooms ?? "—"}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <Badge variant="outline" className={`text-[9px] ${getOpportunityLabel(p.opportunityScore).tone !== "neutral" ? "border-primary/20 text-primary" : "text-muted-foreground"}`}>
                                    {lbl.emoji} {lbl.shortText} ({Math.abs(p.opportunityScore).toFixed(0)}% {p.opportunityScore >= 0 ? "bajo" : "sobre"} mediana)
                                  </Badge>
                                </td>
                                <td className="py-2 px-2">
                                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {comparables.length > 30 && (
                        <p className="text-center text-xs text-muted-foreground mt-3">
                          Mostrando 30 de {comparables.length} comparables.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    </Layout>
  );
};

export default Tasacion;
