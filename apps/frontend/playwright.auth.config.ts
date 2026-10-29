import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "auth.spec.ts",
  timeout: 60000,
  workers: 1,
  use: {
    channel: "chromium",
    baseURL: "http://127.0.0.1:3101",
    viewport: { width: 1280, height: 900 },
  },
  webServer: [
    {
      reuseExistingServer: true,
      command:
        "venv\\Scripts\\python -m uvicorn tests.auth.browser_server:app --host 127.0.0.1 --port 8011",
      cwd: "../backend",
      url: "http://127.0.0.1:8011/health",
    },
    {
      reuseExistingServer: true,
      command: "node node_modules/next/dist/bin/next start --port 3101",
      env: { BACKEND_API_URL: "http://127.0.0.1:8011/api/v1" },
      url: "http://127.0.0.1:3101/auth/login",
      timeout: 120000,
    },
  ],
});
