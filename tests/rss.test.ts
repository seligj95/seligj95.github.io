import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
let rssContent: string;

beforeAll(() => {
  rssContent = readFileSync(join(dist, "rss.xml"), "utf-8");
});

describe("RSS feed", () => {
  it("starts with an XML declaration", () => {
    expect(rssContent.trimStart()).toMatch(/^<\?xml/);
  });

  it("contains an <rss> root element", () => {
    expect(rssContent).toContain("<rss");
  });

  it("contains a <channel> element", () => {
    expect(rssContent).toContain("<channel>");
  });

  it("includes the site title", () => {
    // XML entity-encodes the apostrophe: &apos;
    expect(rssContent).toContain("Jordan Selig");
    expect(rssContent).toContain("Blog</title>");
  });

  it("includes the site description", () => {
    expect(rssContent).toContain("Personal blog by Jordan Selig.");
  });

  it("contains at least one <item>", () => {
    expect(rssContent).toContain("<item>");
  });

  it("includes the hello-world post title", () => {
    expect(rssContent).toContain("<title>Hello World</title>");
  });

  it("includes a link to the hello-world post", () => {
    expect(rssContent).toContain("/blog/hello-world/");
  });

  it("includes a pubDate for items", () => {
    expect(rssContent).toContain("<pubDate>");
  });
});
