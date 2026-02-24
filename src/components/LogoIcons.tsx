interface IconProps {
  size?: number;
  variant?: "light" | "dark";
}

const font = "'Space Grotesk', system-ui, sans-serif";

/**
 * Option 1: U in a rounded square with primary background
 */
export const IconU = ({ size = 32, variant = "light" }: IconProps) => {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.6);
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "hsl(var(--primary))",
        fontFamily: font,
        fontSize,
        fontWeight: 450,
        lineHeight: 1,
        color: variant === "dark" ? "hsl(var(--background))" : "hsl(var(--primary-foreground))",
      }}
      aria-label="U"
    >
      U
    </span>
  );
};

/**
 * Option 2: BB interlocked — first B flipped, heavily overlapping second B.
 * Top crossing: flipped B in front. Bottom crossing: primary B in front.
 * Uses layered rendering with clip-paths on SVG path shapes.
 */
export const IconBB = ({ size = 32, variant = "light" }: IconProps) => {
  const uid = `bb${size}${variant}`;
  const fg = variant === "dark" ? "hsl(var(--background))" : "hsl(var(--foreground))";
  const primary = "hsl(var(--primary))";

  // B glyph path (designed for a ~20x28 box, baseline at y=28)
  // Uppercase B with two bumps
  const bPath = "M0 0 h8 c6 0 10 3 10 7.5 S15 14 10 15 c6 1 11 4 11 8.5 S17 28 11 28 H0z M6 5 v7 h3 c3 0 5-1.5 5-3.5 S12 5 9 5z M6 16 v7 h4 c3.5 0 6-1.5 6-3.5 S13.5 16 10 16z";

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-label="BB">
      <defs>
        {/* Top half clip — flipped B shows on top here */}
        <clipPath id={`${uid}-top`}>
          <rect x="0" y="0" width="36" height="18" />
        </clipPath>
        {/* Bottom half clip — primary B shows on top here */}
        <clipPath id={`${uid}-bot`}>
          <rect x="0" y="18" width="36" height="18" />
        </clipPath>
      </defs>

      {/* --- Bottom layer: both B's fully drawn behind --- */}
      {/* Flipped B (back) */}
      <g transform="translate(23, 4) scale(-1, 1)">
        <path d={bPath} fill={fg} />
      </g>
      {/* Primary B (back) */}
      <g transform="translate(13, 4)">
        <path d={bPath} fill={primary} />
      </g>

      {/* --- Top layer: clipped overlays for interlock effect --- */}
      {/* Flipped B on top at TOP half */}
      <g clipPath={`url(#${uid}-top)`}>
        <g transform="translate(23, 4) scale(-1, 1)">
          <path d={bPath} fill={fg} />
        </g>
      </g>
      {/* Primary B on top at BOTTOM half */}
      <g clipPath={`url(#${uid}-bot)`}>
        <g transform="translate(13, 4)">
          <path d={bPath} fill={primary} />
        </g>
      </g>
    </svg>
  );
};

/**
 * Option 3: U letter with a small primary dot accent
 */
export const IconUAccent = ({ size = 32, variant = "light" }: IconProps) => {
  const fontSize = Math.round(size * 0.7);
  const dotSize = Math.max(3, Math.round(size * 0.12));
  const fg = variant === "dark" ? "hsl(var(--background))" : "hsl(var(--foreground))";
  return (
    <span
      className="inline-flex flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        fontFamily: font,
        fontSize,
        fontWeight: 450,
        lineHeight: 1,
        color: fg,
        position: "relative",
      }}
      aria-label="U"
    >
      U
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: "hsl(var(--primary))",
          position: "absolute",
          bottom: Math.round(size * 0.08),
          right: Math.round(size * 0.18),
        }}
      />
    </span>
  );
};

export default {};
