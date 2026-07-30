/**
 * The Queens board, as a thing you can mount on a page.
 *
 * Two pages want this board: free play, where you pick a size and deal as many
 * boards as you like, and the daily, where the board is handed to you, the
 * clock is running and there is no second go. The board itself - the painting,
 * the drag handling, the tiered hint engine - is identical in both, so it lives
 * here and each page supplies the parts that differ.
 *
 * Everything is found by id, and the controls a page does not have are simply
 * absent rather than optional-by-configuration. The daily page has no size
 * picker and no "new puzzle" button, and that is all it takes to leave them out.
 */

import { generate, type Puzzle } from "./queens";

export interface QueensBoardOptions {
  /**
   * Where a fresh board comes from. Free play generates one; the daily hands
   * over the day's.
   */
  deal?: () => Puzzle;
  /** Runs after a board is built and painted. */
  onBuild?: (puzzle: Puzzle) => void;
  /** Runs on the first square you touch on a board. Starts the daily clock. */
  onFirstMove?: () => void;
  /** Runs each time a hint is taken, with the running total. */
  onHint?: (hintsUsed: number) => void;
  /** Runs once when the board comes out solved. */
  onSolved?: (info: { hintsUsed: number }) => void;
  /**
   * Lets a page write its own status line. Return a string to override, or
   * nothing to keep the default crown count.
   */
  statusFor?: (info: { placed: number; size: number; solved: boolean }) => string | undefined;
}

export interface QueensBoard {
  /** Deals and paints a fresh board. */
  build: () => void;
  /** The board on screen right now. */
  current: () => Puzzle | null;
  /** Locks the board so no further moves register. */
  freeze: () => void;
  /** Unlocks it again. */
  thaw: () => void;
}

export function mountQueens(options: QueensBoardOptions = {}): QueensBoard {

  type CellState = "empty" | "mark" | "queen";

  const board = document.getElementById("queens-board") as HTMLDivElement;
  const status = document.getElementById("queens-status") as HTMLSpanElement;
  const newButton = document.getElementById("queens-new") as HTMLButtonElement | null;
  const clearButton = document.getElementById("queens-clear") as HTMLButtonElement | null;
  const hintButton = document.getElementById("queens-hint") as HTMLButtonElement;
  const undoButton = document.getElementById("queens-undo") as HTMLButtonElement;
  const win = document.getElementById("queens-win") as HTMLDivElement;
  const winNote = document.getElementById("queens-win-note") as HTMLParagraphElement;
  const nextButton = document.getElementById("queens-next") as HTMLButtonElement | null;
  const levelButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-level]")
  );

  const MARK_SVG =
    '<svg class="glyph mark" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5.6 5.6 18.4 18.4M18.4 5.6 5.6 18.4" fill="none" stroke="currentColor" ' +
    'stroke-width="3.2" stroke-linecap="round" /></svg>';

  const CROWN_HTML =
    '<img class="glyph crown" src="' +
    (board.dataset.crown ?? "") +
    '" alt="" aria-hidden="true" draggable="false" width="128" height="128" />';

  let size = 8;
  let regions: number[] = [];
  let cells: CellState[] = [];
  /** The board's one legal answer, kept so Hint has something to be sure about. */
  let solution: number[] = [];
  /** Board snapshots, oldest first, so Undo can walk back a move at a time. */
  let history: CellState[][] = [];
  /** Crowns that came from a hint rather than from you. */
  const hinted = new Set<number>();
  /** Squares the current hint is spotlighting. */
  const focus = new Set<number>();
  /** The advice showing right now, so pressing hint twice plays it. */
  let lastHint = "";
  let hintsUsed = 0;
  /** What each square currently shows, so paint only rebuilds what changed. */
  let rendered: CellState[] = [];
  let solved = false;
  /** The board on screen, for callers that want to know what was dealt. */
  let current: Puzzle | null = null;
  /** Set once the day is over, so a finished daily cannot be nudged further. */
  let frozen = false;
  /** Whether this board has been touched yet, so the clock starts on move one. */
  let started = false;

  /**
   * Hand-picked hues rather than an even sweep: evenly spaced hues put two
   * greens next to each other, which is miserable on a color-matching puzzle.
   */
  const HUES = [4, 32, 52, 96, 152, 190, 222, 262, 292, 328];

  function hueFor(region: number, n: number): number {
    const step = (HUES.length - 1) / Math.max(1, n - 1);
    return HUES[Math.round(region * step)];
  }

  function describe(index: number): string {
    const row = Math.floor(index / size) + 1;
    const column = (index % size) + 1;
    const region = regions[index] + 1;
    const state =
      cells[index] === "queen"
        ? "crown"
        : cells[index] === "mark"
          ? "crossed out"
          : "empty";
    return `Row ${row}, column ${column}, color ${region}, ${state}`;
  }

  /** Every queen that breaks a rule, so the board can hatch it. */
  function conflicts(): Set<number> {
    const bad = new Set<number>();
    const queens: number[] = [];
    cells.forEach((state, index) => {
      if (state === "queen") queens.push(index);
    });

    for (let a = 0; a < queens.length; a += 1) {
      for (let b = a + 1; b < queens.length; b += 1) {
        const first = queens[a];
        const second = queens[b];
        const rowA = Math.floor(first / size);
        const rowB = Math.floor(second / size);
        const columnA = first % size;
        const columnB = second % size;
        const touching =
          Math.abs(rowA - rowB) <= 1 && Math.abs(columnA - columnB) <= 1;

        if (
          rowA === rowB ||
          columnA === columnB ||
          regions[first] === regions[second] ||
          touching
        ) {
          bad.add(first);
          bad.add(second);
        }
      }
    }

    return bad;
  }

  function setStatus(message?: string) {
    if (message) {
      status.textContent = message;
      return;
    }
    const placed = cells.filter((state) => state === "queen").length;
    status.textContent =
      options.statusFor?.({ placed, size, solved }) ?? `${placed} of ${size} crowns`;
  }

  function paint() {
    const bad = conflicts();

    for (let index = 0; index < cells.length; index += 1) {
      const button = board.children[index] as HTMLButtonElement;
      const state = cells[index];
      button.dataset.state = state;
      button.setAttribute("aria-label", describe(index));

      const isBad = state === "queen" && bad.has(index);
      if (isBad) button.dataset.conflict = "true";
      else delete button.dataset.conflict;

      if (state === "queen" && hinted.has(index)) button.dataset.hint = "true";
      else delete button.dataset.hint;

      // Spotlight: the squares a hint is talking about stay lit, the rest dim.
      if (focus.size && !focus.has(index)) button.dataset.dim = "true";
      else delete button.dataset.dim;

      // Only touch the DOM when the square actually changed, otherwise every
      // repaint would restart the crown drop on squares that never moved.
      if (rendered[index] !== state) {
        button.innerHTML =
          state === "queen" ? CROWN_HTML : state === "mark" ? MARK_SVG : "";
        rendered[index] = state;
      }
    }

    const placed = cells.filter((state) => state === "queen").length;
    if (placed === size && bad.size === 0) {
      const first = !solved;
      solved = true;
      hintButton.disabled = true;
      setStatus("Solved. Every crown in the right place.");
      winNote.textContent = hintsUsed
        ? `Solved the ${size}\u00d7${size} board with ${hintsUsed} hint${hintsUsed === 1 ? "" : "s"}.`
        : `One crown in every row, column and color on the ${size}\u00d7${size} board.`;
      win.hidden = false;
      nextButton?.focus();
      // The daily rewrites the panel and stops its clock, so it needs to hear
      // about the win before the player can touch anything else.
      if (first) options.onSolved?.({ hintsUsed });
      return;
    }

    solved = false;
    // A frozen board keeps its hint button off: on the daily nothing should be
    // reachable until you have pressed Start, or once the day is finished.
    hintButton.disabled = frozen;
    win.hidden = true;
    setStatus();
  }

  /**
   * Undo works off whole-board snapshots rather than a move log: a drag can
   * touch a dozen squares, and one press should take all of them back.
   */
  function remember() {
    history.push([...cells]);
    if (history.length > 150) history.shift();
    undoButton.disabled = false;
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return;
    cells = previous;
    undoButton.disabled = history.length === 0;
    moveOn();
    paint();
  }

  /** Any move of your own retires the advice currently on screen. */
  function moveOn() {
    focus.clear();
    lastHint = "";
  }

  /**
   * A hint should teach the move, not make it. Everything below looks for a
   * step you could have found yourself, spotlights the row, column or color it
   * lives in, and says what holds there. Press again and it plays that step.
   */
  interface Deduction {
    /** Identity of this step, so a second press knows it's the same advice. */
    key: string;
    /** Squares to spotlight. Whole units, never the answer square alone. */
    focus: number[];
    message: string;
    /** Plays the step; returns what to say afterwards. */
    act: () => string;
  }

  /**
   * Squares that could still hold a crown, going by the crowns on the board and
   * by your own crossings-out. Trusting your X marks is what lets one hint build
   * on the last one, and the wrong-mark check in hint() is what makes trusting
   * them safe.
   */
  function openSquares(): number[] {
    const queens: number[] = [];
    cells.forEach((state, index) => {
      if (state === "queen") queens.push(index);
    });

    const rowsTaken = new Set(queens.map((index) => Math.floor(index / size)));
    const columnsTaken = new Set(queens.map((index) => index % size));
    const regionsTaken = new Set(queens.map((index) => regions[index]));
    const open: number[] = [];

    for (let index = 0; index < cells.length; index += 1) {
      if (cells[index] !== "empty") continue;
      const row = Math.floor(index / size);
      const column = index % size;
      if (rowsTaken.has(row) || columnsTaken.has(column)) continue;
      if (regionsTaken.has(regions[index])) continue;
      const touches = queens.some(
        (queen) =>
          Math.abs(Math.floor(queen / size) - row) <= 1 &&
          Math.abs((queen % size) - column) <= 1
      );
      if (touches) continue;
      open.push(index);
    }

    return open;
  }

  function group(open: number[], of: (index: number) => number): Map<number, number[]> {
    const map = new Map<number, number[]>();
    for (const index of open) {
      const key = of(index);
      const bucket = map.get(key);
      if (bucket) bucket.push(index);
      else map.set(key, [index]);
    }
    return map;
  }

  function placeStep(index: number, unit: string, focus: number[]): Deduction {
    return {
      key: `place:${index}`,
      focus,
      message: `Only one square in ${unit} can still take a crown.`,
      act: () => {
        cells[index] = "queen";
        hinted.add(index);
        return `Crown placed in row ${Math.floor(index / size) + 1}, column ${(index % size) + 1}.`;
      },
    };
  }

  function crossStep(victims: number[], reason: string, focus: number[]): Deduction {
    return {
      key: `cross:${victims.join(",")}`,
      focus,
      message: reason,
      act: () => {
        for (const index of victims) cells[index] = "mark";
        return `${victims.length} square${victims.length === 1 ? "" : "s"} crossed out.`;
      },
    };
  }

  interface Axis {
    key: (index: number) => number;
    /** "This color" / "Row 4" — the thing doing the deducing. */
    subject: (id: number) => string;
    /** "one color" / "row 4" — the thing it is pinned to. */
    object: (id: number) => string;
    /** "that color" / "row 4" — the same thing referred to again. */
    rest: (id: number) => string;
    plural: string;
  }

  const AXES: Record<string, Axis> = {
    color: {
      key: (index) => regions[index],
      subject: () => "This color",
      object: () => "one color",
      rest: () => "that color",
      plural: "colors",
    },
    row: {
      key: (index) => Math.floor(index / size),
      subject: (id) => `Row ${id + 1}`,
      object: (id) => `row ${id + 1}`,
      rest: (id) => `row ${id + 1}`,
      plural: "rows",
    },
    column: {
      key: (index) => index % size,
      subject: (id) => `Column ${id + 1}`,
      object: (id) => `column ${id + 1}`,
      rest: (id) => `column ${id + 1}`,
      plural: "columns",
    },
  };

  const AXIS_PAIRS: [string, string][] = [
    ["color", "row"],
    ["color", "column"],
    ["row", "color"],
    ["column", "color"],
    ["row", "column"],
    ["column", "row"],
  ];

  const COUNT_WORDS = ["", "one", "Two", "Three"];

  function combinations(ids: number[], k: number): number[][] {
    if (k === 1) return ids.map((id) => [id]);
    const out: number[][] = [];
    const walk = (start: number, picked: number[]) => {
      if (picked.length === k) {
        out.push([...picked]);
        return;
      }
      for (let i = start; i < ids.length; i += 1) {
        picked.push(ids[i]);
        walk(i + 1, picked);
        picked.pop();
      }
    };
    walk(0, []);
    return out;
  }

  /**
   * Pigeonhole: if k units of one kind can only reach k units of another, they
   * own those between them, so every other square there is out.
   */
  function lockedSet(open: number[], a: Axis, b: Axis, k: number): Deduction | null {
    const buckets = group(open, a.key);
    const ids = [...buckets.keys()];
    if (ids.length < k) return null;

    for (const combo of combinations(ids, k)) {
      const reach = new Set<number>();
      for (const id of combo) {
        for (const index of buckets.get(id) ?? []) reach.add(b.key(index));
      }
      if (reach.size !== k) continue;

      const victims = open.filter(
        (index) => reach.has(b.key(index)) && !combo.includes(a.key(index))
      );
      if (!victims.length) continue;

      const target = [...reach];
      const message =
        k === 1
          ? `${a.subject(combo[0])} can only put its crown in ${b.object(target[0])}, so the rest of ${b.rest(target[0])} is out.`
          : `${COUNT_WORDS[k]} ${a.plural} only fit in ${COUNT_WORDS[k].toLowerCase()} ${b.plural} between them, so everything else in those ${b.plural} is out.`;

      const focus = cells
        .map((_, index) => index)
        .filter((index) => combo.includes(a.key(index)) || reach.has(b.key(index)));

      return crossStep(victims, message, focus);
    }

    return null;
  }

  /**
   * If every square a unit has left would attack some square, that square is
   * out: crowning it would leave the unit nowhere to go. This is the rule that
   * reads the touching constraint, which nothing else here does.
   */
  function findCrossfire(open: number[]): Deduction | null {
    const attacks = (a: number, b: number) => {
      if (a === b) return true;
      const rowA = Math.floor(a / size);
      const rowB = Math.floor(b / size);
      const columnA = a % size;
      const columnB = b % size;
      if (rowA === rowB || columnA === columnB) return true;
      if (regions[a] === regions[b]) return true;
      return Math.abs(rowA - rowB) <= 1 && Math.abs(columnA - columnB) <= 1;
    };

    for (const [name, axis] of Object.entries(AXES)) {
      const buckets = group(open, axis.key);
      for (const [id, spots] of buckets) {
        if (spots.length < 2) continue;
        const victims = open.filter(
          (index) => axis.key(index) !== id && spots.every((spot) => attacks(spot, index))
        );
        if (!victims.length) continue;
        const focus = cells
          .map((_, index) => index)
          .filter((index) => axis.key(index) === id || victims.includes(index));
        const subject = name === "color" ? "this color" : axis.object(id).toLowerCase();
        return crossStep(
          victims,
          victims.length === 1
            ? `Every square ${subject} has left attacks the other square lit here, so it can't hold a crown.`
            : `Every square ${subject} has left attacks the other squares lit here, so none of them can hold a crown.`,
          focus
        );
      }
    }

    return null;
  }

  function findDeduction(): Deduction | null {
    const open = openSquares();
    const rows = group(open, (index) => Math.floor(index / size));
    const columns = group(open, (index) => index % size);
    const colors = group(open, (index) => regions[index]);
    const cellsOf = (test: (index: number) => boolean) =>
      cells.map((_, index) => index).filter(test);

    // The nicest step first: a unit with one square left in it.
    for (const [color, open1] of colors) {
      if (open1.length !== 1) continue;
      return placeStep(open1[0], "this color", cellsOf((index) => regions[index] === color));
    }
    for (const [row, open1] of rows) {
      if (open1.length !== 1) continue;
      return placeStep(open1[0], `row ${row + 1}`, cellsOf((index) => Math.floor(index / size) === row));
    }
    for (const [column, open1] of columns) {
      if (open1.length !== 1) continue;
      return placeStep(open1[0], `column ${column + 1}`, cellsOf((index) => index % size === column));
    }

    // Then the squeeze. If k units between them can only reach k lines, those
    // lines are spoken for and everything else in them is out. k = 1 is the
    // everyday "this color only fits in row 4"; k = 2 and 3 are the pigeonhole
    // steps that carry a board when nothing simpler is left.
    for (let k = 1; k <= 3; k += 1) {
      for (const [a, b] of AXIS_PAIRS) {
        const step = lockedSet(open, AXES[a], AXES[b], k);
        if (step) return step;
      }
    }

    // Last: the crossfire. If every square a unit has left would attack some
    // square, that square can't hold a crown — the unit would have nowhere
    // left to go. This is the one that reads the touching rule.
    const crossfire = findCrossfire(open);
    if (crossfire) return crossfire;

    return null;
  }

  /**
   * Something on the board contradicts the one legal answer. Corrections come
   * before advice, because a wrong crown or a wrongly crossed-out square makes
   * every deduction after it nonsense — and it's what lets the rest of the
   * engine take your X marks at their word.
   */
  function findCorrection(): Deduction | null {
    const wanted = solution.map((column, row) => row * size + column);
    const rowOf = (index: number) => Math.floor(index / size) + 1;
    const columnOf = (index: number) => (index % size) + 1;

    const crown = cells.findIndex(
      (state, index) => state === "queen" && !wanted.includes(index)
    );
    if (crown >= 0) {
      return {
        key: `uncrown:${crown}`,
        focus: [crown],
        message: "This crown can't be part of the answer.",
        act: () => {
          cells[crown] = "empty";
          hinted.delete(crown);
          return `Crown in row ${rowOf(crown)}, column ${columnOf(crown)} taken back.`;
        },
      };
    }

    const mark = cells.findIndex(
      (state, index) => state === "mark" && wanted.includes(index)
    );
    if (mark >= 0) {
      const row = Math.floor(mark / size);
      return {
        key: `uncross:${mark}`,
        focus: cells.map((_, index) => index).filter((index) => Math.floor(index / size) === row),
        message: `Row ${row + 1} has a square crossed out that has to hold a crown.`,
        act: () => {
          cells[mark] = "empty";
          return `Cross taken off row ${rowOf(mark)}, column ${columnOf(mark)}.`;
        },
      };
    }

    return null;
  }

  /** When nothing follows from the board, fall back to the answer sheet. */
  function findGift(): Deduction | null {
    const missing = solution
      .map((column, row) => row * size + column)
      .filter((index) => cells[index] !== "queen");
    if (!missing.length) return null;

    const pick = missing[Math.floor(Math.random() * missing.length)];
    return {
      key: "gift",
      focus: [],
      message: "Nothing follows from the board on its own.",
      act: () => {
        cells[pick] = "queen";
        hinted.add(pick);
        return `Crown placed in row ${Math.floor(pick / size) + 1}, column ${(pick % size) + 1}.`;
      },
    };
  }

  /**
   * One press points at the step and says what holds there; a second press on
   * the same advice plays it. Pointing is the whole idea — the board should
   * still be yours to solve.
   */
  function hint() {
    if (solved) return;

    focus.clear();
    const step = findCorrection() ?? findDeduction() ?? findGift();
    if (!step) {
      paint();
      return;
    }

    if (lastHint !== step.key) {
      lastHint = step.key;
      for (const index of step.focus) focus.add(index);
      paint();
      setStatus(`${step.message} Press hint again to play it.`);
      return;
    }

    remember();
    hintsUsed += 1;
    lastHint = "";
    // The daily charges for hints, and the charge has to land whether or not
    // this hint happens to finish the board.
    options.onHint?.(hintsUsed);
    const said = step.act();
    paint();
    if (!solved) setStatus(said);
  }

  function build() {
    const puzzle = options.deal ? options.deal() : generate(size);
    size = puzzle.size;
    current = puzzle;
    regions = puzzle.regions;
    solution = puzzle.solution;
    cells = new Array(size * size).fill("empty");
    rendered = new Array(size * size).fill("empty");
    history = [];
    hinted.clear();
    moveOn();
    hintsUsed = 0;
    undoButton.disabled = true;
    solved = false;
    frozen = false;
    started = false;
    win.hidden = true;

    board.style.setProperty("--size", String(size));
    board.replaceChildren();

    for (let index = 0; index < size * size; index += 1) {
      const row = Math.floor(index / size);
      const column = index % size;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.index = String(index);
      button.dataset.state = "empty";
      button.dataset.region = String(regions[index]);
      button.style.setProperty("--hue", String(hueFor(regions[index], size)));

      if (column < size - 1 && regions[index] !== regions[index + 1]) {
        button.dataset.edgeRight = "true";
      }
      if (row < size - 1 && regions[index] !== regions[index + size]) {
        button.dataset.edgeBottom = "true";
      }

      board.append(button);
    }

    paint();
    options.onBuild?.(puzzle);
  }

  /**
   * Pointer painting, the way the LinkedIn board works: a tap cycles one
   * square, a drag crosses out (or clears) every square it passes over.
   */
  let startIndex = -1;
  let dragging = false;
  let paintMode: CellState = "mark";
  let suppressClick = false;

  /**
   * The first square you touch starts the daily clock. Called from every entry
   * point rather than one, because a tap, a drag and a hint are all "you began".
   */
  function begin() {
    if (started) return;
    started = true;
    options.onFirstMove?.();
  }

  function applyPaint(index: number) {
    // A drag never disturbs a crown you already placed.
    if (cells[index] === "queen" || cells[index] === paintMode) return;
    cells[index] = paintMode;
  }

  /** Walks the straight line between two squares so fast drags leave no gaps. */
  function paintLine(from: number, to: number) {
    let row = Math.floor(from / size);
    let column = from % size;
    const endRow = Math.floor(to / size);
    const endColumn = to % size;
    const spanRow = Math.abs(endRow - row);
    const spanColumn = Math.abs(endColumn - column);
    const stepRow = row < endRow ? 1 : -1;
    const stepColumn = column < endColumn ? 1 : -1;
    let error = spanColumn - spanRow;
    let guard = 0;

    for (;;) {
      applyPaint(row * size + column);
      if ((row === endRow && column === endColumn) || (guard += 1) > 4 * size) break;
      const doubled = 2 * error;
      if (doubled > -spanRow) {
        error -= spanRow;
        column += stepColumn;
      }
      if (doubled < spanColumn) {
        error += spanColumn;
        row += stepRow;
      }
    }
  }

  function cellAt(x: number, y: number): number {
    const element = document.elementFromPoint(x, y);
    const button = element?.closest<HTMLButtonElement>(".cell");
    if (!button?.dataset.index || !board.contains(button)) return -1;
    return Number.parseInt(button.dataset.index, 10);
  }

  board.addEventListener("pointerdown", (event) => {
    suppressClick = false;
    if (solved || frozen || event.button !== 0) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    if (!button?.dataset.index) return;

    startIndex = Number.parseInt(button.dataset.index, 10);
    dragging = false;
    // Starting on a crossed-out square rubs out instead of drawing.
    paintMode = cells[startIndex] === "mark" ? "empty" : "mark";
  });

  board.addEventListener("pointermove", (event) => {
    if (solved || frozen || startIndex < 0 || event.buttons === 0) return;
    const index = cellAt(event.clientX, event.clientY);
    if (index < 0) return;

    if (!dragging) {
      if (index === startIndex) return; // still on the square you pressed
      dragging = true;
      begin();
      remember();
      moveOn();
      applyPaint(startIndex);
    }

    paintLine(startIndex, index);
    startIndex = index;
    paint();
  });

  function endDrag() {
    if (dragging) suppressClick = true;
    startIndex = -1;
    dragging = false;
  }

  board.addEventListener("pointerup", endDrag);
  board.addEventListener("pointercancel", endDrag);

  board.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (solved || frozen) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".cell");
    if (!button?.dataset.index) return;

    const index = Number.parseInt(button.dataset.index, 10);
    const next: Record<CellState, CellState> = {
      empty: "mark",
      mark: "queen",
      queen: "empty",
    };
    begin();
    remember();
    hinted.delete(index);
    cells[index] = next[cells[index]];
    moveOn();
    paint();
  });

  clearButton?.addEventListener("click", () => {
    if (cells.some((state) => state !== "empty")) remember();
    cells = cells.map(() => "empty");
    hinted.clear();
    moveOn();
    solved = false;
    paint();
  });

  hintButton.addEventListener("click", () => {
    if (frozen) return;
    begin();
    hint();
  });
  undoButton.addEventListener("click", () => {
    if (frozen) return;
    undo();
  });

  newButton?.addEventListener("click", build);
  nextButton?.addEventListener("click", build);

  for (const button of levelButtons) {
    button.addEventListener("click", () => {
      size = Number.parseInt(button.dataset.level ?? "8", 10);
      for (const other of levelButtons) {
        other.setAttribute("aria-checked", String(other === button));
      }
      build();
    });
  }

  build();

  return {
    build,
    current: () => current,
    /**
     * Fills the board in with the answer.
     *
     * For coming back to a puzzle already finished: the position is not stored
     * anywhere, but the solution is deterministic, so it can simply be laid out
     * again. It deliberately does not announce a win — you are looking at your
     * finished board, not solving it a second time.
     */
    reveal: () => {
      cells = new Array(size * size).fill("empty");
      solution.forEach((column, row) => {
        cells[row * size + column] = "queen";
      });
      history = [];
      undoButton.disabled = true;
      // Set before painting so the paint treats this as an already-won board
      // and leaves onSolved alone.
      solved = true;
      paint();
      win.hidden = true;
    },
    freeze: () => {
      frozen = true;
      hintButton.disabled = true;
    },
    thaw: () => {
      frozen = false;
      if (!solved) hintButton.disabled = false;
    },
  };
}
