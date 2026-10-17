"use client";

export function EnergyOrb({ xp }: { xp: number }) {
  const level = xp >= 100 ? "reward" : xp >= 50 ? "warm" : xp > 0 ? "glow" : "dark";
  return <div className={`energy-orb energy-${level}`} role="img" aria-label={`Энергия дня: ${xp} процентов`}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="orb-gradient" cx="35%" cy="28%" r="72%">
          <stop className="orb-stop-light" offset="0%" />
          <stop className="orb-stop-mid" offset="54%" />
          <stop className="orb-stop-dark" offset="100%" />
        </radialGradient>
        <radialGradient id="orb-shine" cx="31%" cy="23%" r="65%">
          <stop stopColor="#fff9d8" stopOpacity=".75" offset="0%" />
          <stop stopColor="#fff9d8" stopOpacity="0" offset="100%" />
        </radialGradient>
        <clipPath id="orb-clip"><circle cx="50" cy="50" r="44" /></clipPath>
        <filter id="orb-noise"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="2" stitchTiles="stitch" /></filter>
      </defs>
      <circle className="orb-halo" cx="50" cy="50" r="49" />
      <circle className="orb-core" cx="50" cy="50" r="44" fill="url(#orb-gradient)" />
      <circle className="orb-glint" cx="50" cy="50" r="44" fill="url(#orb-shine)" />
      <g clipPath="url(#orb-clip)" className="orb-noise"><rect width="100" height="100" filter="url(#orb-noise)" /></g>
      <circle className="orb-spark" cx="34" cy="29" r="2" />
      <circle className="orb-spark orb-spark-two" cx="68" cy="42" r="1.2" />
    </svg>
    <span className="orb-value">{xp}<small>%</small></span>
  </div>;
}
