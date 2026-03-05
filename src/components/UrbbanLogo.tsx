const FONT = "'Orelo SemiCondensed DemiBold', serif";

interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const sizeMap = { sm: 24, md: 30, lg: 42 };

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

/** Small icon: U with accent dot on dark rounded square — uses the PNG asset */
export const UrbannaIcon = ({ size = 32, className = "" }: { size?: number; className?: string }) => {
  const radius = Math.round(size * 0.22);
  return (
    <img
      src="/urbanna-icon.png"
      alt="Urbanna"
      className={className}
      style={{ width: size, height: size, borderRadius: radius, objectFit: "cover" }}
    />
  );
};

export default UrbbanLogo;
