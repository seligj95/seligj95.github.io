/**
 * What this browser has finished today.
 *
 * There are no accounts, so "have you played" is a question only the browser
 * can answer. It lives in localStorage under one key per game per day, which
 * means the record expires on its own: yesterday's key is simply never read
 * again. Clearing your browser gets you another go, and that is fine — the
 * record keeps the day honest, it does not police it.
 *
 * Both the game page and the daily tab read this, so the key format lives here
 * rather than being spelled out at each call site.
 */

import { dayFor, type DayString } from "./daily";

export interface Done {
  /**
   * Whatever the game is scored on: seconds for Queens, including any hint
   * penalty, guesses for Contexto, and move attempts for Chess.
   */
  score: number;
  hints: number;
  /**
   * The timestamp the API gave your entry, set once your score has gone onto
   * the shared board. Kept rather than a plain flag so a later visit can still
   * pick your row out of the list and highlight it.
   */
  posted?: string;
  /**
   * Set when the answer was revealed instead of found. The day is spent either
   * way, which is why this is a `Done` at all, but `score` then counts the
   * guesses made before stopping rather than the guesses it took — so it is
   * never offered to the board, and never shown as though it were a result.
   */
  gaveUp?: boolean;
  /**
   * Seconds elapsed when the run finished, for a game scored on moves rather
   * than time. Absent for games that do not need it.
   */
  elapsed?: number;
}

export function doneKey(game: string, day: DayString = dayFor()): string {
  return `daily-${game}-${day}`;
}

/**
 * Where a half-played game is kept.
 *
 * Queens does not need this: it is scored on a clock that keeps running whether
 * the page is open or not, so a reload costs you nothing you had not already
 * spent. A game scored on guesses is different — reloading would hand back a
 * clean count, which turns a refresh into a way of undoing a bad guess. So the
 * guesses go to storage as they are made and are replayed on the way back in.
 */
export function progressKey(game: string, day: DayString = dayFor()): string {
  return `daily-${game}-${day}-guesses`;
}

/** The name you last posted under, offered back so you need not retype it. */
export const NAME_KEY = "daily-name";

/**
 * Every read is wrapped: storage can be switched off entirely, and a half
 * written value from an older version of the page should not take a page down.
 */
export function readDone(game: string, day: DayString = dayFor()): Done | null {
  try {
    const raw = window.localStorage.getItem(doneKey(game, day));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Done & { seconds?: number };
    // Records written before the rename only carry `seconds`, and today's may
    // well be one of them.
    const score = parsed?.score ?? parsed?.seconds;
    return typeof score === "number" ? { ...parsed, score } : null;
  } catch {
    return null;
  }
}

export function writeDone(game: string, done: Done, day: DayString = dayFor()): void {
  try {
    window.localStorage.setItem(doneKey(game, day), JSON.stringify(done));
  } catch {
    // A browser with storage switched off just loses the one-attempt lock.
  }
}

/** The words guessed so far today, oldest first. */
export function readGuesses(game: string, day: DayString = dayFor()): string[] {
  try {
    const raw = window.localStorage.getItem(progressKey(game, day));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((word): word is string => typeof word === "string");
  } catch {
    return [];
  }
}

export function writeGuesses(
  game: string,
  guesses: string[],
  day: DayString = dayFor(),
): void {
  try {
    window.localStorage.setItem(progressKey(game, day), JSON.stringify(guesses));
  } catch {
    // Without storage a reload starts the day over. Nothing else breaks.
  }
}

/**
 * Where a game's own structured mid-game state lives - a position, a ply
 * count, an attempt count, whatever it needs to pick back up after a reload.
 * Distinct from `progressKey`'s plain array of guesses, and generic rather
 * than named for one game, so any future daily game that needs more than a
 * list can reuse it instead of growing its own key format.
 */
export function stateKey(game: string, day: DayString = dayFor()): string {
  return `daily-${game}-${day}-state`;
}

export function readState<T>(game: string, day: DayString = dayFor()): T | null {
  try {
    const raw = window.localStorage.getItem(stateKey(game, day));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeState<T>(game: string, state: T, day: DayString = dayFor()): void {
  try {
    window.localStorage.setItem(stateKey(game, day), JSON.stringify(state));
  } catch {
    // Without storage a reload starts the puzzle over. Nothing else breaks.
  }
}

export function readName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeName(name: string): void {
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {
    // Remembering the name is a nicety, not state.
  }
}
