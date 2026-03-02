import UrbbanLogo, { UrbannaIcon } from "@/components/UrbbanLogo";

const FONT = "'Orelo SemiCondensed DemiBold', serif";

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
      {/* Wordmark */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Wordmark
        </h2>
        <div className="flex items-end gap-8 flex-wrap">
          {(["sm", "md", "lg"] as const).map(s => (
            <div key={s} className="flex flex-col items-start gap-1">
              <div className="px-6 py-4 rounded-xl border border-border bg-card">
                <UrbbanLogo size={s} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="px-8 py-5 rounded-xl border border-border bg-card">
            <UrbbanLogo size="lg" />
          </div>
          <div className="px-8 py-5 rounded-xl bg-foreground">
            <UrbbanLogo size="lg" className="text-background" />
          </div>
        </div>
      </section>

      {/* Icon variants */}
      <section className="space-y-8">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Alternativas de ícono simplificado
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {VARIANTS.map(v => (
            <div key={v.key} className="space-y-3">
              <div className="flex flex-col items-center gap-2">
                {/* Light */}
                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-center" style={{ minWidth: 80, minHeight: 80 }}>
                  <v.Component size={48} />
                </div>
                {/* Dark */}
                <div className="p-4 rounded-xl bg-foreground flex items-center justify-center" style={{ minWidth: 80, minHeight: 80 }}>
                  <v.Component size={48} className="text-background" />
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold">{v.key}. {v.label}</span>
                <p className="text-[10px] text-muted-foreground">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Size comparison of all */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-mono text-muted-foreground">Comparativa a 24px (tamaño sidebar)</h3>
          <div className="flex items-center gap-6 flex-wrap">
            {VARIANTS.map(v => (
              <div key={v.key} className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-center" style={{ minWidth: 40, minHeight: 40 }}>
                  <v.Component size={24} />
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">{v.key}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default LogoPreview;
