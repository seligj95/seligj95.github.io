/**
 * The daily games, in the order they appear on the daily tab.
 *
 * A daily is not the same thing as the arcade game it is built on: it has its
 * own page, its own rules and its own blurb, so it gets its own registry rather
 * than a filter over `games`. Adding one means an entry here, a page under
 * `src/pages/daily/`, and a mark in `GameMark.astro` (which the arcade entry
 * will already have provided).
 */
export interface Daily {
  slug: string;
  title: string;
  tagline: string;
  blurb: string;
  /**
   * What the leaderboard is ranked by, in words, for the line above the board.
   * Every daily so far is a race, but a future one might be scored.
   */
  ranking: string;
}

export const dailies: Daily[] = [
  {
    slug: "queens",
    title: "Queens",
    tagline: "One board, one go, one clock.",
    blurb:
      "Today’s board is the same for everyone. Crowns go one per row, one per column and one per color, and none may touch. Hints cost 30 seconds.",
    ranking: "Fastest today",
  },
];

export const dailySlugs: string[] = dailies.map((daily) => daily.slug);
