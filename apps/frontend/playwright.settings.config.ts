import { defineConfig } from "@playwright/test";
import authConfig from "./playwright.auth.config";

export default defineConfig({
  ...authConfig,
  testMatch: ["settings-cache.spec.ts", "billing.spec.ts"],
});
