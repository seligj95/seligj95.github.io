---
title: "The Cloud's Most Underrated Feature: Someone Else to Blame"
description: "An App Service PM on the quiet superpower of the cloud — the closer you get to PaaS, the more of your infrastructure (and your outages) become someone else's problem. A love letter to the shared responsibility model, and a nudge toward App Service Managed Instance."
pubDate: 2026-07-08
tags: ["op-ed", "azure", "cloud", "app-service", "paas", "product-management"]
heroImage: "/images/blog/2026/07/blame-the-cloud-shared-responsibility/hero.png"
coAuthors:
  - name: "Jarod Aerts"
    url: "https://www.linkedin.com/in/jarodaerts/"
---

Anyone who's been in tech for a while — anyone who's ever pulled a servicing shift or carried a pager — knows this story. It's 2am, something is alerting, and a room full of very tired people are staring at a dashboard trying to answer one question. Not *"how do we fix it"* — that comes later. The first question is always **"whose fault is this?"**

For a long time, in a lot of shops, the honest answer was *ours*. All of it. The app, the runtime it ran on, the OS under that, the box under that, the power and cooling and network under *that*. When something broke, there was no one to call, because the buck stopped at a rack the team owned in a room the company was paying for. Every layer of the stack was a layer someone on that call could get blamed for.

Quick introduction before we go further, because there are two of us writing this. We both work on Azure App Service, from opposite sides of the same fence: one of us is a developer on the platform, the other is a product manager on the product. We spend our days thinking about exactly this question — who owns which layer, and what it takes to hand a layer off — which is probably why the topic won't leave us alone.

The single most underrated benefit of the cloud is that this list gets *shorter*. And the closer you move toward Platform as a Service, the shorter it gets — until "whose fault is this?" has a genuinely comforting answer more often than not: **not mine.**

## The slider nobody frames as a feature

The shared responsibility model isn't a Microsoft invention — it's an industry-wide concept that every major cloud provider frames some version of. [Microsoft's write-up](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility) is a good one to read, but the one-sentence version is universal: **in the cloud, responsibility for the stack is split between you and the provider, and where the line sits depends on the service model you choose.**

Picture a slider.

- **On-premises**: you own everything. Physical security, hardware, networking, OS patching, the runtime, the app, the data, the identity. All of it, all yours.
- **IaaS** (a virtual machine): the provider takes the physical layers — the datacenter, the hardware, the host. You still own the OS, the patching, the runtime, the app.
- **PaaS** (something like App Service): the provider takes the OS, the underlying compute, the scaling, the availability of the platform itself. You bring your app and your config, and mostly stop thinking about the floor you're standing on.
- **SaaS**: you're basically down to your data, your accounts, and how you use the thing.

Most people read that slider as a story about *convenience* — how much work you have to do. That's true, but it undersells it. It's also a story about **liability**. Every notch you slide toward PaaS is a layer of the stack you are no longer the one holding the pager for.

## Offloading isn't laziness — it's leverage

Here's the reframe we wish someone had handed us earlier.

When you move a workload to PaaS, you're not just saving yourself the chore of patching an OS. You're handing that entire responsibility to a team whose full-time, around-the-clock, this-is-literally-their-product job is to keep that layer healthy. The people running the App Service platform think about host patching, fleet health, and platform availability with a focus and a scale that any one team, running its own one app, could never match. That's not you being lazy. That's you being outmatched, gratefully.

So yes — half-jokingly — the more PaaS you adopt, the more you can *blame the cloud provider* when something at that layer goes wrong. But the serious version of that joke is the actual point: **you've moved a class of failures off your plate and onto the plate of the people best equipped to handle them.** When the platform hiccups, it's their incident, their root-cause, their fix, their fleet-wide rollout. You get to spend that 2am staring at *your* app instead of the box it runs on.

That's leverage. You're trading a wide, shallow surface of things you're kind-of responsible for and not-really-expert at, for a narrow, deep surface of things you *are* the expert on: your product.

## The honest caveat: know your side of the line

Now, the fine print, because "blame the cloud provider" only works if you actually understand where the line is.

The shared responsibility model is *shared*, not *transferred*. Even in the most managed PaaS or SaaS world, some things never leave your side of the fence:

- **Your data.** Its correctness, its classification, its backups-that-you-actually-tested.
- **Your identity and access.** Who can get in, with what permissions. A leaked credential is not the platform's fault.
- **Your app and its configuration.** The bug you shipped is still your bug. The misconfigured setting is still your setting.

The failure mode we've watched teams stumble into isn't *"the cloud didn't do enough."* It's *"we assumed the cloud was doing something it was never responsible for."* The value of the model is real, but you only get to collect it if you know exactly what you kept. Read the doc. Know your boundary. Then, everything on the other side of that line — genuinely, go ahead and let it be someone else's problem.

## The App Service version of this

This is the part where the two of us — the dev and the PM — tell you the thing we actually believe: a lot of people who would benefit most from this trade haven't made it yet.

And we get why. If you're still running an app on-prem or on a VM you babysit, the reasons are usually some mix of *"the migration looks complicated"* and *"modernization sounds like a rewrite I don't have time for."* Those fears are legitimate. They're also, increasingly, out of date.

The whole promise of PaaS is that you slide up that responsibility scale and hand the boring, heavy, thankless layers to a platform team — and you shouldn't have to blow up your app to do it.

## Managed Instance: a low-friction on-ramp

This is exactly the gap [**App Service Managed Instance**](https://learn.microsoft.com/en-us/azure/app-service/quickstart-managed-instance?tabs=portal) is built to close.

It's designed for the app that hasn't moved yet — the one carrying dependencies you'd rather not touch, running somewhere it's hard to change. Managed Instance gives you a path onto the App Service platform with far less rewriting than "just modernize it" usually implies, so you can actually *try* the PaaS trade instead of theorizing about it. You get to feel what it's like to hand the OS, the patching, and the platform availability to us — and keep your focus on your app.

And here's the part that matters most for anyone stuck on that first barrier: it doesn't just soften the *modernization* fear, it collapses the *migration* itself. Remember those two objections — "the migration looks complicated" and "modernization sounds like a rewrite." Managed Instance is aimed squarely at both. Bringing an existing app onto the platform is dramatically less work than a traditional lift-and-modernize, because you're moving the app much closer to as-is and letting the managed platform absorb the environment underneath it. The migration stops being the scary multi-quarter project and starts being a step you can actually schedule.

If you've been cloud-curious but stuck at the starting line, this is a genuinely gentle place to start. Move one app. See how much of the pager stops being yours. Decide for yourself whether the "someone else to blame" feeling is worth it. (Spoiler: at 2am, it very much is.)

One scheduling note: **Managed Instance is in preview today, and GA is planned for the coming months.** If you're one of the people who's been waiting for the "generally available" stamp before you'll touch it — fair enough, that's a reasonable line to hold — then consider this your heads-up to get ready. It's coming.

## So, next time the pager goes off

Look at the slider before you look at the logs.

If you're still holding the whole stack, some of that weight was never yours to carry well — and the cloud has spent a decade building teams whose entire job is to carry it better than you can. Sliding toward PaaS isn't giving up control. It's giving up the *parts of control you were never going to be great at*, so you can be great at the part that's actually your product.

The cloud's flashiest features get all the blog posts. But the one we'd defend hardest is the quiet one: a shorter list of things that are your fault. Understand your side of the line, hand the rest to people who do it for a living, and go get some sleep.

Someone else has the pager for that layer now. That's the whole point.
