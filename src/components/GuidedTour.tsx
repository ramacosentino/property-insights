import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Map, Search, Star, TrendingUp, SlidersHorizontal, Bell, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'a[href="/mapa"]',
    title: "Mapa interactivo",
    description: "Explorá propiedades geolocalizadas con precios por m² codificados por color. Visualizá oportunidades y zonas de interés en tiempo real.",
    icon: <Map className="h-5 w-5" />,
    position: "right",
  },
  {
    target: 'a[href="/propiedades"]',
    title: "Listado de propiedades",
    description: "Navegá todas las propiedades disponibles con filtros avanzados. Cada propiedad incluye análisis de oportunidad y score de inversión.",
    icon: <Layers className="h-5 w-5" />,
    position: "right",
  },
  {
    target: 'a[href="/mis-proyectos"]',
    title: "Mis Proyectos",
    description: "Guardá propiedades que te interesan, tomá notas y hacé seguimiento. Compará propiedades lado a lado para tomar mejores decisiones.",
    icon: <Star className="h-5 w-5" />,
    position: "right",
  },
  {
    target: 'a[href="/busqueda"]',
    title: "Búsqueda inteligente",
    description: "Lanzá búsquedas con IA que analizan cientos de propiedades y te devuelven las mejores oportunidades según tus criterios.",
    icon: <Search className="h-5 w-5" />,
    position: "right",
  },
  {
    target: 'a[href="/inteligencia-precios"]',
    title: "Inteligencia de precios",
    description: "Accedé a rankings por barrio, medianas de precios, tendencias del mercado y estadísticas detalladas por zona y tipo de propiedad.",
    icon: <TrendingUp className="h-5 w-5" />,
    position: "right",
  },
  {
    target: 'a[href="/alertas"]',
    title: "Alertas",
    description: "Configurá alertas personalizadas por zona, precio y tipo de propiedad. Recibí notificaciones cuando aparezcan nuevas oportunidades.",
    icon: <Bell className="h-5 w-5" />,
    position: "right",
  },
];

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const positionTooltip = useCallback(() => {
    const el = document.querySelector(currentStep.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pad = 8;

    // Highlight the target element
    setHighlightStyle({
      position: "fixed",
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      borderRadius: "10px",
      pointerEvents: "none",
    });

    const pos = currentStep.position || "right";
    const tooltipW = 320;

    if (pos === "right") {
      setTooltipStyle({
        position: "fixed",
        top: rect.top - 10,
        left: rect.right + pad + 12,
        width: tooltipW,
      });
      setArrowStyle({
        position: "absolute",
        top: 20,
        left: -6,
        width: 12,
        height: 12,
        transform: "rotate(45deg)",
      });
    } else if (pos === "bottom") {
      setTooltipStyle({
        position: "fixed",
        top: rect.bottom + pad + 12,
        left: rect.left + rect.width / 2 - tooltipW / 2,
        width: tooltipW,
      });
      setArrowStyle({
        position: "absolute",
        top: -6,
        left: "50%",
        marginLeft: -6,
        width: 12,
        height: 12,
        transform: "rotate(45deg)",
      });
    }
  }, [currentStep]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [positionTooltip]);

  // Elevate target element above overlay so it's not blurred
  useEffect(() => {
    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const prev = {
      zIndex: el.style.zIndex,
      position: el.style.position,
      background: el.style.background,
      borderRadius: el.style.borderRadius,
    };
    el.style.position = "relative";
    el.style.zIndex = "10001";
    el.style.background = "hsl(var(--sidebar-background, var(--background)))";
    el.style.borderRadius = "8px";
    return () => {
      el.style.zIndex = prev.zIndex;
      el.style.position = prev.position;
      el.style.background = prev.background;
      el.style.borderRadius = prev.borderRadius;
    };
  }, [currentStep.target]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onSkip} />

      {/* Highlight ring */}
      <div
        style={highlightStyle}
        className="border-2 border-primary shadow-[0_0_0_4000px_rgba(0,0,0,0.4)] z-[10001]"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="z-[10002] animate-in fade-in-0 slide-in-from-left-2 duration-300"
      >
        {/* Arrow */}
        <div style={arrowStyle} className="bg-popover border-l border-t border-border" />

        <div className="bg-popover border border-border rounded-xl shadow-2xl p-4 relative">
          {/* Close */}
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Step counter */}
          <div className="flex items-center gap-1.5 mb-3">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {currentStep.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">{currentStep.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{currentStep.description}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <button
              onClick={onSkip}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Saltar tour
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={handlePrev} className="h-7 px-2 text-xs">
                  <ChevronLeft className="h-3 w-3 mr-0.5" />
                  Atrás
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="h-7 px-3 text-xs">
                {isLast ? "¡Empezar!" : "Siguiente"}
                {!isLast && <ChevronRight className="h-3 w-3 ml-0.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
