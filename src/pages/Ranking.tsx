import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useProperties } from "@/hooks/useProperties";
import { Property } from "@/lib/propertyData";
import { getOpportunityLabel, getOpportunityBadgeClasses } from "@/lib/opportunityLabels";
import { useOnboardingFilters } from "@/hooks/useOnboardingFilters";
import { createFilterState, applyFilter, FilterState } from "@/components/MultiFilter";
import NeighborhoodDropdown from "@/components/NeighborhoodDropdown";
import RangeSliderFilter from "@/components/RangeSliderFilter";
import { Badge } from "@/components/ui/badge";
import { usePreselection } from "@/hooks/usePreselection";
import { Trophy, ExternalLink, Star, SlidersHorizontal, TrendingDown, ArrowUpDown, EyeOff, RotateCcw } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIgnoredOpportunities } from "@/hooks/useIgnoredOpportunities";

function formatPrice(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return v.toString();
}

const PROPERTY_TYPE_KEYS = ["departamento", "casa", "ph", "terreno"];

const Ranking = () => {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const { isSelected, toggle } = usePreselection();
  const { ignoredIds, ignore, restore, isIgnored } = useIgnoredOpportunities();
  const onboardingFilters = useOnboardingFilters();
  const [showIgnored, setShowIgnored] = useState(false);

  const [neighborhoodFilter, setNeighborhoodFilter] = useState<FilterState>(createFilterState());
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<FilterState>(createFilterState());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"opportunity" | "pricePerSqm" | "price">("opportunity");
  const [importDateFilter, setImportDateFilter] = useState<string>("all");
  const [onboardingApplied, setOnboardingApplied] = useState(false);

  // Build neighborhood groups
  const neighborhoodsByProvince = useMemo(() => {
    const hoodCounts = new Map<string, number>();
    const provCounts = new Map<string, number>();
    const provMap = new Map<string, { value: string; label: string; count: number }[]>();
    for (const p of properties) {
      hoodCounts.set(p.neighborhood, (hoodCounts.get(p.neighborhood) || 0) + 1);
      const prov = p.city || "Sin ciudad";
      provCounts.set(prov, (provCounts.get(prov) || 0) + 1);
    }
    for (const [hood, count] of hoodCounts.entries()) {
      const sample = properties.find((pp) => pp.neighborhood === hood);
      const prov = sample?.city || "Sin ciudad";
      if (!provMap.has(prov)) provMap.set(prov, []);
      provMap.get(prov)!.push({ value: hood, label: `${hood} (${count})`, count });
    }
    return Array.from(provMap.entries())
      .map(([prov, hoods]) => ({ province: prov, totalCount: provCounts.get(prov) || 0, neighborhoods: hoods.sort((a, b) => a.value.localeCompare(b.value)) }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [properties]);

  const ranked = useMemo(() => {
    let result = properties.filter((p) => p.price > 0 && p.pricePerM2Total && p.pricePerM2Total > 0 && p.opportunityScore > 0);

    // Filter out ignored unless showing ignored tab
    if (!showIgnored) {
      result = result.filter((p) => !ignoredIds.has(p.id));
    } else {
      result = result.filter((p) => ignoredIds.has(p.id));
    }

    if (neighborhoodFilter.included.size > 0 || neighborhoodFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(p.neighborhood, neighborhoodFilter));
    if (propertyTypeFilter.included.size > 0 || propertyTypeFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(p.propertyType || "otro", propertyTypeFilter));

    if (importDateFilter !== "all") {
      const now = Date.now();
      const msMap: Record<string, number> = { "1d": 86400000, "7d": 604800000, "30d": 2592000000, "90d": 7776000000 };
      const ms = msMap[importDateFilter];
      if (ms) result = result.filter((p) => now - new Date(p.createdAt).getTime() <= ms);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "opportunity": return b.opportunityScore - a.opportunityScore;
        case "pricePerSqm": return (a.pricePerM2Total ?? 0) - (b.pricePerM2Total ?? 0);
        case "price": return a.price - b.price;
      }
    });

    return result.slice(0, 100);
  }, [properties, neighborhoodFilter, propertyTypeFilter, importDateFilter, sortBy, ignoredIds, showIgnored]);

  const topScore = ranked[0]?.opportunityScore ?? 1;

  // Apply onboarding filters (re-apply when revision changes from Settings)
  useEffect(() => {
    if (!onboardingFilters.loaded) return;
    if (onboardingFilters.neighborhoodFilter.included.size > 0) {
      setNeighborhoodFilter(onboardingFilters.neighborhoodFilter);
    }
    if (onboardingFilters.propertyTypeFilter.included.size > 0) {
      setPropertyTypeFilter(onboardingFilters.propertyTypeFilter);
    }
    setOnboardingApplied(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingFilters.revision]);

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Ranking de Oportunidades</h2>
            </div>
            <p className="text-muted-foreground">
              Las mejores oportunidades del mercado ordenadas por descuento vs. precio esperado de zona.
            </p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              showFilters ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filtros
          </button>

          {PROPERTY_TYPE_KEYS.map((t) => {
            const isActive = propertyTypeFilter.included.has(t);
            return (
              <button
                key={t}
                onClick={() => {
                  const next = { included: new Set(propertyTypeFilter.included), excluded: new Set(propertyTypeFilter.excluded) };
                  if (isActive) next.included.delete(t); else next.included.add(t);
                  setPropertyTypeFilter(next);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border capitalize ${
                  isActive ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}

          <select
            value={importDateFilter}
            onChange={(e) => setImportDateFilter(e.target.value)}
            className="text-xs bg-secondary border border-border rounded-full px-2.5 py-1.5 text-foreground"
          >
            <option value="all">Todas las fechas</option>
            <option value="1d">Último día</option>
            <option value="7d">Última semana</option>
            <option value="30d">Último mes</option>
            <option value="90d">Últimos 3 meses</option>
          </select>

          <button
            onClick={() => setSortBy(sortBy === "opportunity" ? "pricePerSqm" : sortBy === "pricePerSqm" ? "price" : "opportunity")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortBy === "opportunity" ? "Oportunidad" : sortBy === "pricePerSqm" ? "USD/m²" : "Precio"}
          </button>
        </div>

        {/* Ignored toggle */}
        <div className="flex gap-1 mb-4 border-b border-border">
          <button
            onClick={() => setShowIgnored(false)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              !showIgnored ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Oportunidades
          </button>
          {ignoredIds.size > 0 && (
            <button
              onClick={() => setShowIgnored(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                showIgnored ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
              Ignoradas ({ignoredIds.size})
            </button>
          )}
        </div>

        {showFilters && (
          <div className="glass-card rounded-2xl p-4 mb-6 relative z-10">
            <NeighborhoodDropdown
              groups={neighborhoodsByProvince}
              state={neighborhoodFilter}
              onChange={setNeighborhoodFilter}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Oportunidades</p>
            <p className="text-2xl font-mono font-bold text-primary">{ranked.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Mejor descuento</p>
            <p className="text-2xl font-mono font-bold">{ranked[0] ? `${ranked[0].opportunityScore.toFixed(0)}%` : "—"}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Prom. USD/m²</p>
            <p className="text-2xl font-mono font-bold">
              ${ranked.length ? Math.round(ranked.reduce((a, b) => a + (b.pricePerM2Total ?? 0), 0) / ranked.length).toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {/* Ranking table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[3rem_1fr_6rem_6rem_6rem_5rem_5rem] gap-2 px-4 py-3 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Propiedad</span>
            <span className="text-right">USD/m²</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Superficie</span>
            <span className="text-right">Score</span>
            <span></span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">Cargando...</div>
          ) : ranked.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <TrendingDown className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No se encontraron oportunidades con estos filtros.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {ranked.map((p, i) => {
                const lbl = getOpportunityLabel(p.opportunityScore);
                const barWidth = Math.min(100, (p.opportunityScore / topScore) * 100);
                const isPinned = isSelected(p.id);

                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[3rem_1fr_6rem_6rem_6rem_5rem_5rem] gap-2 px-4 py-3 items-center hover:bg-secondary/30 transition-colors group"
                  >
                    {/* Rank */}
                    <span className={`text-sm font-bold font-mono ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                    </span>

                    {/* Property info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{p.location || p.neighborhood}</span>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${getOpportunityBadgeClasses(lbl.tone)}`}>
                          {lbl.emoji} {lbl.shortText} ({Math.abs(p.opportunityScore).toFixed(0)}% {p.opportunityScore >= 0 ? "bajo" : "sobre"} mediana)
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{p.neighborhood}, {p.city}</span>
                        {p.propertyType && <span className="text-[10px] text-muted-foreground capitalize">· {p.propertyType}</span>}
                        {p.rooms && <span className="text-[10px] text-muted-foreground">· {p.rooms} amb</span>}
                      </div>
                      {/* Score bar */}
                      <div className="mt-1.5 h-1 w-full max-w-[200px] bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* USD/m² */}
                    <span className="text-sm font-mono font-semibold text-right">
                      ${(p.pricePerM2Total ?? 0).toLocaleString()}
                    </span>

                    {/* Price */}
                    <span className="text-sm font-mono text-right text-muted-foreground">
                      ${formatPrice(p.price)}
                    </span>

                    {/* Surface */}
                    <span className="text-sm font-mono text-right text-muted-foreground">
                      {p.surfaceTotal ? `${p.surfaceTotal} m²` : "—"}
                    </span>

                    {/* Score */}
                    <span className="text-sm font-mono font-bold text-right text-primary">
                      -{p.opportunityScore.toFixed(0)}%
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      {showIgnored ? (
                        <button
                          onClick={() => restore(p.id)}
                          className="p-1 rounded-full text-primary opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all"
                          title="Restaurar"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => ignore(p.id)}
                          className="p-1 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                          title="Ignorar oportunidad"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggle(p.id)}
                        className={`p-1 rounded-full transition-colors ${
                          isPinned ? "text-yellow-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-500"
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isPinned ? "fill-yellow-500" : ""}`} />
                      </button>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {ranked.length >= 100 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Mostrando top 100. Usá los filtros para refinar.
          </p>
        )}
      </div>
    </Layout>
  );
};

export default Ranking;
