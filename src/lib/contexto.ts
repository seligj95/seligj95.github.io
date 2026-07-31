/**
 * Contexto: guess the secret word, and every guess comes back with its rank.
 *
 * Rank 1 is the answer. Rank 2 is the word the model thinks is closest to it,
 * and so on down a vocabulary of twenty thousand. There are no hints and no
 * letter feedback - the only information is how near your last guess landed.
 *
 * The whole thing runs in the browser. Ranking a guess is a lookup in a table
 * built once when the game starts, so there is no round trip and no server to
 * wake up. The trade is that a determined person can read the answer out of the
 * shipped data, which is the same trade the rest of the arcade already makes.
 */

/** The shape of the generated `vocabulary.json`. */
type VocabularyFile = {
  dims: number;
  words: string[];
  /** Flat `[inflection, base, inflection, base, ...]` pairs. */
  aliases: string[];
};

export type Vocabulary = {
  dims: number;
  words: string[];
  /** Word to its position in `words`. */
  index: Map<string, number>;
  /** Inflection to the base form that carries the vector. */
  aliases: Map<string, string>;
  /** `words.length * dims` unit vectors, quantized to a byte a dimension. */
  vectors: Int8Array;
};

/** How a guess was read. */
export type GuessOutcome =
  | { kind: "scored"; guess: Guess }
  | { kind: "repeat"; guess: Guess }
  | { kind: "unknown"; typed: string }
  | { kind: "empty" };

export type Guess = {
  /** What the player typed, tidied up. */
  typed: string;
  /** The vocabulary word it resolved to. Differs when an inflection folded. */
  word: string;
  /** 1 for the answer, up to the vocabulary size for the least related word. */
  rank: number;
};

/** Trims a raw guess to the letters a vocabulary word could be made of. */
export function tidy(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

/**
 * The vocabulary word a guess means, or null if we do not know the word.
 * "Mountains" and "mountain" are the same guess.
 */
export function resolve(vocabulary: Vocabulary, raw: string): string | null {
  const word = tidy(raw);
  if (!word) return null;
  if (vocabulary.index.has(word)) return word;

  const base = vocabulary.aliases.get(word);
  return base && vocabulary.index.has(base) ? base : null;
}

/** Reads a word's unit vector as plain numbers, scaled back to [-1, 1]. */
export function vectorAt(vocabulary: Vocabulary, position: number): Float32Array {
  const { dims, vectors } = vocabulary;
  const unit = new Float32Array(dims);
  for (let d = 0; d < dims; d += 1) unit[d] = vectors[position * dims + d]! / 127;
  return unit;
}

/**
 * Every word's rank against one secret, indexed the same way as `words`.
 *
 * Both sides are unit vectors, so a dot product is the cosine and sorting on it
 * sorts by relatedness. Twenty thousand fifty-dimensional dot products is a
 * couple of milliseconds, and it only happens once a game.
 */
export function rankAgainst(vocabulary: Vocabulary, secret: number): Int32Array {
  const { dims, words, vectors } = vocabulary;
  const count = words.length;

  const scores = new Float64Array(count);
  for (let i = 0; i < count; i += 1) {
    let total = 0;
    for (let d = 0; d < dims; d += 1) {
      total += vectors[secret * dims + d]! * vectors[i * dims + d]!;
    }
    scores[i] = total;
  }

  const order = new Int32Array(count);
  for (let i = 0; i < count; i += 1) order[i] = i;
  // Ties broken by position, which is frequency order, so the ranking is
  // stable across browsers rather than depending on the sort implementation.
  order.sort((a, b) => scores[b]! - scores[a]! || a - b);

  const ranks = new Int32Array(count);
  for (let place = 0; place < count; place += 1) ranks[order[place]!] = place + 1;
  return ranks;
}

/** The words nearest the secret, closest first, for the reveal after a win. */
export function nearest(
  vocabulary: Vocabulary,
  ranks: Int32Array,
  count: number
): string[] {
  const top: string[] = new Array(Math.min(count, vocabulary.words.length));
  for (let i = 0; i < ranks.length; i += 1) {
    const place = ranks[i]! - 1;
    if (place < top.length) top[place] = vocabulary.words[i]!;
  }
  return top;
}

/** One round of the game. */
export class Game {
  readonly secret: string;
  private readonly vocabulary: Vocabulary;
  private readonly ranks: Int32Array;
  private readonly seen = new Map<string, Guess>();
  private order: Guess[] = [];
  private done = false;

  constructor(vocabulary: Vocabulary, secret: string) {
    const position = vocabulary.index.get(secret);
    if (position === undefined) {
      throw new Error(`Secret "${secret}" is not in the vocabulary.`);
    }

    this.vocabulary = vocabulary;
    this.secret = secret;
    this.ranks = rankAgainst(vocabulary, position);
  }

  /** Guesses in the order they were made. */
  get history(): readonly Guess[] {
    return this.order;
  }

  /** Guesses sorted by how close they were, best first. */
  get byRank(): readonly Guess[] {
    return [...this.order].sort((a, b) => a.rank - b.rank);
  }

  /** How many guesses it took, which is the score. */
  get count(): number {
    return this.order.length;
  }

  get won(): boolean {
    return this.done;
  }

  /** The best rank reached so far, or null before the first scored guess. */
  get best(): number | null {
    return this.order.length ? Math.min(...this.order.map((g) => g.rank)) : null;
  }

  guess(raw: string): GuessOutcome {
    const typed = tidy(raw);
    if (!typed) return { kind: "empty" };

    const word = resolve(this.vocabulary, typed);
    if (!word) return { kind: "unknown", typed };

    const already = this.seen.get(word);
    if (already) return { kind: "repeat", guess: already };

    const guess: Guess = {
      typed,
      word,
      rank: this.ranks[this.vocabulary.index.get(word)!]!,
    };

    this.seen.set(word, guess);
    this.order.push(guess);
    if (guess.rank === 1) this.done = true;

    return { kind: "scored", guess };
  }

  /** The closest words to the answer, for the reveal once the round is over. */
  closest(count = 10): string[] {
    return nearest(this.vocabulary, this.ranks, count);
  }
}

/** Turns the two generated files into a vocabulary. */
export function buildVocabulary(file: VocabularyFile, vectors: Int8Array): Vocabulary {
  const index = new Map<string, number>();
  file.words.forEach((word, position) => index.set(word, position));

  const aliases = new Map<string, string>();
  for (let i = 0; i + 1 < file.aliases.length; i += 2) {
    aliases.set(file.aliases[i]!, file.aliases[i + 1]!);
  }

  return { dims: file.dims, words: file.words, index, aliases, vectors };
}

let pending: Promise<Vocabulary> | null = null;

/**
 * Fetches the vocabulary, once per page. Roughly a megabyte, so it is asked for
 * only when a Contexto page actually loads, and the browser caches it after.
 */
export function loadVocabulary(base = ""): Promise<Vocabulary> {
  pending ??= (async () => {
    const [file, vectors] = await Promise.all([
      fetch(`${base}/contexto/vocabulary.json`).then((r) => {
        if (!r.ok) throw new Error(`vocabulary.json: ${r.status}`);
        return r.json() as Promise<VocabularyFile>;
      }),
      fetch(`${base}/contexto/vectors.bin`).then(async (r) => {
        if (!r.ok) throw new Error(`vectors.bin: ${r.status}`);
        return new Int8Array(await r.arrayBuffer());
      }),
    ]);

    return buildVocabulary(file, vectors);
  })();

  // A failed load should not poison every later attempt.
  pending.catch(() => {
    pending = null;
  });

  return pending;
}
