import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Entry, Store } from "./store.ts";
import { GAMES, checkSubmission, isDay, rateLimiter } from "./guards.ts";

/** Rows kept per game per day. Past this the day stops accepting writes. */
export const DAY_CAP = 1000;
/** Submissions allowed from one address per hour. */
export const PER_IP_LIMIT = 20;
const HOUR = 60 * 60 * 1000;

/** How many rows a leaderboard hands back. */
export const PAGE_SIZE = 100;

export interface AppOptions {
  store: Store;
  /** Origins allowed to call this. Anything else gets no CORS headers. */
  origins: string[];
  /** Overridable so the tests do not have to sleep for an hour. */
  limiter?: (key: string) => boolean;
}

export function createApp({ store, origins, limiter }: AppOptions) {
  const app = new Hono();
  const take = limiter ?? rateLimiter(PER_IP_LIMIT, HOUR);

  app.use(
    "/api/*",
    cors({
      origin: origins,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
      maxAge: 86400,
    })
  );

  app.get("/api/health", (c) => c.json({ ok: true }));

  /**
   * Both score routes share the same path check, and both 404 rather than 400
   * on a bad game or day: from outside, a route that does not exist and a route
   * that will never exist look the same.
   */
  function target(game: string, day: string): boolean {
    return GAMES.has(game) && isDay(day);
  }

  /**
   * Rows go out with `seconds` mirroring `score`, so a site build made before
   * the rename keeps working. The two deploy from the same push but not in the
   * same instant.
   */
  function wire(rows: Entry[]) {
    return rows.map((row) => ({ ...row, seconds: row.score }));
  }

  app.get("/api/daily/:game/:day/scores", async (c) => {
    const { game, day } = c.req.param();
    if (!target(game, day)) return c.json({ error: "No such board." }, 404);

    const rows = await store.list(game, day);
    return c.json({
      game,
      day,
      count: rows.length,
      scores: wire(rows.slice(0, PAGE_SIZE)),
    });
  });

  app.post("/api/daily/:game/:day/scores", async (c) => {
    const { game, day } = c.req.param();
    if (!target(game, day)) return c.json({ error: "No such board." }, 404);

    const from =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-client-ip") ||
      "unknown";
    if (!take(from)) {
      return c.json({ error: "That is a lot of scores. Try again later." }, 429);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Expected a JSON object." }, 400);
    }

    const checked = checkSubmission(body, GAMES.get(game));
    if (!checked.ok) return c.json({ error: checked.error }, 400);

    if ((await store.count(game, day)) >= DAY_CAP) {
      return c.json({ error: "Today's board is full." }, 409);
    }

    const entry = { ...checked.value, at: new Date().toISOString() };
    await store.add(game, day, entry);

    // Handing back the placing saves the page a second round trip.
    const rows = await store.list(game, day);
    const place = rows.findIndex((row) => row.at === entry.at && row.name === entry.name) + 1;

    return c.json(
      {
        entry: { ...entry, seconds: entry.score },
        place,
        count: rows.length,
        scores: wire(rows.slice(0, PAGE_SIZE)),
      },
      201
    );
  });

  app.notFound((c) => c.json({ error: "Not found." }, 404));

  return app;
}
