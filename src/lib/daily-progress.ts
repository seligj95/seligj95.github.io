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
  /** Elapsed time in seconds, including any hint penalty. */
  seconds: number;
  hints: number;
  /**
   * The timestamp the API gave your entry, set once the time has gone onto the
   * shared board. Kept rather than a plain flag so a later visit can still pick
   * your row out of the list and highlight it.
   */
  posted?: string;
}

export function doneKey(game: string, day: DayString = dayFor()): string {
  return `daily-${game}-${day}`;
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
    const parsed = JSON.parse(raw) as Done;
    return typeof parsed?.seconds === "number" ? parsed : null;
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
