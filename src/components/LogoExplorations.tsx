interface LogoExplorationProps {
  className?: string;
  height?: number;
}

const font = "'Space Grotesk', system-ui, sans-serif";
const w = 450;
const ls = "-0.02em";

/** A: URBBAN — normal */
export const LogoVariantA = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>URB</span><span className="text-primary">B</span><span>AN</span>
  </span>
);

/** B: urbban — normal */
export const LogoVariantB = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>urb</span><span className="text-primary">b</span><span>an</span>
  </span>
);

/** C: Urbban — normal */
export const LogoVariantC = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>Urb</span><span className="text-primary">b</span><span>an</span>
  </span>
);

/** D: URBBAN — 2da B invertida */
export const LogoVariantD = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>URB</span><span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span><span>AN</span>
  </span>
);

/** E: urbban — 2da b invertida */
export const LogoVariantE = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>urb</span><span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span><span>an</span>
  </span>
);

/** F: Urbban — 2da b invertida */
export const LogoVariantF = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>Urb</span><span className="text-primary" style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span><span>an</span>
  </span>
);

/** G: URBBAN — 1ra B invertida */
export const LogoVariantG = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>UR</span><span style={{ display: "inline-block", transform: "scaleX(-1)" }}>B</span><span className="text-primary">B</span><span>AN</span>
  </span>
);

/** H: urbban — 1ra b invertida */
export const LogoVariantH = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>ur</span><span style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span><span className="text-primary">b</span><span>an</span>
  </span>
);

/** I: Urbban — 1ra b invertida */
export const LogoVariantI = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <span className={`inline-flex items-baseline ${className}`} style={{ fontFamily: font, fontSize: height, fontWeight: w, letterSpacing: ls, lineHeight: 1 }} aria-label="Urbban">
    <span>Ur</span><span style={{ display: "inline-block", transform: "scaleX(-1)" }}>b</span><span className="text-primary">b</span><span>an</span>
  </span>
);

export default {};
