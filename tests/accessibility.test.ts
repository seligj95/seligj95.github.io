import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");

/** Recursively find all index.html files in dist/ */
function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.name === "index.html") {
      results.push(full);
    }
  }
  return results;
}

/** Parse HTML string into happy-dom document */
function parseHtml(html: string): Document {
  const { Window } = require("happy-dom");
  const window = new Window();
  window.document.write(html);
  return window.document;
}

describe("Accessibility checks", () => {
  const htmlFiles = findHtmlFiles(dist);

  it("found HTML pages to test", () => {
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  describe("lang attribute", () => {
    it.each(htmlFiles.map((f) => [f.replace(dist, "dist"), f]))(
      "%s has lang attribute on <html>",
      (_label, filePath) => {
        const html = readFileSync(filePath, "utf-8");
        const doc = parseHtml(html);
        const htmlEl = doc.querySelector("html");
        expect(htmlEl?.getAttribute("lang")).toBeTruthy();
      }
    );
  });

  describe("image alt text", () => {
    it.each(htmlFiles.map((f) => [f.replace(dist, "dist"), f]))(
      "%s — all <img> elements have alt attributes",
      (_label, filePath) => {
        const html = readFileSync(filePath, "utf-8");
        const doc = parseHtml(html);
        const images = doc.querySelectorAll("img");
        for (const img of images) {
          // alt="" is valid (decorative), but alt must be present
          expect(img.hasAttribute("alt")).toBe(true);
        }
      }
    );
  });

  describe("heading hierarchy", () => {
    it.each(htmlFiles.map((f) => [f.replace(dist, "dist"), f]))(
      "%s — headings do not skip levels",
      (_label, filePath) => {
        const html = readFileSync(filePath, "utf-8");
        const doc = parseHtml(html);
        const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
        let prevLevel = 0;
        for (const h of headings) {
          const level = parseInt(h.tagName.replace("H", ""), 10);
          if (prevLevel > 0) {
            // Can go same, up (smaller number), or one deeper
            expect(level).toBeLessThanOrEqual(prevLevel + 1);
          }
          prevLevel = level;
        }
      }
    );
  });

  describe("link accessibility", () => {
    it.each(htmlFiles.map((f) => [f.replace(dist, "dist"), f]))(
      "%s — all <a> elements have accessible text",
      (_label, filePath) => {
        const html = readFileSync(filePath, "utf-8");
        const doc = parseHtml(html);
        const links = doc.querySelectorAll("a");
        for (const link of links) {
          const text = link.textContent?.trim() || "";
          const ariaLabel = link.getAttribute("aria-label") || "";
          const ariaLabelledBy = link.getAttribute("aria-labelledby") || "";
          const title = link.getAttribute("title") || "";
          const hasImg = link.querySelector("img[alt]");
          const hasAccessibleName =
            text.length > 0 ||
            ariaLabel.length > 0 ||
            ariaLabelledBy.length > 0 ||
            title.length > 0 ||
            hasImg;
          expect(hasAccessibleName).toBe(true);
        }
      }
    );
  });
});
