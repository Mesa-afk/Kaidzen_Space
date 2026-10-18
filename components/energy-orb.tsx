"use client";

import { useEffect, useState } from "react";

export function EnergyOrb({ xp }: { xp: number }) {
  const [isRewarding, setIsRewarding] = useState(false);
  const [prevXp, setPrevXp] = useState(xp);
  
  useEffect(() => {
    if (xp >= 100 && prevXp < 100) {
      setIsRewarding(true);
      const timer = setTimeout(() => setIsRewarding(false), 1500);
      return () => clearTimeout(timer);
    }
    setPrevXp(xp);
  }, [xp, prevXp]);
  
  // Progressive evolution of orb appearance
  const level = xp >= 100 ? "reward" : xp >= 75 ? "radiant" : xp >= 50 ? "warm" : xp >= 25 ? "glow" : "dark";
  
  // Dark flame effect when at 0
  const isDark = xp === 0;
  
  return (
    <div 
      className={`energy-orb energy-${level} ${isRewarding ? "rewarding" : ""}`} 
      role="img" 
      aria-label={`Энергия дня: ${xp} процентов`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          {/* Dark flame gradient */}
          <radialGradient id="orb-gradient-dark" cx="35%" cy="28%" r="72%">
            <stop className="orb-stop-dark-1" offset="0%" />
            <stop className="orb-stop-dark-2" offset="54%" />
            <stop className="orb-stop-dark-3" offset="100%" />
          </radialGradient>
          
          {/* Growing green gradient */}
          <radialGradient id="orb-gradient-glow" cx="35%" cy="28%" r="72%">
            <stop className="orb-stop-glow-1" offset="0%" />
            <stop className="orb-stop-glow-2" offset="54%" />
            <stop className="orb-stop-glow-3" offset="100%" />
          </radialGradient>
          
          {/* Warm yellow gradient */}
          <radialGradient id="orb-gradient-warm" cx="35%" cy="28%" r="72%">
            <stop className="orb-stop-warm-1" offset="0%" />
            <stop className="orb-stop-warm-2" offset="54%" />
            <stop className="orb-stop-warm-3" offset="100%" />
          </radialGradient>
          
          {/* Solar radiant gradient */}
          <radialGradient id="orb-gradient-radiant" cx="35%" cy="28%" r="72%">
            <stop className="orb-stop-radiant-1" offset="0%" />
            <stop className="orb-stop-radiant-2" offset="54%" />
            <stop className="orb-stop-radiant-3" offset="100%" />
          </radialGradient>
          
          {/* Reward gradient */}
          <radialGradient id="orb-gradient-reward" cx="35%" cy="28%" r="72%">
            <stop className="orb-stop-reward-1" offset="0%" />
            <stop className="orb-stop-reward-2" offset="54%" />
            <stop className="orb-stop-reward-3" offset="100%" />
          </radialGradient>
          
          <radialGradient id="orb-shine" cx="31%" cy="23%" r="65%">
            <stop stopColor="#fff9d8" stopOpacity=".75" offset="0%" />
            <stop stopColor="#fff9d8" stopOpacity="0" offset="100%" />
          </radialGradient>
          
          <clipPath id="orb-clip">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
          
          <filter id="orb-noise">
            <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="2" stitchTiles="stitch" />
          </filter>
          
          {/* Turbulence for dark flame effect */}
          <filter id="flame-distortion">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="turbulence">
              <animate
                attributeName="baseFrequency"
                from="0.03"
                to="0.04"
                dur="2s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        
        {/* Outer halo */}
        <circle className="orb-halo" cx="50" cy="50" r="49" />
        
        {/* Core with appropriate gradient based on level */}
        <circle 
          className="orb-core" 
          cx="50" 
          cy="50" 
          r="44" 
          fill={`url(#orb-gradient-${level})`}
          filter={isDark ? "url(#flame-distortion)" : undefined}
        />
        
        {/* Glint effect */}
        <circle className="orb-glint" cx="50" cy="50" r="44" fill="url(#orb-shine)" />
        
        {/* Noise texture */}
        <g clipPath="url(#orb-clip)" className="orb-noise">
          <rect width="100" height="100" filter="url(#orb-noise)" />
        </g>
        
        {/* Sparks */}
        <circle className="orb-spark" cx="34" cy="29" r="2" />
        <circle className="orb-spark orb-spark-two" cx="68" cy="42" r="1.2" />
      </svg>
      
      {/* XP value - only show when not in dark state */}
      {!isDark && (
        <span className="orb-value">{xp}<small>%</small></span>
      )}
    </div>
  );
}
