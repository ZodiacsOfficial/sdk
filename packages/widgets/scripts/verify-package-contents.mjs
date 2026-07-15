import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8"
});
const report = JSON.parse(output)[0];
assert(report, "npm pack returned no report");

const files = report.files.map((entry) => entry.path).sort();
for (const required of [
  "LICENSE",
  "README.md",
  "dist/index.d.ts",
  "dist/index.js",
  "package.json"
]) {
  assert(files.includes(required), `packed package is missing ${required}`);
}

for (const file of files) {
  assert(!file.includes("node_modules"), `dependency leaked into package: ${file}`);
  assert(!file.includes("src/"), `source file leaked into package: ${file}`);
  assert(!file.includes("assets/"), `asset payload leaked into package: ${file}`);
  assert(!file.endsWith(".map"), `source map leaked into package: ${file}`);
}
assert(
  report.unpackedSize < 50_000,
  `package is unexpectedly large: ${report.unpackedSize} bytes unpacked`
);

console.log(
  `@zodiacs/widgets package contents passed (${files.length} files, ${report.unpackedSize} bytes unpacked)`
);
