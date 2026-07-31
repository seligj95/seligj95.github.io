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
 */
function rowKey(score: number): string {
  const padded = String(score).padStart(6, "0");
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${padded}-${unique}`;
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
      });
    }
    return found;
  }

  return {
    async add(game, day, entry) {
      await client.createEntity({
        partitionKey: partition(game, day),
        rowKey: rowKey(entry.score),
        name: entry.name,
        score: entry.score,
        // Written alongside for as long as anything might still read it. The
        // site and the API deploy separately, so they are never in step.
        seconds: entry.score,
        hints: entry.hints,
        at: entry.at,
      });
    },
    // Already in RowKey order, which is score order.
    list: rows,
    async count(game, day) {
      return (await rows(game, day)).length;
    },
  };
}
