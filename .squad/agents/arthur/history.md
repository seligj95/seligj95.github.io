# Arthur — Project History

## Project Context

- **Project:** Personal blog website
- **Owner:** Jordan Selig
- **Hosting:** GitHub Pages
- **Core Features:** Modern UI, blog view tracking/analytics, commenting system, liking for posts, about me section
- **Suggested Features:** Dark/light mode, RSS feed, SEO meta tags, tag/category system, social sharing
- **Stack:** TBD (to be decided in first architecture session)

## Learnings

### 2026-02-24: Test infrastructure established
- **Framework:** Vitest 4.0.18 + happy-dom (lightweight, same Vite ecosystem as Astro)
- **Pattern:** Global setup runs `astro build` once before all tests — avoids redundant builds, keeps test files simple
- **91 tests** across 5 files: schema (10), build output (11), RSS (9), accessibility (29), SEO (32)
- **Edge case found:** `@astrojs/rss` XML-encodes apostrophes (`&apos;`), so string matching against titles with apostrophes must account for XML entities — not string literals
- **Edge case found:** Astro's `base` config means public assets like favicon.svg can land at `dist/favicon.svg` or `dist/{base}/favicon.svg` depending on version — tests check both paths
- **Edge case found:** Astro generates `sitemap-index.xml` (not `sitemap.xml`) when using `@astrojs/sitemap` — tests use substring match
- **Schema testing approach:** Replicated the Zod schema from `content.config.ts` directly in tests since `astro:content` virtual imports aren't available outside the Astro build context
- **CI integration:** Added `npm test` step to deploy.yml before the build step — tests run the build themselves via globalSetup, so CI gets a double-build but correctness is guaranteed
- **Accessibility tests are parameterized:** Each HTML page in dist/ is tested independently for lang attr, heading hierarchy, image alt text, and link accessibility — adding pages automatically adds test coverage

### 2026-02-24: Architecture decided by Cobb
- **Stack:** Astro v5 + GoatCounter + Giscus, deployed via GitHub Actions to GitHub Pages
- **Content schema:** title, description, pubDate, updatedDate, heroImage, tags, draft — Zod-validated in `src/content.config.ts`
- **Pages:** index, about, blog/index, blog/[...slug], tags/index, tags/[tag], rss.xml
- **Components:** BaseHead (SEO/analytics), Header, Footer, ThemeToggle, Comments, ShareButtons
- **Build:** `npm run build` → `dist/`, verified clean with 7 pages
- **CI/CD:** `.github/workflows/deploy.yml` — Node 22, npm ci, build, deploy
