---
title: "Microsoft Foundry Now Has an AI Gateway Control Plane — What Changes for App Service"
description: "Microsoft Foundry can now create or associate an APIM-based AI Gateway directly from its Admin console. Here's what that changes for an App Service-hosted agent, what stays in APIM, and the v2-tier constraint to check before migrating."
pubDate: 2026-07-17
tags: ["azure", "app-service", "apim", "ai-gateway", "foundry", "governance"]
heroImage: "/images/blog/2026/07/foundry-ai-gateway-control-plane-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/microsoft-foundry-now-has-an-ai-gateway-control-plane-%E2%80%94-what-changes-for-app-ser/4538320"
---

In May, I published a [runnable sample](https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-build-a-framework-agnostic-ai-gateway-on-azure-app-service-%E2%80%94-heres-how/4522004) that put Azure API Management in front of an AI agent on Azure App Service — APIM handling token limits, semantic caching, and token metrics, with the agent framework left interchangeable. This post covers what changed since then.

Microsoft Foundry can now create or associate an APIM-based AI Gateway directly from its Admin console. The data path is still APIM; what changed is who can configure and govern it. **App Service still runs the agent, and APIM still governs the traffic contract and advanced gateway behavior** — Foundry adds a first-party control plane on top, with per-project token limits, project onboarding, and a governed inventory for agents and supported MCP tools.

The one migration detail worth flagging up front: the original sample's APIM instance defaults to the Developer tier, and Foundry's direct integration currently requires a **supported v2 tier** — a Developer-tier gateway won't show up in Foundry's "use existing APIM" list.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/microsoft-foundry-now-has-an-ai-gateway-control-plane-%E2%80%94-what-changes-for-app-ser/4538320) and revisit the [companion sample on GitHub](https://github.com/seligj95/app-service-ai-gateway-mcp-apim-python).
