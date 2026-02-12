import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import {
  loadProperties,
  getSizeRange,
  getPriceRange,
  getRoomsLabel,
} from "@/lib/propertyData";
import MultiFilter, {
  createFilterState,
  applyFilter,
  FilterState,
} from "@/components/MultiFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, TrendingDown, Star } from "lucide-react";

function getParkingLabel(parking: number | null): string {
  if (!parking || parking === 0) return "Sin cochera";
  if (parking === 1) return "1 cochera";
  if (parking === 2) return "2 cocheras";
  return "3+ cocheras";
}

const ROOMS_OPTIONS = [
  { value: "1-2 amb", label: "1-2 amb" },
  { value: "3 amb", label: "3 amb" },
  { value: "4 amb", label: "4 amb" },
  { value: "5+ amb", label: "5+ amb" },
];

const SIZE_OPTIONS = [
  { value: "< 100 m²", label: "< 100 m²" },
  { value: "100-200 m²", label: "100-200 m²" },
  { value: "200-400 m²", label: "200-400 m²" },
  { value: "400-700 m²", label: "400-700 m²" },
  { value: "700+ m²", label: "700+ m²" },
];

const PRICE_OPTIONS = [
  { value: "< 100K", label: "< 100K" },
  { value: "100K-200K", label: "100-200K" },
  { value: "200K-400K", label: "200-400K" },
  { value: "400K-700K", label: "400-700K" },
  { value: "700K+", label: "700K+" },
];

const PARKING_OPTIONS = [
  { value: "Sin cochera", label: "Sin cochera" },
  { value: "1 cochera", label: "1 cochera" },
  { value: "2 cocheras", label: "2 cocheras" },
  { value: "3+ cocheras", label: "3+ cocheras" },
];

const PropertyList = () => {
  const { properties, neighborhoodStats } = useMemo(() => loadProperties(), []);

  const [search, setSearch] = useState("");
  const [roomsFilter, setRoomsFilter] = useState<FilterState>(createFilterState());
  const [sizeFilter, setSizeFilter] = useState<FilterState>(createFilterState());
  const [priceFilter, setPriceFilter] = useState<FilterState>(createFilterState());
  const [parkingFilter, setParkingFilter] = useState<FilterState>(createFilterState());
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<FilterState>(createFilterState());
  const [sortBy, setSortBy] = useState<string>("pricePerSqm");
  const [showOnlyDeals, setShowOnlyDeals] = useState(false);

  const neighborhoods = useMemo(() => {
    return Array.from(neighborhoodStats.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [neighborhoodStats]);

  const neighborhoodOptions = useMemo(() => {
    return neighborhoods.map((n) => ({
      value: n.name,
      label: `${n.name} (${n.count})`,
    }));
  }, [neighborhoods]);

  const filtered = useMemo(() => {
    let result = properties;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.location.toLowerCase().includes(s) ||
          p.neighborhood.toLowerCase().includes(s) ||
          p.province.toLowerCase().includes(s)
      );
    }

    if (neighborhoodFilter.included.size > 0 || neighborhoodFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(p.neighborhood, neighborhoodFilter));
    }
    if (roomsFilter.included.size > 0 || roomsFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getRoomsLabel(p.rooms), roomsFilter));
    }
    if (sizeFilter.included.size > 0 || sizeFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getSizeRange(p.totalArea), sizeFilter));
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
        case "pricePerSqm": return a.pricePerSqm - b.pricePerSqm;
        case "price": return a.price - b.price;
        case "opportunity": return b.opportunityScore - a.opportunityScore;
        case "area": return (b.totalArea ?? 0) - (a.totalArea ?? 0);
        default: return a.pricePerSqm - b.pricePerSqm;
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
        ? Math.round(filtered.reduce((a, b) => a + b.pricePerSqm, 0) / filtered.length)
        : 0,
    };
  }, [filtered]);

  return (
    <Layout>
      <div className="container px-4 py-6">
        {/* Header stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total propiedades" value={segmentStats.total.toLocaleString()} />
          <StatCard label="Oportunidades" value={segmentStats.deals.toLocaleString()} highlight />
          <StatCard label="Prom. USD/m²" value={`$${segmentStats.avgPricePerSqm.toLocaleString()}`} />
          <StatCard label="Barrios" value={neighborhoods.length.toLocaleString()} />
        </div>

        {/* Filters */}
        <div className="glass-card rounded-lg p-4 mb-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            <span className="text-xs ml-auto">click = incluir · 2do click = excluir · 3ro = limpiar</span>
          </div>

          {/* Search + sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dirección, barrio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnlyDeals(!showOnlyDeals)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors border whitespace-nowrap ${
                  showOnlyDeals
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Star className="h-3 w-3" />
                Oportunidades
              </button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-secondary border-border text-xs h-9">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MultiFilter title="Precio USD" options={PRICE_OPTIONS} state={priceFilter} onChange={setPriceFilter} />
            <MultiFilter title="Ambientes" options={ROOMS_OPTIONS} state={roomsFilter} onChange={setRoomsFilter} />
            <MultiFilter title="Superficie" options={SIZE_OPTIONS} state={sizeFilter} onChange={setSizeFilter} />
            <MultiFilter title="Cocheras" options={PARKING_OPTIONS} state={parkingFilter} onChange={setParkingFilter} />
            <div className="lg:col-span-2">
              <MultiFilter title="Barrio" options={neighborhoodOptions} state={neighborhoodFilter} onChange={setNeighborhoodFilter} />
            </div>
          </div>
        </div>

        {/* Property grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 60).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        {filtered.length > 60 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Mostrando 60 de {filtered.length} propiedades. Usá los filtros para refinar.
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No se encontraron propiedades con estos filtros.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="glass-card rounded-lg p-4">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-2xl font-mono font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
  </div>
);

export default PropertyList;
