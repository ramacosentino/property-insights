import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  mp_preapproval_id: string | null;
  current_period_end: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
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
  });

  const createSubscription = async (planId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/mp-create-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planId,
          backUrl: window.location.origin + "/planes",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error creating subscription");
    }

    const data = await res.json();
    return data as { init_point: string; id: string };
  };

  return {
    subscription,
    isLoading,
    refetch,
    createSubscription,
    isActive: subscription?.status === "active",
    isPro: subscription?.plan === "pro" && subscription?.status === "active",
    isPremium: subscription?.plan === "premium" && subscription?.status === "active",
  };
};
