import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { games } from "../src/data/games";
import { dailies, dailySlugs } from "../src/data/dailies";

const dist = join(process.cwd(), "dist");
const gameSlugs = games.map((game) => game.slug);

/**
 * Every stylesheet a page actually applies. Astro inlines small ones and links
 * the rest, so a rule you are looking for may be in either place.
 */
function cssFor(page: string): string {
  const inline = [...page.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]!);
  const linked = [...page.matchAll(/<link[^>]+href="(\/_astro\/[^"]+\.css)"/g)].map((match) =>
    readFileSync(join(dist, match[1]!), "utf8")
  );
  return [...inline, ...linked].join("\n");
}

/**
 * Every script a page actually runs, chunks included. A page script is bundled
 * out to /_astro/ and its shared imports to further chunks, so anything worth
 * asserting on tends to sit an import or two away from the page itself.
 */
function scriptsFor(page: string): string {
  const queue = [...page.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((match) => match[1]!)
    .filter((src) => src.startsWith("/_astro/"));
  const seen = new Set<string>();
  const code: string[] = [];

  while (queue.length) {
    const src = queue.shift()!;
    if (seen.has(src)) continue;
    seen.add(src);

    const source = readFileSync(join(dist, src), "utf8");
    code.push(source);
    for (const match of source.matchAll(/["'](\.\/[^"']+\.js)["']/g)) {
      queue.push(`/_astro/${match[1]!.slice(2)}`);
    }
  }

  return code.join("\n");
}

describe("Build output", () => {
  it("produces a dist/ directory", () => {
    expect(existsSync(dist)).toBe(true);
  });

  it("generates the home page", () => {
    expect(existsSync(join(dist, "index.html"))).toBe(true);
  });

  it("moves the interactive koi pond onto its own games page", () => {
    const homePage = readFileSync(join(dist, "index.html"), "utf8");
    const pondPage = readFileSync(join(dist, "games", "koi-pond", "index.html"), "utf8");

    expect(homePage).not.toContain('id="koi-pond"');
    expect(homePage).toContain('href="/games/"');

    expect(pondPage).toContain('id="koi-pond"');
    expect(pondPage).not.toContain('id="pond-feed-button"');
    expect(pondPage).not.toContain("Keyboard visitors");
    expect(pondPage).toContain("snacks served");
  });

  it("generates every game page listed in the registry", () => {
    expect(gameSlugs.length).toBeGreaterThan(0);
    const index = readFileSync(join(dist, "games", "index.html"), "utf8");

    for (const slug of gameSlugs) {
      expect(existsSync(join(dist, "games", slug, "index.html"))).toBe(true);
      expect(index).toContain(`href="/games/${slug}/"`);
    }
  });

  it("gives every registry tag a section on the games index", () => {
    const index = readFileSync(join(dist, "games", "index.html"), "utf8");
    const headings = new Map([
      ["puzzle", "Puzzles"],
      ["arcade", "Arcade"],
      ["zen", "Zen toys"],
    ]);

    for (const [tag, heading] of headings) {
      const tagged = games.filter((game) => game.tag === tag);
      expect(tagged.length, `no games tagged ${tag}`).toBeGreaterThan(0);
      expect(index).toContain(heading);
    }
  });

  it("presents every games section the same way", () => {
    const index = readFileSync(join(dist, "games", "index.html"), "utf8");

    // Zen toys used to be a card shelf while the other two were rows, which read
    // as three different pages stacked up.
    expect(index.match(/class="rows"/g)).toHaveLength(3);
    expect(index).not.toContain('class="shelf"');

    // Every game gets the same parts, blurb included.
    const text = index.replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    for (const game of games) {
      expect(text).toContain(game.tagline);
      expect(text).toContain(game.blurb);
    }
  });

  it("keeps every game stage labeled and paired with instructions", () => {
    for (const slug of gameSlugs) {
      const html = readFileSync(join(dist, "games", slug, "index.html"), "utf8");
      // Canvas games label the canvas; DOM-built boards label their container.
      expect(html).toMatch(/(<canvas[^>]*aria-label=")|(aria-label="[^"]*board)/i);
      expect(html).toContain('id="game-instructions"');
      expect(html).toContain('href="/games/"');
    }
  });

  it("waits for a tap before Chain starts running", () => {
    const html = readFileSync(join(dist, "games", "chain", "index.html"), "utf8");

    // The start panel is rendered server side so there is never a flash of a
    // game already in progress before the script boots.
    expect(html).toContain('id="chain-over-title"');
    expect(html).toContain("Start game");
    expect(html).toContain(">Ready<");

    const source = readFileSync(
      join(process.cwd(), "src", "pages", "games", "chain.astro"),
      "utf8"
    );
    expect(source).toMatch(/idleGame\(\);\s*<\/script>/);
    expect(source).not.toMatch(/newGame\(\);\s*<\/script>/);
  });

  it("announces the win in Twins", () => {
    const html = readFileSync(join(dist, "games", "twins", "index.html"), "utf8");

    expect(html).toContain('id="twins-win"');
    expect(html).toContain('id="twins-win-note"');
    expect(html).toContain('id="twins-again"');
    expect(html).toContain('id="twins-look"');

    const source = readFileSync(
      join(process.cwd(), "src", "pages", "games", "twins.astro"),
      "utf8"
    );
    // The panel must stay outside .scene, whose keydown handler calls
    // preventDefault and would swallow Enter on the buttons.
    expect(source).toMatch(/<\/div>\s*(<!--[\s\S]*?-->\s*)?<div id="twins-win"/);
  });

  it("sends each koi after its own pellet without discarding food", () => {
    const pondSource = readFileSync(
      join(process.cwd(), "src", "components", "KoiPond.astro"),
      "utf8"
    );

    expect(pondSource).toContain("assignTargets");
    expect(pondSource).toContain("separationRadius");
    // Pellets are never dropped to make room for new ones.
    expect(pondSource).not.toContain("food.shift()");
    expect(pondSource).toContain("MAX_FOOD");
  });

  it("generates the about page", () => {
    expect(existsSync(join(dist, "about", "index.html"))).toBe(true);
  });

  it("generates YouTube view-count hooks for every talk", () => {
    const talksPage = join(dist, "talks", "index.html");
    expect(existsSync(talksPage)).toBe(true);

    const html = readFileSync(talksPage, "utf-8");
    const hooks = html.match(/class="youtube-view-count"/g) ?? [];
    expect(hooks).toHaveLength(5);
    expect(html).toContain('data-video-id="4NEquVnq36w"');
  });

  it("generates the blog index page", () => {
    expect(existsSync(join(dist, "blog", "index.html"))).toBe(true);
  });

  it("generates the hello-world blog post", () => {
    expect(existsSync(join(dist, "blog", "hello-world", "index.html"))).toBe(true);
  });

  it("generates the tags index page", () => {
    expect(existsSync(join(dist, "tags", "index.html"))).toBe(true);
  });

  it("generates individual tag pages", () => {
    expect(existsSync(join(dist, "tags", "intro", "index.html"))).toBe(true);
    expect(existsSync(join(dist, "tags", "meta", "index.html"))).toBe(true);
  });

  it("copies robots.txt to output", () => {
    expect(existsSync(join(dist, "robots.txt"))).toBe(true);
  });

  it("copies favicon.svg to output", () => {
    // Astro may place it at dist/favicon.svg or dist/personal-blog/favicon.svg
    const atRoot = existsSync(join(dist, "favicon.svg"));
    const inPublic = existsSync(join(dist, "personal-blog", "favicon.svg"));
    expect(atRoot || inPublic).toBe(true);
  });

  it("generates a sitemap", () => {
    const files = readdirSync(dist, { recursive: true }) as string[];
    const hasSitemap = files.some((f) => String(f).includes("sitemap"));
    expect(hasSitemap).toBe(true);
  });

  it("generates the RSS feed", () => {
    expect(existsSync(join(dist, "rss.xml"))).toBe(true);
  });

  it("generates the MCP Apps blog post page", () => {
    expect(
      existsSync(join(dist, "blog", "mcp-apps-azure-appservice", "index.html"))
    ).toBe(true);
  });

  it("generates blog page 2 (more than 10 posts, page size 10)", () => {
    expect(
      existsSync(join(dist, "blog", "page", "2", "index.html"))
    ).toBe(true);
  });

  it("marks non-blog page content for search indexing", () => {
    const talksPage = readFileSync(join(dist, "talks", "index.html"), "utf8");

    expect(talksPage).toContain("<main data-pagefind-body>");
    expect(talksPage).toContain("Modernize .NET Apps");
    expect(talksPage).toContain(
      'id="talk-modernize-net-apps-and-add-agentic-functionality-in-minutes"'
    );
  });

  it("generates the daily section and links it from the nav", () => {
    const index = readFileSync(join(dist, "daily", "index.html"), "utf8");
    const queens = readFileSync(join(dist, "daily", "queens", "index.html"), "utf8");

    expect(index).toContain('href="/daily/queens/"');
    expect(index).toContain('href="/games/"');
    expect(queens).toContain('id="daily-gate"');
    expect(queens).toContain('id="daily-clock"');
    expect(index).toContain('href="/daily/"');
  });

  it("gives the daily board no free-play controls", () => {
    const queens = readFileSync(join(dist, "daily", "queens", "index.html"), "utf8");
    const free = readFileSync(join(dist, "games", "queens", "index.html"), "utf8");

    // Free play deals as many boards as you like; the daily deals exactly one.
    expect(free).toContain('id="queens-new"');
    expect(free).toContain("data-level");
    expect(queens).not.toContain('id="queens-new"');
    expect(queens).not.toContain('id="queens-next"');
    expect(queens).not.toContain("data-level");
  });

  it("ships the region colors with the shared Queens board", () => {
    for (const page of [
      join(dist, "games", "queens", "index.html"),
      join(dist, "daily", "queens", "index.html"),
    ]) {
      // The cells are built in JS, so these rules have to be global to land.
      const html = readFileSync(page, "utf8");
      expect(cssFor(html)).toContain("region-sat");
    }
  });

  it("gives Queens hints separate pattern and action markings", () => {
    const page = readFileSync(join(dist, "games", "queens", "index.html"), "utf8");
    const css = cssFor(page);
    const scripts = scriptsFor(page);
    const source = readFileSync(join(process.cwd(), "src", "lib", "queens-board.ts"), "utf8");

    expect(css).toContain("[data-hint-state=reason]");
    expect(css).toContain("[data-hint-state=target]");
    expect(scripts).toContain("hintState");
    expect(source).toContain("hintReason.clear()");
    expect(source).toContain("hintTarget.clear()");
    expect(source).not.toContain("focus.clear()");
  });

  it("ships the leaderboard panel, and styles for its JS-built rows", () => {
    const queens = readFileSync(join(dist, "daily", "queens", "index.html"), "utf8");

    expect(queens).toContain('id="daily-scores"');
    expect(queens).toContain('id="scores-form"');
    expect(queens).toContain('id="scores-list"');
    // Same trap as the board cells: the rows are created in JS, so without a
    // global rule they render as unstyled run-on text.
    expect(queens).toContain(".score-rows li");
  });

  it("offers a remembered name and a way out of it", () => {
    const queens = readFileSync(join(dist, "daily", "queens", "index.html"), "utf8");

    expect(queens).toContain('id="scores-known"');
    expect(queens).toContain('id="scores-rename"');
    expect(queens).toContain("Not you?");
  });

  it("lists every daily on the daily tab, with somewhere to see the full times", () => {
    const index = readFileSync(join(dist, "daily", "index.html"), "utf8");

    expect(dailySlugs.length).toBeGreaterThan(0);
    for (const daily of dailies) {
      expect(index).toContain(`href="/daily/${daily.slug}/"`);
      expect(index).toContain(daily.title);
      expect(index).toContain(daily.ranking);
      // The preview only shows the first few, so the way to the rest has to be
      // on the row rather than implied by it.
      expect(index).toContain(`href="/daily/${daily.slug}/#daily-scores"`);
    }
  });

  it("styles the daily tab's JS-built preview rows and played badge", () => {
    const css = cssFor(readFileSync(join(dist, "daily", "index.html"), "utf8"));

    // Both are built by the script, so both need global rules to land.
    expect(css).toContain(".score-rows li");
    expect(css).toContain("[data-played] .badge");
  });

  it("keeps the leaderboard off free play, which has no shared board", () => {
    const free = readFileSync(join(dist, "games", "queens", "index.html"), "utf8");

    expect(free).not.toContain('id="daily-scores"');
  });

  it("points the daily at the real API, not a local override", () => {
    const scripts = scriptsFor(readFileSync(join(dist, "daily", "queens", "index.html"), "utf8"));

    expect(scripts).toContain("https://api.jordanselig.com");
    expect(scripts).not.toContain("localhost");
  });

  it("ships the Contexto word list, and asks for it only from a Contexto page", () => {
    // A megabyte of vectors has no business loading on a page that cannot use
    // them, so the fetch lives in the board module and nowhere else.
    expect(existsSync(join(dist, "contexto", "vectors.bin"))).toBe(true);
    expect(existsSync(join(dist, "contexto", "vocabulary.json"))).toBe(true);

    for (const page of ["daily/contexto", "games/contexto"]) {
      const scripts = scriptsFor(readFileSync(join(dist, ...page.split("/"), "index.html"), "utf8"));
      expect(scripts).toContain("contexto/vectors.bin");
    }

    const home = scriptsFor(readFileSync(join(dist, "index.html"), "utf8"));
    expect(home).not.toContain("contexto/vectors.bin");
  });

  it("never ships the answer list to a page that would give it away", () => {
    const daily = readFileSync(join(dist, "daily", "contexto", "index.html"), "utf8");

    // The secret is picked in the browser, so the list is in the bundle by
    // design. What must not happen is the day's word reaching the HTML.
    expect(daily).not.toMatch(/id="contexto-win-note"[^>]*>[^<]/);
    expect(daily).toContain('id="contexto-win"');
  });

  it("styles the Contexto rows, which are built in JavaScript", () => {
    const css = cssFor(readFileSync(join(dist, "games", "contexto", "index.html"), "utf8"));

    expect(css).toContain(".contexto-rows");
    expect(css).toContain("--fill");
    expect(css).toContain("--heat");
    // Closeness is shown with the palette, not with colors invented for it.
    expect(css).toContain("var(--accent)");
    expect(css).toContain("var(--danger)");
  });

  it("scores daily Contexto on guesses and free play on nothing at all", () => {
    const daily = readFileSync(join(dist, "daily", "contexto", "index.html"), "utf8");
    const free = readFileSync(join(dist, "games", "contexto", "index.html"), "utf8");

    expect(daily).toContain('id="daily-scores"');
    expect(daily).toContain("guesses");
    expect(daily).not.toContain('id="contexto-new"');

    // Free play deals as many words as you like and keeps no shared board.
    expect(free).toContain('id="contexto-new"');
    expect(free).not.toContain('id="daily-scores"');
  });

  it("lets you give up on either Contexto, and only asks twice on the daily", () => {
    const daily = readFileSync(join(dist, "daily", "contexto", "index.html"), "utf8");
    const free = readFileSync(join(dist, "games", "contexto", "index.html"), "utf8");

    // Free play reveals on one click: the cost of a misclick is one more click.
    expect(free).toContain('id="contexto-reveal"');

    // The daily costs the whole day, so the first press only ever asks.
    expect(daily).toContain('id="daily-giveup"');
    expect(daily).toContain('id="daily-giveup-yes"');
    expect(daily).toContain('id="daily-giveup-no"');
  });

  it("raises the Contexto win panel in front rather than up the page", () => {
    const html = readFileSync(join(dist, "daily", "contexto", "index.html"), "utf8");
    const css = cssFor(html);

    // A long game runs to several screens of guesses. An inline panel arrives
    // wherever the board starts, which is a long way from where you were.
    expect(css).toMatch(/\.contexto-win\s*\{[^}]*position:\s*fixed/);
    expect(html).toContain('id="contexto-win-panel"');
    // Covering the guesses is only fair if there is a way back to them.
    expect(html).toContain('id="contexto-win-close"');
  });

  it("styles the quiet daily badge, which is built in JavaScript", () => {
    const css = cssFor(readFileSync(join(dist, "daily", "index.html"), "utf8"));

    // Giving up spends the day without earning the filled pill or the tick.
    expect(css).toContain(".badge.quiet");
    expect(css).toContain("[data-gave-up]");
  });

  it("gives the daily chess board no free-play controls", () => {
    const daily = readFileSync(join(dist, "daily", "chess", "index.html"), "utf8");
    const free = readFileSync(join(dist, "games", "chess", "index.html"), "utf8");

    // Free play deals as many puzzles as you like; the daily deals exactly one.
    expect(free).toContain('id="chess-next"');
    expect(daily).not.toContain('id="chess-next"');
    expect(daily).toContain('id="daily-gate"');
    expect(daily).toContain('id="daily-clock"');
    expect(daily).toContain('id="daily-moves"');
  });

  it("ships the board squares and highlight states, which are built in JavaScript", () => {
    for (const page of [
      join(dist, "games", "chess", "index.html"),
      join(dist, "daily", "chess", "index.html"),
    ]) {
      const css = cssFor(readFileSync(page, "utf8"));
      expect(css).toContain("chess-light");
      expect(css).toContain("chess-dark");
      // The build minifies quoted attribute selectors down to their bare
      // form when the value needs no quoting, so match what actually ships.
      expect(css).toContain("[data-selected=true]");
      expect(css).toContain("[data-legal=move]");
      expect(css).toContain("[data-legal=capture]");
      expect(css).toContain("[data-check=true]");
      expect(css).toContain("[data-rejected=true]");
    }
  });

  it("scores daily Chess on moves and time, and keeps free play unscored", () => {
    const daily = readFileSync(join(dist, "daily", "chess", "index.html"), "utf8");
    const free = readFileSync(join(dist, "games", "chess", "index.html"), "utf8");

    expect(daily).toContain('id="daily-scores"');
    expect(free).not.toContain('id="daily-scores"');
  });

  it("opens the Chess win panel and wires its next-puzzle action", () => {
    const source = readFileSync(join(process.cwd(), "src", "lib", "chess-board.ts"), "utf8");

    expect(source).toContain("win.hidden = false");
    expect(source).toContain("if (options.onNext) options.onNext()");
    expect(source).toContain("else build()");
  });

  it("points the daily chess board at the real API, not a local override", () => {
    const scripts = scriptsFor(readFileSync(join(dist, "daily", "chess", "index.html"), "utf8"));

    expect(scripts).toContain("https://api.jordanselig.com");
    expect(scripts).not.toContain("localhost");
  });
});
