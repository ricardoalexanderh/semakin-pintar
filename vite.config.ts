import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import generateSitemap from 'vite-plugin-sitemap'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  generateSitemap({
    hostname: 'https://www.semakinpintar.com',
    dynamicRoutes: [
      '/',
      '/games',
      '/games/mental-arithmetic',
      '/games/multiplication-table'
    ],
    lastmod: new Date(),
  })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          audio: ['tone']
        }
      }
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  // Server configuration for development
  server: {
    port: 5173,
    host: true
  },
  // Preview configuration for production preview
  preview: {
    port: 4173,
    host: true
  },
  // Define any additional configuration here
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})