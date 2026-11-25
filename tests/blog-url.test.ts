import { describe, expect, it } from "vitest";
import { blogPostPath } from "../src/lib/blog-url";

describe("blog post paths", () => {
  it("uses the configured base URL by default", () => {
    expect(blogPostPath("hello-world")).toBe("/blog/hello-world/");
  });

  it.each(["/preview", "/preview/"])(
    "builds a post path under the base %s",
    (base) => {
      expect(blogPostPath("nested/post", base)).toBe("/preview/blog/nested/post/");
    }
  );
});
