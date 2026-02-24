interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "default" | "lowercase" | "thin" | "blue-b" | "cap-u" | "flipped-b" | "thin-blue" | "cap-thin-blue" | "cap-flipped";
}

/**
 * URBBAN wordmark variants:
 * - default: All caps, black weight, 2nd B at 50% opacity
 * - lowercase: "urbban" lowercase, black weight, 2nd b at 50%
 * - thin: All caps, semibold (thinner), 2nd B at 35%
 * - blue-b: lowercase, black weight, 2nd b in primary color
 * - cap-u: "Urbban" with capital U, black weight, 2nd b in primary
 * - flipped-b: lowercase, 2nd b horizontally flipped
 * - thin-blue: lowercase, thin weight, 2nd b in primary
 * - cap-thin-blue: "Urbban" capital U, thin weight, 2nd b in primary
 * - cap-flipped: "Urbban" capital U, 2nd b flipped
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
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-current ${iconSize[size]} ${className}`}
        aria-label="Urbban"
      >
        <span className="font-black tracking-tighter" style={{ color: "hsl(var(--background))", fontFamily: "'Satoshi', system-ui, sans-serif" }}>
          U
        </span>
      </span>
    );
  }

  // Config per variant
  const config = {
    default: { text: "URBBAN", weight: "font-black", tracking: "-0.03em", bStyle: "opacity-50", bColor: "", flipped: false },
    lowercase: { text: "urbban", weight: "font-black", tracking: "-0.03em", bStyle: "opacity-50", bColor: "", flipped: false },
    thin: { text: "URBBAN", weight: "font-semibold", tracking: "-0.02em", bStyle: "opacity-35", bColor: "", flipped: false },
    "blue-b": { text: "urbban", weight: "font-black", tracking: "-0.03em", bStyle: "", bColor: "text-primary", flipped: false },
    "cap-u": { text: "Urbban", weight: "font-black", tracking: "-0.03em", bStyle: "", bColor: "text-primary", flipped: false },
    "flipped-b": { text: "urbban", weight: "font-black", tracking: "-0.03em", bStyle: "", bColor: "text-primary", flipped: true },
    "thin-blue": { text: "urbban", weight: "font-medium", tracking: "-0.02em", bStyle: "", bColor: "text-primary", flipped: false },
    "cap-thin-blue": { text: "Urbban", weight: "font-medium", tracking: "-0.02em", bStyle: "", bColor: "text-primary", flipped: false },
    "cap-flipped": { text: "Urbban", weight: "font-black", tracking: "-0.03em", bStyle: "", bColor: "text-primary", flipped: true },
  };

  const c = config[variant] || config.default;
  const chars = c.text.split("");
  // Find second 'b'/'B' index
  let bCount = 0;
  const secondBIndex = chars.findIndex((ch) => {
    if (ch.toLowerCase() === "b") {
      bCount++;
      if (bCount === 2) return true;
    }
    return false;
  });

  return (
    <span
      className={`inline-flex items-baseline ${c.weight} tracking-tight ${textSize[size]} ${className}`}
      style={{ fontFamily: "'Satoshi', system-ui, sans-serif", letterSpacing: c.tracking }}
      aria-label="Urbban"
    >
      {chars.map((ch, i) => {
        if (i === secondBIndex) {
          return (
            <span
              key={i}
              className={`${c.bStyle} ${c.bColor}`}
              style={c.flipped ? { display: "inline-block", transform: "scaleX(-1)" } : undefined}
            >
              {ch}
            </span>
          );
        }
        return <span key={i}>{ch}</span>;
      })}
    </span>
  );
};

export default UrbbanLogo;
