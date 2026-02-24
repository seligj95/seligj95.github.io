# Ariadne — Project History

## Project Context

- **Project:** Personal blog website
- **Owner:** Jordan Selig
- **Hosting:** GitHub Pages
- **Core Features:** Modern UI, blog view tracking/analytics, commenting system, liking for posts, about me section
- **Suggested Features:** Dark/light mode, RSS feed, SEO meta tags, tag/category system, social sharing
- **Stack:** TBD (to be decided in first architecture session)

## Learnings

### 2026-02-24: UI Polish Pass
**What was done:** Comprehensive visual refinement across all components and pages.

**Design decisions:**
- **Typography scale:** Set 16px base, 1.6 line-height on html, tighter letter-spacing on headings (-0.01em to -0.03em), 1.8 line-height for prose content. Max-width 65ch for long-form readability.
- **Custom property additions:** Added `--accent-subtle` (translucent accent) for hover glows and tag pill backgrounds. Both light and dark variants.
- **Smooth scrolling + selection color:** `scroll-behavior: smooth` on html, `::selection` in accent blue.
- **Link treatment:** Thin underlines at 1px with 2px offset, color transition. Feels cleaner than default browser underlines.
- **Hero gradient:** Text gradient from `--text` to `--accent` on the name using `background-clip: text`. Breaks the hero into greeting / name / tagline for rhythm.
- **Card hover pattern:** Border-color change + subtle box-shadow using `--accent-subtle` + 1px translateY lift. Consistent across homepage cards.
- **Mobile hamburger:** SVG icon swap (hamburger ↔ X) with `aria-expanded` tracking. Nav slides open as column below header on mobile. Kept it CSS-toggled with minimal JS.
- **ThemeToggle:** Replaced emoji with Feather-style SVG icons (sun/moon). Added 180deg rotation on click with CSS transition for feedback.
- **Tag pills:** Moved from plain `#tag` text links to pill-shaped chips with `--accent-subtle` background and full accent fill on hover. Used across BlogPostLayout.
- **Reading time:** Calculated from `post.body` word count, ~225 wpm. Placed in meta line with middot separators.
- **Footer social icons:** Inline SVGs for GitHub, LinkedIn, X. Hover lifts 1px with accent color. Middot separator between copyright and RSS.
- **About page structure:** Split into bio section + 2-column grid with interest cards and social links. Responsive to single column on mobile.
- **Blog list improvements:** Added description line (clamped to 1 line), subtle background hover, top border on first item for visual completion.

**Patterns established:**
- Consistent `0.75rem` border-radius on cards, `9999px` on pills
- `transition: 0.15s ease` as default micro-interaction timing
- Mobile breakpoint at 640px
- `--accent-subtle` for any translucent accent usage (hover glows, tag backgrounds)
- SVG icons over emoji for consistent cross-platform rendering
- Prose styles defined both globally and scoped in BlogPostLayout for resilience

### 2026-02-24: Architecture decided by Cobb
- **Stack:** Astro v5 + GoatCounter + Giscus, deployed via GitHub Actions to GitHub Pages
- **Theming:** CSS custom properties with `data-theme` attribute, `localStorage` persistence — in `src/styles/global.css`
- **Components:** BaseHead, Header, Footer, ThemeToggle, Comments, ShareButtons — all in `src/components/`
- **Layouts:** BaseLayout + BlogPostLayout in `src/layouts/`
- **Content:** Markdown blog posts in `src/content/blog/`, schema in `src/content.config.ts`
- **Build verified:** 7 pages, zero errors
