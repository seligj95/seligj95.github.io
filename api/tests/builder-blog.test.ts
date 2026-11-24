import { describe, expect, it, vi } from "vitest";
import { createBuilderBlogViewFetcher } from "../src/builder-blog.ts";
import { createApp } from "../src/app.ts";
import { memoryStore } from "../src/store.ts";

const SLUG = "hosting-this-blog-on-builder";
const ENDPOINT = `https://builder.appservice.azure.com/blog/api/views/${SLUG}`;

describe("Builder blog views", () => {
  it("proxies the original count with CORS and no write request", async () => {
    const fetchPage = vi.fn(async (_input: string | URL, _init?: RequestInit) => Response.json({ views: 23 }));
    const server = createApp({
      store: memoryStore(),
      origins: ["https://jordanselig.com"],
      builderBlogViews: createBuilderBlogViewFetcher(fetchPage),
    });
    const response = await server.fetch(new Request(
      `https://api.test/api/views/builder-blog/${SLUG}`,
      { headers: { Origin: "https://jordanselig.com" } }
    ));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 23 });
    expect(response.headers.get("access-control-allow-origin")).toBe("https://jordanselig.com");
    expect(response.headers.get("cache-control")).toContain("max-age=300");
    expect(fetchPage).toHaveBeenCalledWith(new URL(ENDPOINT), expect.objectContaining({
      redirect: "error",
      signal: expect.any(AbortSignal),
    }));
    expect(fetchPage.mock.calls[0]?.[1]).not.toHaveProperty("method", "POST");
  });

  it("rejects invalid slugs before contacting the upstream", async () => {
    const readViews = vi.fn();
    const server = createApp({ store: memoryStore(), origins: [], builderBlogViews: readViews });
    const response = await server.fetch(new Request("https://api.test/api/views/builder-blog/invalid_slug"));
    expect(response.status).toBe(400);
    expect(readViews).not.toHaveBeenCalled();
  });

  it("coalesces reads and refreshes the cache after five minutes", async () => {
    let now = 0;
    const fetchPage = vi.fn(async () => Response.json({ views: 23 }));
    const readViews = createBuilderBlogViewFetcher(fetchPage, () => now);
    const url = new URL(ENDPOINT);
    expect(await Promise.all([readViews(url), readViews(url)])).toEqual([23, 23]);
    now = 299_999;
    expect(await readViews(url)).toBe(23);
    expect(fetchPage).toHaveBeenCalledOnce();
    now = 300_000;
    await readViews(url);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it.each([-1, 1.5, "23", null, Number.MAX_SAFE_INTEGER + 1])(
    "surfaces invalid upstream count %s rather than returning a false zero",
    async (views) => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        const server = createApp({
          store: memoryStore(),
          origins: [],
          builderBlogViews: createBuilderBlogViewFetcher(async () => Response.json({ views })),
        });
        const response = await server.fetch(new Request(`https://api.test/api/views/builder-blog/${SLUG}`));
        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ error: "View count is temporarily unavailable." });
        expect(error).toHaveBeenCalledOnce();
      } finally {
        error.mockRestore();
      }
    }
  );

  it("retries after an upstream failure instead of caching the error", async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ views: 0 }));
    const readViews = createBuilderBlogViewFetcher(fetchPage);
    await expect(readViews(new URL(ENDPOINT))).rejects.toThrow("HTTP 503");
    await expect(readViews(new URL(ENDPOINT))).resolves.toBe(0);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
