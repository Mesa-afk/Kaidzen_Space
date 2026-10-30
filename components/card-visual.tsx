"use client";

/**
 * Standardized card visual with emoji and gradient backgrounds
 * Works for any user-generated or template roadmap
 */

type CardVisualProps = {
  emoji: string;
  color?: string;
  themeMode?: "light" | "dark";
};

/**
 * Generate gradient and accent colors based on roadmap color
 */
function getGradientColors(color: string | undefined, isDark: boolean) {
  const colorMap: Record<string, { light: [string, string]; dark: [string, string] }> = {
    peach: {
      light: ["#FFE5D9", "#FFDDD2"],
      dark: ["#2A1F1A", "#231812"],
    },
    lavender: {
      light: ["#E6E6FA", "#D8D8F8"],
      dark: ["#1D1A2D", "#161228"],
    },
    mint: {
      light: ["#D5F4E6", "#C8F0DD"],
      dark: ["#141D16", "#101812"],
    },
    sky: {
      light: ["#DBEAFE", "#BFDBFE"],
      dark: ["#141A22", "#101620"],
    },
    amber: {
      light: ["#FEF3C7", "#FDE68A"],
      dark: ["#221D0E", "#1D1808"],
    },
    rose: {
      light: ["#FFE4E6", "#FECDD3"],
      dark: ["#221415", "#1D0E0E"],
    },
    sage: {
      light: ["#E8F4ED", "#D5E8DD"],
      dark: ["#141D16", "#101812"],
    },
  };

  const defaultGradient = isDark
    ? ["#1D2024", "#16181B"]         /* M3 sys-surface-container / low */
    : ["#F9F8F4", "#F0EFE8"];

  const colors = colorMap[color || ""] || { light: defaultGradient, dark: defaultGradient };
  return isDark ? colors.dark : colors.light;
}

export function CardVisual({ emoji, color, themeMode = "dark" }: CardVisualProps) {
  const isDark = themeMode === "dark";
  const [gradStart, gradEnd] = getGradientColors(color, isDark);
  
  // Accent color for geometric shapes — M3 lavender/purple
  const accentColor = isDark ? "#D0BCFF" : "#6B4E8F";
  const accentOpacity = isDark ? 0.12 : 0.12;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* SVG background with gradient and geometric accents */}
      <svg 
        viewBox="0 0 400 140" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        {/* Gradient background */}
        <defs>
          <linearGradient id={`card-gradient-${emoji}-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
        </defs>
        
        <rect width="400" height="140" fill={`url(#card-gradient-${emoji}-${color})`} />
        
        {/* Geometric accents - minimal, abstract */}
        {/* Large circle accent */}
        <circle 
          cx="80" 
          cy="70" 
          r="50" 
          fill={accentColor} 
          opacity={accentOpacity}
        />
        
        {/* Small circle accent */}
        <circle 
          cx="330" 
          cy="35" 
          r="28" 
          fill={accentColor} 
          opacity={accentOpacity * 0.8}
        />
        
        {/* Subtle line accent */}
        <path 
          d="M 250 110 Q 300 80, 350 100" 
          stroke={accentColor} 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none"
          opacity={accentOpacity * 1.2}
        />
      </svg>
      
      {/* HTML emoji overlay - reliable cross-browser rendering */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "64px",
          lineHeight: 1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {emoji}
      </div>
    </div>
  );
}
