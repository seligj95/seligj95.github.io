---
title: "How I Built an AI Team That Generates My Blog Ideas — Using Squad on GitHub"
description: "A PM's guide to building a multi-agent ideation engine with Squad. Six AI agents scan competitors, evaluate trends, and file ideas as GitHub Issues — autonomously."
pubDate: 2026-04-06
tags: ["squad", "ai", "agents", "app-service", "mcp", "productivity"]
draft: false
---

I'm a PM on Azure App Service. I spend a lot of time thinking about what to write, what to build, and what competitors are shipping. The problem is, that thinking is scattered — a Hacker News link I saw at 11pm, a Cloudflare blog post someone shared in Slack, a half-formed idea in a notebook I'll never open again.

I wanted a system. Not "inspiration" — a system. Something that scans the landscape, evaluates what matters, scores ideas, and files them as GitHub Issues I can triage on a project board. Something that runs while I sleep.

So I built one. Using [Squad](https://github.com/bradygaster/squad).

## What is Squad?

Squad is a framework by [Brady Gaster](https://github.com/bradygaster) that lets you define a team of AI agents, each with a specific role, and orchestrate them to work together on tasks. Think of it like defining an org chart for AI — except the "employees" actually do the work.

I'd already used Squad once before, when I [tackled 78 Azure CLI issues in a day](/blog/squad-azure-cli-backlog/). That experience proved two things: multi-agent systems beat single-shot LLM calls for complex work, and Squad's agent-per-role pattern maps perfectly to how product teams actually operate.

This time, I wanted something more ambitious. Not a one-off session — a persistent ideation engine that runs autonomously and keeps my backlog full of high-quality ideas.

## The Problem: PM Ideation Is Ad Hoc

Here's what my "ideation process" looked like before:

1. See something interesting on Hacker News
2. Think "I should write about that"
3. Forget about it
4. See a competitor ship a feature I should have written about weeks ago
5. Panic-write a reactive blog post

This is how most PMs operate. We're information-saturated but idea-poor, because the gap between *seeing* something and *turning it into action* is where everything dies.

I needed to close that gap. Automatically.

## The Solution: A 6-Agent Ideation Team

> 📸 **TODO:** Screenshot of the squad team roster or `squad status` output showing the 6 agents

I built a Squad with six specialist agents, each responsible for a different type of output:

| Agent | Role | What They Actually Do |
|-------|------|----------------------|
| **Scout** | Web Scanner | Scans competitor blogs, Hacker News, GitHub Trending, Reddit, Dev.to, and industry publications for raw findings |
| **Analyst** | Competitive Intel | Evaluates what AWS, GCP, Vercel, Cloudflare, Fly.io, and others are shipping. Answers: Is this a threat? An opportunity? Are we ahead? |
| **Blogger** | Blog Ideation | Turns discoveries into blog post concepts with titles, hooks, outlines, audience, and effort estimates. Knows my writing style. |
| **Strategist** | Product Strategy | Writes mini-proposals for App Service engineering — problem statement, proposed solution, customer impact, quick-win vs. big-bet classification |
| **Builder** | Sample Architect | Designs sample repos and demos with full architecture: repo structure, deployment approach (azd, Bicep), key technologies |
| **Lead** | Orchestrator | Scores ideas on relevance × effort × impact × timeliness, deduplicates, and decides what gets my attention |

Plus a **Scribe** that handles memory — logging decisions, maintaining team knowledge, and making sure the agents learn from session to session.

Each agent has a charter (stored in `.squad/agents/{name}/charter.md`) that defines their personality, responsibilities, and work style. The Blogger, for example, knows my blog pattern ("You Can [Do X] on Azure App Service — Here's How"), knows I always include real deployment commands, and knows to pitch ideas from a PM perspective rather than pure tutorial mode.

## How the Scanning Works

The engine monitors three tiers of sources, defined in `sources/` files:

**Competitors (Tier 1 — watched closely):**
- AWS (Compute blog, What's New, App Runner, Lambda, Amplify)
- GCP (Cloud Blog, Cloud Run, App Engine)
- Vercel (Blog + Changelog)
- Cloudflare (Blog — Workers, Pages, AI Gateway, Agents)

**Competitors (Tier 2 & 3):**
- Netlify, Fly.io, Railway, Render, DigitalOcean, Deno Deploy

**Community:**
- Hacker News, Reddit (r/webdev, r/azure, r/devops), Dev.to, GitHub Trending

**Industry:**
- The New Stack, InfoQ, Azure Blog, App Service Team Blog, Container Apps Blog, Microsoft Tech Community

Each source has specific search terms and "what to look for" guidance. Scout doesn't just blindly scrape — it knows to prioritize AI workloads, agent hosting, MCP servers, and innovative developer experiences (our Tier 1 topic priorities) over traditional PaaS features.

## Automation: GitHub Actions + Ralph

The engine runs autonomously via two mechanisms:

**Scan Trigger** — A cron job fires every 6 hours and creates a `[Scan]` issue with instructions for the team. It also supports manual triggers with an optional focus area — "scan for MCP servers" or "scan for serverless trends."

**Ralph** — Squad's built-in work monitor picks up scan issues, dispatches agents, and routes work based on the team's routing table.

**Auto-add to Project** — Every new issue automatically lands on my GitHub Projects board in the Inbox column.

The flow: **Cron fires → Scan issue created → Auto-added to board → Ralph triages → Agents work → Ideas filed as separate issues → Board populated.**

## The Project Board

> 📸 **TODO:** Screenshot of the GitHub Projects board showing the Kanban columns (Inbox → Reviewing → Accepted → In Progress → Done → Rejected) with idea cards

Ideas flow through a Kanban-style board:

**Inbox** → **Reviewing** → **Accepted** → **In Progress** → **Done** → **Rejected**

Each idea is filed using one of five issue templates: Blog Idea, Product Idea, Sample Idea, Competitive Intel, or Tool Discovery. Rejected ideas get closed with a `rejected` label — this tells future scans "we already considered this and said no."

## Interactive Mode

> 📸 **TODO:** Screenshot of a Copilot CLI session showing an interactive agent conversation (e.g., `@scout` or `Team, do a full scan`)

The system isn't just autonomous. I can also talk to agents directly:

```
# Point Scout at a specific URL
@scout, scan Cloudflare's blog for recent agent announcements

# Ask Analyst for a competitive assessment
@analyst, what has AWS shipped for container hosting this month?

# Get targeted blog ideas
@blogger, give me 5 blog ideas about MCP servers on App Service

# Full team sweep
Team, do a full scan focused on AI agents
```

This is the part that makes it feel less like automation and more like having a team. I can have a conversation with my Analyst about whether Cloudflare's Agents SDK is a real threat, then ask my Blogger to turn that finding into a blog concept, then ask my Builder to design the sample repo for it — all in one session.

## The First Scan: What We Found

> 📸 **TODO:** Screenshot of the scan results in the terminal — the launch table showing all 5 agents running in parallel

The first comprehensive scan ran on April 6, 2026. The headline: **every major competitor now has a dedicated "host AI agents here" story.**

### The Competitive Landscape Is Shifting Fast

**🔴 Cloudflare** shipped a purpose-built agent platform with its own SDK, stateful execution (Durable Objects), and a sandboxed runtime. This isn't "run a container with an agent in it" — it's a first-class agent hosting primitive.

**🔴 AWS** launched AgentCore with a zero-code API-to-MCP gateway. You point it at an API spec and it generates MCP tools automatically.

**🟡 GCP** shipped managed MCP servers + Agent Development Kit. **Vercel** turned v0 into a multi-agent app builder.

The takeaway: App Service has great MCP samples, but no unified "agent hosting" narrative. Every competitor does. That's a gap — and an opportunity for blog content and product proposals.

### 11 Ideas Filed

> 📸 **TODO:** Screenshot of the GitHub Issues list showing the 11 filed ideas with labels (blog-idea, product-idea, sample-idea, etc.)

The scan produced 11 GitHub Issues across all categories:

**Blog Ideas (7):** CrewAI multi-agent on App Service, LangGraph agents, Microsoft Agent Framework, Enterprise AI Gateway, Squad pattern on App Service, MCP Server hosting tutorial, MCP GitHub Analyzer

**Product Proposals (2):** Durable Agent Runtime (our biggest platform gap), Agent Insights Dashboard

**In-Flight (2):** MCP Server blog post (already writing), MCP-as-a-Service (already with engineering)

Each scored on a 20-point scale (Relevance + Impact + Timeliness + Innovation + inverted Effort). The top scorer at 19/20: "You Can Host an MCP Server on Azure App Service — Here's How."

## What the System Learned

After the first session, the team captured patterns in its shared memory:

- **"Run X on App Service" is the strongest blog template.** My [OpenClaw post](/blog/openclaw-azure-appservice/) proved this works.
- **Competitor features are both product ideas AND blog ideas.** Evaluate both angles.
- **Always file ideas as GitHub Issues** — even rejections. This makes dedup reliable: `gh issue list --state all` catches everything.
- **AI, agents, and MCP are Tier 1 priority.** Traditional features (certs, auth, networking) are low priority unless highly impactful.

These learnings persist across sessions. The team gets smarter over time.

> 📸 **TODO:** Screenshot of the repo file tree in VS Code or GitHub showing the `.squad/` directory structure

## Why This Matters for PMs

I'm not writing this to show off a cool AI project. I'm writing it because **the PM ideation problem is real and nobody talks about it.**

We talk about "customer discovery" and "data-driven prioritization." We don't talk about the fact that most PMs' competitive intelligence process is "scrolling Twitter" and their blog ideation process is "whatever I thought of in the shower."

This system doesn't replace my judgment. It replaces the *scanning* — the tedious, inconsistent, always-incomplete process of keeping up with the landscape. The agents surface the raw material. I still decide what's worth pursuing.

And it's not just for writing. The Strategist proposals are things I can bring to engineering standups. The Builder architectures are things I can hand to dev advocates. The Analyst findings are things I can share with my PM peers. It's a full ideation pipeline, not just a blog idea generator.

## What's Next

Right now, I have 7 open ideas on the board from the first scan. The system will keep scanning every 6 hours. Over time, the patterns in `wisdom.md` will get richer, the dedup will get smarter, and the scoring will calibrate to what actually performs well on the blog.

If you're a PM who writes, builds samples, or tracks competitors — consider building something like this. You don't need six agents. Start with two: a scanner and an evaluator. The compound effect of consistent, automated ideation is real.

The future of PM work isn't just *using* AI tools. It's building AI systems that make *your specific workflow* better. That's what Squad lets you do.
