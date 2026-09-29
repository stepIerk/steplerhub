import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Продакшен-путь на GitHub Pages: https://stepierk.github.io/steplerhub/
const base = '/steplerhub/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['shicon.jpeg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Stepler Hub — панель репетитора',
        short_name: 'Stepler Hub',
        description: 'Программа, уроки в Markdown, прогресс учеников и журнал занятий',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e0e12',
        theme_color: '#f0ad00',
        lang: 'ru',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // SPA: отдавать index.html для навигации (офлайн тоже работает).
        // Запросы к API Supabase (чужой хост) не кэшируются.
        navigateFallback: 'index.html',
      },
    }),
  ],
})
