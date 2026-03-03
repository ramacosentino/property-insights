const FONT = "'Orelo SemiCondensed DemiBold', serif";

interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const sizeMap = { sm: 22, md: 28, lg: 38 };

const UrbbanLogo = ({ className = "", size = "md", showIcon = false }: UrbbanLogoProps) => {
  const px = sizeMap[size];

  if (showIcon) {
    return <UrbannaIcon size={px} className={className} />;
  }

  return (
    <span
      className={`inline-flex items-baseline ${className}`}
      style={{ fontFamily: FONT, fontSize: px, lineHeight: 1 }}
      aria-label="Urbanna"
    >
      <span style={{ letterSpacing: "0.03em" }}>Urban</span>
      <span className="text-primary" style={{ letterSpacing: "0.03em" }}>n</span>
      <span style={{ letterSpacing: "0.03em" }}>a</span>
      <span style={{ letterSpacing: 0 }}>.</span>
    </span>
  );
};

/** Small icon: U with accent dot on dark rounded square, using logo font */
export const UrbannaIcon = ({ size = 32, className = "" }: { size?: number; className?: string }) => {
  const dotSize = Math.max(3, Math.round(size * 0.12));
  const radius = Math.round(size * 0.22);
  return (
    <span
      className={`inline-flex items-center justify-center relative bg-foreground text-background ${className}`}
      style={{ width: size, height: size, borderRadius: radius, fontFamily: FONT, fontSize: Math.round(size * 0.78), lineHeight: 1 }}
      aria-label="U"
    >
      U
      <span
        className="bg-primary"
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          position: "absolute",
          bottom: Math.round(size * 0.1),
          right: Math.round(size * 0.18),
        }}
      />
    </span>
  );
};

export default UrbbanLogo;
