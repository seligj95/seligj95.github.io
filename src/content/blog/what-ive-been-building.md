---
title: "What I've been building: Azure App Service Builder"
description: "It's been quiet here for a reason. For the last eight to ten months I've been working with my team at Microsoft on App Service Builder, a brand-new way to go from code to a running app on Azure."
pubDate: 2026-11-24
featured: true
tags: ["azure", "app-service", "builder", "developer-experience", "ai", "agents"]
---

If you've been by here lately, you've probably noticed it's been a little quiet.

That's not because I ran out of things to say. It's because I've spent the last eight to ten months heads-down with my team at Microsoft building something new, and I finally get to talk about it: [Azure App Service Builder](https://builder.appservice.azure.com/).

## What it is

App Service Builder is a brand-new service, now in public preview. It's a code-first, agent-ready path from a GitHub repository or ZIP package to a running app on Azure.

You point it at your code, describe how the app builds and runs in a `builder.yaml`, and Builder takes care of the build, hosting, and deployment. It handles static sites, HTTP web apps, and APIs, including supported frontend-plus-backend combinations, and gives you a URL to see the result.

Under the hood, it sits on top of Azure Container Apps Sandboxes, with hardware-isolated microVM compute. On top, you can work in whatever way fits you: the portal, the Builder CLI, or a Builder app canvas right next to your coding agent conversation.

## Why I'm excited about it

Writing code has gotten dramatically faster, especially with AI coding agents. But getting that code *running* somewhere has too often felt like a separate infrastructure project you have to stop and go do.

Builder is our attempt to make deploying feel like the next step in the same workflow. Deploy, check, refine, repeat. Build records and version history keep that loop visible so you can see what changed and when.

It's also a new option *within* App Service, not a replacement for anything you already use. Nothing to migrate. If it fits an app you're working on, try it. If it doesn't yet, tell us why.

A couple of honest caveats: the preview is meant for development and test workloads, it doesn't have a financially backed SLA, and custom domains aren't supported yet. We'd rather be upfront about that than have you find out the hard way.

## Prefer to watch?

I sat down with a Microsoft MVP on Power BI Tips' Agentic Thinking show to talk through the whole thing: what Builder is, why we built it, and how you actually use it. If you want a good overview in one sitting, start there: [Azure App Service Builder - 047 Agentic Thinking](https://www.youtube.com/watch?v=2yJvKFF3ems). You can find it alongside my other talks on the [talks page](/talks/).

## Read more

For the full rundown, read my summary of [the launch announcement](/blog/introducing-app-service-builder/), or go straight to the [original on the App Service Builder Blog](https://builder.appservice.azure.com/blog/posts/introducing-app-service-builder.html).

## Please try it, and please tell us what you think

I genuinely love using this thing, and I want you to enjoy it as much as I do. But a service is only as good as the feedback that shapes it, and we're trying to build something you actually *want* to use.

So we're doing this in the open:

- **Feedback and feature requests** go to the [public feedback repository](https://github.com/microsoft/azure-app-service-builder/issues). Open an issue, upvote one, or tell us what's missing for your app.
- **The [roadmap](https://builder.appservice.azure.com/blog/roadmap.html)** is public, so you can see what's coming and hold us to it.
- **The [docs](https://builder.appservice.azure.com/docs/)** are the best place to get started.

## What's next

Expect a lot more from me about Builder here: what we're shipping, how I'm using it, and what we're learning along the way. I've already written about [how the Builder blog itself runs on Builder](/blog/hosting-this-blog-on-builder/) and [how to tell whether Builder is right for your app](/blog/is-builder-right-for-this-app/).

This is just the beginning, and I'm really looking forward to seeing where it goes. Go build something, and let me know how it goes.
