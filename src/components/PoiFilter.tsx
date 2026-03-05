import { useState, useCallback } from "react";
import { Train, Trees, Dumbbell, ShoppingCart, X, Loader2, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

export interface PoiLocation {
  name: string;
  lat: number;
  lng: number;
  address: string | null;
}

export interface PoiFilterState {
  active: boolean;
  type: string | null;
  radius: number; // meters — max distance from property to POI
  pois: PoiLocation[];
}

const POI_CATEGORIES = [
  { id: "transporte", label: "Transporte", icon: Train },
  { id: "espacios_verdes", label: "Plazas", icon: Trees },
  { id: "gimnasios", label: "Gimnasios", icon: Dumbbell },
  { id: "supermercados", label: "Súper", icon: ShoppingCart },
] as const;

interface PoiFilterProps {
  state: PoiFilterState;
  onChange: (state: PoiFilterState) => void;
  mapCenter: { lat: number; lng: number } | null;
  compact?: boolean;
}

/** Haversine distance in meters */
export function haversineDistance(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PoiFilter = ({ state, onChange, mapCenter, compact }: PoiFilterProps) => {
  const [loading, setLoading] = useState(false);

  const searchPois = useCallback(
    async (type: string) => {
      if (!mapCenter) return;
      setLoading(true);
      try {
        // Search radius for the API: larger area to find all POIs, user radius filters properties
        const searchRadius = 10000; // 10km around map center
        const { data, error } = await supabase.functions.invoke("search-pois", {
          body: {
            poi_type: type,
            center_lat: mapCenter.lat,
            center_lng: mapCenter.lng,
            radius_meters: searchRadius,
          },
        });
        if (error) throw error;
        onChange({
          active: true,
          type,
          radius: state.radius,
          pois: data.places || [],
        });
      } catch (err) {
        console.error("POI search failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [mapCenter, onChange, state.radius]
  );

  const handleTypeClick = (type: string) => {
    if (state.active && state.type === type) {
      // Deactivate
      onChange({ active: false, type: null, radius: state.radius, pois: [] });
    } else {
      searchPois(type);
    }
  };

  const handleRadiusChange = (value: number[]) => {
    onChange({ ...state, radius: value[0] });
  };

  const clear = () => {
    onChange({ active: false, type: null, radius: state.radius, pois: [] });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Cercanía a
        </span>
        {state.active && (
          <button
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {POI_CATEGORIES.map((cat) => {
          const isActive = state.active && state.type === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleTypeClick(cat.id)}
              disabled={loading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all border ${
                isActive
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground hover:border-muted-foreground/30"
              } ${loading ? "opacity-50 cursor-wait" : ""}`}
            >
              {loading && state.type === cat.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {cat.label}
            </button>
          );
        })}
      </div>

      {state.active && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Radio máximo</span>
            <span className="text-[10px] font-mono text-primary font-semibold">
              {state.radius >= 1000
                ? `${(state.radius / 1000).toFixed(1)} km`
                : `${state.radius} m`}
            </span>
          </div>
          <Slider
            min={200}
            max={3000}
            step={100}
            value={[state.radius]}
            onValueChange={handleRadiusChange}
            className="w-full"
          />
          <p className="text-[9px] text-muted-foreground">
            {state.pois.length} punto{state.pois.length !== 1 ? "s" : ""} encontrado{state.pois.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default PoiFilter;
