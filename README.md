# jordanselig.com

Personal site by Jordan Selig — blog, talks, projects, an arcade of twelve
browser games, and a daily puzzle that is the same for everyone. Built with
[Astro](https://astro.build) and deployed to GitHub Pages at
[jordanselig.com](https://jordanselig.com).

The site is a static build. The daily leaderboard and live Tech Community view
counts use a small Node API in [`api/`](#the-site-api) running on Azure Container
Apps at `api.jordanselig.com`. Everything else — every game, every board, every
guess — runs in the browser.

## Quick start

```bash
npm install
npm run dev        # dev server at localhost:4321
npm run build      # static build into dist/
npm run preview    # serve the built site
npm test           # vitest run (builds first, then asserts on dist/)
npm run test:api   # the API's own suite, which needs no build
```

The API is a separate workspace with its own dependencies:

```bash
cd api && npm install
npm run dev        # API at localhost:8080, in-memory store
```

## Tech stack

- **Framework:** Astro 5, static output, zero client framework
- **Search:** Pagefind (`astro-pagefind`), indexed at build time
- **Analytics:** GoatCounter (privacy friendly, no cookies)
- **Comments:** Giscus, backed by GitHub Discussions
- **Tests:** Vitest + happy-dom, run against the built `dist/`
- **Hosting:** GitHub Pages via GitHub Actions
- **Daily scores API:** Hono on Node, Azure Table Storage, deployed to Azure
  Container Apps and scaled to zero between requests
- **Chess legality:** [chess.js](https://github.com/jhlywa/chess.js), so the
  board never has to reimplement check, pins or mate detection
- **Chess defense:** [js-chess-engine](https://github.com/josefjadrny/js-chess-engine),
  a deterministic browser-side opponent and hint evaluator

## Project structure

```
src/
├── components/      # Header, Footer, search, comments, GameMark, board and
│                    # leaderboard partials
├── content/blog/    # Markdown posts (the only content collection)
├── data/            # games.ts and dailies.ts — the two registries
├── layouts/         # BaseLayout, BlogPostLayout, GameLayout
├── lib/             # Game logic kept out of the pages: solvers, board
│                    # controllers, the seeded RNG, the day boundary
├── pages/           # Routes, including pages/games/* and pages/daily/*
└── styles/          # global.css — all four themes live here
api/                 # The scores API. Its own package.json, tsconfig and tests.
scripts/             # Build tooling run by hand, not by the build
public/contexto/     # Committed word vectors, downloaded by the Contexto pages
tests/               # Vitest suites that assert on the built output
```

## Writing posts

Add a `.md` file to `src/content/blog/`:

```markdown
---
title: "My Post"
description: "A short summary."
pubDate: 2026-02-24
tags: ["tag1", "tag2"]
---

Content goes here.
```

Optional frontmatter (see `src/content.config.ts` for the full schema):

| Field | Effect |
|-------|--------|
| `featured: true` | Promotes the post to the homepage hero. Newest featured post wins. |
| `draft: true` | Keeps the post out of listings, the RSS feed, and the sitemap. |
| `updatedDate` | Shows an "updated" line and updates the JSON-LD schema. |
| `heroImage` | Header image, also used for Open Graph. |
| `coAuthors` | `[{ name, url }]` — renders a "By Jordan Selig & Name" byline. |
| `externalUrl` | Marks the post as published elsewhere. |

### External posts

Posts published on another platform (Tech Community, dev.to) use `externalUrl`.
They appear in the blog list and RSS feed linking straight to the original, and
their own page shows the summary plus a banner pointing at the full article.
Tech Community cross-posts show that article's live view count; native posts and
other external platforms use GoatCounter.

## Games

Twelve games under `/games/`, all of them client-side only: no server, no
accounts, no persistence beyond `localStorage` for best scores. Free play is the
default everywhere — a fresh random board, unlimited goes, nothing recorded off
your machine. `src/data/games.ts` is the single source of truth: it drives the
games index, the header on each game page, and `tests/build-output.test.ts`.

Adding a game:

1. Add an entry to `src/data/games.ts` (`slug`, `title`, `tagline`, `blurb`,
   `tag`, `instructions`). The `tag` picks the section of the index it lands
   in: `puzzle`, `arcade`, or `zen`.
2. Add a matching mark to `src/components/GameMark.astro` keyed on the slug.
3. Create `src/pages/games/<slug>.astro` wrapping the game in `GameLayout`,
   which supplies the title, instructions, stage, status line, and control bar.
4. Reuse the shared `.control-set` / `.control-label` / `.control-group`
   classes for controls so they stay consistent (and usable on phones).

Note: Astro's scoped styles do not apply to elements created in JavaScript, so
games that build their own DOM use `<style is:global>` with every selector
prefixed by the game's root id. Watch the direction of that trade — a scoped
rule beats a global rule of the same specificity, because scoping adds an
attribute selector, so an override for scoped markup has to live in the scoped
block.

## Daily puzzles

`/daily/` is the same games under different rules: one puzzle a day, the same one
for everybody, one attempt, and an optional shared board. There are no accounts,
no sign-in and no streaks — you type a name if you want your score listed, and
that name is remembered on the device so the next day is one tap.

Three games have a daily version today. **Queens** ranks by time, with 30
seconds added per hint. **Contexto** ranks by number of guesses and offers no
hints at all. **Chess** ranks by legal player moves, with elapsed time as the
tiebreaker. Every legal move stays played and a browser engine chooses Black's
reply, so players can find checkmate outside the curated line. Its hint evaluates
the current position and adds one move plus 30 seconds; giving up forfeits
posting and reveals one known solution.

A few decisions worth knowing before changing any of it:

- **The day rolls over at 00:00 `America/New_York`**, not at the visitor's local
  midnight, so everyone is on the same puzzle at the same instant. `src/lib/daily.ts`
  owns that boundary; nothing else should compute a date.
- **Day arithmetic goes through `dayIndex()`, never through subtracting
  timestamps.** Consecutive local midnights are 23 or 25 hours apart across a
  daylight-saving change, so dividing elapsed milliseconds by a day would
  occasionally repeat or skip a puzzle.
- **Puzzles are chosen by walking a fixed shuffle, not by drawing at random from
  a seed.** Independent draws collide surprisingly early, and a word repeating
  within the first year reads as a bug. Contexto shuffles its 706 secret words
  once under a versioned seed and steps through the list, so every word appears
  before any repeats.
- **The one-attempt lock is advisory.** It is `localStorage`, so clearing the
  browser lets you replay. That is accepted: cheating is out of scope.

Adding a daily:

1. Add an entry to `src/data/dailies.ts` (`slug`, `title`, `tagline`, `blurb`,
   `ranking`, `scoring`). `scoring` is `time`, `guesses` or `moves`; lower wins
   every way.
2. Create `src/pages/daily/<slug>.astro`. `src/lib/daily-progress.ts` stores
   what has been played and any in-progress state, and `DailyLeaderboard.astro`
   handles fetching, posting and rendering the board.
3. Add the slug to `GAMES` in `api/src/guards.ts` with its scoring, and give it
   plausible bounds. **The API has to deploy before the page goes live**, or
   submissions are rejected and the board silently stays hidden.

The arcade entry, its `GameMark` and its page are all reused, so a daily costs
roughly a registry line and a page.

### Elapsed time as a tiebreaker

`Score` and `Done` both carry an optional `elapsed?: number` — seconds spent,
bounded to `1..86400`. It is omitted entirely for Queens and Contexto, whose
behavior is unchanged. **Chess is the first game to require it**: the API
rejects a `"moves"`-scored submission that omits `elapsed`, since move count
alone leaves too many ties. Ordering everywhere — the in-memory dev store, the
Azure Table Storage rows, and the leaderboard's own rendering — is score
ascending, then elapsed ascending when present, then submission time. Rows
written before this field existed have no `elapsed` and keep sorting by
submission time among themselves, so old leaderboards read exactly as they
did before.

### Contexto's word data

Contexto ranks a guess by how close its meaning is to the answer, which needs
word vectors. `scripts/build-contexto-words.ts` builds them:

```bash
npm run contexto:words
```

It range-requests just the 50-dimensional slice out of GloVe 6B — the full
archive is 862MB, and the slice it reads is about 20MB — keeps the 30,000 most
common usable words, folds plurals and other inflections onto their base word,
and writes `public/contexto/vectors.bin` and `vocabulary.json`, together about
930KB gzipped.

The vectors come from GloVe 6B (Pennington, Socher and Manning, 2014), which is
released into the public domain under the PDDL. The output is committed, so the
build never touches the network. Run it by hand only when the vocabulary should
change. Ranking happens in the browser: 30,000
dot products, about 5ms, once per game. That is deliberate — a game is 50 to 200
guesses, and a round trip per guess to a container that scales to zero would
feel broken.

### Chess's puzzle data

Chess has no generator: `src/data/chess-puzzles.ts` is a hand-curated list of
mate-in-1, mate-in-2 and mate-in-3 positions, each stored as a starting FEN
plus its full solution line in UCI (`e2e4`, `e7e8q`, ...), alternating player
move and authored reply. `tests/chess-puzzles.test.ts` replays every line
through chess.js and asserts the final position is checkmate, so a broken or
mistyped line fails the suite rather than silently shipping. During live play,
js-chess-engine evaluates the actual position for Black's replies and hints;
the curated line is retained as a guaranteed solution for Give up to reveal.
The arcade cycles through the list at
random without an immediate repeat; the daily picks one deterministically per
day the same way Contexto steps through its word list.

## The site API

`api/` is the only server-side code in the repo: a small Hono app holding the
daily leaderboards. It is a standalone Node workspace with its own
`package.json` and `tsconfig.json`, deliberately not sharing the root Astro
config.

```
GET  /api/health
GET  /api/daily/:game/:day/scores
POST /api/daily/:game/:day/scores
```

`npm run dev` serves Tech Community view counts through a development-only
middleware, so blog pages need no second process. The daily leaderboard still
needs the API; with no storage account configured it falls back to an in-memory
store. To see the leaderboard end to end, run both halves and point the site at
the local API.

```bash
cd api && PORT=8787 npm run dev
PUBLIC_SCORES_API=http://localhost:8787 npm run dev    # in the site root
```

Notes:

- **`api/src/guards.ts` is where a new daily is declared.** It holds the map of
  game to scoring and the plausible bounds for each. The write endpoint is
  public and unauthenticated, so everything from a browser is treated as a
  suggestion: names are trimmed and capped, absurd scores are rejected, and
  writes are rate limited to 20 per IP per hour. None of that stops someone
  with curl, and it is not meant to.
- **Storage sits behind a two-method interface**, `add()` and `list()`. Azure
  Table Storage backs it in production; the row key zero-pads the score so a
  partition comes back already sorted.
- **The site and the API deploy from the same push but through separate
  workflows**, so they are never quite in step. Both sides therefore tolerate
  the other being a version behind: responses carry a score under both its old
  and new names, and readers accept either.
- **Moderation is a CLI**, not an endpoint. `npm run scores -- list` and
  `npm run scores -- delete <rowKey>` from `api/`, against an Azure login with
  *Storage Table Data Contributor*.

Any new directory under `api/` containing TypeScript has to be added to the
`include` list in `api/tsconfig.json`. Files left out of it fall back to the
root Astro config, which resolves locally and then fails only in CI.

## Testing

```bash
npm test           # the site
npm run test:api   # the API
```

The site suites build once (`tests/global-setup.ts`) and then assert against
`dist/`: accessibility basics, SEO tags and JSON-LD, the RSS feed, GeoCities
theme performance budgets, and build output (every game page exists, every route
renders, no broken internal links). Game and daily logic is unit tested directly
out of `src/lib/`, which is most of what lives there.

The API suite runs against the in-memory store and needs no build and no Azure.

## Deployment

Two workflows, both on pushes to `main`:

- `.github/workflows/deploy.yml` builds the site and deploys it to GitHub Pages.
  The custom domain comes from `public/CNAME`, and `site` in `astro.config.mjs`
  must match it, since the absolute URLs in the sitemap, RSS feed and Open Graph
  tags are derived from it.
- `.github/workflows/deploy-api.yml` builds the API image, pushes it to GHCR and
  updates the container app. It only runs when something under `api/` changes,
  and it authenticates to Azure with an OIDC federated credential rather than a
  stored secret.

`.github/workflows/test.yml` runs both suites on pull requests, as two parallel
jobs. The deploy workflow runs the site suite again before shipping, so a
failing test stops the deploy either way — new code needs tests.

The API runs on Azure Container Apps, scaled to zero, capped at a low
`maxReplicas` so nothing can quietly burn through the subscription credit, with
a budget alert on the resource group as a backstop.

---

## Service configuration

### GoatCounter (analytics)

The tracking script lives in `src/components/BaseHead.astro`. Update the
`data-goatcounter` URL if the site code changes. It sets `allow_local: true`,
so `localhost` views are counted during development.

### Giscus (comments)

Comments render through `src/components/Comments.astro`, which already has the
repo, repo id, category, and category id baked in as prop defaults — nothing to
paste in per post. To point it at a different repo or discussion category, get
new ids from [giscus.app](https://giscus.app) and update those defaults. The
widget's theme follows the site's theme toggle.

### GitHub Pages (hosting)

Settings → Pages → Source: **GitHub Actions**. The workflow in
`.github/workflows/` builds and deploys on every push to `main`.

### RSS feed

Generated by `src/pages/rss.xml.ts` at `/rss.xml`, with post titles,
descriptions, dates, and tags as categories. External posts link to their
original URL. Readers auto-discover it from the `<link rel="alternate">` tag.

### Themes

Four themes, cycled by the toggle in the header:

| Theme | Vibe |
|-------|------|
| **Light** | Clean default |
| **Dark** | Dark mode |
| **Rainbow** | Soft pastel purple |
| **GeoCities** | 90s chaos: Comic Sans, neon, marquee, spinning emoji, sparkle cursor, fake hit counter |

The preference is saved to `localStorage`. The valid theme list appears in
three places that must stay in sync: `global.css`, `ThemeToggle.astro`, and the
flash-prevention script in `BaseHead.astro`.

### SEO

- Open Graph and Twitter cards are set in `BaseHead.astro`.
- JSON-LD `Article` schema is injected on every blog post.
- The sitemap is generated by `@astrojs/sitemap` and referenced from
  `public/robots.txt`.
