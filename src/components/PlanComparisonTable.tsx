import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_COLUMNS = ["Free", "Pro", "Premium", "Corporativo"] as const;

type CellValue = string | boolean;

interface FeatureRow {
  label: string;
  values: [CellValue, CellValue, CellValue, CellValue];
}

const featureRows: FeatureRow[] = [
  { label: "Mapa interactivo", values: [true, true, true, true] },
  { label: "Análisis IA", values: ["5 / mes", "50 / mes", "Ilimitados", "Ilimitados"] },
  { label: "Búsquedas inteligentes", values: ["3 / mes", "30 / mes", "Ilimitadas", "Ilimitadas"] },
  { label: "Comparativos", values: ["5 / mes", "50 / mes", "Ilimitados", "Ilimitados"] },
  { label: "Proyectos guardados", values: ["10", "Ilimitados", "Ilimitados", "Ilimitados"] },
  { label: "Alertas activas", values: ["1", "10", "Ilimitadas", "Ilimitadas"] },
  { label: "Exportar datos", values: [false, true, true, true] },
  { label: "Tasación automática", values: [false, false, true, true] },
  { label: "Inteligencia de precios", values: [false, false, true, true] },
  { label: "Usuarios múltiples", values: [false, false, false, true] },
  { label: "API dedicada", values: [false, false, false, true] },
  { label: "Soporte prioritario", values: [false, false, false, true] },
];

function CellContent({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Check className="h-3 w-3 text-primary" />
      </div>
    ) : (
      <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm text-foreground font-medium">{value}</span>;
}

interface Props {
  className?: string;
  variant?: "landing" | "app";
}

export default function PlanComparisonTable({ className, variant = "app" }: Props) {
  const isLanding = variant === "landing";

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className={cn(
              "text-left py-3 px-4 font-medium border-b",
              isLanding ? "text-landing-muted border-landing-card-border" : "text-muted-foreground border-border"
            )}>
              Funcionalidad
            </th>
            {PLAN_COLUMNS.map((col) => (
              <th
                key={col}
                className={cn(
                  "text-center py-3 px-3 font-semibold border-b",
                  isLanding ? "text-landing-fg border-landing-card-border" : "text-foreground border-border",
                  (col === "Pro" || col === "Premium") && "text-primary"
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureRows.map((row, i) => (
            <tr
              key={row.label}
              className={cn(
                i % 2 === 0
                  ? isLanding ? "bg-landing-card/30" : "bg-muted/30"
                  : ""
              )}
            >
              <td className={cn(
                "py-3 px-4 border-b",
                isLanding ? "text-landing-muted border-landing-card-border" : "text-muted-foreground border-border"
              )}>
                {row.label}
              </td>
              {row.values.map((val, j) => (
                <td
                  key={j}
                  className={cn(
                    "text-center py-3 px-3 border-b",
                    isLanding ? "border-landing-card-border" : "border-border"
                  )}
                >
                  <CellContent value={val} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
