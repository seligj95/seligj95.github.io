type FetchPage = (input: string | URL, init?: RequestInit) => Promise<Response>;

export function createCachedViewFetcher(
  parse: (response: Response, url: URL) => Promise<number>,
  fetchPage: FetchPage = fetch,
  now: () => number = Date.now
): (url: URL) => Promise<number> {
  const cache = new Map<string, { count: number; expiresAt: number }>();
  const pending = new Map<string, Promise<number>>();

  return async (url) => {
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
      if (!response.ok) throw new Error(`View source returned HTTP ${response.status}.`);
      const count = await parse(response, url);
      cache.set(key, { count, expiresAt: now() + 5 * 60 * 1000 });
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
