# Product

## Register

brand

## Users

General professional audience — developers, peers, and colleagues in and around the
Microsoft / Azure ecosystem, plus anyone who lands here from a talk, a shared post, or
a search. They arrive to read a specific piece of writing, watch a talk, or get a sense
of who Jordan is and what he works on. The context is casual and self-directed: skimming
recent posts, following a link from social media, or evaluating Jordan's professional
background.

## Product Purpose

A personal blog and living portfolio for Jordan Selig, a Product Manager on Azure App
Service. It collects professional work in one place — blog posts (original and
cross-posted), conference talks, and side projects — so the body of work is easy to
browse, share, and discover. Success looks like: posts are pleasant to read, the
portfolio is current and credible, and a first-time visitor quickly understands the
range and quality of Jordan's work.

## Brand Personality

Innovative, creative, team-player. The voice is knowledgeable and hands-on without being
stiff — someone who ships real samples and shares them, credits collaborators, and isn't
afraid to have a little fun (the site ships a deliberately over-the-top "GeoCities" theme
as a wink). Professional by default, playful on purpose. It should feel like a real
person's corner of the internet, not a corporate template.

## Anti-references

- Generic, cookie-cutter AI-blog templates — the interchangeable "cream background +
  one accent + eyebrow labels on every section" starter look.
- Stiff corporate marketing pages that read as press releases rather than a person.
- Over-designed personal sites where novelty fights readability. The creativity lives in
  the theme system and the writing, not in making the default reading experience harder.

## Design Principles

- **Show the work, not the talk.** Let the shipped posts, talks, and projects carry the
  portfolio; keep chrome minimal so the content is the star.
- **Craft signals credibility.** Correctness and polish (clean type, working links, no
  visual bugs) are how a professional portfolio earns trust.
- **Playful on purpose, never sloppy.** Personality comes through in deliberate, opt-in
  moments (the theme toggle, the GeoCities easter egg) — the default experience stays
  clean and legible.
- **Generous and team-oriented.** Reflect the "team-player" voice: share samples, link
  out to originals and collaborators, make it easy for others to build on the work.
- **Readable and accessible first.** Long-form reading is the core job; typography,
  contrast, and structure serve that above decoration.

## Accessibility & Inclusion

Target **WCAG 2.1 AA** for the everyday themes (Light, Dark, Rainbow): body text ≥ 4.5:1,
large text ≥ 3:1, keyboard-navigable, semantic landmarks, labeled controls (an automated
a11y test suite already guards much of this). Honor `prefers-reduced-motion` with still
fallbacks for animated content. The **GeoCities** theme is an intentional retro novelty
that deliberately breaks contrast and motion norms; it is opt-in and never the default, so
it is exempt from the AA contrast target — but it should still respect reduced-motion.
