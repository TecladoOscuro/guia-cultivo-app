import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/guia-cultivo-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*"],
      manifest: {
        name: "Guía Cultivo",
        short_name: "Cultivo",
        description: "Gestor de cultivos: calendario, stock, dashboard, planning",
        theme_color: "#0a0d10",
        background_color: "#0a0d10",
        display: "standalone",
        orientation: "portrait",
        scope: "/guia-cultivo-app/",
        start_url: "/guia-cultivo-app/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        navigateFallback: "/guia-cultivo-app/index.html",
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
