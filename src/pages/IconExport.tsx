const FONT = "'Orelo SemiCondensed DemiBold', serif";

const IconExport = () => {
  const sizes = [512, 256, 128, 64, 32];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-16 py-16">
      <h1 className="text-lg font-mono text-neutral-400">Urbanna Icon Export</h1>

      {sizes.map((size) => {
        const dotSize = Math.max(3, Math.round(size * 0.11));
        const radius = Math.round(size * 0.22);
        return (
          <div key={size} className="flex flex-col items-center gap-4">
            <span className="text-xs font-mono text-neutral-400">{size}×{size}px</span>
            {/* The icon on checkered bg so user sees it clearly */}
            <div
              style={{
                background: "repeating-conic-gradient(#e5e5e5 0% 25%, transparent 0% 50%) 50% / 20px 20px",
                padding: 24,
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  width: size,
                  height: size,
                  borderRadius: radius,
                  backgroundColor: "#1c2130",
                  fontFamily: FONT,
                  fontSize: Math.round(size * 0.58),
                  lineHeight: 1,
                  color: "#ffffff",
                  fontWeight: 700,
                  letterSpacing: `${Math.round(size * 0.03)}px`,
                  paddingLeft: Math.round(size * 0.03),
                  paddingBottom: Math.round(size * 0.02),
                  WebkitTextStroke: `${Math.max(1, Math.round(size * 0.008))}px #ffffff`,
                }}
              >
                U
                <span
                  style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: "50%",
                    backgroundColor: "hsl(215, 45%, 48%)",
                    position: "absolute",
                    bottom: Math.round(size * 0.13),
                    right: Math.round(size * 0.2),
                  }}
                />
              </span>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-neutral-400 font-mono max-w-sm text-center">
        Hacé click derecho → "Guardar imagen" o sacá una captura del tamaño que necesites.
      </p>
    </div>
  );
};

export default IconExport;
