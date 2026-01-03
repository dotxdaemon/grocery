// ABOUTME: Configures Vite for the grocery PWA build and dev tooling.
// ABOUTME: Adds React, PWA, aliasing, and Vitest settings for the project.

import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/grocery/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg', 'icons/icon-512-maskable.svg', 'mask-icon.svg'],
      manifest: {
        name: 'Grocery PWA',
        short_name: 'Groceries',
        description: 'Offline-first grocery list with multiple lists and history.',
        theme_color: '#0f172a',
        background_color: '#0b1221',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: 'any', type: 'image/svg+xml' },
          {
            src: 'icons/icon-512-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 4174,
    host: '0.0.0.0',
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'e2e/**/*'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
