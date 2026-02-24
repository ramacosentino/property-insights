interface LogoExplorationProps {
  className?: string;
  height?: number;
}

const font = "'Space Grotesk', system-ui, sans-serif";

/**
 * Variant A: URBBAN — all caps, thin weight, second B in primary
 */
export const LogoVariantA = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>URB</span>
    <span className="text-primary">B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant B: URBBAN — all caps, medium weight, second B in primary
 */
export const LogoVariantB = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>URB</span>
    <span className="text-primary">B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant C: URBBAN — all caps, semibold, second B in primary
 */
export const LogoVariantC = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>URB</span>
    <span className="text-primary">B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant D: URBBAN — all caps, thin, second B flipped horizontally (primary)
 */
export const LogoVariantD = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>URB</span>
    <span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant E: URBBAN — all caps, medium, second B flipped (primary)
 */
export const LogoVariantE = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>URB</span>
    <span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant F: URBBAN — all caps, semibold, second B flipped (primary)
 */
export const LogoVariantF = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>URB</span>
    <span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant G: Urbban — cap U, thin, both B flipped (primary on second)
 */
export const LogoVariantG = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>Urb</span>
    <span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span>
    <span>an</span>
  </span>
);

/**
 * Variant H: Urbban — cap U, medium, both B flipped (primary on second)
 */
export const LogoVariantH = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>Urb</span>
    <span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span>
    <span>an</span>
  </span>
);

export default {};
