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

  it("keeps every game canvas labelled and paired with instructions", () => {
    for (const slug of gameSlugs) {
      const html = readFileSync(join(dist, "games", slug, "index.html"), "utf8");
      expect(html).toMatch(/<canvas[^>]*aria-label="/);
      expect(html).toContain('id="game-instructions"');
      expect(html).toContain('href="/games/"');
    }
  });

  it("assigns food drops to individual koi", () => {
    const pondSource = readFileSync(
      join(process.cwd(), "src", "components", "KoiPond.astro"),
      "utf8"
    );

    expect(pondSource).toContain("claimedBy");
    expect(pondSource).toContain("claimedFish");
    expect(pondSource).toContain("separationRadius");
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
});
