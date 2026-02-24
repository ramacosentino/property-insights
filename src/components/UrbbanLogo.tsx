interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "blue-b" | "thin-blue" | "cap-thin-blue" | "cap-u";
  font?: "satoshi" | "space" | "dm" | "jakarta";
}

const fontFamilies = {
  satoshi: "'Satoshi', system-ui, sans-serif",
  space: "'Space Grotesk', system-ui, sans-serif",
  dm: "'DM Sans', system-ui, sans-serif",
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const UrbbanLogo = ({
  className = "",
  size = "md",
  showIcon = false,
  variant = "blue-b",
  font = "satoshi",
}: UrbbanLogoProps) => {
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
        <span
          className="font-bold tracking-tighter"
          style={{ color: "hsl(var(--background))", fontFamily: fontFamilies[font] }}
        >
          U
        </span>
      </span>
    );
  }

  const configs = {
    "blue-b": { text: "urbban", weight: "font-black", tracking: "-0.03em" },
    "thin-blue": { text: "urbban", weight: "font-medium", tracking: "-0.015em" },
    "cap-thin-blue": { text: "Urbban", weight: "font-medium", tracking: "-0.015em" },
    "cap-u": { text: "Urbban", weight: "font-bold", tracking: "-0.025em" },
  };

  const c = configs[variant];

  // Split around the second 'b'
  const lowerText = c.text.toLowerCase();
  const firstBIdx = lowerText.indexOf("b");
  const secondBIdx = lowerText.indexOf("b", firstBIdx + 1);

  const before = c.text.slice(0, secondBIdx);
  const bChar = c.text[secondBIdx];
  const after = c.text.slice(secondBIdx + 1);

  // Shadow/relief style for the accent b — darker blue with subtle text-shadow
  const bShadowStyle: React.CSSProperties = {
    color: "hsl(200 85% 35%)",
    textShadow: "1px 1px 0px hsl(200 85% 25% / 0.3), 0px 2px 4px hsl(200 85% 20% / 0.15)",
    fontFamily: fontFamilies[font],
  };

  return (
    <span
      className={`inline-flex items-baseline ${c.weight} ${textSize[size]} ${className}`}
      style={{ fontFamily: fontFamilies[font], letterSpacing: c.tracking }}
      aria-label="Urbban"
    >
      <span>{before}</span>
      <span style={bShadowStyle}>{bChar}</span>
      <span>{after}</span>
    </span>
  );
};

export default UrbbanLogo;
