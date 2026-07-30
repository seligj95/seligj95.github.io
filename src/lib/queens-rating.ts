/**
 * How hard is a Queens board?
 *
 * Board size is a poor proxy: a 10x10 that falls to plain elimination is
 * easier than an 8x8 that needs a pigeonhole squeeze. So instead of guessing,
 * this solves the board the way a person would, prices every step by how hard
 * that step is to spot, and adds them up.
 *
 * The techniques, and the order they are tried in, deliberately mirror the
 * hint engine in `src/pages/games/queens.astro`. That page turns each step into
 * a sentence and an animation; this file does not care about either, and runs
 * a whole solve in well under a millisecond so daily generation can rate
 * hundreds of candidate boards. If the hint engine ever learns a new technique,
 * it belongs here too, in the same position in the order.
 */

import type { Puzzle } from "./queens";

/** Hardest first is the whole point, so the order of this list is load-bearing. */
export const TECHNIQUES = [
  /** A color, row or column with exactly one square left. */
  "single",
  /** One unit reaches only one line, so the rest of that line is out. */
  "locked-1",
  /** Two units share two lines between them. */
  "locked-2",
  /** Three units share three lines. */
  "locked-3",
  /** Every square a unit has left attacks some square, so that square is out. */
  "crossfire",
] as const;

export type Technique = (typeof TECHNIQUES)[number];

/**
 * What each technique costs the player who has to spot it.
 *
 * Roughly: noticing a lone empty square is free, following a locked line is
 * cheap, and the pigeonhole squeezes get steadily harder to see as more units
 * are involved. Crossfire sits between the two- and three-unit squeezes - it
 * needs a real look-ahead, but only ever concerns one unit at a time.
 */
export const WEIGHTS: Record<Technique, number> = {
  single: 1,
  "locked-1": 2,
  "locked-2": 6,
  "locked-3": 12,
  crossfire: 8,
};

export type Difficulty = "gentle" | "steady" | "tricky" | "thorny";

export const DIFFICULTIES: Difficulty[] = [
  "gentle",
  "steady",
  "tricky",
  "thorny",
];

/**
 * Score thresholds, lower bound first, taken from the quartiles of a few
 * hundred measured boards. They are deliberately hardcoded rather than
 * recomputed: a board's difficulty has to mean the same thing tomorrow as it
 * does today.
 *
 * Handily, the raw score barely shifts between 8x8 and 9x9 - the quartiles
 * agree to within a couple of points - so one set of thresholds covers both
 * and there is nothing to normalize.
 */
export const THRESHOLDS: { min: number; difficulty: Difficulty }[] = [
  { min: 53, difficulty: "thorny" },
  { min: 38, difficulty: "tricky" },
  { min: 26, difficulty: "steady" },
  { min: 0, difficulty: "gentle" },
];

/**
 * Total effort a solve demands.
 *
 * The obvious measure - the hardest single technique a board needs - turns out
 * to be a poor one. Two thirds of boards need a crossfire somewhere, so calling
 * that "hardest" labels the average board as the week's peak, while the genuinely
 * rare three-unit squeeze looks middling. Adding up what every step costs
 * separates a board that needs one crossfire at the very end from one that
 * grinds through five locked sets, which is the distinction a player actually
 * feels.
 */
export function scoreOf(counts: Record<Technique, number>): number {
  let total = 0;
  for (const technique of TECHNIQUES) {
    total += WEIGHTS[technique] * counts[technique];
  }
  return total;
}

export function difficultyOf(score: number): Difficulty {
  for (const { min, difficulty } of THRESHOLDS) {
    if (score >= min) return difficulty;
  }
  return "gentle";
}

export interface Rating {
  /** False when the techniques above run out before the board is finished. */
  solved: boolean;
  /** The hardest technique needed, or null for a board solved with no steps. */
  hardest: Technique | null;
  /** Total weighted effort. See `scoreOf`. */
  score: number;
  difficulty: Difficulty | null;
  /** How many deduction steps the solve took. A rough measure of length. */
  steps: number;
  /** How often each technique was used. */
  counts: Record<Technique, number>;
}

type CellState = "empty" | "mark" | "queen";
type KeyOf = (index: number) => number;

function group(open: number[], of: KeyOf): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const index of open) {
    const key = of(index);
    const bucket = map.get(key);
    if (bucket) bucket.push(index);
    else map.set(key, [index]);
  }
  return map;
}

function combinations(ids: number[], k: number): number[][] {
  if (k === 1) return ids.map((id) => [id]);
  const out: number[][] = [];
  const walk = (start: number, picked: number[]) => {
    if (picked.length === k) {
      out.push([...picked]);
      return;
    }
    for (let i = start; i < ids.length; i += 1) {
      picked.push(ids[i]!);
      walk(i + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return out;
}

/**
 * Rates a board by solving it. Returns `solved: false` when the deduction
 * rules stall, which for daily generation is a reason to reject the board:
 * a puzzle you can only finish by guessing is not a puzzle.
 */
export function rate(puzzle: Puzzle): Rating {
  const n = puzzle.size;
  const regions = puzzle.regions;
  const cells: CellState[] = new Array<CellState>(n * n).fill("empty");

  const counts = Object.fromEntries(
    TECHNIQUES.map((technique) => [technique, 0])
  ) as Record<Technique, number>;

  const axes: KeyOf[] = [
    (index) => regions[index]!, // color
    (index) => Math.floor(index / n), // row
    (index) => index % n, // column
  ];
  // Same six orderings the hint engine walks, as [from, to] axis indices.
  const axisPairs: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 0],
    [2, 0],
    [1, 2],
    [2, 1],
  ];

  /** Squares that could still hold a crown, given the crowns and marks so far. */
  const openSquares = (): number[] => {
    const queens: number[] = [];
    cells.forEach((state, index) => {
      if (state === "queen") queens.push(index);
    });

    const rowsTaken = new Set(queens.map((index) => Math.floor(index / n)));
    const columnsTaken = new Set(queens.map((index) => index % n));
    const regionsTaken = new Set(queens.map((index) => regions[index]!));
    const open: number[] = [];

    for (let index = 0; index < cells.length; index += 1) {
      if (cells[index] !== "empty") continue;
      const row = Math.floor(index / n);
      const column = index % n;
      if (rowsTaken.has(row) || columnsTaken.has(column)) continue;
      if (regionsTaken.has(regions[index]!)) continue;
      const touches = queens.some(
        (queen) =>
          Math.abs(Math.floor(queen / n) - row) <= 1 &&
          Math.abs((queen % n) - column) <= 1
      );
      if (touches) continue;
      open.push(index);
    }

    return open;
  };

  const findSingle = (open: number[]): number | null => {
    for (const axis of axes) {
      for (const [, spots] of group(open, axis)) {
        if (spots.length === 1) return spots[0]!;
      }
    }
    return null;
  };

  const findLocked = (open: number[], k: number): number[] | null => {
    for (const [from, to] of axisPairs) {
      const a = axes[from]!;
      const b = axes[to]!;
      const buckets = group(open, a);
      const ids = [...buckets.keys()];
      if (ids.length < k) continue;

      for (const combo of combinations(ids, k)) {
        const reach = new Set<number>();
        for (const id of combo) {
          for (const index of buckets.get(id) ?? []) reach.add(b(index));
        }
        if (reach.size !== k) continue;

        const victims = open.filter(
          (index) => reach.has(b(index)) && !combo.includes(a(index))
        );
        if (victims.length) return victims;
      }
    }
    return null;
  };

  const findCrossfire = (open: number[]): number[] | null => {
    const attacks = (a: number, b: number) => {
      if (a === b) return true;
      const rowA = Math.floor(a / n);
      const rowB = Math.floor(b / n);
      const columnA = a % n;
      const columnB = b % n;
      if (rowA === rowB || columnA === columnB) return true;
      if (regions[a] === regions[b]) return true;
      return Math.abs(rowA - rowB) <= 1 && Math.abs(columnA - columnB) <= 1;
    };

    for (const axis of axes) {
      for (const [id, spots] of group(open, axis)) {
        if (spots.length < 2) continue;
        const victims = open.filter(
          (index) =>
            axis(index) !== id && spots.every((spot) => attacks(spot, index))
        );
        if (victims.length) return victims;
      }
    }
    return null;
  };

  let hardestRank = -1;
  let steps = 0;
  let placed = 0;

  const use = (technique: Technique) => {
    counts[technique] += 1;
    steps += 1;
    hardestRank = Math.max(hardestRank, TECHNIQUES.indexOf(technique));
  };

  // Each pass makes exactly one deduction, so the cap is generous: every step
  // either places a crown or crosses at least one square off for good.
  for (let guard = 0; guard < n * n * 4 && placed < n; guard += 1) {
    const open = openSquares();

    const single = findSingle(open);
    if (single !== null) {
      cells[single] = "queen";
      placed += 1;
      use("single");
      continue;
    }

    let moved = false;
    for (let k = 1; k <= 3; k += 1) {
      const victims = findLocked(open, k);
      if (!victims) continue;
      for (const index of victims) cells[index] = "mark";
      use(`locked-${k}` as Technique);
      moved = true;
      break;
    }
    if (moved) continue;

    const crossfire = findCrossfire(open);
    if (crossfire) {
      for (const index of crossfire) cells[index] = "mark";
      use("crossfire");
      continue;
    }

    break;
  }

  const hardest = hardestRank >= 0 ? TECHNIQUES[hardestRank]! : null;
  const score = scoreOf(counts);

  return {
    solved: placed === n,
    hardest,
    score,
    difficulty: hardest ? difficultyOf(score) : null,
    steps,
    counts,
  };
}
