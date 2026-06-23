---
title: "Only 8.5% of MCP servers use OAuth — here's how to host one securely on App Service"
description: "Most MCP servers ship with no authentication, and the CVEs are already piling up. This post walks through a hardened reference architecture on Azure App Service — Easy Auth with spec-compliant MCP authorization, managed identity, Key Vault, private endpoints, and APIM — that closes the 'exposed MCP endpoint' problem. One azd up deploys the lot."
pubDate: 2026-06-23
tags: ["azure", "app-service", "mcp", "security", "ai", "python"]
heroImage: "/images/blog/2026/06/secure-mcp-oauth-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/only-8-5-of-mcp-servers-use-oauth-%E2%80%94-heres-how-to-host-one-securely-on-app-servic/4530349"
---

The Model Context Protocol took off because it's *easy* — stand up a server, expose a few tools, point Claude or VS Code at it, and your agent can read files, hit APIs, and run code. That ease is also the problem. Astrix Research's [State of MCP Server Security 2025](https://astrix.security/) found only **8.5%** of MCP servers use OAuth; the rest lean on static keys or nothing at all. And the CVEs have already started landing — a CVSS 9.6 command-injection flaw in `mcp-remote`, an unauthenticated RCE in the MCP Inspector dev tool. The spec is explicit that authorization is optional, which means *you* own the perimeter. Skip it and you've published an unauthenticated RPC endpoint that can read secrets and run tools.

So let's not skip it. This post walks through a hardened MCP server on Azure App Service that closes those gaps — and most of it is platform configuration, not security code you have to write and get right yourself. One `azd up` (plus an Entra app registration the hook creates for you) gives you an MCP server behind App Service Authentication with spec-compliant MCP authorization, talking to Key Vault over a managed identity, with no public network access, fronted by API Management, and an Application Insights alert watching for abuse.

The full article covers the threat model for a hosted MCP server, then the five defenses layered to answer it: **Easy Auth plus the new built-in MCP authorization (Protected Resource Metadata)** so unauthenticated calls get a discoverable OAuth challenge instead of a bare 401; **managed identity** so no secret ever lives in app code — and why you must never pass the MCP-server token downstream; **Key Vault** references for any remaining config secrets; **private endpoints and VNet integration** to take the data plane off the public internet; and **API Management** out front for rate limiting and a throttle on abuse. It closes with the one caution that trips everyone up — adding your real MCP client to the app registration's allowed-applications and preauthorizing it.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/only-8-5-of-mcp-servers-use-oauth-%E2%80%94-heres-how-to-host-one-securely-on-app-servic/4530349) and grab the [sample repo on GitHub](https://github.com/seligj95/app-service-secure-mcp).
