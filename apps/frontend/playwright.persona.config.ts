import { defineConfig } from "@playwright/test";
import authConfig from "./playwright.auth.config";

export default defineConfig({
  ...authConfig,
  testMatch: "persona.spec.ts",
});
