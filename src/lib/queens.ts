/**
 * Queens board generation.
 *
 * Lifted out of the page so the daily puzzle and free play build boards the
 * same way, and so generation can be tested without a browser. The only
 * behavioral change from the original in-page version is the `rng` parameter:
 * pass nothing and it uses `Math.random`, exactly as before.
 */

import { shuffleInPlace, randomInt, type Rng } from "./random";

export interface Puzzle {
  size: number;
  /** Region index per cell, row-major. */
  regions: number[];
  /** The one legal arrangement, as a column index per row. */
  solution: number[];
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  return shuffleInPlace(rng, items.slice());
}

/**
 * One queen per row and column, and never in a touching column on the next row
 * down (that is the only way two of them can end up adjacent).
 */
export function randomSolution(n: number, rng: Rng = Math.random): number[] | null {
  const columns: number[] = [];
  const used = new Set<number>();

  const place = (row: number): boolean => {
    if (row === n) return true;
    for (const column of shuffle([...Array(n).keys()], rng)) {
      if (used.has(column)) continue;
      if (row > 0 && Math.abs(columns[row - 1]! - column) < 2) continue;
      columns[row] = column;
      used.add(column);
      if (place(row + 1)) return true;
      used.delete(column);
    }
    return false;
  };

  return place(0) ? columns : null;
}

export function neighbors(n: number, index: number): number[] {
  const row = Math.floor(index / n);
  const column = index % n;
  const found: number[] = [];
  if (row > 0) found.push(index - n);
  if (row < n - 1) found.push(index + n);
  if (column > 0) found.push(index - 1);
  if (column < n - 1) found.push(index + 1);
  return found;
}

/** Grows one blob per queen until every square belongs to somebody. */
export function growRegions(
  n: number,
  solution: number[],
  rng: Rng = Math.random
): number[] {
  const owner = new Array<number>(n * n).fill(-1);
  const frontiers: number[][] = [];
  let remaining = n * n;

  solution.forEach((column, row) => {
    const index = row * n + column;
    owner[index] = row;
    remaining -= 1;
    frontiers.push(neighbors(n, index));
  });

  while (remaining > 0) {
    const live = frontiers
      .map((frontier, region) => ({ frontier, region }))
      .filter((entry) => entry.frontier.length > 0);
    if (live.length === 0) break;

    const pick = live[randomInt(rng, live.length)]!;
    const at = randomInt(rng, pick.frontier.length);
    const index = pick.frontier.splice(at, 1)[0]!;
    if (owner[index] !== -1) continue;

    owner[index] = pick.region;
    remaining -= 1;
    for (const neighbor of neighbors(n, index)) {
      if (owner[neighbor] === -1) pick.frontier.push(neighbor);
    }
  }

  // Anything the blobs couldn't reach joins whichever neighbor it touches.
  for (let index = 0; index < owner.length; index += 1) {
    if (owner[index] !== -1) continue;
    const taken = neighbors(n, index).find((other) => owner[other] !== -1);
    owner[index] = taken === undefined ? 0 : owner[taken]!;
  }

  return owner;
}

/**
 * Finds one solution that isn't the intended one, or null when the board is
 * already unique. Columns are tried in a random order so repeated calls keep
 * turning up different rivals instead of the same one forever.
 */
function findRival(
  n: number,
  owner: number[],
  solution: number[],
  rng: Rng
): number[] | null {
  const usedColumns = new Set<number>();
  const usedRegions = new Set<number>();
  const order = shuffle([...Array(n).keys()], rng);
  const current: number[] = [];
  let previous = -5;
  let rival: number[] | null = null;

  const walk = (row: number) => {
    if (rival) return;
    if (row === n) {
      if (current.some((column, index) => column !== solution[index])) {
        rival = current.slice();
      }
      return;
    }
    for (const column of order) {
      if (usedColumns.has(column)) continue;
      if (row > 0 && Math.abs(previous - column) < 2) continue;
      const region = owner[row * n + column]!;
      if (usedRegions.has(region)) continue;

      usedColumns.add(column);
      usedRegions.add(region);
      const parent = previous;
      previous = column;
      current[row] = column;
      walk(row + 1);
      previous = parent;
      usedColumns.delete(column);
      usedRegions.delete(region);
      if (rival) return;
    }
  };

  walk(0);
  return rival;
}

/**
 * Hands one square to a neighboring region, then re-homes anything that got
 * cut off from its own queen so every region stays a single connected shape.
 */
export function handOver(
  n: number,
  owner: number[],
  cell: number,
  to: number,
  queenCell: number[],
  rng: Rng = Math.random
) {
  const from = owner[cell]!;
  owner[cell] = to;

  const members = new Set<number>();
  for (let index = 0; index < owner.length; index += 1) {
    if (owner[index] === from) members.add(index);
  }

  const attached = new Set<number>([queenCell[from]!]);
  const queue = [queenCell[from]!];
  while (queue.length) {
    const current = queue.pop() as number;
    for (const neighbor of neighbors(n, current)) {
      if (members.has(neighbor) && !attached.has(neighbor)) {
        attached.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  let orphans = [...members].filter((index) => !attached.has(index));
  let guard = 0;
  while (orphans.length && guard < n * n) {
    guard += 1;
    const stuck: number[] = [];
    for (const index of orphans) {
      const options = [
        ...new Set(
          neighbors(n, index)
            .map((other) => owner[other]!)
            .filter((r) => r !== from)
        ),
      ];
      if (options.length) {
        owner[index] = options[randomInt(rng, options.length)]!;
      } else {
        stuck.push(index);
      }
    }
    orphans = stuck;
  }
}

/**
 * Random blobs almost never land on a single-solution board, so instead of
 * rerolling until one appears, each rival solution is broken on purpose: take
 * a square that rival puts a queen on, give it to a neighboring color, and
 * that rival now doubles up on a color. Repeat until nothing else solves it.
 */
function refine(n: number, owner: number[], solution: number[], rng: Rng): boolean {
  const queenCell = solution.map((column, row) => row * n + column);
  const queenCells = new Set(queenCell);

  for (let guard = 0; guard < 600; guard += 1) {
    const rival = findRival(n, owner, solution, rng);
    if (!rival) return true;

    const candidates = shuffle(
      rival
        .map((column, row) => row * n + column)
        .filter((index) => !queenCells.has(index)),
      rng
    );

    let moved = false;
    for (const cell of candidates) {
      const from = owner[cell]!;
      const targets = shuffle(
        [
          ...new Set(
            neighbors(n, cell)
              .map((other) => owner[other]!)
              .filter((r) => r !== from)
          ),
        ],
        rng
      );
      if (!targets.length) continue;
      handOver(n, owner, cell, targets[0]!, queenCell, rng);
      moved = true;
      break;
    }
    if (!moved) return false;
  }

  return false;
}

/**
 * Builds a board with exactly one solution.
 *
 * Pass an `rng` to get the same board every time for a given seed; leave it out
 * and free play behaves exactly as it always has.
 */
export function generate(n: number, rng: Rng = Math.random): Puzzle {
  let loose: Puzzle | null = null;

  for (let attempt = 0; attempt < 70; attempt += 1) {
    const solution = randomSolution(n, rng);
    if (!solution) continue;
    const owner = growRegions(n, solution, rng);
    if (!refine(n, owner, solution, rng)) continue;

    // Guaranteed single-solution from here; the rest is just shape taste.
    if (!loose) loose = { size: n, regions: owner, solution };

    const sizes = new Array<number>(n).fill(0);
    for (const region of owner) sizes[region] += 1;
    if (Math.min(...sizes) < 2) continue;
    if (Math.max(...sizes) > Math.ceil(n * 2.8)) continue;
    return { size: n, regions: owner, solution };
  }

  if (loose) return loose;

  const fallback = randomSolution(n, rng) ?? [...Array(n).keys()];
  return { size: n, regions: growRegions(n, fallback, rng), solution: fallback };
}

/**
 * Counts solutions, stopping once it has seen `limit`. Used by the tests to
 * prove a generated board really does have exactly one answer, and by the
 * rater to refuse to score an ambiguous board.
 */
export function countSolutions(puzzle: Puzzle, limit = 2): number {
  const { size: n, regions } = puzzle;
  const usedColumns = new Set<number>();
  const usedRegions = new Set<number>();
  let found = 0;

  const walk = (row: number, previous: number) => {
    if (found >= limit) return;
    if (row === n) {
      found += 1;
      return;
    }
    for (let column = 0; column < n; column += 1) {
      if (usedColumns.has(column)) continue;
      if (row > 0 && Math.abs(previous - column) < 2) continue;
      const region = regions[row * n + column]!;
      if (usedRegions.has(region)) continue;

      usedColumns.add(column);
      usedRegions.add(region);
      walk(row + 1, column);
      usedColumns.delete(column);
      usedRegions.delete(region);
      if (found >= limit) return;
    }
  };

  walk(0, -5);
  return found;
}
