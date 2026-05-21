---
title: "You can build a framework-agnostic AI gateway on Azure App Service — here's how"
description: "AWS shipped Bedrock AgentCore as a closed, opinionated agent runtime. Azure's answer is the opposite — composable services you already have. This post walks through a runnable sample: one App Service hosting both an Agent Framework agent and the MCP server it calls, fronted by APIM with the AI Gateway policy set for token rate limiting, semantic caching, and per-subscription token-metric chargeback. One azd up deploys the lot — and the framework on top is genuinely interchangeable."
pubDate: 2026-05-21
tags: ["azure", "app-service", "apim", "ai-gateway", "mcp", "agent-framework", "python"]
heroImage: "/images/blog/2026/05/ai-gateway-mcp-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-build-a-framework-agnostic-ai-gateway-on-azure-app-service-%E2%80%94-heres-how/4522004"
---

The agent infrastructure conversation moved this year. AWS shipped [Amazon Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/) as a managed agent runtime — per-session microVM isolation, built-in long-term memory, native MCP support, an opinionated policy engine. Cloudflare's [Agents SDK](https://github.com/cloudflare/agents) bets on edge-native stateful agents on Durable Objects. Both are real, and both arrive as closed, proprietary runtimes.

So what's Azure's answer? Azure already has the pieces — they just don't ship as one product called *AgentRuntime*, and that's the point. The pitch is composable: **App Service + API Management + MCP**, three services you already have access to, glued together with open standards.

This post walks through a runnable sample of that composition. **One** App Service hosts both an agent (Microsoft Agent Framework) and the stateless MCP server it calls. APIM sits in front with the [AI Gateway policy set](https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities) — semantic caching, token rate limiting, per-subscription token emission for chargeback. Managed identity end-to-end, no AOAI keys in app code, App Insights wired up. One `azd up` deploys the lot.

The headline claim is in the title, but the point underneath it is the one that matters: **the framework is replaceable, the gateway is the contribution.** Swap the Agent Framework module for Pydantic AI or LangGraph and the rest of the architecture is unchanged. That's what "run anything" means, made literal — and it's the structural reason the composable bet beats the proprietary-runtime bet for the long tail of App Service workloads.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-build-a-framework-agnostic-ai-gateway-on-azure-app-service-%E2%80%94-heres-how/4522004) and grab the [sample repo on GitHub](https://github.com/seligj95/app-service-ai-gateway-mcp-apim-python).
