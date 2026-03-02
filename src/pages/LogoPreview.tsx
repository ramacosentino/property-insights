import UrbbanLogo, { UrbannaIcon } from "@/components/UrbbanLogo";

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-16 px-6">
    <h1 className="text-2xl font-bold text-center mb-2">Logo: Urbanna.</h1>
    <p className="text-sm text-muted-foreground text-center mb-16 max-w-md mx-auto">
      Orelo SemiCondensed DemiBold · 2da N en color primario · Punto final
    </p>

    <div className="max-w-4xl mx-auto space-y-20">
      {/* Wordmark */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Wordmark
        </h2>

        {/* Sizes */}
        <div className="flex items-end gap-8 flex-wrap">
          {[18, 22, 32, 44].map(size => (
            <div key={size} className="flex flex-col items-start gap-1">
              <div className="px-6 py-4 rounded-xl border border-border bg-card">
                <UrbbanLogo size={size === 18 ? "sm" : size === 22 ? "md" : "lg"} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{size}px</span>
            </div>
          ))}
        </div>

        {/* Dark bg */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex flex-col items-start gap-1">
            <div className="px-8 py-5 rounded-xl border border-border bg-card">
              <UrbbanLogo size="lg" />
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Claro</span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <div className="px-8 py-5 rounded-xl bg-foreground">
              <UrbbanLogo size="lg" className="text-background" />
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">Oscuro</span>
          </div>
        </div>
      </section>

      {/* Icon */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
          Ícono (U + dot)
        </h2>
        <div className="flex items-end gap-8 flex-wrap">
          {[48, 32, 24, 18].map(s => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-xl border border-border bg-card">
                <UrbannaIcon size={s} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-8 flex-wrap">
          {[48, 32, 24].map(s => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-xl bg-foreground">
                <UrbannaIcon size={s} className="text-background" />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px oscuro</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default LogoPreview;
