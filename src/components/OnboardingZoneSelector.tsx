import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, X, Check, Pentagon, List, ChevronDown } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// Canonical CABA barrios (48 official)
const CABA_CANONICAL_BARRIOS = new Set([
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo",
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución",
  "Flores", "Floresta", "La Boca", "La Paternal", "Liniers",
  "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya", "Núñez",
  "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas",
  "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro", "Saavedra",
  "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield",
  "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto",
  "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar",
  "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita",
  "Villa Soldati", "Villa Urquiza",
]);

// Sub-barrios that nest under a parent barrio
const CABA_SUB_BARRIOS: Record<string, string[]> = {
  "Palermo": ["Palermo Hollywood", "Palermo Chico", "Palermo Soho", "Palermo Viejo"],
  "Belgrano": ["Belgrano Residencial", "Barrio Chino"],
  "Balvanera": ["Once", "Abasto"],
  "San Nicolás": ["Centro", "Microcentro", "Tribunales"],
  "Recoleta": ["Barrio Norte"],
};

// All recognized names (official + sub-barrios)
const CABA_ALL_RECOGNIZED = new Set([
  ...CABA_CANONICAL_BARRIOS,
  ...Object.values(CABA_SUB_BARRIOS).flat(),
]);

// Map Google's non-standard names to canonical barrios (only ones NOT in sub-barrios)
const CABA_BARRIO_ALIASES: Record<string, string> = {
  "Barrio Catalinas Sur": "La Boca",
  "Barrio Olímpico": "Villa Soldati",
  "Barrio Piedrabuena": "Villa Lugano",
  "Barrio General Savio": "Villa Lugano",
  "Barrio Cildáñez - Villa 6": "Villa Lugano",
  "Barrio Lafuente": "Flores",
  "Barrio Espora": "Mataderos",
  "Barrio Hogar Obrero": "Caballito",
  "Barrio 20": "Villa Lugano",
  "Barrio Castex": "Retiro",
  "Complejo de Edificios Donizetti y Rivadavia": "Caballito",
  "Palermo Soho": "Palermo Soho",
  "Palermo Viejo": "Palermo Viejo",
  "Recoleta chica": "Recoleta",
  "Barrio Parque": "Recoleta",
  "Congreso": "Monserrat",
};
// Map Google's non-standard locality names to canonical ones
const GBA_LOCALITY_ALIASES: Record<string, string> = {
  "Beccar": "Béccar",
  "Benavidez": "Benavídez",
  "Rincon de Milberg": "Rincón de Milberg",
  "Dique Lujan": "Dique Luján",
  "Dique Luján (Territorialmente Escobar Islas)": "Dique Luján",
  "Villa Maipu": "Villa Maipú",
  "Santo Tomas": "Santo Tomás",
  "San Sebastian": "San Sebastián",
  "Santa Maria": "Santa María",
  "Boulogne Sur Mer": "Boulogne",
  "ingeniero maschiwitz": "Ingeniero Maschwitz",
  "Ingeniero Pablo Nogués": "Pablo Nogués",
  "Luis Lagomarsino o Maquinista F. Savio (Oeste)": "Maquinista Savio",
  "Ciudad Jardín Lomas del Palomar": "El Palomar",
  "Ciudad Jardín El Libertador": "El Palomar",
  "Fatima": "Fátima",
  "Garin": "Garín",
  "Lomas de San Isidro": "San Isidro",
  "General San Martín": "San Martín",
  "Carapachay": "Vicente López",
  "Garcia del Río": "Vicente López",
  "Barrio Parque Las Acacias": "Pilar",
  "Barrio Parque Presidente Figueroa Alcorta": "Pilar",
  "Gran Buenos Aires": "Buenos Aires",
  "Pilar Centro": "Pilar",
};

const MACRO_ZONES: Record<string, { label: string; localities?: string[] }> = {
  caba: { label: "CABA" },
  gba_norte: {
    label: "GBA Norte",
    localities: [
      "Vicente López", "Olivos", "Munro", "Florida", "Florida Oeste", "La Lucila",
      "San Isidro", "Martínez", "Béccar", "Acassuso", "Punta Chica",
      "San Fernando", "Victoria", "Virreyes",
      "Tigre", "General Pacheco", "Don Torcuato", "El Talar", "Rincón de Milberg", "Nordelta", "Benavídez", "Bancalari", "Ricardo Rojas", "Dique Luján",
      "San Miguel", "Muñiz", "Bella Vista", "José C. Paz", "Grand Bourg", "Tortuguitas", "Los Polvorines", "Pablo Nogués", "Villa de Mayo",
      "Pilar", "Presidente Derqui", "Del Viso", "Villa Rosa", "Fátima", "Manuel Alberti", "La Lonja", "Pilar Sur", "Manzanares",
      "Escobar", "Belén de Escobar", "Garín", "Ingeniero Maschwitz", "Loma Verde", "Matheu", "Maquinista Savio",
      "Campana", "Los Cardales", "Alto Los Cardales", "Capilla del Señor", "Parada Robles", "Exaltación de la Cruz",
      "Zárate", "Zelaya",
      "Villa Adelina", "Villa Ballester", "Villa Maipú", "San Martín",
      "Boulogne", "Villanueva", "El Cazador", "Santo Tomás", "Ingeniero Adolfo Sourdeaux",
      "San Sebastián", "Santa María",
      "José León Suárez",
    ],
  },
  gba_oeste: {
    label: "GBA Oeste",
    localities: [
      "Morón", "Haedo", "Castelar", "Ituzaingó", "Merlo", "Moreno", "Paso del Rey",
      "Ramos Mejía", "San Justo", "La Tablada", "Villa Luzuriaga", "Hurlingham", "William Morris",
      "Caseros", "El Palomar",
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

// Build set of all valid GBA localities from MACRO_ZONES
const VALID_GBA_LOCALITIES = new Set<string>();
for (const macro of Object.values(MACRO_ZONES)) {
  if (macro.localities) macro.localities.forEach((l) => VALID_GBA_LOCALITIES.add(l));
}

interface ZoneItem {
  name: string;
  count: number;
  type: "neighborhood" | "locality";
  children?: ZoneItem[];
}

// Reverse map: sub-barrio name → parent barrio
const SUB_TO_PARENT: Record<string, string> = {};
for (const [parent, subs] of Object.entries(CABA_SUB_BARRIOS)) {
  for (const sub of subs) SUB_TO_PARENT[sub] = parent;
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
          .select("norm_neighborhood")
          .or("norm_province.eq.Ciudad Autónoma de Buenos Aires,norm_province.eq.Autonomous City of Buenos Aires")
          .eq("status", "active")
          .not("norm_neighborhood", "is", null)
      );

      const cabaCounts: Record<string, number> = {};
      cabaData.forEach((p: any) => {
        let n = p.norm_neighborhood as string;
        // Map aliases to canonical/sub-barrio names
        if (CABA_BARRIO_ALIASES[n]) n = CABA_BARRIO_ALIASES[n];
        // Only include if it's a recognized name (official or sub-barrio)
        if (!CABA_ALL_RECOGNIZED.has(n)) return;
        cabaCounts[n] = (cabaCounts[n] || 0) + 1;
      });

      // Build nested structure: parent barrios with children
      const parentItems: Map<string, ZoneItem> = new Map();
      
      // First, create all parent barrios
      for (const name of CABA_CANONICAL_BARRIOS) {
        if (cabaCounts[name] || CABA_SUB_BARRIOS[name]) {
          const children: ZoneItem[] = [];
          if (CABA_SUB_BARRIOS[name]) {
            for (const sub of CABA_SUB_BARRIOS[name]) {
              if (cabaCounts[sub]) {
                children.push({ name: sub, count: cabaCounts[sub], type: "neighborhood" });
              }
            }
            children.sort((a, b) => b.count - a.count);
          }
          const parentCount = cabaCounts[name] || 0;
          if (parentCount > 0 || children.length > 0) {
            parentItems.set(name, {
              name,
              count: parentCount,
              type: "neighborhood",
              children: children.length > 0 ? children : undefined,
            });
          }
        }
      }

      const cabaZones: ZoneItem[] = [...parentItems.values()]
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
        let n = p.norm_locality as string;
        // Map aliases to canonical names
        if (GBA_LOCALITY_ALIASES[n]) n = GBA_LOCALITY_ALIASES[n];
        // Only include if it's a recognized locality
        if (!VALID_GBA_LOCALITIES.has(n)) return;
        gbaCounts[n] = (gbaCounts[n] || 0) + 1;
      });

      const gbaClassified: Record<string, ZoneItem[]> = {
        gba_norte: [], gba_oeste: [], gba_sur: [],
      };

      Object.entries(gbaCounts).forEach(([name, count]) => {
        const item: ZoneItem = { name, count, type: "locality" };
        for (const [key, macro] of Object.entries(MACRO_ZONES)) {
          if (key === "caba") continue;
          if (macro.localities?.includes(name)) {
            gbaClassified[key]?.push(item);
            break;
          }
        }
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
    // Find if this zone is a parent with children
    let allItems: ZoneItem[] = [];
    for (const items of Object.values(zones)) {
      allItems = allItems.concat(items);
    }
    const parentItem = allItems.find((i) => i.name === zone && i.children && i.children.length > 0);
    
    if (parentItem && parentItem.children) {
      // Toggle parent + all children together
      const familyNames = [zone, ...parentItem.children.map((c) => c.name)];
      const allSelected = familyNames.every((n) => selected.includes(n));
      if (allSelected) {
        onChange(selected.filter((s) => !familyNames.includes(s)));
      } else {
        onChange([...selected, ...familyNames.filter((n) => !selected.includes(n))]);
      }
    } else {
      onChange(selected.includes(zone) ? selected.filter((z) => z !== zone) : [...selected, zone]);
    }
  };

  const getAllNames = (items: ZoneItem[]) => {
    const names: string[] = [];
    items.forEach((i) => {
      names.push(i.name);
      if (i.children) i.children.forEach((c) => names.push(c.name));
    });
    return names;
  };

  const toggleMacro = (macroKey: string) => {
    const items = zones[macroKey] || [];
    const names = getAllNames(items);
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
      const macroMatch = MACRO_ZONES[key]?.label.toLowerCase().includes(q);
      if (macroMatch) {
        result[key] = items;
      } else {
        const filtered = items.filter((i) =>
          i.name.toLowerCase().includes(q) ||
          i.children?.some((c) => c.name.toLowerCase().includes(q))
        );
        if (filtered.length > 0) result[key] = filtered;
      }
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
                const allNames = getAllNames(items);
                const allSelected = allNames.length > 0 && allNames.every((n) => selected.includes(n));
                const selectedCount = allNames.filter((n) => selected.includes(n)).length;

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
                          const hasChildren = item.children && item.children.length > 0;
                          const familyNames = hasChildren ? [item.name, ...item.children!.map(c => c.name)] : [item.name];
                          const allFamilySelected = familyNames.every(n => selected.includes(n));
                          const someFamilySelected = !allFamilySelected && familyNames.some(n => selected.includes(n));
                          const isItemSelected = hasChildren ? allFamilySelected : selected.includes(item.name);
                          const totalCount = item.count + (item.children?.reduce((s, c) => s + c.count, 0) || 0);
                          return (
                            <div key={item.name} className={hasChildren ? "col-span-2 grid grid-cols-2 gap-px" : ""}>
                              <button
                                onClick={() => toggle(item.name)}
                                className={`flex items-center gap-2 px-3 py-2 text-left transition-all ${hasChildren ? "col-span-2" : ""} ${
                                  isItemSelected
                                    ? "bg-primary/8 text-foreground"
                                    : "bg-card hover:bg-muted/30 text-foreground"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                  isItemSelected
                                    ? "border-primary bg-primary"
                                    : someFamilySelected
                                    ? "border-primary bg-primary/50"
                                    : "border-muted-foreground/30 bg-background"
                                }`}>
                                  {isItemSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                                  {someFamilySelected && !isItemSelected && <div className="w-2 h-0.5 bg-primary-foreground rounded-full" />}
                                </div>
                                <span className="text-xs truncate flex-1 font-medium">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">{totalCount}</span>
                              </button>
                              {hasChildren && item.children!.map((child) => {
                                const isChildSelected = selected.includes(child.name);
                                return (
                                  <button
                                    key={child.name}
                                    onClick={() => toggle(child.name)}
                                    className={`flex items-center gap-2 pl-7 pr-3 py-1.5 text-left transition-all ${
                                      isChildSelected
                                        ? "bg-primary/8 text-foreground"
                                        : "bg-card hover:bg-muted/30 text-foreground"
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                      isChildSelected
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground/30 bg-background"
                                    }`}>
                                      {isChildSelected && <Check className="h-2 w-2 text-primary-foreground" />}
                                    </div>
                                    <span className="text-[11px] truncate flex-1 text-muted-foreground">{child.name}</span>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{child.count}</span>
                                  </button>
                                );
                              })}
                            </div>
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
