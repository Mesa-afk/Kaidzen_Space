"use client";

import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";

export function SoundToggle() {
  const hydrated = useHydrated();
  const soundEnabled = useKaizenStore((state) => state.soundEnabled);
  const toggleSound = useKaizenStore((state) => state.toggleSound);
  
  if (!hydrated) {
    return (
      <button className="sound-toggle" aria-label="Звук" disabled>
        🔊
      </button>
    );
  }
  
  return (
    <button
      className={`sound-toggle ${!soundEnabled ? "muted" : ""}`}
      onClick={toggleSound}
      aria-label={soundEnabled ? "Отключить звук" : "Включить звук"}
      title={soundEnabled ? "Отключить звук" : "Включить звук"}
    >
      {soundEnabled ? "🔊" : "🔇"}
    </button>
  );
}
