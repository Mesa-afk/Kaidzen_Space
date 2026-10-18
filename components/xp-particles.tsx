"use client";

import { useEffect, useState, useMemo } from "react";

type ParticleProps = {
  xp: number;
  sourceX: number;
  sourceY: number;
  targetSelector: string;
  onComplete?: () => void;
};

export function XPParticles({ xp, sourceX, sourceY, targetSelector, onComplete }: ParticleProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  // Calculate particles once on mount
  const particles = useMemo(() => {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) return [];
    
    const targetRect = targetElement.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    // Create 3-5 particles
    const particleCount = Math.min(5, Math.max(3, Math.floor(xp / 20)));
    return Array.from({ length: particleCount }, (_, index) => ({
      id: index,
      targetX,
      targetY,
    }));
  }, [xp, targetSelector]);

  useEffect(() => {
    // Clean up after animation
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 1200);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isAnimating) return null;

  const prefersReducedMotion = typeof window !== "undefined" && 
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return (
      <div
        className="xp-text-simple"
        style={{
          position: "fixed",
          left: sourceX,
          top: sourceY,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        +{xp} XP
      </div>
    );
  }

  return (
    <div className="xp-particles-container">
      {/* XP Text that appears first */}
      <div
        className="xp-text"
        style={{
          position: "fixed",
          left: sourceX,
          top: sourceY,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        +{xp} XP
      </div>
      
      {/* Particles that fly to target */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="xp-particle"
          style={{
            position: "fixed",
            left: sourceX,
            top: sourceY,
            pointerEvents: "none",
            zIndex: 999,
            "--target-x": `${particle.targetX}px`,
            "--target-y": `${particle.targetY}px`,
            animationDelay: `${particle.id * 60}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
