import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config — the full stack, driven through a real browser.
 *
 * Needs the backends up: `docker compose up -d` (mongo, redis, rabbitmq,
 * santa-api :3001, santa-notifications :3002). The frontend is started here.
 *
 * PORT 5174, not 5173: docker-compose also publishes a *prebuilt* santa-app on
 * 5173, and running the E2E against that would test a stale bundle. So we start
 * Vite from source on 5174 instead. That still reaches the backends, because
 * the dev proxy (vite.config.ts) rewrites the Origin to localhost:5173, which
 * is what the API's CORS allows. Override with E2E_BASE_URL to point elsewhere.
 */
const PORT = 5174;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

// One stamp per run, so each run registers fresh accounts against the shared
// dev database. Set in the main process and inherited by workers; `||=` keeps
// the inherited value when a worker re-loads this config. Never generate this
// inside a test — it must be identical for every context in the run.
process.env.E2E_STAMP ||= Date.now().toString(36);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // A shared dev database is not safe to hammer in parallel — one journey at a time.
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
