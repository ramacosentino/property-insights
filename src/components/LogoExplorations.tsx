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
 * Variant G: URBBAN — 450, 1ra B invertida, 2da B primary
 */
export const LogoVariantG = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>UR</span>
    <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span>
    <span className="text-primary">B</span>
    <span>AN</span>
  </span>
);

/**
 * Variant H: urbban — 450, 1ra b invertida, 2da b primary
 */
export const LogoVariantH = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>ur</span>
    <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span>
    <span className="text-primary">b</span>
    <span>an</span>
  </span>
);

/**
 * Variant I: Urbban — 450, 1ra b invertida, 2da b primary
 */
export const LogoVariantI = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span
    className={`inline-flex items-baseline ${className}`}
    style={{ fontFamily: font, fontSize: height, fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1 }}
    aria-label="Urbban"
  >
    <span>Ur</span>
    <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span>
    <span className="text-primary">b</span>
    <span>an</span>
  </span>
);

export default {};
