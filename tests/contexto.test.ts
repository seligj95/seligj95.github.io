import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  Game,
  buildVocabulary,
  nearest,
  rankAgainst,
  resolve,
  tidy,
  vectorAt,
  type Vocabulary,
} from "../src/lib/contexto";
import { fillFor, heatFor } from "../src/lib/contexto-board";
import { order, secretFor } from "../src/lib/contexto-daily";
import { secrets } from "../src/data/contexto-secrets";
import { addDays } from "../src/lib/daily";

/**
 * A vocabulary small enough to reason about by hand.
 *
 * Words are placed on a circle, so closeness is just the angle between them and
 * the expected ranking can be read off the list. Quantizing to a byte the same
 * way the real file does keeps the test honest about precision.
 */
function circle(words: string[], aliases: Record<string, string> = {}): Vocabulary {
  const dims = 2;
  const vectors = new Int8Array(words.length * dims);
  words.forEach((_, i) => {
    // A tenth of a turn between neighbors: near words stay near, and the far
    // side of the circle is genuinely far.
    const angle = (i * Math.PI) / 5;
    vectors[i * dims] = Math.round(Math.cos(angle) * 127);
    vectors[i * dims + 1] = Math.round(Math.sin(angle) * 127);
  });

  return {
    dims,
    words,
    index: new Map(words.map((word, i) => [word, i])),
    aliases: new Map(Object.entries(aliases)),
    vectors,
  };
}

const words = ["one", "two", "three", "four", "five", "six"];
const vocabulary = circle(words, { ones: "one", twos: "two", nope: "missing" });

describe("tidy", () => {
  it("keeps only the letters a vocabulary word could be made of", () => {
    expect(tidy("  Mountain! ")).toBe("mountain");
    expect(tidy("re-entry")).toBe("reentry");
    expect(tidy("don't")).toBe("dont");
  });

  it("folds accents rather than dropping the letter", () => {
    expect(tidy("café")).toBe("cafe");
    expect(tidy("naïve")).toBe("naive");
  });

  it("returns nothing for a guess with no letters in it", () => {
    expect(tidy("   ")).toBe("");
    expect(tidy("42")).toBe("");
  });
});

describe("resolve", () => {
  it("takes a word that is in the list", () => {
    expect(resolve(vocabulary, "Three")).toBe("three");
  });

  it("folds an inflection onto the word that carries the vector", () => {
    expect(resolve(vocabulary, "ones")).toBe("one");
  });

  it("refuses a word it does not know", () => {
    expect(resolve(vocabulary, "elephant")).toBeNull();
    expect(resolve(vocabulary, "")).toBeNull();
  });

  it("refuses an alias whose base is missing, rather than trusting the map", () => {
    expect(resolve(vocabulary, "nope")).toBeNull();
  });
});

describe("rankAgainst", () => {
  it("ranks the secret first and the opposite word last", () => {
    const ranks = rankAgainst(vocabulary, 0);
    expect(ranks[0]).toBe(1);
    expect(ranks[words.indexOf("six")]).toBe(words.length);
  });

  it("ranks by closeness, so neighbors beat strangers", () => {
    const ranks = rankAgainst(vocabulary, 0);
    expect(ranks[words.indexOf("two")]).toBeLessThan(ranks[words.indexOf("four")]!);
  });

  it("gives every word a distinct rank", () => {
    const ranks = [...rankAgainst(vocabulary, 2)];
    expect(new Set(ranks).size).toBe(words.length);
    expect(Math.min(...ranks)).toBe(1);
    expect(Math.max(...ranks)).toBe(words.length);
  });

  it("breaks ties by position, so two identical vectors rank predictably", () => {
    const twins = circle(["a", "b"]);
    // Same vector for both: the tie must fall to the earlier word.
    twins.vectors.set(twins.vectors.subarray(0, 2), 2);
    const ranks = rankAgainst(twins, 0);
    expect([...ranks]).toEqual([1, 2]);
  });
});

describe("vectorAt", () => {
  it("reads a unit vector back out", () => {
    const unit = vectorAt(vocabulary, 0);
    const length = Math.hypot(unit[0]!, unit[1]!);
    expect(length).toBeCloseTo(1, 2);
  });
});

describe("nearest", () => {
  it("lists the closest words, closest first, starting with the secret", () => {
    const ranks = rankAgainst(vocabulary, 0);
    expect(nearest(vocabulary, ranks, 3)).toEqual(["one", "two", "three"]);
  });

  it("never asks for more words than there are", () => {
    const ranks = rankAgainst(vocabulary, 0);
    expect(nearest(vocabulary, ranks, 99)).toHaveLength(words.length);
  });
});

describe("Game", () => {
  it("scores a guess and counts it", () => {
    const game = new Game(vocabulary, "one");
    const outcome = game.guess("two");

    expect(outcome.kind).toBe("scored");
    expect(game.count).toBe(1);
    expect(game.won).toBe(false);
  });

  it("wins when the guess is the secret", () => {
    const game = new Game(vocabulary, "three");
    const outcome = game.guess("Three");

    expect(outcome.kind).toBe("scored");
    if (outcome.kind === "scored") expect(outcome.guess.rank).toBe(1);
    expect(game.won).toBe(true);
  });

  it("wins on an inflection of the secret, which is the same word", () => {
    const game = new Game(vocabulary, "one");
    const outcome = game.guess("ones");

    if (outcome.kind !== "scored") throw new Error("expected a score");
    expect(outcome.guess.word).toBe("one");
    expect(outcome.guess.typed).toBe("ones");
    expect(game.won).toBe(true);
  });

  it("does not charge you twice for the same word", () => {
    const game = new Game(vocabulary, "one");
    game.guess("two");
    const again = game.guess("two");

    expect(again.kind).toBe("repeat");
    expect(game.count).toBe(1);
  });

  it("treats an inflection of a word already guessed as a repeat", () => {
    const game = new Game(vocabulary, "three");
    game.guess("one");
    expect(game.guess("ones").kind).toBe("repeat");
    expect(game.count).toBe(1);
  });

  it("does not count a word it does not know", () => {
    const game = new Game(vocabulary, "one");
    const outcome = game.guess("elephant");

    expect(outcome.kind).toBe("unknown");
    expect(game.count).toBe(0);
  });

  it("says nothing at all for an empty guess", () => {
    const game = new Game(vocabulary, "one");
    expect(game.guess("   ").kind).toBe("empty");
    expect(game.guess("123").kind).toBe("empty");
    expect(game.count).toBe(0);
  });

  it("keeps history in guess order and byRank in rank order", () => {
    const game = new Game(vocabulary, "one");
    game.guess("four");
    game.guess("two");

    expect(game.history.map((guess) => guess.word)).toEqual(["four", "two"]);
    expect(game.byRank.map((guess) => guess.word)).toEqual(["two", "four"]);
  });

  it("remembers the best rank reached", () => {
    const game = new Game(vocabulary, "one");
    game.guess("four");
    const far = game.best;
    game.guess("two");

    expect(game.best).toBeLessThan(far);
  });

  it("refuses to start on a word that is not in the vocabulary", () => {
    expect(() => new Game(vocabulary, "elephant")).toThrow();
  });
});

describe("buildVocabulary", () => {
  it("indexes the words and the aliases it is given", () => {
    // Aliases ship as one flat array rather than pairs, which halves the JSON.
    const built = buildVocabulary(
      { dims: 2, words: ["cat", "dog"], aliases: ["cats", "cat"] },
      new Int8Array([127, 0, 0, 127]),
    );

    expect(built.index.get("dog")).toBe(1);
    expect(resolve(built, "cats")).toBe("cat");
  });
});

describe("the guess row", () => {
  it("fills the row for a near miss and barely marks a distant one", () => {
    expect(fillFor(1, 20_000)).toBe(100);
    expect(fillFor(20_000, 20_000)).toBeLessThan(2);
    expect(fillFor(300, 20_000)).toBeGreaterThan(fillFor(3000, 20_000));
  });

  it("never gives a row a bar too small to see", () => {
    expect(fillFor(19_999, 20_000)).toBeGreaterThan(0);
  });

  it("bands closeness so the color says something", () => {
    expect(heatFor(1)).toBe("hot");
    expect(heatFor(300)).toBe("hot");
    expect(heatFor(301)).toBe("warm");
    expect(heatFor(1500)).toBe("warm");
    expect(heatFor(1501)).toBe("cold");
  });
});

describe("the secret list", () => {
  const file = JSON.parse(
    readFileSync(join(process.cwd(), "public", "contexto", "vocabulary.json"), "utf8"),
  ) as { words: string[]; aliases: string[] };
  const known = new Set(file.words);
  // The flat array is key, value, key, value, so the keys are the even slots.
  const folded = new Set(file.aliases.filter((_, i) => i % 2 === 0));

  it("only holds words the shipped vocabulary can rank", () => {
    const missing = secrets.filter((word) => !known.has(word));
    expect(missing).toEqual([]);
  });

  it("holds no word that is really an inflection of another", () => {
    // An alias has no vector of its own, so it could never be a secret.
    expect(secrets.filter((word) => folded.has(word))).toEqual([]);
  });

  it("holds no duplicates", () => {
    expect(new Set(secrets).size).toBe(secrets.length);
  });

  it("is long enough to go a good while without repeating", () => {
    expect(secrets.length).toBeGreaterThan(365);
  });
});

describe("the daily word", () => {
  it("gives everyone the same word on the same day", () => {
    expect(secretFor("2026-03-03")).toBe(secretFor("2026-03-03"));
  });

  it("changes from one day to the next", () => {
    expect(secretFor("2026-03-03")).not.toBe(secretFor("2026-03-04"));
  });

  it("uses every word before it uses any word twice", () => {
    let day = "2026-01-01";
    const seen = new Set<string>();
    for (let i = 0; i < order.length; i += 1) {
      seen.add(secretFor(day));
      day = addDays(day, 1);
    }
    expect(seen.size).toBe(order.length);
  });

  it("steps by exactly one word a day across a daylight saving change", () => {
    // The clock moves an hour on 2026-03-08 in New York. A counter built on
    // elapsed time would stumble here; one built on the date cannot.
    const before = order.indexOf(secretFor("2026-03-07"));
    const after = order.indexOf(secretFor("2026-03-08"));
    expect(after).toBe(before + 1);
  });

  it("only ever picks a word the vocabulary knows", () => {
    expect(order.every((word) => secrets.includes(word))).toBe(true);
    expect(order).toHaveLength(secrets.length);
  });
});
