import { useState, useRef, useEffect, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createFilterState, FilterState } from "@/components/MultiFilter";
import { NeighborhoodItem } from "@/lib/neighborhoodGroups";
export type { ProvinceGroup } from "@/lib/neighborhoodGroups";

interface NeighborhoodDropdownProps {
  groups: import("@/lib/neighborhoodGroups").ProvinceGroup[];
  state: FilterState;
  onChange: (s: FilterState) => void;
  compact?: boolean;
}

/** Get all values in a neighborhood family (parent + children) */
function getFamilyValues(item: NeighborhoodItem): string[] {
  const vals = [item.value];
  if (item.children) item.children.forEach((c) => vals.push(c.value));
  return vals;
}

/** Find the parent item that contains a given value */
function findParentItem(
  groups: import("@/lib/neighborhoodGroups").ProvinceGroup[],
  value: string
): NeighborhoodItem | null {
  for (const g of groups) {
    for (const n of g.neighborhoods) {
      if (n.value === value && n.children && n.children.length > 0) return n;
    }
  }
  return null;
}

const NeighborhoodDropdown = ({
  groups,
  state,
  onChange,
  compact = false,
}: NeighborhoodDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (value: string) => {
    // Check if this is a parent with children
    const parentItem = findParentItem(groups, value);
    if (parentItem) {
      handleParentToggle(parentItem);
      return;
    }

    const next: FilterState = {
      included: new Set(state.included),
      excluded: new Set(state.excluded),
    };
    if (next.included.has(value)) {
      next.included.delete(value);
      next.excluded.add(value);
    } else if (next.excluded.has(value)) {
      next.excluded.delete(value);
    } else {
      next.included.add(value);
    }
    onChange(next);
  };

  /** Toggle a parent barrio: cycles all family members together */
  const handleParentToggle = (item: NeighborhoodItem) => {
    const family = getFamilyValues(item);
    const next: FilterState = {
      included: new Set(state.included),
      excluded: new Set(state.excluded),
    };

    const allIncluded = family.every((v) => next.included.has(v));
    const anyIncluded = family.some((v) => next.included.has(v));

    if (allIncluded) {
      // All included → exclude all
      family.forEach((v) => {
        next.included.delete(v);
        next.excluded.add(v);
      });
    } else if (!anyIncluded && family.every((v) => next.excluded.has(v))) {
      // All excluded → clear all
      family.forEach((v) => next.excluded.delete(v));
    } else {
      // Partial or none → include all
      family.forEach((v) => {
        next.excluded.delete(v);
        next.included.add(v);
      });
    }
    onChange(next);
  };

  const handleProvinceToggle = (group: import("@/lib/neighborhoodGroups").ProvinceGroup) => {
    const allValues: string[] = [];
    group.neighborhoods.forEach((n) => {
      allValues.push(n.value);
      if (n.children) n.children.forEach((c) => allValues.push(c.value));
    });
    const allIncluded = allValues.every((v) => state.included.has(v));
    const next: FilterState = {
      included: new Set(state.included),
      excluded: new Set(state.excluded),
    };
    if (allIncluded) {
      allValues.forEach((v) => next.included.delete(v));
    } else {
      allValues.forEach((v) => {
        next.excluded.delete(v);
        next.included.add(v);
      });
    }
    onChange(next);
  };

  const activeCount = state.included.size + state.excluded.size;

  const filteredGroups = useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        neighborhoods: g.neighborhoods
          .map((n) => {
            const parentMatch = n.value.toLowerCase().includes(q) || g.province.toLowerCase().includes(q);
            if (parentMatch) return n; // show parent + all children
            // Check children
            if (n.children) {
              const filteredChildren = n.children.filter((c) => c.value.toLowerCase().includes(q));
              if (filteredChildren.length > 0) return { ...n, children: filteredChildren };
            }
            return null;
          })
          .filter(Boolean) as NeighborhoodItem[],
      }))
      .filter((g) => g.neighborhoods.length > 0);
  }, [groups, query]);

  const textSize = compact ? "text-[10px]" : "text-xs";

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <span className={`${textSize} font-medium text-muted-foreground`}>Barrio</span>
        {activeCount > 0 && (
          <button
            onClick={() => onChange(createFilterState())}
            className={`${textSize} text-muted-foreground hover:text-foreground flex items-center gap-0.5`}
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 mb-1.5">
          {Array.from(state.included).map((v) => (
            <span
              key={v}
              onClick={() => {
                const next: FilterState = { included: new Set(state.included), excluded: new Set(state.excluded) };
                next.included.delete(v);
                onChange(next);
              }}
              className={`cursor-pointer px-2 py-0.5 rounded-full ${textSize} font-medium bg-primary/20 text-primary border border-primary/30`}
            >
              {v} ×
            </span>
          ))}
          {Array.from(state.excluded).map((v) => (
            <span
              key={v}
              onClick={() => {
                const next: FilterState = { included: new Set(state.included), excluded: new Set(state.excluded) };
                next.excluded.delete(v);
                onChange(next);
              }}
              className={`cursor-pointer px-2 py-0.5 rounded-full ${textSize} font-medium bg-destructive/10 text-destructive border border-destructive/30 line-through`}
            >
              ✕ {v} ×
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-full ${textSize} bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors`}
      >
        <span>{activeCount > 0 ? `${activeCount} barrio${activeCount > 1 ? "s" : ""} seleccionado${activeCount > 1 ? "s" : ""}` : "Seleccionar barrios..."}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-[1200] mt-1 w-full rounded-2xl border border-border bg-popover shadow-lg max-h-80 overflow-hidden">
          <div className="p-2.5 border-b border-border">
            <Input
              placeholder="Buscar barrio o localidad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`h-9 ${textSize} bg-secondary border-border rounded-full`}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-64">
            {filteredGroups.map((group) => {
              const allGroupValues: string[] = [];
              group.neighborhoods.forEach((n) => {
                allGroupValues.push(n.value);
                if (n.children) n.children.forEach((c) => allGroupValues.push(c.value));
              });
              const allIncluded = allGroupValues.every((v) => state.included.has(v));
              const isCollapsed = collapsed.has(group.province) && !query;
              return (
                <div key={group.province}>
                  <div className="flex items-center border-b border-border sticky top-0 z-10">
                    <button
                      onClick={() => {
                        const next = new Set(collapsed);
                        if (next.has(group.province)) next.delete(group.province);
                        else next.add(group.province);
                        setCollapsed(next);
                      }}
                      className={`px-2 py-1.5 ${textSize} text-muted-foreground hover:text-foreground`}
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleProvinceToggle(group)}
                      className={`flex-1 text-left py-1.5 pr-3 ${textSize} font-semibold flex items-center justify-between ${
                        allIncluded ? "bg-primary/10 text-primary" : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span>{group.province} ({group.totalCount})</span>
                      {allIncluded && <span className="text-primary text-[10px]">✓ todos</span>}
                    </button>
                  </div>
                  {!isCollapsed && group.neighborhoods.map((opt) => {
                    const hasChildren = opt.children && opt.children.length > 0;
                    const familyValues = getFamilyValues(opt);
                    const isParentIncluded = hasChildren
                      ? familyValues.every((v) => state.included.has(v))
                      : state.included.has(opt.value);
                    const isParentExcluded = hasChildren
                      ? familyValues.every((v) => state.excluded.has(v))
                      : state.excluded.has(opt.value);
                    const someIncluded = hasChildren && !isParentIncluded && familyValues.some((v) => state.included.has(v));

                    return (
                      <div key={opt.value}>
                        <button
                          onClick={() => handleClick(opt.value)}
                          className={`w-full text-left pl-6 pr-3 py-1 ${textSize} transition-colors flex items-center justify-between ${
                            isParentIncluded
                              ? "bg-primary/5 text-primary font-medium"
                              : isParentExcluded
                              ? "bg-destructive/5 text-destructive line-through"
                              : someIncluded
                              ? "bg-primary/5 text-primary/70"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span>
                            {isParentIncluded && <span className="text-primary">✓</span>}
                            {isParentExcluded && <span className="text-destructive">✕</span>}
                            {someIncluded && <span className="text-primary/50">—</span>}
                          </span>
                        </button>
                        {/* Render children indented */}
                        {hasChildren && opt.children!.map((child) => {
                          const isChildIncluded = state.included.has(child.value);
                          const isChildExcluded = state.excluded.has(child.value);
                          return (
                            <button
                              key={child.value}
                              onClick={() => {
                                // Individual child toggle (not family)
                                const next: FilterState = {
                                  included: new Set(state.included),
                                  excluded: new Set(state.excluded),
                                };
                                if (next.included.has(child.value)) {
                                  next.included.delete(child.value);
                                  next.excluded.add(child.value);
                                } else if (next.excluded.has(child.value)) {
                                  next.excluded.delete(child.value);
                                } else {
                                  next.included.add(child.value);
                                }
                                onChange(next);
                              }}
                              className={`w-full text-left pl-10 pr-3 py-0.5 ${textSize} transition-colors flex items-center justify-between ${
                                isChildIncluded
                                  ? "bg-primary/5 text-primary"
                                  : isChildExcluded
                                  ? "bg-destructive/5 text-destructive line-through"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                            >
                              <span>{child.label}</span>
                              {isChildIncluded && <span className="text-primary">✓</span>}
                              {isChildExcluded && <span className="text-destructive">✕</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <p className={`${textSize} text-muted-foreground text-center py-3`}>Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodDropdown;
