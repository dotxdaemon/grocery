// ABOUTME: Configures Playwright for end-to-end smoke tests of the grocery app.
// ABOUTME: Spins up the dev server and runs browser checks against the PWA shell.
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
  },
  webServer: {
    command: 'pnpm dev -- --host 0.0.0.0 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
