---
name: Jordan Selig — Blog & Portfolio
description: A clean, legible personal blog and portfolio with a playful four-theme switch.
colors:
  accent: "#2563eb"
  accent-hover: "#1d4ed8"
  ink: "#1a1a1a"
  muted: "#6b7280"
  bg: "#ffffff"
  surface: "#f9fafb"
  border: "#e5e7eb"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  link:
    textColor: "{colors.accent}"
  link-hover:
    textColor: "{colors.accent-hover}"
  tag:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.6rem"
  tag-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
  post-card:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  theme-toggle:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px"
---

# Design System: Jordan Selig — Blog & Portfolio

## 1. Overview

**Creative North Star: "The Legible Playground"**

This is a personal blog and living portfolio for a Product Manager who ships real work
and shares it. The default experience is quiet, editorial, and built for reading:
generous line-height, a 65ch measure, a single confident blue accent, and near-black ink
on white. Nothing competes with the words. The credibility comes from craft — clean
type, working links, no visual bugs — not from decoration.

The play lives in one deliberate place: a **four-theme switch** in the header. Light and
Dark are the everyday work modes. Rainbow is a saturated magenta mood. And GeoCities is
an intentional, over-the-top retro joke — blinking text, marquees, neon, Comic Sans, a
starfield — kept exactly because it shows personality. That switch is the whole
personality thesis: professional by default, playful on purpose. The system explicitly
rejects the interchangeable AI-blog template (cream background, one timid accent, an
uppercase eyebrow over every section) and the stiff corporate marketing page that reads
like a press release. Creativity is carried by the theme system and the writing, never by
making the default reading experience harder.

**Key Characteristics:**
- Reading-first: content is the star, chrome recedes.
- One accent, used sparingly, with a consistent meaning (links, actions, current state).
- Four themes from a single token layer — swap semantic tokens, not structure.
- Playful only where it's opt-in and labelled; the default stays clean and legible.
- Accessible by default (WCAG AA) — with GeoCities as the one knowing exception.

## 2. Colors

A restrained, ink-on-white base with one blue accent. The identity is carried by the
swappable theme layer, not by a busy default palette. Every theme is one set of the same
seven semantic tokens (`--bg`, `--text`, `--text-muted`, `--border`, `--accent`,
`--accent-hover`, `--surface`, `--accent-subtle`); components never hard-code color.

### Primary
- **Signal Blue** (#2563eb): Links, primary actions, active nav state, focus and hover
  emphasis. The single accent; it earns its power by staying rare. Hover deepens to
  **Deep Signal** (#1d4ed8).

### Neutral
- **Ink** (#1a1a1a): Body and heading text on light backgrounds.
- **Muted Slate** (#6b7280): Metadata, taglines, secondary labels — never body copy.
- **Paper** (#ffffff): The default page background.
- **Surface** (#f9fafb): Inline code, subtle raised areas.
- **Hairline** (#e5e7eb): Borders, dividers, card outlines — always full-perimeter, 1px.

### The Theme System (four moods, one token set)
- **Light** (default): Paper #ffffff / Ink #1a1a1a / Signal Blue #2563eb.
- **Dark**: bg #111827 / text #f3f4f6 / accent #60a5fa (desaturated for dark surfaces).
- **Rainbow**: bg #fdf6ff / text #2d1b4e / accent **#b010cf** (a rich magenta tuned to
  clear WCAG AA on the near-white background).
- **GeoCities**: an intentional retro-web parody (#ff00ff / #00ff00 / neon everything).
  It deliberately breaks contrast and motion norms — that's the joke — and is exempt from
  the AA target. Never "fix" it.

### Named Rules
**The One Accent Rule.** Every everyday theme has exactly one accent hue. It marks links,
the current page, and interactive emphasis — nothing decorative. If a screen looks
colorful in Light or Dark mode, something is overusing the accent.

**The Token-Only Rule.** Components read color exclusively from the semantic CSS
variables. Adding a hard-coded hex to a component is drift; add or reuse a token instead.

## 3. Typography

**Display / Body Font:** the native system UI stack (`system-ui, -apple-system,
BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
**Mono Font:** "Courier New" / monospace, for code only (and only in the GeoCities theme's
neon code blocks; default code uses the system mono fallback via `.prose code`).

**Character:** One family, differentiated by weight and size rather than a second
typeface. Fast-loading, native, and unpretentious — the type gets out of the way of the
writing. Contrast comes from weight (400 body vs 800 display) and scale, not font-pairing.

### Hierarchy
- **Display** (800, 3rem, line-height 1.25, letter-spacing -0.03em): Home hero name only.
  Solid ink with a single accent-colored period; `text-wrap: balance`.
- **Headline** (700, 1.5rem): Section headings ("Recent Posts") and post `<h2>`.
- **Title** (600, 1.25rem): Card titles and post `<h3>`.
- **Body** (400, 16px, line-height 1.7–1.8): Prose. Capped at a 65ch measure for
  comfortable reading.
- **Label** (500, 0.85rem): Post metadata (date · reading time · views), taglines, tags.
  Uses Muted Slate, never for anything that must be read as body copy.

### Named Rules
**The Weight-Not-Family Rule.** Hierarchy is expressed through weight and size in one
type family. Don't introduce a second font to create contrast.

**The 65ch Rule.** Long-form prose never exceeds a ~65ch measure, regardless of viewport.

## 4. Elevation

Essentially flat. Depth comes from hairline borders, the token `--surface` tint, and
whitespace — not from shadows. There is no shadow scale. The two exceptions are
functional, not decorative: the sticky header uses `backdrop-filter: blur(8px)` so content
scrolls under it legibly, and the image lightbox overlay uses a single soft drop shadow to
lift the zoomed image off its dark scrim.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Reach for a border or a surface
tint before a shadow; use a shadow only when an element genuinely floats above the page
(the lightbox).

## 5. Components

### Links
- **Default:** Signal Blue (`--accent`), 1px underline thickness, 2px underline offset.
- **Hover:** deepens to `--accent-hover`; smooth 0.15s color transition.

### Tags (pills)
- **Style:** accent text on an 8%-accent tint (`--accent-subtle`), fully rounded
  (`pill`), 0.8rem, weight 500.
- **Hover:** inverts to solid accent background with `--bg` text.

### Post Cards (recent-posts list)
- **Corner Style:** 12px (`rounded.lg`).
- **Background:** `--bg`, with a full 1px `--border` outline (never a side-stripe).
- **Hover:** border shifts to accent, a soft `--accent-subtle` glow, and a 1px lift
  (`translateY(-1px)`).
- **Internal Padding:** 1.25rem 1.5rem. Thumbnail + title/description/meta in a flex row.

### External-Origin Banner (callout)
- **Style:** full 1px `--border` with an `--accent-subtle` background wash and an external
  -link glyph. A background tint carries the "this is a callout" signal — **not** a
  colored left stripe.

### Theme Toggle
- **Style:** icon button, 1px `--border`, 8px radius, 6px padding; swaps a sun / moon /
  sparkle / CRT icon per active theme and spins 180° on press.
- **Touch:** ≥44×44px hit area on coarse pointers.

### Games (arcade pages)
- **Placement:** every game lives at `/games/<slug>/`. The `/games/` index splits them
  into sections with different shapes: puzzles and arcade games are indexes of rows (mark,
  name, tagline, blurb, arrow on hover), zen toys are a mark-led shelf of tiles with the
  flagship toy given a larger 2x2 tile. No uniform card wall, no uppercase eyebrow tags.
  The homepage carries only a single accent-washed callout linking to the arcade, so play
  never interrupts the site's primary reading flow.
- **Marks:** each game has its own line-art SVG in `GameMark.astro`, drawn in
  `currentColor` on a 40x40 grid so it inherits the accent and themes for free.
- **Page chrome:** a shared `GameLayout` gives each game the same frame — a back link,
  title + tagline + tag pill, a one-line instruction, an `aria-live` status readout, the
  stage, then controls and explanatory notes below.
- **Stage:** 1px `--border`, 12px radius, `aspect-ratio` per game with a 280px minimum.
  The geocities theme replaces the border with its ridged neon glow.
- **Style:** stage chrome and controls read from the semantic tokens; the illustration
  colors *inside* a canvas (koi, sand, petals, rainbow strokes, puzzle regions) are
  artwork, not UI color, and are exempt from the token-only rule.
- **Controls:** grouped into labelled sets that stack as rows, so buttons never
  scatter into a ragged wrap. A set is a small text label plus its controls; "pick one"
  choices render as a segmented control (one bordered object, hairline dividers, accent
  fill on the active segment) while independent actions stay separate pills. Toggles use
  `aria-pressed`, choice sets use `role="radiogroup"` + `aria-checked`, and every control
  meets a 44px target on coarse pointers.
- **Generated content:** games that build their own DOM must use `<style is:global>`
  scoped by the game's root id — Astro's scoped styles never reach elements created in
  JavaScript.
- **Performance and motion:** canvas rendering runs only while the stage is near the
  viewport and the tab is visible, and loops stop themselves once a scene settles.
  Reduced-motion visitors get a still frame with immediate, non-animated feedback.
- **Sound:** always off by default and only started from a user gesture.

### Puzzles (Memory, Jigsaw, Queens)
- **Fairness:** every board is generated in the browser and verified before it is shown.
  Queens refines its colour regions until exactly one solution survives, so a puzzle can
  always be reasoned out rather than guessed.
- **Feedback:** state lives on the element (`data-state`, `data-conflict`) so the visual
  language stays declarative; illegal placements are hatched rather than blocked, and the
  status line is the single source of progress for screen readers.
- **Difficulty:** offered as board size rather than timers or lives — the games have no
  fail state, only a longer think.

### Chain (arcade)
- **Placement:** `/games/chain/`, the first entry in the arcade section — the games here
  can be lost, which is what separates them from the puzzles and the zen toys.
- **Board:** the well is drawn *inside* the canvas rather than being the canvas box, so a
  falling piece can sit in a row of open air above the ceiling instead of being sliced off.
- **Pieces:** two orbs half the time, otherwise three in a line or an elbow, each with its
  own color. Rotation is table-driven (four quarter-turns per shape, precomputed) with a
  small wall-kick list so a long piece can still spin flush against a wall. There is no
  landing preview — the drop is the part you are supposed to be reading.
- **Readability:** each orb color also carries its own small mark (dot, ring, bar, square,
  cross) so the board never depends on hue alone, and touching orbs of one color are
  welded into a single blob so a clump reads as one object.
- **Difficulty:** offered as the number of colors (3/4/5) rather than speed presets,
  matching the puzzles' "size, not timers" habit. Each setting keeps its own best score.
- **Input:** the arrow keys work whenever the board is on screen and something is actually
  falling, so a desktop visitor never has to click first; while the game is paused, over,
  or a form field or button holds focus, the keys go back to the page. Touch gets drag to
  slide, tap to spin, swipe down to drop, and every action also has a button for people
  using neither.
- **Motion:** the loop stops whenever the board leaves the viewport or the tab is hidden,
  so nothing collapses while it is being read about. Reduced-motion visitors get instant
  settles and pops rather than animated ones.

### Koi Pond
- **Placement:** `/games/koi-pond/`, the flagship zen entry in the arcade.
- **Style:** the pond container uses the active theme's semantic tokens; natural koi,
  lily, and food colors live inside the canvas as illustration colors rather than UI
  colors.
- **Interaction:** tapping the water drops food at that point. The local feeding count
  persists on the visitor's device.
- **Performance and motion:** canvas rendering runs only while the pond is near the
  viewport. Reduced-motion visitors get a still pond with immediate feeding feedback.

### Navigation
- **Style:** muted-slate links, weight 500, 0.925rem; active page is accent-colored with a
  2px accent underline. Sticky, blurred header. Collapses to a hamburger menu <=640px.
- **Touch:** nav links and the menu button meet a 44px minimum target on coarse pointers.

### Blockquotes (prose)
- **Style:** a 3px accent left rule with italic muted text — the standard editorial
  quotation rule. This is the one intentional left-border in the system; it marks a
  *quotation*, not a card or alert.

## 6. Do's and Don'ts

### Do:
- **Do** read every color from the semantic tokens (`--accent`, `--text`, `--border`, …)
  so all four themes stay coherent.
- **Do** keep long-form prose at a ~65ch measure with 1.7–1.8 line-height.
- **Do** express emphasis with weight and size in the system font, and keep the single
  accent rare and meaningful.
- **Do** target WCAG AA (body ≥4.5:1, large text ≥3:1) in Light, Dark, and Rainbow, and
  verify accent contrast whenever a theme's `--accent` changes.
- **Do** give interactive controls a 44px touch target on coarse pointers, and provide a
  reduced-motion fallback for every animation.
- **Do** keep the GeoCities theme loud and ridiculous — it's a deliberate joke.

### Don't:
- **Don't** use `border-left`/`border-right` greater than 1px as a colored accent stripe
  on cards, callouts, or alerts (the blockquote quotation rule is the sole exception).
- **Don't** use gradient text (`background-clip: text`) — use a solid color; emphasize
  with weight or size.
- **Don't** ship the interchangeable AI-blog template: cream/sand background, one timid
  accent, or an uppercase tracked eyebrow over every section.
- **Don't** write a stiff corporate-marketing voice; this is a person's corner of the
  internet.
- **Don't** put muted-gray text on a colored background, or let novelty fight
  readability in the everyday themes.
- **Don't** apply AA-contrast or reduced-motion "fixes" to the GeoCities theme; its
  chaos is intentional.
