import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'StreakFire',
        short_name: 'StreakFire',
        description: 'Daily routines, todos, notes and focus sessions.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F6F7FB',
        theme_color: '#5B5BF0',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg}'], navigateFallback: 'index.html' },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700, // the Firebase chunk is only loaded when cloud sync is configured
  },
});
