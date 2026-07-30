import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// A build directory holds no TypeScript, so asking whether one is here keeps
// the check to directories the compiler would actually be asked about.
function hasTs(dir: string): boolean {
  return readdirSync(dir, { withFileTypes: true, recursive: true }).some(
    (e) => e.isFile() && e.name.endsWith(".ts"),
  );
}

// A directory missing from "include" is not an inert oversight: the transform
// walks up and picks the site's config instead, which extends an Astro preset
// the API's CI job never installs. That fails only in CI, so it is worth
// catching here rather than in a deploy.
describe("tsconfig", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const config = readFileSync(root + "tsconfig.json", "utf8");
  const included: string[] = JSON.parse(
    // The file is commented, and comments are legal in tsconfig but not JSON.
    config.replace(/^\s*\/\/.*$/gm, ""),
  ).include;

  const dirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "node_modules")
    .filter((e) => hasTs(root + e.name))
    .map((e) => e.name);

  it.each(dirs)("covers %s", (dir) => {
    expect(included).toContain(`${dir}/**/*.ts`);
  });
});
