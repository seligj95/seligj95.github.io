---
title: "Build Multi-Agent AI Apps on Azure App Service with Microsoft Agent Framework 1.0 GA"
description: "Deploy a multi-agent travel planner on Azure App Service using the GA release of Microsoft Agent Framework. Covers the unified API surface, breaking changes from preview, and why App Service is the sweet spot for agent workloads."
pubDate: 2026-04-09
tags: ["azure", "app-service", "ai", "agents", "microsoft-agent-framework"]
heroImage: "/images/blog/2026/04/maf-multi-agent-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/build-multi-agent-ai-apps-on-azure-app-service-with-microsoft-agent-framework-1-/4510017"
---

Microsoft Agent Framework has reached 1.0 GA — unifying AutoGen and Semantic Kernel into a single, production-ready agent platform. This post rebuilds our multi-agent travel planner on the stable API surface, walks through the breaking changes from preview, and shows why Azure App Service is the sweet spot for running agent workloads in production.

Six specialized agents — a Coordinator, Currency Converter, Weather Advisor, Local Knowledge Expert, Itinerary Planner, and Budget Optimizer — collaborate to generate comprehensive travel plans. The architecture uses ASP.NET Core with WebJobs for async processing, Azure Service Bus for messaging, Cosmos DB for state, and Azure OpenAI for the brains.

The full article covers the GA package references, the key breaking changes (Instructions on options removed, RunAsync parameter rename), and how App Service features like Always On, WebJobs, and deployment slots make it an ideal host for multi-agent systems.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/build-multi-agent-ai-apps-on-azure-app-service-with-microsoft-agent-framework-1-/4510017) to build and deploy your multi-agent app.
