import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, MapPin, Search, X, Check, Pentagon, List } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// Macro-zone definitions with approximate center coords for the mini map
const MACRO_ZONES: Record<string, { label: string; localities?: string[] }> = {
  caba: {
    label: "CABA",
  },
  gba_norte: {
    label: "GBA Norte",
    localities: [
      "Vicente López", "San Isidro", "Martínez", "Beccar", "Acassuso", "Punta Chica",
      "San Fernando", "Victoria", "Virreyes",
      "Tigre", "General Pacheco", "Don Torcuato", "El Talar", "Rincón de Milberg", "Rincon de Milberg", "Nordelta", "Benavídez", "Bancalari", "Ricardo Rojas",
      "San Miguel", "Muñiz", "Bella Vista", "José C. Paz", "Grand Bourg", "Tortuguitas", "Los Polvorines", "Pablo Nogués", "Villa de Mayo", "San Nicolás de los Arroyos",
      "Pilar", "Presidente Derqui", "Del Viso", "Villa Rosa", "Fátima", "Manuel Alberti", "La Lonja", "Pilar Sur", "Manzanares",
      "Escobar", "Belén de Escobar", "Garín", "Ingeniero Maschwitz", "Loma Verde", "Matheu", "Maquinista Savio",
      "Campana", "Campana Partido", "Los Cardales", "Alto Los Cardales", "Capilla del Señor", "Parada Robles",
      "Zárate",
      "Villa Adelina", "Villa Ballester", "Villa Maipu", "Florida", "Florida Oeste", "José León Suárez",
      "Boulogne Sur Mer", "Villanueva", "El Cazador", "Barrio Parque El Cazador", "Zelaya", "Santa Catalina - Dique Lujan", "Dique Lujan", "Santo Tomas", "Ingeniero Adolfo Sourdeaux",
      "San Sebastian", "Santa María", "Barrio Parque El Remanso", "Primera Sección",
    ],
  },
  gba_oeste: {
    label: "GBA Oeste",
    localities: [
      "Morón", "Haedo", "Castelar", "Ituzaingó", "Merlo", "Moreno", "Paso del Rey",
      "Ramos Mejía", "San Justo", "La Tablada", "Villa Luzuriaga", "Hurlingham", "William Morris",
      "Caseros", "El Palomar", "Ciudad Jardín Lomas del Palomar",
    ],
  },
  gba_sur: {
    label: "GBA Sur",
    localities: [
      "Avellaneda", "Lanús", "Lomas de Zamora", "Banfield", "Temperley", "Adrogué",
      "Quilmes", "Bernal", "Don Bosco", "Berazategui", "Florencio Varela",
      "Ezeiza", "Canning", "Monte Grande",
    ],
  },
};

interface ZoneItem {
  name: string;
  count: number;
  type: "neighborhood" | "locality";
}

interface ZoneSelectorProps {
  selected: string[];
  onChange: (zones: string[]) => void;
}

function isPointInPolygon(lat: number, lng: number, polygon: L.LatLng[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function OnboardingZoneSelector({ selected, onChange }: ZoneSelectorProps) {
  const [zones, setZones] = useState<Record<string, ZoneItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");
  const drawMapRef = useRef<HTMLDivElement>(null);
  const drawMapInstance = useRef<L.Map | null>(null);
  const drawHandlerRef = useRef<any>(null);
  const drawnLayerRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const propertyMarkersRef = useRef<L.CircleMarker[]>([]);
  const [propertyCoords, setPropertyCoords] = useState<{ name: string; lat: number; lng: number }[]>([]);

  // Fetch zone data
  useEffect(() => {
    const fetchZones = async () => {
      // Fetch CABA neighborhoods
      const { data: cabaData } = await supabase
        .from("properties")
        .select("neighborhood")
        .eq("norm_province", "Autonomous City of Buenos Aires")
        .not("neighborhood", "is", null);

      const cabaCounts: Record<string, number> = {};
      cabaData?.forEach((p) => {
        const n = p.neighborhood!;
        cabaCounts[n] = (cabaCounts[n] || 0) + 1;
      });

      const cabaZones: ZoneItem[] = Object.entries(cabaCounts)
        .map(([name, count]) => ({ name, count, type: "neighborhood" as const }))
        .sort((a, b) => b.count - a.count);

      // Fetch GBA localities
      const { data: gbaData } = await supabase
        .from("properties")
        .select("norm_locality")
        .eq("norm_province", "Buenos Aires")
        .not("norm_locality", "is", null);

      const gbaCounts: Record<string, number> = {};
      gbaData?.forEach((p) => {
        const n = p.norm_locality!;
        gbaCounts[n] = (gbaCounts[n] || 0) + 1;
      });

      // Classify GBA into macro zones
      const gbaClassified: Record<string, ZoneItem[]> = {
        gba_norte: [],
        gba_oeste: [],
        gba_sur: [],
        gba_otros: [],
      };

      Object.entries(gbaCounts).forEach(([name, count]) => {
        const item: ZoneItem = { name, count, type: "locality" };
        let placed = false;
        for (const [key, macro] of Object.entries(MACRO_ZONES)) {
          if (key === "caba") continue;
          if (macro.localities?.includes(name)) {
            gbaClassified[key]?.push(item);
            placed = true;
            break;
          }
        }
        if (!placed) gbaClassified.gba_norte.push(item); // fallback
      });

      // Sort each group
      for (const key of Object.keys(gbaClassified)) {
        gbaClassified[key].sort((a, b) => b.count - a.count);
      }

      setZones({
        caba: cabaZones,
        gba_norte: gbaClassified.gba_norte,
        gba_oeste: gbaClassified.gba_oeste,
        gba_sur: gbaClassified.gba_sur,
      });
      setLoading(false);
    };

    fetchZones();
  }, []);

  // Fetch property coordinates for map mode
  useEffect(() => {
    const fetchCoords = async () => {
      const { data } = await supabase
        .from("geocoded_addresses")
        .select("address, lat, lng, norm_neighborhood, norm_locality")
        .not("lat", "is", null);
      
      if (!data) return;

      // Get properties to map addresses to neighborhoods
      const { data: props } = await supabase
        .from("properties")
        .select("address, neighborhood, norm_locality");

      const addrToZone = new Map<string, string>();
      props?.forEach((p) => {
        if (p.address) addrToZone.set(p.address, p.neighborhood || p.norm_locality || "");
      });

      const coords = data
        .filter((d) => d.lat && d.lng)
        .map((d) => ({
          name: addrToZone.get(d.address) || d.norm_locality || d.norm_neighborhood || "",
          lat: d.lat!,
          lng: d.lng!,
        }))
        .filter((c) => c.name);
      
      setPropertyCoords(coords);
    };

    if (mode === "map") fetchCoords();
  }, [mode]);

  // Initialize draw map
  useEffect(() => {
    if (mode !== "map" || !drawMapRef.current || drawMapInstance.current) return;

    const map = L.map(drawMapRef.current, {
      center: [-34.55, -58.45],
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 16,
    }).addTo(map);

    drawnLayerRef.current = new L.FeatureGroup();
    drawnLayerRef.current.addTo(map);

    // Add property dots
    propertyCoords.forEach((c) => {
      const marker = L.circleMarker([c.lat, c.lng], {
        radius: 3,
        fillColor: "hsl(200, 85%, 42%)",
        fillOpacity: 0.3,
        color: "transparent",
        weight: 0,
      }).addTo(map);
      propertyMarkersRef.current.push(marker);
    });

    // Draw event
    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnLayerRef.current.clearLayers();
      const layer = e.layer as L.Polygon;
      drawnLayerRef.current.addLayer(layer);
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];

      // Find zones inside polygon
      const zonesInside = new Set<string>();
      propertyCoords.forEach((c) => {
        if (isPointInPolygon(c.lat, c.lng, latlngs)) {
          zonesInside.add(c.name);
        }
      });

      // Merge with existing selection
      const newSelection = [...new Set([...selected, ...zonesInside])];
      onChange(newSelection);
    });

    drawMapInstance.current = map;

    return () => {
      propertyMarkersRef.current = [];
      map.remove();
      drawMapInstance.current = null;
    };
  }, [mode, propertyCoords]);

  // Start drawing handler
  const handleStartDraw = useCallback(() => {
    const map = drawMapInstance.current;
    if (!map) return;
    if (drawHandlerRef.current) {
      try { drawHandlerRef.current.disable(); } catch {}
    }
    const handler = new (L.Draw as any).Polygon(map, {
      shapeOptions: {
        color: "hsl(200, 85%, 42%)",
        fillColor: "hsl(200, 85%, 42%)",
        fillOpacity: 0.1,
        weight: 2,
      },
    });
    handler.enable();
    drawHandlerRef.current = handler;
  }, []);
function isPointInPolygon(lat: number, lng: number, polygon: L.LatLng[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}


  const toggle = (zone: string) => {
    onChange(
      selected.includes(zone)
        ? selected.filter((z) => z !== zone)
        : [...selected, zone]
    );
  };

  const toggleMacro = (macroKey: string) => {
    const items = zones[macroKey] || [];
    const names = items.map((i) => i.name);
    const allSelected = names.every((n) => selected.includes(n));

    if (allSelected) {
      onChange(selected.filter((s) => !names.includes(s)));
    } else {
      const toAdd = names.filter((n) => !selected.includes(n));
      onChange([...selected, ...toAdd]);
    }
  };

  const filteredZones = useMemo(() => {
    if (!query) return zones;
    const q = query.toLowerCase();
    const result: Record<string, ZoneItem[]> = {};
    for (const [key, items] of Object.entries(zones)) {
      const filtered = items.filter((i) => i.name.toLowerCase().includes(q));
      if (filtered.length > 0) result[key] = filtered;
    }
    return result;
  }, [zones, query]);

  const macroKeys = ["caba", "gba_norte", "gba_oeste", "gba_sur"];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Zonas de interés</h1>
        <p className="text-sm text-muted-foreground">Seleccioná las zonas donde buscás propiedades</p>
      </div>


      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
          {selected.map((z) => (
            <Badge key={z} variant="secondary" className="gap-1 pr-1 text-xs">
              {z}
              <button onClick={() => toggle(z)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar barrio o localidad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Hierarchical selector */}
      <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Cargando zonas...</div>
        ) : (
          macroKeys.map((key) => {
            const items = filteredZones[key] || [];
            if (items.length === 0) return null;
            const macro = MACRO_ZONES[key];
            const isExpanded = expandedMacro === key || !!query;
            const allSelected = items.length > 0 && items.every((i) => selected.includes(i.name));
            const someSelected = items.some((i) => selected.includes(i.name));
            const selectedCount = items.filter((i) => selected.includes(i.name)).length;

            return (
              <div key={key}>
                {/* Macro header */}
                <div className="flex items-center border-b border-border bg-muted/50 sticky top-0 z-10">
                  <button
                    onClick={() => setExpandedMacro(isExpanded && !query ? null : key)}
                    className="flex items-center gap-2 flex-1 px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>{macro.label}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      ({items.length})
                    </span>
                    {selectedCount > 0 && (
                      <span className="ml-auto text-xs text-primary font-medium">
                        {selectedCount} sel.
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleMacro(key)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      allSelected
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {allSelected ? "Quitar todos" : "Todos"}
                  </button>
                </div>

                {/* Items */}
                {isExpanded && (
                  <div className="grid grid-cols-2">
                    {items.map((item) => {
                      const isSelected = selected.includes(item.name);
                      return (
                        <button
                          key={item.name}
                          onClick={() => toggle(item.name)}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs text-left border-b border-r border-border/50 transition-colors ${
                            isSelected
                              ? "bg-primary/5 text-primary font-medium"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            <span className="text-[10px] text-muted-foreground">{item.count}</span>
                            {isSelected && <Check className="h-3 w-3 text-primary" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
