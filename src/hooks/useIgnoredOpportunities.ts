import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHANGE_EVENT = "ignored-opportunities-change";

// Module-level cache for standalone (popup) usage
let _ignoredIds: Set<string> = new Set();

export function useIgnoredOpportunities() {
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load from DB
  useEffect(() => {
    if (!userId) { setIgnoredIds(new Set()); _ignoredIds = new Set(); return; }
    supabase
      .from("ignored_opportunities")
      .select("property_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((r: any) => r.property_id as string));
        setIgnoredIds(ids);
        _ignoredIds = ids;
      });
  }, [userId]);

  // Cross-component sync
  useEffect(() => {
    if (!userId) return;
    const handler = () => {
      supabase
        .from("ignored_opportunities")
        .select("property_id")
        .eq("user_id", userId)
        .then(({ data }) => {
          const ids = new Set((data ?? []).map((r: any) => r.property_id as string));
          setIgnoredIds(ids);
          _ignoredIds = ids;
        });
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [userId]);

  const ignore = useCallback(async (propertyId: string) => {
    if (!userId) return;
    setIgnoredIds((prev) => { const n = new Set(prev); n.add(propertyId); _ignoredIds = n; return n; });
    await supabase.from("ignored_opportunities").insert({ user_id: userId, property_id: propertyId });
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [userId]);

  const restore = useCallback(async (propertyId: string) => {
    if (!userId) return;
    setIgnoredIds((prev) => { const n = new Set(prev); n.delete(propertyId); _ignoredIds = n; return n; });
    await supabase.from("ignored_opportunities").delete().eq("user_id", userId).eq("property_id", propertyId);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [userId]);

  const isIgnored = useCallback((id: string) => ignoredIds.has(id), [ignoredIds]);

  return { ignoredIds, ignore, restore, isIgnored, count: ignoredIds.size };
}

// Standalone for raw HTML popups
export function isIgnoredOpportunity(id: string): boolean {
  return _ignoredIds.has(id);
}

export async function toggleIgnoreOpportunity(id: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const userId = session.user.id;
  const wasIgnored = _ignoredIds.has(id);
  if (wasIgnored) {
    await supabase.from("ignored_opportunities").delete().eq("user_id", userId).eq("property_id", id);
  } else {
    await supabase.from("ignored_opportunities").insert({ user_id: userId, property_id: id });
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return !wasIgnored;
}
