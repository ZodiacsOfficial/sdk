import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8")
) as {
  readonly version: string;
  readonly files: readonly string[];
  readonly exports: Record<string, unknown>;
  readonly peerDependenciesMeta?: Record<string, { readonly optional?: boolean }>;
  readonly scripts: Record<string, string>;
};

describe("package entry point posture", () => {
  it("keeps React isolated to explicit React and UI subpaths", () => {
    expect(packageJson.version).toBe("0.3.0");
    expect(Object.keys(packageJson.exports)).toEqual([
      ".",
      "./core",
      "./market",
      "./react",
      "./ui",
      "./registry/zodiacs.registry.json"
    ]);
    expect(packageJson.files).not.toContain("dist");
    expect(packageJson.files).toEqual(expect.arrayContaining([
      "dist/*.d.ts",
      "dist/*.js",
      "dist/core/index.js",
      "dist/react/index.js",
      "CHANGELOG.md"
    ]));
    expect(packageJson.peerDependenciesMeta?.react?.optional).toBe(true);
    expect(packageJson.scripts.typecheck).toContain("--noEmit");
    expect(packageJson.scripts.prepack).toBe("npm run build");

    const rootEntry = readFileSync(new URL("../index.ts", import.meta.url), "utf8");

    expect(rootEntry).toContain("./core/index.js");
    expect(rootEntry).toContain("./market/index.js");
    expect(rootEntry).not.toMatch(/\.\/(?:react|ui)\/index\.js/u);
  });
});
