/**
 * Builds the word data Contexto ranks guesses against.
 *
 * Run by hand, not by the build: `npm run contexto:words`. The output is
 * committed, so the site never downloads a 862MB archive and CI never needs the
 * network. Re-run it only to change the vocabulary.
 *
 * The source is GloVe 6B (Pennington, Socher and Manning, 2014), released into
 * the public domain. Its 50-dimensional vectors are one entry inside a large
 * zip, so rather than pull the whole archive we range-request the slice that
 * entry starts at and stop inflating once we have enough words. GloVe lists
 * words in frequency order, so "enough" arrives early.
 *
 * Fifty dimensions is plenty here. The game only needs words ordered by how
 * related they are, and 50d and 100d produce near-identical orderings for the
 * everyday words this vocabulary holds.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inflateRawSync, constants } from "node:zlib";
import wordListPath from "word-list";

const ARCHIVE = "https://huggingface.co/stanfordnlp/glove/resolve/main/glove.6B.zip";

/**
 * Where `glove.6B.50d.txt` begins inside the archive, read once from the zip's
 * central directory. A local file header precedes the deflate stream; its
 * length is fixed for this entry.
 */
const ENTRY_OFFSET = 792999805;
const ENTRY_HEADER = 74;

/** Enough compressed bytes for roughly seventy thousand words. */
const SLICE_BYTES = 12_000_000;

const DIMS = 50;

/** How many words a guess is ranked against. */
const VOCABULARY = 20_000;

/**
 * GloVe is trained on news, which knows far more about policy than about
 * kitchens. Twenty thousand words by frequency still misses things anyone would
 * think to guess, so these are pulled in regardless of where they place.
 */
const EVERYDAY = [
  "pillow", "kettle", "kitten", "puppy", "pancake", "cupcake", "noodle",
  "crayon", "squirrel", "cactus", "drawer", "spatula", "toaster", "blender",
  "napkin", "saucer", "teapot", "cutlery", "hallway", "attic",
  "porch", "fence", "hedge", "lawn", "shed", "barn", "chimney", "gutter",
  "mattress", "quilt", "wardrobe", "dresser", "stool", "bench",
  "cushion", "rug", "vase", "candle", "lantern", "flashlight", "batteries",
  "zipper", "button", "pocket", "collar", "sleeve",
  "scarf", "glove", "sock", "sandal", "slipper", "raincoat", "umbrella",
  "backpack", "suitcase", "wallet", "sunglasses", "toothbrush",
  "toothpaste", "shampoo", "towel", "bathtub", "faucet", "mirror", "comb",
  "razor", "bandage", "tissue", "broom", "bucket", "sponge",
  "detergent", "hanger", "ironing", "laundry",
  "waffle", "muffin", "donut", "pretzel", "popcorn", "peanut", "walnut",
  "almond", "raisin", "apricot", "peach", "plum", "cherry", "berry",
  "blueberry", "raspberry", "watermelon", "pineapple", "coconut", "mango",
  "avocado", "cucumber", "lettuce", "spinach", "broccoli", "carrot", "celery",
  "onion", "garlic", "ginger", "parsley", "basil", "cinnamon", "vanilla",
  "honey", "syrup", "jam", "mustard", "ketchup", "vinegar", "yogurt",
  "pasta", "spaghetti", "lasagna", "porridge", "cereal",
  "hedgehog", "otter", "badger", "raccoon", "beaver", "hamster",
  "parrot", "canary", "sparrow", "seagull", "flamingo", "ostrich", "peacock",
  "jellyfish", "starfish", "octopus", "lobster", "crab", "snail",
  "caterpillar", "dragonfly", "grasshopper", "beetle", "moth",
  "daisy", "tulip", "sunflower", "lavender", "orchid", "fern", "moss",
  "acorn", "pebble", "puddle", "rainbow", "snowflake",
  "campfire", "hammock", "canoe", "paddle", "kayak", "sled", "sleigh",
  "trampoline", "seesaw", "swing", "kite", "marble", "jigsaw", "crossword",
  "lullaby", "bedtime", "nap", "yawn", "giggle", "hiccup", "sneeze",
];

/**
 * Candidates considered before folding inflections. Wider than the vocabulary
 * so that folding "mountains" away still leaves a full twenty thousand words.
 */
const CANDIDATES = 60_000;

/**
 * How alike an inflection has to be to its base before we treat them as one
 * word. "mountains" and "mountain" sit around 0.85; "news" and "new" are far
 * apart and stay separate, which is the case this guard exists for.
 */
const FOLD_SIMILARITY = 0.6;

const MIN_LENGTH = 3;
const MAX_LENGTH = 12;

/**
 * Words the list is missing. SCOWL is broad but not current, so a few things
 * people would reasonably type are absent, and refusing a guess of "selfie"
 * would feel broken.
 */
const MODERN = [
  "selfie", "hashtag", "emoji", "meme", "smartphone", "webcam", "wifi",
  "bluetooth", "podcast", "streaming", "malware", "burrito", "smoothie",
  "hoodie", "sneaker", "scooter", "snowboard", "treadmill", "sunscreen",
];

/**
 * Words that are really proper nouns wearing a lowercase disguise. The
 * dictionary lists these because they double as adjectives, but nobody wants
 * "pacific" turning up near the top of a board about the sea.
 */
const NOT_REALLY_WORDS = new Set([
  "atlantic", "pacific", "arctic", "antarctic", "american", "african", "asian",
  "european", "british", "english", "french", "german", "spanish", "italian",
  "russian", "chinese", "japanese", "indian", "korean", "mexican", "canadian",
  "australian", "irish", "scottish", "greek", "roman", "soviet", "nazi",
  "christian", "catholic", "jewish", "muslim", "islamic", "hindu", "buddhist",
  "republican", "democrat", "democratic", "olympic", "olympics",
]);

/**
 * Function words. They are among the most frequent words in the language and
 * among the least interesting to guess, and each sits in a dense cluster that
 * makes its ranking meaningless.
 */
const STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how",
  "its", "may", "new", "now", "old", "see", "two", "way", "who", "did", "yes",
  "hers", "she", "they", "them", "their", "there", "then", "than",
  "this", "that", "these", "those", "with", "from", "have", "been", "were",
  "will", "would", "could", "should", "shall", "must", "might", "into", "onto",
  "upon", "over", "under", "after", "before", "while", "about", "above",
  "below", "between", "through", "during", "against", "among", "because",
  "since", "until", "unless", "though", "although", "however", "therefore",
  "thus", "hence", "moreover", "furthermore", "nevertheless", "meanwhile",
  "whereas", "whether", "either", "neither", "both", "each", "every", "some",
  "such", "same", "other", "another", "much", "many", "more", "most", "less",
  "least", "very", "just", "only", "even", "also", "still", "yet", "already",
  "again", "once", "twice", "here", "when", "where", "what", "which", "whose",
  "whom", "why", "does", "doing", "done", "being", "having", "said", "says",
  "including", "according", "regarding", "concerning", "toward", "towards",
  "per", "via", "etc",
]);

interface Vector {
  word: string;
  values: Float32Array;
}

/** Fetches the entry's opening bytes, caching them so re-runs are instant. */
async function slice(): Promise<Buffer> {
  const cached = join(tmpdir(), `glove-50d-${SLICE_BYTES}.deflate`);
  if (existsSync(cached)) return readFileSync(cached);

  process.stdout.write("Fetching GloVe... ");
  const to = ENTRY_OFFSET + SLICE_BYTES - 1;
  const response = await fetch(ARCHIVE, {
    headers: { Range: `bytes=${ENTRY_OFFSET}-${to}` },
  });
  if (!response.ok) throw new Error(`GloVe request failed (${response.status}).`);

  const body = Buffer.from(await response.arrayBuffer());
  const name = readEntryName(body);
  if (name !== "glove.6B.50d.txt") {
    throw new Error(`Expected glove.6B.50d.txt at that offset, found "${name}".`);
  }

  const deflated = body.subarray(ENTRY_HEADER);
  writeFileSync(cached, deflated);
  console.log(`${(body.length / 1e6).toFixed(1)}MB`);
  return deflated;
}

/** Reads the filename out of a zip local file header, as a sanity check. */
function readEntryName(header: Buffer): string {
  if (header.readUInt32LE(0) !== 0x04034b50) throw new Error("Not a zip entry header.");
  const nameLength = header.readUInt16LE(26);
  return header.subarray(30, 30 + nameLength).toString();
}

/**
 * Inflates the slice and parses it into vectors.
 *
 * The slice deliberately stops mid-stream, so zlib is told to finish on a sync
 * flush rather than insisting on a proper end-of-stream marker it will never
 * reach.
 */
function parse(deflated: Buffer): Vector[] {
  const text = inflateRawSync(deflated, {
    finishFlush: constants.Z_SYNC_FLUSH,
    maxOutputLength: 200e6,
  }).toString("utf8");

  const vectors: Vector[] = [];
  // The final line stops partway through, so it is dropped rather than parsed.
  const lines = text.split("\n").slice(0, -1);

  for (const line of lines) {
    const parts = line.split(" ");
    if (parts.length !== DIMS + 1) continue;

    const values = new Float32Array(DIMS);
    for (let i = 0; i < DIMS; i += 1) values[i] = Number(parts[i + 1]);
    vectors.push({ word: parts[0]!, values });
  }

  return vectors;
}

/** Scales a vector to unit length, so a dot product is a cosine similarity. */
function normalize(values: Float32Array): Float32Array {
  let sum = 0;
  for (const value of values) sum += value * value;
  const length = Math.sqrt(sum) || 1;

  const unit = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) unit[i] = values[i]! / length;
  return unit;
}

function similarity(a: Float32Array, b: Float32Array): number {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) total += a[i]! * b[i]!;
  return total;
}

/** The English words a guess is allowed to be, minus the proper nouns. */
function dictionary(): Set<string> {
  const known = new Set(MODERN);
  for (const line of readFileSync(wordListPath, "utf8").split("\n")) {
    const word = line.trim();
    if (word && /^[a-z]+$/.test(word)) known.add(word);
  }
  return known;
}

/**
 * The base forms an inflected word might have come from.
 *
 * Deliberately generous: every candidate is checked against the vocabulary and
 * against a similarity floor before anything is folded, so a wrong guess here
 * costs nothing.
 */
function baseForms(word: string): string[] {
  const forms: string[] = [];
  const add = (form: string) => {
    if (form.length >= MIN_LENGTH && form !== word) forms.push(form);
  };

  if (word.endsWith("ies")) add(`${word.slice(0, -3)}y`);
  if (word.endsWith("es")) add(word.slice(0, -2));
  if (word.endsWith("s") && !word.endsWith("ss")) add(word.slice(0, -1));

  if (word.endsWith("ied")) add(`${word.slice(0, -3)}y`);
  if (word.endsWith("ed")) {
    add(word.slice(0, -2));
    add(word.slice(0, -1));
    // "stopped" drops the doubled consonant as well as the ending.
    if (isDoubled(word.slice(0, -2))) add(word.slice(0, -3));
  }

  if (word.endsWith("ing")) {
    add(word.slice(0, -3));
    add(`${word.slice(0, -3)}e`);
    if (isDoubled(word.slice(0, -3))) add(word.slice(0, -4));
  }

  if (word.endsWith("ly")) add(word.slice(0, -2));
  if (word.endsWith("er")) add(word.slice(0, -2));
  if (word.endsWith("est")) add(word.slice(0, -3));

  return forms;
}

/** True when a stem ends in a doubled consonant, as in "stopp" or "runn". */
function isDoubled(stem: string): boolean {
  const last = stem.at(-1);
  return Boolean(last && last === stem.at(-2) && !"aeiou".includes(last));
}

async function main(): Promise<void> {
  const vectors = parse(await slice());
  console.log(`Parsed ${vectors.length.toLocaleString()} vectors.`);

  const known = dictionary();
  const units = new Map<string, Float32Array>();
  for (const { word, values } of vectors) units.set(word, normalize(values));

  // Frequency order is the order GloVe lists them in, and it is the order we
  // want: the commonest words make the most guessable vocabulary.
  const candidates: string[] = [];
  for (const { word } of vectors) {
    if (candidates.length >= CANDIDATES) break;
    if (!/^[a-z]+$/.test(word)) continue;
    if (word.length < MIN_LENGTH || word.length > MAX_LENGTH) continue;
    if (STOP.has(word) || NOT_REALLY_WORDS.has(word)) continue;
    if (!known.has(word)) continue;

    candidates.push(word);
  }
  console.log(`Kept ${candidates.length.toLocaleString()} candidates.`);

  // Fold inflections into whichever base form the data agrees they belong to.
  const ranked = new Set(candidates);
  const aliases = new Map<string, string>();

  for (const word of candidates) {
    let best: { base: string; score: number } | null = null;

    for (const form of baseForms(word)) {
      if (!ranked.has(form) || aliases.has(form)) continue;
      const score = similarity(units.get(word)!, units.get(form)!);
      if (score >= FOLD_SIMILARITY && (!best || score > best.score)) {
        best = { base: form, score };
      }
    }

    if (best) {
      aliases.set(word, best.base);
      ranked.delete(word);
    }
  }
  console.log(`Folded ${aliases.size.toLocaleString()} inflections.`);

  const words = candidates.filter((word) => ranked.has(word)).slice(0, VOCABULARY);

  // The everyday words frequency alone would have left out. Added after the cut
  // rather than promoted into it, so they extend the vocabulary instead of
  // pushing something else out.
  const kept = new Set(words);
  let added = 0;
  for (const word of EVERYDAY) {
    if (kept.has(word) || aliases.has(word) || !units.has(word)) continue;
    words.push(word);
    kept.add(word);
    added += 1;
  }
  const absent = EVERYDAY.filter((word) => !kept.has(word) && !aliases.has(word));
  console.log(`Added ${added} everyday words${absent.length ? `, ${absent.length} had no vector: ${absent.join(", ")}` : ""}.`);

  // An alias is only useful if its base survived the cut.
  const useful = [...aliases].filter(([, base]) => kept.has(base));
  console.log(`Vocabulary: ${words.length.toLocaleString()} words, ${useful.length} aliases.`);

  // Quantized to a byte per dimension. The vectors are unit length, so every
  // component sits inside [-1, 1], and 127 steps is far finer than the game can
  // see: ranking only cares about the order the similarities come out in.
  const packed = new Int8Array(words.length * DIMS);
  words.forEach((word, index) => {
    const unit = units.get(word)!;
    for (let d = 0; d < DIMS; d += 1) {
      packed[index * DIMS + d] = Math.max(-127, Math.min(127, Math.round(unit[d]! * 127)));
    }
  });

  const out = join(process.cwd(), "public", "contexto");
  mkdirSync(out, { recursive: true });

  writeFileSync(join(out, "vectors.bin"), Buffer.from(packed.buffer));
  writeFileSync(
    join(out, "vocabulary.json"),
    // Aliases as a flat list of pairs rather than an object: the same data in
    // far fewer bytes, and the client turns it into a Map either way.
    JSON.stringify({ dims: DIMS, words, aliases: useful.flat() })
  );

  const size = (name: string) => (statSync(join(out, name)).size / 1024).toFixed(0);
  console.log(
    `Wrote vectors.bin (${size("vectors.bin")}KB) and vocabulary.json (${size("vocabulary.json")}KB).`
  );
}

await main();
