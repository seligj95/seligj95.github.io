---
title: "What the New API Management AI Gateway Tier Changes for App Service-Hosted Agents"
description: "App Service remains the application runtime for your agent. The dedicated API Management AI Gateway tier becomes the governed boundary for models and MCP tools."
pubDate: 2026-08-11
tags: ["azure", "app-service", "apim", "ai-gateway", "agents", "mcp"]
heroImage: "/images/blog/2026/08/apim-ai-gateway-tier-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/what-the-new-api-management-ai-gateway-tier-changes-for-app-service-hosted-agent/4543974"
---

Azure API Management now has a dedicated AI Gateway tier in public preview. For agents hosted on Azure App Service, the application runtime does not move: App Service still owns the web app, agent orchestration, streaming, deployment lifecycle, scaling, managed identity, and application telemetry. The new tier becomes the governed boundary around models and MCP tools.

The runnable Python sample sends both model and MCP traffic from App Service through AI Gateway. It demonstrates a stable model alias, structured token policy, separate runtime and backend credentials, managed identity to Microsoft Foundry, Key Vault-backed secrets, gateway telemetry, and bounded retry behavior without adding a direct provider fallback.

The full article distinguishes the dedicated tier from AI capabilities in regular APIM tiers and Foundry-associated APIM, then walks through the model and tool paths, tests that prove the gateway is in the request path, the identity boundaries, and the infrastructure deployed with `azd`.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/what-the-new-api-management-ai-gateway-tier-changes-for-app-service-hosted-agent/4543974) and explore the [companion sample on GitHub](https://github.com/seligj95/app-service-ai-gateway-tier-python).
