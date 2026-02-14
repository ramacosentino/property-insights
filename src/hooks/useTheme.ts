import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

// Shared theme state so all components see the same value
let currentTheme: "dark" | "light" = (() => {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
})();

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return currentTheme;
}

function setTheme(t: "dark" | "light") {
  currentTheme = t;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("theme", t);
  listeners.forEach((cb) => cb());
}

// Apply on load
if (typeof window !== "undefined") {
  const root = document.documentElement;
  if (currentTheme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return { isDark: theme === "dark", theme, toggle };
}
