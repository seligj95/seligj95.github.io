/**
 * A tiny deterministic random number generator.
 *
 * The daily puzzles need every visitor to get the same board, which means the
 * generator has to agree exactly across browsers and across years. Everything
 * here is 32-bit integer arithmetic (`Math.imul`, `>>>`, `^`) so there is no
 * floating point drift to argue about: the only division is the final step
 * that maps a uint32 onto [0, 1).
 */

/** Matches `Math.random`: a float in [0, 1). */
export type Rng = () => number;

/**
 * Turns a string into a 32-bit seed. This is xmur3, chosen because it mixes
 * short, very similar strings well - `queens-2026-03-03` and
 * `queens-2026-03-04` need to land somewhere completely different, or
 * consecutive days would produce suspiciously similar puzzles.
 */
export function hashSeed(text: string): number {
  let h = 1779033703 ^ text.length;

  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Builds a seeded generator. This is mulberry32: one 32-bit word of state and
 * a period of 2^32. Overkill would be wasted here - we are laying out a puzzle
 * grid, not running a simulation.
 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;

  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convenience: seed straight from a string key. */
export function rngFromKey(key: string): Rng {
  return createRng(hashSeed(key));
}

/** An integer in [0, max). Returns 0 when `max` is not positive. */
export function randomInt(rng: Rng, max: number): number {
  if (max <= 0) return 0;
  const value = Math.floor(rng() * max);
  return value >= max ? max - 1 : value;
}

/** Picks one item. Returns undefined only for an empty list. */
export function pick<T>(rng: Rng, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[randomInt(rng, items.length)];
}

/**
 * Fisher-Yates, in place, walking backwards. Kept here so daily generation and
 * free play share one shuffle and cannot drift apart.
 */
export function shuffleInPlace<T>(rng: Rng, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const swap = items[i]!;
    items[i] = items[j]!;
    items[j] = swap;
  }
  return items;
}
