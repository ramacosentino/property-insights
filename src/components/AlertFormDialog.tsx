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
  { value: "departamento", label: "Departamento" },
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

  // Pre-fill from editing alert or onboarding
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar alerta" : "Nueva alerta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="alert-name">Nombre</Label>
            <Input
              id="alert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Palermo < 100k"
              maxLength={60}
            />
          </div>

          {/* Zones */}
          <div className="space-y-1.5">
            <Label>Zonas (del onboarding)</Label>
            {zones.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {zones.map((z) => (
                  <Badge key={z} variant="secondary" className="gap-1 text-xs">
                    {z}
                    <button onClick={() => removeZone(z)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin zonas — se evaluará contra todas.</p>
            )}
          </div>

          {/* Property types */}
          <div className="space-y-1.5">
            <Label>Tipos de propiedad</Label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleType(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
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
          <div className="space-y-1.5">
            <Label>Rango de precio</Label>
            <div className="flex items-center gap-2">
              <Select value={priceCurrency} onValueChange={setPriceCurrency}>
                <SelectTrigger className="w-20 h-9">
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
                className="h-9"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder="Máx"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Canales</Label>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">In-app</p>
                <p className="text-xs text-muted-foreground">Notificaciones dentro de Urbanna</p>
              </div>
              <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">Recibir resúmenes por correo</p>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            {emailEnabled && (
              <div className="pl-4 space-y-1.5">
                <Label className="text-xs">Frecuencia</Label>
                <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                  <SelectTrigger className="h-9">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Crear alerta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
