import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

describe("package files", () => {
  it("package.json files allowlist is exact", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    expect(pkg.files).toEqual(["dist", "LICENSE", "README.md"]);
  });

  it("dependencies is strictly empty", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    expect(pkg.dependencies).toEqual({});
  });
});
