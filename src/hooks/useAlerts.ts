import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";

export interface AlertFilters {
  zones?: string[];
  property_types?: string[];
  price_min?: number;
  price_max?: number;
  price_currency?: string;
  condition_filters?: string[];
}

export interface Alert {
  id: string;
  user_id: string;
  name: string;
  filters: AlertFilters;
  email_enabled: boolean;
  in_app_enabled: boolean;
  email_frequency: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAlerts() {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const canCreateMore = alerts.length < (limits.alerts === Infinity ? 999 : limits.alerts);

  const createAlert = useMutation({
    mutationFn: async (alert: Omit<Alert, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("No user");
      const { data, error } = await supabase
        .from("alerts")
        .insert({
          user_id: user.id,
          name: alert.name,
          filters: alert.filters as any,
          email_enabled: alert.email_enabled,
          in_app_enabled: alert.in_app_enabled,
          email_frequency: alert.email_frequency,
          active: alert.active,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Alert;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] }),
  });

  const updateAlert = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Alert> & { id: string }) => {
      const updatePayload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
      delete updatePayload.id;
      const { error } = await supabase
        .from("alerts")
        .update(updatePayload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] }),
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] }),
  });

  return { alerts, isLoading, canCreateMore, createAlert, updateAlert, deleteAlert };
}
