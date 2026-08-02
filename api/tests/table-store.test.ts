import { describe, expect, it } from "vitest";
import { rowKey } from "../src/table-store.ts";

describe("rowKey", () => {
  it("keeps the exact legacy shape when there is no elapsed", () => {
    const key = rowKey(120);
    expect(key).toMatch(/^000120-[0-9a-z]+$/);
  });

  it("pads the score so RowKey order is score order", () => {
    expect(rowKey(9) < rowKey(10)).toBe(true);
    expect(rowKey(99) < rowKey(100)).toBe(true);
  });

  it("inserts a padded elapsed segment between the score and the unique suffix", () => {
    const key = rowKey(2, 30);
    expect(key).toMatch(/^000002-000030-[0-9a-z]+$/);
  });

  it("orders by score, then by elapsed, as plain strings", () => {
    // Same move count, faster elapsed sorts first.
    expect(rowKey(2, 20) < rowKey(2, 90)).toBe(true);
    // A worse move count always sorts after a better one, whatever the times.
    expect(rowKey(2, 9999) < rowKey(3, 1)).toBe(true);
  });

  it("gives two calls for the same score and elapsed a different suffix", () => {
    expect(rowKey(2, 30)).not.toBe(rowKey(2, 30));
  });
});
