import { TableClient, odata } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import type { Entry, Store } from "./store.ts";

/**
 * One partition per board, so a day's leaderboard is a single partition scan
 * and never touches another day's rows.
 *
 * Exported because the moderation script has to address the same rows by hand.
 */
export function partition(game: string, day: string): string {
  return `${game}|${day}`;
}

/**
 * Table Storage returns a partition ordered by RowKey, so padding the score to
 * a fixed width means the leaderboard comes back already sorted and we never
 * page through a day just to find the top ten. Seconds and guess counts both
 * pad the same way. The suffix keeps two identical scores from colliding.
 *
 * A "moves" board also needs elapsed time as its tiebreaker, so the padded
 * elapsed value sits between the score and the unique suffix - RowKey order
 * is then score, then elapsed, then submission, which is exactly the ranking
 * the leaderboard wants without any client-side re-sorting. Every other game
 * never passes `elapsed`, so its rows keep the exact key shape they always
 * had; each partition holds one game's rows, so the two shapes never need to
 * sort against each other.
 *
 * Exported so `rowKey`'s ordering can be tested directly, without a real or
 * mocked Table Storage account.
 */
export function rowKey(score: number, elapsed?: number): string {
  const padded = String(score).padStart(6, "0");
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  if (elapsed === undefined) return `${padded}-${unique}`;
  const paddedElapsed = String(elapsed).padStart(6, "0");
  return `${padded}-${paddedElapsed}-${unique}`;
}

export interface TableStoreOptions {
  account: string;
  table?: string;
}

/**
 * Scores in Azure Table Storage, reached with the container app's managed
 * identity. There is no connection string anywhere: the app is granted
 * "Storage Table Data Contributor" on the account and nothing else.
 */
export function tableStore({ account, table = "scores" }: TableStoreOptions): Store {
  const client = new TableClient(
    `https://${account}.table.core.windows.net`,
    table,
    new DefaultAzureCredential()
  );

  async function rows(game: string, day: string): Promise<Entry[]> {
    const key = partition(game, day);
    const found: Entry[] = [];
    const query = client.listEntities<Record<string, unknown>>({
      queryOptions: { filter: odata`PartitionKey eq ${key}` },
    });
    for await (const row of query) {
      found.push({
        name: String(row.name ?? ""),
        // Rows written before the leaderboard learned about non-timed games
        // only carry `seconds`.
        score: Number(row.score ?? row.seconds ?? 0),
        hints: Number(row.hints ?? 0),
        at: String(row.at ?? ""),
        // Legacy rows, and every non-"moves" game, never wrote this column.
        ...(row.elapsed !== undefined ? { elapsed: Number(row.elapsed) } : {}),
      });
    }
    return found;
  }

  return {
    async add(game, day, entry) {
      await client.createEntity({
        partitionKey: partition(game, day),
        rowKey: rowKey(entry.score, entry.elapsed),
        name: entry.name,
        score: entry.score,
        // Written alongside for as long as anything might still read it. The
        // site and the API deploy separately, so they are never in step.
        seconds: entry.score,
        hints: entry.hints,
        at: entry.at,
        // Omitted entirely rather than written as null/undefined, so a game
        // that never sends elapsed never gets the column at all.
        ...(entry.elapsed !== undefined ? { elapsed: entry.elapsed } : {}),
      });
    },
    // Already in RowKey order, which is score order.
    list: rows,
    async count(game, day) {
      return (await rows(game, day)).length;
    },
  };
}
