"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/**
 * false на сервере и в первом клиентском рендере (совпадает с SSR),
 * true сразу после гидратации. Через useSyncExternalStore, а не rAF:
 * requestAnimationFrame paused в фоновых/скрытых iframe, из-за чего
 * превью могло вечно висеть на «Загрузка...».
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
