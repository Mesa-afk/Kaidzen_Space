"use client";

import { useEffect } from "react";
import { useKaizenStore } from "@/lib/store";

export function ThemeInitializer() {
  const themeMode = useKaizenStore((state) => state.themeMode);
  
  useEffect(() => {
    // Apply theme on mount and when it changes
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);
  
  return null;
}
