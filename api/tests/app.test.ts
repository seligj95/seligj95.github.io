import { describe, it, expect } from "vitest";
import { createApp, DAY_CAP, PAGE_SIZE } from "../src/app.ts";
import { memoryStore, byScore, type Store } from "../src/store.ts";

const ORIGIN = "https://jordanselig.com";
const DAY = "2026-03-03";

function app(store: Store = memoryStore(), limiter?: (key: string) => boolean) {
  return createApp({ store, origins: [ORIGIN], limiter });
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://api.test/api/daily/queens/${DAY}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function get(path = `/api/daily/queens/${DAY}/scores`) {
  return new Request(`http://api.test${path}`);
}

const ENTRY = { name: "Dave", score: 120, hints: 1 };

describe("health", () => {
  it("answers without any storage behind it", async () => {
    const res = await app().fetch(new Request("http://api.test/api/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("submitting a score", () => {
  it("accepts a plausible one and reports where it placed", async () => {
    const res = await app().fetch(post(ENTRY));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.entry.name).toBe("Dave");
    expect(body.entry.score).toBe(120);
    expect(body.place).toBe(1);
    expect(body.count).toBe(1);
  });

  it("stamps the time itself so a client cannot backdate a row", async () => {
    const res = await app().fetch(post({ ...ENTRY, at: "1999-01-01T00:00:00.000Z" }));
    const body = await res.json();
    expect(body.entry.at.startsWith("1999")).toBe(false);
    expect(Date.parse(body.entry.at)).toBeGreaterThan(Date.now() - 60_000);
  });

  it("ranks the faster time first", async () => {
    const server = app();
    await server.fetch(post({ name: "Slow", score: 300, hints: 0 }));
    const res = await server.fetch(post({ name: "Quick", score: 90, hints: 0 }));

    const body = await res.json();
    expect(body.place).toBe(1);
    expect(body.scores.map((row: { name: string }) => row.name)).toEqual(["Quick", "Slow"]);
  });

  it("lets two people share a name", async () => {
    const server = app();
    await server.fetch(post({ name: "Dave", score: 100, hints: 0 }));
    const res = await server.fetch(post({ name: "Dave", score: 200, hints: 0 }));
    expect(res.status).toBe(201);
    expect((await res.json()).count).toBe(2);
  });

  it("takes a guess count on the board that is ranked by guesses", async () => {
    const server = app();
    const url = `http://api.test/api/daily/contexto/${DAY}/scores`;
    const send = (body: unknown) =>
      server.fetch(
        new Request(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

    await send({ name: "Long", score: 140, hints: 0 });
    // Two guesses would be rejected outright on a board ranked by time.
    const res = await send({ name: "Short", score: 2, hints: 0 });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.place).toBe(1);
    expect(body.scores.map((row: { name: string }) => row.name)).toEqual(["Short", "Long"]);
  });

  it("mirrors the score as seconds for pages built before the rename", async () => {
    const res = await app().fetch(post(ENTRY));
    const body = await res.json();
    expect(body.entry.seconds).toBe(120);
    expect(body.scores[0].seconds).toBe(120);
  });

  it("takes a move count and elapsed time on the board ranked by moves", async () => {
    const server = app();
    const url = `http://api.test/api/daily/chess/${DAY}/scores`;
    const send = (body: unknown) =>
      server.fetch(
        new Request(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

    const res = await send({ name: "Solver", score: 2, hints: 0, elapsed: 30 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.entry.score).toBe(2);
    expect(body.entry.elapsed).toBe(30);
    expect(body.place).toBe(1);
  });

  it("ranks chess by fewest moves, then by the faster elapsed time", async () => {
    const server = app();
    const url = `http://api.test/api/daily/chess/${DAY}/scores`;
    const send = (body: unknown) =>
      server.fetch(
        new Request(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

    await send({ name: "MoreMoves", score: 5, hints: 0, elapsed: 10 });
    await send({ name: "Slower", score: 2, hints: 0, elapsed: 90 });
    const res = await send({ name: "Faster", score: 2, hints: 0, elapsed: 20 });

    const body = await res.json();
    expect(body.scores.map((row: { name: string }) => row.name)).toEqual([
      "Faster",
      "Slower",
      "MoreMoves",
    ]);
  });
});

describe("what it refuses", () => {
  it("turns away a game with no daily board", async () => {
    const res = await app().fetch(
      new Request(`http://api.test/api/daily/chain/${DAY}/scores`, { method: "POST" })
    );
    expect(res.status).toBe(404);
  });

  it("turns away a day that never happened", async () => {
    const res = await app().fetch(get("/api/daily/queens/2026-02-30/scores"));
    expect(res.status).toBe(404);
  });

  it("turns away a day that is not a date at all", async () => {
    const res = await app().fetch(get("/api/daily/queens/yesterday/scores"));
    expect(res.status).toBe(404);
  });

  it("rejects a body that is not JSON", async () => {
    const res = await app().fetch(post("not json at all"));
    expect(res.status).toBe(400);
  });

  it("rejects a time nobody could have posted", async () => {
    const res = await app().fetch(post({ ...ENTRY, score: 1 }));
    expect(res.status).toBe(400);
  });

  it("rejects a clock left running overnight", async () => {
    const res = await app().fetch(post({ ...ENTRY, score: 90_000 }));
    expect(res.status).toBe(400);
  });

  it("rejects a fractional time", async () => {
    const res = await app().fetch(post({ ...ENTRY, score: 90.5 }));
    expect(res.status).toBe(400);
  });

  it("rejects a nameless score", async () => {
    const res = await app().fetch(post({ ...ENTRY, name: "   " }));
    expect(res.status).toBe(400);
  });

  it("stops one address from flooding a day", async () => {
    let left = 2;
    const server = app(memoryStore(), () => left-- > 0);

    expect((await server.fetch(post(ENTRY))).status).toBe(201);
    expect((await server.fetch(post(ENTRY))).status).toBe(201);
    expect((await server.fetch(post(ENTRY))).status).toBe(429);
  });

  it("closes a day once it is full", async () => {
    const store = memoryStore();
    for (let i = 0; i < DAY_CAP; i += 1) {
      await store.add("queens", DAY, { name: "Filler", score: 100, hints: 0, at: "2026-03-03T00:00:00.000Z" });
    }
    const res = await app(store).fetch(post(ENTRY));
    expect(res.status).toBe(409);
  });

  it("rejects a chess submission with no elapsed time", async () => {
    const res = await app().fetch(
      new Request(`http://api.test/api/daily/chess/${DAY}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Dave", score: 2, hints: 0 }),
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("reading a leaderboard", () => {
  it("starts empty", async () => {
    const res = await app().fetch(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ game: "queens", day: DAY, count: 0, scores: [] });
  });

  it("keeps days apart", async () => {
    const store = memoryStore();
    await store.add("queens", DAY, { name: "Today", score: 100, hints: 0, at: "2026-03-03T01:00:00.000Z" });
    await store.add("queens", "2026-03-04", { name: "Tomorrow", score: 50, hints: 0, at: "2026-03-04T01:00:00.000Z" });

    const body = await (await app(store).fetch(get())).json();
    expect(body.scores.map((row: { name: string }) => row.name)).toEqual(["Today"]);
  });

  it("hands back one page but counts the whole day", async () => {
    const store = memoryStore();
    for (let i = 0; i < PAGE_SIZE + 25; i += 1) {
      await store.add("queens", DAY, { name: `P${i}`, score: 100 + i, hints: 0, at: "2026-03-03T00:00:00.000Z" });
    }
    const body = await (await app(store).fetch(get())).json();
    expect(body.count).toBe(PAGE_SIZE + 25);
    expect(body.scores).toHaveLength(PAGE_SIZE);
  });
});

describe("CORS", () => {
  it("lets the site through", async () => {
    const res = await app().fetch(
      new Request(`http://api.test/api/daily/queens/${DAY}/scores`, {
        headers: { Origin: ORIGIN },
      })
    );
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("does not answer for somebody else's site", async () => {
    const res = await app().fetch(
      new Request(`http://api.test/api/daily/queens/${DAY}/scores`, {
        headers: { Origin: "https://not-mine.example" },
      })
    );
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("byScore", () => {
  it("puts the faster time first", () => {
    const rows = [
      { name: "B", score: 200, hints: 0, at: "2026-03-03T00:00:00.000Z" },
      { name: "A", score: 100, hints: 0, at: "2026-03-03T05:00:00.000Z" },
    ];
    expect([...rows].sort(byScore).map((row) => row.name)).toEqual(["A", "B"]);
  });

  it("breaks a tie by who got there first", () => {
    const rows = [
      { name: "Later", score: 100, hints: 0, at: "2026-03-03T09:00:00.000Z" },
      { name: "Earlier", score: 100, hints: 0, at: "2026-03-03T01:00:00.000Z" },
    ];
    expect([...rows].sort(byScore).map((row) => row.name)).toEqual(["Earlier", "Later"]);
  });

  it("breaks a tied move count by the faster elapsed time", () => {
    const rows = [
      { name: "Slower", score: 3, hints: 0, at: "2026-03-03T01:00:00.000Z", elapsed: 90 },
      { name: "Faster", score: 3, hints: 0, at: "2026-03-03T09:00:00.000Z", elapsed: 20 },
    ];
    expect([...rows].sort(byScore).map((row) => row.name)).toEqual(["Faster", "Slower"]);
  });

  it("still falls back to submission order when neither row has an elapsed", () => {
    // Old games never set `elapsed`, so both sides compare equal there and
    // the original tiebreak has to survive untouched.
    const rows = [
      { name: "Later", score: 100, hints: 0, at: "2026-03-03T09:00:00.000Z" },
      { name: "Earlier", score: 100, hints: 0, at: "2026-03-03T01:00:00.000Z" },
    ];
    expect([...rows].sort(byScore).map((row) => row.name)).toEqual(["Earlier", "Later"]);
  });
});
