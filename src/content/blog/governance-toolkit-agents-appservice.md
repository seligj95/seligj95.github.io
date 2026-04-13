---
title: "Govern AI Agents on App Service with the Microsoft Agent Governance Toolkit"
description: "Add policy enforcement, tool allowlists, and deny-by-default governance to your multi-agent apps on Azure App Service — in under 50 lines of code. Part 3 of the Build → Monitor → Govern series."
pubDate: 2026-04-13
tags: ["azure", "app-service", "ai", "agents", "governance", "security"]
heroImage: "/images/blog/2026/04/governance-toolkit-agents-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/govern-ai-agents-on-app-service-with-the-microsoft-agent-governance-toolkit/4411583"
---

You built the agents. You can see them in App Insights. But can you control what they're allowed to do?

This is Part 3 of our multi-agent series on Azure App Service. Building on the travel planner from Parts 1 and 2, this post shows how to integrate the Microsoft Agent Governance Toolkit to enforce deny-by-default policies on agent tool calls. You'll define which tools each agent can invoke, block everything else, and get audit-ready logging — all with a single NuGet package and a YAML policy file.

The full article walks through the governance integration pattern, the YAML policy schema, how the toolkit intercepts tool calls at the MAF middleware layer, and why App Service is the ideal host for governed agents (Managed Identity, VNet isolation, deployment slots for policy rollout).

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/govern-ai-agents-on-app-service-with-the-microsoft-agent-governance-toolkit/4411583) to lock down your AI agents.
