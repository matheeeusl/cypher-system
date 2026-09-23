import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
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
