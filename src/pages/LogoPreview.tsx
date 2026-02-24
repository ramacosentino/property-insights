import { LogoVariantA, LogoVariantD } from "@/components/LogoExplorations";

const variants = [
  { key: "A", label: "A — Bold geométrica, U cuadrada, b con bowl tipo U", Component: LogoVariantA },
  { key: "D", label: "D — Clean moderna, U definida, b con bowl suave", Component: LogoVariantD },
];

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
      Variantes A y D — refinadas
    </h2>
    <p className="text-xs text-muted-foreground text-center mb-12">
      Espaciado corregido, letras alineadas, proporciones ajustadas
    </p>

    <div className="max-w-3xl mx-auto space-y-12">
      {variants.map(({ key, label, Component }) => (
        <div key={key} className="space-y-4">
          <span className="block text-[11px] text-muted-foreground font-mono text-center">{label}</span>
          {/* Large light */}
          <div className="w-full p-12 rounded-2xl border border-border bg-card flex items-center justify-center">
            <Component height={56} />
          </div>
          {/* Large dark */}
          <div className="w-full p-12 rounded-2xl bg-foreground flex items-center justify-center">
            <Component height={56} className="text-background" />
          </div>
          {/* Medium */}
          <div className="flex items-center justify-center gap-8">
            <div className="px-8 py-4 rounded-xl border border-border bg-card flex items-center justify-center">
              <Component height={32} />
            </div>
            <div className="px-8 py-4 rounded-xl bg-foreground flex items-center justify-center">
              <Component height={32} className="text-background" />
            </div>
          </div>
          {/* Small / sidebar */}
          <div className="flex items-center justify-center gap-8">
            <div className="px-6 py-3 rounded-lg border border-border bg-card flex items-center justify-center">
              <Component height={20} />
            </div>
            <div className="px-6 py-3 rounded-lg bg-foreground flex items-center justify-center">
              <Component height={20} className="text-background" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LogoPreview;
