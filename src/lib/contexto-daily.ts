/**
 * Which word is today's.
 *
 * The obvious approach — seed a generator from the date and draw a word — has a
 * flaw that only shows up months in: independent draws from 706 words collide
 * far sooner than you would think, and repeating a word inside the first year
 * would look like a bug even though it was not one.
 *
 * So the list is shuffled once, with a fixed seed, and the day counter walks
 * through it. Every word appears once before any appears twice, which is 706
 * days, and the order is still unguessable without reading this file. Changing
 * the seed reshuffles everything, so it is versioned rather than tweaked.
 */

import { secrets } from "../data/contexto-secrets";
import { dayIndex, type DayString } from "./daily";
import { createRng, hashSeed, shuffleInPlace } from "./random";

const SEED = "contexto-secrets-v1";

/** The play order. Built once at module load; 706 swaps costs nothing. */
export const order: readonly string[] = shuffleInPlace(
  createRng(hashSeed(SEED)),
  [...secrets],
);

export function secretFor(day: DayString): string {
  // Day zero is 1970, so the index is always positive in practice. The wrap is
  // written to survive a negative anyway rather than return undefined.
  const at = ((dayIndex(day) % order.length) + order.length) % order.length;
  return order[at];
}
