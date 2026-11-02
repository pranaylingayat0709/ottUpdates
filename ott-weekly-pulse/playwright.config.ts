import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against a production build (`npm run build && npm start`).
// They need no API keys: without Watchmode/TMDB the app serves its curated
// fallback catalog, so these check that the pages, routes and basic UI work,
// not what live data contains.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const executablePath = process.env.PW_CHROMIUM_PATH || undefined; // e.g. /opt/pw-browsers/chromium in sandboxes

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: executablePath ? { executablePath } : {}
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : { command: `npm run start -- -p ${PORT}`, port: PORT, reuseExistingServer: !process.env.CI, timeout: 60_000 }
});
