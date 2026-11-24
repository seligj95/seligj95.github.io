---
title: "Introducing Azure App Service Builder: From code to a running app"
description: "App Service Builder is now in public preview: a code-first, agent-ready path from a GitHub repository or ZIP package to a running Azure app."
pubDate: 2026-11-17
featured: true
tags: ["azure", "app-service", "builder", "developer-experience", "ai", "agents"]
heroImage: "/images/blog/2026/11/introducing-app-service-builder/hero.svg"
externalUrl: "https://builder.appservice.azure.com/blog/posts/introducing-app-service-builder.html"
---

Writing an app is getting faster, especially alongside an AI coding agent. Getting that code into a running environment should feel like the next step in the same workflow, not a separate infrastructure project.

Azure App Service Builder is now in public preview. It brings builds, hosting, and deployment management into an application-focused experience for static sites, HTTP web apps, and APIs, including supported frontend-plus-backend combinations. Connect a GitHub repository or deploy a ZIP package, describe how the app builds and runs in `builder.yaml`, and inspect the result at its service-provided URL.

Builder adds the application layer on top of Azure Container Apps Sandboxes, with hardware-isolated microVM compute underneath. You can work through the portal, Builder CLI, or a Builder app canvas alongside your coding conversation. Build records and retained version history help make the deploy-check-refine loop visible.

This is a new option within App Service, not a replacement for existing App Service experiences or a requirement to migrate. The preview is intended for development and test workloads, has no financially backed SLA, and is not recommended for production. Databases and other services remain separately managed dependencies; custom domains are not supported in the initial preview.

The full announcement covers the platform foundation, deployment workflow, agent integrations, and what to expect as Builder evolves.

[Read the full announcement on the App Service Builder Blog](https://builder.appservice.azure.com/blog/posts/introducing-app-service-builder.html) and explore the [Builder documentation](https://builder.appservice.azure.com/docs/).
