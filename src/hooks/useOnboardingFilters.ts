import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { FilterState, createFilterState } from "@/components/MultiFilter";
import { ALL_CONDITION_VALUES } from "@/lib/filterUtils";

export interface OnboardingFilters {
  neighborhoodFilter: FilterState;
  propertyTypeFilter: FilterState;
  conditionFilters: Set<string>;
  priceRange: [number, number] | null;
  priceCurrency: string;
  loaded: boolean;
  revision: number;
}

const TYPE_MAP: Record<string, string> = {
  "Departamento": "departamento",
  "Casa": "casa",
  "PH": "ph",
  "Terreno": "terreno",
};

export const ONBOARDING_FILTERS_UPDATED = "onboarding-filters-updated";

export function useOnboardingFilters() {
  const { user, loading: authLoading } = useAuth();
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState<OnboardingFilters>({
    neighborhoodFilter: createFilterState(),
    propertyTypeFilter: createFilterState(),
    conditionFilters: new Set<string>(),
    priceRange: null,
    priceCurrency: "USD",
    loaded: false,
    revision: 0,
  });

  useEffect(() => {
    const handler = () => setRevision((r) => r + 1);
    window.addEventListener(ONBOARDING_FILTERS_UPDATED, handler);
    return () => window.removeEventListener(ONBOARDING_FILTERS_UPDATED, handler);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setFilters((f) => ({ ...f, loaded: true, revision }));
      return;
    }

    supabase
      .from("user_onboarding")
      .select("zones, budget_min, budget_max, budget_currency, property_types, condition_filters")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          setFilters((f) => ({ ...f, loaded: true, revision }));
          return;
        }

        const neighborhoodFilter = createFilterState();
        if (data.zones && data.zones.length > 0) {
          data.zones.forEach((z: string) => neighborhoodFilter.included.add(z));
        }

        const propertyTypeFilter = createFilterState();
        if (data.property_types && data.property_types.length > 0) {
          data.property_types.forEach((t: string) => {
            const mapped = TYPE_MAP[t] || t.toLowerCase();
            propertyTypeFilter.included.add(mapped);
          });
        }

        const priceRange: [number, number] | null =
          data.budget_min != null || data.budget_max != null
            ? [data.budget_min ?? 0, data.budget_max ?? 2000000]
            : null;

        // Condition filters: if saved and non-empty use them, otherwise default to all
        const condArr = (data as any).condition_filters;
        const conditionFilters = new Set<string>(
          condArr && condArr.length > 0 ? condArr : ALL_CONDITION_VALUES
        );

        setFilters({
          neighborhoodFilter,
          propertyTypeFilter,
          conditionFilters,
          priceRange,
          priceCurrency: data.budget_currency || "USD",
          loaded: true,
          revision,
        });
      });
  }, [user, authLoading, revision]);

  return filters;
}
