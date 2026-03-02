const FONT = "'Orelo SemiCondensed DemiBold', serif";

interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const sizeMap = { sm: 18, md: 22, lg: 32 };

const UrbbanLogo = ({ className = "", size = "md", showIcon = false }: UrbbanLogoProps) => {
  const px = sizeMap[size];

  if (showIcon) {
    return <UrbannaIcon size={px} className={className} />;
  }

  return (
    <span
      className={`inline-flex items-baseline ${className}`}
      style={{ fontFamily: FONT, fontSize: px, letterSpacing: "-0.02em", lineHeight: 1 }}
      aria-label="Urbanna"
    >
      <span>Urban</span>
      <span className="text-primary">n</span>
      <span>a.</span>
    </span>
  );
};

/** Small icon: U with accent dot, using logo font */
export const UrbannaIcon = ({ size = 32, className = "" }: { size?: number; className?: string }) => {
  const dotSize = Math.max(3, Math.round(size * 0.12));
  return (
    <span
      className={`inline-flex items-center justify-center relative ${className}`}
      style={{ width: size, height: size, fontFamily: FONT, fontSize: Math.round(size * 0.7), lineHeight: 1 }}
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
          bottom: Math.round(size * 0.08),
          right: Math.round(size * 0.18),
        }}
      />
    </span>
  );
};

export default UrbbanLogo;
