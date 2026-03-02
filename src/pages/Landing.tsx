import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, Check, ChevronDown, Zap, Crown, Star,
  Search, BarChart2, TrendingUp, Bell, Building2,
} from "lucide-react";
import UrbbanLogo from "@/components/UrbbanLogo";
import RotatingWord from "@/components/RotatingWord";
import landingProblemBg from "@/assets/landing-problem-bg.jpg";
import illustrations from "@/components/landing/FeatureIllustrations";
import PlanComparisonTable from "@/components/PlanComparisonTable";
import landingProfilesBg from "@/assets/landing-profiles-bg.jpg";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/* ──────────── Animations ──────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] } },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ──────────── Data ──────────── */
const features = [
  {
    title: "Mapa interactivo",
    desc: "Visualizá todo el mercado por zonas. Cada propiedad geolocalizada con su score de oportunidad en tiempo real.",
    illustrationKey: "map",
  },
  {
    title: "Búsqueda inteligente",
    desc: "Filtrá por los criterios que realmente importan: USD/m², oportunidad neta, potencial de revalorización.",
    illustrationKey: "search",
  },
  {
    title: "Tasación automática",
    desc: "Compará el precio publicado contra el valor potencial calculado con comparables reales del mercado.",
    illustrationKey: "valuation",
  },
  {
    title: "Inteligencia de precios",
    desc: "Tendencias de USD/m² por barrio, tipo de propiedad y período. Entendé hacia dónde va el mercado.",
    illustrationKey: "priceIntel",
  },
  {
    title: "Mis Proyectos",
    desc: "Tu shortlist personal de oportunidades. Guardá, anotá y compará las propiedades que te interesan.",
    illustrationKey: "projects",
  },
  {
    title: "Alertas",
    desc: "Configurá alertas y enterate antes que nadie cuando aparezca una propiedad que matchea tus criterios.",
    illustrationKey: "alerts",
  },
];

const solutionPillars = [
  {
    icon: BarChart2,
    title: "Análisis automático",
    desc: "Cada propiedad evaluada con algoritmos de mercado.",
  },
  {
    icon: Search,
    title: "Comparables reales",
    desc: "Propiedades similares por zona y características.",
  },
  {
    icon: TrendingUp,
    title: "Score de oportunidad",
    desc: "Un número claro para priorizar tu búsqueda.",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    desc: "Enterate primero de nuevas oportunidades.",
  },
];

const userProfiles = [
  {
    title: "Comprador",
    subtitle: "Tomá decisiones informadas",
    points: [
      "Sabé si el precio publicado es justo o inflado",
      "Compará con propiedades similares en la zona",
      "No te sobreprecien: tené los datos del mercado",
      "Ahorrá tiempo filtrando solo lo que vale la pena",
    ],
  },
  {
    title: "Inversor",
    subtitle: "Encontrá oportunidades primero",
    points: [
      "Detectá propiedades subvaluadas con alto potencial",
      "Score de oportunidad automático en cada propiedad",
      "Análisis de rentabilidad por zona y USD/m²",
      "Alertas para no perder las mejores ofertas",
    ],
  },
  {
    title: "Inmobiliaria",
    subtitle: "Datos para ganar clientes",
    points: [
      "Fijá precios competitivos con datos reales",
      "Reportes de mercado para tus clientes",
      "Entendé tendencias por barrio para asesorar mejor",
      "Diferenciarte con analítica profesional",
    ],
  },
];

const stats = [
  { value: "50K+", label: "Propiedades analizadas" },
  { value: "100+", label: "Barrios cubiertos" },
  { value: "USD/m²", label: "Métrica central" },
  { value: "24/7", label: "Datos actualizados" },
];

const PRICING = {
  pro: { monthly: 20000, annual: 200000 },
  premium: { monthly: 100000, annual: 1000000 },
} as const;

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

function getSavingsPercent(planId: "pro" | "premium"): number {
  const { monthly, annual } = PRICING[planId];
  return Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100);
}

type BillingCycle = "monthly" | "annual";

const plans = [
  {
    id: "free",
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
    badge: null,
    highlighted: false,
  },
  {
    id: "pro",
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
    badge: "Ideal para buscar tu próxima propiedad",
    highlighted: true,
  },
  {
    id: "premium",
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
    badge: "Ideal si buscás una inversión",
    highlighted: true,
  },
  {
    id: "corporate",
    name: "Corporativo",
    icon: Building2,
    features: [
      "Todo de Premium",
      "Usuarios múltiples",
      "API dedicada",
      "Soporte prioritario",
      "Onboarding personalizado",
    ],
    badge: null,
    highlighted: false,
  },
];

/* ──────────── Component ──────────── */
const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, createSubscription, isActive } = useSubscription();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const { isDark, toggle } = useTheme();

  const handleSubscribe = async (planId: string) => {
    if (!user) { navigate("/auth"); return; }
    if (planId === "free" || planId === "corporate") return;
    const mpPlanId = `${planId}_${billing}`;
    setSubscribing(planId);
    try {
      const { init_point } = await createSubscription(mpPlanId);
      window.location.href = init_point;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo crear la suscripción", variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="landing-section min-h-screen overflow-x-hidden">
      {/* ═══ Navbar ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-landing-card-border/50 backdrop-blur-xl bg-landing-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <UrbbanLogo size="md" className="text-landing-fg" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-landing-muted">
            <a href="#features" className="hover:text-landing-fg transition-colors">Funcionalidades</a>
            <a href="#profiles" className="hover:text-landing-fg transition-colors">¿Para quién es?</a>
            <a href="#pricing" className="hover:text-landing-fg transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-full text-landing-muted hover:text-landing-fg hover:bg-landing-card transition-colors"
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <Button asChild size="sm" className="rounded-full px-5">
                <Link to="/mapa">Ir a la app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-landing-muted hover:text-landing-fg hover:bg-landing-card">
                  <Link to="/auth">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link to="/auth">Empezar gratis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-28 pb-14 md:pt-36 md:pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        </div>
        <motion.div
          className="relative max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-8">
            <UrbbanLogo size="sm" className="text-primary" showIcon />
            Analítica inmobiliaria basada en datos
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[0.95] mb-6">
            Cambiá la forma
            <br />
            en que{" "}
            <RotatingWord />
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-landing-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Miles de propiedades, una sola decisión. Tomala con datos.
            <br className="hidden md:block" />
            Todo el universo inmobiliario centralizado, comparado y analizado para vos.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 text-base h-12 shadow-lg shadow-primary/25">
              <Link to="/auth">
                Empezar gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base h-12 border-landing-card-border text-landing-fg bg-transparent hover:bg-landing-card">
              <a href="#features">Ver funcionalidades</a>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-5 w-5 text-landing-muted/50" />
        </motion.div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="border-y border-landing-card-border bg-landing-card/30">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-black landing-gradient-text">{s.value}</div>
              <div className="text-sm text-landing-muted mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ Problem ═══ */}
      <section className="py-16 md:py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={landingProblemBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <motion.div
          className="relative max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-sm text-white/80 mb-6">
            El problema
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-medium tracking-tight mb-6 text-white">
            El mercado inmobiliario
            <br />
            <span className="text-white/60">opera a ciegas</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Propiedades dispersas en decenas de portales. Sin comparación objetiva. Sin datos de valor real.
            La mayoría de las decisiones de compra se toman con intuición — no con información.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {[
              { title: "Precios opacos", desc: "Sin referencia de valor real, pagás más de lo que deberías." },
              { title: "Información fragmentada", desc: "Cada portal muestra una parte. Ninguno te da la foto completa." },
              { title: "Oportunidades perdidas", desc: "Las mejores propiedades se venden antes de que las descubras." },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="relative p-6 rounded-2xl backdrop-blur-xl border border-white/20 text-left overflow-hidden group"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)" }}
              >
                {/* Glow accent on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 to-transparent" />
                <div className="relative">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white/60 text-sm font-bold mb-4">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold text-lg text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/75 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ Value Proposition ═══ */}
      <section className="py-16 md:py-20 px-6 relative overflow-hidden bg-gradient-to-br from-muted/50 to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
        </div>
        <motion.div
          className="relative max-w-5xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm text-muted-foreground mb-6">
            La solución
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">
            Todo el universo de propiedades,
            <br />
            <span className="text-primary">centralizado y comparado</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-14">
            Urbanna reúne, normaliza y analiza el mercado inmobiliario para que tomes decisiones con datos reales — no con corazonadas.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {solutionPillars.map((pillar, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm text-left overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-500"
              >
                {/* Gradient top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <pillar.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ Features Tour ═══ */}
      <section id="features" className="py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
              Funcionalidades
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-medium tracking-tight">
              Cada herramienta que
              <br />
              <span className="landing-gradient-text">necesitás</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => {
              const IllustrationComponent = illustrations[feat.illustrationKey];
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="group relative rounded-2xl border border-landing-card-border/60 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
                >
                  {/* Top gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Illustration */}
                  <div className="h-44 p-3">
                    {IllustrationComponent && <IllustrationComponent />}
                  </div>

                  {/* Text */}
                  <div className="px-6 pb-6">
                    <h3 className="text-lg font-semibold text-landing-fg mb-2">{feat.title}</h3>
                    <p className="text-sm text-landing-muted leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ User Profiles ═══ */}
      <section id="profiles" className="py-16 md:py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={landingProfilesBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <motion.div
          className="relative max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-sm text-white/80 mb-6">
              Para cada perfil
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white">
              Valor real para{" "}
              <span className="text-primary">cada usuario</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userProfiles.map((profile, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative p-8 rounded-3xl backdrop-blur-xl border border-white/15 overflow-hidden group"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)" }}
              >
                {/* Subtle top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/8 to-transparent" />

                <div className="relative">
                  <h3 className="text-2xl font-semibold text-white mb-1">{profile.title}</h3>
                  <p className="text-sm text-white/70 font-medium mb-5">{profile.subtitle}</p>
                  <ul className="space-y-3">
                    {profile.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-white/85">
                        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="py-16 md:py-20 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
              Precios
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">
              Empezá gratis,
              <br />
              <span className="landing-gradient-text">escalá cuando quieras</span>
            </h2>
          </motion.div>

          {/* Billing toggle */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-1 p-1 rounded-full bg-landing-card border border-landing-card-border w-fit mx-auto mb-12">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-landing-muted hover:text-landing-fg"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                billing === "annual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-landing-muted hover:text-landing-fg"
              }`}
            >
              Anual
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                -{getSavingsPercent("pro")}%
              </span>
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => {
              const isCurrent = currentPlan === plan.id && isActive;
              const hasPricing = plan.id === "pro" || plan.id === "premium";
              const isCorporate = plan.id === "corporate";
              const price = hasPricing ? PRICING[plan.id as "pro" | "premium"][billing] : 0;
              const monthlyEquiv = hasPricing && billing === "annual"
                ? Math.round(PRICING[plan.id as "pro" | "premium"].annual / 12)
                : price;

              return (
                <motion.div
                  key={plan.id}
                  custom={i}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-500 overflow-hidden group ${
                    plan.highlighted
                      ? "border-primary/50 bg-card shadow-xl shadow-primary/10"
                      : "border-landing-card-border bg-card/60 hover:shadow-lg hover:shadow-primary/5"
                  }`}
                >
                  {plan.badge && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold z-10 whitespace-nowrap">
                        {plan.badge}
                      </div>
                    </>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />

                  <div className="relative flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${plan.highlighted ? "bg-primary/15" : "bg-muted"}`}>
                        <plan.icon className={`h-4 w-4 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <h3 className="font-bold text-lg text-landing-fg">{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-5 min-h-[3.5rem]">
                      {hasPricing ? (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-foreground">
                              {formatARS(billing === "annual" ? monthlyEquiv : price)}
                            </span>
                            <span className="text-sm text-landing-muted">/ mes</span>
                          </div>
                          {billing === "annual" && (
                            <p className="text-xs text-landing-muted mt-1">
                              {formatARS(price)} facturados anualmente
                              <span className="ml-1 text-primary font-medium">
                                Ahorrás {getSavingsPercent(plan.id as "pro" | "premium")}%
                              </span>
                            </p>
                          )}
                        </div>
                      ) : isCorporate ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">Custom</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">Gratis</span>
                        </div>
                      )}
                    </div>

                    <ul className="flex-1 space-y-2.5 mb-7">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-landing-muted">
                          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => isCorporate ? undefined : handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id || isCurrent || plan.id === "free"}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                          ? "bg-primary/10 text-primary cursor-default"
                          : plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                          : isCorporate
                          ? "bg-muted border border-border text-foreground hover:bg-muted/80"
                          : plan.id === "free"
                          ? "bg-muted border border-border text-muted-foreground cursor-default"
                          : "bg-muted border border-border text-foreground hover:bg-muted/80"
                      } disabled:opacity-60`}
                    >
                      {subscribing === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isCurrent ? "Plan actual" : isCorporate ? "Contactar Ventas" : plan.id === "free" ? "Gratis para siempre" : "Suscribirse"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison table */}
          <motion.div variants={fadeUp} className="mt-14 rounded-2xl border border-landing-card-border bg-card/60 overflow-hidden">
            <PlanComparisonTable variant="landing" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-16 md:py-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        </div>
        <motion.div
          className="relative max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-medium tracking-tight mb-6">
            Dejá de buscar
            <br />
            <span className="landing-gradient-text">a ciegas</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-landing-muted max-w-xl mx-auto mb-10">
            Cada día que pasa sin datos, es una oportunidad que otro aprovecha. Empezá hoy — es gratis.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button asChild size="lg" className="rounded-full px-10 text-base h-14 shadow-xl shadow-primary/30">
              <Link to="/auth">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-landing-card-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <UrbbanLogo size="sm" className="text-landing-muted" />
          </div>
          <div className="flex items-center gap-8 text-sm text-landing-muted">
            <a href="#features" className="hover:text-landing-fg transition-colors">Funcionalidades</a>
            <a href="#profiles" className="hover:text-landing-fg transition-colors">¿Para quién es?</a>
            <a href="#pricing" className="hover:text-landing-fg transition-colors">Pricing</a>
          </div>
          <p className="text-xs text-landing-muted/50">
            © {new Date().getFullYear()} Urbanna. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
