import { describe, it, expect } from "vitest";
import { generate, type Puzzle } from "../src/lib/queens";
import {
  rate,
  TECHNIQUES,
  DIFFICULTIES,
  WEIGHTS,
  THRESHOLDS,
  scoreOf,
  difficultyOf,
  type Technique,
} from "../src/lib/queens-rating";
import { createRng } from "../src/lib/random";

/** A spread of boards to make distribution claims against. */
function sample(size: number, count: number, seed = 4242): Puzzle[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => generate(size, rng));
}

describe("technique order", () => {
  it("matches the order the hint engine escalates through", () => {
    // The page tries forced placements, then pigeonhole squeezes at k = 1, 2, 3,
    // then the crossfire rule. Rating is only meaningful if it agrees.
    expect([...TECHNIQUES]).toEqual([
      "single",
      "locked-1",
      "locked-2",
      "locked-3",
      "crossfire",
    ]);
  });

  it("gives every technique a cost", () => {
    for (const technique of TECHNIQUES) {
      expect(WEIGHTS[technique]).toBeGreaterThan(0);
    }
  });

  it("never prices a single below the techniques it precedes", () => {
    // Weights need not rise monotonically - crossfire deliberately sits below
    // the three-unit squeeze - but the trivial case must stay the cheapest.
    for (const technique of TECHNIQUES) {
      if (technique === "single") continue;
      expect(WEIGHTS[technique]).toBeGreaterThan(WEIGHTS.single);
    }
  });
});

describe("difficulty tiers", () => {
  it("covers every score with exactly one tier", () => {
    for (let score = 0; score <= 200; score += 1) {
      expect(DIFFICULTIES).toContain(difficultyOf(score));
    }
  });

  it("never gets easier as the score rises", () => {
    let seen = -1;
    for (let score = 0; score <= 200; score += 1) {
      const rank = DIFFICULTIES.indexOf(difficultyOf(score));
      expect(rank).toBeGreaterThanOrEqual(seen);
      seen = rank;
    }
  });

  it("puts each threshold boundary in the tier it names", () => {
    for (const { min, difficulty } of THRESHOLDS) {
      expect(difficultyOf(min)).toBe(difficulty);
    }
  });

  it("adds up the weighted counts", () => {
    const counts = {
      single: 2,
      "locked-1": 3,
      "locked-2": 1,
      "locked-3": 0,
      crossfire: 2,
    };
    // 2*1 + 3*2 + 1*6 + 0*12 + 2*8
    expect(scoreOf(counts)).toBe(30);
  });
});

describe("rate", () => {
  it("solves the boards the generator produces", () => {
    // A daily puzzle you can only finish by guessing is not a puzzle, so the
    // share of boards the rules cannot crack matters. Measured at well under
    // 10%; this asserts it has not quietly become the common case.
    for (const size of [6, 8, 9]) {
      const boards = sample(size, 40);
      const solved = boards.filter((puzzle) => rate(puzzle).solved).length;
      expect(solved / boards.length, `size ${size}`).toBeGreaterThan(0.85);
    }
  });

  it("agrees with itself", () => {
    const puzzle = generate(8, createRng(31));
    expect(rate(puzzle)).toEqual(rate(puzzle));
  });

  it("reports a technique it actually used", () => {
    for (const puzzle of sample(8, 25)) {
      const rating = rate(puzzle);
      if (!rating.hardest) continue;
      expect(rating.counts[rating.hardest]).toBeGreaterThan(0);
    }
  });

  it("never claims a technique it did not use", () => {
    for (const puzzle of sample(8, 25)) {
      const rating = rate(puzzle);
      if (!rating.hardest) continue;
      const harder = TECHNIQUES.slice(TECHNIQUES.indexOf(rating.hardest) + 1);
      for (const technique of harder) {
        expect(rating.counts[technique as Technique]).toBe(0);
      }
    }
  });

  it("counts steps consistently", () => {
    for (const puzzle of sample(8, 15)) {
      const rating = rate(puzzle);
      const total = TECHNIQUES.reduce(
        (sum, technique) => sum + rating.counts[technique],
        0
      );
      expect(total).toBe(rating.steps);
    }
  });

  it("places exactly one crown per row on a solved board", () => {
    for (const puzzle of sample(8, 15)) {
      const rating = rate(puzzle);
      if (!rating.solved) continue;
      // A solve means n crowns went down, which given the open-square rules
      // can only be one per row, column and color.
      expect(rating.counts.single).toBe(puzzle.size);
    }
  });

  it("labels difficulty from the effort score", () => {
    for (const puzzle of sample(9, 20)) {
      const rating = rate(puzzle);
      expect(rating.score).toBe(scoreOf(rating.counts));
      expect(rating.difficulty).toBe(
        rating.hardest ? difficultyOf(rating.score) : null
      );
    }
  });

  it("spreads boards across all four tiers rather than piling into one", () => {
    // The reason the score exists. Rating by hardest technique alone put two
    // thirds of boards in a single tier, which made the rare tiers expensive to
    // generate and made the common one a poor description of the board.
    const counts = new Map<string, number>();
    const boards = sample(8, 120, 909);
    let solved = 0;
    for (const puzzle of boards) {
      const rating = rate(puzzle);
      if (!rating.difficulty) continue;
      solved += 1;
      counts.set(rating.difficulty, (counts.get(rating.difficulty) ?? 0) + 1);
    }
    for (const difficulty of DIFFICULTIES) {
      const share = (counts.get(difficulty) ?? 0) / solved;
      expect(share).toBeGreaterThan(0.05);
      expect(share).toBeLessThan(0.6);
    }
  });

  it("finds boards across more than one difficulty", () => {
    // If every board rated the same, difficulty targeting would be pointless.
    const found = new Set(
      sample(8, 60)
        .map((puzzle) => rate(puzzle).difficulty)
        .filter(Boolean)
    );
    expect(found.size).toBeGreaterThan(1);
  });

  it("is quick enough to rate boards in bulk", () => {
    const boards = sample(9, 40);
    const started = performance.now();
    for (const puzzle of boards) rate(puzzle);
    const each = (performance.now() - started) / boards.length;
    // Measured around 0.4ms. The cap is loose so a slow CI box does not fail
    // the build, but tight enough to catch an accidental blow-up.
    expect(each).toBeLessThan(20);
  });

  it("gives up rather than looping on a board with no answer", () => {
    // Every square in a 2x2 touches every other, so no arrangement is legal.
    const impossible: Puzzle = {
      size: 2,
      regions: [0, 1, 1, 0],
      solution: [0, 1],
    };
    const rating = rate(impossible);
    expect(rating.solved).toBe(false);
    expect(rating.steps).toBeLessThan(2 * 2 * 4);
  });

  it("reports no technique only when it took no steps", () => {
    const boards = [
      ...sample(8, 20),
      { size: 2, regions: [0, 1, 1, 0], solution: [0, 1] } as Puzzle,
    ];
    for (const puzzle of boards) {
      const rating = rate(puzzle);
      expect(rating.hardest === null).toBe(rating.steps === 0);
      expect(rating.difficulty === null).toBe(rating.steps === 0);
    }
  });

  it("walks a hand-built board without needing anything clever", () => {
    // Rows own the colors and the answer is forced, so plain elimination and
    // the k = 1 squeeze are enough.
    const size = 6;
    const byRow: Puzzle = {
      size,
      regions: Array.from({ length: size * size }, (_, i) => Math.floor(i / size)),
      solution: [0, 2, 4, 1, 3, 5],
    };
    const rating = rate(byRow);
    expect(rating.counts.crossfire + rating.counts["locked-3"]).toBe(0);
  });
});
