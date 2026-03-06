import { useState } from "react";
import { Check, ChevronUp, X, HelpCircle } from "lucide-react";
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

  return (
    <div className="fixed bottom-4 left-20 z-[1300]">
      {/* Expanded panel */}
      {expanded && (
        <div className="mb-2 w-72 bg-popover border border-border rounded-xl shadow-lg p-3 space-y-1.5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-foreground">Descubrí Urbanna</p>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
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

      {/* Small pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="h-8 px-2.5 flex items-center gap-1.5 bg-popover border border-border rounded-lg shadow-md hover:shadow-lg transition-all text-xs font-semibold text-foreground"
      >
        {allCompleted ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <span className="text-primary">{completedCount}/{items.length}</span>
        )}
        <ChevronUp className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}