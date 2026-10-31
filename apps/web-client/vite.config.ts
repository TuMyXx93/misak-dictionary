import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Fuente única de navegadores objetivo (JS + CSS).
 * Alineada al mínimo real de Tailwind CSS v4 (@property, color-mix(), @layer):
 * Safari/iOS 16.4, Chrome/Edge 111, Firefox 128.
 * Ver: https://tailwindcss.com/docs/compatibility
 */
const BROWSER_BASELINE = {
  safari: [16, 4],
  ios_saf: [16, 4],
  chrome: [111, 0],
  edge: [111, 0],
  firefox: [128, 0],
} as const;

/** Formato esbuild para `build.target` (ej. `safari16.4`). Excluye `ios_saf`, que esbuild no reconoce. */
const ESBUILD_TARGETS = Object.entries(BROWSER_BASELINE)
  .filter(([browser]) => browser !== 'ios_saf')
  .map(([browser, [major, minor]]) => `${browser}${major}${minor ? `.${minor}` : ''}`);

/** Formato Lightning CSS (`major << 16 | minor << 8`) para la etapa de transformación CSS. */
const LIGHTNINGCSS_TARGETS = Object.fromEntries(
  Object.entries(BROWSER_BASELINE).map(([browser, [major, minor]]) => [
    browser,
    (major << 16) | (minor << 8),
  ]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Wamtɵrmarɵpik — Diccionario Misak',
        short_name: 'Diccionario Misak',
        description: 'Diccionario bilingüe Namtrik – Castellano del pueblo Misak',
        lang: 'es',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['**/admin*.js', '**/assets/admin*.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Medios culturales: streaming de audios de pronunciación e ilustraciones (Spec 007 R-012)
            urlPattern: /\/api\/media\/[a-f0-9-]+\/stream/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'misak-cultural-media-cache',
              expiration: {
                maxEntries: 150, // 100 audios + 50 imágenes
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200, 206],
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
      },
      devOptions: {
        enabled: false, // Deshabilitado en desarrollo para evitar conflictos
      },
    }),
    // Bundle analyzer - solo se activa cuando ANALYZE=true
    visualizer({
      filename: './dist/stats.html',
      open: false, // No abrir automáticamente
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // sunburst, treemap, network
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any, // Type workaround para Vite 7 compatibility
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  css: {
    transformer: 'lightningcss',
    // Sin esto, Vite usa 'baseline-widely-available' (Chrome 107 / Safari 16) en la
    // transformación y añade fallbacks innecesarios que la minificación no elimina.
    lightningcss: { targets: LIGHTNINGCSS_TARGETS },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: ESBUILD_TARGETS,
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/src/pages/admin/') ||
            id.includes('/src/components/admin/') ||
            id.includes('/src/services/admin') ||
            id.includes('/src/stores/admin')
          ) {
            return 'admin';
          }
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animations';
            }
          }
        },
      },
    },
  },
});
