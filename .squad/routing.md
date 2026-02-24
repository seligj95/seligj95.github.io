# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| UI, pages, components, styling, theming | Ariadne | Build homepage, create blog card component, add dark mode |
| Analytics, comments, likes, RSS, SEO, integrations | Yusuf | Set up view tracking, integrate Giscus, add RSS feed |
| Architecture, tech stack, scope, priorities | Cobb | Choose static site generator, decide on comment system, code review |
| Tests, quality, edge cases, CI | Arthur | Write tests, check accessibility, verify builds |
| Code review | Cobb | Review PRs, check quality, approve/reject |
| Session logging | Scribe | Automatic — never needs routing |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Cobb |
| `squad:cobb` | Architecture or scope work | Cobb |
| `squad:ariadne` | Frontend/UI work | Ariadne |
| `squad:yusuf` | Integration/backend work | Yusuf |
| `squad:arthur` | Testing work | Arthur |

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Arthur to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. Cobb handles all `squad` (base label) triage.
