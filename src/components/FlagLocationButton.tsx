import { useState } from "react";
import { MapPinOff, MapPin, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlagLocationButtonProps {
  address: string;
  onManualCorrection?: (address: string) => void;
  compact?: boolean;
}

export default function FlagLocationButton({ address, onManualCorrection, compact }: FlagLocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const handleFlag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("flag-address", {
        body: { address },
      });

      if (error) throw error;

      setFlagged(true);
      toast.success("Dirección marcada para re-geocodificación", {
        description: "Se reintentará con variantes en el próximo ciclo.",
        action: onManualCorrection
          ? { label: "Corregir manual", onClick: () => onManualCorrection(address) }
          : undefined,
      });
    } catch (err) {
      toast.error("Error al marcar dirección");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (flagged) {
    return (
      <button
        disabled
        className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-secondary/50 border border-border/50"
      >
        <Check className="h-3 w-3" />
        {!compact && "Reportada"}
      </button>
    );
  }

  return (
    <button
      onClick={handleFlag}
      disabled={loading}
      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive px-2 py-1 rounded-full hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
      title="Reportar ubicación incorrecta"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPinOff className="h-3 w-3" />}
      {!compact && "Ubicación incorrecta"}
    </button>
  );
}
