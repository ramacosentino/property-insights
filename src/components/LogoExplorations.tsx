/**
 * Custom SVG logo explorations where the U shape is echoed
 * in the belly/bowl of the b letters.
 */

interface LogoExplorationProps {
  className?: string;
  height?: number;
}

/**
 * Variant A: The "U" has a distinctive squared-bottom shape.
 * The "b" bowls mirror that same squared U-curve.
 * Style: urbban, bold geometric
 */
export const LogoVariantA = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <svg viewBox="0 0 280 60" height={height} className={className} aria-label="Urbban">
    {/* u - distinctive squared bottom U */}
    <path
      d="M4 12 v26 q0 10 10 10 q10 0 10 -10 V12 h8 v26 q0 18 -18 18 q-18 0 -18 -18 V12z"
      fill="currentColor"
    />
    {/* r */}
    <path
      d="M42 18 v38 h-8 V18 h8z M42 18 q12 0 12 10 h-8 q0 -4 -4 -4 v-6z"
      fill="currentColor"
    />
    {/* first b - bowl echoes the U shape (squared bottom curve) */}
    <path
      d="M60 4 v52 h-8 V4 h8z M60 28 h8 q10 0 10 10 v4 q0 10 -10 10 h-8 v-6 h7 q4 0 4 -4 v-4 q0 -4 -4 -4 h-7 v-6z"
      fill="currentColor"
    />
    {/* second b - same bowl, primary color */}
    <path
      d="M86 4 v52 h-8 V4 h8z"
      fill="currentColor"
    />
    <path
      d="M86 28 h8 q10 0 10 10 v4 q0 10 -10 10 h-8 v-6 h7 q4 0 4 -4 v-4 q0 -4 -4 -4 h-7 v-6z"
      fill="hsl(200 85% 42%)"
    />
    {/* a */}
    <path
      d="M122 52 q-10 0 -10 -10 v-4 q0 -10 10 -10 h6 v-4 q0 -4 -6 -4 v-6 q14 0 14 10 v28 h-8 v-4 q-2 4 -6 4z M122 46 h6 v-12 h-6 q-4 0 -4 4 v4 q0 4 4 4z"
      fill="currentColor"
    />
    {/* n */}
    <path
      d="M142 18 v38 h8 v-28 q0 -4 6 -4 q6 0 6 4 v28 h8 V28 q0 -10 -14 -10 q-14 0 -14 10z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Variant B: Cleaner approach. The U is rendered with a smooth distinctive curve,
 * and each b's bowl is literally a rotated/mirrored U shape.
 * Style: Urbban, medium weight
 */
export const LogoVariantB = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <svg viewBox="0 0 200 48" height={height} className={className} aria-label="Urbban">
    {/* U - smooth distinctive curve with flat bottom */}
    <path
      d="M2 8 v22 c0 12 8 16 14 16 s14-4 14-16 V8 h-6 v22 c0 8-4 10-8 10 s-8-2-8-10 V8z"
      fill="currentColor"
    />
    {/* r */}
    <path
      d="M38 16 v30 h6 V24 c0-3 2-4 5-4 v-6 c-6 0-11 2-11 10z"
      fill="currentColor"
    />
    {/* first b - bowl is a U rotated 90° right */}
    <path
      d="M54 2 v44 h6 V2z"
      fill="currentColor"
    />
    <path
      d="M60 22 h4 c6 0 10 4 10 12 s-4 12-10 12 h-4 v-6 h3 c3 0 5-2 5-6 s-2-6-5-6 h-3z"
      fill="currentColor"
    />
    {/* second b - same shape, primary accent */}
    <path
      d="M80 2 v44 h6 V2z"
      fill="currentColor"
    />
    <path
      d="M86 22 h4 c6 0 10 4 10 12 s-4 12-10 12 h-4 v-6 h3 c3 0 5-2 5-6 s-2-6-5-6 h-3z"
      fill="hsl(200 85% 42%)"
    />
    {/* a */}
    <path
      d="M108 22 c-6 0-8 4-8 8 v4 c0 6 4 10 8 10 h2 v-4 c-1 1-2 2-4 2 -2 0-4-2-4-4 h10 v-4 c0-8-2-12-8-12z M104 30 h6 v-2 c0-2-1-4-3-4 s-3 2-3 4z"
      fill="currentColor"
    />
    {/* n (keeping it simple) */}
    <path
      d="M118 16 v30 h6 V26 c0-3 2-4 5-4 s5 1 5 4 v20 h6 V26 c0-8-5-10-11-10 s-11 2-11 10z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Variant C: Bold approach. The b bowls are literally U-shaped openings
 * (open at the top like a U rotated). Very graphic/iconic.
 */
export const LogoVariantC = ({ className = "", height = 44 }: LogoExplorationProps) => (
  <svg viewBox="0 0 240 52" height={height} className={className} aria-label="Urbban">
    {/* u - wide, distinctive, squared */}
    <path
      d="M2 10 v22 c0 10 6 14 14 14 s14-4 14-14 V10 h-7 v22 c0 5-3 7-7 7 s-7-2-7-7 V10z"
      fill="currentColor"
    />
    {/* r */}
    <path
      d="M38 18 v30 h7 V26 c0-2 2-3 4-3 v-7 c-6 0-11 2-11 10z"
      fill="currentColor"
    />
    {/* b1 - the bowl is a U shape: stem + U-bowl */}
    <path
      d="M56 4 h7 v44 h-7z"
      fill="currentColor"
    />
    {/* U-shaped bowl for first b */}
    <path
      d="M63 22 h3 c2 0 4 0 5.5 1.5 C73 25 73 27 73 29 v2 c0 4-1.5 7-4 8.5 C67 41 65 41 63 41 v-7 c1.5 0 3-.5 3-3 v-2 c0-2.5-1.5-3-3-3z"
      fill="currentColor"
    />
    {/* b2 - same U-bowl, accented */}
    <path
      d="M80 4 h7 v44 h-7z"
      fill="currentColor"
    />
    <path
      d="M87 22 h3 c2 0 4 0 5.5 1.5 C97 25 97 27 97 29 v2 c0 4-1.5 7-4 8.5 C91 41 89 41 87 41 v-7 c1.5 0 3-.5 3-3 v-2 c0-2.5-1.5-3-3-3z"
      fill="hsl(200 85% 42%)"
    />
    {/* a */}
    <path
      d="M106 48 v-22 c0-6 4-10 10-10 s10 4 10 10 v2 h-13 v2 c0 3 2 5 5 5 v7 c-8 0-12-4-12-12z M113 24 c-3 0-4 2-4 4 h8 c0-2-1-4-4-4z"
      fill="currentColor"
    />
    {/* n */}
    <path
      d="M132 18 v30 h7 V28 c0-2 2-3 5-3 s5 1 5 3 v20 h7 V28 c0-8-5-12-12-12 s-12 4-12 12z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Variant D: Minimal/clean. Uses the negative space concept —
 * the b's counter (hole) is shaped like a miniature U.
 * Text-based with SVG overlay for the b counters.
 */
export const LogoVariantD = ({ className = "", height = 40 }: LogoExplorationProps) => (
  <svg viewBox="0 0 220 48" height={height} className={className} aria-label="Urbban">
    {/* U with a flat bottom and sharp corners */}
    <path
      d="M3 8 v24 c0 4 0 8 4 11 3 2.5 7 3 9 3 s6-.5 9-3 c4-3 4-7 4-11 V8 h-6 v24 c0 3 0 5-2 6.5 -1.5 1.5-3 1.5-5 1.5 s-3.5 0-5-1.5 c-2-1.5-2-3.5-2-6.5 V8z"
      fill="currentColor"
    />
    {/* r */}
    <path
      d="M36 18 h6 v28 h-6 V26 z M42 18 c5 0 8 2 8 6 h-6 c0-1-1-2-2-2z"
      fill="currentColor"
    />
    {/* b1 stem */}
    <path d="M54 2 h6 v44 h-6z" fill="currentColor" />
    {/* b1 bowl — smooth with U-shaped inner counter */}
    <path
      d="M60 22 c8 0 14 5 14 12 s-6 12-14 12 v-6 c4 0 8-3 8-6 s-4-6-8-6z"
      fill="currentColor"
    />
    {/* b2 stem */}
    <path d="M80 2 h6 v44 h-6z" fill="currentColor" />
    {/* b2 bowl — primary color */}
    <path
      d="M86 22 c8 0 14 5 14 12 s-6 12-14 12 v-6 c4 0 8-3 8-6 s-4-6-8-6z"
      fill="hsl(200 85% 42%)"
    />
    {/* a */}
    <path
      d="M108 40 c-4 0-6-3-6-7 v-2 c0-5 3-9 9-9 h3 v-2 c0-2-2-4-5-4 v-6 c8 0 11 4 11 10 v20 h-6 v-2 c-1 2-3 4-6 4z M108 34 h6 v-6 h-3 c-3 0-5 2-5 4 v1 c0 1 1 1 2 1z"
      fill="currentColor"
    />
    {/* n */}
    <path
      d="M126 18 h6 v10 c0-4 4-8 9-8 s9 4 9 8 v18 h-6 V30 c0-3-2-4-4-4 s-4 1-4 4 v16 h-6 V18z"
      fill="currentColor"
    />
  </svg>
);

export default { LogoVariantA, LogoVariantB, LogoVariantC, LogoVariantD };
