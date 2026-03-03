import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generateSitemap from 'vite-plugin-sitemap'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    generateSitemap({
      hostname: 'https://www.semakinpintar.com',
      dynamicRoutes: [
        '/',
        '/games',
        '/games/mental-arithmetic',
        '/games/multiplication-table',
        '/games/mental-division',
        '/games/mental-multiplication',
        '/games/patterns-detective',
        '/games/rocket-math',
        '/games/mathcha-cafe',
        '/games/math-drop',
        '/games/sort-attack',
      ],
      lastmod: new Date(),
    }),
    VitePWA({
      registerType: 'autoUpdate', // Changed from 'prompt' for better UX
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,wav,woff2}'],
        // Modern caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\.(?:mp3|wav|ogg|m4a)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30  // 30 days for static audio files
              }
            }
          },
          // App shell caching
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3
            }
          }
        ],
        // Enable navigation fallback for SPA
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/]
      },
      manifest: {
        name: 'Semakin Pintar - Educational Games',
        short_name: 'Semakin Pintar',
        description: 'Free educational games for kids & family learning - mental arithmetic, multiplication tables, and brain training games',
        theme_color: '#8B5CF6',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'], // Modern display modes
        scope: '/',
        start_url: '/games?utm_source=pwa',
        id: 'com.semakinpintar.app', // Unique app identifier
        categories: ['education', 'games', 'kids'],
        lang: 'en',
        dir: 'ltr',
        orientation: 'any',
        // Essential icons only
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: 'android-chrome-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'android-chrome-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'android-chrome-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'android-chrome-48x48.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        // Protocol handlers for deep linking
        protocol_handlers: [
          {
            protocol: 'web+semakinpintar',
            url: '/games?game=%s'
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          audio: ['tone']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})