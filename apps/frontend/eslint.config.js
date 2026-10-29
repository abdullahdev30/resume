import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
    ],
    rules: {
      // Local data/blob photos and print documents must bypass image proxying.
      "@next/next/no-img-element": "off",
      // The app does not use React Compiler. Its initialization effects and
      // event-handler refs are checked by TypeScript and rules-of-hooks.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
];
