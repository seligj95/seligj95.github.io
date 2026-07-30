/**
 * The write endpoint is public and unauthenticated, so everything arriving from
 * a browser is treated as a suggestion rather than a fact.
 *
 * None of this stops a determined person with curl. It is not meant to. It
 * stops a stray script, a fat-fingered client and the accidental 10MB body.
 */

/** Only games that actually have a daily board. */
export const GAMES = new Set(["queens"]);

export const NAME_MAX = 20;

/** Under this and you did not solve it, you replayed a solution. */
export const MIN_SECONDS = 3;
/** A day is 86400 seconds; anything longer is a clock left running. */
export const MAX_SECONDS = 86400;
export const MAX_HINTS = 500;

/**
 * A short list, matched on the whole squashed name rather than as substrings,
 * so "Scunthorpe" and "Assange" survive. Deliberately not exhaustive: this is a
 * friend-group leaderboard, not a moderation product.
 */
const BLOCKED = new Set([
  "fuck",
  "fucker",
  "shit",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "rape",
  "rapist",
]);

/** Days are plain calendar dates, and only ones that really exist. */
export function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Collapses lookalike characters so "f u c k" and "fµck" are caught by the same
 * small blocklist.
 */
function squash(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z]/g, "")
    .replace(/0/g, "o");
}

export function isBlockedName(name: string): boolean {
  return BLOCKED.has(squash(name));
}

/**
 * Trims, flattens whitespace, drops control characters and caps the length.
 * Returns null when nothing usable is left.
 */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const name = raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX);
  if (!name) return null;
  if (isBlockedName(name)) return null;
  return name;
}

function isCount(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export interface Submission {
  name: string;
  seconds: number;
  hints: number;
}

export type Checked = { ok: true; value: Submission } | { ok: false; error: string };

export function checkSubmission(body: unknown): Checked {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Expected a JSON object." };
  }
  const { name, seconds, hints } = body as Record<string, unknown>;

  const cleaned = cleanName(name);
  if (!cleaned) return { ok: false, error: "Pick a name." };

  if (!isCount(seconds, MIN_SECONDS, MAX_SECONDS)) {
    return { ok: false, error: "That time does not look real." };
  }
  if (!isCount(hints, 0, MAX_HINTS)) {
    return { ok: false, error: "That hint count does not look real." };
  }

  return { ok: true, value: { name: cleaned, seconds, hints } };
}

/**
 * A fixed-window counter, held in memory.
 *
 * Memory is the right trade here: the app scales to zero, so the window resets
 * on a cold start and a second replica keeps its own tally. Both make it
 * leakier than a shared counter would be, and neither matters for spam that
 * arrives from one browser in one sitting.
 */
export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function take(key: string, now = Date.now()): boolean {
    // Expired keys are dead weight, and the map would otherwise grow for as
    // long as the replica lives. Sweeping on a size threshold keeps the common
    // path free of work.
    if (hits.size > 5000) {
      for (const [seen, window] of hits) {
        if (now >= window.resetAt) hits.delete(seen);
      }
    }

    const seen = hits.get(key);
    if (!seen || now >= seen.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (seen.count >= limit) return false;
    seen.count += 1;
    return true;
  };
}
