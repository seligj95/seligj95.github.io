import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
