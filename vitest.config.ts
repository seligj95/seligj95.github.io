import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    globalSetup: "./tests/global-setup.ts",
    // The API has its own suite, its own dependencies and no need for a
    // browser-shaped environment or an astro build. `npm run test:api` runs it.
    exclude: ["**/node_modules/**", "**/dist/**", "api/**"],
    /**
     * The board generator is CPU-bound and its property tests build hundreds of
     * puzzles. On a dev machine they finish in seconds; a CI runner is several
     * times slower, and the 5s default turned that difference into a failing
     * build twice. Nothing here is I/O-bound, so a generous ceiling costs
     * nothing on a passing run and only changes the outcome for a test that
     * would otherwise have flaked.
     */
    testTimeout: 30000,
  },
});
