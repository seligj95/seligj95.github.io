---
title: "Announcing Public Preview: Markdown for Agents in Azure App Service"
description: "Markdown for Agents lets Azure App Service automatically convert HTML responses into cleaner, smaller Markdown for AI agents—without requiring changes to application code."
pubDate: 2026-08-03
tags: ["azure", "app-service", "ai", "agents", "markdown"]
heroImage: "/images/blog/2026/08/markdown-agents-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/announcing-public-preview-markdown-for-agents-in-azure-app-service/4537023"
---

Markdown for Agents is now in public preview for Azure App Service. When a client requests `text/markdown`, App Service can automatically convert the app's HTML response into a cleaner, text-focused format without requiring any changes to the application code.

Removing scripts, styles, and extra HTML markup makes pages easier for AI agents to process while reducing token usage. In internal testing across more than 637,000 pages, converted responses were 97 percent smaller at the median, with a median conversion time of 2 milliseconds.

The preview is available for Windows apps in all public regions on Basic App Service plans and above. The full announcement covers how to enable the feature with the REST API, ARM, or Bicep; request Markdown with the `Accept: text/markdown` header; and verify that a response was converted successfully.

👉 [Read the full announcement on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/announcing-public-preview-markdown-for-agents-in-azure-app-service/4537023).
