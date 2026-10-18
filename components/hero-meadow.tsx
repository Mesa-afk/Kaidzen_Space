"use client";

import { useKaizenStore } from "@/lib/store";

export function HeroMeadow() {
  const themeMode = useKaizenStore((state) => state.themeMode);
  const isDark = themeMode === "dark";
  
  return (
    <svg
      className="hero-meadow"
      viewBox="0 0 1600 320"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Sky background */}
      <rect
        width="1600"
        height="320"
        fill={isDark ? "url(#night-sky)" : "url(#day-sky)"}
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="day-sky" x1="800" y1="0" x2="800" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef9f0" />
          <stop offset="100%" stopColor="#fdf6e3" />
        </linearGradient>
        
        <linearGradient id="night-sky" x1="800" y1="0" x2="800" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2a3442" />
          <stop offset="100%" stopColor="#3d4a5c" />
        </linearGradient>
        
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd966" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffeb99" stopOpacity="0.6" />
        </radialGradient>
        
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8edf5" stopOpacity="1" />
          <stop offset="100%" stopColor="#c5d0e0" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      
      {/* Sun or Moon */}
      {isDark ? (
        <>
          {/* Moon */}
          <circle cx="800" cy="88" r="42" fill="url(#moon-glow)" opacity="0.95" />
          <circle cx="800" cy="88" r="42" fill="none" stroke="#b8c5d6" strokeWidth="1" opacity="0.3" />
          
          {/* Stars */}
          <circle cx="200" cy="40" r="1.5" fill="#d4dce8" opacity="0.8" />
          <circle cx="500" cy="60" r="1" fill="#d4dce8" opacity="0.7" />
          <circle cx="840" cy="35" r="1.2" fill="#d4dce8" opacity="0.6" />
          <circle cx="1080" cy="55" r="0.8" fill="#d4dce8" opacity="0.75" />
          <circle cx="1440" cy="42" r="1.3" fill="#d4dce8" opacity="0.65" />
          <circle cx="1140" cy="105" r="0.9" fill="#d4dce8" opacity="0.7" />
        </>
      ) : (
        <>
          {/* Sun */}
          <circle cx="800" cy="88" r="42" fill="url(#sun-glow)" />
          <circle cx="800" cy="88" r="42" fill="#ffd966" opacity="0.8" />
        </>
      )}
      
      {/* Back hills */}
      <ellipse
        cx="600"
        cy="240"
        rx="680"
        ry="100"
        fill={isDark ? "#4a5a52" : "#a8b89f"}
        opacity={isDark ? "0.6" : "0.4"}
      />
      
      <ellipse
        cx="1300"
        cy="260"
        rx="520"
        ry="85"
        fill={isDark ? "#526554" : "#98a88d"}
        opacity={isDark ? "0.5" : "0.35"}
      />
      
      {/* Middle hills */}
      <ellipse
        cx="340"
        cy="270"
        rx="600"
        ry="95"
        fill={isDark ? "#5c6e5f" : "#8a9c7e"}
        opacity={isDark ? "0.7" : "0.55"}
      />
      
      {/* Front hill - main meadow */}
      <ellipse
        cx="840"
        cy="310"
        rx="1000"
        ry="120"
        fill={isDark ? "#677a6a" : "#7a9068"}
        opacity={isDark ? "0.85" : "0.75"}
      />
      
      {/* Grass texture - small details */}
      {!isDark && (
        <>
          {/* Light theme flowers/grass */}
          <circle cx="160" cy="280" r="3" fill="#e8b4d1" opacity="0.6" />
          <circle cx="280" cy="290" r="2.5" fill="#f4d4a8" opacity="0.5" />
          <circle cx="400" cy="285" r="3.5" fill="#d4e8b4" opacity="0.55" />
          <circle cx="520" cy="295" r="2" fill="#e8d4b4" opacity="0.5" />
          <circle cx="1240" cy="290" r="3" fill="#b4d4e8" opacity="0.45" />
          
          {/* Small grass blades */}
           <line x1="240" y1="295" x2="240" y2="285" stroke="#7a9068" strokeWidth="1.5" opacity="0.3" />
           <line x1="360" y1="300" x2="360" y2="290" stroke="#7a9068" strokeWidth="1.5" opacity="0.3" />
           <line x1="560" y1="298" x2="560" y2="288" stroke="#7a9068" strokeWidth="1.5" opacity="0.3" />
           <line x1="1120" y1="298" x2="1120" y2="288" stroke="#7a9068" strokeWidth="1.5" opacity="0.3" />
        </>
      )}
      
      {isDark && (
        <>
          {/* Dark theme - muted flowers */}
          <circle cx="160" cy="280" r="2.5" fill="#8a7a92" opacity="0.3" />
          <circle cx="280" cy="290" r="2" fill="#92886e" opacity="0.25" />
          <circle cx="400" cy="285" r="3" fill="#7a8a72" opacity="0.28" />
          <circle cx="1120" cy="295" r="1.8" fill="#8a8272" opacity="0.25" />
        </>
      )}
      
      {/* Foreground path/ground */}
      <path
         d="M 0 300 Q 400 295, 800 300 T 1600 300 L 1600 320 L 0 320 Z"
        fill={isDark ? "#3d4a3e" : "#a8b89f"}
        opacity={isDark ? "0.4" : "0.3"}
      />
    </svg>
  );
}
