import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription, PLAN_LIMITS, PlanId } from "./useSubscription";
import { useIsAdmin } from "./useIsAdmin";

type UsageCategory = "analyses" | "comparisons" | "searches" | "exports";

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useUsageLimits() {
  const { user } = useAuth();
  const { plan, limits } = useSubscription();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const yearMonth = getCurrentYearMonth();

  const { data: usage, isLoading } = useQuery({
    queryKey: ["usage_tracking", user?.id, yearMonth],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("user_id", user.id)
        .eq("year_month", yearMonth)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const getUsed = (category: UsageCategory): number => {
    if (!usage) return 0;
    const map: Record<UsageCategory, string> = {
      analyses: "analyses_count",
      comparisons: "comparisons_count",
      searches: "searches_count",
      exports: "exports_count",
    };
    return (usage as any)[map[category]] ?? 0;
  };

  const getLimit = (category: UsageCategory): number => {
    return limits[category] as number;
  };

  const getRemaining = (category: UsageCategory): number => {
    const limit = getLimit(category);
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - getUsed(category));
  };

  const canUse = (category: UsageCategory): boolean => {
    if (isAdmin) return true;
    return getRemaining(category) > 0;
  };

  const incrementUsage = useMutation({
    mutationFn: async (category: UsageCategory) => {
      if (!user) throw new Error("No user");
      const columnMap: Record<UsageCategory, string> = {
        analyses: "analyses_count",
        comparisons: "comparisons_count",
        searches: "searches_count",
        exports: "exports_count",
      };
      const column = columnMap[category];

      // Upsert: create if not exists, increment if exists
      const currentCount = getUsed(category);
      const { error } = await supabase
        .from("usage_tracking")
        .upsert(
          {
            user_id: user.id,
            year_month: yearMonth,
            [column]: currentCount + 1,
          },
          { onConflict: "user_id,year_month" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usage_tracking", user?.id, yearMonth] });
    },
  });

  return {
    usage,
    isLoading,
    plan,
    limits,
    getUsed,
    getLimit,
    getRemaining,
    canUse,
    incrementUsage: incrementUsage.mutateAsync,
    hasFeature: (feature: "exports" | "tasacion" | "inteligenciaPrecios") => isAdmin || limits[feature],
    isAdmin,
  };
}
