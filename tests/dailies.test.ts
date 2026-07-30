import { describe, it, expect } from "vitest";
import { dailies, dailySlugs } from "../src/data/dailies";
import { games } from "../src/data/games";
import { hintText, clockText, ordinal } from "../src/lib/daily-scores";

describe("the daily registry", () => {
  it("has at least one game", () => {
    expect(dailies.length).toBeGreaterThan(0);
  });

  it("gives every daily the fields the tab renders", () => {
    for (const daily of dailies) {
      expect(daily.slug).toMatch(/^[a-z0-9-]+$/);
      expect(daily.title.length).toBeGreaterThan(0);
      expect(daily.tagline.length).toBeGreaterThan(0);
      expect(daily.blurb.length).toBeGreaterThan(0);
      expect(daily.ranking.length).toBeGreaterThan(0);
    }
  });

  it("uses each slug once", () => {
    expect(new Set(dailySlugs).size).toBe(dailySlugs.length);
  });

  it("builds every daily on a game that exists in the arcade", () => {
    // The mark on the daily tab comes from GameMark, which is keyed by the
    // arcade slug. A daily with no arcade twin would render a blank square.
    const arcade = new Set(games.map((game) => game.slug));
    for (const slug of dailySlugs) expect(arcade).toContain(slug);
  });
});

describe("hintText", () => {
  it("says nothing when no hints were taken", () => {
    // The caller tests the empty string to decide whether to mention hints at
    // all, so "0 hints" would be wrong rather than merely wordy.
    expect(hintText(0)).toBe("");
  });

  it("keeps one hint singular", () => {
    expect(hintText(1)).toBe("1 hint");
  });

  it("pluralizes the rest", () => {
    expect(hintText(2)).toBe("2 hints");
    expect(hintText(17)).toBe("17 hints");
  });
});

describe("clockText", () => {
  it("pads the seconds", () => {
    expect(clockText(61)).toBe("1:01");
    expect(clockText(600)).toBe("10:00");
  });

  it("handles under a minute", () => {
    expect(clockText(9)).toBe("0:09");
  });
});

describe("ordinal", () => {
  it("covers the teens, which break the pattern", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
  });

  it("covers the rest", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(112)).toBe("112th");
  });
});
