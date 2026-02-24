import UrbbanLogo from "@/components/UrbbanLogo";

/**
 * Preview page to compare logo variants side by side.
 * Accessible at /logo-preview (temporary).
 */
const LogoPreview = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-16 p-8">
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Comparación de variantes</h2>

      {/* Current */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">ACTUAL — All caps, bold</span>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <UrbbanLogo size="lg" variant="default" />
        </div>
      </div>

      {/* Variant A: lowercase */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">VARIANTE A — Minúsculas (urbban)</span>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <UrbbanLogo size="lg" variant="lowercase" />
        </div>
      </div>

      {/* Variant B: thin */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">VARIANTE B — Más delgado, 2da B más opaca</span>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <UrbbanLogo size="lg" variant="thin" />
        </div>
      </div>

      {/* Dark backgrounds */}
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mt-8">Sobre fondo oscuro</h2>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {(["default", "lowercase", "thin"] as const).map((v) => (
          <div key={v} className="flex flex-col items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">{v}</span>
            <div className="p-6 rounded-2xl bg-foreground">
              <UrbbanLogo size="lg" variant={v} className="text-background" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoPreview;
