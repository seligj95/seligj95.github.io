# Decision: Vitest as test framework with build-output testing pattern

**Date:** 2026-02-24
**By:** Arthur (Tester)
**Status:** Implemented

## What
- Chose **Vitest + happy-dom** as the test framework
- Tests run against the actual `astro build` output (not component rendering)
- Global setup executes the build once, all test files inspect `dist/`

## Why
- Vitest shares the Vite toolchain with Astro — zero config friction
- For a static site, testing the built HTML is more valuable than unit-testing components in isolation: it catches routing, meta tags, RSS generation, and accessibility in the real output
- happy-dom provides fast DOM parsing without a full browser

## Impact on team
- Run `npm test` to execute all 91 tests (build happens automatically)
- New pages added to the site automatically get accessibility and SEO test coverage
- Schema tests are decoupled from Astro runtime — they validate the Zod schema directly
- CI workflow (`deploy.yml`) now gates deployment on tests passing
