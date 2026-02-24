import { LogoVariantA } from "./LogoExplorations";
import { IconUAccent } from "./LogoIcons";

interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const sizeMap = {
  sm: 18,
  md: 22,
  lg: 32,
};

const UrbbanLogo = ({ className = "", size = "md", showIcon = false }: UrbbanLogoProps) => {
  if (showIcon) {
    return <IconUAccent size={sizeMap[size]} />;
  }
  return <LogoVariantA height={sizeMap[size]} className={className} />;
};

export default UrbbanLogo;
