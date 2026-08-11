---
title: "What the New API Management AI Gateway Tier Changes for App Service-Hosted Agents"
description: "App Service remains the application runtime for your agent. The dedicated API Management AI Gateway tier becomes the governed boundary for models and MCP tools—and this runnable sample shows what that changes."
pubDate: 2026-08-11
tags: ["azure", "app-service", "apim", "ai-gateway", "agents", "mcp"]
heroImage: "/images/blog/2026/08/apim-ai-gateway-tier-app-service/hero.png"
externalUrl: "https://techcommunity.microsoft.com/blog/appsonazureblog/what-the-new-api-management-ai-gateway-tier-changes-for-app-service-hosted-agent/4543974"
---

> This article was originally published on [Microsoft Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/what-the-new-api-management-ai-gateway-tier-changes-for-app-service-hosted-agent/4543974).

**App Service remains the application runtime for your agent. The dedicated API Management AI Gateway tier becomes the governed boundary for models and MCP tools—and this runnable sample shows what that changes.**

In May, I published [a runnable sample that put Azure API Management in front of an AI agent on Azure App Service](https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-build-a-framework-agnostic-ai-gateway-on-azure-app-service-%e2%80%94-heres-how/4522004). The agent framework was replaceable; the gateway was the contribution. APIM handled model access, token limits, semantic caching, token metrics, and the MCP traffic contract.

I followed that with [a look at Foundry's new AI Gateway control plane](https://techcommunity.microsoft.com/blog/appsonazureblog/microsoft-foundry-now-has-an-ai-gateway-control-plane-%e2%80%94-what-changes-for-app-ser/4538320). The data path was still APIM, but Foundry gave model and platform owners a first-party way to associate gateways, onboard projects, and allocate capacity.

Now [API Management has a dedicated AI Gateway tier in public preview](https://techcommunity.microsoft.com/blog/integrationsonazureblog/ai-gateway-tier-of-api-management-now-in-public-preview/4540170). That raises a different question for App Service users: does the application runtime change, or does the boundary around models and tools change?

The short answer is that App Service still owns the web application, agent orchestration, streaming experience, deployment lifecycle, scaling, managed identity, and application telemetry. The dedicated tier gives the model-and-tool boundary an AI-focused resource, portal, and runtime experience. To make that distinction concrete, I built a new runnable sample in which a Python agent on App Service can reach both its model and its MCP tools only through the dedicated AI Gateway.

**Get the sample:** [Deploy and explore the complete App Service + AI Gateway sample on GitHub](https://github.com/seligj95/app-service-ai-gateway-tier-python).

> **Preview notice:** The dedicated AI Gateway tier is in public preview. It has no SLA, is currently available only in East US 2 and Sweden Central, and does not yet have an announced pricing or business model. APIs, limits, regions, policy behavior, and portal experiences may change. The sample is designed for learning and validation, not as a production-ready reference architecture.

## The short version: App Service is the runtime; AI Gateway is the governed boundary

The architecture separates application concerns from AI access concerns:

- **App Service** hosts the FastAPI application, browser UI, Microsoft Agent Framework agent, server-sent event stream, retry behavior, and a small read-only MCP server.
- **AI Gateway** exposes the OpenAI-compatible model endpoint and MCP ToolServer endpoint used by the application. It owns the runtime access key, model registration, structured token policy, backend tool credential, and gateway telemetry exporter.
- **Microsoft Foundry / Azure AI Services** supplies the backing model. AI Gateway reaches it with managed identity.
- **Key Vault** stores the gateway runtime key and a separate MCP backend secret. App Service resolves both through managed identity-backed Key Vault references.
- **Application Insights** receives application OpenTelemetry and the preview gateway token-usage export.

![App Service runtime and AI Gateway governed boundary architecture](/images/blog/2026/08/apim-ai-gateway-tier-app-service/architecture.png)

## First, which AI Gateway are we talking about?

| Experience | Primary abstraction | Policy and access model | How it relates to this sample |
| --- | --- | --- | --- |
| AI gateway capabilities in regular API Management tiers | General APIs and products, with AI-aware capabilities added to APIM | Regular APIM subscriptions and policies, including XML policy definitions | Useful for organizations that already operate APIM or need general API management alongside AI traffic. This sample does not use a regular APIM SKU. |
| Foundry-created or associated APIM | A Foundry control-plane workflow that creates or associates an APIM instance | The associated APIM instance remains the gateway resource | This is an existing integration path and is separate from the dedicated tier demonstrated here. |
| Dedicated API Management AI Gateway tier | Models, providers, MCP ToolServers, runtime access keys, and an AI-focused catalog | AI-focused card experiences backed by structured JSON resources and policies | This is what the sample deploys and what every model and MCP request traverses. |

The dedicated tier is not simply a renamed regular APIM instance. Its portal and resource model center on providers, models, ToolServers, runtime keys, telemetry exporters, and AI policies instead of asking an application team to begin with a general-purpose API surface.

![AI Gateway catalog showing a model and an MCP server](/images/blog/2026/08/apim-ai-gateway-tier-app-service/catalog.png)

![AI Gateway token rate limit policy](/images/blog/2026/08/apim-ai-gateway-tier-app-service/token-rate-limit-policy.png)

## What the sample actually does

The sample deploys a Python 3.12 FastAPI application to Linux App Service. The browser presents a small chat interface, but the useful part is behind it:

- Microsoft Agent Framework configured with an `OpenAIChatCompletionClient` whose base URL is the gateway OpenAI v1 route.
- An `MCPStreamableHTTPTool` configured with the gateway ToolServer route and a fixed allow-list of two read-only tools.
- Server-sent event streaming from App Service to the browser.
- A stable gateway model name, `appservice-chat`, initially mapped to a `gpt-5-mini` deployment.
- A separate MCP endpoint on App Service that rejects direct callers unless AI Gateway injects the expected backend secret.
- Bounded handling for 401, 404, 429, and transient 5xx responses.
- Application Insights and OpenTelemetry with correlation IDs and a strict telemetry attribute allow-list.
- Complete azd and Bicep infrastructure using the published preview resource contracts.

### The model path

1. The browser posts a message to `/api/chat/stream` on App Service.
2. FastAPI creates or accepts a correlation ID and returns a server-sent event stream.
3. The Agent Framework client sends an OpenAI-compatible request to `/default/models/openai/v1/` on AI Gateway with the gateway runtime access key.
4. AI Gateway resolves the stable catalog name `appservice-chat`, applies its structured token policy, and calls the backing Foundry deployment with the gateway system-assigned managed identity.
5. Text fragments return through AI Gateway and App Service as `delta` events. The browser renders them as they arrive.
6. Application spans and gateway token usage are correlated in Application Insights without capturing prompts, responses, keys, or backend secrets as custom attributes.

This is the first practical benefit for an App Service user: application code targets one governed OpenAI-compatible boundary. The app does not contain a Foundry endpoint, a Foundry key, or a direct-provider fallback.

### The tool path

The sample deliberately hosts its MCP server on the same App Service application so the complete tool path is visible:

1. For the two documented operational prompts, the application sets Agent Framework `tool_choice` to the matching read-only tool. Other prompts retain automatic tool selection.
2. Agent Framework invokes the `appservice-ops` MCP ToolServer through AI Gateway using the same runtime access key.
3. AI Gateway validates the caller and injects a different `x-appservice-mcp-secret` header only on the backend hop.
4. The ToolServer calls `/mcp` on App Service.
5. App Service compares the backend secret and executes one of two fixed, read-only tools.
6. The tool result travels back through AI Gateway to the agent, which uses it in the streamed answer.

This explicit choice matters in a demonstration. Strong instructions make tool use more likely, but they do not make a model decision deterministic. The application therefore recognizes the exact status and deployment-context prompts shown below and requires the matching function. The backend publishes raw names such as `get_service_status`; the AI Gateway ToolServer advertises them to the client as `appservice-ops_get_service_status` and `appservice-ops_get_deployment_context`. Agent Framework must allow the gateway-advertised names without adding a second prefix.

The two tools are intentionally small:

| Tool | What it returns | Why it is useful in the sample |
| --- | --- | --- |
| `get_service_status` | Non-sensitive service name, health state, and App Service instance identifier | Proves that the model called a live backend tool rather than inventing a generic operational answer. |
| `get_deployment_context` | Non-sensitive App Service site, slot, and region context | Proves that tool results come from the deployed App Service app. |

![App Service AI Gateway sample chat showing live service status](/images/blog/2026/08/apim-ai-gateway-tier-app-service/sample-chat-service-status.png)

## Try it yourself

| Prompt | Expected behavior | What it demonstrates |
| --- | --- | --- |
| "Explain the boundary between App Service and AI Gateway in this sample." | Streams a model-generated answer without requiring an MCP call. | The OpenAI-compatible model route and SSE streaming path are working. |
| "What is the current service status?" | Invokes `get_service_status` and includes the live service, status, and instance fields. | Tool discovery, AI Gateway ToolServer routing, backend authentication, and the App Service MCP endpoint are working. |
| "Which site and deployment slot are you running in?" | Invokes `get_deployment_context` and reports live deployment context. | The response is grounded in the running App Service app rather than model knowledge. |
| "Show the current service status." | Uses the same deterministic status-tool path with alternate documented wording. | The application—not a prompt-engineering trick—controls when the live operational tool is required. |

## Proving the gateway is actually in the path

A successful chat response alone is not sufficient evidence. The sample includes several tests that make the gateway boundary observable.

### 1. Confirm the application has no provider fallback

The application accepts only gateway-shaped model and MCP URLs. Configuration validation rejects other endpoint shapes, and there is no provider endpoint or provider credential setting. If the gateway is unavailable or misconfigured, the application fails visibly rather than silently bypassing policy.

### 2. Test runtime-key enforcement

Call the gateway model route with a deliberately invalid key. The expected result is HTTP 401. The application treats this as a deployment or configuration failure and does not retry it.

### 3. Test model catalog routing

Request an unknown model name through the OpenAI-compatible route. The expected result is HTTP 404. A normal application request uses the stable name `appservice-chat`, showing that the gateway catalog—not a provider-specific name embedded in application source—controls resolution.

### 4. Test the structured token policy

The model registration includes a JSON-backed token-limit policy. In a disposable test environment, temporarily lower the limit, send enough requests to exceed it, and capture HTTP 429. Restore the normal value immediately afterward. During preview validation, the gateway returned 429 without a `Retry-After` header, so the sample honors the header when present and otherwise uses bounded fallback backoff.

### 5. Prove direct MCP access is denied

Call the App Service `/mcp` endpoint without the backend header. The expected response is HTTP 401. Then ask the agent for live service status and confirm the same tool succeeds through the AI Gateway ToolServer. The contrast proves that the gateway is adding backend authentication rather than exposing an anonymous tool endpoint.

### 6. Verify telemetry on both sides of the boundary

Use the correlation ID returned by the chat stream to locate the App Service request and agent span in Application Insights. For a tool prompt, confirm the safe application `mcp_tool_called` trace and the AI Gateway `tools/call` dependency with its `gen_ai.tool.name` attribute. Separately confirm token-usage telemetry for the model request. These views prove different parts of the path: the application executed the backend tool, the gateway mediated the ToolServer call, and the model route emitted usage telemetry.

## Operating the boundary

### Who authenticates to whom

| Connection | Authentication | Why |
| --- | --- | --- |
| App Service to AI Gateway | Gateway runtime access key in the lowercase `api-key` header | This is the current preview runtime-caller authentication model. The sample does not claim managed identity support where it does not exist. |
| AI Gateway to Foundry | AI Gateway system-assigned managed identity with Foundry User | No Foundry key is stored in the application. |
| App Service to Key Vault | App Service managed identity with Key Vault Secrets User | The runtime key and MCP backend secret are resolved through Key Vault references. |
| AI Gateway to the App Service MCP backend | Separate gateway-injected backend header secret | Direct anonymous callers cannot invoke the MCP tools. |

The post-provision hook retrieves the generated gateway runtime key through the documented management action, writes it and a newly generated MCP backend secret to Key Vault without printing them, and completes the ToolServer credential configuration. No runtime key is committed to source control or written to the azd environment.

### Changing the model without rewriting the application

The application always requests `appservice-chat`. Both the Foundry deployment and gateway model registration use that stable client-facing alias, while model name and version remain deployment parameters. This lets the platform team evaluate a backing model update at the gateway and infrastructure layer without changing the FastAPI or Agent Framework source.

### The gateway governs; the application still has to be resilient

- 401 and 404 are not retried.
- 429 and transient 5xx responses use a maximum of three attempts by default, bounded exponential backoff, and jitter.
- `Retry-After` is honored when the gateway supplies it.
- HTTP status and retry metadata are recovered from Agent Framework exception wrappers before classification.
- Retries occur only before the first streamed token.
- A partially emitted stream is never replayed.
- Prompts, model responses, secrets, and upstream response bodies are excluded from application error messages and custom telemetry.

This is another important division of responsibility: the gateway governs access and policy; the application remains responsible for trustworthy interaction behavior.

### What `azd` deploys

| Resource | Purpose |
| --- | --- |
| Linux App Service plan and web app | Hosts FastAPI, Agent Framework, the browser UI, SSE API, and MCP backend. |
| App Service staging slot | Optional manual deployment and swap demonstration. The sample does not automatically swap an empty or stale slot. |
| Dedicated API Management AI Gateway | Provides the governed model and MCP ToolServer boundary. |
| Connector namespace and default workspace | Supports the dedicated AI Gateway workspace and tool experience. |
| Foundry / Azure AI Services account and model deployment | Supplies the initial backing model. |
| Key Vault | Stores the gateway runtime key and MCP backend secret. |
| Virtual network and optional Key Vault private endpoint | Supports App Service outbound integration and stricter secret-access designs. |
| Application Insights and Log Analytics | Collect application telemetry and preview gateway token usage. |
| RBAC assignments | Grant the gateway access to Foundry and App Service identities access to only the required Key Vault secrets. |

## The boundary is the product

This is the through line across all three posts. The first sample showed that the agent framework can change while APIM remains the traffic boundary. The Foundry post showed that the same boundary can gain a model- and project-focused control plane. This sample shows what changes when the gateway itself becomes an AI-focused tier.

App Service still runs the agent. AI Gateway still does not replace application logic, deployment, or resilience. The better-together story is that App Service gives the agent a managed application runtime while AI Gateway gives that runtime a governed, observable, and replaceable boundary for models and tools.

**One final preview boundary:** This sample demonstrates a governed model and tool path, separated identities, model indirection, policy enforcement, and telemetry. It does not establish production readiness, scale limits, final pricing, or live multi-provider routing; the deployment uses one Foundry provider.

### Resources

- [You Can Build a Framework-Agnostic AI Gateway on Azure App Service—Here's How](https://techcommunity.microsoft.com/blog/appsonazureblog/you-can-build-a-framework-agnostic-ai-gateway-on-azure-app-service-%e2%80%94-heres-how/4522004)
- [Microsoft Foundry Now Has an AI Gateway Control Plane—What Changes for App Service](https://techcommunity.microsoft.com/blog/appsonazureblog/microsoft-foundry-now-has-an-ai-gateway-control-plane-%e2%80%94-what-changes-for-app-ser/4538320)
- [AI Gateway tier of API Management now in public preview](https://techcommunity.microsoft.com/blog/integrationsonazureblog/ai-gateway-tier-of-api-management-now-in-public-preview/4540170)
- [Azure API Management AI Gateway overview](https://learn.microsoft.com/azure/api-management/ai-gateway-overview)
- [Quickstart: Create an AI Gateway](https://learn.microsoft.com/azure/api-management/quickstart-ai-gateway-create)
- [Runnable App Service sample](https://github.com/seligj95/app-service-ai-gateway-tier-python)
- [Azure AI Gateway samples catalog](https://github.com/Azure/ai-gateway/tree/main/samples)
