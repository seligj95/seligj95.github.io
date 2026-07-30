/**
 * The daily Queens puzzle.
 *
 * One board per day, the same for everyone, drawn deterministically from the
 * day's seed. Difficulty follows a fixed weekday ramp rather than varying at
 * random: a fixed rhythm is learnable and lets people plan around it, the way
 * the crosswords do. Random difficulty just feels arbitrary.
 *
 * Boards are found by rejection sampling - generate from the day's generator,
 * rate it, keep the first one that lands on target. Because the generator is
 * seeded, the whole rejection sequence is deterministic too, so every visitor
 * walks the same path to the same board.
 */

import { generate, type Puzzle } from "./queens";
import { rate, DIFFICULTIES, type Difficulty, type Technique } from "./queens-rating";
import { dailyRng, dayFor, weekdayOf, type DayString } from "./daily";

export interface DayPlan {
  size: number;
  target: Difficulty;
}

/**
 * Indexed by weekday, Sunday first.
 *
 * Size is the "how long" lever and the difficulty target is the "how hard" one,
 * so the week ramps on both. Sizes stay at 8 and 9 for a reason beyond feel:
 * one generate-and-rate cycle costs about 5ms at 8x8 but 440ms at 10x10, and
 * the page builds its board on the spot.
 */
export const SCHEDULE: DayPlan[] = [
  { size: 8, target: "steady" }, // Sunday, mid-weight
  { size: 8, target: "gentle" }, // Monday
  { size: 8, target: "gentle" }, // Tuesday
  { size: 8, target: "steady" }, // Wednesday
  { size: 8, target: "tricky" }, // Thursday
  { size: 9, target: "tricky" }, // Friday
  { size: 9, target: "thorny" }, // Saturday, the week's peak
];

/**
 * How many boards to try before settling. Generous enough to land the rare
 * tiers most days, bounded so a bad seed cannot hang the page.
 */
const MAX_ATTEMPTS = 60;

export interface DailyBoard {
  day: DayString;
  puzzle: Puzzle;
  /** What the schedule asked for. */
  target: Difficulty;
  /** What we actually found. Equal to `target` unless the search ran out. */
  difficulty: Difficulty;
  hardest: Technique;
  /** False when the search settled for the nearest tier instead. */
  onTarget: boolean;
  /** How many boards were generated. Useful for benchmarks. */
  attempts: number;
  /** Deduction steps in the rated solve - roughly, how long the board runs. */
  steps: number;
}

export function planFor(day: DayString): DayPlan {
  return SCHEDULE[weekdayOf(day)]!;
}

/** How far apart two tiers are, for picking the nearest miss. */
function distance(a: Difficulty, b: Difficulty): number {
  return Math.abs(DIFFICULTIES.indexOf(a) - DIFFICULTIES.indexOf(b));
}

/**
 * Builds the board for one day.
 *
 * Always returns a board. If the target tier never turns up inside the attempt
 * budget it takes the closest solvable one it saw and says so through
 * `onTarget`, so the page can report the difficulty it really got rather than
 * the one it hoped for.
 */
export function dailyPuzzle(day: DayString = dayFor()): DailyBoard {
  const plan = planFor(day);
  const rng = dailyRng("queens", day);

  let best: DailyBoard | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const puzzle = generate(plan.size, rng);
    const rating = rate(puzzle);

    // A board the deduction rules cannot finish would have to be guessed at.
    if (!rating.solved || !rating.difficulty || !rating.hardest) continue;

    const candidate: DailyBoard = {
      day,
      puzzle,
      target: plan.target,
      difficulty: rating.difficulty,
      hardest: rating.hardest,
      onTarget: rating.difficulty === plan.target,
      attempts: attempt,
      steps: rating.steps,
    };

    if (candidate.onTarget) return candidate;

    const closer =
      !best ||
      distance(candidate.difficulty, plan.target) <
        distance(best.difficulty, plan.target);
    if (closer) best = candidate;
  }

  if (best) return { ...best, attempts: MAX_ATTEMPTS };

  // Nothing solvable in sixty tries. Vanishingly unlikely, but the page still
  // needs a board, so hand over an unrated one rather than nothing.
  const puzzle = generate(plan.size, dailyRng("queens", day));
  return {
    day,
    puzzle,
    target: plan.target,
    difficulty: plan.target,
    hardest: "crossfire",
    onTarget: false,
    attempts: MAX_ATTEMPTS,
    steps: 0,
  };
}

/** Wording for the difficulty badge on the daily page. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  gentle: "Gentle",
  steady: "Steady",
  tricky: "Tricky",
  thorny: "Thorny",
};

/** A sentence for the day, so a slow Saturday does not feel like a failing. */
export const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  gentle: "Elimination should carry you most of the way.",
  steady: "A squeeze or two, nothing that bites.",
  tricky: "You will have to look a move ahead somewhere.",
  thorny: "A long one. Take the eliminations slowly.",
};
