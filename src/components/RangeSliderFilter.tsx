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
}: RangeSliderFilterProps) => {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());
  const isActive = value[0] > min || value[1] < max;

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
      <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
        <span>{fmt(value[0])}{unit}</span>
        <span>{fmt(value[1])}{unit}</span>
      </div>
    </div>
  );
};

export default RangeSliderFilter;
