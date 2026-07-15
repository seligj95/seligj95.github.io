---
title: "Give your AI agent two memories with Azure App Service"
description: "Build an AI agent with two distinct memory horizons: bounded conversation history in Azure Managed Redis and durable, user-scoped semantic memory in Azure Cosmos DB, all hosted on Azure App Service."
pubDate: 2026-07-15
tags: ["azure", "app-service", "ai", "agents", "memory", "redis", "cosmos-db", "python"]
heroImage: "/images/blog/2026/07/agent-memory-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/give-your-ai-agent-two-memories-with-azure-app-service/4537400"
---

An AI agent needs to remember on two very different time horizons. Recent conversation turns keep the current session coherent: "use the second option" only makes sense if the agent remembers the options. Durable memory carries a smaller set of useful facts — a preferred Azure region, product name, accessibility need, or writing style — into a completely new conversation.

Those jobs have different storage, retrieval, retention, and deletion requirements. This reference implementation keeps bounded, seven-day conversation history in Azure Managed Redis and stores selective, user-scoped semantic memory in Azure Cosmos DB for NoSQL vector search. Microsoft Agent Framework joins both through a custom `HistoryProvider` and `ContextProvider`, while Azure OpenAI handles chat and embeddings.

![Architecture for short-term conversation history in Azure Managed Redis and durable semantic memory in Azure Cosmos DB](/images/blog/2026/07/agent-memory-app-service/architecture.png)

The complete FastAPI sample runs on Azure App Service with managed identity and no data-service keys. It includes a browser UI with memory attribution and explicit list/forget controls, deterministic local mode, tests, Bicep, Azure Developer CLI support, and a deployment smoke test that proves memory can be recalled across sessions and deleted again.

The full article explains why one unbounded memory store is not enough, walks through both Agent Framework providers, covers the passwordless Azure architecture, and calls out the production work the demo deliberately leaves visible — including real authentication, distributed locking before scale-out, private networking, consent, retention, and retrieval evaluation.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/give-your-ai-agent-two-memories-with-azure-app-service/4537400) and grab the [complete sample on GitHub](https://github.com/seligj95/app-service-agent-memory).
