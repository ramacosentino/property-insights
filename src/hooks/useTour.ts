import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DiscoveryChecklist {
  explored_map?: boolean;
  applied_filter?: boolean;
  saved_project?: boolean;
  ran_search?: boolean;
  compared_properties?: boolean;
  viewed_intelligence?: boolean;
}

export function useTour() {
  const { user } = useAuth();
  const [tourCompleted, setTourCompleted] = useState<boolean | null>(null);
  const [checklist, setChecklist] = useState<DiscoveryChecklist>({});
  const [showTour, setShowTour] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("profiles")
      .select("tour_completed, discovery_checklist")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const completed = data?.tour_completed ?? false;
        setTourCompleted(completed);
        setChecklist((data?.discovery_checklist as DiscoveryChecklist) ?? {});
        // Auto-show tour if not completed
        if (!completed) setShowTour(true);
        setLoading(false);
      });
  }, [user]);

  const completeTour = useCallback(async () => {
    setShowTour(false);
    setTourCompleted(true);
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ tour_completed: true })
      .eq("user_id", user.id);
  }, [user]);

  const restartTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const completeChecklistItem = useCallback(async (key: keyof DiscoveryChecklist) => {
    if (!user) return;
    setChecklist(prev => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: true };
      supabase
        .from("profiles")
        .update({ discovery_checklist: next })
        .eq("user_id", user.id)
        .then(() => {});
      return next;
    });
  }, [user]);

  const checklistItems = [
    { key: "explored_map" as const, label: "Explorá el mapa", description: "Navegá el mapa y descubrí barrios" },
    { key: "applied_filter" as const, label: "Aplicá un filtro", description: "Usá los filtros para refinar resultados" },
    { key: "saved_project" as const, label: "Guardá un proyecto", description: "Marcá una propiedad como favorita" },
    { key: "ran_search" as const, label: "Lanzá una búsqueda", description: "Usá la búsqueda inteligente con IA" },
    { key: "compared_properties" as const, label: "Compará propiedades", description: "Compará 2+ propiedades lado a lado" },
    { key: "viewed_intelligence" as const, label: "Revisá inteligencia de precios", description: "Consultá estadísticas de mercado" },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const allCompleted = completedCount === checklistItems.length;

  return {
    tourCompleted,
    showTour,
    setShowTour,
    completeTour,
    restartTour,
    checklist,
    completeChecklistItem,
    checklistItems,
    completedCount,
    allCompleted,
    loading,
  };
}
