import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    globalSetup: "./tests/global-setup.ts",
    // The API has its own suite, its own dependencies and no need for a
    // browser-shaped environment or an astro build. `npm run test:api` runs it.
    exclude: ["**/node_modules/**", "**/dist/**", "api/**"],
  },
});
