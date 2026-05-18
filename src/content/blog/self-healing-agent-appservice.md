---
title: "Turn Your App Service Web App Into a Self-Healing Agent: LLMOps Best Practices for Production"
description: "Web-app SLOs (Http5xx, p95) don't catch the failures that actually hurt an agent in production: unbounded cost, silent quality regressions, prompt drift. This post walks through the LLMOps middleware — SLIs, a budget circuit breaker, prompt-repair retries, and an auto slot-swap rollback driven by Azure Monitor — that I built into a deployable App Service sample."
pubDate: 2026-05-18T10:00:00
tags: ["azure", "app-service", "llmops", "ai", "python", "agents"]
heroImage: "/images/blog/2026/05/self-healing-agent-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/turn-your-app-service-web-app-into-a-self-healing-agent-llmops-best-practices-fo/4520867"
---

You shipped an LLM agent. It worked great in the demo. Now it's running 24/7 and you have new problems your web-app playbook doesn't cover: an agent that loops on a flaky tool and burns 50,000 tokens on one prompt, a model that hallucinates confident JSON and silently fails, a prompt tweak that ships in seconds and craters tool-call accuracy by 30%. Your APM dashboard stays green the whole time because none of it is a 500.

Web-app SLOs (uptime, p95 latency, Http5xx) are necessary but not sufficient. Agents need agent-shaped SLOs — task success rate, $ per task, tool success rate, repair-retry rate — and middleware that can act on them before the bill arrives.

This post walks through that middleware end-to-end on a deployable App Service sample: an OpenTelemetry-instrumented agent loop on Azure OpenAI (with managed identity, no keys), eleven custom metrics flowing into App Insights, a per-tenant budget circuit breaker that downshifts `gpt-4o` to `gpt-4o-mini` at 80% spend (a 16× cost reduction), retry-with-prompt-repair for malformed tool calls, a chaos CLI for practicing failures, and the bit that makes the whole thing self-healing — a Logic App "healer" that calls `slotsswap` automatically when a metric alert fires on `Http5xx > 5 in 5 minutes`. From alert-fire to rolled-back-slot is about 4 minutes, with zero application code in the healer.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/turn-your-app-service-web-app-into-a-self-healing-agent-llmops-best-practices-fo/4520867) and grab the [sample repo on GitHub](https://github.com/seligj95/app-service-self-healing-agent-python).
