/**
 * The Contexto board, as a thing you can mount on a page.
 *
 * Two pages want it: free play, where you take a fresh word whenever you like,
 * and the daily, where the word is handed to you and the guesses are the score.
 * The typing, the ranking and the list are identical in both, so they live here
 * and each page supplies what differs — where the word comes from, and what to
 * do when it is found.
 *
 * Everything is found by id, the same way the Queens board does it.
 */

import { Game, loadVocabulary, type Guess, type Vocabulary } from "./contexto";

/** Ranks at or under this read as close, and then as middling. */
const HOT = 300;
const WARM = 1500;

export interface ContextoBoardOptions {
  /** Picks the word for a round. */
  secretFor: (vocabulary: Vocabulary) => string;
  /** Runs after each guess that scored, with the running total. */
  onGuess?: (info: { guess: Guess; count: number }) => void;
  /** Runs once the word is found. */
  onWin?: (info: { count: number; secret: string }) => void;
  /**
   * Guesses to replay before play starts, so a page that was reloaded picks up
   * where it left off. Replayed silently: no callbacks, no win panel.
   */
  restore?: () => string[];
}

export interface ContextoBoard {
  /** Loads the word list if needed, takes a word, and clears the board. */
  start: () => Promise<void>;
  /** The words guessed this round, in the order they were made. */
  guesses: () => string[];
  /** Stops any further guessing. */
  freeze: () => void;
  /** Gives the answer away and ends the round. */
  giveUp: () => void;
}

/** How far along the row the bar reaches: near-1 fills it, 20,000 barely shows. */
export function fillFor(rank: number, total: number): number {
  const share = 1 - Math.log(rank) / Math.log(total);
  return Math.max(1.5, Math.min(100, share * 100));
}

export function heatFor(rank: number): "hot" | "warm" | "cold" {
  if (rank <= HOT) return "hot";
  if (rank <= WARM) return "warm";
  return "cold";
}

export function mountContexto(options: ContextoBoardOptions): ContextoBoard {
  const form = document.getElementById("contexto-form") as HTMLFormElement;
  const input = document.getElementById("contexto-input") as HTMLInputElement;
  const submit = document.getElementById("contexto-submit") as HTMLButtonElement;
  const message = document.getElementById("contexto-message") as HTMLParagraphElement;
  const latest = document.getElementById("contexto-latest") as HTMLOListElement;
  const list = document.getElementById("contexto-list") as HTMLOListElement;
  const win = document.getElementById("contexto-win") as HTMLDivElement;
  const winTitle = document.getElementById("contexto-win-title") as HTMLParagraphElement;
  const winNote = document.getElementById("contexto-win-note") as HTMLParagraphElement;
  const closest = document.getElementById("contexto-closest") as HTMLParagraphElement;

  let vocabulary: Vocabulary | null = null;
  let game: Game | null = null;
  let frozen = true;

  function say(text: string, tone: "plain" | "bad" = "plain"): void {
    message.textContent = text;
    message.hidden = !text;
    if (tone === "bad") message.dataset.tone = "bad";
    else delete message.dataset.tone;
  }

  function row(guess: Guess, total: number): HTMLLIElement {
    const item = document.createElement("li");
    item.dataset.heat = heatFor(guess.rank);
    if (guess.rank === 1) item.dataset.found = "";
    item.style.setProperty("--fill", `${fillFor(guess.rank, total).toFixed(1)}%`);

    const word = document.createElement("span");
    word.className = "contexto-word";
    word.textContent = guess.word;

    const rank = document.createElement("span");
    rank.className = "contexto-rank";
    rank.textContent = String(guess.rank);
    // The bar is decorative; the rank is the number, and it needs saying.
    rank.setAttribute("aria-label", `rank ${guess.rank} of ${total}`);

    item.append(word, rank);
    return item;
  }

  /**
   * Redrawn whole rather than spliced. The list sorts by rank, so a new guess
   * can land anywhere in it, and at a few dozen rows the difference is nothing.
   */
  function draw(newest: Guess | null): void {
    if (!game || !vocabulary) return;
    const total = vocabulary.words.length;

    list.replaceChildren(...game.byRank.map((guess) => row(guess, total)));
    latest.replaceChildren(...(newest ? [row(newest, total)] : []));
  }

  function enable(on: boolean): void {
    frozen = !on;
    input.disabled = !on;
    submit.disabled = !on;
  }

  /**
   * Ends the round. The box goes rather than greying out: a disabled field
   * under a panel saying you have finished is just something left over. The
   * pinned guess goes with it — it exists to hold your newest guess still while
   * the list reorders, and once there is no next guess it is only the top row
   * of the list printed twice.
   */
  function close(): void {
    enable(false);
    form.hidden = true;
    latest.replaceChildren();
    say("");
  }

  function finish(): void {
    if (!game) return;
    close();
    win.hidden = false;
    winTitle.textContent = "Got it";
    winNote.textContent =
      game.count === 1
        ? `“${game.secret}” first time. That is either luck or telepathy.`
        : `“${game.secret}” in ${game.count} guesses.`;
    closest.textContent = `Closest words: ${game.closest(8).slice(1).join(", ")}.`;
    closest.hidden = false;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (frozen || !game) return;

    const outcome = game.guess(input.value);
    switch (outcome.kind) {
      case "empty":
        return;
      case "unknown":
        say(`“${outcome.typed}” is not in the word list.`, "bad");
        return;
      case "repeat":
        say(`You already guessed “${outcome.guess.word}”. It was ${outcome.guess.rank}.`);
        input.value = "";
        return;
      case "scored": {
        say("");
        input.value = "";
        draw(outcome.guess);
        options.onGuess?.({ guess: outcome.guess, count: game.count });
        if (outcome.guess.rank === 1) {
          finish();
          options.onWin?.({ count: game.count, secret: game.secret });
        }
      }
    }
  });

  return {
    async start() {
      say("Fetching the word list\u2026");
      try {
        vocabulary ??= await loadVocabulary(import.meta.env.BASE_URL.replace(/\/$/, ""));
      } catch {
        say("The word list would not load. Try a refresh.", "bad");
        return;
      }

      game = new Game(vocabulary, options.secretFor(vocabulary));
      win.hidden = true;
      closest.hidden = true;
      form.hidden = false;
      say("");

      // Replaying puts the board back exactly as it was, including the count,
      // so a reload is not a way to start the day's word over.
      const earlier = options.restore?.() ?? [];
      let last: Guess | null = null;
      for (const word of earlier) {
        const outcome = game.guess(word);
        if (outcome.kind === "scored") last = outcome.guess;
      }

      draw(last);
      enable(true);
      if (game.won) finish();
      else input.focus();
    },

    guesses() {
      return game ? game.history.map((guess) => guess.word) : [];
    },

    freeze() {
      enable(false);
    },

    giveUp() {
      if (!game || game.won) return;
      close();
      win.hidden = false;
      // The same panel, so it had better not congratulate you for stopping.
      winTitle.textContent = "That one got away";
      winNote.textContent = `The word was “${game.secret}”.`;
      closest.textContent = `Closest words: ${game.closest(8).slice(1).join(", ")}.`;
      closest.hidden = false;
    },
  };
}
