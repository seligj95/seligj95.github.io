# Site API

A small public JSON API behind the daily leaderboard and Tech Community view
counts on [jordanselig.com](https://jordanselig.com). No accounts, no sessions,
no cookies — you finish a board, you optionally type a name, and your time joins
that day's list.

## Routes

| | |
| --- | --- |
| `GET /api/health` | Liveness. Answers without touching storage. |
| `GET /api/views/tech-community/:messageId?url=...` | Live view count for a validated Tech Community blog URL. |
| `GET /api/daily/:game/:day/scores` | That day's leaderboard, fastest first. |
| `POST /api/daily/:game/:day/scores` | Add a score. Body: `{ name, seconds, hints }`. |

`:day` is a calendar date (`2026-03-03`) and `:game` has to be a game that
actually has a daily board. Anything else is a 404.

## Running it

```
npm install
npm start          # memory store, nothing survives a restart
npm test
```

Point it at real storage with `SCORES_STORAGE_ACCOUNT`. Auth is managed
identity via `DefaultAzureCredential`, so locally it picks up your `az login`
and in Azure it picks up the container app's identity. There is no connection
string anywhere.

| variable | |
| --- | --- |
| `PORT` | Defaults to 8080. |
| `SCORES_STORAGE_ACCOUNT` | Storage account holding the `scores` table. Unset means memory. |
| `ALLOWED_ORIGINS` | Comma-separated. Everything else gets no CORS headers. |

## Shape

`src/store.ts` defines the whole storage contract: `add`, `list`, `count`.
Table Storage implements it today; Postgres will implement it on Embr. Both
adapters are about forty lines, which is the point.

Scores are partitioned one per board (`queens|2026-03-03`) and the row key is
the zero-padded time, so a day comes back from storage already sorted and a
read never touches another day's rows.

## What it refuses

The write endpoint is public, so nothing arriving from a browser is trusted:
names are trimmed, capped and lightly filtered, times outside 3s–24h are
rejected, the server stamps its own timestamp, submissions are rate limited per
address, and a day stops accepting rows once it is full. None of this stops
somebody determined with curl, and it is not meant to.

## Moderating a board

Names are free text on a public endpoint, so eventually one will need removing.
`scripts/scores.ts` does that against the live table, authenticating as you
through the Azure CLI — it works only for someone holding "Storage Table Data
Contributor" on the storage account.

```sh
npm run scores -- list
npm run scores -- delete 000200-ms7ynrfteflk9u
```

Both default to today's Queens board on the same New York boundary the site
uses. Pass `--day 2026-03-14` or `--game` to reach another one. Deletion takes
the row key printed by `list` rather than a position, because a score arriving
in between would quietly change what "row 3" meant.

If the CLI profile you signed in with is not the default one on the machine,
set `AZURE_CONFIG_DIR` to point at it.
