import { describe, expect, it, vi } from "vitest";
import { preloadExternalViews, externalViewEndpoint } from "../src/lib/external-views";

const ARTICLE =
  "https://techcommunity.microsoft.com/blog/appsonazureblog/example-post/4520893";

describe("Tech Community build-time view counts", () => {
  it("does no network work unless preloading is enabled", async () => {
    const fetchPage = vi.fn();

    await expect(
      preloadExternalViews(ARTICLE, { enabled: false, fetchPage })
    ).resolves.toBeUndefined();
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("reads a valid count from the site API", async () => {
    const fetchPage = vi.fn(async () =>
      Response.json({ count: 165 })
    );

    await expect(
      preloadExternalViews(ARTICLE, {
        enabled: true,
        apiBase: "https://api.example",
        fetchPage,
      })
    ).resolves.toBe(165);
    expect(fetchPage).toHaveBeenCalledWith(
      `https://api.example/api/views/tech-community/4520893?url=${encodeURIComponent(ARTICLE)}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("warns and falls back when the API is unavailable", async () => {
    const warn = vi.fn();
    const fetchPage = vi.fn(async () => new Response(null, { status: 502 }));

    await expect(
      preloadExternalViews(
        "https://techcommunity.microsoft.com/blog/appsonazureblog/another-post/9999",
        {
          enabled: true,
          apiBase: "https://api.example",
          fetchPage,
          warn,
        }
      )
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  describe("Builder blog view counts", () => {
    const article = "https://builder.appservice.azure.com/blog/posts/hosting-this-blog-on-builder.html";

    it("preloads the original count through the read-only proxy", async () => {
      const fetchPage = vi.fn(async () => Response.json({ count: 23 }));
      await expect(preloadExternalViews(article, {
        enabled: true,
        apiBase: "https://builder-proxy.example",
        fetchPage,
      })).resolves.toBe(23);
      expect(fetchPage).toHaveBeenCalledWith(
        "https://builder-proxy.example/api/views/builder-blog/hosting-this-blog-on-builder",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it("only selects canonical Builder article URLs", () => {
      expect(externalViewEndpoint(article, "")).toBe("/api/views/builder-blog/hosting-this-blog-on-builder");
      for (const url of [
        article.replace("builder.appservice.azure.com", "example.com"),
        article.replace("/posts/", "/topics/"),
        article.replace("https:", "http:"),
        article.replace(".html", "/"),
      ]) {
        expect(externalViewEndpoint(url, "")).toBeUndefined();
      }
    });

    it.each([-1, 1.5, "23", null])("does not fabricate a count for invalid data %s", async (count) => {
      const warn = vi.fn();
      await expect(preloadExternalViews(article, {
        enabled: true,
        apiBase: `https://invalid-${String(count).replace(".", "-")}.example`,
        fetchPage: async () => Response.json({ count }),
        warn,
      })).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledOnce();
    });
  });
});
