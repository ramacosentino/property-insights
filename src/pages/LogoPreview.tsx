import {
  LogoVariantA, LogoVariantB, LogoVariantC,
  LogoVariantD, LogoVariantE, LogoVariantF,
  LogoVariantG, LogoVariantH, LogoVariantI,
} from "@/components/LogoExplorations";

const sections = [
  {
    title: "Normal (2da B en primario)",
    variants: [
      { key: "A", label: "URBBAN · mayúsculas", Component: LogoVariantA },
      { key: "B", label: "urbban · minúsculas", Component: LogoVariantB },
      { key: "C", label: "Urbban · solo U mayúscula", Component: LogoVariantC },
    ],
  },
  {
    title: "2da B invertida",
    variants: [
      { key: "D", label: "URBBAN · mayúsculas", Component: LogoVariantD },
      { key: "E", label: "urbban · minúsculas", Component: LogoVariantE },
      { key: "F", label: "Urbban · solo U mayúscula", Component: LogoVariantF },
    ],
  },
  {
    title: "1ra B invertida (2da en primario)",
    variants: [
      { key: "G", label: "URBBAN · mayúsculas", Component: LogoVariantG },
      { key: "H", label: "urbban · minúsculas", Component: LogoVariantH },
      { key: "I", label: "Urbban · solo U mayúscula", Component: LogoVariantI },
    ],
  },
];

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
      Space Grotesk · peso 450
    </h2>
    <p className="text-xs text-muted-foreground text-center mb-12">
      3 casing × 3 estilos de B = 9 variantes
    </p>

    <div className="max-w-4xl mx-auto space-y-14">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center mb-6 border-b border-border pb-2">
            {section.title}
          </h3>
          <div className="space-y-8">
            {section.variants.map(({ key, label, Component }) => (
              <div key={key} className="space-y-3">
                <span className="block text-[11px] text-muted-foreground font-mono text-center">{label}</span>
                <div className="flex items-center justify-center gap-6">
                  <div className="px-10 py-6 rounded-2xl border border-border bg-card flex items-center justify-center">
                    <Component height={44} />
                  </div>
                  <div className="px-10 py-6 rounded-2xl bg-foreground flex items-center justify-center">
                    <Component height={44} className="text-background" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="px-6 py-3 rounded-lg border border-border bg-card flex items-center justify-center">
                    <Component height={22} />
                  </div>
                  <div className="px-6 py-3 rounded-lg bg-foreground flex items-center justify-center">
                    <Component height={22} className="text-background" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LogoPreview;
