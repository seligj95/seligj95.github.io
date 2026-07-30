import { describe, it, expect } from "vitest";
import {
  dailyPuzzle,
  planFor,
  SCHEDULE,
  DIFFICULTY_LABEL,
  DIFFICULTY_BLURB,
} from "../src/lib/queens-daily";
import { DIFFICULTIES, rate } from "../src/lib/queens-rating";
import { countSolutions } from "../src/lib/queens";
import { addDays, weekdayOf, type DayString } from "../src/lib/daily";

/** A week of consecutive days, so every schedule slot gets exercised. */
const WEEK: DayString[] = (() => {
  const days: DayString[] = [];
  let day: DayString = "2026-03-01"; // a Sunday
  for (let i = 0; i < 7; i += 1) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
})();

describe("schedule", () => {
  it("covers all seven weekdays", () => {
    expect(SCHEDULE).toHaveLength(7);
  });

  it("names a real size and difficulty for every day", () => {
    for (const plan of SCHEDULE) {
      expect([6, 8, 9, 10]).toContain(plan.size);
      expect(DIFFICULTIES).toContain(plan.target);
    }
  });

  it("starts the week on Sunday", () => {
    // 2026-03-01 is a Sunday, and weekdayOf agrees, so SCHEDULE[0] is Sunday's.
    expect(weekdayOf("2026-03-01")).toBe(0);
    expect(planFor("2026-03-01")).toEqual(SCHEDULE[0]);
  });

  it("gives each day of the week its own plan slot", () => {
    for (const [index, day] of WEEK.entries()) {
      expect(planFor(day)).toEqual(SCHEDULE[index]);
    }
  });

  it("keeps the week from being uniformly hard or uniformly easy", () => {
    const targets = new Set(SCHEDULE.map((plan) => plan.target));
    expect(targets.size).toBeGreaterThan(2);
  });

  it("gives every difficulty a label and a blurb", () => {
    for (const difficulty of DIFFICULTIES) {
      expect(DIFFICULTY_LABEL[difficulty]).toBeTruthy();
      expect(DIFFICULTY_BLURB[difficulty]).toBeTruthy();
    }
  });
});

describe("dailyPuzzle", () => {
  it("gives everyone the same board for a given day", () => {
    // The whole premise of a daily puzzle. The rejection sequence is seeded too,
    // so two runs must walk the same path to the same board.
    for (const day of WEEK) {
      const a = dailyPuzzle(day);
      const b = dailyPuzzle(day);
      expect(b.puzzle.regions).toEqual(a.puzzle.regions);
      expect(b.puzzle.size).toBe(a.puzzle.size);
      expect(b.difficulty).toBe(a.difficulty);
      expect(b.attempts).toBe(a.attempts);
    }
  });

  it("gives different days different boards", () => {
    const seen = new Set(
      WEEK.map((day) => JSON.stringify(dailyPuzzle(day).puzzle.regions))
    );
    expect(seen.size).toBe(WEEK.length);
  });

  it("builds the size the schedule asked for", () => {
    for (const day of WEEK) {
      const board = dailyPuzzle(day);
      expect(board.puzzle.size).toBe(planFor(day).size);
      expect(board.day).toBe(day);
      expect(board.target).toBe(planFor(day).target);
    }
  });

  it("hits the target difficulty", () => {
    for (const day of WEEK) {
      const board = dailyPuzzle(day);
      expect(board.onTarget).toBe(true);
      expect(board.difficulty).toBe(board.target);
    }
  });

  it("reports the difficulty it actually achieved, not the one it wanted", () => {
    // onTarget is what stops the page lying on the rare day the search settles.
    for (const day of WEEK) {
      const board = dailyPuzzle(day);
      expect(board.onTarget).toBe(board.difficulty === board.target);
    }
  });

  it("agrees with a fresh rating of the board it returns", () => {
    for (const day of WEEK) {
      const board = dailyPuzzle(day);
      const rating = rate(board.puzzle);
      expect(rating.difficulty).toBe(board.difficulty);
      expect(rating.hardest).toBe(board.hardest);
      expect(rating.steps).toBe(board.steps);
    }
  });

  it("only ever hands out puzzles with one solution", () => {
    for (const day of WEEK) {
      const board = dailyPuzzle(day);
      expect(countSolutions(board.puzzle, 2)).toBe(1);
    }
  });

  it("hands out puzzles the deduction rules can finish without guessing", () => {
    for (const day of WEEK) {
      expect(rate(dailyPuzzle(day).puzzle).solved).toBe(true);
    }
  });

  it("settles inside its attempt budget", () => {
    for (const day of WEEK) {
      const board = dailyPuzzle(day);
      expect(board.attempts).toBeGreaterThan(0);
      expect(board.attempts).toBeLessThanOrEqual(60);
    }
  });

  it("defaults to today", () => {
    const board = dailyPuzzle();
    expect(board.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(board.puzzle.size).toBe(planFor(board.day).size);
  });

  it("stays affordable enough to build in a browser", () => {
    // Measured on a laptop: about 60ms on average across a year, with the two
    // size-9 days the slow ones. The page hides this behind its start gate, but
    // if a change here pushes it into seconds that gate stops being enough.
    const start = performance.now();
    for (const day of WEEK) dailyPuzzle(day);
    const perDay = (performance.now() - start) / WEEK.length;
    expect(perDay).toBeLessThan(1500);
  });
});

describe("a month of days", () => {
  it("produces a solvable, on-target board every day", () => {
    let day: DayString = "2026-06-01";
    let onTarget = 0;
    for (let i = 0; i < 30; i += 1) {
      const board = dailyPuzzle(day);
      expect(rate(board.puzzle).solved).toBe(true);
      expect(board.puzzle.size).toBe(planFor(day).size);
      if (board.onTarget) onTarget += 1;
      day = addDays(day, 1);
    }
    // Measured at 364 of 364 over a year; leave room without inviting a
    // regression to slip through.
    expect(onTarget).toBeGreaterThanOrEqual(28);
  });
});
