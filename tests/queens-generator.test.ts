import { describe, it, expect } from "vitest";
import {
  generate,
  randomSolution,
  growRegions,
  neighbors,
  countSolutions,
  type Puzzle,
} from "../src/lib/queens";
import { createRng, hashSeed } from "../src/lib/random";
import { dailyRng } from "../src/lib/daily";

const SIZES = [7, 8, 9, 10] as const;

/** Every rule of the puzzle, checked against a candidate arrangement. */
function isLegal(puzzle: Puzzle, columns: number[]): boolean {
  const { size: n, regions } = puzzle;
  if (columns.length !== n) return false;

  const seenColumns = new Set<number>();
  const seenRegions = new Set<number>();

  for (let row = 0; row < n; row += 1) {
    const column = columns[row]!;
    if (column < 0 || column >= n) return false;
    if (seenColumns.has(column)) return false;
    seenColumns.add(column);

    const region = regions[row * n + column]!;
    if (seenRegions.has(region)) return false;
    seenRegions.add(region);

    if (row > 0 && Math.abs(columns[row - 1]! - column) < 2) return false;
  }

  return true;
}

/** True when every region is one orthogonally connected blob. */
function regionsAreConnected(puzzle: Puzzle): boolean {
  const { size: n, regions } = puzzle;
  const byRegion = new Map<number, number[]>();

  regions.forEach((region, index) => {
    const list = byRegion.get(region);
    if (list) list.push(index);
    else byRegion.set(region, [index]);
  });

  for (const [, members] of byRegion) {
    const remaining = new Set(members);
    const queue = [members[0]!];
    remaining.delete(members[0]!);

    while (queue.length) {
      const current = queue.pop()!;
      for (const neighbor of neighbors(n, current)) {
        if (remaining.has(neighbor)) {
          remaining.delete(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (remaining.size > 0) return false;
  }

  return true;
}

describe("neighbors", () => {
  it("stays inside the board", () => {
    expect(neighbors(4, 0).sort()).toEqual([1, 4]); // top-left corner
    expect(neighbors(4, 15).sort()).toEqual([11, 14]); // bottom-right corner
    expect(neighbors(4, 5).sort()).toEqual([1, 4, 6, 9]); // interior
  });
});

describe("randomSolution", () => {
  it("obeys every placement rule", () => {
    for (const n of SIZES) {
      const rng = createRng(hashSeed(`solution-${n}`));
      for (let i = 0; i < 25; i += 1) {
        const columns = randomSolution(n, rng);
        expect(columns, `size ${n}`).not.toBeNull();
        // Checked against a board where every square is its own region, so
        // only the row, column and adjacency rules are in play.
        const flat: Puzzle = {
          size: n,
          regions: columns!.flatMap((_, row) => new Array<number>(n).fill(row)),
          solution: columns!,
        };
        expect(isLegal(flat, columns!), `size ${n} run ${i}`).toBe(true);
      }
    }
  });
});

describe("growRegions", () => {
  it("gives every square exactly one owner", () => {
    const rng = createRng(4);
    const solution = randomSolution(8, rng)!;
    const owner = growRegions(8, solution, rng);

    expect(owner).toHaveLength(64);
    expect(owner.every((region) => region >= 0 && region < 8)).toBe(true);
    expect(new Set(owner).size).toBe(8);
  });

  it("puts each queen in its own region", () => {
    const rng = createRng(9);
    const solution = randomSolution(8, rng)!;
    const owner = growRegions(8, solution, rng);
    const regionsUsed = solution.map((column, row) => owner[row * 8 + column]);
    expect(new Set(regionsUsed).size).toBe(8);
  });
});

describe("generate", () => {
  // Two dozen boards, and a 10x10 costs the better part of a second to draw
  // and verify. Even against the raised global ceiling this is the one worth
  // giving extra room, since it is several times heavier than anything else.
  it("builds a legal, uniquely solvable board at every size", { timeout: 60000 }, () => {
    for (const n of SIZES) {
      const rng = createRng(hashSeed(`board-${n}`));
      for (let i = 0; i < 6; i += 1) {
        const puzzle = generate(n, rng);

        expect(puzzle.size, `size ${n}`).toBe(n);
        expect(puzzle.regions, `size ${n}`).toHaveLength(n * n);
        expect(puzzle.solution, `size ${n}`).toHaveLength(n);
        expect(isLegal(puzzle, puzzle.solution), `size ${n} run ${i}`).toBe(true);
        expect(countSolutions(puzzle), `size ${n} run ${i}`).toBe(1);
        expect(regionsAreConnected(puzzle), `size ${n} run ${i}`).toBe(true);
      }
    }
  });

  it("uses every color", () => {
    const puzzle = generate(9, createRng(21));
    expect(new Set(puzzle.regions).size).toBe(9);
  });

  it("repeats exactly for the same seed", () => {
    const first = generate(8, createRng(1234));
    const second = generate(8, createRng(1234));
    expect(second).toEqual(first);
  });

  it("gives different seeds different boards", () => {
    const first = generate(8, createRng(1234));
    const second = generate(8, createRng(1235));
    expect(second.regions).not.toEqual(first.regions);
  });

  it("keeps free play random when no generator is passed", () => {
    // The default argument is the one thing protecting existing behavior.
    const boards = Array.from({ length: 5 }, () => generate(8));
    const distinct = new Set(boards.map((board) => board.regions.join(",")));
    expect(distinct.size).toBe(boards.length);

    for (const board of boards) {
      expect(isLegal(board, board.solution)).toBe(true);
      expect(countSolutions(board)).toBe(1);
    }
  });

  it("hands the same board to everyone on a given day", () => {
    const monday = generate(8, dailyRng("queens", "2026-03-02"));
    const again = generate(8, dailyRng("queens", "2026-03-02"));
    const tuesday = generate(8, dailyRng("queens", "2026-03-03"));

    expect(again).toEqual(monday);
    expect(tuesday.regions).not.toEqual(monday.regions);
  });

  it("produces a solvable board for every day of a year", () => {
    // The generator retries internally and can fall back to a looser board, so
    // this is the guard that no seed in a year lands somewhere broken.
    let day = new Date(Date.UTC(2026, 0, 1));

    for (let i = 0; i < 365; i += 1) {
      const key = day.toISOString().slice(0, 10);
      const puzzle = generate(8, dailyRng("queens", key));
      expect(isLegal(puzzle, puzzle.solution), key).toBe(true);
      expect(countSolutions(puzzle), key).toBe(1);
      day = new Date(day.getTime() + 86400_000);
    }
  });
});

describe("countSolutions", () => {
  it("finds the one answer on a generated board", () => {
    expect(countSolutions(generate(8, createRng(77)))).toBe(1);
  });

  it("spots an ambiguous board", () => {
    // Two columns per region on a 2x2 gives two arrangements... except the
    // adjacency rule forbids both, so this board has none at all.
    const striped: Puzzle = {
      size: 2,
      regions: [0, 1, 0, 1],
      solution: [0, 1],
    };
    expect(countSolutions(striped)).toBe(0);
  });

  it("stops counting at the limit", () => {
    // Rows own the colors, so any legal arrangement works and there are many.
    const n = 6;
    const byRow: Puzzle = {
      size: n,
      regions: Array.from({ length: n * n }, (_, index) => Math.floor(index / n)),
      solution: [0, 2, 4, 1, 3, 5],
    };
    expect(countSolutions(byRow, 3)).toBe(3);
    expect(countSolutions(byRow, 10)).toBe(10);
  });
});
