---
title: "MCP Just Went Stateless — What the 2026 Spec Changes About Scaling on App Service"
description: "The MCP 2026-07-28 release candidate deletes the handshake and the session header, so MCP is stateless at the protocol layer. Here's what that changes for horizontally scaling MCP servers on App Service — and why the pattern from Part 1 is now just how MCP works."
pubDate: 2026-06-23
tags: ["azure", "app-service", "mcp", "ai", "python"]
heroImage: "/images/blog/2026/06/mcp-stateless-2026-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/mcp-just-went-stateless-%E2%80%94-what-the-2026-spec-changes-about-scaling-on-app-servic/4530222"
---

A couple of months ago I wrote about [scaling MCP servers behind App Service's built-in load balancer](https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-scale-mcp-servers-behind-a-load-balancer-on-app-service-%E2%80%94-heres-how/4520824). The trick back then was to lean on stateless HTTP transport and turn off ARR affinity so any instance could serve any request. That post still works — but the MCP spec just caught up to it in a big way.

The 2026-07-28 release candidate is the largest revision of the Model Context Protocol since it launched, and the headline change is exactly the thing we were working around: MCP is now stateless at the protocol layer. The `initialize` handshake is gone, the `Mcp-Session-Id` header is gone, and the sticky-routing-and-shared-session-store dance that horizontal deployments used to need is no longer part of the protocol at all. Any MCP request can land on any instance — for real, no shared session store required.

The full post covers what the 2026 spec actually changes (SEP-2575 and SEP-2567), why "stateless protocol" doesn't mean "stateless app," the explicit-handle pattern that replaces protocol sessions, and a migration punch list for an existing MCP server on App Service. It comes with a companion sample: a FastAPI MCP server that speaks 2026-07-28 natively — no handshake, no session — running on three App Service instances behind the built-in load balancer, with a staging slot, App Insights, a spec-compliant client, and a k6 load test.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/mcp-just-went-stateless-%E2%80%94-what-the-2026-spec-changes-about-scaling-on-app-servic/4530222) and grab the [companion sample on GitHub](https://github.com/seligj95/app-service-mcp-stateless-scale-2026-python). Want the 2025-11-25 version for comparison? That's the [original Part 1 sample](https://github.com/seligj95/app-service-mcp-stateless-scale-python).
