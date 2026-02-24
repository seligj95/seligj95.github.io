import { execSync } from "node:child_process";

export async function setup() {
  console.log("\n🔨 Running astro build before tests...");
  execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
  console.log("✅ Build complete.\n");
}
