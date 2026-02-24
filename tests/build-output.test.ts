import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");

describe("Build output", () => {
  it("produces a dist/ directory", () => {
    expect(existsSync(dist)).toBe(true);
  });

  it("generates the home page", () => {
    expect(existsSync(join(dist, "index.html"))).toBe(true);
  });

  it("generates the about page", () => {
    expect(existsSync(join(dist, "about", "index.html"))).toBe(true);
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
});
