interface LogoExplorationProps {
  className?: string;
  height?: number;
}

/**
 * Variant A: Bold geometric. 
 * U has a distinctive squared curve. B bowls echo that squared U shape.
 * Second b in primary blue.
 */
export const LogoVariantA = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <svg viewBox="0 0 186 56" height={height} className={className} aria-label="Urbban" fill="currentColor">
    {/* U — wide, squared bottom */}
    <path d="M0 8 h8 v24 c0 6 3 9 9 9 s9-3 9-9 V8 h8 v24 c0 12-7 19-17 19 S0 44 0 32z" />
    {/* r */}
    <path d="M40 20 h8 v4 c2-3 5-5 9-5 v8 c-5 0-9 2-9 7 v18 h-8z" />
    {/* b1 — stem + squared bowl echoing U */}
    <path d="M62 4 h8 v16.5 c2-2 5-3.5 9-3.5 c8 0 13 6 13 15 s-5 15-13 15 c-4 0-7-1.5-9-3.5 V48 h-8z M70 25 c-4.5 0-8 3-8 7 v4 c0 4 3.5 7 8 7 s8-3 8-7 v-4 c0-4-3.5-7-8-7z" />
    {/* b2 — same, primary color */}
    <path d="M96 4 h8 v16.5 c2-2 5-3.5 9-3.5 c8 0 13 6 13 15 s-5 15-13 15 c-4 0-7-1.5-9-3.5 V48 h-8z" />
    <path d="M104 25 c-4.5 0-8 3-8 7 v4 c0 4 3.5 7 8 7 s8-3 8-7 v-4 c0-4-3.5-7-8-7z" fill="hsl(200 85% 42%)" />
    {/* a */}
    <path d="M140 47 c-7 0-12-5-12-12 v-2 c0-7 5-13 12-13 s12 6 12 13 v5 h-16 c1 3 3 5 7 5 c3 0 5-1 7-3 l4 5 c-3 3-6 5-11 5z M136 33 h10 c-1-4-3-6-5-6 s-4 2-5 6z" />
    {/* n */}
    <path d="M156 20 h8 v4 c2-3 6-5 10-5 c7 0 12 5 12 12 v17 h-8 V32 c0-4-3-7-7-7 s-7 3-7 7 v16 h-8z" />
  </svg>
);

/**
 * Variant D: Clean modern.
 * U with defined corners. B bowls are smooth semicircles 
 * that echo the U's inner curve. Second b in primary blue.
 */
export const LogoVariantD = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <svg viewBox="0 0 178 56" height={height} className={className} aria-label="Urbban" fill="currentColor">
    {/* U — clean with slight square corners at bottom */}
    <path d="M0 8 h7 v24 c0 6 3.5 9.5 10 9.5 S27 38 27 32 V8 h7 v24 c0 11-7 19-17 19 S0 43 0 32z" />
    {/* r */}
    <path d="M39 20 h7 v5 c2-4 5-6 9-6 v8 c-5 0-9 2-9 6 v15 h-7z" />
    {/* b1 stem + bowl */}
    <path d="M59 4 h7 v17 c2.5-2.5 6-4 10-4 c8 0 14 6.5 14 15.5 S84 48 76 48 c-4 0-7.5-1.5-10-4 v3 h-7z M74 24 c-5 0-8 3.5-8 8.5 s3 8.5 8 8.5 c5 0 8-3.5 8-8.5 S79 24 74 24z" />
    {/* b2 stem + bowl in primary */}
    <path d="M92 4 h7 v17 c2.5-2.5 6-4 10-4 c8 0 14 6.5 14 15.5 S117 48 109 48 c-4 0-7.5-1.5-10-4 v3 h-7z" />
    <path d="M107 24 c-5 0-8 3.5-8 8.5 s3 8.5 8 8.5 c5 0 8-3.5 8-8.5 S112 24 107 24z" fill="hsl(200 85% 42%)" />
    {/* a */}
    <path d="M132 47 c-7 0-11-5-11-12 v-2 c0-7 5-13 12-13 s11 6 11 13 v4 h-16 c.5 4 3 6 7 6 c3 0 5-1 7-3 l4 5 c-3 3-6 5-11 5z M128 33 h10 c-.5-4-3-6-5-6 s-5 2-5 6z" />
    {/* n */}
    <path d="M148 20 h7 v5 c2-4 5.5-6 10-6 c7 0 11 5 11 12 v17 h-7 V32 c0-5-3-7-7-7 s-7 3-7 7 v16 h-7z" />
  </svg>
);

export default { LogoVariantA, LogoVariantD };
