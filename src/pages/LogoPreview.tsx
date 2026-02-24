import UrbbanLogo from "@/components/UrbbanLogo";

const variants = [
  { key: "default", label: "ACTUAL — All caps bold, 2da B gris" },
  { key: "blue-b", label: "A — urbban, bold, 2da b azul primario" },
  { key: "cap-u", label: "B — Urbban, bold, 2da b azul" },
  { key: "flipped-b", label: "C — urbban, bold, 2da b volteada + azul" },
  { key: "cap-flipped", label: "D — Urbban, bold, 2da b volteada + azul" },
  { key: "thin-blue", label: "E — urbban, fino (medium), 2da b azul" },
  { key: "cap-thin-blue", label: "F — Urbban, fino (medium), 2da b azul" },
] as const;

const LogoPreview = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-6 gap-10">
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
        Comparación de variantes
      </h2>

      {/* Light background */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {variants.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-3">
            <span className="text-[11px] text-muted-foreground font-mono text-center">{label}</span>
            <div className="p-8 rounded-2xl border border-border bg-card w-full flex items-center justify-center">
              <UrbbanLogo size="lg" variant={key as any} />
            </div>
          </div>
        ))}
      </div>

      {/* Dark background */}
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mt-4">
        Sobre fondo oscuro
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
        {variants.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono text-center truncate max-w-full">
              {key}
            </span>
            <div className="p-6 rounded-2xl bg-foreground w-full flex items-center justify-center">
              <UrbbanLogo size="md" variant={key as any} className="text-background" />
            </div>
          </div>
        ))}
      </div>

      {/* Small sizes */}
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mt-4">
        Tamaño sidebar (sm)
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {variants.map(({ key }) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">{key}</span>
            <UrbbanLogo size="sm" variant={key as any} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoPreview;
