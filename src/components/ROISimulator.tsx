import { useState, useMemo, useCallback } from "react";
import { Property } from "@/lib/propertyData";
import { Calculator, TrendingUp, DollarSign, Percent, Info, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface ROISimulatorProps {
  property: Property;
  valorPotencialTotal: number | null;
  renovCostEstimate?: number;
}

// Renovation scope items with estimated USD/m² cost
const RENOV_ITEMS = [
  { key: "pintura", label: "Pintura", costPerM2: 15 },
  { key: "pisos", label: "Pisos", costPerM2: 45 },
  { key: "banos", label: "Baños", costPerM2: 60 },
  { key: "cocina", label: "Cocina", costPerM2: 40 },
  { key: "electrica", label: "Eléctrica", costPerM2: 35 },
  { key: "plomeria", label: "Plomería", costPerM2: 30 },
  { key: "techos", label: "Techos", costPerM2: 50 },
  { key: "aberturas", label: "Aberturas", costPerM2: 40 },
] as const;

const ROISimulator = ({ property, valorPotencialTotal, renovCostEstimate }: ROISimulatorProps) => {
  const defaultRenovCost = renovCostEstimate ?? Math.round(property.price * 0.1);
  const [renovCost, setRenovCost] = useState(defaultRenovCost);
  const [additionalCosts, setAdditionalCosts] = useState(0);
  const [customSalePrice, setCustomSalePrice] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const surfM2 = property.surfaceCovered || property.surfaceTotal || 50;

  const toggleItem = useCallback((key: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      const item = RENOV_ITEMS.find(i => i.key === key)!;
      if (next.has(key)) {
        next.delete(key);
        setRenovCost(c => Math.max(0, c - Math.round(item.costPerM2 * surfM2)));
      } else {
        next.add(key);
        setRenovCost(c => c + Math.round(item.costPerM2 * surfM2));
      }
      return next;
    });
  }, [surfM2]);

  const salePrice = customSalePrice ?? valorPotencialTotal ?? property.price;
  const totalInvestment = property.price + renovCost + additionalCosts;
  const netProfit = salePrice - totalInvestment;
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const profitMargin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;

  const resetToEstimate = () => {
    setRenovCost(defaultRenovCost);
    setSelectedItems(new Set());
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Simulador ROI</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px] text-xs">
              Calculá tu retorno estimado. El costo de refacción arranca con la estimación de la IA. Podés ajustarlo con el slider o sumando rubros individuales.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-3">
          {/* Purchase price (fixed) */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Precio de compra</span>
            <span className="font-mono font-semibold">USD {property.price.toLocaleString()}</span>
          </div>

          {/* Renovation cost */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">Refacción</span>
                {renovCost !== defaultRenovCost && (
                  <button
                    onClick={resetToEstimate}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all"
                    title="Volver al estimado IA"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Est. ${(defaultRenovCost / 1000).toFixed(0)}K
                  </button>
                )}
              </div>
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
              max={200000}
              step={1000}
              value={[Math.min(renovCost, 200000)]}
              onValueChange={(v) => setRenovCost(v[0])}
              className="w-full"
            />

            {/* Renovation scope checkboxes */}
            <div className="mt-2">
              <span className="text-[10px] text-muted-foreground font-medium">Sumar rubros:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {RENOV_ITEMS.map((item) => {
                  const isOn = selectedItems.has(item.key);
                  const itemCost = Math.round(item.costPerM2 * surfM2);
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleItem(item.key)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                        isOn
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30"
                      }`}
                    >
                      {item.label} +${(itemCost / 1000).toFixed(0)}K
                    </button>
                  );
                })}
              </div>
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
