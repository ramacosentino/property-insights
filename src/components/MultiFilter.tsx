import { X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterState = {
  included: Set<string>;
  excluded: Set<string>;
};

interface MultiFilterProps {
  title: string;
  options: FilterOption[];
  state: FilterState;
  onChange: (state: FilterState) => void;
}

const MultiFilter = ({ title, options, state, onChange }: MultiFilterProps) => {
  const handleClick = (value: string) => {
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

  const hasActive = state.included.size > 0 || state.excluded.size > 0;

  const clearAll = () => {
    onChange({ included: new Set(), excluded: new Set() });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isIncluded = state.included.has(opt.value);
          const isExcluded = state.excluded.has(opt.value);

          return (
            <button
              key={opt.value}
              onClick={() => handleClick(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isIncluded
                  ? "bg-primary/20 text-primary border-primary/30"
                  : isExcluded
                  ? "bg-destructive/10 text-destructive border-destructive/30 line-through"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              {isExcluded && "✕ "}{opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiFilter;

export function createFilterState(): FilterState {
  return { included: new Set(), excluded: new Set() };
}

export function applyFilter(value: string, state: FilterState): boolean {
  if (state.included.size > 0 && !state.included.has(value)) return false;
  if (state.excluded.has(value)) return false;
  return true;
}
