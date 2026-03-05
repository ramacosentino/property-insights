import UrbbanLogo, { UrbannaIcon } from "@/components/UrbbanLogo";

const FONT = "'Orelo SemiCondensed DemiBold', serif";

const FONT_CANDIDATES = [
  { name: "Orelo SemiCond. (actual)", family: "'Orelo SemiCondensed DemiBold', serif" },
  { name: "Florentine", family: "'Florentine', serif" },
  { name: "LT Serif", family: "'LT Serif', serif" },
  { name: "GrifinitoL", family: "'GrifinitoL', serif" },
  { name: "Editorial New", family: "'Editorial New', serif" },
];

/* ─── Icon Variants ─── */

/** A: U con dot de acento (actual) */
const IconA = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <UrbannaIcon size={size} className={className} />
);

/** B: U sola, sin dot, sin marco */
const IconB = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <span
    className={`inline-flex items-center justify-center ${className}`}
    style={{ fontFamily: FONT, fontSize: size, lineHeight: 1 }}
    aria-label="U"
  >
    U<span className="text-primary">.</span>
  </span>
);

/** C: U dentro de círculo con fondo primary */
const IconC = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <span
    className={`inline-flex items-center justify-center bg-primary text-primary-foreground ${className}`}
    style={{ width: size, height: size, borderRadius: "50%", fontFamily: FONT, fontSize: Math.round(size * 0.55), lineHeight: 1 }}
    aria-label="U"
  >
    U
  </span>
);

/** D: U dentro de rounded square con fondo primary */
const IconD = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <span
    className={`inline-flex items-center justify-center bg-primary text-primary-foreground ${className}`}
    style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), fontFamily: FONT, fontSize: Math.round(size * 0.55), lineHeight: 1 }}
    aria-label="U"
  >
    U
  </span>
);

/** E: U con borde primary, sin relleno */
const IconE = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-primary ${className}`}
    style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), fontFamily: FONT, fontSize: Math.round(size * 0.55), lineHeight: 1 }}
    aria-label="U"
  >
    U
  </span>
);

/** F: "Un" — U normal + n en primary, compacto */
const IconF = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: FONT, fontSize: Math.round(size * 0.7), lineHeight: 1, letterSpacing: "-0.03em" }}
    aria-label="Un"
  >
    <span>U</span><span className="text-primary">n</span>
  </span>
);

/** G: "U." pill horizontal */
const IconG = ({ size = 48, className = "" }: { size?: number; className?: string }) => {
  const h = size;
  const w = Math.round(size * 1.4);
  return (
    <span
      className={`inline-flex items-center justify-center bg-primary text-primary-foreground ${className}`}
      style={{ width: w, height: h, borderRadius: h / 2, fontFamily: FONT, fontSize: Math.round(size * 0.5), lineHeight: 1, letterSpacing: "-0.02em" }}
      aria-label="U."
    >
      U.
    </span>
  );
};

/** H: U con línea de acento debajo */
const IconH = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <span
    className={`inline-flex flex-col items-center justify-center ${className}`}
    style={{ fontFamily: FONT, fontSize: Math.round(size * 0.75), lineHeight: 1 }}
    aria-label="U"
  >
    U
    <span className="bg-primary" style={{ width: Math.round(size * 0.5), height: Math.max(2, Math.round(size * 0.06)), borderRadius: 2, marginTop: Math.round(size * 0.04) }} />
  </span>
);

const VARIANTS = [
  { key: "A", label: "U + dot acento", desc: "Actual", Component: IconA },
  { key: "B", label: "U. tipográfico", desc: "Punto como carácter", Component: IconB },
  { key: "C", label: "U en círculo", desc: "Fondo primary", Component: IconC },
  { key: "D", label: "U en squircle", desc: "Fondo primary, bordes redondeados", Component: IconD },
  { key: "E", label: "U en squircle outline", desc: "Solo borde primary", Component: IconE },
  { key: "F", label: "Un monograma", desc: "U + n en primary", Component: IconF },
  { key: "G", label: "U. pill", desc: "Pill horizontal con fondo", Component: IconG },
  { key: "H", label: "U + underline", desc: "Línea de acento debajo", Component: IconH },
];

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-16 px-6">
    <h1 className="text-2xl font-bold text-center mb-2">Logo: Urbanna.</h1>
    <p className="text-sm text-muted-foreground text-center mb-16 max-w-md mx-auto">
      Orelo SemiCondensed DemiBold · 2da N en color primario · Punto final
    </p>

    <div className="max-w-5xl mx-auto space-y-20">
      {/* Font comparison */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Comparación de tipografías
        </h2>
        <div className="grid gap-6">
          {FONT_CANDIDATES.map(f => (
            <div key={f.name} className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground font-mono w-44 shrink-0">{f.name}</span>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Light bg */}
                <div className="px-6 py-4 rounded-xl border border-border bg-card">
                  <span
                    className="inline-flex items-baseline"
                    style={{ fontFamily: f.family, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    <span>Urban</span>
                    <span className="text-primary">n</span>
                    <span>a.</span>
                  </span>
                </div>
                {/* Dark bg */}
                <div className="px-6 py-4 rounded-xl bg-foreground">
                  <span
                    className="inline-flex items-baseline text-background"
                    style={{ fontFamily: f.family, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    <span>Urban</span>
                    <span className="text-primary">n</span>
                    <span>a.</span>
                  </span>
                </div>
                {/* Small */}
                <div className="px-4 py-2 rounded-lg border border-border bg-card">
                  <span
                    className="inline-flex items-baseline"
                    style={{ fontFamily: f.family, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    <span>Urban</span>
                    <span className="text-primary">n</span>
                    <span>a.</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wordmark */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Wordmark (actual)
        </h2>
        <p className="text-xs text-muted-foreground">Azul desaturado / opaco / grisáceo. Hacé click en una paleta para verla aplicada al logo.</p>

        {[
          { key: "1", name: "Steel Blue", hsl: "210 25% 45%", dark: "210 30% 58%", desc: "Azul acero, sobrio y profesional" },
          { key: "2", name: "Slate Blue+", hsl: "215 30% 44%", dark: "215 35% 58%", desc: "Pizarra con más saturación" },
          { key: "3", name: "Slate Vivid", hsl: "215 38% 46%", dark: "215 42% 60%", desc: "Pizarra más vivo, todavía contenido" },
          { key: "4", name: "Graphite+", hsl: "210 25% 40%", dark: "210 28% 55%", desc: "Grafito con más color" },
          { key: "5", name: "Graphite Vivid", hsl: "210 34% 42%", dark: "210 38% 56%", desc: "Grafito vivo, azul-gris con presencia" },
          { key: "6", name: "Mineral Blue", hsl: "212 32% 43%", dark: "212 36% 57%", desc: "Entre pizarra y grafito, equilibrado" },
        ].map(p => (
          <div key={p.key} className="flex items-start gap-6">
            {/* Swatch */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-xl shadow-sm" style={{ backgroundColor: `hsl(${p.hsl})` }} />
              <div className="w-16 h-10 rounded-lg" style={{ backgroundColor: `hsl(${p.dark})` }} />
              <span className="text-[9px] text-muted-foreground font-mono mt-1">{p.hsl}</span>
            </div>
            {/* Logo preview with this color */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{p.key}. {p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.desc}</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Light bg */}
                <div className="px-5 py-3 rounded-xl border border-border bg-card">
                  <span
                    className="inline-flex items-baseline"
                    style={{ fontFamily: FONT, fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    <span>Urban</span>
                    <span style={{ color: `hsl(${p.hsl})` }}>n</span>
                    <span>a.</span>
                  </span>
                </div>
                {/* Dark bg */}
                <div className="px-5 py-3 rounded-xl bg-foreground">
                  <span
                    className="inline-flex items-baseline text-background"
                    style={{ fontFamily: FONT, fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    <span>Urban</span>
                    <span style={{ color: `hsl(${p.dark})` }}>n</span>
                    <span>a.</span>
                  </span>
                </div>
                {/* Button sample */}
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: `hsl(${p.hsl})` }}
                >
                  Botón primario
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Logo largo: actual vs con U estilo ícono */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Wordmark: actual vs U estilo ícono
        </h2>

        {/* Actual */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Actual</span>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="px-6 py-5 rounded-xl border border-border bg-card">
              <span
                className="inline-flex items-baseline"
                style={{ fontFamily: FONT, fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <span>Urban</span>
                <span className="text-primary">n</span>
                <span>a.</span>
              </span>
            </div>
            <div className="px-6 py-5 rounded-xl bg-foreground">
              <span
                className="inline-flex items-baseline text-background"
                style={{ fontFamily: FONT, fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <span>Urban</span>
                <span className="text-primary">n</span>
                <span>a.</span>
              </span>
            </div>
          </div>
        </div>

        {/* Propuesta: U más ancha/bold estilo ícono */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Propuesta: U bold (scaleX + stroke)</span>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="px-6 py-5 rounded-xl border border-border bg-card">
              <span
                className="inline-flex items-baseline"
                style={{ fontFamily: FONT, fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <span style={{ display: "inline-block", transform: "scaleX(1.15)", WebkitTextStroke: "0.5px currentColor", marginRight: 3 }}>U</span>
                <span>rban</span>
                <span className="text-primary">n</span>
                <span>a.</span>
              </span>
            </div>
            <div className="px-6 py-5 rounded-xl bg-foreground">
              <span
                className="inline-flex items-baseline text-background"
                style={{ fontFamily: FONT, fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <span style={{ display: "inline-block", transform: "scaleX(1.15)", WebkitTextStroke: "0.5px currentColor", marginRight: 3 }}>U</span>
                <span>rban</span>
                <span className="text-primary">n</span>
                <span>a.</span>
              </span>
            </div>
          </div>
        </div>

        {/* Propuesta 2: U aún más bold */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Propuesta 2: U extra bold (scaleX 1.2 + stroke 1px)</span>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="px-6 py-5 rounded-xl border border-border bg-card">
              <span
                className="inline-flex items-baseline"
                style={{ fontFamily: FONT, fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <span style={{ display: "inline-block", transform: "scaleX(1.2)", WebkitTextStroke: "1px currentColor", marginRight: 4 }}>U</span>
                <span>rban</span>
                <span className="text-primary">n</span>
                <span>a.</span>
              </span>
            </div>
            <div className="px-6 py-5 rounded-xl bg-foreground">
              <span
                className="inline-flex items-baseline text-background"
                style={{ fontFamily: FONT, fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <span style={{ display: "inline-block", transform: "scaleX(1.2)", WebkitTextStroke: "1px currentColor", marginRight: 4 }}>U</span>
                <span>rban</span>
                <span className="text-primary">n</span>
                <span>a.</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default LogoPreview;
