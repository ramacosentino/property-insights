import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Rocket, X, HelpCircle } from "lucide-react";
import { DiscoveryChecklist as ChecklistType } from "@/hooks/useTour";

interface DiscoveryChecklistProps {
  checklist: ChecklistType;
  items: { key: keyof ChecklistType; label: string; description: string }[];
  completedCount: number;
  allCompleted: boolean;
  onRestartTour: () => void;
}

export default function DiscoveryChecklist({
  checklist,
  items,
  completedCount,
  allCompleted,
  onRestartTour,
}: DiscoveryChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && allCompleted) return null;

  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <div className="fixed bottom-4 right-4 z-[9000] w-72 animate-in slide-in-from-bottom-4 duration-500">
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-popover border border-border rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        <div className="relative h-8 w-8 shrink-0">
          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
            <circle
              cx="16" cy="16" r="13" fill="none" stroke="currentColor"
              className="text-primary transition-all duration-500"
              strokeWidth="3"
              strokeDasharray={`${progress * 0.817} 100`}
              strokeLinecap="round"
            />
          </svg>
          {allCompleted ? (
            <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-primary" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
              {completedCount}/{items.length}
            </span>
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {allCompleted ? "¡Tour completado!" : "Descubrí Urbanna"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {allCompleted ? "Exploraste todas las funciones" : `${completedCount} de ${items.length} completados`}
          </p>
        </div>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {/* Expanded list */}
      {expanded && (
        <div className="mt-1.5 bg-popover border border-border rounded-xl shadow-lg p-3 space-y-1.5 animate-in slide-in-from-bottom-2 duration-200">
          {items.map((item) => {
            const done = checklist[item.key];
            return (
              <div
                key={item.key}
                className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                  done ? "opacity-60" : "bg-secondary/50"
                }`}
              >
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  done ? "bg-primary border-primary" : "border-muted-foreground/30"
                }`}>
                  {done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={onRestartTour}
              className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
            >
              <HelpCircle className="h-3 w-3" />
              Repetir tour
            </button>
            {allCompleted && (
              <button
                onClick={() => setDismissed(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
