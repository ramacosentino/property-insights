import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "propanalytics_preselected";

function loadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

// Broadcast changes across hook instances via a custom event
const CHANGE_EVENT = "preselection-change";

export function usePreselection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(loadIds);

  // Listen for cross-component updates
  useEffect(() => {
    const handler = () => setSelectedIds(loadIds());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveIds(next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    saveIds(new Set());
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { selectedIds, toggle, isSelected, count: selectedIds.size, clear };
}

// Standalone functions for use in raw HTML popups
export function isPreselected(id: string): boolean {
  return loadIds().has(id);
}

export function togglePreselection(id: string): boolean {
  const ids = loadIds();
  const wasSelected = ids.has(id);
  if (wasSelected) ids.delete(id);
  else ids.add(id);
  saveIds(ids);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return !wasSelected;
}
