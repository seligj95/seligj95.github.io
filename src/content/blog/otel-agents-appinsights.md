---
title: "Monitor AI Agents on App Service with OpenTelemetry and the New Application Insights Agent UI"
description: "Instrument your AI agents with OpenTelemetry and light up the brand-new Agents (Preview) view in Application Insights. See token usage, agent traces, and end-to-end transaction details for agents running on Azure App Service."
pubDate: 2026-04-10
tags: ["azure", "app-service", "ai", "agents", "opentelemetry", "application-insights"]
heroImage: "/images/blog/2026/04/otel-agents-appinsights/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/monitor-ai-agents-on-app-service-with-opentelemetry-and-the-new-application-insi/4510023"
---

Deploying agents to production is only half the battle. Once they're running, you need to see inside the agent — the model calls, the tool invocations, the token spend. Application Insights' new Agents (Preview) view delivers exactly that, powered by OpenTelemetry and the GenAI semantic conventions.

This is Part 2 of our multi-agent series. Building on the travel planner deployed in Blog 1, this post dives deep into how we instrumented those agents with OpenTelemetry and lit up the new Agents blade. You'll see how to track which agent is consuming the most tokens, how long each agent takes, and when something goes wrong — which agent in the pipeline failed.

The full article covers the OpenTelemetry instrumentation patterns, the GenAI semantic conventions for agent spans, and a walkthrough of the Application Insights Agents UI with real data from the deployed sample.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/monitor-ai-agents-on-app-service-with-opentelemetry-and-the-new-application-insi/4510023) to instrument and monitor your AI agents.
