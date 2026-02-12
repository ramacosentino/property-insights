import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { loadProperties } from "@/lib/propertyData";
import { fetchCachedCoordinates, geocodeBatch, CachedGeoData } from "@/lib/geocoding";
import { ArrowLeft, ExternalLink, TrendingDown } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const LAYERS_PER_PROPERTY = 5;

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const diffuseLayerRef = useRef<L.LayerGroup | null>(null);
  const dealLayerRef = useRef<L.LayerGroup | null>(null);

  const { properties, neighborhoodStats } = useMemo(() => loadProperties(), []);
  const [geocodedCoords, setGeocodedCoords] = useState<Map<string, CachedGeoData>>(new Map());
  const [seedingDone, setSeedingDone] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

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

  const mappedProperties = useMemo(
    () => selectedProvince ? allMappedProperties.filter((p) => p.province === selectedProvince) : allMappedProperties,
    [allMappedProperties, selectedProvince]
  );

  const dealProperties = useMemo(
    () => mappedProperties.filter((p) => p.isNeighborhoodDeal),
    [mappedProperties]
  );

  const selectedDeals = useMemo(
    () => selectedProvince
      ? allMappedProperties.filter((p) => p.province === selectedProvince && p.isNeighborhoodDeal)
          .sort((a, b) => b.opportunityScore - a.opportunityScore)
      : [],
    [allMappedProperties, selectedProvince]
  );

  // Zoom map to selected province bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
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

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { center: [-34.45, -58.55], zoom: 12 });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    const bounds: [number, number][] = mappedNeighborhoods.map((n) => n.coords);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] });

    diffuseLayerRef.current = L.layerGroup().addTo(map);
    dealLayerRef.current = L.layerGroup().addTo(map);

    map.on("zoomend", () => {
      const zoom = map.getZoom();
      const scale = Math.max(0.15, Math.min(1, 11 / zoom));
      diffuseLayerRef.current?.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          const base = layer.options.fillOpacity ?? 0.01;
          layer.setStyle({ fillOpacity: base * scale });
        }
      });
    });

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      diffuseLayerRef.current = null;
      dealLayerRef.current = null;
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

      for (let i = 0; i < LAYERS_PER_PROPERTY; i++) {
        const t = i / (LAYERS_PER_PROPERTY - 1);
        L.circleMarker(coords, {
          radius: 18 * (1 - t * 0.6),
          color: "transparent",
          fillColor: color,
          fillOpacity: 0.006 + t * 0.012,
          weight: 0,
          interactive: false,
        }).addTo(diffuse);
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

  return (
    <Layout>
      <div className="relative h-[calc(100vh-4rem)]">
        <div ref={mapRef} className="h-full w-full" />

        {/* Legend */}
        <div className="absolute bottom-6 left-6 glass-card rounded-2xl p-4 z-[1000]">
          <p className="text-xs font-medium text-foreground mb-3">USD/m² por propiedad</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-mono">${minMedian.toLocaleString()}</span>
            <div
              className="h-3 w-32 rounded-full"
              style={{ background: "linear-gradient(to right, hsl(210,80%,45%), hsl(160,65%,50%), hsl(140,65%,65%))" }}
            />
            <span className="text-xs text-expensive font-mono">${maxMedian.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(220,235,245,0.7)" }} />
            <span className="text-xs text-muted-foreground">Oportunidad (&gt;40% bajo mediana)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {dealProperties.length} oportunidades
          </p>
        </div>

        {/* Right sidebar: stats + geocoding */}
        <div className="absolute top-4 right-4 bottom-4 z-[1000] flex flex-col gap-3 w-[250px]">
          {/* Quick stats - Province median prices */}
          <div className="glass-card rounded-2xl p-4 flex-1 min-h-0 flex flex-col">
            <p className="text-xs font-medium text-foreground mb-3 shrink-0">Mediana USD/m² por localidad</p>
            <div className="overflow-y-auto flex-1 min-h-0 pr-1 custom-scroll">
              {provinceStats.map((p) => (
                <div key={p.name} className="flex justify-between text-xs py-1.5 border-b border-border/50 last:border-0 gap-3">
                  <span className="text-foreground truncate">{p.name} <span className="text-muted-foreground">({p.count})</span></span>
                  <span className="font-mono text-primary whitespace-nowrap">${p.medianPricePerSqm.toLocaleString()}/m²</span>
                </div>
              ))}
            </div>
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
