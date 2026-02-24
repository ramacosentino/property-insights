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
 * Option 2: BB interlocked — first B flipped, overlapping with second B.
 * At top overlap: flipped B is in front. At bottom overlap: primary B is in front.
 * Achieved via SVG clip paths.
 */
export const IconBB = ({ size = 32, variant = "light" }: IconProps) => {
  const id = `bb-${size}-${variant}`;
  const fg = variant === "dark" ? "hsl(var(--background))" : "hsl(var(--foreground))";
  // viewBox is 40x40, B glyphs overlap in the center
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="BB"
    >
      <defs>
        {/* Clip for flipped B: show full top half, hide where primary B overlaps at bottom */}
        <clipPath id={`${id}-clip1`}>
          <rect x="0" y="0" width="40" height="22" />
          <rect x="0" y="22" width="14" height="18" />
        </clipPath>
        {/* Clip for primary B: show full bottom half, hide where flipped B overlaps at top */}
        <clipPath id={`${id}-clip2`}>
          <rect x="0" y="20" width="40" height="20" />
          <rect x="22" y="0" width="18" height="20" />
        </clipPath>
      </defs>
      {/* Flipped B (mirrored) — on top at the top overlap */}
      <g clipPath={`url(#${id}-clip1)`}>
        <g transform="translate(22, 0) scale(-1, 1)">
          <text
            x="0"
            y="32"
            fill={fg}
            style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}
          >
            B
          </text>
        </g>
      </g>
      {/* Primary B — on top at the bottom overlap */}
      <g clipPath={`url(#${id}-clip2)`}>
        <text
          x="16"
          y="32"
          fill="hsl(var(--primary))"
          style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}
        >
          B
        </text>
      </g>
      {/* Unclipped parts to fill gaps */}
      {/* Flipped B bottom (behind primary) */}
      <g>
        <g transform="translate(22, 0) scale(-1, 1)">
          <text
            x="0"
            y="32"
            fill={fg}
            style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}
            opacity={0.999}
          />
        </g>
      </g>
      {/* Primary B top (behind flipped) */}
      <g>
        <text
          x="16"
          y="32"
          fill="hsl(var(--primary))"
          style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}
          opacity={0.999}
        />
      </g>

      {/* Layer order: draw both fully, then overlay clipped versions */}
      {/* Full flipped B (back layer) */}
      <g transform="translate(22, 0) scale(-1, 1)" opacity="1">
        <text x="0" y="32" fill={fg} style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}>B</text>
      </g>
      {/* Full primary B (back layer) */}
      <text x="16" y="32" fill="hsl(var(--primary))" style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}>B</text>
      {/* Flipped B top portion (front, covers primary at top) */}
      <g clipPath={`url(#${id}-clip1)`}>
        <g transform="translate(22, 0) scale(-1, 1)">
          <text x="0" y="32" fill={fg} style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}>B</text>
        </g>
      </g>
      {/* Primary B bottom portion (front, covers flipped at bottom) */}
      <g clipPath={`url(#${id}-clip2)`}>
        <text x="16" y="32" fill="hsl(var(--primary))" style={{ fontFamily: font, fontSize: 34, fontWeight: 450 }}>B</text>
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
