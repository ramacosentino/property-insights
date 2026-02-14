import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface RangeSliderFilterProps {
  title: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (v: number) => string;
  unit?: string;
  /** When true, the max value represents "X or more" */
  cappedMax?: boolean;
}

const RangeSliderFilter = ({
  title,
  min,
  max,
  value,
  onChange,
  step = 1,
  formatValue,
  unit = "",
  cappedMax = false,
}: RangeSliderFilterProps) => {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());
  const isActive = value[0] > min || value[1] < max;

  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  const commitMin = () => {
    setEditingMin(false);
    const parsed = parseInt(minInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(parsed, value[1]));
      onChange([clamped, value[1]]);
    }
  };

  const commitMax = () => {
    setEditingMax(false);
    const parsed = parseInt(maxInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(value[0], Math.min(parsed, max));
      onChange([value[0], clamped]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {isActive && (
          <button
            onClick={() => onChange([min, max])}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </button>
        )}
      </div>
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
  );
};

export default RangeSliderFilter;
