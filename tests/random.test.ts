import { describe, it, expect } from "vitest";
import {
  hashSeed,
  createRng,
  rngFromKey,
  randomInt,
  pick,
  shuffleInPlace,
} from "../src/lib/random";

const take = (rng: () => number, count: number) =>
  Array.from({ length: count }, () => rng());

describe("hashSeed", () => {
  it("is stable across runs", () => {
    // Locked-in values. If these ever change, every past daily puzzle changes
    // with them, so a failure here is a real break and not a flaky test.
    expect(hashSeed("queens-2026-03-03")).toBe(2367760545);
    expect(hashSeed("queens-2026-03-04")).toBe(3351401129);
    expect(hashSeed("")).toBe(167010153);
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const key of ["", "a", "queens-2026-03-03", "x".repeat(500)]) {
      const seed = hashSeed(key);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 32);
    }
  });

  it("scatters consecutive days", () => {
    const seeds = Array.from({ length: 40 }, (_, i) =>
      hashSeed(`queens-2026-03-${String(i + 1).padStart(2, "0")}`)
    );

    // Neighboring keys differ by one character, so a weak hash would leave
    // them clustered. Every one of these should be unrelated to the last.
    expect(new Set(seeds).size).toBe(seeds.length);

    for (let i = 1; i < seeds.length; i++) {
      const gap = Math.abs(seeds[i]! - seeds[i - 1]!);
      expect(gap).toBeGreaterThan(2 ** 20);
    }
  });
});

describe("createRng", () => {
  it("repeats exactly for the same seed", () => {
    expect(take(createRng(12345), 50)).toEqual(take(createRng(12345), 50));
  });

  it("is stable across runs", () => {
    expect(take(createRng(1), 3)).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });

  it("diverges for neighboring seeds", () => {
    expect(take(createRng(1), 20)).not.toEqual(take(createRng(2), 20));
  });

  it("stays inside [0, 1)", () => {
    const rng = createRng(hashSeed("range check"));
    for (let i = 0; i < 20000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("spreads roughly evenly across ten buckets", () => {
    const rng = createRng(99);
    const buckets = new Array(10).fill(0);
    const draws = 100000;

    for (let i = 0; i < draws; i++) buckets[Math.floor(rng() * 10)]++;

    // Not a statistics exam - just enough to catch a generator stuck in a
    // corner of the range.
    for (const count of buckets) {
      expect(count).toBeGreaterThan(draws / 10 - draws / 50);
      expect(count).toBeLessThan(draws / 10 + draws / 50);
    }
  });

  it("survives a seed of zero", () => {
    const first = take(createRng(0), 10);
    expect(new Set(first).size).toBeGreaterThan(1);
    expect(first).toEqual(take(createRng(0), 10));
  });
});

describe("rngFromKey", () => {
  it("matches seeding by hand", () => {
    const key = "queens-2026-03-03";
    expect(take(rngFromKey(key), 10)).toEqual(
      take(createRng(hashSeed(key)), 10)
    );
  });
});

describe("randomInt", () => {
  it("stays in range and never reaches max", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10000; i++) {
      const value = randomInt(rng, 6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });

  it("hits every value in a small range", () => {
    const rng = createRng(11);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(rng, 4));
    expect(seen).toEqual(new Set([0, 1, 2, 3]));
  });

  it("clamps a generator that returns 1", () => {
    // Defensive: a hand-rolled rng elsewhere returning exactly 1 must not
    // index one past the end of an array.
    expect(randomInt(() => 1, 5)).toBe(4);
  });

  it("returns 0 for an empty range", () => {
    expect(randomInt(createRng(1), 0)).toBe(0);
    expect(randomInt(createRng(1), -3)).toBe(0);
  });
});

describe("pick", () => {
  it("returns undefined for an empty list", () => {
    expect(pick(createRng(1), [])).toBeUndefined();
  });

  it("only ever returns members of the list", () => {
    const items = ["a", "b", "c"];
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      expect(items).toContain(pick(rng, items));
    }
  });
});

describe("shuffleInPlace", () => {
  it("keeps every item exactly once", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = shuffleInPlace(createRng(5), [...items]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it("repeats exactly for the same seed", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffleInPlace(createRng(8), [...items])).toEqual(
      shuffleInPlace(createRng(8), [...items])
    );
  });

  it("actually moves things", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffleInPlace(createRng(8), [...items])).not.toEqual(items);
  });

  it("handles empty and single-item lists", () => {
    expect(shuffleInPlace(createRng(1), [])).toEqual([]);
    expect(shuffleInPlace(createRng(1), ["only"])).toEqual(["only"]);
  });
});
