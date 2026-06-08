---
title: "Now in Preview: Built-in MCP for Azure App Service"
description: "Announced at Build 2026: built-in MCP turns a REST API you already host on App Service into a Model Context Protocol server — no MCP code to write, no second service to deploy."
pubDate: 2026-06-08
tags: ["azure", "app-service", "mcp", "ai"]
heroImage: "/images/blog/2026/06/built-in-mcp-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/now-in-preview-built-in-mcp-for-azure-app-service/4526407"
---

At Build 2026, we announced the public preview of built-in MCP for Azure App Service. It does one thing, and it does it with almost no effort on your part: it turns a REST API you already host on App Service into a Model Context Protocol (MCP) server, so AI agents and assistants can call your API as a set of tools. No MCP code to write. No second service to deploy.

You give App Service an OpenAPI 3.x spec, and the platform generates one MCP tool per operation, served over streamable HTTP at a path you choose. It also handles the tedious parts — protocol negotiation, tool discovery, hot reload of the spec, and client cancellation — and integrates with App Service Authentication so MCP requests go through the same identity checks as every other route on your app. Any MCP-compatible client can connect, including GitHub Copilot Chat, Cursor, Windsurf, and Claude Desktop.

The full post covers what built-in MCP does, when to reach for it versus a custom MCP server, how authentication works, and how to enable it from the portal, the Azure CLI, or Bicep.

👉 [Read the full announcement on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/now-in-preview-built-in-mcp-for-azure-app-service/4526407) and head to the [docs](https://learn.microsoft.com/en-us/azure/app-service/configure-mcp-built-in) to enable it on your own app.
