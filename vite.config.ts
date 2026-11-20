
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const BUILD_VERSION = Date.now().toString();

function versionManifestPlugin(version: string): Plugin {
  return {
    name: 'trip-mochi-version-manifest',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.end(JSON.stringify({ version }));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2),
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        versionManifestPlugin(BUILD_VERSION),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'icon.jpg', 'icon.png', 'icon.svg', 'apple-touch-icon.png'],
          workbox: {
            maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            cleanupOutdatedCaches: true,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            globIgnores: ['**/version.json'],
            navigateFallbackDenylist: [/^\/version\.json/],
            runtimeCaching: [
              {
                urlPattern: /\/version\.json/,
                handler: 'NetworkOnly',
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
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
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
          manifest: {
            id: '/',
            name: 'Trip Mochi',
            short_name: 'Trip Mochi',
            description: 'Trip Mochi Travel Planner',
            theme_color: '#F7F4EB',
            background_color: '#F7F4EB',
            display: 'standalone',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: 'icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: 'icon.svg',
                sizes: '192x192 512x512',
                type: 'image/svg+xml',
                purpose: 'any'
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          },
        })
      ],
      define: {
        '__APP_BUILD_VERSION__': JSON.stringify(BUILD_VERSION),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
        'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
        'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
        'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
        'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
        'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
