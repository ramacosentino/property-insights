interface UrbbanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

/**
 * URBBAN logo — all-caps condensed wordmark.
 * The double-B is highlighted with a slight overlap/ligature effect.
 * Monocromático: uses currentColor so it adapts to light/dark themes.
 */
const UrbbanLogo = ({ className = "", size = "md", showIcon = false }: UrbbanLogoProps) => {
  const sizes = {
    sm: { height: 18, viewBox: "0 0 120 24" },
    md: { height: 24, viewBox: "0 0 120 24" },
    lg: { height: 36, viewBox: "0 0 120 24" },
  };

  const { height, viewBox } = sizes[size];

  if (showIcon) {
    // Icon-only version: stylized "U" mark
    return (
      <svg
        viewBox="0 0 32 32"
        height={height}
        fill="none"
        className={className}
        aria-label="Urbban"
      >
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path
          d="M8 8v10c0 4.418 3.582 8 8 8s8-3.582 8-8V8h-4v10c0 2.21-1.79 4-4 4s-4-1.79-4-4V8H8z"
          fill="currentColor"
          className="text-background"
          style={{ fill: "var(--logo-inner, hsl(var(--background)))" }}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox={viewBox}
      height={height}
      fill="none"
      className={className}
      aria-label="Urbban"
    >
      {/* U */}
      <path
        d="M0 3.5v11.5c0 5.2 3.8 9 9 9s9-3.8 9-9V3.5h-4.5V15c0 2.5-2 4.5-4.5 4.5S4.5 17.5 4.5 15V3.5H0z"
        fill="currentColor"
      />
      {/* R */}
      <path
        d="M22 3.5V23h4.5v-7h2.5l3.5 7h5l-4-7.5c2-1.2 3.5-3.5 3.5-6s-1.5-4.8-3.5-6H22zm4.5 4h4c1.4 0 2.5 1.1 2.5 2.5S31.9 12.5 30.5 12.5h-4v-5z"
        fill="currentColor"
      />
      {/* BB ligature — two B's with overlap */}
      <g>
        {/* First B */}
        <path
          d="M40 3.5V23h9c3 0 5.5-2 5.5-5 0-1.8-1-3.3-2.5-4.2 1.2-.9 2-2.3 2-3.8 0-3-2.5-6.5-5.5-6.5H40zm4.5 4h3.5c1 0 1.5.8 1.5 1.8s-.5 1.7-1.5 1.7h-3.5v-3.5zm0 7.5h4c1.2 0 2 .9 2 2s-.8 2-2 2h-4v-4z"
          fill="currentColor"
        />
        {/* Second B — slightly overlapping, with accent opacity */}
        <path
          d="M53 3.5V23h9c3 0 5.5-2 5.5-5 0-1.8-1-3.3-2.5-4.2 1.2-.9 2-2.3 2-3.8 0-3-2.5-6.5-5.5-6.5H53zm4.5 4h3.5c1 0 1.5.8 1.5 1.8s-.5 1.7-1.5 1.7h-3.5v-3.5zm0 7.5h4c1.2 0 2 .9 2 2s-.8 2-2 2h-4v-4z"
          fill="currentColor"
          opacity="0.65"
        />
      </g>
      {/* A */}
      <path
        d="M71 23h4.8l1.5-4h8.4l1.5 4h4.8L83 3.5h-3L71 23zm8.5-8L83 7l3.5 8h-7z"
        fill="currentColor"
      />
      {/* N */}
      <path
        d="M95 3.5V23h4.5V10l8 13h4.5V3.5h-4.5v13l-8-13H95z"
        fill="currentColor"
      />
    </svg>
  );
};

export default UrbbanLogo;
