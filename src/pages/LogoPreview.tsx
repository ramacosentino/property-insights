import {
  LogoVariantA, LogoVariantB, LogoVariantC,
  LogoVariantD, LogoVariantE, LogoVariantF,
  LogoVariantG, LogoVariantH,
} from "@/components/LogoExplorations";

const variants = [
  { key: "A", label: "URBBAN · thin (400)", Component: LogoVariantA },
  { key: "B", label: "URBBAN · medium (500)", Component: LogoVariantB },
  { key: "C", label: "URBBAN · semibold (600)", Component: LogoVariantC },
  { key: "D", label: "URBBAN · thin · B invertida", Component: LogoVariantD },
  { key: "E", label: "URBBAN · medium · B invertida", Component: LogoVariantE },
  { key: "F", label: "URBBAN · semibold · B invertida", Component: LogoVariantF },
  { key: "G", label: "Urbban · thin · b invertida", Component: LogoVariantG },
  { key: "H", label: "Urbban · medium · b invertida", Component: LogoVariantH },
];

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
      Space Grotesk — Mayúsculas + B invertida
    </h2>
    <p className="text-xs text-muted-foreground text-center mb-12">
      Segunda B en color primario · variantes normal e invertida
    </p>

    <div className="max-w-3xl mx-auto space-y-10">
      {variants.map(({ key, label, Component }) => (
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
);

export default LogoPreview;
