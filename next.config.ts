import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Разрешает dev-серверу отдавать JS/HMR превью-песочнице (*.e2b.app).
  // Без этого Next блокирует cross-origin запросы к dev-ресурсам и страница
  // вечно висит на пре-рендере «Загрузка...». На production-сборку не влияет.
  allowedDevOrigins: ["*.e2b.app", "**.e2b.app"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
