import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { CheckCircle, AlertCircle, Clock, Loader2, ArrowLeft, Download, Wrench, Save, ChevronDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UploadLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  source: string;
  status: string;
  total_rows: number;
  processed: number;
  skipped: number;
  errors: string[] | null;
  error_message: string | null;
  filename: string | null;
  file_url: string | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  success: { icon: <CheckCircle className="h-4 w-4" />, label: "Exitoso", className: "text-green-500" },
  partial: { icon: <AlertCircle className="h-4 w-4" />, label: "Parcial", className: "text-yellow-500" },
  error: { icon: <AlertCircle className="h-4 w-4" />, label: "Error", className: "text-destructive" },
  running: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: "En curso", className: "text-primary" },
};

// Default renovation costs per m² by score range
const DEFAULT_RENOVATION_COSTS = [
  { label: "Excelente (≥ 1.0)", minScore: 1.0, maxScore: Infinity, costPerM2: 0 },
  { label: "Buen estado (0.9 – 0.99)", minScore: 0.9, maxScore: 0.99, costPerM2: 100 },
  { label: "Aceptable (0.8 – 0.89)", minScore: 0.8, maxScore: 0.89, costPerM2: 200 },
  { label: "Necesita mejoras (0.7 – 0.79)", minScore: 0.7, maxScore: 0.79, costPerM2: 350 },
  { label: "Refacción parcial (0.55 – 0.69)", minScore: 0.55, maxScore: 0.69, costPerM2: 500 },
  { label: "Refacción completa (< 0.55)", minScore: -Infinity, maxScore: 0.54, costPerM2: 700 },
];

const STORAGE_KEY = "renovation_costs";
const SURFACE_TYPE_KEY = "renovation_surface_type";
const MIN_SURFACE_KEY = "renovation_min_surface_enabled";

export type SurfaceType = "total" | "covered";

function loadRenovationCosts(): typeof DEFAULT_RENOVATION_COSTS {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_RENOVATION_COSTS;
}

export function getRenovationCosts() {
  return loadRenovationCosts();
}

export function getSurfaceType(): SurfaceType {
  try {
    const saved = localStorage.getItem(SURFACE_TYPE_KEY);
    if (saved === "covered") return "covered";
  } catch {}
  return "total";
}

export function getMinSurfaceEnabled(): boolean {
  try {
    const saved = localStorage.getItem(MIN_SURFACE_KEY);
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch {}
  return true; // enabled by default
}

const RenovationCostsSection = () => {
  const { toast } = useToast();
  const [costs, setCosts] = useState(loadRenovationCosts);
  const [surfaceType, setSurfaceType] = useState<SurfaceType>(getSurfaceType);
  const [minSurfaceEnabled, setMinSurfaceEnabled] = useState(getMinSurfaceEnabled);
  const handleChange = (index: number, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setCosts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], costPerM2: num };
      return next;
    });
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(costs));
    localStorage.setItem(SURFACE_TYPE_KEY, surfaceType);
    localStorage.setItem(MIN_SURFACE_KEY, String(minSurfaceEnabled));
    toast({ title: "✅ Costos guardados", description: `Costos de refacción actualizados (superficie ${surfaceType === "total" ? "total" : "cubierta"}).` });
  };

  const handleReset = () => {
    setCosts(DEFAULT_RENOVATION_COSTS);
    setSurfaceType("total");
    setMinSurfaceEnabled(true);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SURFACE_TYPE_KEY);
    localStorage.removeItem(MIN_SURFACE_KEY);
    toast({ title: "Valores restaurados", description: "Se restauraron los costos y superficie por defecto." });
  };

  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="glass-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center gap-2 text-left hover:bg-secondary/30 transition-all"
      >
        <Wrench className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="text-base font-semibold">Costos de refacción por m²</h3>
          <p className="text-xs text-muted-foreground">
            Estos valores se usan para estimar la Ganancia Neta en el análisis de propiedades.
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
      <div className="px-5 pb-5 space-y-4">

      {/* Toggles side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Surface type toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground font-medium">Superficie</span>
            <Tooltip>
              <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-xs">
                Define sobre qué superficie se calculan los costos de refacción. <strong>Total</strong>: m² totales. <strong>Cubierta</strong>: solo m² techados. Comparables y valor potencial siempre usan total.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
            <button
              onClick={() => setSurfaceType("total")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${
                surfaceType === "total" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setSurfaceType("covered")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${
                surfaceType === "covered" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cubierta
            </button>
          </div>
        </div>

        {/* Min surface logic toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground font-medium">Piso mínimo</span>
            <Tooltip>
              <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px] text-xs">
                Si usás superficie cubierta y los m² cubiertos son menores a la mitad de los totales, se usa <strong>m² totales ÷ 2</strong> como base. Una casa chica en terreno grande probablemente necesite ampliación.
              </TooltipContent>
            </Tooltip>
          </div>
          <button
            onClick={() => setMinSurfaceEnabled(!minSurfaceEnabled)}
            disabled={surfaceType !== "covered"}
            className={`relative w-9 h-[18px] rounded-full transition-all ${
              minSurfaceEnabled && surfaceType === "covered" ? "bg-primary" : "bg-muted-foreground/30"
            } ${surfaceType !== "covered" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${
              minSurfaceEnabled ? "translate-x-[18px]" : ""
            }`} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {costs.map((tier, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-secondary/30">
            <span className="text-sm text-foreground flex-1">{tier.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">USD</span>
              <input
                type="number"
                min={0}
                value={tier.costPerM2}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">/m²</span>
            </div>
          </div>
        ))}
      </div>

      {/* Glossary */}
      <div className="rounded-lg border border-border/50 p-3 space-y-2">
        <div className="flex items-center gap-1">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Glosario de estados</span>
        </div>
        <div className="grid gap-1.5 text-[11px]">
          <div className="flex gap-2">
            <span className="font-medium text-green-500 w-28 flex-shrink-0">Excelente (≥ 1.0)</span>
            <span className="text-muted-foreground">A estrenar o recién reformado. Terminaciones premium, luminosidad destacada. No requiere inversión.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-emerald-400 w-28 flex-shrink-0">Buen estado (0.9–0.99)</span>
            <span className="text-muted-foreground">Bien mantenido, limpio, sin problemas visibles. Solo detalles estéticos menores (pintura, pequeños arreglos).</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-foreground w-28 flex-shrink-0">Aceptable (0.8–0.89)</span>
            <span className="text-muted-foreground">Uso normal, terminaciones estándar. Puede necesitar actualización de cocina/baño, pintura general.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-yellow-500 w-28 flex-shrink-0">Necesita mejoras (0.7–0.79)</span>
            <span className="text-muted-foreground">Pintura deteriorada, pisos gastados, instalaciones viejas. Requiere inversión moderada en actualización.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-orange-500 w-28 flex-shrink-0">Refacción parcial (0.55–0.69)</span>
            <span className="text-muted-foreground">Baños y/o cocina obsoletos, instalaciones eléctricas/sanitarias a renovar. Estructura sólida pero interiores deteriorados.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-red-500 w-28 flex-shrink-0">Refacción completa (&lt; 0.55)</span>
            <span className="text-muted-foreground">Requiere intervención total: instalaciones, pisos, paredes, aberturas. Posibles problemas de humedad o estructura. Puede incluir ampliación.</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          Restaurar valores
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5"
        >
          <Save className="h-3 w-3" />
          Guardar
        </button>
      </div>
      </div>
      )}
    </div>
    </TooltipProvider>
  );
};

const Settings = () => {
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("upload_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (!error && data) setLogs(data as UploadLog[]);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
      " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-secondary transition-all text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold">Configuración</h2>
            <p className="text-sm text-muted-foreground">Ajustes de análisis e historial de cargas</p>
          </div>
        </div>

        {/* Renovation costs */}
        <RenovationCostsSection />

        {/* Upload history */}
        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full px-5 py-4 flex items-center gap-2 text-left hover:bg-secondary/30 transition-all"
          >
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Historial de cargas</h3>
              <p className="text-xs text-muted-foreground">Registro de todas las importaciones de CSV</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${historyOpen ? "rotate-180" : ""}`} />
          </button>

          {historyOpen && (
          <div className="px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay cargas registradas aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const cfg = statusConfig[log.status] || statusConfig.running;
                const isExpanded = expandedId === log.id;

                return (
                  <div key={log.id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-all"
                    >
                      <span className={cfg.className}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{formatDate(log.started_at)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.source === "manual" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                            {log.source === "manual" ? "Manual" : "Automática"}
                          </span>
                          <span className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                          {log.filename && <span className="truncate max-w-[200px]">{log.filename}</span>}
                          <span>{log.processed} procesadas</span>
                          <span>{log.skipped} omitidas</span>
                          <span>{log.total_rows} total</span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-border/50 pt-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Inicio:</span>{" "}
                            <span>{formatDate(log.started_at)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fin:</span>{" "}
                            <span>{log.finished_at ? formatDate(log.finished_at) : "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fuente:</span>{" "}
                            <span>{log.source === "manual" ? "Carga manual (UI)" : "Carga automática (API)"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Archivo:</span>{" "}
                            <span>{log.filename || "—"}</span>
                          </div>
                        </div>
                        {log.file_url && (
                          <div className="mt-2">
                            <button
                              onClick={async () => {
                                const { data } = await supabase.storage.from("upload-csvs").createSignedUrl(log.file_url!, 3600);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              }}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Download className="h-3 w-3" /> Descargar CSV original
                            </button>
                          </div>
                        )}
                        {log.errors && log.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-destructive font-medium mb-1">Errores:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                              {log.errors.map((err, i) => (
                                <li key={i} className="text-destructive/80">• {err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
