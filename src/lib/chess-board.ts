/**
 * The chess board, as a thing you can mount on a page.
 *
 * Two pages want this board: free play, which deals an unlimited stream of
 * puzzles, and the daily, which hands over one fixed puzzle and keeps a
 * leaderboard. The board itself - painting the position, handling a
 * click/tap/keyboard move, choosing the defense's reply, and detecting mate -
 * is identical in both, so it lives here and
 * each page supplies the parts that differ (deal, callbacks, resume state).
 *
 * chess.js owns every rule of chess. js-chess-engine chooses moves for the
 * defense and powers hints from positions the authored line never visited.
 */

import { Chess, type Square } from "chess.js";
import { ai } from "js-chess-engine";
import type { ChessPuzzle } from "../data/chess-puzzles";

/** Everything needed to reconstruct a board after a reload. */
export interface ChessResume {
  /** Legal moves already played, player and defense alternating, in UCI. */
  moves?: string[];
  /** Move attempts already spent on this puzzle. */
  attempts: number;
  /** Positions whose hints were already charged before a reload. */
  hintedPositions?: string[];
  /** Legacy authored-line progress, migrated to `moves` when read. */
  ply?: number;
  /** Legacy authored-line positions whose hints were already charged. */
  hintedPlies?: number[];
}

export interface ChessBoardOptions {
  /** Where a fresh puzzle comes from. Free play deals one; the daily hands over the day's. */
  deal?: () => ChessPuzzle;
  /** Runs after a puzzle is built and painted. */
  onBuild?: (puzzle: ChessPuzzle) => void;
  /**
   * Runs once, on the very first legal move you make on this puzzle. Starts
   * the daily clock.
   * Never fires again for a board resumed with attempts already spent.
   */
  onFirstMove?: () => void;
  /** Runs after every legal player move with the running total. */
  onAttempt?: (info: { attempts: number }) => void;
  /** Runs when a hint is shown. The hint itself has already added one attempt. */
  onHint?: (info: { attempts: number; position: string }) => void;
  /**
   * Runs after the defense's reply lands. A page that persists mid-game
   * progress wants this in addition to `onAttempt`.
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
  /** Legal moves applied right now, player and defense alternating, in UCI. */
  moves: () => string[];
  /** Puts the current puzzle's position back to the start. Keeps the attempt count. */
  resetPosition: () => void;
  /**
   * Lays the solved position out instantly, without announcing a win. For
   * coming back to a daily you already finished.
   */
  reveal: (gaveUp?: boolean) => void;
  /** Highlights the engine's best move from the current position and charges one attempt. */
  hint: () => boolean;
  /** Whether the current position still has an unused hint. */
  canHint: () => boolean;
  /** Position keys whose hints have already been charged. */
  hintHistory: () => string[];
  /** Reveals the authored solution and locks the board. */
  giveUp: () => boolean;
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

function toUci(move: { from: string; to: string; promotion?: string }): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

/** Repetition-sensitive enough for charging one hint per actual position. */
function positionKey(chess: Chess): string {
  return chess.fen().split(" ").slice(0, 4).join(" ");
}

/** The strongest deterministic move the lightweight browser engine finds. */
function engineMove(chess: Chess): { from: string; to: string; promotion?: string } {
  const result = ai(chess.fen(), AI_OPTIONS);
  const entry = Object.entries(result.move)[0];
  if (!entry) throw new Error("Chess engine returned no move for a playable position.");

  const from = entry[0].toLowerCase();
  const to = entry[1].toLowerCase();
  const candidates = chess
    .moves({ square: from as Square, verbose: true })
    .filter((move) => move.to === to);
  const move = candidates.find((candidate) => candidate.promotion === "q") ?? candidates[0];
  if (!move) throw new Error(`Chess engine returned an illegal move: ${from}${to}.`);

  return { from: move.from, to: move.to, promotion: move.promotion };
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
const AI_OPTIONS = {
  level: 4,
  play: false,
  randomness: 0,
  ttSizeMB: 0.25,
} as const;

export function mountChess(options: ChessBoardOptions = {}): ChessBoard {
  const board = document.getElementById("chess-board") as HTMLDivElement;
  const status = document.getElementById("chess-status") as HTMLSpanElement;
  const win = document.getElementById("chess-win") as HTMLDivElement;
  const winNote = document.getElementById("chess-win-note") as HTMLParagraphElement;
  const nextButton = document.getElementById("chess-next") as HTMLButtonElement | null;

  let chess = new Chess();
  let puzzle: ChessPuzzle | null = null;
  /** Legal moves played, player and defense alternating, in UCI. */
  let moveHistory: string[] = [];
  /** Player moves and hints spent on the current puzzle. */
  let attempts = 0;
  let selected: string | null = null;
  let solved = false;
  let frozen = false;
  /** True for the short pause between your move landing and the reply playing. */
  let busy = false;
  /** Whether the first-move callback has already fired for this puzzle. */
  let started = false;
  let lastMove: { from: string; to: string } | null = null;
  let hintMove: { from: string; to: string } | null = null;
  const hintedPositions = new Set<string>();
  let feedback = "";
  let gaveUp = false;
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
    if (feedback) {
      status.textContent = feedback;
      return;
    }
    const message = options.statusFor?.({ toMove: chess.turn(), attempts, solved, check });
    if (message !== undefined) {
      status.textContent = message;
      return;
    }
    if (solved) {
      status.textContent = gaveUp ? "Solution revealed." : "Checkmate \u2014 solved!";
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

        const hintRole =
          hintMove?.from === square
            ? ", hint: move this piece"
            : hintMove?.to === square
              ? ", hint destination"
              : "";
        if (hintMove?.from === square) button.dataset.hint = "from";
        else if (hintMove?.to === square) button.dataset.hint = "to";
        else delete button.dataset.hint;

        button.draggable = Boolean(piece && piece.color === chess.turn() && !frozen && !solved && !busy);
        button.setAttribute("aria-label", `${describe(square, piece)}${hintRole}`);
      }
    }

    setStatus();
  }

  function stopWithoutMate() {
    frozen = true;
    busy = false;
    hintMove = null;
    if (chess.isCheckmate()) {
      feedback = "Checkmate \u2014 Black defended the position. Reset to try again.";
    } else if (chess.isStalemate()) {
      feedback = "Stalemate \u2014 reset to try for checkmate again.";
    } else {
      feedback = "Draw \u2014 reset to try for checkmate again.";
    }
    paint();
  }

  function applyEngineReply() {
    const move = engineMove(chess);
    const played = chess.move(move);
    moveHistory.push(toUci(played));
    lastMove = { from: played.from, to: played.to };
  }

  function playReply() {
    replyTimer = null;
    if (!puzzle || chess.isGameOver()) return;
    applyEngineReply();
    busy = false;
    if (chess.isGameOver()) stopWithoutMate();
    else paint();
    options.onReply?.();
  }

  function attemptMove(move: { from: string; to: string; promotion?: string }) {
    if (!puzzle) return;
    selected = null;

    attempts += 1;
    const firstEver = !started;
    started = true;
    if (firstEver) options.onFirstMove?.();

    const played = chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    moveHistory.push(toUci(played));
    const checkmate = chess.isCheckmate();
    hintMove = null;
    feedback = "";
    lastMove = { from: played.from, to: played.to };

    if (checkmate) {
      solved = true;
      paint();
      winNote.textContent = `Checkmate found in ${attempts} move${attempts === 1 ? "" : "s"}.`;
      win.hidden = false;
      win.setAttribute("aria-hidden", "false");
      nextButton?.focus();
      options.onAttempt?.({ attempts });
      options.onSolved?.({ attempts });
      return;
    }

    options.onAttempt?.({ attempts });
    if (chess.isGameOver()) {
      stopWithoutMate();
      return;
    }

    // The pause is purely so the player's move is visible before Black answers.
    busy = true;
    paint();
    replyTimer = setTimeout(playReply, REPLY_DELAY_MS);
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
      feedback = "";
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
      feedback = "That piece cannot move there. Pick it up again and use a highlighted square.";
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

  /** Replays saved UCI moves without callbacks or animation. */
  function replayMoves(moves: string[]): boolean {
    for (const uci of moves) {
      const move = fromUci(uci);
      const legal = chess
        .moves({ square: move.from as Square, verbose: true })
        .find(
          (candidate) =>
            candidate.to === move.to &&
            (candidate.promotion ?? undefined) === move.promotion,
        );
      if (!legal) return false;
      const played = chess.move({
        from: legal.from,
        to: legal.to,
        promotion: legal.promotion,
      });
      moveHistory.push(toUci(played));
      lastMove = { from: played.from, to: played.to };
    }
    return true;
  }

  /** Migrates progress saved before arbitrary legal moves were supported. */
  function fastForwardLegacy(count: number) {
    if (!puzzle) return;
    const target = Math.min(Math.max(count, 0), puzzle.solution.length);
    replayMoves(puzzle.solution.slice(0, target));

    // An odd ply means the reload landed between the player's move and the
    // old scripted reply. Settle that historical reply before switching the
    // position to engine play.
    if (target < puzzle.solution.length && target % 2 === 1) {
      replayMoves([puzzle.solution[target]!]);
    }
  }

  function migrateLegacyHints(plies: number[]) {
    if (!puzzle) return;
    const wanted = new Set(plies.filter((ply) => Number.isInteger(ply) && ply >= 0));
    if (wanted.size === 0) return;

    const position = new Chess(puzzle.fen);
    for (let ply = 0; ply <= puzzle.solution.length; ply += 1) {
      if (wanted.has(ply) && position.turn() === "w" && !position.isGameOver()) {
        hintedPositions.add(positionKey(position));
      }
      const uci = puzzle.solution[ply];
      if (!uci) break;
      position.move(fromUci(uci));
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
    moveHistory = [];
    attempts = resume?.attempts ?? 0;
    started = attempts > 0;
    selected = null;
    solved = false;
    frozen = false;
    busy = false;
    lastMove = null;
    hintMove = null;
    hintedPositions.clear();
    for (const position of resume?.hintedPositions ?? []) hintedPositions.add(position);
    migrateLegacyHints(resume?.hintedPlies ?? []);
    feedback = "";
    gaveUp = false;
    win.hidden = true;
    win.setAttribute("aria-hidden", "true");

    renderGrid();
    if (resume?.moves?.length && !replayMoves(resume.moves)) {
      chess = new Chess(puzzle.fen);
      moveHistory = [];
      lastMove = null;
      feedback = "The saved board no longer matched this puzzle, so the position returned to the start.";
    } else if (resume?.ply) {
      fastForwardLegacy(resume.ply);
    }

    if (chess.isCheckmate()) {
      if (chess.turn() === "b") solved = true;
      else stopWithoutMate();
    } else if (chess.isGameOver()) {
      stopWithoutMate();
    } else if (chess.turn() === "b") {
      // A reload can land during the reply pause. Settle the deterministic
      // defense immediately so reopening never leaves Black waiting on input.
      applyEngineReply();
      if (chess.isGameOver()) stopWithoutMate();
    }

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
    moveHistory = [];
    selected = null;
    solved = false;
    frozen = false;
    busy = false;
    lastMove = null;
    hintMove = null;
    feedback = "";
    gaveUp = false;
    win.hidden = true;
    win.setAttribute("aria-hidden", "true");
    paint();
  }

  function reveal(asGiveUp = false) {
    if (!puzzle) return;
    if (replyTimer !== null) {
      clearTimeout(replyTimer);
      replyTimer = null;
    }
    chess = new Chess(puzzle.fen);
    moveHistory = [];
    for (const uci of puzzle.solution) {
      const played = chess.move(fromUci(uci));
      moveHistory.push(toUci(played));
      lastMove = { from: played.from, to: played.to };
    }
    selected = null;
    busy = false;
    hintMove = null;
    feedback = "";
    gaveUp = asGiveUp;
    // Set before painting so paint treats this as an already-won board and
    // does not run through attemptMove's win path (which is not called here
    // at all, but this keeps setStatus's "solved" branch showing).
    solved = true;
    win.hidden = true;
    win.setAttribute("aria-hidden", "true");
    paint();
  }

  function canHint(): boolean {
    return (
      !frozen &&
      !solved &&
      !busy &&
      chess.turn() === "w" &&
      !chess.isGameOver() &&
      !hintedPositions.has(positionKey(chess))
    );
  }

  function hint(): boolean {
    if (!canHint() || !puzzle) return false;
    const position = positionKey(chess);
    const { from, to } = engineMove(chess);
    const piece = chess.get(from as Square);
    if (!piece) throw new Error(`Chess engine selected an empty square: ${from}.`);

    attempts += 1;
    const firstEver = !started;
    started = true;
    if (firstEver) options.onFirstMove?.();

    selected = null;
    hintMove = { from, to };
    hintedPositions.add(position);
    feedback = `Hint: move the ${pieceName(piece.type)} from ${from} to ${to}.`;
    paint();
    options.onHint?.({ attempts, position });
    return true;
  }

  function giveUp(): boolean {
    if (solved || busy || !puzzle) return false;
    frozen = true;
    reveal(true);
    return true;
  }

  board.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    const square = button?.dataset.square;
    if (!square) return;
    setRoving(square);
    handleActivate(square);
  });

  board.addEventListener("dragstart", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    const square = button?.dataset.square;
    const piece = square ? chess.get(square as Square) : undefined;
    if (!square || !piece || piece.color !== chess.turn() || frozen || solved || busy) {
      event.preventDefault();
      return;
    }
    feedback = "";
    selected = square;
    event.dataTransfer?.setData("text/plain", square);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    paint();
  });

  board.addEventListener("dragover", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    const square = button?.dataset.square;
    if (!selected || !square) return;
    event.preventDefault();
  });

  board.addEventListener("drop", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    const square = button?.dataset.square;
    if (!square) return;
    event.preventDefault();
    setRoving(square);
    handleActivate(square);
  });

  board.addEventListener("dragend", () => {
    if (!selected) return;
    selected = null;
    paint();
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
    moves: () => [...moveHistory],
    resetPosition,
    reveal,
    hint,
    canHint,
    hintHistory: () => [...hintedPositions],
    giveUp,
    freeze: () => {
      frozen = true;
    },
    thaw: () => {
      if (!chess.isGameOver()) frozen = false;
    },
    attempts: () => attempts,
  };
}
