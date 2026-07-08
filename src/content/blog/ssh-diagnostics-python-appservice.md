---
title: "Debugging Python apps on App Service with the new SSH helper aliases"
description: "App Service's new SSH helper aliases turn the old playbook of 'open SSH and remember which 14 commands to run' into one-word commands like ai-diagnose, apphelp, and showpkgs. Co-authored with Tulika Chaudharie, this post tours the aliases against a deliberately fragile FastAPI sample that injects six realistic faults — and shows when ai-test being green is itself the diagnosis."
pubDate: 2026-05-19
tags: ["azure", "app-service", "python", "ssh", "diagnostics", "ai"]
heroImage: "/images/blog/2026/05/ssh-diagnostics-python-appservice/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/AppsonAzureBlog/debugging-python-apps-on-app-service-with-the-new-ssh-helper-aliases/4520893"
coAuthors:
  - name: "Tulika Chaudharie"
    url: "https://www.linkedin.com/in/tulika-chaudharie-2586692a/"
---

You shipped a Python app to App Service. It worked in the demo. It works locally. In production, `/chat` is returning 502s — `/health` is green, the deployment succeeded, the logs are quiet, and your laptop can't reproduce it. What you actually need is a shell on the running container so you can poke at DNS, env vars, installed packages, the listening port, and the AI endpoint your app is calling.

The platform has had SSH for a while, but the playbook of "open SSH, then remember which 14 commands to run" was tribal knowledge. App Service just shipped a set of SSH helper aliases — `apphelp`, `appconfig`, `appenv`, `showpkgs`, `appcurl`, `checkport`, plus a full `ai-*` family (`ai-test`, `ai-diagnose`, `ai-dns`, `ai-curl`, `ai-latency`, `ai-access-check`) — that turn that tribal knowledge into one-word commands.

This post is a hands-on tour, co-authored with Tulika Chaudharie (creator of the aliases). We built a deliberately fragile FastAPI sample with six fault modes, deployed it, broke it on purpose, and SSH'd in to watch the aliases walk us to root cause. The interesting twist: for some faults, `ai-diagnose` reproduces the failure end-to-end; for others, `ai-test` stays green while `/chat` is on fire — and that *contrast* is itself the diagnosis, because it tells you the fault isn't in the platform path. Every transcript in the post is real output from the deployed sample.

👉 [Read the full article on Tech Community](https://techcommunity.microsoft.com/blog/AppsonAzureBlog/debugging-python-apps-on-app-service-with-the-new-ssh-helper-aliases/4520893) and grab the [sample repo on GitHub](https://github.com/seligj95/app-service-ssh-diagnostics-python).
