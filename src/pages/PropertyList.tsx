import { useMemo, useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import {
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
import RangeSliderFilter from "@/components/RangeSliderFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, TrendingDown, Star, X } from "lucide-react";
import { fetchCachedCoordinates, CachedGeoData } from "@/lib/geocoding";
import NeighborhoodDropdown from "@/components/NeighborhoodDropdown";

function getParkingLabel(parking: number | null): string {
  if (!parking || parking === 0) return "Sin cochera";
  if (parking === 1) return "1 cochera";
  if (parking === 2) return "2 cocheras";
  return "3+ cocheras";
}

const ROOMS_KEYS = ["1 amb", "2 amb", "3 amb", "4 amb", "5+ amb"];
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

function formatPrice(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return v.toString();
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

  const PRICE_CAP = 2000000;
  const SURFACE_CAP = 5000;

  // Compute data ranges for sliders
  const dataRanges = useMemo(() => {
    const prices = properties.map((p) => p.price).filter(Boolean);
    const surfaces = properties.map((p) => p.surfaceTotal).filter((s): s is number => s !== null && s > 0);
    const ages = properties.map((p) => p.ageYears).filter((a): a is number => a !== null && a >= 0);
    return {
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: PRICE_CAP,
      surfaceMin: surfaces.length ? Math.min(...surfaces) : 0,
      surfaceMax: SURFACE_CAP,
      ageMin: ages.length ? Math.min(...ages) : 0,
      ageMax: ages.length ? Math.max(...ages) : 100,
    };
  }, [properties]);

  const [search, setSearch] = useState("");
  const [roomsFilter, setRoomsFilter] = useState<FilterState>(createFilterState());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [surfaceRange, setSurfaceRange] = useState<[number, number]>([0, 0]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 0]);
  const [parkingFilter, setParkingFilter] = useState<FilterState>(createFilterState());
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<FilterState>(createFilterState());
  const [sortBy, setSortBy] = useState<string>("pricePerSqm");
  const [showOnlyDeals, setShowOnlyDeals] = useState(false);
  const [rangesInitialized, setRangesInitialized] = useState(false);

  // Initialize slider ranges once data loads
  useEffect(() => {
    if (properties.length > 0 && !rangesInitialized) {
      setPriceRange([dataRanges.priceMin, dataRanges.priceMax]);
      setSurfaceRange([dataRanges.surfaceMin, dataRanges.surfaceMax]);
      setAgeRange([dataRanges.ageMin, dataRanges.ageMax]);
      setRangesInitialized(true);
    }
  }, [properties.length, dataRanges, rangesInitialized]);

  // Compute counts per filter category
  const counts = useMemo(() => {
    const rooms = new Map<string, number>();
    const parking = new Map<string, number>();
    const neighborhoods = new Map<string, number>();

    for (const p of properties) {
      const r = getRoomsLabel(p.rooms);
      rooms.set(r, (rooms.get(r) || 0) + 1);
      const pk = getParkingLabel(p.parking);
      parking.set(pk, (parking.get(pk) || 0) + 1);
      neighborhoods.set(p.neighborhood, (neighborhoods.get(p.neighborhood) || 0) + 1);
    }

    return { rooms, parking, neighborhoods };
  }, [properties]);

  const roomsOptions = useMemo(() => buildOptionsWithCounts(ROOMS_KEYS, counts.rooms), [counts.rooms]);
  const parkingOptions = useMemo(() => buildOptionsWithCounts(PARKING_KEYS, counts.parking), [counts.parking]);

  // Group neighborhoods by province
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
    if (parkingFilter.included.size > 0 || parkingFilter.excluded.size > 0) {
      result = result.filter((p) => applyFilter(getParkingLabel(p.parking), parkingFilter));
    }
    // Range filters
    if (rangesInitialized) {
      if (priceRange[0] > dataRanges.priceMin || priceRange[1] < dataRanges.priceMax) {
        result = result.filter((p) => p.price >= priceRange[0] && (priceRange[1] >= PRICE_CAP || p.price <= priceRange[1]));
      }
      if (surfaceRange[0] > dataRanges.surfaceMin || surfaceRange[1] < dataRanges.surfaceMax) {
        result = result.filter((p) => p.surfaceTotal !== null && p.surfaceTotal >= surfaceRange[0] && (surfaceRange[1] >= SURFACE_CAP || p.surfaceTotal <= surfaceRange[1]));
      }
      if (ageRange[0] > dataRanges.ageMin || ageRange[1] < dataRanges.ageMax) {
        result = result.filter((p) => p.ageYears !== null && p.ageYears >= ageRange[0] && p.ageYears <= ageRange[1]);
      }
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
  }, [properties, search, neighborhoodFilter, roomsFilter, parkingFilter, priceRange, surfaceRange, ageRange, sortBy, showOnlyDeals, rangesInitialized, dataRanges]);

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

          {/* Range sliders */}
          {rangesInitialized && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <RangeSliderFilter
                title="Precio USD"
                min={dataRanges.priceMin}
                max={dataRanges.priceMax}
                value={priceRange}
                onChange={setPriceRange}
                step={5000}
                formatValue={formatPrice}
                cappedMax
              />
              <RangeSliderFilter
                title="Superficie m²"
                min={dataRanges.surfaceMin}
                max={dataRanges.surfaceMax}
                value={surfaceRange}
                onChange={setSurfaceRange}
                step={5}
                unit=" m²"
                cappedMax
              />
              <RangeSliderFilter
                title="Antigüedad (años)"
                min={dataRanges.ageMin}
                max={dataRanges.ageMax}
                value={ageRange}
                onChange={setAgeRange}
                step={1}
                unit=" años"
              />
            </div>
          )}

          {/* Chip filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiFilter title="Ambientes" options={roomsOptions} state={roomsFilter} onChange={setRoomsFilter} />
            <MultiFilter title="Cocheras" options={parkingOptions} state={parkingFilter} onChange={setParkingFilter} />
          </div>

          {/* Barrio dropdown */}
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

/* NeighborhoodDropdown extracted to src/components/NeighborhoodDropdown.tsx */

const StatCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="glass-card rounded-2xl p-5">
    <p className="text-xs text-muted-foreground mb-2">{label}</p>
    <p className={`text-3xl font-mono font-bold tracking-tight ${highlight ? "text-primary" : ""}`}>{value}</p>
  </div>
);

export default PropertyList;
