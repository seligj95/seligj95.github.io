/**
 * The chess board, as a thing you can mount on a page.
 *
 * Two pages want this board: free play, which deals an unlimited stream of
 * puzzles, and the daily, which hands over one fixed puzzle and keeps a
 * leaderboard. The board itself - painting the position, handling a
 * click/tap/keyboard move, checking it against the puzzle's solution line,
 * and auto-playing the reply - is identical in both, so it lives here and
 * each page supplies the parts that differ (deal, callbacks, resume state).
 *
 * chess.js owns every rule of chess. This file only ever asks it "is this
 * legal" and "did this end in checkmate" - it never re-implements movement,
 * check, or mate detection itself.
 */

import { Chess, type Square } from "chess.js";
import type { ChessPuzzle } from "../data/chess-puzzles";

/** How far into the puzzle a resumed board should fast-forward. */
export interface ChessResume {
  /** How many plies of the solution (player and reply both) are already played. */
  ply: number;
  /** Move attempts already spent on this puzzle, right or wrong. */
  attempts: number;
}

export interface ChessBoardOptions {
  /** Where a fresh puzzle comes from. Free play deals one; the daily hands over the day's. */
  deal?: () => ChessPuzzle;
  /** Runs after a puzzle is built and painted. */
  onBuild?: (puzzle: ChessPuzzle) => void;
  /**
   * Runs once, on the very first legal move you attempt on this puzzle -
   * right or wrong either way counts as starting. Starts the daily clock.
   * Never fires again for a board resumed with attempts already spent.
   */
  onFirstMove?: () => void;
  /** Runs after every attempted legal move, right or wrong, with the running total. */
  onAttempt?: (info: { attempts: number; correct: boolean }) => void;
  /**
   * Runs after the scripted reply lands, once a correct move has advanced
   * the puzzle but not yet solved it. A page that persists mid-game progress
   * across a reload wants this in addition to `onAttempt`, since the ply the
   * board is sitting on only reaches its settled, even value here.
   */
  onReply?: () => void;
  /** Runs once when the puzzle is actually solved (the mating move lands). */
  onSolved?: (info: { attempts: number }) => void;
  /** Handles the win panel's next-puzzle action when the page has extra state to reset. */
  onNext?: () => void;
  /**
   * Lets a page write its own status line. Return a string to override, or
   * nothing to keep the default move count and side to move.
   */
  statusFor?: (info: {
    toMove: "w" | "b";
    attempts: number;
    solved: boolean;
    check: boolean;
  }) => string | undefined;
}

export interface ChessBoard {
  /** Deals and paints a fresh puzzle (or the one given). Resumes progress if given. */
  build: (puzzle?: ChessPuzzle, resume?: ChessResume) => void;
  /** The puzzle on screen right now. */
  current: () => ChessPuzzle | null;
  /** How many solution plies (player and reply both) are applied right now. */
  ply: () => number;
  /** Puts the current puzzle's position back to the start. Keeps the attempt count. */
  resetPosition: () => void;
  /**
   * Lays the solved position out instantly, without announcing a win. For
   * coming back to a daily you already finished.
   */
  reveal: () => void;
  /** Locks the board so no further moves register. */
  freeze: () => void;
  /** Unlocks it again. */
  thaw: () => void;
  /** How many attempts have been spent on the puzzle on screen right now. */
  attempts: () => number;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareAt(row: number, col: number): string {
  return `${FILES[col]}${8 - row}`;
}

function rowColOf(square: string): [number, number] {
  const col = FILES.indexOf(square[0] ?? "a");
  const row = 8 - Number(square[1] ?? "8");
  return [row, col];
}

/** Splits a UCI move ("e2e4", "e7e8q") into the shape chess.js's move() wants. */
function fromUci(uci: string): { from: string; to: string; promotion?: string } {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined };
}

const GLYPH: Record<string, string> = {
  wk: "\u2654",
  wq: "\u2655",
  wr: "\u2656",
  wb: "\u2657",
  wn: "\u2658",
  wp: "\u2659",
  bk: "\u265a",
  bq: "\u265b",
  br: "\u265c",
  bb: "\u265d",
  bn: "\u265e",
  bp: "\u265f",
};

const PIECE_NAME: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** A pause long enough to see your own move land before the board answers. */
const REPLY_DELAY_MS = 550;
/** How long a rejected move flashes before the highlight clears. */
const REJECT_FLASH_MS = 450;

export function mountChess(options: ChessBoardOptions = {}): ChessBoard {
  const board = document.getElementById("chess-board") as HTMLDivElement;
  const status = document.getElementById("chess-status") as HTMLSpanElement;
  const win = document.getElementById("chess-win") as HTMLDivElement;
  const winNote = document.getElementById("chess-win-note") as HTMLParagraphElement;
  const nextButton = document.getElementById("chess-next") as HTMLButtonElement | null;

  let chess = new Chess();
  let puzzle: ChessPuzzle | null = null;
  /** How many of the puzzle's solution plies (player and reply both) are applied. */
  let ply = 0;
  /** Move attempts spent on the current puzzle, right or wrong. */
  let attempts = 0;
  let selected: string | null = null;
  let solved = false;
  let frozen = false;
  /** True for the short pause between your move landing and the reply playing. */
  let busy = false;
  /** Whether the first-move callback has already fired for this puzzle. */
  let started = false;
  let lastMove: { from: string; to: string } | null = null;
  let replyTimer: ReturnType<typeof setTimeout> | null = null;
  let focusSquare = "a8";

  function pieceName(type: string): string {
    return PIECE_NAME[type] ?? type;
  }

  function describe(square: string, piece: { type: string; color: "w" | "b" } | undefined): string {
    if (!piece) return `${square}, empty`;
    const color = piece.color === "w" ? "White" : "Black";
    return `${square}, ${color} ${pieceName(piece.type)}`;
  }

  /** The square the side to move's king sits on, only when that side is in check. */
  function checkSquare(): string | null {
    if (!chess.isCheck()) return null;
    const turn = chess.turn();
    const rows = chess.board();
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = rows[row]?.[col];
        if (piece && piece.type === "k" && piece.color === turn) return squareAt(row, col);
      }
    }
    return null;
  }

  function setStatus() {
    const check = chess.isCheck();
    const message = options.statusFor?.({ toMove: chess.turn(), attempts, solved, check });
    if (message !== undefined) {
      status.textContent = message;
      return;
    }
    if (solved) {
      status.textContent = "Checkmate \u2014 solved!";
      return;
    }
    const side = chess.turn() === "w" ? "White" : "Black";
    const moveWord = `${attempts} move${attempts === 1 ? "" : "s"}`;
    const checkNote = check ? ", check" : "";
    status.textContent = attempts ? `${moveWord} \u00b7 ${side} to move${checkNote}` : `${side} to move${checkNote}`;
  }

  function paint() {
    const legal = new Set<string>(
      selected ? chess.moves({ square: selected as Square, verbose: true }).map((move) => move.to as string) : []
    );
    const check = checkSquare();

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const square = squareAt(row, col);
        const index = row * 8 + col;
        const button = board.children[index] as HTMLButtonElement | undefined;
        if (!button) continue;

        const piece = chess.get(square as Square);
        const key = piece ? `${piece.color}${piece.type}` : "";
        button.textContent = key ? (GLYPH[key] ?? "") : "";

        if (selected === square) button.dataset.selected = "true";
        else delete button.dataset.selected;

        if (legal.has(square)) button.dataset.legal = piece ? "capture" : "move";
        else delete button.dataset.legal;

        if (lastMove && (lastMove.from === square || lastMove.to === square)) button.dataset.last = "true";
        else delete button.dataset.last;

        if (check === square) button.dataset.check = "true";
        else delete button.dataset.check;

        button.setAttribute("aria-label", describe(square, piece));
      }
    }

    setStatus();
  }

  function flashReject(square: string) {
    const button = board.querySelector<HTMLButtonElement>(`[data-square="${square}"]`);
    if (!button) return;
    button.dataset.rejected = "true";
    setTimeout(() => {
      delete button.dataset.rejected;
    }, REJECT_FLASH_MS);
  }

  function playReply() {
    replyTimer = null;
    if (!puzzle) return;
    const { from, to, promotion } = fromUci(puzzle.solution[ply]!);
    chess.move({ from, to, promotion });
    ply += 1;
    lastMove = { from, to };
    busy = false;
    paint();
    options.onReply?.();
  }

  function attemptMove(move: { from: string; to: string; promotion?: string }) {
    if (!puzzle) return;
    selected = null;

    const expected = puzzle.solution[ply];
    const played = `${move.from}${move.to}${move.promotion ?? ""}`;

    attempts += 1;
    const firstEver = !started;
    started = true;
    if (firstEver) options.onFirstMove?.();

    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const checkmate = chess.isCheckmate();
    const correct = played === expected || checkmate;

    if (correct) {
      ply += 1;
      lastMove = { from: move.from, to: move.to };

      // A position can have more than one mating move. The authored line tells
      // the board how to answer before mate, but chess.js is authoritative once
      // the player has actually ended the game.
      if (checkmate) {
        ply = puzzle.solution.length;
        solved = true;
        paint();
        winNote.textContent = `Checkmate found in ${attempts} move${attempts === 1 ? "" : "s"}.`;
        win.hidden = false;
        win.setAttribute("aria-hidden", "false");
        nextButton?.focus();
        options.onAttempt?.({ attempts, correct: true });
        options.onSolved?.({ attempts });
        return;
      }

      paint();
      options.onAttempt?.({ attempts, correct: true });

      // The reply is scripted, not computed, so there is nothing to wait on -
      // the pause is purely so the player's own move is visible for a beat
      // before the board answers it.
      busy = true;
      replyTimer = setTimeout(playReply, REPLY_DELAY_MS);
    } else {
      // Legal, but off the line: play it to prove it was legal, then undo it.
      // The position is exactly what it was - the attempt still counts.
      chess.undo();
      flashReject(move.to);
      paint();
      options.onAttempt?.({ attempts, correct: false });
    }
  }

  function handleActivate(square: string) {
    if (frozen || solved || busy || !puzzle) return;

    if (selected === square) {
      selected = null;
      paint();
      return;
    }

    const piece = chess.get(square as Square);
    if (piece && piece.color === chess.turn()) {
      selected = square;
      paint();
      return;
    }

    if (!selected) return;

    const targets = chess.moves({ square: selected as Square, verbose: true });
    const match = targets.find((move) => move.to === square);
    if (!match) {
      // Not a legal destination for the piece you had selected - cancels the
      // selection quietly. Only an actually-legal move counts as an attempt.
      selected = null;
      paint();
      return;
    }

    attemptMove({ from: match.from, to: match.to, promotion: match.promotion });
  }

  function setRoving(square: string) {
    const previous = board.querySelector<HTMLButtonElement>(`[data-square="${focusSquare}"]`);
    if (previous) previous.tabIndex = -1;
    const next = board.querySelector<HTMLButtonElement>(`[data-square="${square}"]`);
    if (next) next.tabIndex = 0;
    focusSquare = square;
  }

  function moveFocus(square: string) {
    setRoving(square);
    board.querySelector<HTMLButtonElement>(`[data-square="${square}"]`)?.focus();
  }

  function renderGrid() {
    board.replaceChildren();
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const square = squareAt(row, col);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cell";
        button.dataset.square = square;
        button.dataset.shade = (row + col) % 2 === 0 ? "light" : "dark";
        button.tabIndex = row === 0 && col === 0 ? 0 : -1;
        board.append(button);
      }
    }
    focusSquare = "a8";
  }

  /** Mechanically replays the first `count` solution plies - no callbacks, no delay. */
  function fastForward(count: number) {
    if (!puzzle) return;
    const target = Math.min(Math.max(count, 0), puzzle.solution.length);
    for (let i = 0; i < target; i += 1) {
      const { from, to, promotion } = fromUci(puzzle.solution[i]!);
      chess.move({ from, to, promotion });
      lastMove = { from, to };
    }
    ply = target;

    if (ply === puzzle.solution.length) {
      solved = true;
      return;
    }

    // An odd ply means the reload landed between the player's move and the
    // scripted reply. The pause already happened before the reload, so there
    // is no reason to make the player sit through it again.
    if (ply % 2 === 1) {
      const { from, to, promotion } = fromUci(puzzle.solution[ply]!);
      chess.move({ from, to, promotion });
      ply += 1;
      lastMove = { from, to };
    }
  }

  function build(puzzleArg?: ChessPuzzle, resume?: ChessResume) {
    const next = puzzleArg ?? options.deal?.();
    if (!next) throw new Error("mountChess: no puzzle to deal.");

    if (replyTimer !== null) {
      clearTimeout(replyTimer);
      replyTimer = null;
    }

    puzzle = next;
    chess = new Chess(puzzle.fen);
    ply = 0;
    attempts = resume?.attempts ?? 0;
    started = attempts > 0;
    selected = null;
    solved = false;
    frozen = false;
    busy = false;
    lastMove = null;
    win.hidden = true;
    win.setAttribute("aria-hidden", "true");

    renderGrid();
    if (resume && resume.ply > 0) fastForward(resume.ply);

    paint();
    options.onBuild?.(puzzle);
  }

  function resetPosition() {
    if (!puzzle) return;
    if (replyTimer !== null) {
      clearTimeout(replyTimer);
      replyTimer = null;
    }
    chess = new Chess(puzzle.fen);
    ply = 0;
    selected = null;
    solved = false;
    busy = false;
    lastMove = null;
    win.hidden = true;
    win.setAttribute("aria-hidden", "true");
    paint();
  }

  function reveal() {
    if (!puzzle) return;
    if (replyTimer !== null) {
      clearTimeout(replyTimer);
      replyTimer = null;
    }
    chess = new Chess(puzzle.fen);
    ply = 0;
    for (const uci of puzzle.solution) {
      const { from, to, promotion } = fromUci(uci);
      chess.move({ from, to, promotion });
      ply += 1;
      lastMove = { from, to };
    }
    selected = null;
    busy = false;
    // Set before painting so paint treats this as an already-won board and
    // does not run through attemptMove's win path (which is not called here
    // at all, but this keeps setStatus's "solved" branch showing).
    solved = true;
    win.hidden = true;
    win.setAttribute("aria-hidden", "true");
    paint();
  }

  board.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    const square = button?.dataset.square;
    if (!square) return;
    setRoving(square);
    handleActivate(square);
  });

  board.addEventListener("keydown", (event) => {
    if (frozen) return;
    if (event.key === "Escape") {
      if (selected) {
        selected = null;
        paint();
      }
      return;
    }
    const delta = ARROW_DELTAS[event.key];
    if (!delta) return;
    event.preventDefault();
    const [row, col] = rowColOf(focusSquare);
    const nextRow = Math.min(7, Math.max(0, row + delta[0]));
    const nextCol = Math.min(7, Math.max(0, col + delta[1]));
    moveFocus(squareAt(nextRow, nextCol));
  });

  nextButton?.addEventListener("click", () => {
    if (options.onNext) options.onNext();
    else build();
  });

  return {
    build,
    current: () => puzzle,
    ply: () => ply,
    resetPosition,
    reveal,
    freeze: () => {
      frozen = true;
    },
    thaw: () => {
      frozen = false;
    },
    attempts: () => attempts,
  };
}
