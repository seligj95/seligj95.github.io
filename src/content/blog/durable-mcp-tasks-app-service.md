---
title: "Build Durable, Long-Running MCP Tasks on Azure App Service"
description: "Build reconnect-safe, retryable MCP Tasks on Azure App Service with .NET, Azure Table Storage for durable task state, and Azure Service Bus for durable work dispatch."
pubDate: 2026-08-07
tags: ["azure", "app-service", "mcp", "mcp-tasks", "dotnet", "table-storage", "service-bus"]
heroImage: "/images/blog/2026/08/durable-mcp-tasks-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/build-durable-long-running-mcp-tasks-on-azure-app-service/4545170"
---

MCP Tasks let a server return a durable handle instead of holding one fragile HTTP request open for long-running work. Clients can disconnect, reconnect with the same task ID, poll progress, provide input, cancel the operation, and retrieve the final result.

The protocol handle is only half of durability. This .NET sample stores task status, progress, input, results, errors, and TTL in Azure Table Storage, while Azure Service Bus preserves the work that still needs to run. A worker on each App Service instance processes queued work and updates shared state, so retries, approvals, cancellation, and duplicate delivery continue to work across instance recycling and scale-in.

The full article walks through the MCP Tasks lifecycle, cross-instance approval flow, terminal-state and ETag guards, managed identity and RBAC, and when App Service, Durable Functions, or Azure Container Apps Jobs is the better execution model.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/build-durable-long-running-mcp-tasks-on-azure-app-service/4545170) and explore the [companion .NET sample on GitHub](https://github.com/seligj95/app-service-mcp-tasks-dotnet).
