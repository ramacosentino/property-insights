import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { FilterState, createFilterState } from "@/components/MultiFilter";

export interface OnboardingFilters {
  neighborhoodFilter: FilterState;
  propertyTypeFilter: FilterState;
  priceRange: [number, number] | null;
  priceCurrency: string;
  loaded: boolean;
}

const TYPE_MAP: Record<string, string> = {
  "Departamento": "departamento",
  "Casa": "casa",
  "PH": "ph",
  "Terreno": "terreno",
};

export function useOnboardingFilters() {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<OnboardingFilters>({
    neighborhoodFilter: createFilterState(),
    propertyTypeFilter: createFilterState(),
    priceRange: null,
    priceCurrency: "USD",
    loaded: false,
  });

  useEffect(() => {
    if (authLoading || !user) {
      setFilters((f) => ({ ...f, loaded: true }));
      return;
    }

    supabase
      .from("user_onboarding")
      .select("zones, budget_min, budget_max, budget_currency, property_types")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          setFilters((f) => ({ ...f, loaded: true }));
          return;
        }

        // Map zones to neighborhood include filter
        const neighborhoodFilter = createFilterState();
        if (data.zones && data.zones.length > 0) {
          data.zones.forEach((z: string) => neighborhoodFilter.included.add(z));
        }

        // Map property types
        const propertyTypeFilter = createFilterState();
        if (data.property_types && data.property_types.length > 0) {
          data.property_types.forEach((t: string) => {
            const mapped = TYPE_MAP[t] || t.toLowerCase();
            propertyTypeFilter.included.add(mapped);
          });
        }

        // Price range
        const priceRange: [number, number] | null =
          data.budget_min != null || data.budget_max != null
            ? [data.budget_min ?? 0, data.budget_max ?? 2000000]
            : null;

        setFilters({
          neighborhoodFilter,
          propertyTypeFilter,
          priceRange,
          priceCurrency: data.budget_currency || "USD",
          loaded: true,
        });
      });
  }, [user, authLoading]);

  return filters;
}
