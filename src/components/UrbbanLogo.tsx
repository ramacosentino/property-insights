interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

/**
 * URBBAN wordmark — all-caps condensed bold.
 * Second "B" rendered at lower opacity for visual distinction.
 * Uses currentColor for mono/theme adaptation.
 */
const UrbbanLogo = ({ className = "", size = "md", showIcon = false }: UrbbanLogoProps) => {
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

  return (
    <span
      className={`inline-flex items-baseline font-black tracking-tight ${textSize[size]} ${className}`}
      style={{ fontFamily: "'Satoshi', system-ui, sans-serif", letterSpacing: "-0.03em" }}
      aria-label="Urbban"
    >
      <span>UR</span>
      <span>B</span>
      <span className="opacity-50">B</span>
      <span>AN</span>
    </span>
  );
};

export default UrbbanLogo;
