import { createCachedViewFetcher } from "./view-counts.ts";

export function createBuilderBlogViewFetcher(
  fetchPage: (input: string | URL, init?: RequestInit) => Promise<Response> = fetch,
  now: () => number = Date.now
): (url: URL) => Promise<number> {
  return createCachedViewFetcher(async (response) => {
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("views" in data)
      || typeof data.views !== "number" || !Number.isSafeInteger(data.views) || data.views < 0) {
      throw new Error("Builder blog returned an invalid view count.");
    }
    return data.views;
  }, (url, init) => fetchPage(url, { ...init, redirect: "error" }), now);
}

export async function builderBlogViewResponse(
  slug: string,
  readViews: (url: URL) => Promise<number>
): Promise<Response> {
  if (slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ error: "Expected a Builder blog article slug." }, { status: 400 });
  }
  const endpoint = new URL(`https://builder.appservice.azure.com/blog/api/views/${slug}`);
  try {
    const count = await readViews(endpoint);
    return Response.json({ count }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("Could not read Builder blog view count.", error);
    return Response.json({ error: "View count is temporarily unavailable." }, { status: 502 });
  }
}
