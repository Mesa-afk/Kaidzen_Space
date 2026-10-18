"use client";

/**
 * Thematic SVG illustrations for roadmap cards
 * Each category has unique visual composition
 */

type CardVisualProps = {
  category: "art" | "language" | "music" | "yoga" | "cooking" | "code" | "writing" | "default";
  themeMode?: "light" | "dark";
};

export function CardVisual({ category, themeMode = "light" }: CardVisualProps) {
  const isDark = themeMode === "dark";
  
  // Base colors adapt to theme
  const bgColor = isDark ? "#2F333B" : "#F9F8F4";
  const accentColor = isDark ? "#A78BBF" : "#6B4E8F";
  const secondaryColor = isDark ? "#8BA888" : "#7D9170";
  
  switch (category) {
    case "art":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Palette */}
          <circle cx="80" cy="70" r="45" fill={accentColor} opacity="0.15"/>
          {/* Brush stroke */}
          <path 
            d="M 150 80 Q 220 50, 280 75 Q 320 90, 340 70" 
            stroke={accentColor} 
            strokeWidth="8" 
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          {/* Paint drops */}
          <circle cx="180" cy="60" r="6" fill={secondaryColor} opacity="0.7"/>
          <circle cx="250" cy="85" r="8" fill="#EAA835" opacity="0.7"/>
          <circle cx="310" cy="65" r="5" fill={accentColor} opacity="0.8"/>
        </svg>
      );
      
    case "language":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Speech bubble */}
          <rect x="60" y="35" width="140" height="70" rx="12" fill={accentColor} opacity="0.2"/>
          <path d="M 100 105 L 85 120 L 110 105 Z" fill={accentColor} opacity="0.2"/>
          {/* Text lines */}
          <line x1="80" y1="55" x2="170" y2="55" stroke={accentColor} strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          <line x1="80" y1="70" x2="150" y2="70" stroke={accentColor} strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          <line x1="80" y1="85" x2="165" y2="85" stroke={accentColor} strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          {/* Translation arrow */}
          <path 
            d="M 210 70 L 250 70" 
            stroke={secondaryColor} 
            strokeWidth="6" 
            strokeLinecap="round"
            markerEnd="url(#arrowhead-lang)"
            opacity="0.7"
          />
          <defs>
            <marker id="arrowhead-lang" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill={secondaryColor} opacity="0.7"/>
            </marker>
          </defs>
          {/* Translated bubble */}
          <rect x="260" y="45" width="100" height="50" rx="10" fill={secondaryColor} opacity="0.15"/>
          <line x1="275" y1="60" x2="340" y2="60" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
          <line x1="275" y1="75" x2="325" y2="75" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );
      
    case "music":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Staff lines */}
          {[40, 55, 70, 85, 100].map((y, i) => (
            <line key={i} x1="50" y1={y} x2="350" y2={y} stroke={accentColor} strokeWidth="1.5" opacity="0.3"/>
          ))}
          {/* Notes */}
          <ellipse cx="120" cy="70" rx="12" ry="9" fill={accentColor} opacity="0.7" transform="rotate(-20 120 70)"/>
          <rect x="131" y="30" width="3" height="40" fill={accentColor} opacity="0.7"/>
          
          <ellipse cx="180" cy="55" rx="12" ry="9" fill={secondaryColor} opacity="0.7" transform="rotate(-20 180 55)"/>
          <rect x="191" y="15" width="3" height="40" fill={secondaryColor} opacity="0.7"/>
          
          <ellipse cx="240" cy="85" rx="12" ry="9" fill="#EAA835" opacity="0.7" transform="rotate(-20 240 85)"/>
          <rect x="251" y="45" width="3" height="40" fill="#EAA835" opacity="0.7"/>
          
          <ellipse cx="300" cy="70" rx="12" ry="9" fill={accentColor} opacity="0.7" transform="rotate(-20 300 70)"/>
          <rect x="311" y="30" width="3" height="40" fill={accentColor} opacity="0.7"/>
        </svg>
      );
      
    case "yoga":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Meditation figure - simplified */}
          <circle cx="200" cy="45" r="18" fill={accentColor} opacity="0.6"/>
          {/* Body */}
          <path 
            d="M 200 63 L 200 95" 
            stroke={accentColor} 
            strokeWidth="8" 
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Arms in meditation pose */}
          <path 
            d="M 200 75 Q 160 75, 150 90" 
            stroke={accentColor} 
            strokeWidth="6" 
            strokeLinecap="round"
            opacity="0.6"
          />
          <path 
            d="M 200 75 Q 240 75, 250 90" 
            stroke={accentColor} 
            strokeWidth="6" 
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Legs crossed */}
          <path 
            d="M 200 95 Q 170 105, 160 110" 
            stroke={accentColor} 
            strokeWidth="7" 
            strokeLinecap="round"
            opacity="0.6"
          />
          <path 
            d="M 200 95 Q 230 105, 240 110" 
            stroke={accentColor} 
            strokeWidth="7" 
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Peaceful aura circles */}
          <circle cx="200" cy="70" r="60" stroke={secondaryColor} strokeWidth="2" opacity="0.2" fill="none"/>
          <circle cx="200" cy="70" r="75" stroke={secondaryColor} strokeWidth="1.5" opacity="0.1" fill="none"/>
        </svg>
      );
      
    case "cooking":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Pot */}
          <rect x="140" y="65" width="120" height="60" rx="8" fill={accentColor} fillOpacity="0.2" stroke={accentColor} strokeWidth="3" strokeOpacity="0.5"/>
          {/* Handles */}
          <path d="M 140 80 Q 120 80, 120 95" stroke={accentColor} strokeWidth="4" fill="none" opacity="0.5"/>
          <path d="M 260 80 Q 280 80, 280 95" stroke={accentColor} strokeWidth="4" fill="none" opacity="0.5"/>
          {/* Steam */}
          <path d="M 170 50 Q 175 30, 165 15" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>
          <path d="M 200 45 Q 205 25, 195 10" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d="M 230 50 Q 235 30, 225 15" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>
          {/* Ingredients - simple shapes */}
          <circle cx="180" cy="90" r="8" fill="#EAA835" opacity="0.7"/>
          <circle cx="220" cy="95" r="10" fill={secondaryColor} opacity="0.6"/>
          <rect x="195" y="85" width="15" height="12" rx="3" fill={accentColor} opacity="0.7"/>
        </svg>
      );
      
    case "code":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Code brackets */}
          <path d="M 90 40 L 70 40 L 70 100 L 90 100" stroke={accentColor} strokeWidth="5" strokeLinecap="round" opacity="0.6"/>
          <path d="M 310 40 L 330 40 L 330 100 L 310 100" stroke={accentColor} strokeWidth="5" strokeLinecap="round" opacity="0.6"/>
          {/* Code lines */}
          <line x1="120" y1="50" x2="220" y2="50" stroke={accentColor} strokeWidth="4" strokeLinecap="round" opacity="0.5"/>
          <line x1="140" y1="70" x2="260" y2="70" stroke={secondaryColor} strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          <line x1="140" y1="90" x2="200" y2="90" stroke="#EAA835" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          {/* Cursor */}
          <rect x="205" y="85" width="3" height="16" fill={accentColor} opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
          </rect>
        </svg>
      );
      
    case "writing":
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Page lines */}
          <line x1="80" y1="40" x2="320" y2="40" stroke={accentColor} strokeWidth="2" opacity="0.2"/>
          <line x1="80" y1="60" x2="320" y2="60" stroke={accentColor} strokeWidth="2" opacity="0.2"/>
          <line x1="80" y1="80" x2="320" y2="80" stroke={accentColor} strokeWidth="2" opacity="0.2"/>
          <line x1="80" y1="100" x2="320" y2="100" stroke={accentColor} strokeWidth="2" opacity="0.2"/>
          {/* Written text - artistic strokes */}
          <path d="M 85 37 Q 120 33, 155 37" stroke={accentColor} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
          <path d="M 170 37 Q 205 33, 240 37" stroke={accentColor} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
          <path d="M 85 57 Q 140 53, 195 57" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
          <path d="M 210 57 Q 250 54, 280 57" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
          <path d="M 85 77 Q 130 73, 175 77" stroke="#EAA835" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
          {/* Pen */}
          <path d="M 290 90 L 330 50" stroke={accentColor} strokeWidth="6" strokeLinecap="round" opacity="0.7"/>
          <circle cx="332" cy="48" r="4" fill={accentColor} opacity="0.7"/>
        </svg>
      );
      
    default:
      return (
        <svg viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="140" fill={bgColor}/>
          {/* Abstract geometric composition */}
          <circle cx="120" cy="70" r="40" fill={accentColor} opacity="0.2"/>
          <rect x="180" y="40" width="60" height="60" fill={secondaryColor} opacity="0.2" transform="rotate(15 210 70)"/>
          <polygon points="280,30 330,60 310,110 260,90" fill="#EAA835" opacity="0.2"/>
        </svg>
      );
  }
}
