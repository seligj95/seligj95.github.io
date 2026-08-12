import { describe, expect, it, vi } from "vitest";
import { preloadTechCommunityViews } from "../src/lib/tech-community-views";

const ARTICLE =
  "https://techcommunity.microsoft.com/blog/appsonazureblog/example-post/4520893";

describe("Tech Community build-time view counts", () => {
  it("does no network work unless preloading is enabled", async () => {
    const fetchPage = vi.fn();

    await expect(
      preloadTechCommunityViews(ARTICLE, { enabled: false, fetchPage })
    ).resolves.toBeUndefined();
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("reads a valid count from the site API", async () => {
    const fetchPage = vi.fn(async () =>
      Response.json({ count: 165 })
    );

    await expect(
      preloadTechCommunityViews(ARTICLE, {
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
      preloadTechCommunityViews(
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
});
