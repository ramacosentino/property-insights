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

const CsvUploadButton = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFile = async (file: File) => {
    setUploading(true);
    setResult(null);

    try {
      const csv = await file.text();
      const { data, error } = await supabase.functions.invoke("upload-properties", {
        body: { csv, delimiter: ";" },
      });

      if (error) {
        setResult({ success: false, error: error.message });
      } else {
        setResult(data as UploadResult);
        if (data?.success) {
          // Invalidate properties cache so pages reload
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        }
      }
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : "Error desconocido" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        title="Subir CSV actualizado"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : result?.success ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : result && !result.success ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Subiendo..." : "CSV"}
      </button>
      {result && !uploading && (
        <div className="absolute top-full right-0 mt-2 glass-card rounded-xl p-3 text-xs z-50 min-w-[200px] shadow-lg border border-border">
          {result.success ? (
            <>
              <p className="text-green-500 font-medium mb-1">✓ Carga exitosa</p>
              <p className="text-muted-foreground">{result.processed} procesadas, {result.skipped} omitidas</p>
            </>
          ) : (
            <p className="text-destructive">{result.error}</p>
          )}
          <button
            onClick={() => setResult(null)}
            className="mt-2 text-muted-foreground hover:text-foreground text-[10px]"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default CsvUploadButton;
