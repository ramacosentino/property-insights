/**
 * Custom gradient SVG illustrations for the landing page.
 * Premium style inspired by Stripe / Linear.
 */

interface IconProps {
  className?: string;
  size?: number;
}

const defaultSize = 48;

export const IconMap = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gMap1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(262 80% 60%)" />
      </linearGradient>
      <linearGradient id="gMap2" x1="10" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" stopOpacity="0.3" />
        <stop offset="1" stopColor="hsl(262 80% 60%)" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="4" y="8" width="40" height="32" rx="4" fill="url(#gMap2)" stroke="url(#gMap1)" strokeWidth="1.5" />
    <path d="M4 16h40" stroke="url(#gMap1)" strokeWidth="1" opacity="0.3" />
    <circle cx="20" cy="26" r="5" fill="url(#gMap1)" opacity="0.8" />
    <circle cx="32" cy="22" r="3" fill="url(#gMap1)" opacity="0.5" />
    <circle cx="15" cy="32" r="2.5" fill="url(#gMap1)" opacity="0.4" />
    <path d="M20 26l6-4 6 0" stroke="url(#gMap1)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    <path d="M20 21v-4" stroke="url(#gMap1)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="15" r="2" fill="url(#gMap1)" />
  </svg>
);

export const IconSearch = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gSearch1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(190 90% 50%)" />
      </linearGradient>
      <linearGradient id="gSearch2" x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" stopOpacity="0.15" />
        <stop offset="1" stopColor="hsl(190 90% 50%)" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <circle cx="21" cy="21" r="13" fill="url(#gSearch2)" stroke="url(#gSearch1)" strokeWidth="1.5" />
    <line x1="30.5" y1="30.5" x2="42" y2="42" stroke="url(#gSearch1)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M15 19h12M15 24h8" stroke="url(#gSearch1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <circle cx="21" cy="21" r="6" stroke="url(#gSearch1)" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.3" />
  </svg>
);

export const IconCalculator = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gCalc1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(340 80% 55%)" />
      </linearGradient>
      <linearGradient id="gCalc2" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        <stop offset="1" stopColor="hsl(340 80% 55%)" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="8" y="4" width="32" height="40" rx="4" fill="url(#gCalc2)" stroke="url(#gCalc1)" strokeWidth="1.5" />
    <rect x="12" y="8" width="24" height="10" rx="2" fill="url(#gCalc1)" opacity="0.2" />
    <text x="14" y="16" fontSize="7" fill="url(#gCalc1)" fontFamily="monospace" opacity="0.8">$2,450</text>
    <circle cx="16" cy="26" r="2" fill="url(#gCalc1)" opacity="0.5" />
    <circle cx="24" cy="26" r="2" fill="url(#gCalc1)" opacity="0.5" />
    <circle cx="32" cy="26" r="2" fill="url(#gCalc1)" opacity="0.5" />
    <circle cx="16" cy="33" r="2" fill="url(#gCalc1)" opacity="0.5" />
    <circle cx="24" cy="33" r="2" fill="url(#gCalc1)" opacity="0.5" />
    <rect x="29" y="31" width="6" height="8" rx="1.5" fill="url(#gCalc1)" opacity="0.7" />
  </svg>
);

export const IconTrending = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gTrend1" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(150 80% 40%)" />
        <stop offset="1" stopColor="hsl(var(--primary))" />
      </linearGradient>
      <linearGradient id="gTrend2" x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(150 80% 40%)" stopOpacity="0.2" />
        <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
      </linearGradient>
    </defs>
    <path d="M6 40L18 28L26 34L42 12" stroke="url(#gTrend1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 40L18 28L26 34L42 12V40H6Z" fill="url(#gTrend2)" />
    <circle cx="18" cy="28" r="3" fill="url(#gTrend1)" opacity="0.6" />
    <circle cx="26" cy="34" r="3" fill="url(#gTrend1)" opacity="0.6" />
    <circle cx="42" cy="12" r="3" fill="url(#gTrend1)" />
    <path d="M36 12h6v6" stroke="url(#gTrend1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconStar = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gStar1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(45 100% 55%)" />
        <stop offset="1" stopColor="hsl(var(--primary))" />
      </linearGradient>
      <linearGradient id="gStar2" x1="12" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(45 100% 55%)" stopOpacity="0.25" />
        <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="36" height="36" rx="8" fill="url(#gStar2)" stroke="url(#gStar1)" strokeWidth="1.5" />
    <path d="M24 14l3.1 6.3 6.9 1-5 4.9 1.2 6.8L24 29.5l-6.2 3.5 1.2-6.8-5-4.9 6.9-1L24 14z" fill="url(#gStar1)" opacity="0.8" />
  </svg>
);

export const IconBell = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gBell1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(30 100% 55%)" />
      </linearGradient>
      <linearGradient id="gBell2" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        <stop offset="1" stopColor="hsl(30 100% 55%)" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <path d="M24 6c-7 0-12 5-12 12v8l-3 4h30l-3-4v-8c0-7-5-12-12-12z" fill="url(#gBell2)" stroke="url(#gBell1)" strokeWidth="1.5" />
    <path d="M20 38a4 4 0 008 0" stroke="url(#gBell1)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="34" cy="10" r="5" fill="hsl(0 80% 55%)" opacity="0.9" />
    <text x="32.5" y="13" fontSize="7" fill="white" fontWeight="bold">3</text>
  </svg>
);

/* ── Problem section icons ── */

export const IconShield = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gShield1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(200 80% 50%)" />
      </linearGradient>
    </defs>
    <path d="M24 4L8 12v12c0 11 7 18 16 22 9-4 16-11 16-22V12L24 4z" fill="url(#gShield1)" opacity="0.12" stroke="url(#gShield1)" strokeWidth="1.5" />
    <path d="M19 24l-3 3m8-8l-3 3" stroke="url(#gShield1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M24 18v8M20 22h8" stroke="url(#gShield1)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const IconFragmented = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gFrag1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(280 70% 55%)" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="16" height="16" rx="3" fill="url(#gFrag1)" opacity="0.2" stroke="url(#gFrag1)" strokeWidth="1.5" />
    <rect x="28" y="4" width="16" height="16" rx="3" fill="url(#gFrag1)" opacity="0.12" stroke="url(#gFrag1)" strokeWidth="1.5" strokeDasharray="3 2" />
    <rect x="4" y="28" width="16" height="16" rx="3" fill="url(#gFrag1)" opacity="0.12" stroke="url(#gFrag1)" strokeWidth="1.5" strokeDasharray="3 2" />
    <rect x="28" y="28" width="16" height="16" rx="3" fill="url(#gFrag1)" opacity="0.08" stroke="url(#gFrag1)" strokeWidth="1.5" strokeDasharray="3 2" />
    <path d="M20 12h8M12 20v8M36 20v8" stroke="url(#gFrag1)" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
  </svg>
);

export const IconTarget = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gTarget1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(0 75% 55%)" />
        <stop offset="1" stopColor="hsl(var(--primary))" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#gTarget1)" opacity="0.08" stroke="url(#gTarget1)" strokeWidth="1.5" />
    <circle cx="24" cy="24" r="12" stroke="url(#gTarget1)" strokeWidth="1.5" opacity="0.3" />
    <circle cx="24" cy="24" r="6" stroke="url(#gTarget1)" strokeWidth="1.5" opacity="0.5" />
    <circle cx="24" cy="24" r="2" fill="url(#gTarget1)" />
    <path d="M24 4v6M24 38v6M4 24h6M38 24h6" stroke="url(#gTarget1)" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
  </svg>
);

/* ── User profile icons ── */

export const IconBuyer = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gBuyer1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(210 90% 55%)" />
        <stop offset="1" stopColor="hsl(190 90% 50%)" />
      </linearGradient>
    </defs>
    <path d="M10 38V20l14-10 14 10v18a2 2 0 01-2 2H12a2 2 0 01-2-2z" fill="url(#gBuyer1)" opacity="0.12" stroke="url(#gBuyer1)" strokeWidth="1.5" />
    <rect x="19" y="28" width="10" height="12" rx="1" fill="url(#gBuyer1)" opacity="0.3" />
    <path d="M19 24h10" stroke="url(#gBuyer1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <circle cx="24" cy="18" r="3" fill="url(#gBuyer1)" opacity="0.5" />
    <path d="M14 4l2 4M34 4l-2 4" stroke="url(#gBuyer1)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const IconInvestor = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gInv1" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(160 80% 40%)" />
        <stop offset="1" stopColor="hsl(140 70% 50%)" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="36" height="36" rx="6" fill="url(#gInv1)" opacity="0.1" stroke="url(#gInv1)" strokeWidth="1.5" />
    <rect x="12" y="28" width="5" height="10" rx="1" fill="url(#gInv1)" opacity="0.4" />
    <rect x="21.5" y="22" width="5" height="16" rx="1" fill="url(#gInv1)" opacity="0.6" />
    <rect x="31" y="14" width="5" height="24" rx="1" fill="url(#gInv1)" opacity="0.8" />
    <path d="M12 24l10-8 8 4 8-10" stroke="url(#gInv1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="38" cy="10" r="2.5" fill="url(#gInv1)" />
  </svg>
);

export const IconAgency = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gAgency1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(270 70% 55%)" />
        <stop offset="1" stopColor="hsl(290 60% 60%)" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="14" r="8" fill="url(#gAgency1)" opacity="0.12" stroke="url(#gAgency1)" strokeWidth="1.5" />
    <circle cx="12" cy="22" r="5" fill="url(#gAgency1)" opacity="0.08" stroke="url(#gAgency1)" strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="36" cy="22" r="5" fill="url(#gAgency1)" opacity="0.08" stroke="url(#gAgency1)" strokeWidth="1" strokeDasharray="2 2" />
    <path d="M24 22v6" stroke="url(#gAgency1)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 36c0-5 3.6-8 8-8s8 3 8 8" fill="url(#gAgency1)" opacity="0.2" stroke="url(#gAgency1)" strokeWidth="1.5" />
    <path d="M6 40c0-3.5 2.5-6 6-6M42 40c0-3.5-2.5-6-6-6" stroke="url(#gAgency1)" strokeWidth="1" opacity="0.4" />
  </svg>
);

/* ── Value prop icons ── */

export const IconAnalysis = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gAna1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(220 80% 60%)" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="36" height="36" rx="4" fill="url(#gAna1)" opacity="0.1" stroke="url(#gAna1)" strokeWidth="1.5" />
    <path d="M14 34V24M22 34V18M30 34V22M38 34V14" stroke="url(#gAna1)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const IconComparables = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gComp1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(160 70% 45%)" />
      </linearGradient>
    </defs>
    <rect x="4" y="10" width="18" height="28" rx="3" fill="url(#gComp1)" opacity="0.12" stroke="url(#gComp1)" strokeWidth="1.5" />
    <rect x="26" y="10" width="18" height="28" rx="3" fill="url(#gComp1)" opacity="0.12" stroke="url(#gComp1)" strokeWidth="1.5" />
    <path d="M20 24h8" stroke="url(#gComp1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M22 21l3 3-3 3M26 21l-3 3 3 3" stroke="url(#gComp1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    <path d="M9 18h8M9 23h6M9 28h8" stroke="url(#gComp1)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    <path d="M31 18h8M31 23h6M31 28h8" stroke="url(#gComp1)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const IconScore = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gScore1" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(150 80% 40%)" />
        <stop offset="0.5" stopColor="hsl(45 100% 55%)" />
        <stop offset="1" stopColor="hsl(var(--primary))" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#gScore1)" opacity="0.08" stroke="url(#gScore1)" strokeWidth="1.5" />
    <path d="M12 32a16 16 0 0124 0" stroke="url(#gScore1)" strokeWidth="2" strokeLinecap="round" opacity="0.3" fill="none" />
    <path d="M24 24l8-12" stroke="url(#gScore1)" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="24" r="3" fill="url(#gScore1)" />
    <text x="18" y="40" fontSize="8" fill="url(#gScore1)" fontWeight="bold" opacity="0.7">92</text>
  </svg>
);

export const IconAlert = ({ className, size = defaultSize }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="gAlert1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(30 100% 55%)" />
      </linearGradient>
    </defs>
    <path d="M8 36l16-28 16 28H8z" fill="url(#gAlert1)" opacity="0.1" stroke="url(#gAlert1)" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="24" cy="28" r="1.5" fill="url(#gAlert1)" />
    <path d="M24 18v6" stroke="url(#gAlert1)" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 14l4-2M42 14l-4-2" stroke="url(#gAlert1)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    <circle cx="38" cy="8" r="4" fill="hsl(150 80% 45%)" opacity="0.8" />
    <path d="M36 8h4M38 6v4" stroke="white" strokeWidth="1" strokeLinecap="round" />
  </svg>
);
