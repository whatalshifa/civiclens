import { defineConfig, devices } from "@playwright/test";

// Browser tests: the real website talking to the real API and a real Postgres. `npx playwright test`
// starts both servers, or reuses ones already running.
// Ports can be moved (E2E_WEB_PORT, E2E_API_PORT) when 3000 and 8000 are taken.
const WEB_PORT = process.env.E2E_WEB_PORT ?? "3000";
const API_PORT = process.env.E2E_API_PORT ?? "8000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    // Lets the tests run against a browser installed somewhere else (e.g. a sandbox).
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `alembic upgrade head && uvicorn app.main:app --port ${API_PORT}`,
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        CL_DATABASE_URL:
          process.env.E2E_DATABASE_URL ?? "postgresql+psycopg://civiclens:civiclens@localhost:5432/civiclens",
        // The website must add this to every API request (src/lib/api.ts), as in production.
        CL_PROXY_SECRET: "e2e-proxy-secret",
        // Samples still unfold step by step, just faster than on the real site.
        CL_DEMO_STEP_DELAY: "0.1",
      },
    },
    {
      command: `npm run start -- -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/services`,
      reuseExistingServer: !process.env.CI,
      env: { API_PROXY_SECRET: "e2e-proxy-secret", API_URL: `http://localhost:${API_PORT}` },
    },
  ],
});
