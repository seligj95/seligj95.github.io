import { describe, expect, it } from "vitest";
import { clock, formatRow, parseArgs, today } from "../scripts/scores.ts";

describe("parseArgs", () => {
  const now = new Date("2026-03-14T18:00:00Z");

  it("defaults to today's queens board", () => {
    const args = parseArgs(["list"], now);

    expect(args.command).toBe("list");
    expect(args.game).toBe("queens");
    expect(args.day).toBe("2026-03-14");
    expect(args.rowKeys).toEqual([]);
  });

  it("takes an explicit game and day", () => {
    const args = parseArgs(["list", "--game", "chain", "--day", "2026-01-02"], now);

    expect(args.game).toBe("chain");
    expect(args.day).toBe("2026-01-02");
  });

  it("collects row keys, wherever the flags sit", () => {
    const args = parseArgs(["delete", "000094-abc", "--day", "2026-01-02", "000212-def"], now);

    expect(args.command).toBe("delete");
    expect(args.day).toBe("2026-01-02");
    expect(args.rowKeys).toEqual(["000094-abc", "000212-def"]);
  });

  it("reports no command rather than guessing one", () => {
    expect(parseArgs([], now).command).toBe("");
  });
});

describe("today", () => {
  it("rolls over on New York time, not UTC", () => {
    // 01:30 UTC is still the previous evening in New York, and the site treats
    // it as the previous day's board.
    expect(today(new Date("2026-03-14T01:30:00Z"))).toBe("2026-03-13");
    expect(today(new Date("2026-03-14T05:30:00Z"))).toBe("2026-03-14");
  });
});

describe("formatRow", () => {
  const row = { rowKey: "000094-abc", name: "Anna", seconds: 94, hints: 0, at: "" };

  it("shows the place, the time and the key to delete by", () => {
    const line = formatRow(row, 1);

    expect(line).toContain("1.");
    expect(line).toContain("Anna");
    expect(line).toContain("1:34");
    expect(line).toContain("000094-abc");
  });

  it("mentions hints only when there were some", () => {
    expect(formatRow(row, 1)).not.toContain("hint");
    expect(formatRow({ ...row, hints: 1 }, 1)).toContain("(1 hint)");
    expect(formatRow({ ...row, hints: 2 }, 1)).toContain("(2 hints)");
  });
});

describe("clock", () => {
  it("pads the seconds so times line up in a column", () => {
    expect(clock(9)).toBe("0:09");
    expect(clock(94)).toBe("1:34");
    expect(clock(600)).toBe("10:00");
  });
});
