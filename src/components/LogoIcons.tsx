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
 * Option 2: BB side by side — first B flipped, second B in primary
 */
export const IconBB = ({ size = 32, variant = "light" }: IconProps) => {
  const fontSize = Math.round(size * 0.55);
  const fg = variant === "dark" ? "hsl(var(--background))" : "hsl(var(--foreground))";
  return (
    <span
      className="inline-flex items-baseline justify-center"
      style={{
        width: size,
        height: size,
        fontFamily: font,
        fontSize,
        fontWeight: 450,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * -0.04),
        color: fg,
      }}
      aria-label="BB"
    >
      <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span>
      <span className="text-primary">B</span>
    </span>
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
