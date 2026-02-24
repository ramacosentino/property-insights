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
  <svg viewBox="0 0 196 56" height={height} className={className} aria-label="Urbban" fill="currentColor">
    {/* U — wide, squared bottom */}
    <path d="M0 8 h8 v24 c0 6 3 9 9 9 s9-3 9-9 V8 h8 v24 c0 12-7 19-17 19 S0 44 0 32z" />
    {/* r */}
    <path d="M40 20 h8 v4 c2-3 5-5 9-5 v8 c-5 0-9 2-9 7 v18 h-8z" />
    {/* b1 — stem + bowl */}
    <path d="M62 4 h8 v16.5 c2-2 5-3.5 9-3.5 c8 0 13 6 13 15 s-5 15-13 15 c-4 0-7-1.5-9-3.5 V48 h-8z M79 25 c-5 0-8 3-8 7.5 s3 7.5 8 7.5 c5 0 8-3 8-7.5 S84 25 79 25z" />
    {/* b2 — same, primary color bowl */}
    <path d="M96 4 h8 v16.5 c2-2 5-3.5 9-3.5 c8 0 13 6 13 15 s-5 15-13 15 c-4 0-7-1.5-9-3.5 V48 h-8z" />
    <path d="M113 25 c-5 0-8 3-8 7.5 s3 7.5 8 7.5 c5 0 8-3 8-7.5 S118 25 113 25z" fill="hsl(200 85% 42%)" />
    {/* a — proper lowercase a with bowl + stem */}
    <path d="M134 20 h8 v28 h-8 v-2.5 c-2 2-5 3.5-8 3.5 c-7 0-12-6-12-15 s5-15 12-15 c3 0 6 1.5 8 3.5z M134 32.5 c0-4.5-3-7.5-8-7.5 s-8 3-8 7.5 s3 7.5 8 7.5 s8-3 8-7.5z" />
    {/* n */}
    <path d="M148 20 h8 v4 c2-3 6-5 11-5 c8 0 12 5 12 13 v16 h-8 V33 c0-5-3-8-7-8 s-8 3-8 8 v15 h-8z" />
  </svg>
);

/**
 * Variant D: Clean modern.
 * U with defined corners. B bowls are smooth semicircles.
 * Second b in primary blue.
 */
export const LogoVariantD = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <svg viewBox="0 0 188 56" height={height} className={className} aria-label="Urbban" fill="currentColor">
    {/* U — clean with defined curves */}
    <path d="M0 8 h7 v24 c0 6 3.5 9.5 10 9.5 S27 38 27 32 V8 h7 v24 c0 11-7 19-17 19 S0 43 0 32z" />
    {/* r */}
    <path d="M39 20 h7 v5 c2-4 5-6 9-6 v8 c-5 0-9 2-9 6 v15 h-7z" />
    {/* b1 stem + bowl */}
    <path d="M59 4 h7 v17 c2.5-2.5 6-4 10-4 c8 0 14 6.5 14 15.5 S84 48 76 48 c-4 0-7.5-1.5-10-4 v4 h-7z M74 24 c-5 0-8 3.5-8 8.5 s3 8.5 8 8.5 c5 0 8-3.5 8-8.5 S79 24 74 24z" />
    {/* b2 stem + bowl in primary */}
    <path d="M92 4 h7 v17 c2.5-2.5 6-4 10-4 c8 0 14 6.5 14 15.5 S117 48 109 48 c-4 0-7.5-1.5-10-4 v4 h-7z" />
    <path d="M107 24 c-5 0-8 3.5-8 8.5 s3 8.5 8 8.5 c5 0 8-3.5 8-8.5 S112 24 107 24z" fill="hsl(200 85% 42%)" />
    {/* a — proper lowercase a */}
    <path d="M127 20 h7 v28 h-7 v-3 c-2.5 2.5-6 4-10 4 c-8 0-13-6.5-13-15.5 S109 18 117 18 c4 0 7.5 1.5 10 4z M127 32.5 c0-5-3-8.5-8-8.5 s-8 3.5-8 8.5 s3 8.5 8 8.5 s8-3.5 8-8.5z" />
    {/* n */}
    <path d="M140 20 h7 v5 c2-4 6-6 11-6 c7 0 12 5 12 13 v16 h-7 V33 c0-5-3-8-7-8 s-8 3-8 8 v15 h-7z" />
  </svg>
);

export default { LogoVariantA, LogoVariantD };
