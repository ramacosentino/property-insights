interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "default" | "lowercase" | "thin";
}

/**
 * URBBAN wordmark with multiple variants:
 * - default: All caps, black weight, 2nd B at 50% opacity
 * - lowercase: "urbban" in lowercase, black weight, 2nd b at 50% opacity
 * - thin: All caps, medium weight (thinner), 2nd B at 35% opacity
 */
const UrbbanLogo = ({ className = "", size = "md", showIcon = false, variant = "default" }: UrbbanLogoProps) => {
  const textSize = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  };

  const iconSize = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-7 h-7 text-xs",
    lg: "w-9 h-9 text-sm",
  };

  if (showIcon) {
    const iconLetter = variant === "lowercase" ? "u" : "U";
    const iconWeight = variant === "thin" ? "font-semibold" : "font-black";
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-current ${iconSize[size]} ${className}`}
        aria-label="Urbban"
      >
        <span className={`${iconWeight} tracking-tighter`} style={{ color: "hsl(var(--background))", fontFamily: "'Satoshi', system-ui, sans-serif" }}>
          {iconLetter}
        </span>
      </span>
    );
  }

  const weightClass = variant === "thin" ? "font-semibold" : "font-black";
  const secondBOpacity = variant === "thin" ? "opacity-35" : "opacity-50";
  const tracking = variant === "thin" ? "-0.02em" : "-0.03em";

  const text = variant === "lowercase"
    ? { a: "ur", b1: "b", b2: "b", c: "an" }
    : { a: "UR", b1: "B", b2: "B", c: "AN" };

  return (
    <span
      className={`inline-flex items-baseline ${weightClass} tracking-tight ${textSize[size]} ${className}`}
      style={{ fontFamily: "'Satoshi', system-ui, sans-serif", letterSpacing: tracking }}
      aria-label="Urbban"
    >
      <span>{text.a}</span>
      <span>{text.b1}</span>
      <span className={secondBOpacity}>{text.b2}</span>
      <span>{text.c}</span>
    </span>
  );
};

export default UrbbanLogo;
