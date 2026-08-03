import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { puzzleById } from "../src/data/chess-puzzles";
import { mountChess } from "../src/lib/chess-board";

function mountMarkup() {
  document.body.innerHTML = `
    <div id="chess-board" data-label="Test chess board"></div>
    <span id="chess-status"></span>
    <div id="chess-win" hidden aria-hidden="true">
      <p id="chess-win-note"></p>
      <button id="chess-next" type="button">New puzzle</button>
    </div>
  `;
}

function clickSquare(square: string) {
  document.querySelector<HTMLButtonElement>(`[data-square="${square}"]`)!.click();
}

describe("chess board", () => {
  beforeEach(mountMarkup);
  afterEach(() => vi.useRealTimers());

  it("accepts any legal checkmate, not only the authored mating move", () => {
    const onSolved = vi.fn();
    const board = mountChess({ onSolved });
    board.build(puzzleById("ladder-cutoff"));

    // The authored mate is b7-c7, but b7-d7 is checkmate too.
    clickSquare("b7");
    clickSquare("d7");

    expect(onSolved).toHaveBeenCalledWith({ attempts: 1 });
    expect(document.getElementById("chess-win")!.hidden).toBe(false);
  });

  it("delegates the win panel's next action so the page can reset its counters", () => {
    const onNext = vi.fn();
    mountChess({ onNext });

    document.getElementById("chess-next")!.click();

    expect(onNext).toHaveBeenCalledOnce();
  });

  it("shows the next move as a one-attempt hint and will not charge twice", () => {
    const onFirstMove = vi.fn();
    const onHint = vi.fn();
    const board = mountChess({ onFirstMove, onHint });
    board.build(puzzleById("ladder-cutoff"));

    expect(board.hint()).toBe(true);
    expect(board.attempts()).toBe(1);
    expect(onFirstMove).toHaveBeenCalledOnce();
    expect(onHint).toHaveBeenCalledWith({ attempts: 1, position: expect.any(String) });
    expect(document.querySelector('[data-hint="from"]')?.textContent).not.toBe("");
    expect(document.querySelector('[data-hint="to"]')).not.toBeNull();
    expect(document.getElementById("chess-status")?.textContent).toContain("Hint: move the");

    expect(board.hint()).toBe(false);
    expect(board.attempts()).toBe(1);
    expect(onHint).toHaveBeenCalledOnce();
  });

  it("does not charge a position's hint again after reset or reload", () => {
    const onHint = vi.fn();
    const board = mountChess({ onHint });
    board.build(puzzleById("ladder-cutoff"));

    expect(board.hint()).toBe(true);
    const position = onHint.mock.calls[0]![0].position;
    expect(board.canHint()).toBe(false);
    board.resetPosition();
    expect(board.hint()).toBe(false);
    expect(board.canHint()).toBe(false);

    board.build(puzzleById("ladder-cutoff"), {
      attempts: 1,
      hintedPositions: [position],
    });
    expect(board.hint()).toBe(false);
    expect(board.canHint()).toBe(false);
    expect(board.attempts()).toBe(1);
    expect(onHint).toHaveBeenCalledOnce();
  });

  it("migrates legacy authored-line hint charges", () => {
    const board = mountChess();
    board.build(puzzleById("ladder-cutoff"), {
      ply: 0,
      attempts: 1,
      hintedPlies: [0],
    });

    expect(board.canHint()).toBe(false);
    expect(board.hintHistory()).toHaveLength(1);
    expect(board.hint()).toBe(false);
    expect(board.attempts()).toBe(1);

    board.build(puzzleById("ladder-cutoff"), {
      attempts: 1,
      hintedPositions: board.hintHistory(),
    });
    expect(board.canHint()).toBe(false);
  });

  it("keeps any legal move and lets Black answer it", () => {
    vi.useFakeTimers();
    const board = mountChess();
    board.build(puzzleById("ladder-cutoff"));

    clickSquare("b7");
    clickSquare("b6");

    expect(board.attempts()).toBe(1);
    expect(board.moves()).toEqual(["b7b6"]);
    expect(document.querySelector('[data-square="b6"]')?.textContent).toBe("\u2656");

    vi.runAllTimers();

    expect(board.moves()).toHaveLength(2);
    expect(document.querySelector('[data-square="b6"]')?.textContent).toBe("\u2656");
    expect(document.getElementById("chess-status")?.textContent).toContain("White to move");

    const settled = board.moves();
    for (let reload = 0; reload < 5; reload += 1) {
      board.build(puzzleById("ladder-cutoff"), { moves: ["b7b6"], attempts: 1 });
      expect(board.moves()).toEqual(settled);
    }
    expect(document.querySelector('[data-square="b6"]')?.textContent).toBe("\u2656");
    expect(board.hint()).toBe(true);
  });

  it("returns an incompatible saved move history to the starting position", () => {
    const board = mountChess();

    expect(() =>
      board.build(puzzleById("ladder-cutoff"), {
        moves: ["b7b6", "c2h7"],
        attempts: 1,
      }),
    ).not.toThrow();
    expect(board.moves()).toEqual([]);
    expect(document.querySelector('[data-square="b7"]')?.textContent).toBe("\u2656");
    expect(document.getElementById("chess-status")?.textContent).toContain(
      "saved board no longer matched",
    );
  });

  it("reveals the authored solution and locks a given-up board", () => {
    const board = mountChess();
    board.build(puzzleById("triple-rook-maneuver"));

    expect(board.giveUp()).toBe(true);
    expect(document.getElementById("chess-status")?.textContent).toBe("Solution revealed.");
    expect(board.giveUp()).toBe(false);
  });
});
