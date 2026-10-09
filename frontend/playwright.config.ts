import { defineConfig, devices } from "@playwright/test";

// Browser tests: the real website talking to the real API and a real Postgres. `npx playwright test`
// starts both servers, or reuses ones already running.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
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
      command: "alembic upgrade head && uvicorn app.main:app --port 8000",
      cwd: "../backend",
      url: "http://localhost:8000/api/health",
      reuseExistingServer: !process.env.CI,
      env: {
        CL_DATABASE_URL:
          process.env.E2E_DATABASE_URL ?? "postgresql+psycopg://civiclens:civiclens@localhost:5432/civiclens",
        // The website must add this to every API request (src/lib/api.ts), as in production.
        CL_PROXY_SECRET: "e2e-proxy-secret",
      },
    },
    {
      command: "npm run start -- -p 3000",
      url: "http://localhost:3000/about",
      reuseExistingServer: !process.env.CI,
      env: { API_PROXY_SECRET: "e2e-proxy-secret" },
    },
  ],
});
