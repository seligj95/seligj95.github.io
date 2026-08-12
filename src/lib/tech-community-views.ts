const TECH_COMMUNITY_HOST = "techcommunity.microsoft.com";
const DEFAULT_API_BASE = "https://api.jordanselig.com";
const SHOULD_PRELOAD =
  process.env.PRELOAD_TECH_COMMUNITY_VIEWS === "true" ||
  (process.env.GITHUB_ACTIONS === "true" && process.env.VITEST !== "true");

type FetchPage = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface PreloadOptions {
  enabled?: boolean;
  apiBase?: string;
  fetchPage?: FetchPage;
  warn?: (message: string, error: unknown) => void;
}

const pending = new Map<string, Promise<number | undefined>>();

export async function preloadTechCommunityViews(
  externalUrl: string | undefined,
  {
    enabled = SHOULD_PRELOAD,
    apiBase = process.env.PUBLIC_SCORES_API ?? DEFAULT_API_BASE,
    fetchPage = fetch,
    warn = (message, error) => console.warn(message, error),
  }: PreloadOptions = {}
): Promise<number | undefined> {
  if (!enabled || !externalUrl) return undefined;

  const article = new URL(externalUrl);
  const messageId =
    article.hostname.toLowerCase() === TECH_COMMUNITY_HOST
      ? article.pathname.match(/\/(\d+)\/?$/)?.[1]
      : undefined;
  if (!messageId) return undefined;

  const endpoint = `${apiBase}/api/views/tech-community/${messageId}?url=${encodeURIComponent(article.toString())}`;
  const existing = pending.get(endpoint);
  if (existing) return existing;

  const request = (async () => {
    try {
      const response = await fetchPage(endpoint, {
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) {
        throw new Error(`View API returned HTTP ${response.status}.`);
      }

      const data = (await response.json()) as { count?: unknown };
      if (
        typeof data.count !== "number" ||
        !Number.isSafeInteger(data.count) ||
        data.count < 0
      ) {
        throw new Error("View API returned an invalid count.");
      }
      return data.count;
    } catch (error) {
      warn(`Could not preload Tech Community views for ${article}.`, error);
      return undefined;
    }
  })();

  pending.set(endpoint, request);
  return request;
}
