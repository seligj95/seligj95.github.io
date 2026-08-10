import { describe, expect, it, vi } from "vitest";
import {
  createTechCommunityViewFetcher,
  parseTechCommunityViews,
  techCommunityArticleUrl,
} from "../src/tech-community.ts";

const MESSAGE_ID = "4520893";
const ARTICLE =
  "https://techcommunity.microsoft.com/blog/appsonazureblog/example-post/4520893";

function page(views: unknown): string {
  return `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: {
      pageProps: {
        apolloState: {
          [`BlogTopicMessage:message:${MESSAGE_ID}`]: { metrics: { views } },
        },
      },
    },
  })}</script></html>`;
}

describe("Tech Community page parsing", () => {
  it("reads metrics.views from the matching message", () => {
    expect(parseTechCommunityViews(page(165), MESSAGE_ID)).toBe(165);
  });

  it("refuses a missing or malformed count", () => {
    expect(() => parseTechCommunityViews(page("165"), MESSAGE_ID)).toThrow(
      "valid view count"
    );
    expect(() => parseTechCommunityViews("<html></html>", MESSAGE_ID)).toThrow(
      "__NEXT_DATA__"
    );
  });
});

describe("Tech Community URL validation", () => {
  it("accepts the expected article URL", () => {
    expect(techCommunityArticleUrl(ARTICLE, MESSAGE_ID)?.toString()).toBe(ARTICLE);
  });

  it("rejects other hosts and non-blog paths", () => {
    expect(
      techCommunityArticleUrl(
        "https://example.com/blog/appsonazureblog/example-post/4520893",
        MESSAGE_ID
      )
    ).toBeNull();
    expect(
      techCommunityArticleUrl(
        "https://techcommunity.microsoft.com/t5/example/4520893",
        MESSAGE_ID
      )
    ).toBeNull();
  });
});

describe("Tech Community view fetching", () => {
  it("fetches and caches the parsed count", async () => {
    const fetchPage = vi.fn(async () => new Response(page(165)));
    let now = 1_000;
    const fetchViews = createTechCommunityViewFetcher(fetchPage, () => now);
    const url = new URL(ARTICLE);

    await expect(fetchViews(url)).resolves.toBe(165);
    now += 60_000;
    await expect(fetchViews(url)).resolves.toBe(165);

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
