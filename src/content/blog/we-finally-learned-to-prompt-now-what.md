---
title: "We Finally Learned to Prompt. Now What?"
description: "Boris Cherny's advice to stop overengineering prompts shows how fast AI workflows are shifting—from prompt templates to voice, context, and knowing when to ask."
pubDate: 2026-11-24
tags: ["ai", "agents", "prompt-engineering", "developer-tools", "op-ed"]
draft: false
heroImage: "/images/blog/2026/11/we-finally-learned-to-prompt-now-what/hero.png"
---

Last year, we were trying to write the perfect prompt.

Give the model a role. Add examples. Specify the format. Break the task into steps. Tell it what not to do. Build a tool that turns your ordinary request into a better request. Save the template, because apparently asking a computer for help now required its own little discipline.

Then I came across [a post from Boris Cherny on Threads](https://www.threads.com/@boris_cherny/post/DeKrEiyGgTd).

Cherny, the [creator of Claude Code](https://computerhistory.org/events/in-conversation-with-boris-cherny-creator-of-claude-code/), offered advice that felt almost suspiciously simple:

> Talk to Claude the way you would a coworker. There's no secret to prompting.

He contrasted today's experience with the Sonnet 3.5 era, when the wording of a prompt mattered much more. His emphasis now is on the outcome, the amount of effort to spend, and how the model should check its work.

My first reaction was relief.

My second was: wait, already?

We're still teaching people how to use these tools, and some of the advice already sounds like instructions for a version of the technology that has moved on. That's what caught my attention. Not just that the models have improved, but that the habits we build around them can age so quickly.

If we no longer need to engineer the perfect prompt, what comes next?

Do we stop prompting altogether? Does the thing eventually just know?

## We were learning to compensate

I don't think the early focus on prompt engineering was foolish.

Examples helped. Clear instructions helped. Breaking down a task helped. They still do. When a model struggled to understand what we wanted, learning to describe the task better was a practical response.

But we sometimes blurred two different skills.

One was communicating clearly: supplying relevant information, explaining constraints, defining a useful result.

The other was learning the model's peculiarities: which persona to assign, which incantation to include, how to structure a request so it would follow instructions that should have been straightforward.

The first skill is durable. The second is exposed to every model upgrade.

That distinction changes how I think about all the effort we poured into prompt templates and prompt-improvement tools. Some of it was genuine knowledge about the work. Some of it was a workaround for the interface.

The difficult part was knowing which was which.

It's a little like learning the exact angle to hold a key to open a sticky lock. You really did learn something useful. But once someone replaces the lock, your technique is no longer the valuable part of knowing how to get inside.

Better models should make us less dependent on those techniques. That's progress, even if it makes a recently acquired expertise feel oddly temporary.

## The request is simpler. The responsibility isn't.

I wouldn't read Cherny's post as saying that instructions no longer matter.

He's still asking us to communicate three consequential things. What outcome do we want? How much work is appropriate? What counts as evidence that the result is right?

Those aren't magic words. They're delegation.

Consider a request to improve a checkout page. I could prescribe every component, every spacing decision, and the exact order in which the agent should edit the files. Or I could explain that customers are struggling on mobile, ask for a focused fix rather than a redesign, and require it to check the purchase flow on a narrow screen and with a keyboard.

The second request gives the agent more freedom over the implementation. It also gives it a clearer obligation.

I still need to know what problem matters. I still need to decide whether this deserves a quick pass or a deeper investigation. And I still need to judge whether those checks are sufficient.

Anthropic's own [Claude Code guidance](https://code.claude.com/docs/en/best-practices) puts verification front and center: give the agent a test, a build, or another concrete check it can run. That's a useful corrective to the idea that a capable model makes careful work unnecessary.

It may reduce the effort required to explain *how* to do the work. It doesn't settle *which* work is worth doing, or what risks we should accept.

And this advice isn't a universal verdict on every model or application. A reliable production workflow may still need structured inputs, exact output formats, and explicit boundaries. A person collaborating with a capable coding agent isn't the same problem as a service making thousands of unattended model calls.

The interesting change is that more of the procedure can become the system's job.

## I've started talking instead of typing

One of the most useful changes in my own workflow has been much simpler than a new prompting technique: I've started using a lot more voice-to-text to talk to the Copilot app and my agents.

For me, talking is much faster than typing. But the bigger benefit is how much more of my thinking makes it into the request.

When I type, I catch myself compressing. I want to get the thought down quickly, so I leave out the background, shorten the explanation, or skip the thing I'm not quite sure how to phrase. The agent gets the headline. Some of the context stays in my head.

When I talk, I can just get it out. What I'm trying to accomplish, why it matters, what I've already considered, where I'm uncertain. I can go on a tangent, correct myself, and come back to the point without stopping to turn every thought into a tidy paragraph.

It's a brain dump, not a carefully constructed prompt. And increasingly, that works better.

This isn't about making every request longer. It's about not letting the effort of typing decide which details I bother to share. Sometimes a detail that feels like an aside is exactly what helps the agent understand the work.

I still need to make the goal clear, and a transcript can need a quick cleanup. Speaking doesn't remove the need for judgment or verification. But it's become one of my go-to strategies for better prompting and better workflows: give the agent more of the context I already have, with less effort spent packaging it.

There's something fitting about responding to "talk to it like a coworker" by actually talking. I'm spending less time composing instructions and more time explaining what I'm thinking.

## Will it read our minds?

Not literally. But I can imagine an experience that feels close enough to make the question worth asking.

A system doesn't have to read my thoughts if I've already given it access to the work around me.

The document I'm editing. The failing build. The issue assigned to me. The conversation where we agreed on the next step. My past corrections. A preference I explicitly asked it to remember.

Put enough of that together, with permission, and a short request can carry a lot of meaning. "Fix this" is vague in an empty chat window. Beside a failed test, an open repository, and a clear definition of success, it can be perfectly reasonable.

The prompt hasn't disappeared. Much of what I used to type has moved into the surrounding context.

Beyond speaking instead of typing, the next step could be that I don't have to make an explicit request at all.

A failed build triggers an investigation. A scheduled review produces a draft. An agent notices that something I care about has changed and prepares a response for me to consider.

None of that requires mind reading. It requires an authorized trigger, useful context, and a system capable of connecting them.

I suspect the prompt box will become optional for more routine work. Not because every intention can be inferred, but because repeating an intention we've already established is unnecessary friction.

For a new idea, a sensitive decision, or an ambiguous tradeoff, I'd still expect a conversation. Sometimes the conversation is how I figure out what I want.

## Knowing what I want isn't permission to do it

This is where the exciting version of the future starts to make me uneasy.

An assistant that prepares a reply because it knows how I usually respond is useful. An assistant that sends it because it assumes I would agree is a different proposition.

An agent that notices a failed deployment and gathers evidence is helpful. An agent that changes production because it inferred my urgency needs a much clearer boundary.

This isn't hypothetical anymore. Just the other day, I saw Anthropic's [Claude Ship](https://code.claude.com/docs/en/claude-ship)—a set of agents (Code Review, PR Steward, and Claude Approvals) that can take a pull request through review, fixes, and an approval decision. Combined with GitHub auto-merge or a merge queue and a policy that doesn't require a human sign-off, Claude can effectively carry work across the entire development workflow—from coding all the way through PR approval and merge—without a person stepping in.

I'm hesitant, if I'm honest. I don't know if I'm ready to hand pull request reviews completely over to agents with no human intervention. At the same time, I'm excited to see where something like this takes us. It shows just how quickly the conversation is moving from "how do I phrase this prompt?" to "how much of the workflow am I willing to delegate?"

Accuracy doesn't erase that distinction. Even an excellent guess about my intentions is still a guess about my intentions.

And my intentions can change.

Maybe I usually choose the fastest option, but this time reliability matters more. Maybe I normally approve that kind of message, but today I need to say something different. Maybe the behavior the system has learned is a habit I'm trying to break.

If AI becomes better at anticipating us, the product question can't just be whether it guessed correctly. It has to include whether it should have acted, whether I can see why it acted, and whether I can change the assumptions behind the decision.

I want fewer repetitive instructions. I don't want fewer opportunities to make a consequential choice.

That's the line I'd want these products to respect: use context to reduce repetition, not to quietly expand authority.

## What's worth learning now?

The speed of this shift is the part I keep coming back to.

It's tempting to respond by chasing the next named discipline. We learned prompt engineering; now maybe we should learn context engineering, or agent orchestration, or whatever comes after that.

Some of those skills will be useful. But I'm less interested in finding the next permanent title than in figuring out which parts of the work survive when the technology improves again.

Understanding the problem. Explaining the constraints. Recognizing a bad result. Choosing a meaningful check. Knowing when to ask another question instead of accepting a confident answer.

Those are harder to package into a perfect-prompt generator. They're also the things I'd still want from a human coworker.

Cherny's advice makes me optimistic because it suggests that working with AI can become less like operating a temperamental machine and more like collaborating on a task.

It also makes me cautious, because collaboration depends on more than competence. It depends on understanding who gets to decide.

Maybe we'll eventually look back at the empty prompt box the way we look at a command line: still powerful, still useful, but no longer the place every interaction has to begin.

I'd welcome that.

I don't need AI to read my mind. I need it to help me do the work without making me learn a new ritual every six months.

And when it isn't sure what I mean, or whether it should act, I need it to ask.
