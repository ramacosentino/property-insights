import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin = false, isLoading: queryLoading } = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) {
        console.error("useIsAdmin error:", error);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Consider loading if auth is still loading OR query hasn't resolved yet
  return { isAdmin, isLoading: authLoading || queryLoading };
}
