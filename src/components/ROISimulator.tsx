import { useState, useMemo } from "react";
import { Property } from "@/lib/propertyData";
import { Calculator, TrendingUp, DollarSign, Percent, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { getRenovationCosts } from "@/pages/Settings";

interface ROISimulatorProps {
  property: Property;
  valorPotencialTotal: number | null;
  renovCostEstimate?: number;
}

const ROISimulator = ({ property, valorPotencialTotal, renovCostEstimate }: ROISimulatorProps) => {
  const defaultRenovCost = renovCostEstimate ?? Math.round(property.price * 0.1);
  const [renovCost, setRenovCost] = useState(defaultRenovCost);
  const [additionalCosts, setAdditionalCosts] = useState(0);
  const [customSalePrice, setCustomSalePrice] = useState<number | null>(null);

  const salePrice = customSalePrice ?? valorPotencialTotal ?? property.price;
  const totalInvestment = property.price + renovCost + additionalCosts;
  const netProfit = salePrice - totalInvestment;
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const profitMargin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;

  // Build presets from user's configured renovation costs (Settings)
  const presets = useMemo(() => {
    const surfM2 = property.surfaceCovered || property.surfaceTotal || 50;
    const costs = getRenovationCosts();
    // Pick 3 representative tiers: low cost, mid cost, high cost
    const nonZero = costs.filter(c => c.costPerM2 > 0).sort((a, b) => a.costPerM2 - b.costPerM2);
    if (nonZero.length === 0) return [];
    const low = nonZero[0];
    const high = nonZero[nonZero.length - 1];
    const mid = nonZero[Math.floor(nonZero.length / 2)];
    const unique = Array.from(new Map([
      ["Mínima", low],
      ["Parcial", mid],
      ["Completa", high],
    ].map(([label, c]) => [`${(c as any).costPerM2}`, { label: label as string, costPerM2: (c as any).costPerM2, total: Math.round(surfM2 * (c as any).costPerM2) }])).values());
    return unique;
  }, [property.surfaceCovered, property.surfaceTotal]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Simulador ROI</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px] text-xs">
              Calculá tu retorno estimado ingresando el costo de refacción y gastos adicionales. El precio de venta se toma del valor potencial o podés ajustarlo.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Investment breakdown */}
        <div className="space-y-3">
          {/* Purchase price (fixed) */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Precio de compra</span>
            <span className="font-mono font-semibold">USD {property.price.toLocaleString()}</span>
          </div>

          {/* Renovation cost with slider + presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-muted-foreground">Refacción estimada</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">USD</span>
                <Input
                  type="number"
                  value={renovCost}
                  onChange={(e) => setRenovCost(Number(e.target.value) || 0)}
                  className="w-24 h-7 text-xs font-mono text-right bg-secondary border-border"
                />
              </div>
            </div>
            <Slider
              min={0}
              max={Math.max(200000, renovCost * 2)}
              step={1000}
              value={[renovCost]}
              onValueChange={(v) => setRenovCost(v[0])}
              className="w-full"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {renovCostEstimate != null && renovCostEstimate !== renovCost && (
                <button
                  onClick={() => setRenovCost(renovCostEstimate)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  Estimada (${(renovCostEstimate / 1000).toFixed(0)}K)
                </button>
              )}
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setRenovCost(p.total)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                    renovCost === p.total
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {p.label} (${(p.total / 1000).toFixed(0)}K)
                </button>
              ))}
            </div>
          </div>

          {/* Additional costs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Gastos adicionales</span>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  Escritura, comisiones, impuestos, mudanza, etc.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">USD</span>
              <Input
                type="number"
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(Number(e.target.value) || 0)}
                className="w-24 h-7 text-xs font-mono text-right bg-secondary border-border"
              />
            </div>
          </div>

          <div className="border-t border-border/50 pt-3">
            {/* Sale price */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Precio de venta</span>
                {valorPotencialTotal && !customSalePrice && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Valor potencial</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">USD</span>
                <Input
                  type="number"
                  value={customSalePrice ?? valorPotencialTotal ?? property.price}
                  onChange={(e) => setCustomSalePrice(Number(e.target.value) || null)}
                  className="w-28 h-7 text-xs font-mono text-right bg-secondary border-border"
                />
              </div>
            </div>
            {customSalePrice && valorPotencialTotal && (
              <button
                onClick={() => setCustomSalePrice(null)}
                className="text-[10px] text-primary hover:underline"
              >
                Usar valor potencial (USD {valorPotencialTotal.toLocaleString()})
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`rounded-lg p-3 text-center ${netProfit >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-destructive/10 border border-destructive/20"}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Ganancia</span>
            </div>
            <span className={`text-lg font-bold font-mono ${netProfit >= 0 ? "text-green-500" : "text-destructive"}`}>
              {netProfit >= 0 ? "+" : ""}${(netProfit / 1000).toFixed(0)}K
            </span>
          </div>
          <div className={`rounded-lg p-3 text-center ${roi >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-destructive/10 border border-destructive/20"}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Percent className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">ROI</span>
            </div>
            <span className={`text-lg font-bold font-mono ${roi >= 0 ? "text-green-500" : "text-destructive"}`}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
            </span>
          </div>
          <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Margen</span>
            </div>
            <span className="text-lg font-bold font-mono text-foreground">
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="text-[10px] font-mono text-muted-foreground space-y-0.5 border-t border-border/50 pt-3">
          <div className="flex justify-between">
            <span>Inversión total</span>
            <span className="text-foreground/70">USD {totalInvestment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Precio de venta</span>
            <span className="text-foreground/70">USD {salePrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Ganancia neta</span>
            <span className={netProfit >= 0 ? "text-green-500" : "text-destructive"}>
              {netProfit >= 0 ? "+" : ""}USD {netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ROISimulator;
