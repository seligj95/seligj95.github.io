import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

import { puzzleById, puzzles, randomPuzzle, type ChessPuzzle } from "../src/data/chess-puzzles";
import { dailyPuzzle, order } from "../src/lib/chess-daily";
import { addDays, type DayString } from "../src/lib/daily";

/** Replays a puzzle's solution and returns the final chess.js instance. */
function replay(puzzle: ChessPuzzle): Chess {
  const chess = new Chess(puzzle.fen);
  for (const uci of puzzle.solution) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.slice(4) || undefined;
    const legal = chess.moves({ square: from as never, verbose: true });
    const match = legal.find(
      (move) => move.from === from && move.to === to && (move.promotion ?? undefined) === promotion,
    );
    expect(match, `${puzzle.id}: ${uci} should be legal from ${chess.fen()}`).toBeTruthy();
    chess.move({ from, to, promotion });
  }
  return chess;
}

describe("chess puzzles", () => {
  it("has at least a dozen puzzles", () => {
    expect(puzzles.length).toBeGreaterThanOrEqual(12);
  });

  it("uses a unique id and a unique FEN for every puzzle", () => {
    expect(new Set(puzzles.map((puzzle) => puzzle.id)).size).toBe(puzzles.length);
    expect(new Set(puzzles.map((puzzle) => puzzle.fen)).size).toBe(puzzles.length);
  });

  it("starts every puzzle with White to move", () => {
    for (const puzzle of puzzles) {
      expect(new Chess(puzzle.fen).turn(), puzzle.id).toBe("w");
    }
  });

  it("gives every puzzle a solution length matching its mateIn", () => {
    for (const puzzle of puzzles) {
      expect(puzzle.solution.length, puzzle.id).toBe(puzzle.mateIn * 2 - 1);
    }
  });

  it("replays every line to a real, legal checkmate", () => {
    for (const puzzle of puzzles) {
      const chess = replay(puzzle);
      expect(chess.isCheckmate(), `${puzzle.id} should end in checkmate`).toBe(true);
    }
  });

  it("never lets the reply itself already be checkmate or stalemate", () => {
    // Every reply ply (odd index) must leave Black with at least one legal
    // move, or the "puzzle" ended before the player's mating move did.
    for (const puzzle of puzzles) {
      const chess = new Chess(puzzle.fen);
      puzzle.solution.forEach((uci, index) => {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.slice(4) || undefined;
        chess.move({ from, to, promotion });
        const isLast = index === puzzle.solution.length - 1;
        if (!isLast) {
          expect(chess.isCheckmate(), `${puzzle.id} ply ${index}`).toBe(false);
          expect(chess.isStalemate(), `${puzzle.id} ply ${index}`).toBe(false);
          expect(chess.moves().length, `${puzzle.id} ply ${index}`).toBeGreaterThan(0);
        }
      });
    }
  });

  it("covers mate-in-1, mate-in-2 and mate-in-3", () => {
    const byLength = new Map<number, number>();
    for (const puzzle of puzzles) {
      byLength.set(puzzle.mateIn, (byLength.get(puzzle.mateIn) ?? 0) + 1);
    }
    expect(byLength.get(1) ?? 0).toBeGreaterThanOrEqual(3);
    expect(byLength.get(2) ?? 0).toBeGreaterThanOrEqual(3);
    expect(byLength.get(3) ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("looks up a puzzle by id", () => {
    const first = puzzles[0]!;
    expect(puzzleById(first.id)).toBe(first);
    expect(() => puzzleById("no-such-puzzle")).toThrow();
  });

  it("randomPuzzle avoids repeating the puzzle you just had", () => {
    for (let i = 0; i < 50; i += 1) {
      const previous = randomPuzzle();
      const next = randomPuzzle(previous.id);
      expect(next.id).not.toBe(previous.id);
    }
  });
});

describe("chess daily", () => {
  it("plays every puzzle before any repeat", () => {
    expect(new Set(order).size).toBe(puzzles.length);
  });

  it("is deterministic for a given day", () => {
    const day: DayString = "2026-03-03";
    expect(dailyPuzzle(day)).toEqual(dailyPuzzle(day));
  });

  it("changes puzzle across a full cycle of days", () => {
    let day: DayString = "2026-03-01";
    const seen = new Set<string>();
    for (let i = 0; i < order.length; i += 1) {
      seen.add(dailyPuzzle(day).id);
      day = addDays(day, 1);
    }
    expect(seen.size).toBe(order.length);
  });
});
