import { defineConfig } from "@playwright/test";
import authConfig from "./playwright.auth.config";
export default defineConfig({
  ...authConfig,
  testMatch: "pdf-and-cache.spec.ts",
  timeout: 120000,
});
