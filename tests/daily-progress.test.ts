import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  NAME_KEY,
  doneKey,
  readDone,
  readName,
  writeDone,
  writeName,
} from "../src/lib/daily-progress";

/**
 * A stand-in for localStorage, so these can run under Node. `throws` models the
 * browser that has storage switched off, which is the case every read and write
 * in this module is wrapped for.
 */
function fakeStorage(throws = false) {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      if (throws) throw new Error("storage is off");
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (throws) throw new Error("storage is off");
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

function useStorage(store: Storage) {
  vi.stubGlobal("window", { localStorage: store });
}

beforeEach(() => useStorage(fakeStorage()));
afterEach(() => vi.unstubAllGlobals());

describe("doneKey", () => {
  it("keeps the key format that is already in browsers", () => {
    // Records written before this helper existed used exactly this string. A
    // change here would silently wipe today's record for anyone mid-day.
    expect(doneKey("queens", "2026-07-30")).toBe("daily-queens-2026-07-30");
  });

  it("gives each game and each day its own key", () => {
    expect(doneKey("queens", "2026-07-30")).not.toBe(doneKey("queens", "2026-07-31"));
    expect(doneKey("queens", "2026-07-30")).not.toBe(doneKey("contexto", "2026-07-30"));
  });
});

describe("readDone", () => {
  it("returns null when nothing has been played", () => {
    expect(readDone("queens", "2026-07-30")).toBeNull();
  });

  it("round trips a finished day", () => {
    writeDone("queens", { score: 312, hints: 2, posted: "abc" }, "2026-07-30");
    expect(readDone("queens", "2026-07-30")).toEqual({
      score: 312,
      hints: 2,
      posted: "abc",
    });
  });

  it("does not read one day's record for another", () => {
    writeDone("queens", { score: 312, hints: 0 }, "2026-07-30");
    expect(readDone("queens", "2026-07-31")).toBeNull();
  });

  it("ignores a record left over from an older shape", () => {
    const store = fakeStorage();
    store.setItem("daily-queens-2026-07-30", JSON.stringify({ time: 312 }));
    useStorage(store);
    expect(readDone("queens", "2026-07-30")).toBeNull();
  });

  it("still reads a record written before the score was renamed", () => {
    const store = fakeStorage();
    // Anyone who played today, on the build before this one, has one of these.
    store.setItem(
      "daily-queens-2026-07-30",
      JSON.stringify({ seconds: 312, hints: 1, posted: "abc" })
    );
    useStorage(store);
    expect(readDone("queens", "2026-07-30")).toMatchObject({
      score: 312,
      hints: 1,
      posted: "abc",
    });
  });

  it("ignores a value that is not JSON at all", () => {
    const store = fakeStorage();
    store.setItem("daily-queens-2026-07-30", "not json");
    useStorage(store);
    expect(readDone("queens", "2026-07-30")).toBeNull();
  });

  it("survives storage being switched off", () => {
    useStorage(fakeStorage(true));
    expect(() => readDone("queens", "2026-07-30")).not.toThrow();
    expect(readDone("queens", "2026-07-30")).toBeNull();
    expect(() => writeDone("queens", { score: 1, hints: 0 }, "2026-07-30")).not.toThrow();
  });
});

describe("the remembered name", () => {
  it("is one key for every daily, so it carries between games", () => {
    expect(NAME_KEY).toBe("daily-name");
    expect(NAME_KEY).not.toContain("queens");
  });

  it("round trips", () => {
    writeName("Ada");
    expect(readName()).toBe("Ada");
  });

  it("is an empty string when nobody has posted yet", () => {
    expect(readName()).toBe("");
  });

  it("survives storage being switched off", () => {
    useStorage(fakeStorage(true));
    expect(readName()).toBe("");
    expect(() => writeName("Ada")).not.toThrow();
  });
});
