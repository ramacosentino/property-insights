import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { CheckCircle, AlertCircle, Clock, Loader2, ArrowLeft, Download, Wrench, Save } from "lucide-react";
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
  { label: "Refacción parcial (0.6 – 0.69)", minScore: 0.6, maxScore: 0.69, costPerM2: 500 },
  { label: "Refacción completa (< 0.6)", minScore: -Infinity, maxScore: 0.59, costPerM2: 700 },
];

const STORAGE_KEY = "renovation_costs";

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

const RenovationCostsSection = () => {
  const { toast } = useToast();
  const [costs, setCosts] = useState(loadRenovationCosts);

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
    toast({ title: "✅ Costos guardados", description: "Los costos de refacción se actualizaron." });
  };

  const handleReset = () => {
    setCosts(DEFAULT_RENOVATION_COSTS);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Valores restaurados", description: "Se restauraron los costos por defecto." });
  };

  return (
    <div className="glass-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">Costos de refacción por m²</h3>
          <p className="text-xs text-muted-foreground">
            Estos valores se usan para estimar la Ganancia Neta en el análisis de propiedades.
          </p>
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
  );
};

const Settings = () => {
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <div>
          <h3 className="text-base font-semibold mb-3">Historial de cargas</h3>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No hay cargas registradas aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const cfg = statusConfig[log.status] || statusConfig.running;
                const isExpanded = expandedId === log.id;

                return (
                  <div key={log.id}
                    className="glass-card rounded-xl border border-border overflow-hidden">
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
      </div>
    </Layout>
  );
};

export default Settings;
