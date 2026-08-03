import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { ai } from "js-chess-engine";

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

  it("never starts with Black already in check", () => {
    for (const puzzle of puzzles) {
      const fields = puzzle.fen.split(" ");
      fields[1] = "b";
      expect(new Chess(fields.join(" ")).isCheck(), puzzle.id).toBe(false);
    }
  });

  it("keeps known engine-incompatible positions out of rotation", () => {
    const invalidFamilies = [
      "rook-rollercoaster",
      "diagonal-strike",
      "corner-trap",
      "knight-assisted-rook",
      "queen-rook-tandem",
    ];
    const drawnPositions = [
      "lawnmower-finish-flip",
      "queen-bishop-cross-turn-right",
      "triple-rook-maneuver-flip",
      "knight-king-rook-turn-around",
      "knight-king-rook-diagonal",
      "queen-knight-corner-turn-around",
    ];

    for (const family of invalidFamilies) {
      expect(
        puzzles.some((puzzle) => puzzle.id === family || puzzle.id.startsWith(`${family}-`)),
        family,
      ).toBe(false);
    }
    for (const id of drawnPositions) {
      expect(puzzles.some((puzzle) => puzzle.id === id), id).toBe(false);
    }
  });

  it("gives the browser engine a legal hint from every starting position", () => {
    for (const puzzle of puzzles) {
      const chess = new Chess(puzzle.fen);
      const entry = Object.entries(
        ai(puzzle.fen, { level: 1, play: false, ttSizeMB: 0.25 }).move,
      )[0];
      expect(entry, puzzle.id).toBeTruthy();
      const [from, to] = entry!;
      const legal = chess.moves({ square: from.toLowerCase() as never, verbose: true });
      expect(legal.some((move) => move.to === to.toLowerCase()), puzzle.id).toBe(true);
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
