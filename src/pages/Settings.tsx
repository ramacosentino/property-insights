import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { CheckCircle, AlertCircle, Clock, Loader2, ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";

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
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-full hover:bg-secondary transition-all text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold">Historial de cargas</h2>
            <p className="text-sm text-muted-foreground">Registro de todas las importaciones de CSV</p>
          </div>
        </div>

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
                          {log.source === "manual" ? "Manual" : log.source === "job" ? "Job" : "API"}
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
                          <span>{log.source === "manual" ? "Carga manual (UI)" : "API externa"}</span>
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
    </Layout>
  );
};

export default Settings;
