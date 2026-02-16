import { useMemo } from "react";
import { Property, NeighborhoodStats } from "@/lib/propertyData";
import { Info, MapPin, BarChart3, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NeighborhoodSectionProps {
  property: Property;
  allProperties: Property[];
  neighborhoodStats: Map<string, NeighborhoodStats>;
}

interface TypeComposition {
  type: string;
  count: number;
  pct: number;
  medianUsdM2: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const TYPE_LABELS: Record<string, string> = {
  departamento: "Depto",
  casa: "Casa",
  ph: "PH",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
  cochera: "Cochera",
  galpon: "Galpón",
};

const TYPE_COLORS: Record<string, string> = {
  departamento: "bg-blue-500",
  casa: "bg-emerald-500",
  ph: "bg-amber-500",
  terreno: "bg-purple-500",
  local: "bg-rose-500",
  oficina: "bg-cyan-500",
  cochera: "bg-gray-500",
  galpon: "bg-orange-500",
};

const NeighborhoodSection = ({ property, allProperties, neighborhoodStats }: NeighborhoodSectionProps) => {
  const stats = neighborhoodStats.get(property.neighborhood);

  const computed = useMemo(() => {
    const inNeighborhood = allProperties.filter(
      (p) => p.neighborhood === property.neighborhood && p.pricePerM2Total && p.pricePerM2Total > 0
    );
    const total = inNeighborhood.length;

    // Composition by type
    const typeMap = new Map<string, Property[]>();
    for (const p of inNeighborhood) {
      const t = (p.propertyType || "otro").toLowerCase();
      if (!typeMap.has(t)) typeMap.set(t, []);
      typeMap.get(t)!.push(p);
    }

    const comp: TypeComposition[] = [];
    const typeMedians = new Map<string, number>();
    for (const [type, props] of typeMap) {
      const prices = props.map((p) => p.pricePerM2Total!);
      const med = median(prices);
      comp.push({ type, count: props.length, pct: total > 0 ? Math.round((props.length / total) * 100) : 0, medianUsdM2: med });
      typeMedians.set(type, med);
    }
    comp.sort((a, b) => b.count - a.count);

    // Most valued type
    const topValueEntry = [...typeMedians].sort((a, b) => b[1] - a[1])[0] || null;

    // Density of opportunities
    const currentStats = neighborhoodStats.get(property.neighborhood);
    const med = currentStats?.medianPricePerSqm ?? 0;
    const opportunities = med > 0 ? inNeighborhood.filter((p) => p.pricePerM2Total! < med * 0.8).length : 0;
    const oppPct = total > 0 ? Math.round((opportunities / total) * 100) : 0;

    let dLabel = "Pocas oportunidades";
    let dColor = "text-red-400";
    if (oppPct > 25) { dLabel = "Muchas oportunidades"; dColor = "text-green-500"; }
    else if (oppPct > 10) { dLabel = "Oportunidades moderadas"; dColor = "text-yellow-500"; }

    // Price distribution buckets
    const prices = inNeighborhood.map((p) => p.pricePerM2Total!);
    if (prices.length === 0) return null;
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const bucketCount = 8;
    const step = (maxP - minP) / bucketCount || 1;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      from: Math.round(minP + i * step),
      to: Math.round(minP + (i + 1) * step),
      count: 0,
      hasProperty: false,
    }));
    for (const price of prices) {
      const idx = Math.min(Math.floor((price - minP) / step), bucketCount - 1);
      buckets[idx].count++;
    }
    if (property.pricePerM2Total) {
      const idx = Math.min(Math.floor((property.pricePerM2Total - minP) / step), bucketCount - 1);
      buckets[idx].hasProperty = true;
    }

    return {
      composition: comp.slice(0, 3),
      totalInNeighborhood: total,
      densityLabel: dLabel,
      densityColor: dColor,
      priceDistribution: buckets,
      topValueEntry,
    };
  }, [property, allProperties, neighborhoodStats]);

  if (!stats || !computed) return null;

  const { composition, totalInNeighborhood, densityLabel, densityColor, priceDistribution, topValueEntry } = computed;
  const maxBucketCount = Math.max(...priceDistribution.map((b) => b.count), 1);

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">{property.neighborhood}</span>
        <span className="text-[10px] text-muted-foreground">· {property.city}</span>
        <Tooltip>
          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50 ml-auto" /></TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px] text-xs">
            Contexto del barrio basado en {totalInNeighborhood} propiedades analizadas. Muestra composición, distribución de precios y potencial de reventa.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="block text-[10px] text-muted-foreground">Mediana</span>
          <span className="text-xs font-bold font-mono">${stats.medianPricePerSqm.toLocaleString()}/m²</span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground">Rango</span>
          <span className="text-xs font-mono">${stats.minPricePerSqm.toLocaleString()} - ${stats.maxPricePerSqm.toLocaleString()}</span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground">Props.</span>
          <span className="text-xs font-bold font-mono">{totalInNeighborhood}</span>
        </div>
      </div>

      {/* Mini distribution chart */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <BarChart3 className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Distribución USD/m²</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-2.5 w-2.5 text-muted-foreground/50" /></TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              Histograma de precios por m² en el barrio. La barra destacada indica dónde se ubica esta propiedad.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-end gap-[2px] h-10">
          {priceDistribution.map((bucket, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={`flex-1 rounded-t-sm transition-colors ${
                    bucket.hasProperty
                      ? "bg-primary"
                      : "bg-muted-foreground/20 hover:bg-muted-foreground/30"
                  }`}
                  style={{ height: `${Math.max((bucket.count / maxBucketCount) * 100, 4)}%` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                ${bucket.from.toLocaleString()} - ${bucket.to.toLocaleString()}/m² · {bucket.count} props
                {bucket.hasProperty && " ← Esta propiedad"}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-muted-foreground">${stats.minPricePerSqm.toLocaleString()}</span>
          <span className="text-[8px] text-muted-foreground">${stats.maxPricePerSqm.toLocaleString()}</span>
        </div>
      </div>

      {/* Composition by type - top 3 */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Composición</span>
          <Tooltip>
            <TooltipTrigger><Info className="h-2.5 w-2.5 text-muted-foreground/50" /></TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              Tipos de propiedad predominantes y su USD/m² mediano. Indica qué se valora más en la zona.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden mb-2">
          {composition.map((c) => (
            <Tooltip key={c.type}>
              <TooltipTrigger asChild>
                <div
                  className={`${TYPE_COLORS[c.type] || "bg-gray-400"} transition-all`}
                  style={{ width: `${c.pct}%` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                {TYPE_LABELS[c.type] || c.type}: {c.count} props ({c.pct}%) · Mediana ${c.medianUsdM2.toLocaleString()}/m²
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {composition.map((c) => (
            <div key={c.type} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${TYPE_COLORS[c.type] || "bg-gray-400"}`} />
              <span className="text-[10px] text-muted-foreground">
                {TYPE_LABELS[c.type] || c.type} {c.pct}%
              </span>
              <span className="text-[10px] font-mono text-foreground/70">${c.medianUsdM2.toLocaleString()}/m²</span>
            </div>
          ))}
        </div>
      </div>

      {/* Market insights row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Más valorado:</span>
          <span className="text-[10px] font-medium text-foreground">
            {topValueEntry ? `${TYPE_LABELS[topValueEntry[0]] || topValueEntry[0]} ($${topValueEntry[1].toLocaleString()}/m²)` : "—"}
          </span>
        </div>
        <span className={`text-[10px] font-medium ${densityColor}`}>
          {densityLabel}
        </span>
      </div>

      {/* Future placeholder */}
      <div className="flex items-center gap-1.5 pt-1 opacity-50">
        <span className="text-[9px] text-muted-foreground italic">📈 Tendencias y predicciones · Próximamente</span>
      </div>
    </div>
  );
};

export default NeighborhoodSection;
