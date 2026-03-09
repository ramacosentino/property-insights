import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, X, Check, Pentagon, List, ChevronDown } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

const MACRO_ZONES: Record<string, { label: string; localities?: string[] }> = {
  caba: { label: "CABA" },
  gba_norte: {
    label: "GBA Norte",
    localities: [
      "Vicente López", "Olivos", "Munro", "Florida", "Florida Oeste", "La Lucila",
      "San Isidro", "Martínez", "Béccar", "Beccar", "Acassuso", "Punta Chica",
      "San Fernando", "Victoria", "Virreyes",
      "Tigre", "General Pacheco", "Don Torcuato", "El Talar", "Rincón de Milberg", "Rincon de Milberg", "Nordelta", "Benavídez", "Benavidez", "Bancalari", "Ricardo Rojas", "Dique Luján", "Dique Lujan",
      "San Miguel", "Muñiz", "Bella Vista", "José C. Paz", "Grand Bourg", "Tortuguitas", "Los Polvorines", "Pablo Nogués", "Villa de Mayo",
      "Pilar", "Presidente Derqui", "Del Viso", "Villa Rosa", "Fátima", "Manuel Alberti", "La Lonja", "Pilar Sur", "Manzanares",
      "Escobar", "Belén de Escobar", "Garín", "Ingeniero Maschwitz", "Loma Verde", "Matheu", "Maquinista Savio",
      "Campana", "Los Cardales", "Alto Los Cardales", "Capilla del Señor", "Parada Robles", "Exaltación de la Cruz",
      "Zárate", "Zelaya",
      "Villa Adelina", "Villa Ballester", "Villa Maipú", "Villa Maipu",
      "Boulogne", "Boulogne Sur Mer", "Villanueva", "El Cazador", "Santo Tomás", "Santo Tomas", "Ingeniero Adolfo Sourdeaux",
      "San Sebastián", "San Sebastian", "Santa María", "Santa Maria",
      "José León Suárez",
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
  const [expandedMacros, setExpandedMacros] = useState<Set<string>>(new Set(["caba"]));
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");
  const drawMapRef = useRef<HTMLDivElement>(null);
  const drawMapInstance = useRef<L.Map | null>(null);
  const drawHandlerRef = useRef<any>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);
  const [propertyCoords, setPropertyCoords] = useState<{ name: string; lat: number; lng: number }[]>([]);

  // Fetch zone data
  useEffect(() => {
    const fetchZones = async () => {
      // Fetch ALL neighborhoods/localities using pagination to avoid 1000-row limit
      const fetchAll = async (query: any) => {
        const allRows: any[] = [];
        const PAGE = 1000;
        let from = 0;
        let done = false;
        while (!done) {
          const { data } = await query.range(from, from + PAGE - 1);
          if (!data || data.length === 0) { done = true; break; }
          allRows.push(...data);
          if (data.length < PAGE) done = true;
          from += PAGE;
        }
        return allRows;
      };

      const cabaData = await fetchAll(
        supabase
          .from("properties")
          .select("neighborhood")
          .or("norm_province.eq.Ciudad Autónoma de Buenos Aires,norm_province.eq.Autonomous City of Buenos Aires")
          .eq("status", "active")
          .not("neighborhood", "is", null)
      );

      const cabaCounts: Record<string, number> = {};
      cabaData.forEach((p: any) => {
        const n = p.neighborhood!;
        cabaCounts[n] = (cabaCounts[n] || 0) + 1;
      });

      const cabaZones: ZoneItem[] = Object.entries(cabaCounts)
        .map(([name, count]) => ({ name, count, type: "neighborhood" as const }))
        .sort((a, b) => b.count - a.count);

      const gbaData = await fetchAll(
        supabase
          .from("properties")
          .select("norm_locality")
          .or("norm_province.eq.Provincia de Buenos Aires,norm_province.eq.Buenos Aires")
          .eq("status", "active")
          .not("norm_locality", "is", null)
      );

      const gbaCounts: Record<string, number> = {};
      gbaData.forEach((p: any) => {
        const n = p.norm_locality!;
        gbaCounts[n] = (gbaCounts[n] || 0) + 1;
      });

      const gbaClassified: Record<string, ZoneItem[]> = {
        gba_norte: [], gba_oeste: [], gba_sur: [],
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
        if (!placed) gbaClassified.gba_norte.push(item);
      });

      for (const key of Object.keys(gbaClassified)) {
        gbaClassified[key].sort((a, b) => b.count - a.count);
      }

      setZones({ caba: cabaZones, ...gbaClassified });
      setLoading(false);
    };
    fetchZones();
  }, []);

  // Fetch property coords for map mode
  useEffect(() => {
    if (mode !== "map") return;
    const fetchCoords = async () => {
      const { data: geoData } = await supabase
        .from("geocoded_addresses")
        .select("address, lat, lng")
        .not("lat", "is", null);
      const { data: props } = await supabase
        .from("properties")
        .select("address, neighborhood, norm_locality");

      if (!geoData || !props) return;
      const addrToZone = new Map<string, string>();
      props.forEach((p) => {
        if (p.address) addrToZone.set(p.address, p.neighborhood || p.norm_locality || "");
      });
      setPropertyCoords(
        geoData
          .filter((d) => d.lat && d.lng && addrToZone.get(d.address))
          .map((d) => ({ name: addrToZone.get(d.address)!, lat: d.lat!, lng: d.lng! }))
      );
    };
    fetchCoords();
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

    const featureGroup = new L.FeatureGroup();
    featureGroup.addTo(map);
    drawnLayerRef.current = featureGroup;

    propertyCoords.forEach((c) => {
      L.circleMarker([c.lat, c.lng], {
        radius: 3,
        fillColor: "hsl(200, 85%, 42%)",
        fillOpacity: 0.3,
        color: "transparent",
        weight: 0,
      }).addTo(map);
    });

    map.on(L.Draw.Event.CREATED, (e: any) => {
      featureGroup.clearLayers();
      const layer = e.layer as L.Polygon;
      featureGroup.addLayer(layer);
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const zonesInside = new Set<string>();
      propertyCoords.forEach((c) => {
        if (isPointInPolygon(c.lat, c.lng, latlngs)) zonesInside.add(c.name);
      });
      onChange([...new Set([...selected, ...zonesInside])]);
    });

    drawMapInstance.current = map;
    return () => { map.remove(); drawMapInstance.current = null; };
  }, [mode, propertyCoords]);

  const handleStartDraw = useCallback(() => {
    const map = drawMapInstance.current;
    if (!map) return;
    if (drawHandlerRef.current) try { drawHandlerRef.current.disable(); } catch {}
    const handler = new (L.Draw as any).Polygon(map, {
      shapeOptions: { color: "hsl(200, 85%, 42%)", fillColor: "hsl(200, 85%, 42%)", fillOpacity: 0.1, weight: 2 },
    });
    handler.enable();
    drawHandlerRef.current = handler;
  }, []);

  const toggle = (zone: string) => {
    onChange(selected.includes(zone) ? selected.filter((z) => z !== zone) : [...selected, zone]);
  };

  const toggleMacro = (macroKey: string) => {
    const items = zones[macroKey] || [];
    const names = items.map((i) => i.name);
    const allSelected = names.every((n) => selected.includes(n));
    if (allSelected) onChange(selected.filter((s) => !names.includes(s)));
    else onChange([...selected, ...names.filter((n) => !selected.includes(n))]);
  };

  const toggleExpand = (key: string) => {
    setExpandedMacros((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isSearching = query.length > 0;

  const filteredZones = useMemo(() => {
    if (!query) return zones;
    const q = query.toLowerCase();
    const result: Record<string, ZoneItem[]> = {};
    for (const [key, items] of Object.entries(zones)) {
      // Also match macro zone label
      const macroMatch = MACRO_ZONES[key]?.label.toLowerCase().includes(q);
      const filtered = macroMatch ? items : items.filter((i) => i.name.toLowerCase().includes(q));
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

      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-1 rounded-full border border-border overflow-hidden w-fit mx-auto">
        <button
          onClick={() => setMode("list")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
            mode === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </button>
        <button
          onClick={() => setMode("map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
            mode === "map" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pentagon className="h-3.5 w-3.5" />
          Dibujar en mapa
        </button>
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{selected.length} zona{selected.length !== 1 ? "s" : ""} seleccionada{selected.length !== 1 ? "s" : ""}</span>
            <button onClick={() => onChange([])} className="text-[11px] text-destructive hover:underline">Limpiar</button>
          </div>
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
        </div>
      )}

      {mode === "list" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar barrio o localidad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Cargando zonas...</div>
            ) : (
              macroKeys.map((key) => {
                const items = filteredZones[key] || [];
                if (items.length === 0) return null;
                const macro = MACRO_ZONES[key];
                const isExpanded = expandedMacros.has(key) || isSearching;
                const allSelected = items.length > 0 && items.every((i) => selected.includes(i.name));
                const selectedCount = items.filter((i) => selected.includes(i.name)).length;

                return (
                  <div key={key} className="rounded-lg border border-border overflow-hidden">
                    {/* Macro header */}
                    <div className="flex items-center bg-muted/40">
                      <button
                        onClick={() => toggleExpand(key)}
                        className="flex items-center gap-2 flex-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${!isExpanded ? "-rotate-90" : ""}`} />
                        <span className="text-sm font-semibold text-foreground">{macro.label}</span>
                        <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                            {selectedCount}
                          </Badge>
                        )}
                      </button>
                      <button
                        onClick={() => toggleMacro(key)}
                        className={`px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${allSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {allSelected ? "Quitar" : "Seleccionar todos"}
                      </button>
                    </div>

                    {/* Zone items */}
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-px bg-border/30">
                        {items.map((item) => {
                          const isItemSelected = selected.includes(item.name);
                          return (
                            <button
                              key={item.name}
                              onClick={() => toggle(item.name)}
                              className={`flex items-center gap-2 px-3 py-2 text-left transition-all ${
                                isItemSelected
                                  ? "bg-primary/8 text-foreground"
                                  : "bg-card hover:bg-muted/30 text-foreground"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                isItemSelected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/30 bg-background"
                              }`}>
                                {isItemSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <span className="text-xs truncate flex-1">{item.name}</span>
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {!loading && Object.keys(filteredZones).length === 0 && query && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No se encontraron zonas para "{query}"
              </div>
            )}
          </div>
        </>
      )}

      {mode === "map" && (
        <div className="space-y-3">
          <div ref={drawMapRef} className="w-full h-64 rounded-xl border border-border overflow-hidden" style={{ zIndex: 0 }} />
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleStartDraw}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Pentagon className="h-3.5 w-3.5" />
              Dibujar zona
            </button>
            <button
              onClick={() => drawnLayerRef.current?.clearLayers()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar dibujo
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Dibujá un polígono en el mapa haciendo click en los vértices. Los barrios dentro de la zona se seleccionan automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
