const TECH_COMMUNITY_HOST = "techcommunity.microsoft.com";
const DEFAULT_API_BASE = "https://api.jordanselig.com";
const SHOULD_PRELOAD =
  process.env.PRELOAD_EXTERNAL_VIEWS === "true" ||
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

export function externalViewEndpoint(externalUrl: string | undefined, apiBase: string): string | undefined {
  if (!externalUrl) return undefined;
  const article = new URL(externalUrl);
  if (article.protocol !== "https:" || article.port || article.username || article.password) return undefined;
  if (article.hostname === "builder.appservice.azure.com") {
    const slug = article.pathname.match(/^\/blog\/posts\/([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/)?.[1];
    if (slug && slug.length <= 200) return `${apiBase}/api/views/builder-blog/${slug}`;
  }
  const messageId = article.hostname === TECH_COMMUNITY_HOST
    ? article.pathname.match(/^\/blog\/.+\/(\d+)\/?$/)?.[1]
    : undefined;
  return messageId
    ? `${apiBase}/api/views/tech-community/${messageId}?url=${encodeURIComponent(article.toString())}`
    : undefined;
}

export async function preloadExternalViews(
  externalUrl: string | undefined,
  {
    enabled = SHOULD_PRELOAD,
    apiBase = process.env.PUBLIC_SCORES_API ?? DEFAULT_API_BASE,
    fetchPage = fetch,
    warn = (message, error) => console.warn(message, error),
  }: PreloadOptions = {}
): Promise<number | undefined> {
  if (!enabled || !externalUrl) return undefined;

  const endpoint = externalViewEndpoint(externalUrl, apiBase);
  if (!endpoint) return undefined;
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
      warn(`Could not preload external views for ${externalUrl}.`, error);
      return undefined;
    }
  })();

  pending.set(endpoint, request);
  return request;
}
