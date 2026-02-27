import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding, OnboardingData } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import OnboardingZoneSelector from "@/components/OnboardingZoneSelector";
import {
  Home,
  TrendingUp,
  BarChart3,
  Building2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  DollarSign,
  Layers,
  Target,
} from "lucide-react";

const USER_TYPES = [
  {
    value: "comprador",
    label: "Quiero comprar una propiedad",
    description: "Busco mi próximo hogar o una propiedad para uso personal",
    icon: Home,
  },
  {
    value: "inversor_unico",
    label: "Inversión puntual",
    description: "Busco una oportunidad de inversión específica",
    icon: TrendingUp,
  },
  {
    value: "inversor_recurrente",
    label: "Inversiones recurrentes",
    description: "Busco oportunidades de inversión de forma continua",
    icon: BarChart3,
  },
  {
    value: "inmobiliaria",
    label: "Inmobiliaria / Broker",
    description: "Necesito inteligencia de mercado para mi negocio",
    icon: Building2,
  },
];

const PROPERTY_TYPES = [
  "Departamento",
  "Casa",
  "PH",
  "Local comercial",
  "Terreno",
  "Oficina",
  "Cochera",
];

const INVESTMENT_GOALS = [
  { value: "refaccion_venta", label: "Refacción + Venta" },
  { value: "renta", label: "Renta / Alquiler" },
  { value: "pozo", label: "Desde el pozo" },
  { value: "reventa", label: "Compra y reventa rápida" },
  { value: "desarrollo", label: "Desarrollo inmobiliario" },
];

const POPULAR_ZONES = [
  "Palermo",
  "Belgrano",
  "Recoleta",
  "Caballito",
  "Núñez",
  "Villa Urquiza",
  "San Telmo",
  "Almagro",
  "Villa Crespo",
  "Colegiales",
  "Barrio Norte",
  "Flores",
];

const TOTAL_STEPS = 4; // step 5 (investment_goal) is conditional

const Onboarding = () => {
  const navigate = useNavigate();
  const { saveOnboarding } = useOnboarding();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    user_type: "",
    zones: [],
    budget_min: null,
    budget_max: null,
    budget_currency: "USD",
    property_types: [],
    investment_goal: null,
  });

  const [zoneInput, setZoneInput] = useState("");

  const isInvestor = data.user_type === "inversor_recurrente" || data.user_type === "inmobiliaria";
  const totalSteps = isInvestor ? TOTAL_STEPS + 1 : TOTAL_STEPS;
  const progress = ((step + 1) / totalSteps) * 100;

  const canNext = () => {
    switch (step) {
      case 0: return !!data.user_type;
      case 1: return data.zones.length > 0;
      case 2: return true; // budget is optional
      case 3: return data.property_types.length > 0;
      case 4: return !!data.investment_goal;
      default: return false;
    }
  };

  const isLastStep = () => {
    if (isInvestor) return step === 4;
    return step === 3;
  };

  const handleNext = async () => {
    if (isLastStep()) {
      setSubmitting(true);
      try {
        await saveOnboarding(data);
        navigate("/mapa", { replace: true });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const toggleArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const addZone = (zone: string) => {
    const trimmed = zone.trim();
    if (trimmed && !data.zones.includes(trimmed)) {
      setData((d) => ({ ...d, zones: [...d.zones, trimmed] }));
    }
    setZoneInput("");
  };

  const removeZone = (zone: string) => {
    setData((d) => ({ ...d, zones: d.zones.filter((z) => z !== zone) }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Paso {step + 1} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step 0: User Type */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-foreground">¿Qué estás buscando?</h1>
              <p className="text-sm text-muted-foreground">Esto nos ayuda a personalizar tu experiencia</p>
            </div>
            <div className="grid gap-3">
              {USER_TYPES.map((type) => {
                const selected = data.user_type === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setData((d) => ({ ...d, user_type: type.value }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Zones */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Zonas de interés</h1>
              <p className="text-sm text-muted-foreground">¿En qué barrios o localidades buscás?</p>
            </div>

            {/* Selected zones */}
            {data.zones.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.zones.map((z) => (
                  <Badge key={z} variant="secondary" className="gap-1 pr-1">
                    {z}
                    <button onClick={() => removeZone(z)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Escribí un barrio..."
                value={zoneInput}
                onChange={(e) => setZoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addZone(zoneInput); }
                }}
              />
              <Button size="sm" variant="outline" onClick={() => addZone(zoneInput)} disabled={!zoneInput.trim()}>
                Agregar
              </Button>
            </div>

            {/* Popular */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Populares</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ZONES.filter((z) => !data.zones.includes(z)).map((z) => (
                  <button
                    key={z}
                    onClick={() => addZone(z)}
                    className="px-2.5 py-1 text-xs rounded-full border border-border bg-card hover:border-primary/40 hover:text-primary transition-all"
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Presupuesto</h1>
              <p className="text-sm text-muted-foreground">¿Cuál es tu rango de presupuesto? (opcional)</p>
            </div>

            {/* Currency toggle */}
            <div className="flex gap-2 justify-center">
              {["USD", "ARS"].map((c) => (
                <button
                  key={c}
                  onClick={() => setData((d) => ({ ...d, budget_currency: c }))}
                  className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
                    data.budget_currency === c
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Mínimo</label>
                <Input
                  type="number"
                  placeholder="50.000"
                  value={data.budget_min ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, budget_min: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Máximo</label>
                <Input
                  type="number"
                  placeholder="200.000"
                  value={data.budget_max ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, budget_max: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Property Types */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Tipo de propiedad</h1>
              <p className="text-sm text-muted-foreground">¿Qué tipo de propiedades te interesan?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((pt) => {
                const selected = data.property_types.includes(pt);
                return (
                  <button
                    key={pt}
                    onClick={() => setData((d) => ({ ...d, property_types: toggleArray(d.property_types, pt) }))}
                    className={`px-3 py-2.5 text-sm rounded-lg border transition-all ${
                      selected
                        ? "border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary/20"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {pt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Investment Goal (conditional) */}
        {step === 4 && isInvestor && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Objetivo de inversión</h1>
              <p className="text-sm text-muted-foreground">¿Qué tipo de inversión buscás?</p>
            </div>
            <div className="grid gap-2">
              {INVESTMENT_GOALS.map((g) => {
                const selected = data.investment_goal === g.value;
                return (
                  <button
                    key={g.value}
                    onClick={() => setData((d) => ({ ...d, investment_goal: g.value }))}
                    className={`px-4 py-3 text-sm rounded-lg border text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary/20"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Atrás
          </Button>
          <Button size="sm" onClick={handleNext} disabled={!canNext() || submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isLastStep() ? "Empezar" : "Siguiente"}
            {!isLastStep() && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
