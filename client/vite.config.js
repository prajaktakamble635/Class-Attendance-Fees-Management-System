import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { splitVendorChunkPlugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const buildVersion = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    VitePWA({
      buildCacheId: `Gurukul-Test-Series-${buildVersion}`,
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gurukul Academy',
        short_name: 'Gurukul Academy',
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        lang: "en",
        scope: "/",
        description: 'Gurukul Academy',
        theme_color: '#0284c7',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        id: "1",
        dir: "ltr",
        orientation: "natural",
        display_override: [
          "fullscreen",
          "browser",
          "standalone",
          "window-controls-overlay"
        ],
        categories: [
          "productivity"
        ]
      },
      registerType: 'auto',
      workbox: {
        cleanupOutdatedCaches: true
      },
    }),
  ],
  base: '/',
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    port: 7001,
    host: '0.0.0.0',
    strictPort: true,
    origin: 'http://localhost:7001',
    watch: {},
  },
  preview: {
    port: 7001,
    strictPort: true,
  },

  // ✅ Add these for react-leaflet compatibility
  optimizeDeps: {
    include: ['react-leaflet', 'leaflet', 'react-dom'],
  },
  ssr: {
    noExternal: ['react-leaflet'], // 👈 super important
  },
});
