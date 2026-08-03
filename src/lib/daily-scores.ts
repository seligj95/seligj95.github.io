/**
 * The browser half of the daily leaderboard.
 *
 * Everything here is best-effort: the board is a nice-to-have on top of a game
 * that works entirely offline, so a failed request never blocks play and never
 * shows an error people can act on. It just quietly leaves the list out.
 */

/** What a board ranks by. Lower is better either way. */
export type Scoring = "time" | "guesses" | "moves";

export interface Score {
  name: string;
  /** Seconds for a race, guesses for a word game, moves for a puzzle. */
  score: number;
  hints: number;
  at: string;
  /**
   * Seconds elapsed, for a "moves" board where move count alone can tie.
   * Absent for games that do not rank by moves - reading it back is always
   * safe either way, since `scoreText` only looks at it for that scoring.
   */
  elapsed?: number;
}

/**
 * The API mirrors `score` as `seconds` while older pages are still out there,
 * and an API deployed a moment behind the site sends only `seconds`. Reading
 * both means neither deploy has to land first.
 */
function readScore(row: Score & { seconds?: number }): Score {
  return { ...row, score: row.score ?? row.seconds ?? 0 };
}

export interface Board {
  count: number;
  scores: Score[];
}

export interface Submitted extends Board {
  entry: Score;
  place: number;
}

/**
 * Where the API lives. Overridable at build time with PUBLIC_SCORES_API, which
 * is how a local API or a preview deploy gets picked up.
 */
export const API_BASE: string =
  import.meta.env.PUBLIC_SCORES_API ?? "https://api.jordanselig.com";

/** Scaled to zero, so the first request of the day wakes the container. */
const TIMEOUT_MS = 20000;

function url(game: string, day: string): string {
  return `${API_BASE}/api/daily/${game}/${day}/scores`;
}

async function call(input: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: string } | null)?.error;
    throw new Error(error ?? `Request failed (${response.status}).`);
  }
  return body;
}

/** Returns null rather than throwing: a missing board is not worth an error. */
export async function fetchScores(game: string, day: string): Promise<Board | null> {
  try {
    const board = (await call(url(game, day))) as Board;
    return { ...board, scores: board.scores.map(readScore) };
  } catch {
    return null;
  }
}

/**
 * Throws on failure, unlike fetchScores, because somebody pressed a button and
 * deserves to be told it did not work.
 */
export async function submitScore(
  game: string,
  day: string,
  entry: { name: string; score: number; hints: number; elapsed?: number }
): Promise<Submitted> {
  const result = (await call(url(game, day), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  })) as Submitted;

  return { ...result, entry: readScore(result.entry), scores: result.scores.map(readScore) };
}

export function clockText(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "12 guesses", or "1 guess". */
export function guessText(guesses: number): string {
  return `${guesses} guess${guesses === 1 ? "" : "es"}`;
}

/** "3 moves", or "1 move". */
export function moveText(moves: number): string {
  return `${moves} move${moves === 1 ? "" : "s"}`;
}

/**
 * A score written the way its own game means it.
 *
 * A "moves" board also carries an elapsed time, which is the tiebreaker, so
 * it prints alongside the move count rather than replacing it.
 */
export function scoreText(score: number, scoring: Scoring = "time", elapsed?: number): string {
  if (scoring === "guesses") return guessText(score);
  if (scoring === "moves") {
    return elapsed === undefined ? moveText(score) : `${moveText(score)} \u00b7 ${clockText(elapsed)}`;
  }
  return clockText(score);
}

/** "2 hints", "1 hint", or nothing at all when none were taken. */
export function hintText(hints: number): string {
  if (!hints) return "";
  return `${hints} hint${hints === 1 ? "" : "s"}`;
}

/**
 * Draws a list of times into an `<ol>`.
 *
 * Shared by the game page and the daily tab so the two never drift apart. The
 * rows are built here rather than in markup, which is why their styles have to
 * be global — see ScoreRows.astro.
 */
export function drawScoreRows(
  list: HTMLOListElement,
  scores: Score[],
  /** The `at` of your own entry, so your row can be picked out of the list. */
  mine: string | null = null,
  scoring: Scoring = "time"
): void {
  list.replaceChildren();

  scores.forEach((score, index) => {
    const row = document.createElement("li");
    if (mine && score.at === mine) row.dataset.you = "";

    const place = document.createElement("span");
    place.className = "scores-place";
    place.textContent = `${index + 1}.`;

    const name = document.createElement("span");
    name.className = "scores-name";
    name.textContent = score.name;

    const time = document.createElement("span");
    time.className = "scores-time";
    time.textContent = scoreText(score.score, scoring, score.elapsed);

    const hints = hintText(score.hints);
    if (hints) {
      const note = document.createElement("span");
      note.className = "scores-hints";
      note.textContent = ` (${hints})`;
      time.append(note);
    }

    row.append(place, name, time);
    list.append(row);
  });
}

/** 1st, 2nd, 3rd, 4th... including the teens, which break the pattern. */
export function ordinal(place: number): string {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  const ones = place % 10;
  return `${place}${ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th"}`;
}
