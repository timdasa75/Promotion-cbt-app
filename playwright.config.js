import { defineConfig } from "@playwright/test";

const testPort = Number(process.env.PLAYWRIGHT_PORT || 5500);

export default defineConfig({
  testDir: "./tests",
  globalTimeout: Number(process.env.PLAYWRIGHT_GLOBAL_TIMEOUT_MS || 10 * 60_000),
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        }
      : {},
  },
  webServer: {
    command: `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${testPort} --strictPort`,
    port: testPort,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 60_000,
  },
});
