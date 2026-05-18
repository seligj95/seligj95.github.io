---
title: "You Can Scale MCP Servers Behind a Load Balancer on App Service — Here's How"
description: "Most MCP servers ship as single instances. With the stateless HTTP transport in MCP 2025-11-25, you can put one behind App Service's load balancer and scale it like any other web API — no sticky sessions required."
pubDate: 2026-05-18
tags: ["azure", "app-service", "mcp", "ai", "python"]
heroImage: "/images/blog/2026/05/scale-mcp-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-scale-mcp-servers-behind-a-load-balancer-on-app-service-%E2%80%94-heres-how/4520824"
---

Most MCP servers in the wild are single-instance processes. That's fine for a local Claude or VS Code session, but it's the wrong shape for a production agent fleet that has to absorb traffic spikes, ride through deploys, and survive instance failures. The MCP spec already grew up: the 2025-06-18 revision formalized stateless HTTP transport, and the current 2025-11-25 revision keeps it. That tiny protocol change is what lets you put an MCP server behind App Service's built-in load balancer and scale it like any other web API.

This post walks through a runnable sample — a stateless FastAPI MCP server deployed on three App Service instances with `clientAffinityEnabled: false`, a staging slot for zero-downtime swaps, Application Insights auto-instrumentation, and a k6 load test that tallies hits per instance so you can see the load balancer round-robining requests from the client side.

The full article covers why stateless is the whole story, why App Service beats Functions and AKS for this workload, the one Bicep line that actually makes scaling work, the Application Insights KQL one-liner to prove distribution, and the slot swap that gives you blue-green deploys for free.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-scale-mcp-servers-behind-a-load-balancer-on-app-service-%E2%80%94-heres-how/4520824) and grab the [sample repo on GitHub](https://github.com/seligj95/app-service-mcp-stateless-scale-python).
