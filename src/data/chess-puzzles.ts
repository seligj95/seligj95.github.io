/**
 * The curated checkmate puzzles.
 *
 * Each one is a FEN plus a solution line in UCI (`e2e4`, or `e7e8q` for a
 * promotion) - the player's moves and the automated reply, alternating,
 * player first. Live play may leave this line: a browser chess engine then
 * chooses Black's defense and powers hints from the resulting position. The
 * authored line remains a verified solution for Give up to reveal.
 *
 * `tests/chess-puzzles.test.ts` replays every line with chess.js and asserts
 * the final position is checkmate, so a typo here fails a test rather than
 * shipping a broken puzzle.
 */

export interface ChessPuzzle {
  id: string;
  /** How many of the player's own moves it takes, mate included. */
  mateIn: 1 | 2 | 3;
  /** The starting position, White to move, White is always the player. */
  fen: string;
  /**
   * The full line in UCI, player and reply alternating, player first and
   * player last (the mating move). Length is always `mateIn * 2 - 1`.
   */
  solution: string[];
}

const BASE_PUZZLES: ChessPuzzle[] = [
  // --- Mate in 1 ---------------------------------------------------------
  {
    id: "rook-rollercoaster",
    mateIn: 1,
    fen: "1k2R3/8/8/8/5R2/2K5/8/8 w - - 0 1",
    solution: ["f4f7"],
  },
  {
    id: "ladder-cutoff",
    mateIn: 1,
    fen: "k1K5/1R6/8/8/4B3/8/8/8 w - - 0 1",
    solution: ["b7c7"],
  },
  {
    id: "diagonal-strike",
    mateIn: 1,
    fen: "8/8/8/3Q4/8/8/1K6/3R3k w - - 0 1",
    solution: ["d5h1"],
  },
  {
    id: "corner-trap",
    mateIn: 1,
    fen: "8/8/8/4B3/6K1/8/k7/Q7 w - - 0 1",
    solution: ["a1b2"],
  },
  {
    id: "back-rank-classic",
    mateIn: 1,
    fen: "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
    solution: ["e1e8"],
  },
  // --- Mate in 2 ---------------------------------------------------------
  {
    id: "double-rook-drive",
    mateIn: 2,
    fen: "8/5R2/3R4/2K5/8/8/k7/8 w - - 0 1",
    solution: ["f7b7", "a2a3", "d6a6"],
  },
  {
    id: "lawnmower-finish",
    mateIn: 2,
    fen: "1k6/8/2K5/8/8/6R1/8/8 w - - 0 1",
    solution: ["g3a3", "b8c8", "a3a8"],
  },
  {
    id: "knight-assisted-rook",
    mateIn: 2,
    fen: "6k1/6R1/6K1/8/8/8/8/5N2 w - - 0 1",
    solution: ["g7f7", "g8h8", "f7f8"],
  },
  {
    id: "queen-rook-tandem",
    mateIn: 2,
    fen: "6k1/8/2K1Q3/2R5/8/8/8/8 w - - 0 1",
    solution: ["c5g5", "g8h8", "e6g8"],
  },
  {
    id: "queen-bishop-cross",
    mateIn: 2,
    fen: "8/8/8/8/3Q2B1/8/1K5k/8 w - - 0 1",
    solution: ["d4f2", "h2h1", "g4f3"],
  },
  // --- Mate in 3 ---------------------------------------------------------
  {
    id: "triple-rook-maneuver",
    mateIn: 3,
    fen: "2R5/8/8/8/4R3/8/8/K5k1 w - - 0 1",
    solution: ["c8c2", "g1h1", "e4e5", "h1g1", "e5e1"],
  },
  {
    id: "king-assisted-rook-mate",
    mateIn: 3,
    fen: "R7/8/8/8/2K5/8/8/Bk6 w - - 0 1",
    solution: ["c4d3", "b1c1", "a8b8", "c1d1", "b8b1"],
  },
  {
    id: "knight-king-rook",
    mateIn: 3,
    fen: "N7/4K2k/8/8/8/5R2/8/8 w - - 0 1",
    solution: ["e7f7", "h7h8", "a8c7", "h8h7", "f3h3"],
  },
  {
    id: "queen-knight-corner",
    mateIn: 3,
    fen: "8/5Q2/8/5K2/8/8/8/5N1k w - - 0 1",
    solution: ["f7a2", "h1g1", "a2e2", "g1h1", "e2h2"],
  },
  {
    id: "queen-bishop-drive",
    mateIn: 3,
    fen: "4Q3/7k/8/8/6B1/5K2/8/8 w - - 0 1",
    solution: ["e8f8", "h7g6", "f3f4", "g6h7", "g4f5"],
  },
];

/**
 * The base positions contain no pawns, castling rights or en-passant square, so
 * every symmetry of the board is still the same legal chess problem. Expanding
 * the hand-authored lines this way gives the daily a long cycle without
 * pretending a machine-generated position was curated by hand.
 */
const TRANSFORMS = [
  { id: "plain", at: (row: number, column: number) => [row, column] },
  { id: "turn-right", at: (row: number, column: number) => [column, 7 - row] },
  { id: "turn-around", at: (row: number, column: number) => [7 - row, 7 - column] },
  { id: "turn-left", at: (row: number, column: number) => [7 - column, row] },
  { id: "mirror", at: (row: number, column: number) => [row, 7 - column] },
  { id: "flip", at: (row: number, column: number) => [7 - row, column] },
  { id: "diagonal", at: (row: number, column: number) => [column, row] },
  { id: "anti-diagonal", at: (row: number, column: number) => [7 - column, 7 - row] },
] as const;

function squareAt(row: number, column: number): string {
  return `${"abcdefgh"[column]}${8 - row}`;
}

function transformSquare(
  square: string,
  at: (row: number, column: number) => readonly number[],
): string {
  const column = "abcdefgh".indexOf(square[0]!);
  const row = 8 - Number(square[1]);
  const [nextRow, nextColumn] = at(row, column);
  return squareAt(nextRow!, nextColumn!);
}

function transformFen(
  fen: string,
  at: (row: number, column: number) => readonly number[],
): string {
  const [position, ...rest] = fen.split(" ");
  const board = position!.split("/").map((rank) => {
    const squares: string[] = [];
    for (const char of rank) {
      if (/\d/.test(char)) squares.push(...new Array(Number(char)).fill(""));
      else squares.push(char);
    }
    return squares;
  });
  const changed = Array.from({ length: 8 }, () => new Array<string>(8).fill(""));

  board.forEach((rank, row) => {
    rank.forEach((piece, column) => {
      if (!piece) return;
      const [nextRow, nextColumn] = at(row, column);
      changed[nextRow!]![nextColumn!] = piece;
    });
  });

  const packed = changed.map((rank) => {
    let empty = 0;
    let out = "";
    for (const piece of rank) {
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) out += String(empty);
      empty = 0;
      out += piece;
    }
    if (empty) out += String(empty);
    return out;
  });
  return `${packed.join("/")} ${rest.join(" ")}`;
}

function transformPuzzle(
  puzzle: ChessPuzzle,
  transform: (typeof TRANSFORMS)[number],
): ChessPuzzle {
  return {
    ...puzzle,
    id: transform.id === "plain" ? puzzle.id : `${puzzle.id}-${transform.id}`,
    fen: transformFen(puzzle.fen, transform.at),
    solution: puzzle.solution.map((move) => {
      const promotion = move.slice(4);
      return `${transformSquare(move.slice(0, 2), transform.at)}${transformSquare(move.slice(2, 4), transform.at)}${promotion}`;
    }),
  };
}

/*
 * The original scripted board could display positions that were useful as
 * diagrams but impossible in a legal game (Black already in check while White
 * had the move). A real opponent correctly refuses those. Six more transformed
 * positions let the level-four engine force a draw against its own best White
 * play, so they are also withheld from live rotation.
 */
const INVALID_START_FAMILIES = [
  "rook-rollercoaster",
  "diagonal-strike",
  "corner-trap",
  "knight-assisted-rook",
  "queen-rook-tandem",
];
const ENGINE_DRAW_POSITIONS = new Set([
  "lawnmower-finish-flip",
  "queen-bishop-cross-turn-right",
  "triple-rook-maneuver-flip",
  "knight-king-rook-turn-around",
  "knight-king-rook-diagonal",
  "queen-knight-corner-turn-around",
]);

function enginePlayable(puzzle: ChessPuzzle): boolean {
  const invalidFamily = INVALID_START_FAMILIES.some(
    (family) => puzzle.id === family || puzzle.id.startsWith(`${family}-`),
  );
  return !invalidFamily && !ENGINE_DRAW_POSITIONS.has(puzzle.id);
}

const seen = new Set<string>();
export const puzzles: ChessPuzzle[] = BASE_PUZZLES.flatMap((puzzle) =>
  // A file mirror preserves pawn direction and keeps pawns off the first and
  // eighth ranks. The other symmetries are safe only for pawnless positions.
  (/[pP]/.test(puzzle.fen.split(" ")[0]!) ? [TRANSFORMS[0], TRANSFORMS[4]] : TRANSFORMS)
    .map((transform) => transformPuzzle(puzzle, transform)),
).filter((puzzle) => {
  if (!enginePlayable(puzzle)) return false;
  if (seen.has(puzzle.fen)) return false;
  seen.add(puzzle.fen);
  return true;
});

export function puzzleById(id: string): ChessPuzzle {
  const puzzle = puzzles.find((entry) => entry.id === id);
  if (!puzzle) throw new Error(`Unknown chess puzzle: ${id}`);
  return puzzle;
}

/**
 * A puzzle for free play. Excludes whatever you just had, so long as there is
 * something else to deal - with one puzzle left it has no choice but to
 * repeat it.
 */
export function randomPuzzle(excludeId?: string): ChessPuzzle {
  const candidates =
    puzzles.length > 1 ? puzzles.filter((entry) => entry.id !== excludeId) : puzzles;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
