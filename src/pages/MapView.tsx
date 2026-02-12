import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { loadProperties, getSizeRange, getPriceRange, getRoomsLabel } from "@/lib/propertyData";
import { fetchCachedCoordinates, geocodeBatch, CachedGeoData } from "@/lib/geocoding";
import { createFilterState, applyFilter, FilterState } from "@/components/MultiFilter";
import { ArrowLeft, ExternalLink, TrendingDown, SlidersHorizontal, Star, X } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  "Benavidez": [-34.42, -58.68],
  "Puerto Madero": [-34.62, -58.36],
  "Don Torcuato": [-34.50, -58.62],
  "Ricardo Rojas": [-34.47, -58.62],
  "San Marco": [-34.40, -58.67],
  "General Pacheco": [-34.46, -58.63],
  "El Talar": [-34.47, -58.64],
  "Rincón de Milberg": [-34.44, -58.63],
  "Troncos del Talar": [-34.48, -58.63],
  "Núñez": [-34.55, -58.46],
  "Santa Teresa": [-34.39, -58.67],
  "San Francisco": [-34.38, -58.67],
  "Los Olmos": [-34.42, -58.69],
  "Villa Adelina": [-34.52, -58.55],
  "San Agustín": [-34.39, -58.68],
  "Tigre": [-34.43, -58.58],
  "San Rafael": [-34.38, -58.66],
  "Parque Avellaneda": [-34.64, -58.48],
  "San Benito": [-34.40, -58.66],
  "Santa Catalina": [-34.39, -58.66],
  "San Gabriel": [-34.39, -58.67],
  "San Isidro Labrador": [-34.40, -58.67],
  "Villa Lugano": [-34.68, -58.47],
  "Belgrano C": [-34.56, -58.45],
  "Carapachay": [-34.52, -58.53],
  "Munro": [-34.53, -58.52],
  "San Isidro": [-34.47, -58.52],
  "Dique Luján": [-34.38, -58.60],
  "Nordelta": [-34.40, -58.65],
  "Villanueva": [-34.39, -58.67],
  "Palermo": [-34.58, -58.43],
  "Recoleta": [-34.59, -58.39],
  "Retiro": [-34.59, -58.37],
  "Barracas": [-34.64, -58.38],
  "La Boca": [-34.64, -58.36],
  "San Telmo": [-34.62, -58.37],
  "Monserrat": [-34.61, -58.38],
  "Constitución": [-34.63, -58.38],
  "Almagro": [-34.61, -58.42],
  "Caballito": [-34.62, -58.44],
  "Flores": [-34.63, -58.46],
  "Floresta": [-34.63, -58.49],
  "Liniers": [-34.64, -58.52],
  "Mataderos": [-34.66, -58.50],
  "Villa Devoto": [-34.60, -58.51],
  "Villa del Parque": [-34.61, -58.49],
  "Villa Urquiza": [-34.57, -58.49],
  "Saavedra": [-34.56, -58.49],
  "Coghlan": [-34.56, -58.47],
  "Belgrano": [-34.56, -58.46],
  "Villa Crespo": [-34.60, -58.44],
  "Colegiales": [-34.57, -58.45],
  "Chacarita": [-34.59, -58.46],
  "Boedo": [-34.63, -58.42],
  "Parque Chacabuco": [-34.64, -58.44],
  "Pompeya": [-34.65, -58.42],
  "Barrio Norte": [-34.59, -58.40],
  "Olivos": [-34.51, -58.50],
  "Martínez": [-34.50, -58.51],
  "Acassuso": [-34.48, -58.51],
  "Beccar": [-34.47, -58.53],
  "Victoria": [-34.45, -58.54],
  "Virreyes": [-34.45, -58.55],
  "Florida": [-34.53, -58.51],
  "Vicente López": [-34.53, -58.48],
  "La Lucila": [-34.51, -58.49],
  "Boulogne": [-34.50, -58.56],
  "Cid Campeador": [-34.61, -58.43],
  "La Paternal": [-34.60, -58.47],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function scatterCoord(base: [number, number], id: string, spread = 0.015): [number, number] {
  const h1 = hashStr(id + "lat");
  const h2 = hashStr(id + "lng");
  return [
    base[0] + ((h1 % 1000) / 1000 - 0.5) * spread,
    base[1] + ((h2 % 1000) / 1000 - 0.5) * spread,
  ];
}

function getPropertyColor(pricePerSqm: number, min: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, (pricePerSqm - min) / (max - min || 1)));
  if (ratio < 0.5) {
    const t = ratio / 0.5;
    return `hsl(${210 - t * 50}, 80%, ${45 + t * 10}%)`;
  } else {
    const t = (ratio - 0.5) / 0.5;
    return `hsl(${160 - t * 20}, 65%, ${50 + t * 15}%)`;
  }
}

const MapFilterRow = ({ title, keys, state, onChange }: {
  title: string;
  keys: string[];
  state: FilterState;
  onChange: (s: FilterState) => void;
}) => {
  const handleClick = (value: string) => {
    const next: FilterState = { included: new Set(state.included), excluded: new Set(state.excluded) };
    if (next.included.has(value)) { next.included.delete(value); next.excluded.add(value); }
    else if (next.excluded.has(value)) { next.excluded.delete(value); }
    else { next.included.add(value); }
    onChange(next);
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground w-16 shrink-0">{title}</span>
      <div className="flex flex-wrap gap-1">
        {keys.map((k) => {
          const isIn = state.included.has(k);
          const isEx = state.excluded.has(k);
          return (
            <button key={k} onClick={() => handleClick(k)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                isIn ? "bg-primary/20 text-primary border-primary/30"
                : isEx ? "bg-destructive/10 text-destructive border-destructive/30 line-through"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground"
              }`}
            >
              {isEx && "✕ "}{k}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LAYERS_PER_PROPERTY = 2;
const BASE_RADIUS = 24;

function getRadiusForZoom(zoom: number): number {
  const scale = Math.pow(2, zoom - 12);
  const raw = BASE_RADIUS * scale * 0.5;
  return Math.max(BASE_RADIUS, Math.min(raw, 100));
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const diffuseLayerRef = useRef<L.LayerGroup | null>(null);
  const dealLayerRef = useRef<L.LayerGroup | null>(null);
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);

  const { properties, neighborhoodStats } = useMemo(() => loadProperties(), []);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<string, CachedGeoData>>(new Map());
  const [seedingDone, setSeedingDone] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [roomsFilter, setRoomsFilter] = useState<FilterState>(createFilterState());
  const [sizeFilter, setSizeFilter] = useState<FilterState>(createFilterState());
  const [priceFilter, setPriceFilter] = useState<FilterState>(createFilterState());
  const [parkingFilter, setParkingFilter] = useState<FilterState>(createFilterState());
  const [showOnlyDeals, setShowOnlyDeals] = useState(false);

  const activeFilterCount = [roomsFilter, sizeFilter, priceFilter, parkingFilter].reduce(
    (acc, f) => acc + f.included.size + f.excluded.size, 0
  ) + (showOnlyDeals ? 1 : 0);

  const clearAllFilters = () => {
    setRoomsFilter(createFilterState());
    setSizeFilter(createFilterState());
    setPriceFilter(createFilterState());
    setParkingFilter(createFilterState());
    setShowOnlyDeals(false);
  };

  const totalProperties = properties.length;
  const geocodedCount = geocodedCoords.size;
  const progressPct = totalProperties > 0 ? Math.round((geocodedCount / totalProperties) * 100) : 0;

  const allPrices = useMemo(() => properties.map((p) => p.pricePerSqm), [properties]);
  const minPrice = useMemo(() => Math.min(...allPrices), [allPrices]);
  const maxPrice = useMemo(() => Math.max(...allPrices), [allPrices]);

  const allMappedProperties = useMemo(
    () => properties.filter((p) => geocodedCoords.has(p.location) || NEIGHBORHOOD_COORDS[p.neighborhood]),
    [properties, geocodedCoords]
  );

  // Apply filters to allMappedProperties
  const filteredProperties = useMemo(() => {
    let result = allMappedProperties;
    if (selectedProvince) result = result.filter((p) => p.province === selectedProvince);
    if (roomsFilter.included.size > 0 || roomsFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(getRoomsLabel(p.rooms), roomsFilter));
    if (sizeFilter.included.size > 0 || sizeFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(getSizeRange(p.totalArea), sizeFilter));
    if (priceFilter.included.size > 0 || priceFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(getPriceRange(p.price), priceFilter));
    if (parkingFilter.included.size > 0 || parkingFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(getParkingLabel(p.parking), parkingFilter));
    if (showOnlyDeals) result = result.filter((p) => p.isTopOpportunity || p.isNeighborhoodDeal);
    return result;
  }, [allMappedProperties, selectedProvince, roomsFilter, sizeFilter, priceFilter, parkingFilter, showOnlyDeals]);

  const mappedProperties = filteredProperties;

  const dealProperties = useMemo(
    () => mappedProperties.filter((p) => p.isNeighborhoodDeal),
    [mappedProperties]
  );

  const selectedDeals = useMemo(
    () => selectedProvince
      ? filteredProperties.filter((p) => p.province === selectedProvince && p.isNeighborhoodDeal)
          .sort((a, b) => b.opportunityScore - a.opportunityScore)
      : [],
    [filteredProperties, selectedProvince]
  );



  // Load cached coordinates on mount
  useEffect(() => {
    fetchCachedCoordinates().then(setGeocodedCoords);
  }, []);

  // Auto-seed all addresses on mount (once)
  useEffect(() => {
    if (seedingDone || geocodedCoords.size === 0 && properties.length === 0) return;
    
    const seed = async () => {
      const allAddresses = new Set(
        Array.from(geocodedCoords.keys())
      );
      const uncached = properties.filter((p) => !allAddresses.has(p.location));
      
      if (uncached.length === 0) {
        setSeedingDone(true);
        return;
      }

      console.log(`Seeding ${uncached.length} addresses into geocoding queue...`);
      const batchSize = 200;
      for (let i = 0; i < uncached.length; i += batchSize) {
        const batch = uncached.slice(i, i + batchSize);
        await geocodeBatch(batch);
      }
      setSeedingDone(true);
      console.log(`Seeding complete. Cron will geocode automatically.`);
    };

    // Small delay to let initial fetch complete
    const timer = setTimeout(seed, 2000);
    return () => clearTimeout(timer);
  }, [properties, geocodedCoords, seedingDone]);

  const getCoord = useCallback(
    (p: { id: string; location: string; neighborhood: string }): [number, number] => {
      const geo = geocodedCoords.get(p.location);
      if (geo) return [geo.lat, geo.lng];
      const base = NEIGHBORHOOD_COORDS[p.neighborhood];
      if (base) return scatterCoord(base, p.id);
      return [-34.5, -58.5];
    },
    [geocodedCoords]
  );

  const mappedNeighborhoods = useMemo(() => {
    const stats = Array.from(neighborhoodStats.values());
    return stats
      .filter((s) => NEIGHBORHOOD_COORDS[s.name])
      .map((s) => ({ ...s, coords: NEIGHBORHOOD_COORDS[s.name] }));
  }, [neighborhoodStats]);

  // Zoom map to selected province bounds — only on explicit province selection
  const prevProvinceRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    // Only fitBounds when province selection actually changed
    if (selectedProvince === prevProvinceRef.current) return;
    prevProvinceRef.current = selectedProvince;

    if (selectedProvince) {
      const coords = mappedProperties.map((p) => getCoord(p));
      if (coords.length > 0) {
        map.fitBounds(coords as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 14 });
      }
    } else {
      const bounds: [number, number][] = mappedNeighborhoods.map((n) => n.coords);
      if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [selectedProvince, mappedProperties, getCoord, mappedNeighborhoods]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { center: [-34.45, -58.55], zoom: 12, preferCanvas: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    const bounds: [number, number][] = mappedNeighborhoods.map((n) => n.coords);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] });

    diffuseLayerRef.current = L.layerGroup().addTo(map);
    dealLayerRef.current = L.layerGroup().addTo(map);
    highlightLayerRef.current = L.layerGroup().addTo(map);

    map.on("zoomend", () => {
      const zoom = map.getZoom();
      const radius = getRadiusForZoom(zoom);
      const opacityScale = Math.max(0.15, Math.min(1, 11 / zoom));
      diffuseLayerRef.current?.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          const baseOpacity = (layer as any)._baseOpacity ?? layer.options.fillOpacity ?? 0.01;
          (layer as any)._baseOpacity = baseOpacity;
          const baseRadiusFactor = (layer as any)._baseRadiusFactor ?? 1;
          layer.setRadius(radius * baseRadiusFactor);
          layer.setStyle({ fillOpacity: baseOpacity * opacityScale });
        }
      });
    });

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      diffuseLayerRef.current = null;
      dealLayerRef.current = null;
      highlightLayerRef.current = null;
    };
  }, [mappedNeighborhoods]);

  // Update markers when coordinates change
  useEffect(() => {
    const diffuse = diffuseLayerRef.current;
    const deals = dealLayerRef.current;
    if (!diffuse || !deals) return;

    diffuse.clearLayers();
    deals.clearLayers();

    mappedProperties.forEach((p) => {
      const coords = getCoord(p);
      const color = getPropertyColor(p.pricePerSqm, minPrice, maxPrice);

      const currentZoom = mapInstanceRef.current?.getZoom() ?? 12;
      const radius = getRadiusForZoom(currentZoom);

      for (let i = 0; i < LAYERS_PER_PROPERTY; i++) {
        const t = i / (LAYERS_PER_PROPERTY - 1);
        // Outer ring at 60% of radius, inner at 30% — tighter, less halo
        const radiusFactor = 0.6 - t * 0.3;
        const marker = L.circleMarker(coords, {
          radius: radius * radiusFactor,
          color: "transparent",
          fillColor: color,
          fillOpacity: 0.008 + t * 0.02,
          weight: 0,
          interactive: false,
        });
        (marker as any)._baseRadiusFactor = radiusFactor;
        (marker as any)._baseOpacity = 0.006 + t * 0.012;
        marker.addTo(diffuse);
      }
    });

    const dealIcon = L.divIcon({
      className: "",
      html: `<div style="width:7px;height:7px;background:rgba(220,235,245,0.7);border:1px solid rgba(255,255,255,0.3);border-radius:50%;"></div>`,
      iconSize: [7, 7],
      iconAnchor: [3.5, 3.5],
    });

    dealProperties.forEach((p) => {
      const coords = getCoord(p);
      L.marker(coords, { icon: dealIcon })
        .bindPopup(
          `<div style="font-family:Satoshi,sans-serif;font-size:12px;color:#111;min-width:200px;">
            <div style="background:hsl(190,90%,50%);color:#000;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:6px;">
              ⭐ -${p.opportunityScore.toFixed(0)}% vs barrio
            </div><br/>
            <strong>${p.neighborhood}</strong><br/>
            <span style="color:#555;">${p.location}</span><br/><br/>
            <strong>USD/m²:</strong> $${p.pricePerSqm.toLocaleString()}<br/>
            <strong>Precio:</strong> $${p.price.toLocaleString()}<br/>
            ${p.totalArea ? `<strong>Superficie:</strong> ${p.totalArea} m²<br/>` : ""}
            ${p.rooms ? `<strong>Ambientes:</strong> ${p.rooms}<br/>` : ""}
            <a href="${p.url}" target="_blank" style="color:hsl(190,90%,50%);text-decoration:none;font-weight:600;">Ver publicación →</a>
          </div>`
        )
        .addTo(deals);
    });
  }, [mappedProperties, dealProperties, getCoord, minPrice, maxPrice]);

  // Auto-refresh geocoded coords every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await fetchCachedCoordinates();
      setGeocodedCoords(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute province-level stats
  const provinceStats = useMemo(() => {
    const map = new Map<string, { prices: number[]; count: number }>();
    for (const p of properties) {
      const prov = p.province || "Sin provincia";
      if (!map.has(prov)) map.set(prov, { prices: [], count: 0 });
      const entry = map.get(prov)!;
      entry.prices.push(p.pricePerSqm);
      entry.count++;
    }
    const result: { name: string; medianPricePerSqm: number; count: number }[] = [];
    for (const [name, { prices, count }] of map) {
      const sorted = [...prices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      result.push({ name, medianPricePerSqm: Math.round(median), count });
    }
    return result.sort((a, b) => b.count - a.count);
  }, [properties]);

  const minMedian = mappedNeighborhoods.length ? Math.min(...mappedNeighborhoods.map((n) => n.medianPricePerSqm)) : 0;
  const maxMedian = mappedNeighborhoods.length ? Math.max(...mappedNeighborhoods.map((n) => n.medianPricePerSqm)) : 0;

  const headerFilters = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${
          showFilters || activeFilterCount > 0 ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <SlidersHorizontal className="h-3 w-3" />
        Filtros{activeFilterCount > 0 && ` (${activeFilterCount})`}
      </button>
      <button
        onClick={() => setShowOnlyDeals(!showOnlyDeals)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${
          showOnlyDeals ? "bg-primary/20 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <Star className="h-3 w-3" />
        Oportunidades
      </button>
      {activeFilterCount > 0 && (
        <button onClick={clearAllFilters} className="flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px] text-muted-foreground hover:text-foreground border border-border">
          <X className="h-3 w-3" /> Limpiar
        </button>
      )}
    </div>
  );

  return (
    <Layout headerContent={headerFilters}>
      <div className="relative h-[calc(100vh-3.5rem)] flex flex-col">
        {showFilters && (
          <div className="bg-card/95 backdrop-blur border-b border-border px-4 py-2 flex items-center gap-4 flex-wrap z-10">
            <MapFilterRow title="Precio" keys={PRICE_KEYS} state={priceFilter} onChange={setPriceFilter} />
            <div className="w-px h-5 bg-border" />
            <MapFilterRow title="Amb." keys={ROOMS_KEYS} state={roomsFilter} onChange={setRoomsFilter} />
            <div className="w-px h-5 bg-border" />
            <MapFilterRow title="Sup." keys={SIZE_KEYS} state={sizeFilter} onChange={setSizeFilter} />
            <div className="w-px h-5 bg-border" />
            <MapFilterRow title="Cocheras" keys={PARKING_KEYS} state={parkingFilter} onChange={setParkingFilter} />
          </div>
        )}

        <div ref={mapRef} className="h-full w-full flex-1" />

        {/* Legend - bottom left, compact like geocoding block */}
        <div className="absolute bottom-4 left-4 glass-card rounded-2xl p-4 z-[1000] w-[250px]">
          <p className="text-xs font-medium text-foreground mb-2">USD/m² por propiedad</p>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-primary font-mono">${minMedian.toLocaleString()}</span>
            <div
              className="h-1.5 flex-1 rounded-full"
              style={{ background: "linear-gradient(to right, hsl(210,80%,45%), hsl(160,65%,50%), hsl(140,65%,65%))" }}
            />
            <span className="text-[11px] text-expensive font-mono">${maxMedian.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(220,235,245,0.7)" }} />
            <span className="text-[11px] text-muted-foreground">{dealProperties.length} oportunidades (&gt;40% bajo mediana)</span>
          </div>
        </div>

        {/* Right sidebar: stats + geocoding */}
        <div className="absolute top-4 right-4 bottom-4 z-[1000] flex flex-col gap-3 w-[250px]">
          <div className="glass-card rounded-2xl p-4 flex-1 min-h-0 flex flex-col">
            {selectedProvince ? (
              <>
                <button
                  onClick={() => setSelectedProvince(null)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver a localidades
                </button>
                <p className="text-xs font-medium text-foreground mb-1 shrink-0">{selectedProvince}</p>
                <p className="text-[11px] text-muted-foreground mb-3 shrink-0">
                  {selectedDeals.length} oportunidad{selectedDeals.length !== 1 ? "es" : ""}
                </p>
                <div className="overflow-y-auto flex-1 min-h-0 pr-1 custom-scroll space-y-2">
                  {selectedDeals.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">Sin oportunidades en esta localidad.</p>
                  )}
                  {selectedDeals.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors"
                      onMouseEnter={() => {
                        const hl = highlightLayerRef.current;
                        if (!hl) return;
                        hl.clearLayers();
                        const coords = getCoord(p);
                        L.circleMarker(coords, {
                          radius: 18,
                          color: "hsl(190,90%,50%)",
                          fillColor: "hsl(190,90%,50%)",
                          fillOpacity: 0.35,
                          weight: 2,
                          interactive: false,
                        }).addTo(hl);
                        L.circleMarker(coords, {
                          radius: 6,
                          color: "white",
                          fillColor: "hsl(190,90%,70%)",
                          fillOpacity: 0.9,
                          weight: 1.5,
                          interactive: false,
                        }).addTo(hl);
                      }}
                      onMouseLeave={() => highlightLayerRef.current?.clearLayers()}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[11px] text-foreground leading-tight line-clamp-2">{p.location}</span>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingDown className="h-3 w-3 text-primary" />
                        <span className="text-[11px] font-medium text-primary">-{p.opportunityScore.toFixed(0)}% vs barrio</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">USD/m²</span>
                          <span className="block font-mono font-semibold text-foreground">${p.pricePerSqm.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precio</span>
                          <span className="block font-mono font-semibold text-foreground">${p.price.toLocaleString()}</span>
                        </div>
                        {p.totalArea && (
                          <div>
                            <span className="text-muted-foreground">Sup.</span>
                            <span className="block font-mono text-foreground">{p.totalArea} m²</span>
                          </div>
                        )}
                        {p.rooms && (
                          <div>
                            <span className="text-muted-foreground">Amb.</span>
                            <span className="block font-mono text-foreground">{p.rooms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-foreground mb-3 shrink-0">Mediana USD/m² por localidad</p>
                <div className="overflow-y-auto flex-1 min-h-0 pr-1 custom-scroll">
                  {provinceStats.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedProvince(p.name)}
                      className="w-full flex justify-between text-xs py-1.5 border-b border-border/50 last:border-0 gap-3 hover:bg-secondary/30 transition-colors rounded px-1 -mx-1 text-left"
                    >
                      <span className="text-foreground truncate">{p.name} <span className="text-muted-foreground">({p.count})</span></span>
                      <span className="font-mono text-primary whitespace-nowrap">${p.medianPricePerSqm.toLocaleString()}/m²</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Geocoding progress indicator */}
          <div className="glass-card rounded-2xl p-4 shrink-0">
            <p className="text-xs font-medium text-foreground mb-2">📍 Geocodificación</p>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-primary">{progressPct}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {geocodedCount.toLocaleString()} / {totalProperties.toLocaleString()} propiedades
            </p>
            {progressPct < 100 && (
              <p className="text-[11px] text-muted-foreground mt-1 opacity-60">
                Procesando automáticamente...
              </p>
            )}
            {progressPct === 100 && (
              <p className="text-[11px] text-primary mt-1">✓ Completo</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapView;
