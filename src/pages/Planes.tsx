import Layout from "@/components/Layout";
import { useSubscription, PLAN_LIMITS, PlanId } from "@/hooks/useSubscription";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, Crown, Zap, Loader2, Star, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type BillingCycle = "monthly" | "annual";

const PRICING = {
  pro: { monthly: 20000, annual: 200000 },
  premium: { monthly: 100000, annual: 1000000 },
} as const;

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

function getSavingsPercent(planId: "pro" | "premium"): number {
  const { monthly, annual } = PRICING[planId];
  const yearlyIfMonthly = monthly * 12;
  return Math.round(((yearlyIfMonthly - annual) / yearlyIfMonthly) * 100);
}

const plans = [
  {
    id: "free" as PlanId,
    name: "Free",
    icon: Star,
    features: [
      "Mapa y propiedades",
      "5 análisis IA / mes",
      "3 búsquedas / mes",
      "5 comparativos / mes",
      "10 proyectos guardados",
      "1 alerta activa",
    ],
    cta: "Plan actual",
    popular: false,
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    icon: Zap,
    features: [
      "Todo de Free",
      "50 análisis IA / mes",
      "30 búsquedas / mes",
      "50 comparativos / mes",
      "Proyectos ilimitados",
      "10 alertas activas",
      "Exportar datos",
    ],
    cta: "Suscribirse",
    popular: true,
  },
  {
    id: "premium" as PlanId,
    name: "Premium",
    icon: Crown,
    features: [
      "Todo de Pro",
      "Análisis IA ilimitados",
      "Búsquedas ilimitadas",
      "Comparativos ilimitados",
      "Alertas ilimitadas",
      "Tasación automática",
      "Inteligencia de precios",
    ],
    cta: "Suscribirse",
    popular: false,
  },
];

const USAGE_LABELS: Record<string, string> = {
  analyses: "Análisis IA",
  comparisons: "Comparativos",
  searches: "Búsquedas",
  exports: "Exportaciones",
};

const Planes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, isLoading, createSubscription, plan: currentPlan } = useSubscription();
  const { getUsed, getLimit } = useUsageLimits();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (planId === "free") return;

    const mpPlanId = `${planId}_${billing}`;

    setSubscribing(planId);
    try {
      const result = await createSubscription(mpPlanId);
      window.location.href = result.init_point;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo crear la suscripción",
        variant: "destructive",
      });
      setSubscribing(null);
    }
  };

  const currentStatus = subscription?.status;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Planes y Precios</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Elegí el plan que mejor se adapte a tus necesidades de análisis inmobiliario.
          </p>
          {currentStatus === "active" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Check className="h-4 w-4" />
              Plan {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} activo
            </div>
          )}
          {currentStatus === "pending" && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pago pendiente de confirmación
            </div>
          )}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-secondary w-fit mx-auto">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              billing === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
              -{getSavingsPercent("pro")}%
            </span>
          </button>
        </div>

        {/* Usage summary for current plan */}
        {user && (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Uso este mes
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["analyses", "comparisons", "searches", "exports"] as const).map((cat) => {
                const used = getUsed(cat);
                const limit = getLimit(cat);
                const isUnlimited = limit === Infinity;
                const isBooleanLimit = typeof PLAN_LIMITS[currentPlan][cat] === "boolean";

                if (isBooleanLimit) {
                  const allowed = PLAN_LIMITS[currentPlan][cat as "exports"];
                  return (
                    <div key={cat} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{USAGE_LABELS[cat]}</p>
                      <p className={`text-sm font-medium ${allowed ? "text-primary" : "text-muted-foreground"}`}>
                        {allowed ? "Habilitado" : "No disponible"}
                      </p>
                    </div>
                  );
                }

                const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{USAGE_LABELS[cat]}</p>
                      <p className="text-xs font-medium">
                        {used} / {isUnlimited ? "∞" : limit}
                      </p>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isCurrentPending = subscription?.plan === plan.id && currentStatus === "pending";
            const isDowngrade = plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlan);
            const hasPricing = plan.id === "pro" || plan.id === "premium";
            const price = hasPricing ? PRICING[plan.id as "pro" | "premium"][billing] : 0;
            const monthlyEquiv = hasPricing && billing === "annual"
              ? Math.round(PRICING[plan.id as "pro" | "premium"].annual / 12)
              : price;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  plan.popular
                    ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/40"
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold z-10">
                    Más popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/15" : "bg-secondary"}`}>
                    <plan.icon className={`h-5 w-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                </div>

                {/* Pricing */}
                <div className="mb-4 min-h-[3rem]">
                  {hasPricing ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          {formatARS(billing === "annual" ? monthlyEquiv : price)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ mes</span>
                      </div>
                      {billing === "annual" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatARS(price)} facturados anualmente
                          <span className="ml-1.5 text-primary font-medium">
                            Ahorrás {getSavingsPercent(plan.id as "pro" | "premium")}%
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">Gratis</span>
                    </div>
                  )}
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    isLoading ||
                    subscribing === plan.id ||
                    isCurrent ||
                    isCurrentPending ||
                    isDowngrade ||
                    plan.id === "free"
                  }
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-primary/10 text-primary cursor-default"
                      : isCurrentPending
                      ? "bg-yellow-500/10 text-yellow-600 cursor-default"
                      : plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : plan.id === "free" || isDowngrade
                      ? "bg-secondary text-muted-foreground cursor-default"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  } disabled:opacity-60`}
                >
                  {subscribing === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent
                    ? "Plan actual"
                    : isCurrentPending
                    ? "Pendiente"
                    : isDowngrade
                    ? "Plan inferior"
                    : plan.id === "free"
                    ? "Plan gratuito"
                    : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Los pagos se procesan de forma segura a través de MercadoPago.
          <br />
          Podés cancelar tu suscripción en cualquier momento desde tu cuenta de MercadoPago.
        </p>

        {/* Test mode banner */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium border border-yellow-500/20">
            🧪 Modo Test – Los pagos no son reales
          </span>
        </div>
      </div>
    </Layout>
  );
};

export default Planes;
