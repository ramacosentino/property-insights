import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface UploadResult {
  success: boolean;
  processed?: number;
  skipped?: number;
  errors?: string[];
  total_lines?: number;
  error?: string;
}

const CHUNK_LINES = 50;

function splitCsvIntoChunks(csv: string): string[] {
  const lines = csv.split(/\r?\n/);
  const header = lines[0];
  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");
  const chunks: string[] = [];
  for (let i = 0; i < dataLines.length; i += CHUNK_LINES) {
    chunks.push(header + "\n" + dataLines.slice(i, i + CHUNK_LINES).join("\n"));
  }
  return chunks;
}

const CsvUploadButton = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFile = async (file: File) => {
    setUploading(true);
    setResult(null);
    setProgress("");

    try {
      const csv = await file.text();
      const chunks = splitCsvIntoChunks(csv);

      // Create log entry (also stores the full CSV)
      const { data: logData } = await supabase.functions.invoke("upload-log", {
        body: { action: "create_log", source: "manual", filename: file.name, csv },
      });
      const logId = logData?.id;

      let totalProcessed = 0;
      let totalSkipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setProgress(`Lote ${i + 1}/${chunks.length}`);
        const { data, error } = await supabase.functions.invoke("upload-properties", {
          body: { csv: chunks[i], delimiter: ";", source: "manual", filename: file.name, log_id: logId },
        });
        if (error) {
          allErrors.push(`Lote ${i + 1}: ${error.message}`);
        } else if (data) {
          totalProcessed += data.processed || 0;
          totalSkipped += data.skipped || 0;
          if (data.errors) allErrors.push(...data.errors);
        }
      }

      // Finalize log
      const finalStatus = allErrors.length > 0 ? (totalProcessed > 0 ? "partial" : "error") : "success";
      if (logId) {
        await supabase.functions.invoke("upload-log", {
          body: { action: "finalize_log", log_id: logId, status: finalStatus },
        });
      }

      setResult({
        success: allErrors.length === 0,
        processed: totalProcessed,
        skipped: totalSkipped,
        errors: allErrors.length > 0 ? allErrors : undefined,
        total_lines: totalProcessed + totalSkipped,
      });

      if (totalProcessed > 0) {
        queryClient.invalidateQueries({ queryKey: ["properties"] });
      }
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : "Error desconocido" });
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="relative">
      <input ref={fileRef} type="file" accept=".csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        title="Subir CSV actualizado">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" />
          : result?.success ? <CheckCircle className="h-4 w-4 text-green-500" />
          : result && !result.success ? <AlertCircle className="h-4 w-4 text-destructive" />
          : <Upload className="h-4 w-4" />}
        {uploading ? progress || "Subiendo..." : "CSV"}
      </button>
      {result && !uploading && (
        <div className="absolute top-full right-0 mt-2 glass-card rounded-xl p-3 text-xs z-50 min-w-[200px] shadow-lg border border-border">
          {result.success ? (
            <>
              <p className="text-green-500 font-medium mb-1">✓ Carga exitosa</p>
              <p className="text-muted-foreground">{result.processed} procesadas, {result.skipped} omitidas</p>
            </>
          ) : (
            <>
              <p className="text-destructive font-medium mb-1">Errores en carga</p>
              {result.processed !== undefined && (
                <p className="text-muted-foreground mb-1">{result.processed} procesadas, {result.skipped} omitidas</p>
              )}
            </>
          )}
          <button onClick={() => setResult(null)}
            className="mt-2 text-muted-foreground hover:text-foreground text-[10px]">Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default CsvUploadButton;
