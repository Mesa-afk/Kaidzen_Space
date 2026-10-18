"use client";

import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";

export function ThemeToggle() {
  const hydrated = useHydrated();
  const themeMode = useKaizenStore((state) => state.themeMode);
  const setThemeMode = useKaizenStore((state) => state.setThemeMode);
  
  if (!hydrated) {
    return <div className="theme-toggle" aria-hidden="true">
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb" />
      </div>
    </div>;
  }
  
  const handleToggle = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    document.documentElement.setAttribute("data-theme", newMode);
  };
  
  return (
    <button
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={themeMode === "light" ? "Переключить на тёмную тему" : "Переключить на светлую тему"}
      title={themeMode === "light" ? "Тёмная тема" : "Светлая тема"}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${themeMode === "dark" ? "dark" : ""}`}>
          {themeMode === "light" ? "☀" : "☾"}
        </div>
      </div>
    </button>
  );
}
