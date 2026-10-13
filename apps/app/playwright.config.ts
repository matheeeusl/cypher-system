import { defineConfig, devices } from '@playwright/test'

// e2e setup needs DATABASE_URL (and the app reads the rest) from .env.local.
try {
  process.loadEnvFile('.env.local')
} catch {
  // CI provides these as real environment variables.
}

import { STORAGE_STATE } from './e2e/global-setup'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 30_000,
  // One shared test user (see e2e/global-setup.ts) owns every character the
  // specs create, so specs must not run side by side.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: STORAGE_STATE,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Starts `next dev` for the test run; reuses an already-running one
  // locally so `pnpm dev:app` + `pnpm test:e2e` in two terminals works too.
  // Does NOT start graphql-api — that has to be running separately
  // (`pnpm dev:api`), same as for manual testing.
  webServer: {
    command: 'pnpm dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
