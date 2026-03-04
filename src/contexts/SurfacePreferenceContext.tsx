import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SurfaceType = "total" | "covered";

interface SurfacePreferenceContextType {
  surfaceType: SurfaceType;
  toggle: () => void;
  /** Get the appropriate USD/m² value for a property */
  getM2: (pricePerM2Total: number | null, pricePerM2Covered: number | null) => number | null;
  /** Label for current metric */
  m2Label: string;
  /** Short label */
  m2ShortLabel: string;
}

const SurfacePreferenceContext = createContext<SurfacePreferenceContextType>({
  surfaceType: "total",
  toggle: () => {},
  getM2: (total) => total,
  m2Label: "USD/m² total",
  m2ShortLabel: "USD/m²",
});

export function SurfacePreferenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [surfaceType, setSurfaceType] = useState<SurfaceType>("total");

  // Load preference from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("surface_preference")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.surface_preference === "covered") {
          setSurfaceType("covered");
        }
      });
  }, [user]);

  const toggle = useCallback(async () => {
    const newType: SurfaceType = surfaceType === "total" ? "covered" : "total";
    setSurfaceType(newType);
    if (user) {
      await supabase
        .from("profiles")
        .update({ surface_preference: newType } as any)
        .eq("user_id", user.id);
    }
  }, [surfaceType, user]);

  const getM2 = useCallback(
    (pricePerM2Total: number | null, pricePerM2Covered: number | null): number | null => {
      if (surfaceType === "covered") {
        return pricePerM2Covered ?? pricePerM2Total;
      }
      return pricePerM2Total;
    },
    [surfaceType]
  );

  const m2Label = surfaceType === "covered" ? "USD/m² cubierto" : "USD/m² total";
  const m2ShortLabel = surfaceType === "covered" ? "USD/m² cubierto" : "USD/m² total";

  return (
    <SurfacePreferenceContext.Provider value={{ surfaceType, toggle, getM2, m2Label, m2ShortLabel }}>
      {children}
    </SurfacePreferenceContext.Provider>
  );
}

export function useSurfacePreference() {
  return useContext(SurfacePreferenceContext);
}
