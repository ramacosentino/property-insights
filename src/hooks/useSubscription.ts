import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type PlanId = "free" | "pro" | "premium";

export interface Subscription {
  id: string;
  plan: PlanId;
  status: string;
  mp_preapproval_id: string | null;
  current_period_end: string | null;
}

export const PLAN_LIMITS = {
  free: {
    analyses: 5,
    comparisons: 5,
    searches: 3,
    alerts: 1,
    savedProjects: 10,
    exports: false,
    tasacion: false,
    inteligenciaPrecios: false,
  },
  pro: {
    analyses: 50,
    comparisons: 50,
    searches: 30,
    alerts: 10,
    savedProjects: Infinity,
    exports: true,
    tasacion: false,
    inteligenciaPrecios: false,
  },
  premium: {
    analyses: Infinity,
    comparisons: Infinity,
    searches: Infinity,
    alerts: Infinity,
    savedProjects: Infinity,
    exports: true,
    tasacion: true,
    inteligenciaPrecios: true,
  },
} as const;

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch, error } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const plan: PlanId = (subscription?.status === "active" ? subscription.plan : "free") as PlanId;
  const limits = PLAN_LIMITS[plan];

  const createSubscription = async (planId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    const res = await supabase.functions.invoke("mp-create-subscription", {
      body: {
        planId,
        backUrl: window.location.origin + "/planes",
      },
    });

    if (res.error) {
      throw new Error(res.error.message || "Error creating subscription");
    }

    return res.data as { init_point: string; id: string };
  };

  return {
    subscription,
    isLoading,
    error,
    refetch,
    createSubscription,
    plan,
    limits,
    isActive: subscription?.status === "active",
    isPro: plan === "pro",
    isPremium: plan === "premium",
  };
};
