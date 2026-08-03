/**
 * Which puzzle is today's.
 *
 * Same idea as Contexto's daily word: shuffle the list once with a fixed
 * seed, then walk it by the day index, so every transformed position appears
 * once before any repeats.
 */

import { puzzles, puzzleById, type ChessPuzzle } from "../data/chess-puzzles";
import { dayIndex, type DayString } from "./daily";
import { createRng, hashSeed, shuffleInPlace } from "./random";

const SEED = "chess-puzzles-v1";

/** The play order. Built once at module load. */
export const order: readonly string[] = shuffleInPlace(
  createRng(hashSeed(SEED)),
  puzzles.map((puzzle) => puzzle.id),
);

export function dailyPuzzle(day: DayString): ChessPuzzle {
  // Day zero is 1970, so the index is always positive in practice. The wrap is
  // written to survive a negative anyway rather than return undefined.
  const at = ((dayIndex(day) % order.length) + order.length) % order.length;
  return puzzleById(order[at]!);
}
