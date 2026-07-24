import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const effects = readFileSync(
  join(process.cwd(), "src", "components", "GeocitiesEffects.astro"),
  "utf8"
);
const styles = readFileSync(
  join(process.cwd(), "src", "styles", "global.css"),
  "utf8"
);

describe("GeoCities theme performance", () => {
  it("bounds cursor sparkle work", () => {
    expect(effects).toContain("const MAX_SPARKLES = 20");
    expect(effects).toContain("requestAnimationFrame");
    expect(effects).toContain("MIN_SPARKLE_INTERVAL_MS");
  });

  it("keeps floating decorations off the layout timer", () => {
    expect(effects).not.toContain("setInterval");
    expect(effects).not.toContain(".style.top =");
    expect(effects).toContain("geocities-float-spin");
  });

  it("uses discrete rainbow repaints", () => {
    expect(styles).toContain("geocities-rainbow 3s step-end infinite");
    expect(styles).not.toContain("background-attachment: fixed");
  });
});
