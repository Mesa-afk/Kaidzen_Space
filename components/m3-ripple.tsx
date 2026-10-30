"use client";

import { useEffect } from "react";

/**
 * Ripple в духе Material Design 3 для кнопок и пилюль навигации.
 * Один делегированный pointerdown-слушатель на всё приложение:
 * ink-элемент создаётся из точки касания и удаляется сам.
 * Стили — app/m3-motion.css (.m3-ripple-ink). При
 * prefers-reduced-motion компонент ничего не делает.
 */
const RIPPLE_SELECTOR = [
  ".btn",
  ".opus-nav-item",
  ".opus-sort-tab",
  ".opus-settings-btn",
  ".opus-profile-btn",
  ".opus-brand",
  ".task-check",
  ".task-menu-button",
].join(", ");

export function M3Ripple() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = event.target as Element | null;
      const host = target?.closest?.(RIPPLE_SELECTOR) as HTMLElement | null;
      if (!host) return;

      const maybeButton = host as HTMLButtonElement;
      if (maybeButton.disabled || host.getAttribute("aria-disabled") === "true") {
        return;
      }

      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const diameter =
        Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2;

      const ink = document.createElement("span");
      ink.className = "m3-ripple-ink";
      ink.style.width = `${diameter}px`;
      ink.style.height = `${diameter}px`;
      ink.style.left = `${x}px`;
      ink.style.top = `${y}px`;
      ink.addEventListener("animationend", () => ink.remove(), { once: true });
      window.setTimeout(() => ink.remove(), 800);
      host.appendChild(ink);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
