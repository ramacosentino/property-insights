import Layout from "@/components/Layout";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, Crown, Zap, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Gratis",
    priceNum: 0,
    icon: Star,
    features: [
      "Ver propiedades en mapa",
      "Filtros básicos",
      "Hasta 5 proyectos guardados",
    ],
    cta: "Plan actual",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.990/mes",
    priceNum: 9990,
    icon: Zap,
    features: [
      "Todo de Free",
      "Análisis de oportunidad ilimitados",
      "Proyectos ilimitados",
      "Filtros avanzados",
      "Exportar datos",
    ],
    cta: "Suscribirse",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.990/mes",
    priceNum: 19990,
    icon: Crown,
    features: [
      "Todo de Pro",
      "Inteligencia de precios",
      "Alertas personalizadas",
      "Tasación automática",
      "Soporte prioritario",
    ],
    cta: "Suscribirse",
    popular: false,
  },
];

const Planes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, isLoading, createSubscription, isActive } = useSubscription();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (planId === "free") return;

    setSubscribing(planId);
    try {
      const { init_point } = await createSubscription(planId);
      // Redirect to MercadoPago checkout
      window.location.href = init_point;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo crear la suscripción",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const currentPlan = subscription?.plan || "free";
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id && isActive;
            const isCurrentPending = currentPlan === plan.id && currentStatus === "pending";

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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/15" : "bg-secondary"}`}>
                    <plan.icon className={`h-5 w-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-xl font-bold text-foreground">{plan.price}</p>
                  </div>
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
                    plan.id === "free"
                  }
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-primary/10 text-primary cursor-default"
                      : isCurrentPending
                      ? "bg-yellow-500/10 text-yellow-600 cursor-default"
                      : plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : plan.id === "free"
                      ? "bg-secondary text-muted-foreground cursor-default"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  } disabled:opacity-60`}
                >
                  {subscribing === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent
                    ? "Plan actual"
                    : isCurrentPending
                    ? "Pendiente"
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
