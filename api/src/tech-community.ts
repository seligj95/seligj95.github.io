const TECH_COMMUNITY_HOST = "techcommunity.microsoft.com";
const CACHE_TTL_MS = 5 * 60 * 1000;

type JsonObject = Record<string, unknown>;
type FetchPage = (input: string | URL, init?: RequestInit) => Promise<Response>;
export type TechCommunityViewFetcher = (url: URL) => Promise<number>;

function object(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null ? (value as JsonObject) : null;
}

export function techCommunityArticleUrl(raw: string, messageId: string): URL | null {
  if (!/^\d+$/.test(messageId)) return null;

  try {
    const url = new URL(raw);
    const path = url.pathname.replace(/\/$/, "");
    if (
      url.protocol !== "https:" ||
      url.hostname !== TECH_COMMUNITY_HOST ||
      url.port ||
      url.username ||
      url.password ||
      !path.startsWith("/blog/") ||
      !path.endsWith(`/${messageId}`)
    ) {
      return null;
    }
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export function parseTechCommunityViews(html: string, messageId: string): number {
  const nextData = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/
  )?.[1];
  if (!nextData) throw new Error("Tech Community page did not include __NEXT_DATA__.");

  const state = object(JSON.parse(nextData));
  const props = object(state?.props);
  const pageProps = object(props?.pageProps);
  const apolloState = object(pageProps?.apolloState);
  const message = object(apolloState?.[`BlogTopicMessage:message:${messageId}`]);
  const metrics = object(message?.metrics);
  const views = metrics?.views;

  if (typeof views !== "number" || !Number.isSafeInteger(views) || views < 0) {
    throw new Error("Tech Community page did not include a valid view count.");
  }
  return views;
}

export function createTechCommunityViewFetcher(
  fetchPage: FetchPage = fetch,
  now: () => number = Date.now
): TechCommunityViewFetcher {
  const cache = new Map<string, { count: number; expiresAt: number }>();
  const pending = new Map<string, Promise<number>>();

  return async (url: URL): Promise<number> => {
    const messageId = url.pathname.match(/\/(\d+)\/?$/)?.[1];
    if (!messageId) throw new Error("Tech Community URL did not include a message ID.");

    const key = url.toString();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.count;

    const existing = pending.get(key);
    if (existing) return existing;

    const request = (async () => {
      const response = await fetchPage(url, {
        headers: { "User-Agent": "jordanselig.com view-count proxy" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(`Tech Community returned HTTP ${response.status}.`);
      }

      const count = parseTechCommunityViews(await response.text(), messageId);
      cache.set(key, { count, expiresAt: now() + CACHE_TTL_MS });
      return count;
    })();

    pending.set(key, request);
    try {
      return await request;
    } finally {
      pending.delete(key);
    }
  };
}

export async function techCommunityViewResponse(
  rawUrl: string,
  messageId: string,
  readViews: TechCommunityViewFetcher
): Promise<Response> {
  const article = techCommunityArticleUrl(rawUrl, messageId);
  if (!article) {
    return Response.json(
      { error: "Expected a Tech Community blog URL." },
      { status: 400 }
    );
  }

  try {
    const count = await readViews(article);
    return Response.json(
      { count },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Could not read Tech Community view count.", error);
    return Response.json(
      { error: "View count is temporarily unavailable." },
      { status: 502 }
    );
  }
}
