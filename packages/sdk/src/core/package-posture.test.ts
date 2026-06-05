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
    expect(packageJson.version).toBe("1.0.0");
    expect(Object.keys(packageJson.exports)).toEqual([
      ".",
      "./core",
      "./market",
      "./registry",
      "./base",
      "./solana",
      "./identity",
      "./react",
      "./ui",
      "./testing",
      "./registry/zodiacs.registry.json"
    ]);
    expect(packageJson.files).toEqual([
      "dist/*.d.ts",
      "dist/*.js",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "registry/zodiacs.registry.json",
      "registry/zodiacs.registry.sha256"
    ]);
    expect(packageJson.peerDependenciesMeta?.react?.optional).toBe(true);
    expect(packageJson.scripts.typecheck).toBe("tsc -p tsconfig.typecheck.json --pretty false");
    expect(packageJson.scripts.build).toContain("src/testing.ts");
    expect(packageJson.scripts["exports:smoke"]).toBe("node scripts/module-resolution-smoke.mjs");
    expect(packageJson.scripts["package:contents"]).toBe(
      "node scripts/verify-package-contents.mjs"
    );
    expect(packageJson.scripts["neutrality:guard"]).toBe("node scripts/neutrality-guard.mjs");
    expect(packageJson.scripts.prepack).toBe("npm run build");

    const rootEntry = readFileSync(new URL("../index.ts", import.meta.url), "utf8");

    expect(rootEntry).toContain("./core/index.js");
    expect(rootEntry).not.toContain("./market/index.js");
    expect(rootEntry).not.toMatch(/\.\/(?:market|react|ui)\/index\.js/u);
  });
});
