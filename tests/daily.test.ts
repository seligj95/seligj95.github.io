import { describe, it, expect } from "vitest";
import {
  DAILY_ZONE,
  dayFor,
  isDayString,
  startOfDay,
  weekdayOf,
  addDays,
  msUntilNextDay,
  dailyKey,
  dailySeed,
  dailyRng,
  formatDay,
} from "../src/lib/daily";
import { hashSeed, createRng } from "../src/lib/random";

// Eastern time is UTC-5 in winter and UTC-4 in summer, so these two fixed
// instants pin down both sides of the daylight saving boundary.
const winterEvening = new Date("2026-03-03T04:30:00Z"); // 11:30pm ET, Mar 2
const summerEvening = new Date("2026-07-04T03:30:00Z"); // 11:30pm ET, Jul 3

describe("dayFor", () => {
  it("uses the Eastern boundary, not UTC", () => {
    // 7pm Eastern is already tomorrow in UTC. The puzzle must not flip.
    expect(dayFor(new Date("2026-03-04T00:00:00Z"))).toBe("2026-03-03");
    expect(dayFor(winterEvening)).toBe("2026-03-02");
    expect(dayFor(summerEvening)).toBe("2026-07-03");
  });

  it("flips exactly at Eastern midnight", () => {
    expect(dayFor(new Date("2026-03-03T04:59:59Z"))).toBe("2026-03-02");
    expect(dayFor(new Date("2026-03-03T05:00:00Z"))).toBe("2026-03-03");
  });

  it("flips an hour earlier in UTC terms during daylight saving", () => {
    expect(dayFor(new Date("2026-07-04T03:59:59Z"))).toBe("2026-07-03");
    expect(dayFor(new Date("2026-07-04T04:00:00Z"))).toBe("2026-07-04");
  });

  it("always returns a valid day string", () => {
    let at = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 400; i++) {
      expect(isDayString(dayFor(new Date(at)))).toBe(true);
      at += 22 * 3600_000;
    }
  });

  it("names the zone it uses", () => {
    expect(DAILY_ZONE).toBe("America/New_York");
  });
});

describe("isDayString", () => {
  it("accepts real days", () => {
    expect(isDayString("2026-03-03")).toBe(true);
    expect(isDayString("2024-02-29")).toBe(true);
  });

  it("rejects everything else", () => {
    for (const value of [
      "2026-02-30",
      "2023-02-29",
      "2026-13-01",
      "2026-00-10",
      "2026-3-3",
      "26-03-03",
      "2026-03-03T00:00:00Z",
      "",
      null,
      undefined,
      20260303,
      {},
    ]) {
      expect(isDayString(value), String(value)).toBe(false);
    }
  });
});

describe("startOfDay", () => {
  it("lands on Eastern midnight in winter", () => {
    expect(startOfDay("2026-03-03").toISOString()).toBe(
      "2026-03-03T05:00:00.000Z"
    );
  });

  it("lands on Eastern midnight in summer", () => {
    expect(startOfDay("2026-07-04").toISOString()).toBe(
      "2026-07-04T04:00:00.000Z"
    );
  });

  it("handles the day the clocks move", () => {
    // 2026 daylight saving starts Sunday March 8 at 2am Eastern. Midnight that
    // morning is still on standard time.
    expect(startOfDay("2026-03-08").toISOString()).toBe(
      "2026-03-08T05:00:00.000Z"
    );
    expect(startOfDay("2026-03-09").toISOString()).toBe(
      "2026-03-09T04:00:00.000Z"
    );
    // And back again on Sunday November 1.
    expect(startOfDay("2026-11-01").toISOString()).toBe(
      "2026-11-01T04:00:00.000Z"
    );
    expect(startOfDay("2026-11-02").toISOString()).toBe(
      "2026-11-02T05:00:00.000Z"
    );
  });

  it("agrees with dayFor over a whole year", () => {
    let day = "2026-01-01";
    for (let i = 0; i < 365; i++) {
      const start = startOfDay(day);
      expect(dayFor(start), `start of ${day}`).toBe(day);
      expect(dayFor(new Date(start.getTime() - 1)), `before ${day}`).toBe(
        addDays(day, -1)
      );
      day = addDays(day, 1);
    }
  });
});

describe("weekdayOf", () => {
  it("names the right day", () => {
    expect(weekdayOf("2026-03-01")).toBe(0); // Sunday
    expect(weekdayOf("2026-03-03")).toBe(2); // Tuesday
    expect(weekdayOf("2026-03-07")).toBe(6); // Saturday
  });

  it("advances one step per day", () => {
    let day = "2026-03-01";
    for (let i = 0; i < 30; i++) {
      expect(weekdayOf(addDays(day, i))).toBe((i % 7) as number);
    }
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("round trips", () => {
    expect(addDays(addDays("2026-03-03", 200), -200)).toBe("2026-03-03");
  });
});

describe("msUntilNextDay", () => {
  it("counts down to the next Eastern midnight", () => {
    // 11:30pm Eastern leaves half an hour.
    expect(msUntilNextDay(winterEvening)).toBe(30 * 60_000);
    expect(msUntilNextDay(summerEvening)).toBe(30 * 60_000);
  });

  it("returns a full day at the moment one starts", () => {
    expect(msUntilNextDay(startOfDay("2026-03-03"))).toBe(24 * 3600_000);
  });

  it("returns a short day when the clocks spring forward", () => {
    expect(msUntilNextDay(startOfDay("2026-03-08"))).toBe(23 * 3600_000);
  });

  it("returns a long day when the clocks fall back", () => {
    expect(msUntilNextDay(startOfDay("2026-11-01"))).toBe(25 * 3600_000);
  });

  it("is never negative", () => {
    let at = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 400; i++) {
      expect(msUntilNextDay(new Date(at))).toBeGreaterThan(0);
      at += 22 * 3600_000;
    }
  });
});

describe("dailyKey and seeds", () => {
  it("builds the key we expect", () => {
    expect(dailyKey("queens", "2026-03-03")).toBe("queens-2026-03-03");
  });

  it("seeds from that key", () => {
    expect(dailySeed("queens", "2026-03-03")).toBe(
      hashSeed("queens-2026-03-03")
    );
  });

  it("gives different games different puzzles on the same day", () => {
    expect(dailySeed("queens", "2026-03-03")).not.toBe(
      dailySeed("chain", "2026-03-03")
    );
  });

  it("gives a full year of distinct seeds", () => {
    const seeds = new Set<number>();
    let day = "2026-01-01";
    for (let i = 0; i < 365; i++) {
      seeds.add(dailySeed("queens", day));
      day = addDays(day, 1);
    }
    expect(seeds.size).toBe(365);
  });

  it("hands out a generator wound to the day", () => {
    const fromHelper = Array.from({ length: 5 }, dailyRng("queens", "2026-03-03"));
    const byHand = createRng(hashSeed("queens-2026-03-03"));
    expect(fromHelper).toEqual(Array.from({ length: 5 }, byHand));
  });
});

describe("formatDay", () => {
  it("reads like a date, not a timestamp", () => {
    expect(formatDay("2026-03-03")).toBe("Tuesday, March 3");
    expect(formatDay("2026-12-25")).toBe("Friday, December 25");
  });

  it("does not slip a day near midnight", () => {
    // A naive `new Date("2026-03-03")` in a western zone would render March 2.
    expect(formatDay("2026-01-01")).toBe("Thursday, January 1");
  });
});
