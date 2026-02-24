# Yusuf — Project History

## Project Context

- **Project:** Personal blog website
- **Owner:** Jordan Selig
- **Hosting:** GitHub Pages
- **Core Features:** Modern UI, blog view tracking/analytics, commenting system, liking for posts, about me section
- **Suggested Features:** Dark/light mode, RSS feed, SEO meta tags, tag/category system, social sharing
- **Stack:** TBD (to be decided in first architecture session)

## Learnings

### 2026-02-24: Architecture decided by Cobb
- **Stack:** Astro v5 + GoatCounter + Giscus, deployed via GitHub Actions to GitHub Pages
- **Analytics:** GoatCounter script in `src/components/BaseHead.astro` — needs `data-goatcounter` URL updated after registration
- **Comments:** Giscus widget in `src/components/Comments.astro` — needs repo ID, category ID configured after Giscus app install
- **RSS:** `@astrojs/rss` integration, handler at `src/pages/rss.xml.ts`
- **SEO:** Open Graph + Twitter Card meta in `BaseHead.astro`
- **Sitemap:** `@astrojs/sitemap` integration configured in `astro.config.mjs`
- **Build verified:** 7 pages, zero errors

### 2026-02-24: Integration finalization pass
- **Giscus theme sync:** Added MutationObserver in Comments.astro to watch `data-theme` attribute on `<html>`. When the user toggles dark/light mode, the script sends a `setConfig` postMessage to the Giscus iframe. This avoids coupling to ThemeToggle.astro internals.
- **GoatCounter:** Added `data-goatcounter-settings='{"allow_local": true}'` for dev-time tracking. Added inline comment explaining setup.
- **RSS base path fix:** Links were missing `/personal-blog/` prefix — `@astrojs/rss` concatenates `site` + `link`, and `site` is `https://jordanselig.github.io` (no base). Fixed by prepending `/personal-blog/` to each item link.
- **RSS categories:** Added `categories: post.data.tags` to each RSS item — maps to `<category>` elements in the feed.
- **JSON-LD Article schema:** Added `<script type="application/ld+json">` in BlogPostLayout.astro with headline, description, dates, author, keywords, and URL. Uses Astro's `set:html` directive to safely serialize JSON.
- **Author meta tag:** Added `<meta name="author" content="Jordan Selig">` in BaseHead.astro.
- **robots.txt:** Already had sitemap reference — no change needed.
- **README:** Added step-by-step setup guide for GoatCounter, Giscus, and GitHub Pages. Documented RSS and SEO config.
- **Build verified:** 7 pages, zero errors after all changes.
