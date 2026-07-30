import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { games } from "../src/data/games";

const dist = join(process.cwd(), "dist");
const gameSlugs = games.map((game) => game.slug);

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
      expect(readFileSync(page, "utf8")).toContain("region-sat");
    }
  });
});
