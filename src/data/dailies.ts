/**
 * The daily games, in the order they appear on the daily tab.
 *
 * A daily is not the same thing as the arcade game it is built on: it has its
 * own page, its own rules and its own blurb, so it gets its own registry rather
 * than a filter over `games`. Adding one means an entry here, a page under
 * `src/pages/daily/`, and a mark in `GameMark.astro` (which the arcade entry
 * will already have provided).
 */
import type { Scoring } from "../lib/daily-scores";

export interface Daily {
  slug: string;
  title: string;
  tagline: string;
  blurb: string;
  /**
   * What the leaderboard is ranked by, in words, for the line above the board.
   */
  ranking: string;
  /** What the number on the board means. Lower is better either way. */
  scoring: Scoring;
}

export const dailies: Daily[] = [
  {
    slug: "queens",
    title: "Queens",
    tagline: "One board, one go, one clock.",
    blurb:
      "Today’s board is the same for everyone. Crowns go one per row, one per column and one per color, and none may touch. Hints cost 30 seconds.",
    ranking: "Fastest today",
    scoring: "time",
  },
  {
    slug: "contexto",
    title: "Contexto",
    tagline: "One word, and only warmer or colder to go on.",
    blurb:
      "Today’s word is the same for everyone. Every guess comes back with its place in a list of thirty thousand, sorted by closeness to the answer. No clock and no hints — only how few guesses it takes.",
    ranking: "Fewest guesses today",
    scoring: "guesses",
  },
  {
    slug: "chess",
    title: "Chess",
    tagline: "One position, one mate to find.",
    blurb:
      "Today’s puzzle is the same for everyone. White to move and mate; your job is to find it. A legal move off the line is rejected and restored, but still counts. A hint adds one move and 30 seconds; giving up reveals the line but forfeits posting.",
    ranking: "Fewest moves today, ties broken by time",
    scoring: "moves",
  },
];

export const dailySlugs: string[] = dailies.map((daily) => daily.slug);
