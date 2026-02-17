import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "propanalytics_preselected";
const CHANGE_EVENT = "preselection-change";

function loadLocalIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveLocalIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function usePreselection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Listen for auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load saved projects from DB when authenticated, localStorage when not
  useEffect(() => {
    if (userId) {
      supabase
        .from("saved_projects")
        .select("property_id")
        .eq("user_id", userId)
        .then(({ data }) => {
          const ids = new Set((data ?? []).map((r: any) => r.property_id));
          setSelectedIds(ids);
          setLoaded(true);
        });
    } else {
      setSelectedIds(loadLocalIds());
      setLoaded(true);
    }
  }, [userId]);

  // Listen for cross-component updates (localStorage fallback)
  useEffect(() => {
    const handler = () => {
      if (!userId) setSelectedIds(loadLocalIds());
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [userId]);

  const toggle = useCallback(
    async (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);

        if (!userId) {
          saveLocalIds(next);
          window.dispatchEvent(new Event(CHANGE_EVENT));
        }
        return next;
      });

      if (userId) {
        const isCurrentlySelected = selectedIds.has(id);
        if (isCurrentlySelected) {
          await supabase
            .from("saved_projects")
            .delete()
            .eq("user_id", userId)
            .eq("property_id", id);
        } else {
          await supabase
            .from("saved_projects")
            .insert({ user_id: userId, property_id: id });
        }
        // Broadcast for other hook instances
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }
    },
    [userId, selectedIds]
  );

  // Refresh from DB on change event when authenticated
  useEffect(() => {
    if (!userId) return;
    const handler = () => {
      supabase
        .from("saved_projects")
        .select("property_id")
        .eq("user_id", userId)
        .then(({ data }) => {
          setSelectedIds(new Set((data ?? []).map((r: any) => r.property_id)));
        });
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [userId]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const clear = useCallback(async () => {
    setSelectedIds(new Set());
    if (userId) {
      await supabase
        .from("saved_projects")
        .delete()
        .eq("user_id", userId);
    } else {
      saveLocalIds(new Set());
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [userId]);

  return { selectedIds, toggle, isSelected, count: selectedIds.size, clear };
}

// Standalone functions for use in raw HTML popups (localStorage fallback only)
export function isPreselected(id: string): boolean {
  return loadLocalIds().has(id);
}

export function togglePreselection(id: string): boolean {
  const ids = loadLocalIds();
  const wasSelected = ids.has(id);
  if (wasSelected) ids.delete(id);
  else ids.add(id);
  saveLocalIds(ids);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return !wasSelected;
}
