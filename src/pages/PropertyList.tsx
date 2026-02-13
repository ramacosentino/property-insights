import { useMemo, useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import {
  getSizeRange,
  getPriceRange,
  getRoomsLabel,
  Property,
} from "@/lib/propertyData";
import { useProperties } from "@/hooks/useProperties";
import MultiFilter, {
  createFilterState,
  applyFilter,
  FilterState,
  FilterOption,
} from "@/components/MultiFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, TrendingDown, Star, X, ChevronDown } from "lucide-react";
import { fetchCachedCoordinates, CachedGeoData } from "@/lib/geocoding";

function getParkingLabel(parking: number | null): string {
  if (!parking || parking === 0) return "Sin cochera";
  if (parking === 1) return "1 cochera";
  if (parking === 2) return "2 cocheras";
  return "3+ cocheras";
}

const ROOMS_KEYS = ["1 amb", "2 amb", "3 amb", "4 amb", "5+ amb"];
const SIZE_KEYS = ["< 100 m²", "100-200 m²", "200-400 m²", "400-700 m²", "700+ m²"];
const PRICE_KEYS = ["< 100K", "100K-200K", "200K-400K", "400K-700K", "700K+"];
const PARKING_KEYS = ["Sin cochera", "1 cochera", "2 cocheras", "3+ cocheras"];

function buildOptionsWithCounts(
  keys: string[],
  countMap: Map<string, number>
): FilterOption[] {
  return keys.map((k) => ({
    value: k,
    label: `${k} (${countMap.get(k) || 0})`,
  }));
}

/** Merge normalized geo data into properties */
function enrichProperties(
  properties: Property[],
  geoData: Map<string, CachedGeoData>
): Property[] {
  return properties.map((p) => {
    const geo = geoData.get(p.location);
    if (!geo) return p;
    return {
      ...p,
      neighborhood: geo.norm_neighborhood || p.neighborhood,
      city: geo.norm_locality || geo.norm_province || p.city,
    };
  });
}

const PropertyList = () => {
  const { data, isLoading } = useProperties();
  const rawProperties = data?.properties ?? [];
  const neighborhoodStats = data?.neighborhoodStats ?? new Map();
  const [geoData, setGeoData] = useState<Map<string, CachedGeoData>>(new Map());

  useEffect(() => {
    fetchCachedCoordinates().then(setGeoData);
  }, []);

  const properties = useMemo(
    () => enrichProperties(rawProperties, geoData),
    [rawProperties, geoData]
  );

  const [search, setSearch] = useState("");
  const [roomsFilter, setRoomsFilter] = useState<FilterState>(createFilterState());
  const [sizeFilter, setSizeFilter] = useState<FilterState>(createFilterState());
  const [priceFilter, setPriceFilter] = useState<FilterState>(createFilterState());
  const [parkingFilter, setParkingFilter] = useState<FilterState>(createFilterState());
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<FilterState>(createFilterState());
  const [sortBy, setSortBy] = useState<string>("pricePerSqm");
  const [showOnlyDeals, setShowOnlyDeals] = useState(false);

  // Compute counts per filter category
  const counts = useMemo(() => {
    const rooms = new Map<string, number>();
    const sizes = new Map<string, number>();
    const prices = new Map<string, number>();
    const parking = new Map<string, number>();
    const neighborhoods = new Map<string, number>();

    for (const p of properties) {
      const r = getRoomsLabel(p.rooms);
      rooms.set(r, (rooms.get(r) || 0) + 1);
      const s = getSizeRange(p.surfaceTotal);
      sizes.set(s, (sizes.get(s) || 0) + 1);
      const pr = getPriceRange(p.price);
      prices.set(pr, (prices.get(pr) || 0) + 1);
      const pk = getParkingLabel(p.parking);
      parking.set(pk, (parking.get(pk) || 0) + 1);
      neighborhoods.set(p.neighborhood, (neighborhoods.get(p.neighborhood) || 0) + 1);
    }

    return { rooms, sizes, prices, parking, neighborhoods };
  }, [properties]);

  const roomsOptions = useMemo(() => buildOptionsWithCounts(ROOMS_KEYS, counts.rooms), [counts.rooms]);
  const sizeOptions = useMemo(() => buildOptionsWithCounts(SIZE_KEYS, counts.sizes), [counts.sizes]);
  const priceOptions = useMemo(() => buildOptionsWithCounts(PRICE_KEYS, counts.prices), [counts.prices]);
  const parkingOptions = useMemo(() => buildOptionsWithCounts(PARKING_KEYS, counts.parking), [counts.parking]);

  // Group neighborhoods by province (now using normalized data when available)
  const neighborhoodsByProvince = useMemo(() => {
    const provMap = new Map<string, { value: string; label: string; count: number }[]>();
    const provCounts = new Map<string, number>();

    for (const p of properties) {
      const prov = p.city || "Sin ciudad";
      provCounts.set(prov, (provCounts.get(prov) || 0) + 1);
    }

    for (const [hood, count] of counts.neighborhoods.entries()) {
      const sample = properties.find((p) => p.neighborhood === hood);
      const prov = sample?.city || "Sin ciudad";
      if (!provMap.has(prov)) provMap.set(prov, []);
      provMap.get(prov)!.push({ value: hood, label: `${hood} (${count})`, count });
    }

    return Array.from(provMap.entries())
      .map(([prov, hoods]) => ({
        province: prov,
        totalCount: provCounts.get(prov) || 0,
        neighborhoods: hoods.sort((a, b) => a.value.localeCompare(b.value)),
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [properties, counts.neighborhoods]);

  const neighborhoods = useMemo(() => {
    return Array.from(neighborhoodStats.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [neighborhoodStats]);

  const filtered = useMemo(() => {
    let result = properties;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.location.toLowerCase().includes(s) ||
          p.neighborhood.toLowerCase().includes(s) ||
          p.city.toLowerCase().includes(s)
      );
    }

    if (neighborhoodFilter.included.size > 0 || neighborhoodFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(p.neighborhood, neighborhoodFilter));
    }
    if (roomsFilter.included.size > 0 || roomsFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getRoomsLabel(p.rooms), roomsFilter));
    }
    if (sizeFilter.included.size > 0 || sizeFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getSizeRange(p.surfaceTotal), sizeFilter));
    }
    if (priceFilter.included.size > 0 || priceFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getPriceRange(p.price), priceFilter));
    }
    if (parkingFilter.included.size > 0 || parkingFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getParkingLabel(p.parking), parkingFilter));
    }
    if (showOnlyDeals) {
      result = result.filter((p) => p.isTopOpportunity || p.isNeighborhoodDeal);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "pricePerSqm": return (a.pricePerM2Total ?? 0) - (b.pricePerM2Total ?? 0);
        case "price": return a.price - b.price;
        case "opportunity": return b.opportunityScore - a.opportunityScore;
        case "area": return (b.surfaceTotal ?? 0) - (a.surfaceTotal ?? 0);
        default: return (a.pricePerM2Total ?? 0) - (b.pricePerM2Total ?? 0);
      }
    });

    return result;
  }, [properties, search, neighborhoodFilter, roomsFilter, sizeFilter, priceFilter, parkingFilter, sortBy, showOnlyDeals]);

  const segmentStats = useMemo(() => {
    const deals = filtered.filter((p) => p.isTopOpportunity || p.isNeighborhoodDeal);
    return {
      total: filtered.length,
      deals: deals.length,
      avgPricePerSqm: filtered.length
        ? Math.round(filtered.reduce((a, b) => a + (b.pricePerM2Total ?? 0), 0) / filtered.length)
        : 0,
    };
  }, [filtered]);

  return (
    <Layout>
      <div className="container px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Propiedades</h2>
          <p className="text-muted-foreground">Explorá y filtrá el mercado inmobiliario</p>
        </div>

        {/* Header stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total propiedades" value={segmentStats.total.toLocaleString()} />
          <StatCard label="Oportunidades" value={segmentStats.deals.toLocaleString()} highlight />
          <StatCard label="Prom. USD/m²" value={`$${segmentStats.avgPricePerSqm.toLocaleString()}`} />
          <StatCard label="Barrios" value={neighborhoods.length.toLocaleString()} />
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-5 mb-8 space-y-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
            <span className="text-xs ml-auto opacity-60">click = incluir · 2do = excluir · 3ro = limpiar</span>
          </div>

          {/* Search + sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dirección, barrio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border rounded-full h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnlyDeals(!showOnlyDeals)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
                  showOnlyDeals
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Star className="h-3 w-3" />
                Oportunidades
              </button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-secondary border-border text-xs h-10 rounded-full">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricePerSqm">USD/m² ↑</SelectItem>
                  <SelectItem value="price">Precio ↑</SelectItem>
                  <SelectItem value="opportunity">Oportunidad ↓</SelectItem>
                  <SelectItem value="area">Superficie ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chip filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MultiFilter title="Precio USD" options={priceOptions} state={priceFilter} onChange={setPriceFilter} />
            <MultiFilter title="Ambientes" options={roomsOptions} state={roomsFilter} onChange={setRoomsFilter} />
            <MultiFilter title="Superficie" options={sizeOptions} state={sizeFilter} onChange={setSizeFilter} />
            <MultiFilter title="Cocheras" options={parkingOptions} state={parkingFilter} onChange={setParkingFilter} />
          </div>

          {/* Barrio dropdown multi-select */}
          <NeighborhoodDropdown
            groups={neighborhoodsByProvince}
            state={neighborhoodFilter}
            onChange={setNeighborhoodFilter}
          />
        </div>

        {/* Property grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.slice(0, 60).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        {filtered.length > 60 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Mostrando 60 de {filtered.length} propiedades. Usá los filtros para refinar.
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No se encontraron propiedades con estos filtros.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

/* Searchable dropdown for barrios grouped by province with include/exclude */
interface ProvinceGroup {
  province: string;
  totalCount: number;
  neighborhoods: { value: string; label: string; count: number }[];
}

const NeighborhoodDropdown = ({
  groups,
  state,
  onChange,
}: {
  groups: ProvinceGroup[];
  state: FilterState;
  onChange: (s: FilterState) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (value: string) => {
    const next: FilterState = {
      included: new Set(state.included),
      excluded: new Set(state.excluded),
    };
    if (next.included.has(value)) {
      next.included.delete(value);
      next.excluded.add(value);
    } else if (next.excluded.has(value)) {
      next.excluded.delete(value);
    } else {
      next.included.add(value);
    }
    onChange(next);
  };

  const handleProvinceToggle = (group: ProvinceGroup) => {
    const allValues = group.neighborhoods.map((n) => n.value);
    const allIncluded = allValues.every((v) => state.included.has(v));

    const next: FilterState = {
      included: new Set(state.included),
      excluded: new Set(state.excluded),
    };

    if (allIncluded) {
      allValues.forEach((v) => next.included.delete(v));
    } else {
      allValues.forEach((v) => {
        next.excluded.delete(v);
        next.included.add(v);
      });
    }
    onChange(next);
  };

  const activeCount = state.included.size + state.excluded.size;

  const filteredGroups = useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        neighborhoods: g.neighborhoods.filter(
          (n) => n.value.toLowerCase().includes(q) || g.province.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.neighborhoods.length > 0);
  }, [groups, query]);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Barrio</span>
        {activeCount > 0 && (
          <button
            onClick={() => onChange(createFilterState())}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 mb-1.5">
          {Array.from(state.included).map((v) => (
            <span
              key={v}
              onClick={() => handleClick(v)}
              className="cursor-pointer px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30"
            >
              {v} ×
            </span>
          ))}
          {Array.from(state.excluded).map((v) => (
            <span
              key={v}
              onClick={() => handleClick(v)}
              className="cursor-pointer px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30 line-through"
            >
              ✕ {v} ×
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{activeCount > 0 ? `${activeCount} barrio${activeCount > 1 ? "s" : ""} seleccionado${activeCount > 1 ? "s" : ""}` : "Seleccionar barrios..."}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-border bg-popover shadow-lg max-h-80 overflow-hidden">
          <div className="p-2.5 border-b border-border">
            <Input
              placeholder="Buscar barrio o localidad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 text-xs bg-secondary border-border rounded-full"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-64">
            {filteredGroups.map((group) => {
              const allIncluded = group.neighborhoods.every((n) => state.included.has(n.value));
              const isCollapsed = collapsed.has(group.province) && !query;
              return (
                <div key={group.province}>
                  <div className="flex items-center border-b border-border sticky top-0 z-10">
                    <button
                      onClick={() => {
                        const next = new Set(collapsed);
                        if (next.has(group.province)) next.delete(group.province);
                        else next.add(group.province);
                        setCollapsed(next);
                      }}
                      className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleProvinceToggle(group)}
                      className={`flex-1 text-left py-1.5 pr-3 text-xs font-semibold flex items-center justify-between ${
                        allIncluded ? "bg-primary/10 text-primary" : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span>{group.province} ({group.totalCount})</span>
                      {allIncluded && <span className="text-primary text-[10px]">✓ todos</span>}
                    </button>
                  </div>
                  {!isCollapsed && group.neighborhoods.map((opt) => {
                    const isIncluded = state.included.has(opt.value);
                    const isExcluded = state.excluded.has(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleClick(opt.value)}
                        className={`w-full text-left pl-6 pr-3 py-1 text-xs transition-colors flex items-center justify-between ${
                          isIncluded
                            ? "bg-primary/5 text-primary"
                            : isExcluded
                            ? "bg-destructive/5 text-destructive line-through"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isIncluded && <span className="text-primary">✓</span>}
                        {isExcluded && <span className="text-destructive">✕</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="glass-card rounded-2xl p-5">
    <p className="text-xs text-muted-foreground mb-2">{label}</p>
    <p className={`text-3xl font-mono font-bold tracking-tight ${highlight ? "text-primary" : ""}`}>{value}</p>
  </div>
);

export default PropertyList;
