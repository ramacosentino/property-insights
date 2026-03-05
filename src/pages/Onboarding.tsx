import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding, OnboardingData } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import OnboardingZoneSelector from "@/components/OnboardingZoneSelector";
import { PLAN_LIMITS, PlanId } from "@/hooks/useSubscription";
import { CONDITION_TIERS, ALL_CONDITION_VALUES } from "@/lib/filterUtils";
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
  Star,
  Zap,
  Crown,
  Check,
  ShieldCheck,
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

const ONBOARDING_PLANS = [
  {
    id: "free" as PlanId,
    name: "Free",
    icon: Star,
    description: "Para explorar la plataforma",
    highlights: ["5 análisis IA / mes", "3 búsquedas / mes", "1 alerta activa"],
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    icon: Zap,
    description: "Para inversores activos",
    highlights: ["50 análisis IA / mes", "30 búsquedas / mes", "Exportar datos"],
    popular: true,
  },
  {
    id: "premium" as PlanId,
    name: "Premium",
    icon: Crown,
    description: "Acceso total sin límites",
    highlights: ["Análisis ilimitados", "Tasación automática", "Inteligencia de precios"],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { saveOnboarding } = useOnboarding();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");

  const [data, setData] = useState<OnboardingData>({
    user_type: "",
    zones: [],
    budget_min: null,
    budget_max: null,
    budget_currency: "USD",
    property_types: [],
    investment_goal: null,
    condition_filters: [...ALL_CONDITION_VALUES], // all ticked by default
  });

  const isInvestor = data.user_type === "inversor_recurrente" || data.user_type === "inmobiliaria";
  // Steps: 0=user_type, 1=zones, 2=budget, 3=property_types, 4?=investment_goal, last=plan
  const baseSteps = isInvestor ? 5 : 4;
  const totalSteps = baseSteps + 1; // +1 for plan selection
  const planStep = baseSteps;
  const progress = ((step + 1) / totalSteps) * 100;

  const canNext = () => {
    switch (step) {
      case 0: return !!data.user_type;
      case 1: return data.zones.length > 0;
      case 2: return true;
      case 3: return data.property_types.length > 0;
      case 4: return isInvestor ? !!data.investment_goal : true; // plan step if !isInvestor
      default: return true;
    }
  };

  const isLastStep = () => step === planStep;

  const handleNext = async () => {
    if (isLastStep()) {
      setSubmitting(true);
      try {
        await saveOnboarding(data);
        if (selectedPlan !== "free") {
          // Redirect to planes page to complete payment
          navigate("/planes", { replace: true });
        } else {
          navigate("/mapa", { replace: true });
        }
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
          <OnboardingZoneSelector
            selected={data.zones}
            onChange={(zones) => setData((d) => ({ ...d, zones }))}
          />
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

        {/* Plan Selection Step */}
        {step === planStep && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-foreground">Elegí tu plan</h1>
              <p className="text-sm text-muted-foreground">Podés cambiar en cualquier momento</p>
            </div>
            <div className="grid gap-3">
              {ONBOARDING_PLANS.map((plan) => {
                const selected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        Popular
                      </span>
                    )}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <plan.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                      <ul className="mt-2 space-y-1">
                        {plan.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
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
            {isLastStep()
              ? selectedPlan === "free"
                ? "Empezar gratis"
                : "Continuar al pago"
              : "Siguiente"}
            {!isLastStep() && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
