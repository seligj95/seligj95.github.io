# Decision: RSS feed links must include base path

**By:** Yusuf (Integration Dev)
**Date:** 2026-02-24

## What
RSS item links now use `/personal-blog/blog/{slug}/` instead of `/blog/{slug}/`.

## Why
`@astrojs/rss` concatenates the `site` config (`https://jordanselig.github.io`) with each item's `link`. Since Astro's `base` config (`/personal-blog`) is not automatically applied to RSS links, we must manually include it. Without this, RSS readers would get 404s on every post link.

## Impact
If the repo name or `base` config ever changes, `rss.xml.ts` links must be updated to match.
