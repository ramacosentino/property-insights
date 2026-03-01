import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { usePreselection } from "@/hooks/usePreselection";
import { Property } from "@/lib/propertyData";
import { getOpportunityLabel, getOpportunityBadgeClasses } from "@/lib/opportunityLabels";
import { Badge } from "@/components/ui/badge";
import { Columns, Star, X, ExternalLink, TrendingUp, TrendingDown, DollarSign, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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

const MAX_COMPARE = 3;

const Comparador = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const { selectedIds } = usePreselection();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [analyses, setAnalyses] = useState<Record<string, CompareAnalysis>>({});

  // Pre-populate with first 2 preselected that have analysis
  useEffect(() => {
    if (!user || compareIds.length > 0) return;
    supabase
      .from("user_property_analysis")
      .select("property_id, score_multiplicador, estado_general, valor_potencial_total, oportunidad_ajustada, oportunidad_neta, comparables_count")
      .eq("user_id", user.id)
      .then(({ data: rows }) => {
        if (!rows) return;
        const analysisMap: Record<string, CompareAnalysis> = {};
        rows.forEach((r: any) => {
          analysisMap[r.property_id] = r;
        });
        setAnalyses(analysisMap);

        // Auto-select first 2 analyzed preselected properties
        const analyzedPreselected = [...selectedIds].filter(id => analysisMap[id]);
        setCompareIds(analyzedPreselected.slice(0, 2));
      });
  }, [user, selectedIds]);

  const addProperty = (id: string) => {
    if (compareIds.length >= MAX_COMPARE || compareIds.includes(id)) return;
    setCompareIds([...compareIds, id]);
    setSearchTerm("");
  };

  const removeProperty = (id: string) => {
    setCompareIds(compareIds.filter(cid => cid !== id));
  };

  const compared = useMemo(() =>
    compareIds.map(id => properties.find(p => p.id === id)).filter(Boolean) as Property[],
    [compareIds, properties]
  );

  // Searchable properties (only analyzed ones)
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const s = searchTerm.toLowerCase();
    return properties
      .filter(p =>
        !compareIds.includes(p.id) &&
        (analyses[p.id] || p.score_multiplicador != null) &&
        (p.location.toLowerCase().includes(s) || p.neighborhood.toLowerCase().includes(s) || p.city.toLowerCase().includes(s))
      )
      .slice(0, 8);
  }, [searchTerm, properties, compareIds, analyses]);

  // All analyzed properties for quick-add
  const analyzedProperties = useMemo(() =>
    properties.filter(p => analyses[p.id] || p.score_multiplicador != null),
    [properties, analyses]
  );

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

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

  // Find best value for highlighting
  const bestPrice = compared.length > 0 ? Math.min(...compared.map(p => p.price)) : 0;
  const bestPriceM2 = compared.length > 0 ? Math.min(...compared.filter(p => p.pricePerM2Total).map(p => p.pricePerM2Total!)) : 0;
  const bestScore = compared.length > 0 ? Math.max(...compared.map(p => p.opportunityScore)) : 0;

  const rows: { label: string; icon?: any; values: (p: Property) => { text: string; highlight?: boolean; subtext?: string } }[] = [
    {
      label: "Precio",
      icon: DollarSign,
      values: (p) => ({
        text: `USD ${p.price.toLocaleString()}`,
        highlight: p.price === bestPrice && compared.length > 1,
      }),
    },
    {
      label: "USD/m²",
      values: (p) => ({
        text: p.pricePerM2Total ? `$${p.pricePerM2Total.toLocaleString()}` : "—",
        highlight: p.pricePerM2Total === bestPriceM2 && compared.length > 1,
      }),
    },
    {
      label: "Superficie total",
      values: (p) => ({ text: p.surfaceTotal ? `${p.surfaceTotal} m²` : "—" }),
    },
    {
      label: "Sup. cubierta",
      values: (p) => ({ text: p.surfaceCovered ? `${p.surfaceCovered} m²` : "—" }),
    },
    {
      label: "Ambientes",
      values: (p) => ({ text: p.rooms ? `${p.rooms}` : "—" }),
    },
    {
      label: "Dormitorios",
      values: (p) => ({ text: p.bedrooms ? `${p.bedrooms}` : "—" }),
    },
    {
      label: "Baños",
      values: (p) => ({ text: p.bathrooms ? `${p.bathrooms}` : "—" }),
    },
    {
      label: "Cocheras",
      values: (p) => ({ text: p.parking ? `${p.parking}` : "—" }),
    },
    {
      label: "Antigüedad",
      values: (p) => ({ text: p.ageYears != null ? `${p.ageYears} años` : "—" }),
    },
    {
      label: "Disposición",
      values: (p) => ({ text: p.disposition || "—" }),
    },
    {
      label: "Oportunidad",
      values: (p) => {
        const lbl = getOpportunityLabel(p.opportunityScore);
        return {
          text: `${lbl.emoji} ${lbl.shortText}`,
          highlight: p.opportunityScore === bestScore && compared.length > 1,
          subtext: `${Math.abs(p.opportunityScore).toFixed(0)}% ${p.opportunityScore >= 0 ? "bajo" : "sobre"} mediana`,
        };
      },
    },
    {
      label: "Estado general",
      values: (p) => {
        const a = getAnalysis(p);
        return { text: a?.estado_general || "Sin análisis" };
      },
    },
    {
      label: "x Valor",
      values: (p) => {
        const a = getAnalysis(p);
        return {
          text: a?.score_multiplicador != null ? `${a.score_multiplicador.toFixed(2)}x` : "—",
        };
      },
    },
    {
      label: "Valor potencial",
      values: (p) => {
        const a = getAnalysis(p);
        return {
          text: a?.valor_potencial_total ? `USD ${a.valor_potencial_total.toLocaleString()}` : "—",
        };
      },
    },
    {
      label: "Ganancia neta est.",
      values: (p) => {
        const a = getAnalysis(p);
        return {
          text: a?.oportunidad_neta != null ? `${a.oportunidad_neta > 0 ? "+" : ""}USD ${(a.oportunidad_neta / 1000).toFixed(0)}K` : "—",
          highlight: a?.oportunidad_neta != null && a.oportunidad_neta > 0,
        };
      },
    },
  ];

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Columns className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Comparador</h2>
          </div>
          <p className="text-muted-foreground">
            Compará hasta {MAX_COMPARE} propiedades analizadas lado a lado.
          </p>
        </div>

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
                      <div>
                        <span className="text-sm font-medium">{p.location || p.neighborhood}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.neighborhood}, {p.city}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">USD {p.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick-add from preselection */}
            {selectedIds.size > 0 && (
              <div className="mt-3">
                <span className="text-[11px] text-muted-foreground font-medium">Tus proyectos analizados:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[...selectedIds]
                    .filter(id => !compareIds.includes(id) && (analyses[id] || properties.find(p => p.id === id)?.score_multiplicador != null))
                    .slice(0, 10)
                    .map(id => {
                      const p = properties.find(pp => pp.id === id);
                      if (!p) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => addProperty(id)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-medium border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                        >
                          {p.neighborhood} · ${(p.price / 1000).toFixed(0)}K
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
          <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              {/* Headers */}
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-40">Métrica</th>
                   {compared.map(p => {
                     const titleParts = [
                       p.propertyType ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1) : null,
                       [p.location || p.street, p.neighborhood].filter(Boolean).join(", "),
                     ].filter(Boolean);
                     const titleText = titleParts.join(" - ");
                     return (
                     <th key={p.id} className="px-4 py-3 text-left min-w-[200px]">
                       <div className="flex items-start justify-between gap-2">
                         <div className="min-w-0">
                           <span className="text-sm font-semibold text-foreground line-clamp-2">{titleText}</span>
                           <span className="text-[11px] text-primary font-medium block">USD {p.price.toLocaleString()}</span>
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
                      const v = row.values(p);
                      return (
                        <td key={p.id} className="px-4 py-2.5">
                          <span className={`text-sm font-mono ${v.highlight ? "font-bold text-primary" : "text-foreground"}`}>
                            {v.text}
                          </span>
                          {v.subtext && <span className="block text-[10px] text-muted-foreground">{v.subtext}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Highlights/Lowlights rows */}
                <tr className="border-b border-border/50">
                  <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground align-top">Highlights</td>
                  {compared.map(p => {
                    const a = getAnalysis(p);
                    return (
                      <td key={p.id} className="px-4 py-2.5 align-top">
                        {a?.highlights && a.highlights.length > 0 ? (
                          <ul className="space-y-0.5">
                            {a.highlights.map((h, i) => (
                              <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1">
                                <span className="text-green-500 mt-0.5 shrink-0">✓</span> {h}
                              </li>
                            ))}
                          </ul>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-border/50 bg-secondary/20">
                  <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground align-top">Lowlights</td>
                  {compared.map(p => {
                    const a = getAnalysis(p);
                    return (
                      <td key={p.id} className="px-4 py-2.5 align-top">
                        {a?.lowlights && a.lowlights.length > 0 ? (
                          <ul className="space-y-0.5">
                            {a.lowlights.map((l, i) => (
                              <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1">
                                <span className="text-red-400 mt-0.5 shrink-0">✕</span> {l}
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
        )}
      </div>
    </Layout>
  );
};

export default Comparador;
