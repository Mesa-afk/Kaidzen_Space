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
      dark: ["#4A3832", "#3A2822"],
    },
    lavender: {
      light: ["#E6E6FA", "#D8D8F8"],
      dark: ["#3A3A52", "#2A2A42"],
    },
    mint: {
      light: ["#D5F4E6", "#C8F0DD"],
      dark: ["#2A4A3A", "#1A3A2A"],
    },
    sky: {
      light: ["#DBEAFE", "#BFDBFE"],
      dark: ["#2A3A4A", "#1A2A3A"],
    },
    amber: {
      light: ["#FEF3C7", "#FDE68A"],
      dark: ["#4A3A1A", "#3A2A0A"],
    },
    rose: {
      light: ["#FFE4E6", "#FECDD3"],
      dark: ["#4A2A2A", "#3A1A1A"],
    },
    sage: {
      light: ["#E8F4ED", "#D5E8DD"],
      dark: ["#2A3A30", "#1A2A20"],
    },
  };

  const defaultGradient = isDark
    ? ["#2F333B", "#252930"]
    : ["#F9F8F4", "#F0EFE8"];

  const colors = colorMap[color || ""] || { light: defaultGradient, dark: defaultGradient };
  return isDark ? colors.dark : colors.light;
}

export function CardVisual({ emoji, color, themeMode = "light" }: CardVisualProps) {
  const isDark = themeMode === "dark";
  const [gradStart, gradEnd] = getGradientColors(color, isDark);
  
  // Accent color for geometric shapes
  const accentColor = isDark ? "#A78BBF" : "#6B4E8F";
  const accentOpacity = isDark ? 0.15 : 0.12;

  return (
    <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gradient background */}
      <defs>
        <linearGradient id={`card-gradient-${emoji}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradStart} />
          <stop offset="100%" stopColor={gradEnd} />
        </linearGradient>
      </defs>
      
      <rect width="400" height="140" fill={`url(#card-gradient-${emoji})`} />
      
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
      
      {/* Emoji in center */}
      <text
        x="200"
        y="70"
        fontSize="64"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {emoji}
      </text>
    </svg>
  );
}
