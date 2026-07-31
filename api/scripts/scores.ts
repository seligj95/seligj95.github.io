import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { TableClient, odata } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { partition } from "../src/table-store.ts";
import { GAMES, type Scoring } from "../src/guards.ts";

/**
 * Moderation for the shared board.
 *
 * Anyone can post a score under any name, which is the price of having no
 * accounts. The realistic problem is not a flood — that is already capped — but
 * one person typing something crude. This exists so the fix is a ten second job
 * rather than clicking through the portal.
 *
 * It authenticates as you, through the Azure CLI, so it works only for someone
 * already granted "Storage Table Data Contributor" on the account.
 */

/** Not a secret: the account name grants nothing without a role assignment. */
const DEFAULT_ACCOUNT = "jsdailyscores49afe4";

export interface Row {
  rowKey: string;
  name: string;
  score: number;
  hints: number;
  at: string;
}

export interface Args {
  command: string;
  game: string;
  day: string;
  rowKeys: string[];
}

/** Today where the puzzle rolls over, which is the boundary the site uses. */
export function today(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseArgs(argv: string[], now?: Date): Args {
  const rowKeys: string[] = [];
  let command = "";
  let game = "queens";
  let day = today(now);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--game") {
      game = argv[++i] ?? game;
    } else if (arg === "--day") {
      day = argv[++i] ?? day;
    } else if (!command) {
      command = arg;
    } else {
      rowKeys.push(arg);
    }
  }

  return { command, game, day, rowKeys };
}

export function clock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(seconds % 60).padStart(2, "0")}`;
}

/** A score as the game means it: a clock for a race, a count for Contexto. */
export function scoreText(score: number, scoring: Scoring = "time"): string {
  if (scoring === "time") return clock(score);
  return `${score} guess${score === 1 ? "" : "es"}`;
}

/** Row keys are long and easy to mistype, so listing prints them in full. */
export function formatRow(row: Row, place: number, scoring: Scoring = "time"): string {
  const hints = row.hints ? ` (${row.hints} hint${row.hints === 1 ? "" : "s"})` : "";
  const score = scoreText(row.score, scoring).padStart(10);
  return `${String(place).padStart(3)}. ${row.name.padEnd(22)} ${score}${hints}\n     ${row.rowKey}`;
}

function connect(): TableClient {
  const account = process.env.SCORES_STORAGE_ACCOUNT ?? DEFAULT_ACCOUNT;
  return new TableClient(
    `https://${account}.table.core.windows.net`,
    process.env.SCORES_TABLE ?? "scores",
    new DefaultAzureCredential()
  );
}

async function list(client: TableClient, game: string, day: string): Promise<Row[]> {
  const key = partition(game, day);
  const rows: Row[] = [];
  const query = client.listEntities<Record<string, unknown>>({
    queryOptions: { filter: odata`PartitionKey eq ${key}` },
  });
  for await (const row of query) {
    rows.push({
      rowKey: String(row.rowKey ?? ""),
      name: String(row.name ?? ""),
      score: Number(row.score ?? row.seconds ?? 0),
      hints: Number(row.hints ?? 0),
      at: String(row.at ?? ""),
    });
  }
  return rows;
}

const USAGE = `Usage:
  npm run scores -- list [--game queens] [--day YYYY-MM-DD]
  npm run scores -- delete <rowKey> [rowKey...] [--game queens] [--day YYYY-MM-DD]

Day defaults to today in America/New_York, the same boundary the site uses.
Needs an Azure login with "Storage Table Data Contributor" on the account.`;

export async function main() {
  const { command, game, day, rowKeys } = parseArgs(process.argv.slice(2));

  if (command !== "list" && command !== "delete") {
    console.log(USAGE);
    process.exitCode = command ? 1 : 0;
    return;
  }

  const client = connect();
  const rows = await list(client, game, day);

  if (command === "list") {
    console.log(`${game} — ${day} — ${rows.length} score${rows.length === 1 ? "" : "s"}\n`);
    const scoring = GAMES.get(game) ?? "time";
    rows.forEach((row, index) => console.log(formatRow(row, index + 1, scoring)));
    return;
  }

  if (rowKeys.length === 0) {
    console.error("Nothing to delete. Pass the row keys shown by `list`.");
    process.exitCode = 1;
    return;
  }

  // Delete by key rather than by position: a list is a moment in time, and a
  // score posted in between would silently change what position 3 means.
  for (const rowKey of rowKeys) {
    const row = rows.find((candidate) => candidate.rowKey === rowKey);
    if (!row) {
      console.error(`not found on ${day}: ${rowKey}`);
      process.exitCode = 1;
      continue;
    }
    await client.deleteEntity(partition(game, day), rowKey);
    console.log(`deleted ${row.name} (${scoreText(row.score, GAMES.get(game) ?? "time")})`);
  }
}

// Tests import the helpers above, and importing a module should not go and talk
// to Azure, so the CLI only runs when this file is the one node was handed.
const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    if (/credential|AADSTS|token/i.test(message)) {
      console.error("\nThis reads your Azure CLI login. Signed in?\n  az login");
    }
    process.exitCode = 1;
  });
}
