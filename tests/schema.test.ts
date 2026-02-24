import { describe, it, expect } from "vitest";
import { z } from "astro/zod";

// Mirror the schema from src/content.config.ts so we can test it in isolation.
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

describe("Blog content schema", () => {
  it("accepts valid frontmatter with all fields", () => {
    const data = {
      title: "Test Post",
      description: "A test description",
      pubDate: "2026-01-15",
      updatedDate: "2026-02-01",
      heroImage: "/images/hero.jpg",
      tags: ["test", "example"],
      draft: true,
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test Post");
      expect(result.data.pubDate).toBeInstanceOf(Date);
      expect(result.data.tags).toEqual(["test", "example"]);
      expect(result.data.draft).toBe(true);
    }
  });

  it("accepts minimal required fields only", () => {
    const data = {
      title: "Minimal Post",
      description: "Just the basics",
      pubDate: "2026-03-01",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.draft).toBe(false);
      expect(result.data.updatedDate).toBeUndefined();
      expect(result.data.heroImage).toBeUndefined();
    }
  });

  it("rejects missing title", () => {
    const data = {
      description: "No title here",
      pubDate: "2026-01-01",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const data = {
      title: "No Description",
      pubDate: "2026-01-01",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects missing pubDate", () => {
    const data = {
      title: "No Date",
      description: "Missing date field",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("coerces pubDate string to Date object", () => {
    const data = {
      title: "Date Coercion",
      description: "Testing date coercion",
      pubDate: "2026-06-15",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pubDate).toBeInstanceOf(Date);
      expect(result.data.pubDate.getFullYear()).toBe(2026);
    }
  });

  it("defaults tags to empty array when omitted", () => {
    const data = {
      title: "No Tags",
      description: "Post without tags",
      pubDate: "2026-01-01",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("defaults draft to false when omitted", () => {
    const data = {
      title: "Not Draft",
      description: "Should not be draft by default",
      pubDate: "2026-01-01",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.draft).toBe(false);
    }
  });

  it("rejects tags as a string instead of array", () => {
    const data = {
      title: "Bad Tags",
      description: "Tags should be array",
      pubDate: "2026-01-01",
      tags: "not-an-array",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects draft as a string instead of boolean", () => {
    const data = {
      title: "Bad Draft",
      description: "Draft should be boolean",
      pubDate: "2026-01-01",
      draft: "yes",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
