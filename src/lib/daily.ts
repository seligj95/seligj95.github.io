/**
 * Which day is it, for daily-puzzle purposes?
 *
 * Everyone gets the same puzzle at the same instant, so "today" is a single
 * global fact rather than a local one. The boundary is 00:00 in
 * America/New_York: a friend in London gets tomorrow's board at 5am their
 * time, which is a lot friendlier than a UTC boundary that would flip the
 * puzzle at 7pm Eastern, right in the middle of the evening.
 */

import { hashSeed, createRng, type Rng } from "./random";

export const DAILY_ZONE = "America/New_York";

/** A calendar day in `YYYY-MM-DD`. */
export type DayString = string;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const zoned = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Reads an instant as wall-clock fields in the daily zone. */
function wallClock(at: Date): WallClock {
  const parts = zoned.formatToParts(at);
  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: field("year"),
    month: field("month"),
    day: field("day"),
    // Some engines render midnight as hour 24 under hour12: false.
    hour: field("hour") % 24,
    minute: field("minute"),
    second: field("second"),
  };
}

/** How far the daily zone sits from UTC at a given instant, in milliseconds. */
function zoneOffset(at: Date): number {
  const local = wallClock(at);
  const asUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second
  );
  // Drop sub-second precision on both sides so the difference is a clean offset.
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The calendar day in the daily zone, as `YYYY-MM-DD`. */
export function dayFor(at: Date = new Date()): DayString {
  const { year, month, day } = wallClock(at);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** True for a well-formed, real calendar day. Rejects `2026-02-30`. */
export function isDayString(value: unknown): value is DayString {
  if (typeof value !== "string" || !DAY_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const asDate = new Date(Date.UTC(year, month - 1, day));

  return (
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day
  );
}

/**
 * The instant a day begins, in UTC.
 *
 * Two passes: guess using the offset at noon UTC on that date, then correct
 * using the offset actually in force at the guess. US daylight saving shifts
 * at 2am local, never across midnight, so the second pass always settles.
 */
export function startOfDay(day: DayString): Date {
  const [year, month, date] = day.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const midnightAsUtc = Date.UTC(year, month - 1, date);

  const firstGuess = new Date(
    midnightAsUtc - zoneOffset(new Date(midnightAsUtc + 12 * 3600_000))
  );
  return new Date(midnightAsUtc - zoneOffset(firstGuess));
}

/** Day of the week for a day string: 0 is Sunday, 6 is Saturday. */
export function weekdayOf(day: DayString): number {
  const [year, month, date] = day.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(Date.UTC(year, month - 1, date)).getUTCDay();
}

/**
 * How many whole days this one is past 1970-01-01, counting the day string
 * itself rather than the instant it starts.
 *
 * A game that walks through a fixed list wants a counter that goes up by
 * exactly one each day. `startOfDay` cannot give that: two of its instants are
 * 23 or 25 hours apart across a daylight saving change, so dividing by a day
 * would occasionally repeat or skip. Reading the date parts sidesteps the
 * clock entirely.
 */
export function dayIndex(day: DayString): number {
  const [year, month, date] = day.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  return Math.round(Date.UTC(year, month - 1, date) / 86_400_000);
}

/** Steps forward or backward by whole days. */
export function addDays(day: DayString, delta: number): DayString {
  const [year, month, date] = day.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const moved = new Date(Date.UTC(year, month - 1, date + delta));

  return [
    moved.getUTCFullYear(),
    String(moved.getUTCMonth() + 1).padStart(2, "0"),
    String(moved.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** Milliseconds until the next puzzle. Never negative. */
export function msUntilNextDay(at: Date = new Date()): number {
  const next = startOfDay(addDays(dayFor(at), 1));
  return Math.max(0, next.getTime() - at.getTime());
}

/** The stable key for one game on one day, for example `queens-2026-03-03`. */
export function dailyKey(game: string, day: DayString = dayFor()): string {
  return `${game}-${day}`;
}

/** The seed behind a day's puzzle. */
export function dailySeed(game: string, day: DayString = dayFor()): number {
  return hashSeed(dailyKey(game, day));
}

/** A generator wound to a day's puzzle. Same day, same board, everywhere. */
export function dailyRng(game: string, day: DayString = dayFor()): Rng {
  return createRng(dailySeed(game, day));
}

/**
 * A human-readable date, for example `Tuesday, March 3`. Rendered in the daily
 * zone so the heading agrees with the board you were handed.
 */
export function formatDay(day: DayString): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${day}T00:00:00Z`));
}
