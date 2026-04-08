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

### 2026-04-08: External URL support for cross-posted content
- **Schema pattern:** Added `externalUrl: z.string().url().optional()` to the blog collection schema in `src/content.config.ts`. Placed after `draft` field. Uses Zod's `.url()` validator to enforce valid URLs at build time.
- **RSS conditional link:** Updated `src/pages/rss.xml.ts` to use `post.data.externalUrl ?? /personal-blog/blog/${post.id}/` — nullish coalescing so external posts link directly to the original platform while internal posts keep the default path.
- **First external post:** Created `src/content/blog/mcp-apps-azure-appservice.md` linking to Tech Community. Frontmatter includes the `externalUrl` field; body is a short teaser summary.
- **Build verified:** 22 pages, 154 tests passing, zero errors.

### 2026-04-08: Session Completed — External Blog Post Support
**Team:** Yusuf, Ariadne, Arthur (all background agents)
**Status:** SUCCESS — Full feature end-to-end. Build passed, 154/154 tests green.
**What Scribe recorded:**
- Orchestration logs written to `.squad/orchestration-log/`
- Session log: `.squad/log/2026-04-08T18-20-external-blog-post-support.md`
- Decisions merged into `.squad/decisions.md` (2 entries from inbox)
- Git commit staged for .squad/ changes

### 2026-04-08: Blog pagination + ViewCount integration
- **Pagination structure:** Modified `src/pages/blog/index.astro` to show first page (10 posts max) with conditional "Next →" link. Created `src/pages/blog/page/[page].astro` for pages 2+ using `getStaticPaths`. This avoids conflicting with the existing `[...slug].astro` catch-all route.
- **ViewCount integration:** Both pagination files import `ViewCount.astro` (built by Ariadne) and render it next to each post's date, passing `${import.meta.env.BASE_URL}blog/${post.id}/` as the path prop. ViewCount fetches from GoatCounter's JSON API client-side.
- **Layout change:** Wrapped `<time>` and `<ViewCount>` in a `.post-meta` flex column (right-aligned) to stack date and view count cleanly.
- **Astro scoping note:** `POSTS_PER_PAGE` must be defined inside `getStaticPaths()` — constants declared in the frontmatter outside that function are not accessible within it at build time.
- **Pagination nav:** Centered flex container with `space-between`, styled with `--accent` color, 0.9rem font, no underline (underline on hover). Page 2's "Previous" link goes to `/blog/` (not `/blog/page/1/`).
- **Build verified:** 22 pages, 156 tests passing, zero errors. With only 5 posts, no page 2 is generated — pagination infrastructure is ready for growth.
