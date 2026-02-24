import {
  LogoVariantA,
} from "@/components/LogoExplorations";
import { IconU, IconBB, IconUAccent } from "@/components/LogoIcons";

const LogoPreview = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    {/* Logo principal elegido */}
    <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
      Logo elegido: URBBAN
    </h2>
    <div className="flex items-center justify-center gap-6 mb-16">
      <div className="px-10 py-6 rounded-2xl border border-border bg-card flex items-center justify-center">
        <LogoVariantA height={44} />
      </div>
      <div className="px-10 py-6 rounded-2xl bg-foreground flex items-center justify-center">
        <LogoVariantA height={44} className="text-background" />
      </div>
    </div>

    {/* Íconos simplificados */}
    <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
      Ícono simplificado — opciones
    </h2>
    <p className="text-xs text-muted-foreground text-center mb-10">
      Para favicon, pestaña del navegador, sidebar colapsada
    </p>

    <div className="max-w-3xl mx-auto space-y-12">
      {/* Option 1: U en cuadrado */}
      <div className="space-y-3">
        <span className="block text-[11px] text-muted-foreground font-mono text-center">
          Opción 1 — U en cuadrado redondeado (fondo primario)
        </span>
        <div className="flex items-center justify-center gap-8">
          {[48, 32, 20, 16].map((s) => (
            <div key={`1l-${s}`} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-center">
                <IconU size={s} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8">
          {[48, 32, 20, 16].map((s) => (
            <div key={`1d-${s}`} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-foreground flex items-center justify-center">
                <IconU size={s} variant="dark" />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Option 2: BB juntas */}
      <div className="space-y-3">
        <span className="block text-[11px] text-muted-foreground font-mono text-center">
          Opción 2 — BB juntas (1ra invertida, 2da en primario)
        </span>
        <div className="flex items-center justify-center gap-8">
          {[48, 32, 20, 16].map((s) => (
            <div key={`2l-${s}`} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-center">
                <IconBB size={s} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8">
          {[48, 32, 20, 16].map((s) => (
            <div key={`2d-${s}`} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-foreground flex items-center justify-center">
                <IconBB size={s} variant="dark" />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Option 3: U con acento */}
      <div className="space-y-3">
        <span className="block text-[11px] text-muted-foreground font-mono text-center">
          Opción 3 — U con punto/acento en primario
        </span>
        <div className="flex items-center justify-center gap-8">
          {[48, 32, 20, 16].map((s) => (
            <div key={`3l-${s}`} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-center">
                <IconUAccent size={s} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8">
          {[48, 32, 20, 16].map((s) => (
            <div key={`3d-${s}`} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-foreground flex items-center justify-center">
                <IconUAccent size={s} variant="dark" />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">{s}px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default LogoPreview;
