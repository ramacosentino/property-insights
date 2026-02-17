import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "propanalytics_preselected";
const CHANGE_EVENT = "preselection-change";

// Module-level cache of current user id for standalone functions
let _currentUserId: string | null = null;

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

/** Migrate any localStorage preselections into the DB, then clear localStorage */
async function migrateLocalToDb(userId: string) {
  const localIds = loadLocalIds();
  if (localIds.size === 0) return;

  // Fetch existing DB ids to avoid duplicates
  const { data: existing } = await supabase
    .from("saved_projects")
    .select("property_id")
    .eq("user_id", userId);
  const existingSet = new Set((existing ?? []).map((r: any) => r.property_id));

  const toInsert = [...localIds]
    .filter((id) => !existingSet.has(id))
    .map((id) => ({ user_id: userId, property_id: id }));

  if (toInsert.length > 0) {
    await supabase.from("saved_projects").insert(toInsert);
  }

  // Clear localStorage after migration
  localStorage.removeItem(STORAGE_KEY);
}

// Module-level discarded set for standalone functions
let _discardedIds: Set<string> = new Set();

export function usePreselection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Listen for auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        _currentUserId = uid;
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      _currentUserId = uid;
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load saved projects from DB when authenticated, localStorage when not
  // Also migrate localStorage → DB on first login
  useEffect(() => {
    if (userId) {
      (async () => {
        await migrateLocalToDb(userId);
        const { data } = await supabase
          .from("saved_projects")
          .select("property_id, discarded_at")
          .eq("user_id", userId);
        const allIds = new Set((data ?? []).map((r: any) => r.property_id));
        const discarded = new Set((data ?? []).filter((r: any) => r.discarded_at).map((r: any) => r.property_id));
        setSelectedIds(allIds);
        setDiscardedIds(discarded);
        _discardedIds = discarded;
        setLoaded(true);
      })();
    } else {
      setSelectedIds(loadLocalIds());
      setDiscardedIds(new Set());
      _discardedIds = new Set();
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
        .select("property_id, discarded_at")
        .eq("user_id", userId)
        .then(({ data }) => {
          setSelectedIds(new Set((data ?? []).map((r: any) => r.property_id)));
          const discarded = new Set((data ?? []).filter((r: any) => r.discarded_at).map((r: any) => r.property_id));
          setDiscardedIds(discarded);
          _discardedIds = discarded;
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

  const isDiscarded = useCallback(
    (id: string) => discardedIds.has(id),
    [discardedIds]
  );

  return { selectedIds, discardedIds, toggle, isSelected, isDiscarded, count: selectedIds.size, clear };
}

// Standalone functions for use in raw HTML popups (auth-aware)
export function isPreselected(id: string): boolean {
  // When logged in, we can't synchronously check DB, so we read from
  // the module-level cache updated via the CHANGE_EVENT / hook.
  // For popups rendered once, this checks localStorage (guest) or
  // the last known state. The hook keeps the React UI in sync.
  return loadLocalIds().has(id);
}

export function togglePreselection(id: string): boolean {
  const userId = _currentUserId;
  if (userId) {
    // DB-backed toggle for authenticated users
    supabase
      .from("saved_projects")
      .select("property_id")
      .eq("user_id", userId)
      .eq("property_id", id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          supabase
            .from("saved_projects")
            .delete()
            .eq("user_id", userId)
            .eq("property_id", id)
            .then(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
        } else {
          supabase
            .from("saved_projects")
            .insert({ user_id: userId, property_id: id })
            .then(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
        }
      });
    // Return toggled state optimistically (inverse of current)
    // The hook will re-sync from DB via the CHANGE_EVENT
    return true; // Can't know sync state here, popup will refresh via event
  }

  // Guest: localStorage
  const ids = loadLocalIds();
  const wasSelected = ids.has(id);
  if (wasSelected) ids.delete(id);
  else ids.add(id);
  saveLocalIds(ids);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return !wasSelected;
}

export function isDiscardedProject(id: string): boolean {
  return _discardedIds.has(id);
}
