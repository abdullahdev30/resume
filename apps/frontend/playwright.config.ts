import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testIgnore: ["auth.spec.ts", "persona.spec.ts", "pdf-and-cache.spec.ts"],
  timeout: 60000,
  use: {
    channel: "chromium",
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1440, height: 1100 },
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
  },
  workers: 1,
});
