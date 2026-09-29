import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build (`next build` first) on an
 * isolated database. Override with E2E_DATABASE_URL.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export const e2eEnv = {
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://abcarino:abcarino@localhost:5432/abcarino_test",
  APP_URL: baseURL,
  APP_SECRET: "e2e-only-secret-value-that-is-long-enough-123456",
  STORAGE_DIR: "./.e2e-storage",
  ADMIN_EMAIL: "e2e-admin@abcarino.test",
  ADMIN_NAME: "E2E Admin",
  ADMIN_PASSWORD: "E2e-Strong-Lamp-Orbit-42",
  TRUST_PROXY: "false",
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL, trace: "retain-on-failure", locale: "en-US" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec/ },
  ],
  webServer: {
    // Start from an empty data cache so no content from a previous run leaks in.
    command: `rm -rf .next/cache/fetch-cache && npx next start -p ${PORT}`,
    // robots.txt reads the DB uncached, so readiness checks don't warm the content cache.
    url: `${baseURL}/robots.txt`,
    env: { ...e2eEnv },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
