import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";

interface ManualLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  onCorrected?: () => void;
}

export default function ManualLocationDialog({ open, onOpenChange, address, onCorrected }: ManualLocationDialogProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!open || !mapRef.current) return;

    // Small delay to let dialog render
    const timeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, {
        center: [-34.5, -58.5],
        zoom: 12,
      });

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        attribution: '&copy; CARTO',
      }).addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setSelectedPos([lat, lng]);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true,
          }).addTo(map);

          markerRef.current.on("dragend", () => {
            const pos = markerRef.current!.getLatLng();
            setSelectedPos([pos.lat, pos.lng]);
          });
        }
      });

      mapInstanceRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, isDark]);

  const handleSave = async () => {
    if (!selectedPos) return;
    setSaving(true);

    try {
      const { error } = await supabase.functions.invoke("flag-address", {
        body: { address, lat: selectedPos[0], lng: selectedPos[1], manual: true },
      });

      if (error) throw error;

      toast.success("Ubicación corregida manualmente");
      onOpenChange(false);
      onCorrected?.();
    } catch (err) {
      toast.error("Error al guardar ubicación");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Corregir ubicación</DialogTitle>
          <DialogDescription className="text-xs">
            Hacé click en el mapa para marcar la ubicación correcta de: <strong>{address}</strong>
          </DialogDescription>
        </DialogHeader>

        <div
          ref={mapRef}
          className="w-full h-[350px] rounded-lg border border-border overflow-hidden"
        />

        {selectedPos && (
          <p className="text-xs text-muted-foreground font-mono text-center">
            {selectedPos[0].toFixed(6)}, {selectedPos[1].toFixed(6)}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!selectedPos || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
