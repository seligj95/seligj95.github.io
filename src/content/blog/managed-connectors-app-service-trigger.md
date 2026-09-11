---
title: "Azure App Service is now a trigger destination for Azure Managed Connectors"
description: "Azure Managed Connectors now delivers trigger events directly to App Service apps, with managed-identity authentication and an end-to-end Outlook-to-Teams email-triage sample."
pubDate: 2026-09-11
tags: ["azure", "app-service", "managed-connectors", "dotnet", "managed-identity"]
featured: false
heroImage: "/images/blog/2026/09/managed-connectors-app-service-trigger/hero.jpg"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/azure-app-service-is-now-a-trigger-destination-for-azure-managed-connectors/4555785"
---

Azure App Service is now a first-class trigger destination in Azure Managed Connectors. Instead of choosing a generic HTTP endpoint and assembling a callback URL, you can select your web app, callback route, Connector Namespace managed identity, and Microsoft Entra audience directly in the Managed Connectors portal. This is a new capability in the existing Managed Connectors public preview, not a separate App Service preview.

The end-to-end ASP.NET Core sample turns incoming Outlook email into an authenticated workflow on App Service: classify the message, enrich the sender through Office 365 Users, post a Teams triage card for important mail, and flag the source email. The repository includes the application, Bicep infrastructure, and an Azure Developer CLI deployment flow.

The full article walks through trigger setup, managed-identity callbacks, and receiving-app authentication with App Service built-in authentication. The trigger wizard configures the connector side; the receiving app still needs its own audience and allowed-principal configuration. It also covers current limitations and the work ahead to simplify connector-scoped trust.

[Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/azure-app-service-is-now-a-trigger-destination-for-azure-managed-connectors/4555785) and explore the [email-triage sample on GitHub](https://github.com/Azure-Samples/app-service-connectors-net-e2e-email-users-teams).
