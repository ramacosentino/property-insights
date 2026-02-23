import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, ArrowRight, Check, ChevronDown, Zap, Crown, Star,
} from "lucide-react";
import {
  IconMap, IconSearch, IconCalculator, IconTrending, IconStar, IconBell,
} from "@/components/landing/GradientIcons";
import landingHeroBg from "@/assets/landing-hero-bg.jpg";
import landingSolutionBg from "@/assets/landing-solution-bg.jpg";
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
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ──────────── Data ──────────── */
const features = [
  {
    Icon: IconMap,
    title: "Mapa interactivo",
    desc: "Visualizá todo el mercado por zonas. Cada propiedad geolocalizada con su score de oportunidad en tiempo real.",
    detail: "Filtrá por barrio, precio, superficie y más. Identificá clusters de oportunidad que otros no ven.",
  },
  {
    Icon: IconSearch,
    title: "Búsqueda inteligente",
    desc: "Filtrá por los criterios que realmente importan: USD/m², oportunidad neta, potencial de revalorización.",
    detail: "Combiná filtros avanzados y guardá tus búsquedas. Recibí nuevas propiedades que matchean automáticamente.",
  },
  {
    Icon: IconCalculator,
    title: "Tasación automática",
    desc: "Compará el precio publicado contra el valor potencial calculado con comparables reales del mercado.",
    detail: "Nuestro algoritmo analiza propiedades similares por zona, superficie y características para darte un valor objetivo.",
  },
  {
    Icon: IconTrending,
    title: "Inteligencia de precios",
    desc: "Tendencias de USD/m² por barrio, tipo de propiedad y período. Entendé hacia dónde va el mercado.",
    detail: "Gráficos interactivos con evolución histórica. Detectá zonas en ascenso antes que el resto.",
  },
  {
    Icon: IconStar,
    title: "Mis Proyectos",
    desc: "Tu shortlist personal de oportunidades. Guardá, anotá y compará las propiedades que te interesan.",
    detail: "Agregá notas, descartá las que no van y mantené organizado tu proceso de decisión.",
  },
  {
    Icon: IconBell,
    title: "Alertas",
    desc: "Configurá alertas y enterate antes que nadie cuando aparezca una propiedad que matchea tus criterios.",
    detail: "Notificaciones personalizadas por email o en la app. Nunca más te pierdas una oportunidad.",
  },
];

const userProfiles = [
  {
    Icon: IconBuyer,
    title: "Comprador",
    subtitle: "Tomá decisiones informadas",
    points: [
      "Sabé si el precio publicado es justo o inflado",
      "Compará con propiedades similares en la zona",
      "No te sobreprecien: tené los datos del mercado",
      "Ahorrá tiempo filtrando solo lo que vale la pena",
    ],
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    Icon: IconInvestor,
    title: "Inversor",
    subtitle: "Encontrá oportunidades primero",
    points: [
      "Detectá propiedades subvaluadas con alto potencial",
      "Score de oportunidad automático en cada propiedad",
      "Análisis de rentabilidad por zona y USD/m²",
      "Alertas para no perder las mejores ofertas",
    ],
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    Icon: IconAgency,
    title: "Inmobiliaria",
    subtitle: "Datos para ganar clientes",
    points: [
      "Fijá precios competitivos con datos reales",
      "Reportes de mercado para tus clientes",
      "Entendé tendencias por barrio para asesorar mejor",
      "Diferenciarte con analítica profesional",
    ],
    gradient: "from-violet-500/20 to-purple-500/20",
  },
];

const stats = [
  { value: "50K+", label: "Propiedades analizadas" },
  { value: "100+", label: "Barrios cubiertos" },
  { value: "USD/m²", label: "Métrica central" },
  { value: "24/7", label: "Datos actualizados" },
];

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Gratis",
    icon: Star,
    features: ["Ver propiedades en mapa", "Filtros básicos", "Hasta 5 proyectos guardados"],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.990/mes",
    icon: Zap,
    features: ["Todo de Free", "Análisis ilimitados", "Proyectos ilimitados", "Filtros avanzados", "Exportar datos"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.990/mes",
    icon: Crown,
    features: ["Todo de Pro", "Inteligencia de precios", "Alertas personalizadas", "Tasación automática", "Soporte prioritario"],
    popular: false,
  },
];

/* ──────────── Component ──────────── */
const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, createSubscription, isActive } = useSubscription();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { isDark, toggle } = useTheme();

  const handleSubscribe = async (planId: string) => {
    if (!user) { navigate("/auth"); return; }
    if (planId === "free") return;
    setSubscribing(planId);
    try {
      const { init_point } = await createSubscription(planId);
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
          <Link to="/landing" className="flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold landing-gradient-text">PropAnalytics</span>
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
                <Link to="/">Ir a la app</Link>
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
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
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
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            Analítica inmobiliaria basada en datos
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6">
            Cambiá la forma
            <br />
            en que{" "}
            <span className="landing-gradient-text">invertís</span>
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

        {/* Scroll indicator */}
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
      <section className="py-24 md:py-32 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            El problema
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            El mercado inmobiliario
            <br />
            <span className="text-landing-muted">opera a ciegas</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-landing-muted max-w-2xl mx-auto leading-relaxed">
            Propiedades dispersas en decenas de portales. Sin comparación objetiva. Sin datos de valor real.
            La mayoría de las decisiones de compra se toman con intuición — no con información.
          </motion.p>
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {[
              { Icon: IconShield, title: "Precios opacos", desc: "Sin referencia de valor real, pagás más de lo que deberías." },
              { Icon: IconFragmented, title: "Información fragmentada", desc: "Cada portal muestra una parte. Ninguno te da la foto completa." },
              { Icon: IconTarget, title: "Oportunidades perdidas", desc: "Las mejores propiedades se venden antes de que las descubras." },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-landing-card-border bg-landing-card/50 text-left">
                <item.Icon className="mb-4" size={32} />
                <h3 className="font-bold text-lg text-landing-fg mb-2">{item.title}</h3>
                <p className="text-sm text-landing-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Value Proposition ═══ */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <motion.div
          className="relative max-w-5xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
            <Zap className="h-3.5 w-3.5 text-primary" />
            La solución
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Todo el universo de propiedades,
            <br />
            <span className="landing-gradient-text">centralizado y comparado</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-landing-muted max-w-2xl mx-auto leading-relaxed mb-14">
            PropAnalytics reúne, normaliza y analiza el mercado inmobiliario para que tomes decisiones con datos reales — no con corazonadas.
          </motion.p>
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { Icon: IconAnalysis, label: "Análisis automático" },
              { Icon: IconComparables, label: "Comparables reales" },
              { Icon: IconScore, label: "Score de oportunidad" },
              { Icon: IconAlert, label: "Alertas inteligentes" },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-2xl border border-landing-card-border bg-landing-card/50 landing-card-glow text-center">
                <item.Icon className="mx-auto mb-3" size={32} />
                <span className="text-sm font-semibold text-landing-fg">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Features Tour ═══ */}
      <section id="features" className="py-24 md:py-32 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Funcionalidades
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Cada herramienta que
              <br />
              <span className="landing-gradient-text">necesitás</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-8 md:p-10 rounded-3xl border border-landing-card-border bg-landing-card/30 hover:bg-landing-card/60 transition-all duration-500"
              >
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                      <feat.Icon size={24} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-landing-fg">{feat.title}</h3>
                  </div>
                  <p className="text-landing-muted leading-relaxed mb-3">{feat.desc}</p>
                  <p className="text-sm text-landing-muted/70 leading-relaxed">{feat.detail}</p>
                </div>
                <div className={`aspect-[16/10] rounded-2xl bg-gradient-to-br from-landing-card to-landing-card-border/30 border border-landing-card-border flex items-center justify-center ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <feat.Icon size={64} className="opacity-30" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ User Profiles ═══ */}
      <section id="profiles" className="py-24 md:py-32 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Para cada perfil
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Valor real para{" "}
              <span className="landing-gradient-text">cada usuario</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userProfiles.map((profile, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative p-8 rounded-3xl border border-landing-card-border bg-landing-card/40 hover:bg-landing-card/70 transition-all duration-500 group"
              >
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${profile.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 inline-block mb-5">
                    <profile.Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-landing-fg mb-1">{profile.title}</h3>
                  <p className="text-sm text-primary font-medium mb-5">{profile.subtitle}</p>
                  <ul className="space-y-3">
                    {profile.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-landing-muted">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
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
      <section id="pricing" className="py-24 md:py-32 px-6">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-landing-card-border bg-landing-card/50 text-sm text-landing-muted mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Precios
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Empezá gratis,
              <br />
              <span className="landing-gradient-text">escalá cuando quieras</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id && isActive;
              return (
                <motion.div
                  key={plan.id}
                  variants={fadeUp}
                  className={`relative flex flex-col rounded-3xl border p-8 transition-all ${
                    plan.popular
                      ? "border-primary/50 bg-primary/5 landing-card-glow"
                      : "border-landing-card-border bg-landing-card/40"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      Más popular
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <plan.icon className={`h-5 w-5 ${plan.popular ? "text-primary" : "text-landing-muted"}`} />
                    <h3 className="font-bold text-xl text-landing-fg">{plan.name}</h3>
                  </div>
                  <p className="text-2xl font-black text-landing-fg mb-6">{plan.price}</p>
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-landing-muted">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id || isCurrent || plan.id === "free"}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-primary/10 text-primary cursor-default"
                        : plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                        : plan.id === "free"
                        ? "bg-landing-card border border-landing-card-border text-landing-muted cursor-default"
                        : "bg-landing-card border border-landing-card-border text-landing-fg hover:bg-landing-card-border"
                    } disabled:opacity-60`}
                  >
                    {subscribing === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCurrent ? "Plan actual" : plan.id === "free" ? "Gratis para siempre" : "Suscribirse"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-24 md:py-32 px-6 relative">
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
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tight mb-6">
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
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-bold landing-gradient-text">PropAnalytics</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-landing-muted">
            <a href="#features" className="hover:text-landing-fg transition-colors">Funcionalidades</a>
            <a href="#profiles" className="hover:text-landing-fg transition-colors">¿Para quién es?</a>
            <a href="#pricing" className="hover:text-landing-fg transition-colors">Pricing</a>
          </div>
          <p className="text-xs text-landing-muted/50">
            © {new Date().getFullYear()} PropAnalytics. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
