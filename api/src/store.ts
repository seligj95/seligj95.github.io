/**
 * One score on one day's board.
 *
 * `seconds` already includes any hint penalty, because that is the number the
 * page shows you and the number you would compare with a friend.
 */
export interface Entry {
  name: string;
  seconds: number;
  hints: number;
  /** ISO timestamp, set by the server so a client cannot backdate a row. */
  at: string;
}

/**
 * Everything the leaderboard needs from storage, which is not much.
 *
 * Two methods on purpose: Table Storage today, Postgres later when Embr hands
 * us a DATABASE_URL. Neither adapter should need more than this.
 */
export interface Store {
  add(game: string, day: string, entry: Entry): Promise<void>;
  list(game: string, day: string): Promise<Entry[]>;
  /** How many rows a day already holds, so a day can be capped. */
  count(game: string, day: string): Promise<number>;
}

/** Fastest first, and an earlier submission wins a tie. */
export function byTime(a: Entry, b: Entry): number {
  if (a.seconds !== b.seconds) return a.seconds - b.seconds;
  return a.at.localeCompare(b.at);
}

/** A Store that forgets everything on restart. Used by the tests. */
export function memoryStore(): Store {
  const days = new Map<string, Entry[]>();
  const key = (game: string, day: string) => `${game}:${day}`;

  return {
    async add(game, day, entry) {
      const k = key(game, day);
      const rows = days.get(k) ?? [];
      rows.push(entry);
      days.set(k, rows);
    },
    async list(game, day) {
      return [...(days.get(key(game, day)) ?? [])].sort(byTime);
    },
    async count(game, day) {
      return (days.get(key(game, day)) ?? []).length;
    },
  };
}
