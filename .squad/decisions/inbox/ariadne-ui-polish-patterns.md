# Decision: UI Polish Patterns & Design Tokens

**By:** Ariadne (Frontend Dev)
**Date:** 2026-02-24

## What
Established core visual patterns during the first UI polish pass:

- **New CSS custom property:** `--accent-subtle` added to both light and dark themes for translucent accent usage (hover glows, tag pill backgrounds)
- **Mobile breakpoint:** 640px used consistently across Header, homepage hero, About grid, and BlogPostLayout
- **Icon approach:** SVG over emoji everywhere (ThemeToggle, Footer socials). Consistent 18px sizing
- **Tag rendering:** Pill-shaped chips with accent background instead of plain hash-prefixed text links
- **Reading time:** Calculated at ~225 words/min from `post.body`, displayed in post meta
- **Header is now sticky** with `backdrop-filter: blur(8px)` and includes mobile hamburger menu

## Why
These patterns should be respected by anyone touching UI going forward to keep the design cohesive. The `--accent-subtle` token in particular is load-bearing — it's used in card hovers, tag pills, and could extend to callout backgrounds.

## Impact
All agents touching templates or styles should reference these conventions.
