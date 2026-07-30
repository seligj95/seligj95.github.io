/**
 * The browser half of the daily leaderboard.
 *
 * Everything here is best-effort: the board is a nice-to-have on top of a game
 * that works entirely offline, so a failed request never blocks play and never
 * shows an error people can act on. It just quietly leaves the list out.
 */

export interface Score {
  name: string;
  seconds: number;
  hints: number;
  at: string;
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
    return (await call(url(game, day))) as Board;
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
  entry: { name: string; seconds: number; hints: number }
): Promise<Submitted> {
  return (await call(url(game, day), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  })) as Submitted;
}

export function clockText(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** 1st, 2nd, 3rd, 4th... including the teens, which break the pattern. */
export function ordinal(place: number): string {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  const ones = place % 10;
  return `${place}${ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th"}`;
}
