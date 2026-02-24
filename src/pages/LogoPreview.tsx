import { LogoVariantA, LogoVariantB, LogoVariantC, LogoVariantD } from "@/components/LogoExplorations";

const variants = [
  {
    key: "A",
    label: "Variante A — Bold geométrica, U cuadrada, b con panza de U",
    Component: LogoVariantA,
  },
  {
    key: "B",
    label: "Variante B — Medium, U suave, b con bowl tipo U",
    Component: LogoVariantB,
  },
  {
    key: "C",
    label: "Variante C — Bold, U ancha, bowls de b como U abierta",
    Component: LogoVariantC,
  },
  {
    key: "D",
    label: "Variante D — Clean, U con esquinas definidas, counter de b como U",
    Component: LogoVariantD,
  },
];

const LogoPreview = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
        Exploraciones tipográficas
      </h2>
      <p className="text-xs text-muted-foreground text-center mb-12 max-w-md mx-auto">
        La forma de la U se refleja en la panza de las b. Segunda b en azul primario.
      </p>

      {/* Large previews */}
      <div className="max-w-3xl mx-auto space-y-10">
        {variants.map(({ key, label, Component }) => (
          <div key={key} className="flex flex-col items-center gap-4">
            <span className="text-[11px] text-muted-foreground font-mono text-center">{label}</span>
            {/* Light bg */}
            <div className="w-full p-10 rounded-2xl border border-border bg-card flex items-center justify-center">
              <Component height={52} />
            </div>
            {/* Dark bg */}
            <div className="w-full p-10 rounded-2xl bg-foreground flex items-center justify-center">
              <Component height={52} className="text-background" />
            </div>
          </div>
        ))}
      </div>

      {/* Small sizes comparison */}
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mt-16 mb-8">
        Tamaño sidebar (sm)
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-10 max-w-4xl mx-auto">
        {variants.map(({ key, Component }) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{key}</span>
            <Component height={22} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-10 max-w-4xl mx-auto mt-6">
        {variants.map(({ key, Component }) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{key} dark</span>
            <div className="px-4 py-2 rounded-lg bg-foreground">
              <Component height={22} className="text-background" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoPreview;
