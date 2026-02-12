import { useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { loadProperties } from "@/lib/propertyData";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

// Approximate coordinates for known neighborhoods
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

// Deterministic pseudo-random from string
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function scatterCoord(base: [number, number], id: string, spread = 0.012): [number, number] {
  const h1 = hashStr(id + "lat");
  const h2 = hashStr(id + "lng");
  const offsetLat = ((h1 % 1000) / 1000 - 0.5) * spread;
  const offsetLng = ((h2 % 1000) / 1000 - 0.5) * spread;
  return [base[0] + offsetLat, base[1] + offsetLng];
}

function getColor(medianPricePerSqm: number, allMedians: number[]): string {
  const sorted = [...new Set(allMedians)].sort((a, b) => a - b);
  const rank = sorted.indexOf(medianPricePerSqm);
  const ratio = rank / (sorted.length - 1 || 1);

  if (ratio < 0.5) {
    const t = ratio / 0.5;
    const h = 200 - t * 40;
    return `hsl(${h}, 85%, ${50 + t * 10}%)`;
  } else {
    const t = (ratio - 0.5) / 0.5;
    const h = 160 - t * 20;
    return `hsl(${h}, 70%, ${55 + t * 15}%)`;
  }
}

const DIFFUSE_LAYERS = 20;
const BASE_RADIUS = 50;

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { properties, neighborhoodStats } = useMemo(() => loadProperties(), []);

  const mappedNeighborhoods = useMemo(() => {
    const stats = Array.from(neighborhoodStats.values());
    const allMedians = stats.map((s) => s.medianPricePerSqm);
    return stats
      .filter((s) => NEIGHBORHOOD_COORDS[s.name])
      .map((s) => ({
        ...s,
        coords: NEIGHBORHOOD_COORDS[s.name],
        color: getColor(s.medianPricePerSqm, allMedians),
      }));
  }, [neighborhoodStats]);

  const dealProperties = useMemo(
    () => properties.filter((p) => p.isNeighborhoodDeal && NEIGHBORHOOD_COORDS[p.neighborhood]),
    [properties]
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-34.45, -58.55],
      zoom: 12,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    const bounds: [number, number][] = mappedNeighborhoods.map((n) => n.coords);
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    // Diffuse neighborhood glow: 20 concentric layers per neighborhood
    const glowLayer = L.layerGroup().addTo(map);

    mappedNeighborhoods.forEach((n) => {
      const sizeScale = Math.max(0.7, Math.min(1.5, Math.sqrt(n.count) / 4));

      for (let i = 0; i < DIFFUSE_LAYERS; i++) {
        const t = i / (DIFFUSE_LAYERS - 1); // 0 (outermost) to 1 (innermost)
        const radius = BASE_RADIUS * sizeScale * (1 - t * 0.7); // shrinks inward
        const opacity = 0.008 + t * 0.025; // 0.008 outer → 0.033 inner

        L.circleMarker(n.coords, {
          radius,
          color: "transparent",
          fillColor: n.color,
          fillOpacity: opacity,
          weight: 0,
          interactive: i === DIFFUSE_LAYERS - 1, // only innermost is clickable
        })
          .bindPopup(
            i === DIFFUSE_LAYERS - 1
              ? `<div style="font-family: Inter, sans-serif; font-size: 13px; color: #111;">
                  <strong style="font-size: 15px;">${n.name}</strong><br/>
                  ${n.province}<br/><br/>
                  <strong>Mediana USD/m²:</strong> $${n.medianPricePerSqm.toLocaleString()}<br/>
                  <strong>Promedio USD/m²:</strong> $${Math.round(n.avgPricePerSqm).toLocaleString()}<br/>
                  <strong>Rango:</strong> $${n.minPricePerSqm.toLocaleString()} - $${n.maxPricePerSqm.toLocaleString()}<br/>
                  <strong>Propiedades:</strong> ${n.count}
                </div>`
              : ""
          )
          .addTo(glowLayer);
      }
    });

    // Deal markers only — white-ish pins with glow
    const dealIcon = L.divIcon({
      className: "",
      html: `<div style="
        width: 10px; height: 10px;
        background: rgba(255,255,255,0.9);
        border: 1.5px solid rgba(255,255,255,0.5);
        border-radius: 50%;
        box-shadow: 0 0 10px 3px rgba(255,255,255,0.3), 0 0 4px 1px rgba(190,230,255,0.4);
      "></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    dealProperties.forEach((p) => {
      const base = NEIGHBORHOOD_COORDS[p.neighborhood];
      if (!base) return;
      const coords = scatterCoord(base, p.id);

      L.marker(coords, { icon: dealIcon })
        .bindPopup(
          `<div style="font-family: Inter, sans-serif; font-size: 12px; color: #111; min-width: 200px;">
            <div style="background: hsl(190,90%,50%); color: #000; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 6px;">
              ⭐ OPORTUNIDAD -${p.opportunityScore.toFixed(0)}%
            </div><br/>
            <strong>${p.neighborhood}</strong><br/>
            <span style="color: #555;">${p.location}</span><br/><br/>
            <strong>USD/m²:</strong> $${p.pricePerSqm.toLocaleString()}<br/>
            <strong>Precio:</strong> $${p.price.toLocaleString()}<br/>
            ${p.totalArea ? `<strong>Superficie:</strong> ${p.totalArea} m²<br/>` : ""}
            ${p.rooms ? `<strong>Ambientes:</strong> ${p.rooms}<br/>` : ""}
            <a href="${p.url}" target="_blank" style="color: hsl(190,90%,50%); text-decoration: none; font-weight: 600;">Ver publicación →</a>
          </div>`
        )
        .addTo(map);
    });

    // Adjust opacity on zoom to prevent over-saturation
    map.on("zoomend", () => {
      const zoom = map.getZoom();
      const opacityScale = Math.max(0.3, Math.min(1, 12 / zoom));
      glowLayer.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          const baseOpacity = layer.options.fillOpacity ?? 0.02;
          layer.setStyle({ fillOpacity: baseOpacity * opacityScale });
        }
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mappedNeighborhoods, dealProperties]);

  const allMedians = mappedNeighborhoods.map((n) => n.medianPricePerSqm);
  const minMedian = allMedians.length ? Math.min(...allMedians) : 0;
  const maxMedian = allMedians.length ? Math.max(...allMedians) : 0;

  const topCheap = [...mappedNeighborhoods]
    .sort((a, b) => a.medianPricePerSqm - b.medianPricePerSqm)
    .slice(0, 5);

  return (
    <Layout>
      <div className="relative h-[calc(100vh-3.5rem)]">
        <div ref={mapRef} className="h-full w-full" />

        {/* Legend */}
        <div className="absolute bottom-6 left-6 glass-card rounded-lg p-4 z-[1000]">
          <p className="text-xs font-medium text-foreground mb-3">USD/m² por barrio</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-mono">${minMedian.toLocaleString()}</span>
            <div
              className="h-3 w-32 rounded-full"
              style={{
                background: "linear-gradient(to right, hsl(200,85%,50%), hsl(160,70%,55%), hsl(140,70%,70%))",
              }}
            />
            <span className="text-xs text-expensive font-mono">${maxMedian.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 0 6px 2px rgba(255,255,255,0.4)",
              }}
            />
            <span className="text-xs text-muted-foreground">
              Oportunidad (&gt;40% bajo mediana barrio)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {dealProperties.length} oportunidades · {properties.length} total
          </p>
        </div>

        {/* Quick stats */}
        <div className="absolute top-6 right-6 glass-card rounded-lg p-4 z-[1000] max-w-xs">
          <p className="text-xs font-medium text-foreground mb-2">Top barrios más baratos</p>
          {topCheap.map((n) => (
            <div key={n.name} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
              <span className="text-foreground">{n.name}</span>
              <span className="font-mono text-primary">${n.medianPricePerSqm.toLocaleString()}/m²</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MapView;
