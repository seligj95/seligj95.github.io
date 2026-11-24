---
title: "How this blog runs on App Service Builder"
description: "Behind the App Service Builder Blog: Astro static pages, a Node API, external PostgreSQL, managed identity, and a separate Front Door route."
pubDate: 2026-11-18
tags: ["azure", "app-service", "builder", "astro", "nodejs", "postgresql", "managed-identity"]
heroImage: "/images/blog/2026/11/hosting-this-blog-on-builder/hero.svg"
externalUrl: "https://builder.appservice.azure.com/blog/posts/hosting-this-blog-on-builder.html"
---

The App Service Builder Blog is itself a Builder app. We chose to dogfood our own product: publishing articles, deploying changes, and connecting real dependencies give us a practical way to exercise the experience and learn what needs to improve.

The architecture keeps reading off the database path. Astro builds the article pages, archives, search data, and assets into static output. A small Node API handles changing data such as article views and feature-request votes, with PostgreSQL managed separately. Builder hosts the frontend and API; optional dynamic features can fail without taking the article text with them. Comments use Giscus rather than the database.

A `builder.yaml` describes the static site and HTTP API as two components of one app. Builder's named PostgreSQL connection supplies server-runtime settings, and the API uses managed identity for passwordless database authentication. The external database still needs identity mapping, table permissions, reachable networking, and verified TLS: saving a connection is not the same as proving a query works.

The public `builder.appservice.azure.com/blog/` address comes from a separately configured Azure Front Door route, not built-in Builder custom-domain support. The site also generates prefix-aware navigation, asset, and API URLs. Static output, API health, database operations, and publication boundaries each need their own checks.

The full article includes the real Builder portal architecture view and a more detailed diagram, plus the manifest and operational boundaries. We'll keep evolving the blog with relevant Builder features as they arrive. This is a concrete dogfooding example, not an exception to the preview's development/test guidance or lack of a financially backed SLA.

[Read the full architecture walkthrough on the App Service Builder Blog](https://builder.appservice.azure.com/blog/posts/hosting-this-blog-on-builder.html) and browse the [blog's source on GitHub](https://github.com/embr-devs/app-service-builder-blog).
