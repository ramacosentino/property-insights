import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, MapPin, Search, X, Check } from "lucide-react";

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
    center: [-34.76, -58.4],
    zoom: 11,
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

export default function OnboardingZoneSelector({ selected, onChange }: ZoneSelectorProps) {
  const [zones, setZones] = useState<Record<string, ZoneItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

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

  // Initialize mini map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-34.6037, -58.45],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 16,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update map markers when selection changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (selected.length === 0) {
      mapInstance.current.setView([-34.6037, -58.45], 10);
      return;
    }

    // Add markers for selected zones using approximate coords
    const getApproxCoords = async () => {
      const { data } = await supabase
        .from("geocoded_addresses")
        .select("norm_neighborhood, norm_locality, lat, lng")
        .not("lat", "is", null);

      if (!data || !mapInstance.current) return;

      const zoneCoords: Record<string, { lat: number; lng: number; count: number }> = {};

      data.forEach((addr) => {
        const key = addr.norm_neighborhood || addr.norm_locality;
        if (!key || !selected.some((s) => s === key || addr.norm_locality === s || addr.norm_neighborhood === s)) return;
        // Try matching by neighborhood name for CABA
        const matchKey = selected.find((s) => s === key || s === addr.norm_locality);
        if (!matchKey) return;

        if (!zoneCoords[matchKey]) {
          zoneCoords[matchKey] = { lat: addr.lat!, lng: addr.lng!, count: 1 };
        } else {
          zoneCoords[matchKey].lat += addr.lat!;
          zoneCoords[matchKey].lng += addr.lng!;
          zoneCoords[matchKey].count++;
        }
      });

      const bounds = L.latLngBounds([]);

      Object.entries(zoneCoords).forEach(([name, { lat, lng, count }]) => {
        const avgLat = lat / count;
        const avgLng = lng / count;
        const point = L.latLng(avgLat, avgLng);
        bounds.extend(point);

        const marker = L.circleMarker(point, {
          radius: 8,
          fillColor: "hsl(200, 85%, 42%)",
          fillOpacity: 0.7,
          color: "hsl(200, 85%, 32%)",
          weight: 2,
        })
          .bindTooltip(name, { direction: "top", offset: [0, -10] })
          .addTo(mapInstance.current!);

        markersRef.current.push(marker);
      });

      if (bounds.isValid()) {
        mapInstance.current!.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    };

    getApproxCoords();
  }, [selected]);

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

      {/* Mini map */}
      <div
        ref={mapRef}
        className="w-full h-36 rounded-xl border border-border overflow-hidden"
        style={{ zIndex: 0 }}
      />

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
            if (query && items.length === 0) return null;
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
