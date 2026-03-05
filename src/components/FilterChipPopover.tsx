import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { FilterState, createFilterState } from "@/components/MultiFilter";
import { Slider } from "@/components/ui/slider";

/* ─── Shared chip wrapper with popover ─── */

interface ChipShellProps {
  label: string;
  badge?: string;
  isActive: boolean;
  onClear?: () => void;
  children: ReactNode;
}

function ChipShell({ label, badge, isActive, onClear, children }: ChipShellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border whitespace-nowrap ${
          isActive
            ? "border-primary/30 text-primary bg-primary/10"
            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
        }`}
      >
        {label}
        {badge && (
          <span className="bg-primary/20 text-primary text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center">
            {badge}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {isActive && onClear && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 hover:bg-primary/80 transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 mt-1 z-[1300] bg-popover border border-border rounded-xl shadow-lg p-2.5 min-w-[180px] max-w-[320px]">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Multi-select chip (Amb, Dorm, Baños, etc.) ─── */

interface MultiSelectChipProps {
  label: string;
  keys: string[];
  state: FilterState;
  onChange: (s: FilterState) => void;
}

export function MultiSelectChip({ label, keys, state, onChange }: MultiSelectChipProps) {
  const count = state.included.size + state.excluded.size;

  const handleClick = (value: string) => {
    const next: FilterState = { included: new Set(state.included), excluded: new Set(state.excluded) };
    if (next.included.has(value)) { next.included.delete(value); next.excluded.add(value); }
    else if (next.excluded.has(value)) { next.excluded.delete(value); }
    else { next.included.add(value); }
    onChange(next);
  };

  return (
    <ChipShell
      label={label}
      badge={count > 0 ? String(count) : undefined}
      isActive={count > 0}
      onClear={() => onChange(createFilterState())}
    >
      <div className="flex flex-wrap gap-1.5">
        {keys.map((k) => {
          const isIn = state.included.has(k);
          const isEx = state.excluded.has(k);
          return (
            <button
              key={k}
              onClick={() => handleClick(k)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                isIn ? "bg-primary/20 text-primary border-primary/30"
                : isEx ? "bg-destructive/10 text-destructive border-destructive/30 line-through"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground"
              }`}
            >
              {isEx && "✕ "}{k}
            </button>
          );
        })}
      </div>
    </ChipShell>
  );
}

/* ─── Condition tier chip ─── */

interface ConditionChipProps {
  label: string;
  tiers: readonly { value: string; label: string }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  totalTiers: number;
}

export function ConditionChip({ label, tiers, selected, onChange, totalTiers }: ConditionChipProps) {
  const isActive = selected.size > 0 && selected.size < totalTiers;
  const count = isActive ? selected.size : 0;

  return (
    <ChipShell
      label={label}
      badge={count > 0 ? String(count) : undefined}
      isActive={isActive}
      onClear={() => onChange(new Set())}
    >
      <div className="flex flex-wrap gap-1.5">
        {tiers.map((tier) => {
          const isSelected = selected.has(tier.value);
          return (
            <button
              key={tier.value}
              onClick={() => {
                const next = new Set(selected);
                if (next.has(tier.value)) next.delete(tier.value);
                else next.add(tier.value);
                onChange(next);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                isSelected
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground"
              }`}
            >
              {tier.label}
            </button>
          );
        })}
      </div>
    </ChipShell>
  );
}

/* ─── Range slider chip ─── */

interface RangeChipProps {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  step?: number;
  formatValue?: (v: number) => string;
  unit?: string;
  cappedMax?: boolean;
}

export function RangeChip({
  label, min, max, value, onChange, step = 1,
  formatValue, unit = "", cappedMax = false,
}: RangeChipProps) {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());
  const isActive = value[0] > min || value[1] < max;

  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  const commitMin = () => {
    setEditingMin(false);
    const parsed = parseInt(minInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) onChange([Math.max(min, Math.min(parsed, value[1])), value[1]]);
  };
  const commitMax = () => {
    setEditingMax(false);
    const parsed = parseInt(maxInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) onChange([value[0], Math.max(value[0], Math.min(parsed, max))]);
  };

  const summaryText = isActive
    ? `${fmt(value[0])}${unit} – ${fmt(value[1])}${cappedMax && value[1] >= max ? "+" : ""}${unit}`
    : undefined;

  return (
    <ChipShell
      label={label}
      badge={isActive ? "✓" : undefined}
      isActive={isActive}
      onClear={() => onChange([min, max])}
    >
      <div className="w-52 space-y-2">
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={(v) => onChange(v as [number, number])}
          className="w-full"
        />
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground gap-2">
          {editingMin ? (
            <input
              autoFocus
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              onBlur={commitMin}
              onKeyDown={(e) => e.key === "Enter" && commitMin()}
              className="w-20 bg-secondary border border-border rounded px-1.5 py-0.5 text-[11px] font-mono text-foreground outline-none focus:border-primary"
            />
          ) : (
            <button
              onClick={() => { setMinInput(value[0].toString()); setEditingMin(true); }}
              className="hover:text-foreground transition-colors cursor-text"
            >
              {fmt(value[0])}{unit}
            </button>
          )}
          {editingMax ? (
            <input
              autoFocus
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              onBlur={commitMax}
              onKeyDown={(e) => e.key === "Enter" && commitMax()}
              className="w-20 bg-secondary border border-border rounded px-1.5 py-0.5 text-[11px] font-mono text-foreground outline-none focus:border-primary text-right"
            />
          ) : (
            <button
              onClick={() => { setMaxInput(value[1].toString()); setEditingMax(true); }}
              className="hover:text-foreground transition-colors cursor-text"
            >
              {fmt(value[1])}{cappedMax && value[1] >= max ? "+" : ""}{unit}
            </button>
          )}
        </div>
      </div>
    </ChipShell>
  );
}

/* ─── Select chip (e.g. import date) ─── */

interface SelectChipProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

export function SelectChip({ label, value, onChange, options, defaultValue = "all" }: SelectChipProps) {
  const isActive = value !== defaultValue;
  const activeLabel = options.find((o) => o.value === value)?.label;

  return (
    <ChipShell
      label={label}
      badge={isActive ? "✓" : undefined}
      isActive={isActive}
      onClear={() => onChange(defaultValue)}
    >
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              value === opt.value
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </ChipShell>
  );
}

export default ChipShell;
