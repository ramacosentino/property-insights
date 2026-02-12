import { useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { loadProperties, NeighborhoodStats } from "@/lib/propertyData";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Approximate coordinates for known neighborhoods in GBA Norte / CABA
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
  "Benavídez": [-34.42, -58.68],
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
  "Acasusso": [-34.48, -58.51],
};

const DEFAULT_CENTER: [number, number] = [-34.45, -58.55];

function getColor(medianPricePerSqm: number, allMedians: number[]): string {
  const sorted = [...allMedians].sort((a, b) => a - b);
  const rank = sorted.indexOf(medianPricePerSqm);
  const ratio = rank / (sorted.length - 1 || 1);

  // Blue (cheap) -> Yellow (mid) -> Green (expensive)
  if (ratio < 0.5) {
    // Blue range
    const t = ratio / 0.5;
    const h = 200 - t * 40; // 200 to 160
    return `hsl(${h}, 85%, ${50 + t * 10}%)`;
  } else {
    // Green range
    const t = (ratio - 0.5) / 0.5;
    const h = 160 - t * 20; // 160 to 140
    return `hsl(${h}, 70%, ${55 + t * 15}%)`;
  }
}

function MapBounds({ neighborhoods }: { neighborhoods: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (neighborhoods.length > 0) {
      const bounds = neighborhoods.reduce(
        (acc, coord) => {
          return [
            [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
            [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
          ] as [[number, number], [number, number]];
        },
        [
          [90, 180],
          [-90, -180],
        ] as [[number, number], [number, number]]
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [neighborhoods, map]);
  return null;
}

const MapView = () => {
  const { neighborhoodStats } = useMemo(() => loadProperties(), []);

  const mappedNeighborhoods = useMemo(() => {
    const stats = Array.from(neighborhoodStats.values());
    const allMedians = stats.map((s) => s.medianPricePerSqm);
    const uniqueMedians = [...new Set(allMedians)].sort((a, b) => a - b);

    return stats
      .filter((s) => NEIGHBORHOOD_COORDS[s.name])
      .map((s) => ({
        ...s,
        coords: NEIGHBORHOOD_COORDS[s.name],
        color: getColor(s.medianPricePerSqm, uniqueMedians),
        radius: Math.max(8, Math.min(25, Math.sqrt(s.count) * 5)),
      }));
  }, [neighborhoodStats]);

  const coords = mappedNeighborhoods.map((n) => n.coords);

  // Legend data
  const allMedians = mappedNeighborhoods.map((n) => n.medianPricePerSqm);
  const minMedian = Math.min(...allMedians);
  const maxMedian = Math.max(...allMedians);

  return (
    <Layout>
      <div className="relative h-[calc(100vh-3.5rem)]">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          className="h-full w-full"
          style={{ background: "hsl(220, 25%, 6%)" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapBounds neighborhoods={coords} />
          {mappedNeighborhoods.map((n) => (
            <CircleMarker
              key={n.name}
              center={n.coords}
              radius={n.radius}
              pathOptions={{
                color: n.color,
                fillColor: n.color,
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1 font-sans" style={{ color: "#111" }}>
                  <p className="font-bold text-base">{n.name}</p>
                  <p>{n.province}</p>
                  <p>
                    <strong>Mediana USD/m²:</strong> ${n.medianPricePerSqm.toLocaleString()}
                  </p>
                  <p>
                    <strong>Promedio USD/m²:</strong> ${Math.round(n.avgPricePerSqm).toLocaleString()}
                  </p>
                  <p>
                    <strong>Rango:</strong> ${n.minPricePerSqm.toLocaleString()} - $
                    {n.maxPricePerSqm.toLocaleString()}
                  </p>
                  <p>
                    <strong>Propiedades:</strong> {n.count}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 glass-card rounded-lg p-4 z-[1000]">
          <p className="text-xs font-medium text-foreground mb-3">USD/m² por barrio</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-mono">
              ${minMedian.toLocaleString()}
            </span>
            <div
              className="h-3 w-32 rounded-full"
              style={{
                background: "linear-gradient(to right, hsl(200,85%,50%), hsl(160,70%,55%), hsl(140,70%,70%))",
              }}
            />
            <span className="text-xs text-expensive font-mono">
              ${maxMedian.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tamaño = cantidad de propiedades
          </p>
        </div>

        {/* Quick stats */}
        <div className="absolute top-6 right-6 glass-card rounded-lg p-4 z-[1000] max-w-xs">
          <p className="text-xs font-medium text-foreground mb-2">Top barrios más baratos</p>
          {mappedNeighborhoods
            .sort((a, b) => a.medianPricePerSqm - b.medianPricePerSqm)
            .slice(0, 5)
            .map((n) => (
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
