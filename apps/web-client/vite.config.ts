import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type PluginOption } from 'vite';
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

/** Formato Oxc/Rolldown para `build.target` (ej. `safari16.4`). Excluye `ios_saf`. */
const BROWSER_TARGETS = Object.entries(BROWSER_BASELINE)
  .filter(([browser]) => browser !== 'ios_saf')
  .map(([browser, [major, minor]]) => `${browser}${major}${minor ? `.${minor}` : ''}`);

/** Formato Lightning CSS (`major << 16 | minor << 8`) para la etapa de transformación CSS. */
const LIGHTNINGCSS_TARGETS = Object.fromEntries(
  Object.entries(BROWSER_BASELINE).map(([browser, [major, minor]]) => [
    browser,
    (major << 16) | (minor << 8),
  ]),
);

const PROXY_TARGET =
  process.env.VITE_PROXY_TARGET || process.env.VITE_API_URL || 'http://localhost:3000';

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
        globIgnores: ['**/admin*.js', '**/assets/admin*.js', '**/stats.html'],
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
                // Solo cachear respuestas completas 200 (evita corromper CacheFirst con 206 parciales o 0 opacos en Safari móvil)
                statuses: [200],
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
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: './dist/stats.html',
            open: false, // No abrir automáticamente
            gzipSize: true,
            brotliSize: true,
            template: 'treemap', // sunburst, treemap, network
          }) as unknown as PluginOption,
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@utils': path.resolve(import.meta.dirname, './src/utils'),
      '@types': path.resolve(import.meta.dirname, './src/types'),
      '@router': path.resolve(import.meta.dirname, './src/router'),
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
    allowedHosts: ['.trycloudflare.com', '.ts.net'],
    proxy: {
      '/api': {
        target: PROXY_TARGET,
        changeOrigin: true,
        headers: {
          origin: 'http://localhost:5173',
        },
      },
      '/auth': {
        target: PROXY_TARGET,
        changeOrigin: true,
        headers: {
          origin: 'http://localhost:5173',
        },
      },
    },
  },
  build: {
    target: BROWSER_TARGETS,
    cssMinify: 'lightningcss',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'admin-editorial',
              test: /\/admin\/(Sentido|AdminAbreviaturas)/,
            },
            {
              name: 'admin-media-governance',
              test: /\/admin\/(Taxonomia|Revision|AdminMedia|MediaTaxonomyAndSentidoFields|mediaCatalogHelpers)/,
            },
            {
              name: 'admin',
              test: /\/src\/(pages\/admin\/|components\/admin\/|services\/admin)/,
            },
            {
              name: 'vendor',
              test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//,
            },
            {
              name: 'animations',
              test: /node_modules\/.*(framer-motion|motion-dom|motion-utils)/,
            },
          ],
        },
      },
    },
  },
});
