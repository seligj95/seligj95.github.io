# Cobb — Project History

## Project Context

- **Project:** Personal blog website
- **Owner:** Jordan Selig
- **Hosting:** GitHub Pages
- **Core Features:** Modern UI, blog view tracking/analytics, commenting system, liking for posts, about me section
- **Suggested Features:** Dark/light mode, RSS feed, SEO meta tags, tag/category system, social sharing
- **Stack:** TBD (to be decided in first architecture session)

## Learnings

### 2026-02-24: Architecture & Tech Stack Decided
- **SSG:** Astro v5 — zero JS by default, islands architecture, Content Collections, built-in RSS/sitemap
- **Analytics:** GoatCounter — free, lightweight, no cookies, one script tag
- **Comments + Reactions:** Giscus — GitHub Discussions backend, includes emoji reactions (covers likes)
- **Deployment:** GitHub Actions → GitHub Pages (upload-pages-artifact + deploy-pages)
- **Theming:** CSS custom properties with `data-theme` attribute, `localStorage` persistence
- **Content schema:** title, description, pubDate, updatedDate, heroImage, tags, draft — validated with Zod via Content Collections
- **Key paths:**
  - `astro.config.mjs` — site URL, base path, integrations
  - `src/content.config.ts` — blog post schema definition
  - `src/components/BaseHead.astro` — SEO meta + analytics
  - `src/components/Comments.astro` — Giscus widget (needs repo/category IDs configured)
  - `src/layouts/BlogPostLayout.astro` — post layout with comments + share buttons
  - `.github/workflows/deploy.yml` — CI/CD pipeline
  - `src/styles/global.css` — CSS custom properties for light/dark themes
- **Setup tasks remaining:** GoatCounter registration, Giscus app install + ID config, GitHub Pages source set to Actions, site URL finalized
- **Build verified:** Clean build, 7 pages generated, zero errors
