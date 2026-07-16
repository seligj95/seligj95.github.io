---
title: "MCP Enterprise Authorization Is Here — What Entra and App Service Can Do Today"
description: "MCP Enterprise-Managed Authorization standardizes how enterprise identity reaches a resource authorization server. See what Entra ID and App Service provide today, what ID-JAG adds, and try both paths in a working Python sample."
pubDate: 2026-07-16
tags: ["azure", "app-service", "mcp", "security", "entra", "python"]
heroImage: "/images/blog/2026/07/mcp-enterprise-authorization-entra-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/mcp-enterprise-authorization-is-here-%E2%80%94-what-entra-and-app-service-can-do-today/4537433"
---

Enterprise-Managed Authorization (EMA) is now a stable MCP extension. It addresses a different kind of scale: connecting hundreds or thousands of employees to MCP servers without making every person authorize every server one at a time. The enterprise identity provider becomes the policy decision point, issuing a short-lived, audience-bound Identity Assertion JWT Authorization Grant (ID-JAG) that the MCP authorization server exchanges for a resource access token.

That sounds a lot like Microsoft Entra preauthorization and App Service Authentication, but there is an important boundary: **a centrally governed OAuth experience is not automatically the EMA protocol**. Entra and App Service can give you a strongly governed MCP endpoint today—with protected resource metadata, platform token validation, known-client preauthorization, Conditional Access, and centralized telemetry. Full EMA additionally requires the enterprise identity provider to issue an ID-JAG through RFC 8693 and the MCP authorization server to exchange it through RFC 7523.

The companion sample implements both paths: a deployable FastAPI MCP server on Linux App Service protected by Entra and App Service Authentication, plus a local interoperability lab that makes the complete ID-JAG exchange visible and testable. The article covers the protocol flow, where today's Azure platform capabilities map to it, what a custom full-EMA deployment would own, and three production details around token audiences, DNS-rebinding protection, and App Service claim mapping.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/mcp-enterprise-authorization-is-here-%E2%80%94-what-entra-and-app-service-can-do-today/4537433) and explore the [companion Python sample on GitHub](https://github.com/seligj95/app-service-ema-mcp).
