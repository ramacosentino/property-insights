import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert as AlertType, AlertFilters } from "@/hooks/useAlerts";
import { useState, useEffect } from "react";
import { useOnboardingFilters } from "@/hooks/useOnboardingFilters";
import { X } from "lucide-react";

interface AlertFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: AlertType | null;
  onSubmit: (data: any) => void;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "departamento", label: "Depto" },
  { value: "casa", label: "Casa" },
  { value: "ph", label: "PH" },
  { value: "terreno", label: "Terreno" },
];

export default function AlertFormDialog({ open, onOpenChange, alert, onSubmit }: AlertFormDialogProps) {
  const onboardingFilters = useOnboardingFilters();
  const isEditing = !!alert;

  const [name, setName] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [priceCurrency, setPriceCurrency] = useState("USD");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState("daily");

  useEffect(() => {
    if (!open) return;
    if (alert) {
      const f = alert.filters as AlertFilters;
      setName(alert.name);
      setZones(f.zones || []);
      setPropertyTypes(f.property_types || []);
      setPriceMin(f.price_min?.toString() || "");
      setPriceMax(f.price_max?.toString() || "");
      setPriceCurrency(f.price_currency || "USD");
      setEmailEnabled(alert.email_enabled);
      setInAppEnabled(alert.in_app_enabled);
      setEmailFrequency(alert.email_frequency);
    } else if (onboardingFilters.loaded) {
      setName("Mi alerta");
      setZones(Array.from(onboardingFilters.neighborhoodFilter.included));
      setPropertyTypes(Array.from(onboardingFilters.propertyTypeFilter.included));
      setPriceMin(onboardingFilters.priceRange?.[0]?.toString() || "");
      setPriceMax(onboardingFilters.priceRange?.[1]?.toString() || "");
      setPriceCurrency(onboardingFilters.priceCurrency);
      setEmailEnabled(true);
      setInAppEnabled(true);
      setEmailFrequency("daily");
    }
  }, [open, alert, onboardingFilters.loaded]);

  const handleSubmit = () => {
    const filters: AlertFilters = {
      zones: zones.length > 0 ? zones : undefined,
      property_types: propertyTypes.length > 0 ? propertyTypes : undefined,
      price_min: priceMin ? Number(priceMin) : undefined,
      price_max: priceMax ? Number(priceMax) : undefined,
      price_currency: priceCurrency,
    };
    onSubmit({
      name: name.trim() || "Mi alerta",
      filters,
      email_enabled: emailEnabled,
      in_app_enabled: inAppEnabled,
      email_frequency: emailFrequency,
      active: true,
    });
  };

  const removeZone = (z: string) => setZones((prev) => prev.filter((x) => x !== z));
  const toggleType = (t: string) =>
    setPropertyTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base">{isEditing ? "Editar alerta" : "Nueva alerta"}</DialogTitle>
        </DialogHeader>

        {/* Two-column grid on desktop, single column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {/* Left column */}
          <div className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="alert-name" className="text-xs">Nombre</Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Palermo < 100k"
                maxLength={60}
                className="h-8 text-sm"
              />
            </div>

            {/* Property types */}
            <div className="space-y-1">
              <Label className="text-xs">Tipo de propiedad</Label>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      propertyTypes.includes(opt.value)
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-1">
              <Label className="text-xs">Rango de precio</Label>
              <div className="flex items-center gap-1.5">
                <Select value={priceCurrency} onValueChange={setPriceCurrency}>
                  <SelectTrigger className="w-[68px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Mín"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Zones */}
            <div className="space-y-1">
              <Label className="text-xs">Zonas (del onboarding)</Label>
              {zones.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {zones.map((z) => (
                    <Badge key={z} variant="secondary" className="gap-1 text-[10px] py-0.5">
                      {z}
                      <button onClick={() => removeZone(z)} className="ml-0.5 hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">Sin zonas — se evaluará contra todas.</p>
              )}
            </div>
          </div>

          {/* Right column - Channels */}
          <div className="space-y-3 sm:border-l sm:pl-6 border-t sm:border-t-0 pt-3 sm:pt-0">
            <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Canales de notificación</Label>

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">In-app</p>
                <p className="text-[11px] text-muted-foreground">Dentro de Urbanna</p>
              </div>
              <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-[11px] text-muted-foreground">Resúmenes por correo</p>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            {emailEnabled && (
              <div className="space-y-1">
                <Label className="text-xs">Frecuencia</Label>
                <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Inmediato</SelectItem>
                    <SelectItem value="daily">Resumen diario</SelectItem>
                    <SelectItem value="weekly">Resumen semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Crear alerta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
