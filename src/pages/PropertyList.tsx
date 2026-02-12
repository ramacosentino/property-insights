import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import {
  loadProperties,
  Property,
  getSizeRange,
  getPriceRange,
  getRoomsLabel,
} from "@/lib/propertyData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, TrendingDown, Star } from "lucide-react";

const PropertyList = () => {
  const { properties, neighborhoodStats } = useMemo(() => loadProperties(), []);

  const [search, setSearch] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [roomsFilter, setRoomsFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [parkingFilter, setParkingFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("pricePerSqm");
  const [showOnlyDeals, setShowOnlyDeals] = useState(false);

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
          p.province.toLowerCase().includes(s)
      );
    }

    if (neighborhoodFilter !== "all") {
      result = result.filter((p) => p.neighborhood === neighborhoodFilter);
    }
    if (roomsFilter !== "all") {
      result = result.filter((p) => getRoomsLabel(p.rooms) === roomsFilter);
    }
    if (sizeFilter !== "all") {
      result = result.filter((p) => getSizeRange(p.totalArea) === sizeFilter);
    }
    if (priceFilter !== "all") {
      result = result.filter((p) => getPriceRange(p.price) === priceFilter);
    }
    if (parkingFilter !== "all") {
      if (parkingFilter === "0") {
        result = result.filter((p) => !p.parking || p.parking === 0);
      } else if (parkingFilter === "3+") {
        result = result.filter((p) => p.parking && p.parking >= 3);
      } else {
        result = result.filter((p) => p.parking === Number(parkingFilter));
      }
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

  // Segment stats
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
          <StatCard
            label="Oportunidades"
            value={segmentStats.deals.toLocaleString()}
            highlight
          />
          <StatCard
            label="Prom. USD/m²"
            value={`$${segmentStats.avgPricePerSqm.toLocaleString()}`}
          />
          <StatCard
            label="Barrios"
            value={neighborhoods.length.toLocaleString()}
          />
        </div>

        {/* Filters */}
        <div className="glass-card rounded-lg p-4 mb-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dirección, barrio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Barrio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barrio</SelectItem>
                {neighborhoods.map((n) => (
                  <SelectItem key={n.name} value={n.name}>
                    {n.name} ({n.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roomsFilter} onValueChange={setRoomsFilter}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Ambientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1-2 amb">1-2 amb</SelectItem>
                <SelectItem value="3 amb">3 amb</SelectItem>
                <SelectItem value="4 amb">4 amb</SelectItem>
                <SelectItem value="5+ amb">5+ amb</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Superficie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="< 100 m²">&lt; 100 m²</SelectItem>
                <SelectItem value="100-200 m²">100-200 m²</SelectItem>
                <SelectItem value="200-400 m²">200-400 m²</SelectItem>
                <SelectItem value="400-700 m²">400-700 m²</SelectItem>
                <SelectItem value="700+ m²">700+ m²</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-secondary border-border">
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowOnlyDeals(!showOnlyDeals)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                showOnlyDeals
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              <Star className="h-3 w-3" />
              Solo oportunidades
            </button>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-auto bg-secondary border-border text-xs h-8">
                <SelectValue placeholder="Rango precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo precio</SelectItem>
                <SelectItem value="< 100K">&lt; 100K</SelectItem>
                <SelectItem value="100K-200K">100K-200K</SelectItem>
                <SelectItem value="200K-400K">200K-400K</SelectItem>
                <SelectItem value="400K-700K">400K-700K</SelectItem>
                <SelectItem value="700K+">700K+</SelectItem>
              </SelectContent>
            </Select>
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

const StatCard = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="glass-card rounded-lg p-4">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-2xl font-mono font-bold ${highlight ? "text-primary" : ""}`}>
      {value}
    </p>
  </div>
);

export default PropertyList;
