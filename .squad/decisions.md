# Decisions

> Team-wide decisions. All agents read this before working. Scribe maintains it.

### 2026-02-24: Team formed
**By:** Squad (Coordinator)
**What:** Team hired for personal blog project. Cast from Inception universe: Cobb (Lead), Ariadne (Frontend Dev), Yusuf (Integration Dev), Arthur (Tester), Scribe (Logger), Ralph (Monitor).
**Why:** Project requires modern UI work (Ariadne), service integrations for analytics/comments/likes (Yusuf), quality assurance (Arthur), and architectural oversight (Cobb).

### 2026-02-24: GitHub Pages hosting constraint
**By:** Jordan Selig (owner)
**What:** Blog will be hosted on GitHub Pages (static hosting). All architecture decisions must account for this constraint — no server-side runtime.
**Why:** User requirement. Impacts comment system, analytics, and like system choices (must use client-side or third-party services).

### 2026-02-24: Tech stack — Astro + GoatCounter + Giscus
**By:** Cobb (Lead)
**What:** Selected Astro v5 as SSG, GoatCounter for analytics, Giscus (GitHub Discussions) for comments and reactions. Deployment via GitHub Actions.
**Why:** Astro ships zero JS by default (fast, SEO-friendly), islands architecture for selective interactivity. GoatCounter is free, lightweight, cookie-free, GDPR-compliant. Giscus keeps data on GitHub, supports dark mode, and emoji reactions cover the likes requirement. Rejected Jekyll (aging), Hugo (awkward templates), 11ty (more manual wiring), Next.js (overkill).

### 2026-02-24: Project structure & content schema
**By:** Cobb (Lead)
**What:** Content Collections with Zod-validated schema (title, description, pubDate, updatedDate, heroImage, tags, draft). File-based routing. CSS custom properties for dark/light theming with `localStorage` persistence.
**Why:** Type-safe content, built-in validation, clean separation of concerns. CSS custom properties avoid JS runtime for theming.

### 2026-02-24: Deployment — GitHub Actions CI/CD
**By:** Cobb (Lead)
**What:** `.github/workflows/deploy.yml` — triggers on push to main, Node 22, `npm ci && npm run build`, deploys `dist/` via `upload-pages-artifact` + `deploy-pages`.
**Why:** Official Astro deployment pattern for GitHub Pages. Zero external dependencies.
