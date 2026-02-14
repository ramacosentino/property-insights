import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { getRoomsLabel } from "@/lib/propertyData";
import { useProperties } from "@/hooks/useProperties";
import { fetchCachedCoordinates, CachedGeoData } from "@/lib/geocoding";
import { createFilterState, applyFilter, FilterState } from "@/components/MultiFilter";
import RangeSliderFilter from "@/components/RangeSliderFilter";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, ExternalLink, TrendingDown, SlidersHorizontal, Star, X, Eye } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

function getParkingLabel(parking: number | null): string {
  if (!parking || parking === 0) return "Sin cochera";
  if (parking === 1) return "1 cochera";
  if (parking === 2) return "2 cocheras";
  return "3+ cocheras";
}

const ROOMS_KEYS = ["1 amb", "2 amb", "3 amb", "4 amb", "5+ amb"];
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

// Color scale: blue (cheap) → green (expensive), green starts earlier and stronger
function getPropertyColor(pricePerSqm: number, min: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, (pricePerSqm - min) / (max - min || 1)));
  if (ratio < 0.25) {
    // Deep blue (cheapest)
    const t = ratio / 0.25;
    return `hsl(${220 - t * 10}, 70%, ${40 + t * 8}%)`;
  } else if (ratio < 0.5) {
    // Blue → teal transition
    const t = (ratio - 0.25) / 0.25;
    return `hsl(${210 - t * 60}, ${70 - t * 5}%, ${48 + t * 7}%)`;
  } else if (ratio < 0.7) {
    // Teal → green transition (green starts here)
    const t = (ratio - 0.5) / 0.2;
    return `hsl(${150 - t * 20}, ${65 + t * 10}%, ${55 - t * 5}%)`;
  } else {
    // Strong green (expensive)
    const t = (ratio - 0.7) / 0.3;
    return `hsl(${130 - t * 10}, ${75 + t * 10}%, ${50 - t * 10}%)`;
  }
}

function formatPrice(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return v.toString();
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

const CIRCLE_RADIUS_METERS = 800;

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const diffuseLayerRef = useRef<L.LayerGroup | null>(null);
  const dealLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);

  const { isDark } = useTheme();
  const { data, isLoading } = useProperties();
  const properties = data?.properties ?? [];
  const neighborhoodStats = data?.neighborhoodStats ?? new Map();
  const [geocodedCoords, setGeocodedCoords] = useState<Map<string, CachedGeoData>>(new Map());
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [roomsFilter, setRoomsFilter] = useState<FilterState>(createFilterState());
  const [parkingFilter, setParkingFilter] = useState<FilterState>(createFilterState());

  // View mode: "opportunities" or "all"
  const [viewMode, setViewMode] = useState<"opportunities" | "all">("opportunities");
  // Dynamic opportunity threshold (%)
  const [dealThreshold, setDealThreshold] = useState(40);

  // Range filters
  const dataRanges = useMemo(() => {
    const prices = properties.map((p) => p.price).filter(Boolean);
    const surfaces = properties.map((p) => p.surfaceTotal).filter((s): s is number => s !== null && s > 0);
    const ages = properties.map((p) => p.ageYears).filter((a): a is number => a !== null && a >= 0);
    return {
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 1000000,
      surfaceMin: surfaces.length ? Math.min(...surfaces) : 0,
      surfaceMax: surfaces.length ? Math.max(...surfaces) : 1000,
      ageMin: ages.length ? Math.min(...ages) : 0,
      ageMax: ages.length ? Math.max(...ages) : 100,
    };
  }, [properties]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [surfaceRange, setSurfaceRange] = useState<[number, number]>([0, 0]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 0]);
  const [rangesInitialized, setRangesInitialized] = useState(false);

  useEffect(() => {
    if (properties.length > 0 && !rangesInitialized) {
      setPriceRange([dataRanges.priceMin, dataRanges.priceMax]);
      setSurfaceRange([dataRanges.surfaceMin, dataRanges.surfaceMax]);
      setAgeRange([dataRanges.ageMin, dataRanges.ageMax]);
      setRangesInitialized(true);
    }
  }, [properties.length, dataRanges, rangesInitialized]);

  const activeFilterCount = [roomsFilter, parkingFilter].reduce(
    (acc, f) => acc + f.included.size + f.excluded.size, 0
  ) + (rangesInitialized && (priceRange[0] > dataRanges.priceMin || priceRange[1] < dataRanges.priceMax) ? 1 : 0)
    + (rangesInitialized && (surfaceRange[0] > dataRanges.surfaceMin || surfaceRange[1] < dataRanges.surfaceMax) ? 1 : 0)
    + (rangesInitialized && (ageRange[0] > dataRanges.ageMin || ageRange[1] < dataRanges.ageMax) ? 1 : 0);

  const clearAllFilters = () => {
    setRoomsFilter(createFilterState());
    setParkingFilter(createFilterState());
    if (rangesInitialized) {
      setPriceRange([dataRanges.priceMin, dataRanges.priceMax]);
      setSurfaceRange([dataRanges.surfaceMin, dataRanges.surfaceMax]);
      setAgeRange([dataRanges.ageMin, dataRanges.ageMax]);
    }
  };

  const totalProperties = properties.length;
  const geocodedCount = geocodedCoords.size;
  const progressPct = totalProperties > 0 ? Math.round((geocodedCount / totalProperties) * 100) : 0;

  const allPrices = useMemo(() => properties.filter((p) => p.pricePerM2Total).map((p) => p.pricePerM2Total!), [properties]);
  const minPrice = useMemo(() => allPrices.length ? Math.min(...allPrices) : 0, [allPrices]);
  const maxPrice = useMemo(() => allPrices.length ? Math.max(...allPrices) : 0, [allPrices]);

  const allMappedProperties = useMemo(
    () => properties.filter((p) => geocodedCoords.has(p.address || p.location) || NEIGHBORHOOD_COORDS[p.neighborhood]),
    [properties, geocodedCoords]
  );

  // Apply filters
  const filteredProperties = useMemo(() => {
    let result = allMappedProperties;
    if (selectedProvince) result = result.filter((p) => p.city === selectedProvince);
    if (roomsFilter.included.size > 0 || roomsFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(getRoomsLabel(p.rooms), roomsFilter));
    if (parkingFilter.included.size > 0 || parkingFilter.excluded.size > 0)
      result = result.filter((p) => applyFilter(getParkingLabel(p.parking), parkingFilter));
    // Range filters
    if (rangesInitialized) {
      if (priceRange[0] > dataRanges.priceMin || priceRange[1] < dataRanges.priceMax)
        result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
      if (surfaceRange[0] > dataRanges.surfaceMin || surfaceRange[1] < dataRanges.surfaceMax)
        result = result.filter((p) => p.surfaceTotal !== null && p.surfaceTotal >= surfaceRange[0] && p.surfaceTotal <= surfaceRange[1]);
      if (ageRange[0] > dataRanges.ageMin || ageRange[1] < dataRanges.ageMax)
        result = result.filter((p) => p.ageYears !== null && p.ageYears >= ageRange[0] && p.ageYears <= ageRange[1]);
    }
    return result;
  }, [allMappedProperties, selectedProvince, roomsFilter, parkingFilter, priceRange, surfaceRange, ageRange, rangesInitialized, dataRanges]);

  const mappedProperties = filteredProperties;

  // Dynamic deal detection based on threshold
  const dealProperties = useMemo(
    () => mappedProperties.filter((p) => p.opportunityScore >= dealThreshold),
    [mappedProperties, dealThreshold]
  );

  const selectedDeals = useMemo(
    () => selectedProvince
      ? (viewMode === "opportunities" 
          ? filteredProperties.filter((p) => p.city === selectedProvince && p.opportunityScore >= dealThreshold)
          : filteredProperties.filter((p) => p.city === selectedProvince)
        ).sort((a, b) => b.opportunityScore - a.opportunityScore)
      : [],
    [filteredProperties, selectedProvince, viewMode, dealThreshold]
  );

  // Load cached coordinates on mount
  useEffect(() => {
    fetchCachedCoordinates().then(setGeocodedCoords);
  }, []);

  const getCoord = useCallback(
    (p: { id: string; location: string; neighborhood: string; address?: string | null }): [number, number] => {
      const geo = geocodedCoords.get(p.address || p.location);
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

  // Zoom to province
  const prevProvinceRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
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

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { center: [-34.45, -58.55], zoom: 12, preferCanvas: true });
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    const bounds: [number, number][] = mappedNeighborhoods.map((n) => n.coords);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] });

    diffuseLayerRef.current = L.layerGroup().addTo(map);
    dealLayerRef.current = L.layerGroup().addTo(map);
    highlightLayerRef.current = L.layerGroup().addTo(map);

    // Create cluster group for "all" mode
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = "small";
        if (count > 50) size = "large";
        else if (count > 20) size = "medium";
        return L.divIcon({
          html: `<div style="
            background: hsl(200, 85%, 42%);
            color: white;
            border-radius: 50%;
            width: ${size === "large" ? 44 : size === "medium" ? 36 : 28}px;
            height: ${size === "large" ? 44 : size === "medium" ? 36 : 28}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: ${size === "large" ? 13 : size === "medium" ? 12 : 11}px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border: 2px solid white;
          ">${count}</div>`,
          className: "",
          iconSize: L.point(size === "large" ? 44 : size === "medium" ? 36 : 28, size === "large" ? 44 : size === "medium" ? 36 : 28),
        });
      },
    });
    clusterGroup.addTo(map);
    clusterLayerRef.current = clusterGroup;

    map.on("zoomend", () => {
      const zoom = map.getZoom();
      const opacityScale = Math.max(0.15, Math.min(1, 11 / zoom));
      diffuseLayerRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
          const baseOpacity = (layer as any)._baseOpacity ?? layer.options.fillOpacity ?? 0.01;
          (layer as any)._baseOpacity = baseOpacity;
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
      clusterLayerRef.current = null;
      highlightLayerRef.current = null;
    };
  }, [mappedNeighborhoods, isDark]);

  // Swap tile layer when theme changes (after init)
  const tileInitRef = useRef(false);
  useEffect(() => {
    if (!tileInitRef.current) { tileInitRef.current = true; return; }
    const map = mapInstanceRef.current;
    const oldTile = tileLayerRef.current;
    if (!map || !oldTile) return;
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const newTile = L.tileLayer(tileUrl, { attribution: '&copy; <a href="https://carto.com/">CARTO</a>' });
    map.removeLayer(oldTile);
    newTile.addTo(map);
    newTile.setZIndex(0);
    tileLayerRef.current = newTile;
  }, [isDark]);

  // Update markers
  useEffect(() => {
    const diffuse = diffuseLayerRef.current;
    const deals = dealLayerRef.current;
    const cluster = clusterLayerRef.current;
    if (!diffuse || !deals || !cluster) return;

    diffuse.clearLayers();
    deals.clearLayers();
    cluster.clearLayers();

    if (viewMode === "all") {
      // Clustered view: show all filtered properties
      mappedProperties.forEach((p) => {
        const coords = getCoord(p);
        const color = getPropertyColor(p.pricePerM2Total ?? 0, minPrice, maxPrice);
        const isDeal = p.opportunityScore >= dealThreshold;
        const dealColor = isDark ? "rgba(220,235,245,0.85)" : "rgba(20,20,20,0.85)";
        const dealBorder = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)";

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width: ${isDeal ? 10 : 7}px;
            height: ${isDeal ? 10 : 7}px;
            background: ${isDeal ? dealColor : color};
            border: 1.5px solid ${isDeal ? (isDark ? "rgba(255,255,255,0.5)" : "white") : (isDark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)")};
            border-radius: 50%;
            ${isDeal ? `box-shadow: 0 0 6px ${isDark ? "rgba(220,235,245,0.3)" : "rgba(0,0,0,0.2)"};` : ""}
          "></div>`,
          iconSize: [isDeal ? 10 : 7, isDeal ? 10 : 7],
          iconAnchor: [isDeal ? 5 : 3.5, isDeal ? 5 : 3.5],
        });

        const marker = L.marker(coords, { icon });
        marker.bindPopup(
          `<div style="font-family:Satoshi,sans-serif;font-size:12px;min-width:200px;">
            ${isDeal ? `<div style="background:hsl(200,85%,42%);color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:6px;">
              ⭐ -${p.opportunityScore.toFixed(0)}% vs barrio
            </div><br/>` : ""}
            <strong>${p.neighborhood}</strong><br/>
            <span style="color:#666;">${p.location}</span><br/><br/>
            <strong>USD/m²:</strong> $${(p.pricePerM2Total ?? 0).toLocaleString()}<br/>
            <strong>Precio:</strong> $${p.price.toLocaleString()}<br/>
            ${p.surfaceTotal ? `<strong>Superficie:</strong> ${p.surfaceTotal} m²<br/>` : ""}
            ${p.rooms ? `<strong>Ambientes:</strong> ${p.rooms}<br/>` : ""}
            <a href="${p.url}" target="_blank" style="color:hsl(200,85%,42%);text-decoration:none;font-weight:600;">Ver publicación →</a>
          </div>`
        );
        cluster.addLayer(marker);
      });
    } else {
      // Opportunities view: diffuse heatmap + deal dots
      mappedProperties.forEach((p) => {
        const coords = getCoord(p);
        const color = getPropertyColor(p.pricePerM2Total ?? 0, minPrice, maxPrice);

        const radiusFactor = 0.55;
        const marker = L.circle(coords, {
          radius: CIRCLE_RADIUS_METERS * radiusFactor,
          color: "transparent",
          fillColor: color,
          fillOpacity: 0.05,
          weight: 0,
          interactive: false,
        });
        (marker as any)._baseOpacity = 0.05;
        marker.addTo(diffuse);
      });

      const dealDotColor = isDark ? "rgba(220,235,245,0.85)" : "rgba(20,20,20,0.85)";
      const dealDotBorder = isDark ? "rgba(255,255,255,0.3)" : "white";
      const dealIcon = L.divIcon({
        className: "",
        html: `<div style="width:7px;height:7px;background:${dealDotColor};border:1.5px solid ${dealDotBorder};border-radius:50%;box-shadow:0 1px 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.15)"};"></div>`,
        iconSize: [7, 7],
        iconAnchor: [3.5, 3.5],
      });

      dealProperties.forEach((p) => {
        const coords = getCoord(p);
        L.marker(coords, { icon: dealIcon })
          .bindPopup(
            `<div style="font-family:Satoshi,sans-serif;font-size:12px;min-width:200px;">
              <div style="background:hsl(200,85%,42%);color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:6px;">
                ⭐ -${p.opportunityScore.toFixed(0)}% vs barrio
              </div><br/>
              <strong>${p.neighborhood}</strong><br/>
              <span style="color:#666;">${p.location}</span><br/><br/>
              <strong>USD/m²:</strong> $${(p.pricePerM2Total ?? 0).toLocaleString()}<br/>
              <strong>Precio:</strong> $${p.price.toLocaleString()}<br/>
              ${p.surfaceTotal ? `<strong>Superficie:</strong> ${p.surfaceTotal} m²<br/>` : ""}
              ${p.rooms ? `<strong>Ambientes:</strong> ${p.rooms}<br/>` : ""}
              <a href="${p.url}" target="_blank" style="color:hsl(200,85%,42%);text-decoration:none;font-weight:600;">Ver publicación →</a>
            </div>`
          )
          .addTo(deals);
      });
    }
  }, [mappedProperties, dealProperties, getCoord, minPrice, maxPrice, viewMode, dealThreshold, isDark]);

  // Auto-refresh geocoded coords every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await fetchCachedCoordinates();
      setGeocodedCoords(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Province stats
  const provinceStats = useMemo(() => {
    const map = new Map<string, { prices: number[]; count: number }>();
    for (const p of properties) {
      const prov = p.city || "Sin ciudad";
      if (!map.has(prov)) map.set(prov, { prices: [], count: 0 });
      const entry = map.get(prov)!;
      entry.prices.push(p.pricePerM2Total ?? 0);
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

      {/* View mode toggle */}
      <div className="flex items-center rounded-full border border-border overflow-hidden">
        <button
          onClick={() => setViewMode("opportunities")}
          className={`flex items-center gap-1 px-3 py-1 text-[11px] font-medium transition-all ${
            viewMode === "opportunities" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="h-3 w-3" />
          Oportunidades
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`flex items-center gap-1 px-3 py-1 text-[11px] font-medium transition-all ${
            viewMode === "all" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="h-3 w-3" />
          Todas
        </button>
      </div>

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
          <div className="bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex flex-col gap-3 z-10">
            <div className="flex items-center gap-4 flex-wrap">
              <MapFilterRow title="Amb." keys={ROOMS_KEYS} state={roomsFilter} onChange={setRoomsFilter} />
              <div className="w-px h-5 bg-border" />
              <MapFilterRow title="Cocheras" keys={PARKING_KEYS} state={parkingFilter} onChange={setParkingFilter} />
            </div>
            {rangesInitialized && (
              <div className="grid grid-cols-3 gap-6 max-w-2xl">
                <RangeSliderFilter
                  title="Precio USD"
                  min={dataRanges.priceMin}
                  max={dataRanges.priceMax}
                  value={priceRange}
                  onChange={setPriceRange}
                  step={5000}
                  formatValue={formatPrice}
                />
                <RangeSliderFilter
                  title="Superficie m²"
                  min={dataRanges.surfaceMin}
                  max={dataRanges.surfaceMax}
                  value={surfaceRange}
                  onChange={setSurfaceRange}
                  step={5}
                  unit=" m²"
                />
                <RangeSliderFilter
                  title="Antigüedad"
                  min={dataRanges.ageMin}
                  max={dataRanges.ageMax}
                  value={ageRange}
                  onChange={setAgeRange}
                  step={1}
                  unit=" años"
                />
              </div>
            )}
          </div>
        )}

        <div ref={mapRef} className="h-full w-full flex-1" />

        {/* Legend + opportunity threshold - bottom left */}
        <div className="absolute bottom-4 left-4 glass-card rounded-2xl p-4 z-[1000] w-[260px] space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">USD/m² por propiedad</p>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] text-primary font-mono">${minMedian.toLocaleString()}</span>
              <div
                className="h-1.5 flex-1 rounded-full"
                style={{ background: "linear-gradient(to right, hsl(220,70%,40%), hsl(200,70%,50%), hsl(150,65%,55%), hsl(130,75%,45%))" }}
              />
              <span className="text-[11px] text-expensive font-mono">${maxMedian.toLocaleString()}</span>
            </div>
          </div>

          {/* Opportunity threshold control */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-foreground">Umbral oportunidad</span>
              <span className="text-[11px] font-mono text-primary font-semibold">{dealThreshold}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[dealThreshold]}
              onValueChange={(v) => setDealThreshold(v[0])}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {viewMode === "opportunities"
                ? `${dealProperties.length} oportunidades (≥${dealThreshold}% bajo mediana)`
                : `${mappedProperties.length} propiedades · ${dealProperties.length} oportunidades`}
            </p>
          </div>
        </div>

        {/* Right sidebar */}
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
                  {selectedDeals.length} propiedad{selectedDeals.length !== 1 ? "es" : ""}
                </p>
                <div className="overflow-y-auto flex-1 min-h-0 pr-1 custom-scroll space-y-2">
                  {selectedDeals.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">Sin propiedades en esta localidad.</p>
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
                          color: "hsl(200,85%,42%)",
                          fillColor: "hsl(200,85%,42%)",
                          fillOpacity: 0.25,
                          weight: 2,
                          interactive: false,
                        }).addTo(hl);
                        L.circleMarker(coords, {
                          radius: 6,
                          color: "white",
                          fillColor: "hsl(200,85%,55%)",
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
                      {p.opportunityScore > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingDown className="h-3 w-3 text-primary" />
                          <span className="text-[11px] font-medium text-primary">-{p.opportunityScore.toFixed(0)}% vs barrio</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">USD/m²</span>
                          <span className="block font-mono font-semibold text-foreground">${(p.pricePerM2Total ?? 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precio</span>
                          <span className="block font-mono font-semibold text-foreground">${p.price.toLocaleString()}</span>
                        </div>
                        {p.surfaceTotal && (
                          <div>
                            <span className="text-muted-foreground">Sup.</span>
                            <span className="block font-mono text-foreground">{p.surfaceTotal} m²</span>
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

          {/* Geocoding progress */}
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
