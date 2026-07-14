import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

function listTextFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return entry === "node_modules" || entry === "dist" || entry === ".next"
        ? []
        : listTextFiles(fullPath);
    }

    return /\.(md|json|ts|tsx)$/u.test(entry) ? [fullPath] : [];
  });
}

describe("app-neutral canonical positioning", () => {
  it("keeps SDK code, docs, metadata, and tests free of app-specific branding", () => {
    const files = [
      ...listTextFiles(join(repoRoot, "docs")),
      ...listTextFiles(join(repoRoot, "examples")),
      ...listTextFiles(join(repoRoot, "packages/sdk/src")),
      join(repoRoot, "README.md"),
      join(repoRoot, "packages/sdk/README.md"),
      join(repoRoot, "packages/sdk/package.json")
    ].filter((file) => !file.endsWith("docs-posture.test.ts"));
    const forbidden = new RegExp(
      [
        "Astro" + "folio",
        "flagship" + "App",
        "poweredBy" + "App",
        "reference" + "App",
        "base-" + "native"
      ].join("|"),
      "iu"
    );

    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(forbidden);
    }
  });
});
