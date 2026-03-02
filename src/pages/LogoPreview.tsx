import { LogoVariantA } from "@/components/LogoExplorations";
import { IconU, IconBB, IconUAccent } from "@/components/LogoIcons";

/* ─── Font configs ─── */
const FONTS = [
  { key: "orelo-reg", label: "Orelo SemiWide Regular", family: "'Orelo SemiWide Regular', serif", weight: 400 },
  { key: "orelo-med", label: "Orelo SemiWide Medium", family: "'Orelo SemiWide Medium', serif", weight: 400 },
  { key: "orelo-demi", label: "Orelo SemiWide DemiBold", family: "'Orelo SemiWide DemiBold', serif", weight: 400 },
  { key: "orelo-sc-demi", label: "Orelo SemiCondensed DemiBold", family: "'Orelo SemiCondensed DemiBold', serif", weight: 400 },
  { key: "orelo-ext", label: "Orelo Extended Trial", family: "'Orelo Extended Trial', serif", weight: 400 },
] as const;

/* ─── Urbanna wordmark component ─── */
const UrbannaLogo = ({
  fontFamily,
  fontWeight,
  height = 40,
  className = "",
  colorN = "second", // "first" | "second"
}: {
  fontFamily: string;
  fontWeight: number;
  height?: number;
  className?: string;
  colorN?: "first" | "second";
}) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily, fontSize: height, fontWeight, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbanna"
  >
    {colorN === "first" ? (
      <>
        <span>Urba</span>
        <span className="text-primary">n</span>
        <span>na</span>
      </>
    ) : (
      <>
        <span>Urban</span>
        <span className="text-primary">n</span>
        <span>a</span>
      </>
    )}
  </span>
);

/* ─── Case variants for each font ─── */
const CaseVariants = ({
  fontFamily,
  fontWeight,
  height = 36,
}: {
  fontFamily: string;
  fontWeight: number;
  height?: number;
}) => {
  const cases = [
    { label: "Capitalizada", render: (h: number, cls: string, colorN: "first" | "second") => (
      <UrbannaLogo fontFamily={fontFamily} fontWeight={fontWeight} height={h} className={cls} colorN={colorN} />
    )},
    { label: "MAYÚSCULAS", render: (h: number, cls: string, colorN: "first" | "second") => (
      <span className={`inline-flex items-baseline ${cls}`} style={{ fontFamily, fontSize: h, fontWeight, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {colorN === "first" ? (
          <><span>URBA</span><span className="text-primary">N</span><span>NA</span></>
        ) : (
          <><span>URBAN</span><span className="text-primary">N</span><span>A</span></>
        )}
      </span>
    )},
    { label: "minúsculas", render: (h: number, cls: string, colorN: "first" | "second") => (
      <span className={`inline-flex items-baseline ${cls}`} style={{ fontFamily, fontSize: h, fontWeight, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {colorN === "first" ? (
          <><span>urba</span><span className="text-primary">n</span><span>na</span></>
        ) : (
          <><span>urban</span><span className="text-primary">n</span><span>a</span></>
        )}
      </span>
    )},
  ];

  return (
    <div className="space-y-4">
      {cases.map(c => (
        <div key={c.label} className="space-y-2">
          <span className="text-[10px] text-muted-foreground font-mono">{c.label}</span>
          <div className="flex flex-wrap items-center gap-6">
            {/* Color on 1st N */}
            <div className="flex flex-col items-start gap-1">
              <div className="px-6 py-4 rounded-xl border border-border bg-card">
                {c.render(height, "", "first")}
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">1ra N en color</span>
            </div>
            {/* Color on 2nd N */}
            <div className="flex flex-col items-start gap-1">
              <div className="px-6 py-4 rounded-xl border border-border bg-card">
                {c.render(height, "", "second")}
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">2da N en color</span>
            </div>
            {/* Dark background */}
            <div className="flex flex-col items-start gap-1">
              <div className="px-6 py-4 rounded-xl bg-foreground">
                {c.render(height, "text-background", "second")}
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">Fondo oscuro</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    <h1 className="text-2xl font-bold text-center mb-2">Exploración: Urbanna</h1>
    <p className="text-sm text-muted-foreground text-center mb-12 max-w-lg mx-auto">
      Comparación de tipografías y variantes de capitalización. La N destacada en color primario.
    </p>

    <div className="max-w-5xl mx-auto space-y-16">
      {FONTS.map(f => (
        <section key={f.key} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-2">
            <h2 className="text-lg font-semibold">{f.label}</h2>
            <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
              {f.family.split(",")[0].replace(/'/g, "")}
            </span>
          </div>
          <CaseVariants fontFamily={f.family} fontWeight={f.weight} height={38} />
        </section>
      ))}
    </div>

    {/* Sizes comparison */}
    <div className="max-w-5xl mx-auto mt-20">
      <h2 className="text-lg font-semibold mb-6 border-b border-border pb-2">Comparativa de tamaños</h2>
      <div className="space-y-8">
        {FONTS.map(f => (
          <div key={`size-${f.key}`} className="space-y-2">
            <span className="text-xs text-muted-foreground font-mono">{f.label}</span>
            <div className="flex items-end gap-6 flex-wrap">
              {[18, 24, 32, 44].map(size => (
                <div key={size} className="flex flex-col items-start gap-1">
                  <UrbannaLogo fontFamily={f.family} fontWeight={f.weight} height={size} colorN="second" />
                  <span className="text-[9px] text-muted-foreground font-mono">{size}px</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Original URBBAN reference */}
    <div className="max-w-5xl mx-auto mt-20 pt-8 border-t border-border">
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-6">
        Referencia: Logo actual (URBBAN)
      </h2>
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="px-10 py-6 rounded-2xl border border-border bg-card">
          <LogoVariantA height={44} />
        </div>
        <div className="px-10 py-6 rounded-2xl bg-foreground">
          <LogoVariantA height={44} className="text-background" />
        </div>
      </div>

      <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-4">
        Íconos simplificados
      </h3>
      <div className="flex items-center justify-center gap-8">
        {[48, 32, 20].map(s => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-lg border border-border bg-card">
              <IconUAccent size={s} />
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default LogoPreview;
