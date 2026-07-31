import { describe, it, expect } from "vitest";
import {
  NAME_MAX,
  checkSubmission,
  cleanName,
  isBlockedName,
  isDay,
  rateLimiter,
} from "../src/guards.ts";

describe("isDay", () => {
  it("takes a real date", () => {
    expect(isDay("2026-03-03")).toBe(true);
  });

  it("refuses a date that never happened", () => {
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("2026-13-01")).toBe(false);
  });

  it("refuses anything that is not YYYY-MM-DD", () => {
    for (const value of ["2026-3-3", "20260303", "today", "", "2026-03-03T00:00:00Z"]) {
      expect(isDay(value), value).toBe(false);
    }
  });

  it("takes a leap day in a leap year and refuses it otherwise", () => {
    expect(isDay("2028-02-29")).toBe(true);
    expect(isDay("2027-02-29")).toBe(false);
  });
});

describe("cleanName", () => {
  it("trims and flattens the whitespace", () => {
    expect(cleanName("  Dave   the   Second ")).toBe("Dave the Second");
  });

  it("strips control characters rather than storing them", () => {
    expect(cleanName("Da\u0000ve\n")).toBe("Da ve");
  });

  it("caps the length", () => {
    const long = cleanName("x".repeat(80));
    expect(long).toHaveLength(NAME_MAX);
  });

  it("refuses an empty name", () => {
    expect(cleanName("")).toBeNull();
    expect(cleanName("   ")).toBeNull();
    expect(cleanName(42)).toBeNull();
    expect(cleanName(undefined)).toBeNull();
  });

  it("keeps names that merely contain a blocked word", () => {
    // The classic Scunthorpe problem: the filter matches whole names only.
    expect(cleanName("Scunthorpe")).toBe("Scunthorpe");
    expect(cleanName("Shitake Fan")).toBe("Shitake Fan");
  });
});

describe("isBlockedName", () => {
  it("catches the obvious ones", () => {
    expect(isBlockedName("fuck")).toBe(true);
    expect(isBlockedName("F U C K")).toBe(true);
    expect(isBlockedName("f.u.c.k")).toBe(true);
  });

  it("leaves ordinary names alone", () => {
    for (const name of ["Dave", "Anna", "王小明", "Jean-Luc"]) {
      expect(isBlockedName(name), name).toBe(false);
    }
  });
});

describe("checkSubmission", () => {
  const good = { name: "Dave", score: 120, hints: 2 };

  it("passes a plausible submission through", () => {
    const checked = checkSubmission(good);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.value).toEqual(good);
  });

  it("returns the cleaned name, not the raw one", () => {
    const checked = checkSubmission({ ...good, name: "  Dave  " });
    expect(checked.ok && checked.value.name).toBe("Dave");
  });

  it("ignores extra fields instead of storing them", () => {
    const checked = checkSubmission({ ...good, admin: true, at: "1999-01-01" });
    expect(checked.ok && Object.keys(checked.value).sort()).toEqual(["hints", "name", "score"]);
  });

  it("refuses anything that is not an object", () => {
    for (const body of [null, "hello", 5, undefined]) {
      expect(checkSubmission(body).ok, String(body)).toBe(false);
    }
  });

  it("refuses a negative hint count", () => {
    expect(checkSubmission({ ...good, hints: -1 }).ok).toBe(false);
  });

  it("refuses a score sent as a string", () => {
    expect(checkSubmission({ ...good, score: "120" }).ok).toBe(false);
  });

  it("still reads a score posted as seconds by an older page", () => {
    const checked = checkSubmission({ name: "Dave", seconds: 120, hints: 2 });
    expect(checked.ok && checked.value.score).toBe(120);
  });

  it("holds a guess count to its own bounds", () => {
    expect(checkSubmission({ name: "Dave", score: 1, hints: 0 }, "guesses").ok).toBe(true);
    // One guess is impossibly fast for a race but ordinary for Contexto.
    expect(checkSubmission({ name: "Dave", score: 1, hints: 0 }, "time").ok).toBe(false);
    expect(checkSubmission({ name: "Dave", score: 6000, hints: 0 }, "guesses").ok).toBe(false);
  });

  it("says which number it did not believe", () => {
    const race = checkSubmission({ name: "Dave", score: 0, hints: 0 }, "time");
    const words = checkSubmission({ name: "Dave", score: 0, hints: 0 }, "guesses");
    expect(!race.ok && race.error).toMatch(/time/);
    expect(!words.ok && words.error).toMatch(/guess/);
  });
});

describe("rateLimiter", () => {
  it("allows up to the limit and then stops", () => {
    const take = rateLimiter(3, 1000);
    expect(take("a", 0)).toBe(true);
    expect(take("a", 1)).toBe(true);
    expect(take("a", 2)).toBe(true);
    expect(take("a", 3)).toBe(false);
  });

  it("counts each caller separately", () => {
    const take = rateLimiter(1, 1000);
    expect(take("a", 0)).toBe(true);
    expect(take("a", 1)).toBe(false);
    expect(take("b", 1)).toBe(true);
  });

  it("opens up again once the window has passed", () => {
    const take = rateLimiter(1, 1000);
    expect(take("a", 0)).toBe(true);
    expect(take("a", 500)).toBe(false);
    expect(take("a", 1000)).toBe(true);
  });
});
