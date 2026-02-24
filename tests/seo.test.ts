import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");

/** Parse HTML string into happy-dom document */
function parseHtml(html: string): Document {
  const { Window } = require("happy-dom");
  const window = new Window();
  window.document.write(html);
  return window.document;
}

const pages = [
  { name: "home", path: join(dist, "index.html") },
  { name: "about", path: join(dist, "about", "index.html") },
  { name: "blog index", path: join(dist, "blog", "index.html") },
  { name: "hello-world post", path: join(dist, "blog", "hello-world", "index.html") },
];

describe("SEO meta tags", () => {
  describe.each(pages)("$name page", ({ path }) => {
    let doc: Document;

    beforeAll(() => {
      const html = readFileSync(path, "utf-8");
      doc = parseHtml(html);
    });

    it("has a <title> tag", () => {
      const title = doc.querySelector("title");
      expect(title).not.toBeNull();
      expect(title!.textContent?.trim().length).toBeGreaterThan(0);
    });

    it("has a meta description", () => {
      const desc = doc.querySelector('meta[name="description"]');
      expect(desc).not.toBeNull();
      expect(desc!.getAttribute("content")?.trim().length).toBeGreaterThan(0);
    });

    it("has og:title", () => {
      const og = doc.querySelector('meta[property="og:title"]');
      expect(og).not.toBeNull();
      expect(og!.getAttribute("content")?.trim().length).toBeGreaterThan(0);
    });

    it("has og:description", () => {
      const og = doc.querySelector('meta[property="og:description"]');
      expect(og).not.toBeNull();
      expect(og!.getAttribute("content")?.trim().length).toBeGreaterThan(0);
    });

    it("has a canonical URL", () => {
      const link = doc.querySelector('link[rel="canonical"]');
      expect(link).not.toBeNull();
      const href = link!.getAttribute("href") || "";
      expect(href).toMatch(/^https?:\/\//);
    });

    it("has an RSS link in the head", () => {
      const rssLink = doc.querySelector('link[type="application/rss+xml"]');
      expect(rssLink).not.toBeNull();
      expect(rssLink!.getAttribute("href")).toContain("rss.xml");
    });

    it("has twitter:title", () => {
      const tw = doc.querySelector('meta[property="twitter:title"]');
      expect(tw).not.toBeNull();
    });

    it("has twitter:description", () => {
      const tw = doc.querySelector('meta[property="twitter:description"]');
      expect(tw).not.toBeNull();
    });
  });
});
