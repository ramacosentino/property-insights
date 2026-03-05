import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface OnboardingData {
  user_type: string;
  zones: string[];
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  property_types: string[];
  investment_goal: string | null;
  condition_filters: string[];
}

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCompleted(null);
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setCompleted(data?.onboarding_completed ?? false);
        setLoading(false);
      });
  }, [user, authLoading]);

  const saveOnboarding = async (data: OnboardingData) => {
    if (!user) return;

    // Upsert onboarding data
    const { error: onboardingError } = await supabase
      .from("user_onboarding")
      .upsert(
        {
          user_id: user.id,
          user_type: data.user_type,
          zones: data.zones,
          budget_min: data.budget_min,
          budget_max: data.budget_max,
          budget_currency: data.budget_currency,
          property_types: data.property_types,
          investment_goal: data.investment_goal,
          condition_filters: data.condition_filters,
        },
        { onConflict: "user_id" }
      );

    if (onboardingError) throw onboardingError;

    // Mark profile as completed
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true, user_type: data.user_type })
      .eq("user_id", user.id);

    if (profileError) throw profileError;

    setCompleted(true);
  };

  return { completed, loading: loading || authLoading, saveOnboarding };
}
