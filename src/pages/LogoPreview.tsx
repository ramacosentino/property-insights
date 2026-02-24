import UrbbanLogo from "@/components/UrbbanLogo";

type Variant = "blue-b" | "thin-blue" | "cap-thin-blue" | "cap-u";
type Font = "satoshi" | "space" | "dm" | "jakarta";

const variants: { key: Variant; label: string }[] = [
  { key: "blue-b", label: "urbban · bold" },
  { key: "cap-u", label: "Urbban · bold" },
  { key: "thin-blue", label: "urbban · fino" },
  { key: "cap-thin-blue", label: "Urbban · fino" },
];

const fonts: { key: Font; label: string }[] = [
  { key: "satoshi", label: "Satoshi" },
  { key: "space", label: "Space Grotesk" },
  { key: "dm", label: "DM Sans" },
  { key: "jakarta", label: "Plus Jakarta Sans" },
];

const LogoPreview = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mb-2">
        Comparación de variantes × fuentes
      </h2>
      <p className="text-xs text-muted-foreground text-center mb-10">
        Segunda b en azul oscuro con sombra/relieve
      </p>

      {/* Main grid: fonts as columns, variants as rows */}
      <div className="max-w-6xl mx-auto overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-mono text-muted-foreground p-2 w-32" />
              {fonts.map((f) => (
                <th key={f.key} className="text-center text-[11px] font-mono text-muted-foreground p-2">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.key}>
                <td className="text-[11px] font-mono text-muted-foreground p-2 align-middle whitespace-nowrap">
                  {v.label}
                </td>
                {fonts.map((f) => (
                  <td key={f.key} className="p-2">
                    <div className="flex items-center justify-center p-6 rounded-xl border border-border bg-card">
                      <UrbbanLogo size="lg" variant={v.key} font={f.key} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dark background */}
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mt-14 mb-6">
        Sobre fondo oscuro
      </h2>
      <div className="max-w-6xl mx-auto overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-mono text-muted-foreground p-2 w-32" />
              {fonts.map((f) => (
                <th key={f.key} className="text-center text-[11px] font-mono text-muted-foreground p-2">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.key}>
                <td className="text-[11px] font-mono text-muted-foreground p-2 align-middle whitespace-nowrap">
                  {v.label}
                </td>
                {fonts.map((f) => (
                  <td key={f.key} className="p-2">
                    <div className="flex items-center justify-center p-6 rounded-xl bg-foreground">
                      <UrbbanLogo size="lg" variant={v.key} font={f.key} className="text-background" />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar size */}
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-center mt-14 mb-6">
        Tamaño sidebar (sm)
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-6 max-w-5xl mx-auto">
        {variants.map((v) =>
          fonts.map((f) => (
            <div key={`${v.key}-${f.key}`} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground font-mono">
                {v.label} · {f.label}
              </span>
              <UrbbanLogo size="sm" variant={v.key} font={f.key} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogoPreview;
