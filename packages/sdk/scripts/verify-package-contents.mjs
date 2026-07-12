import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredFiles = new Set([
  "package.json",
  "AGENTS.md",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "registry/zodiacs.registry.json",
  "registry/zodiacs.registry.sha256",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/core.js",
  "dist/core.d.ts",
  "dist/registry.js",
  "dist/registry.d.ts",
  "dist/base.js",
  "dist/base.d.ts",
  "dist/solana.js",
  "dist/solana.d.ts",
  "dist/identity.js",
  "dist/identity.d.ts",
  "dist/disclosure.js",
  "dist/disclosure.d.ts",
  "dist/market.js",
  "dist/market.d.ts",
  "dist/react.js",
  "dist/react.d.ts",
  "dist/ui.js",
  "dist/ui.d.ts",
  "dist/testing.js",
  "dist/testing.d.ts",
  "dist/assets.js",
  "dist/assets.d.ts",
  "assets/zodiac-icons/circle/aquarius.png",
  "assets/zodiac-icons/circle/aries.png",
  "assets/zodiac-icons/circle/cancer.png",
  "assets/zodiac-icons/circle/capricorn.png",
  "assets/zodiac-icons/circle/gemini.png",
  "assets/zodiac-icons/circle/leo.png",
  "assets/zodiac-icons/circle/libra.png",
  "assets/zodiac-icons/circle/pisces.png",
  "assets/zodiac-icons/circle/sagittarius.png",
  "assets/zodiac-icons/circle/scorpio.png",
  "assets/zodiac-icons/circle/taurus.png",
  "assets/zodiac-icons/circle/virgo.png"
]);

const dryRun = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: packageRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});
const [pack] = JSON.parse(dryRun);
const files = pack.files.map((file) => file.path).sort();
const failures = [];

for (const requiredFile of requiredFiles) {
  if (!files.includes(requiredFile)) {
    failures.push(`missing required package file: ${requiredFile}`);
  }
}

for (const file of files) {
  if (!isAllowedPackagePath(file)) {
    failures.push(`unexpected package file: ${file}`);
  }

  if (isForbiddenPackagePath(file)) {
    failures.push(`forbidden package file: ${file}`);
  }
}

if (failures.length > 0) {
  console.error("Package contents verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Package contents verification passed (${files.length} files).`);

function isAllowedPackagePath(file) {
  return (
    file === "package.json" ||
    file === "AGENTS.md" ||
    file === "README.md" ||
    file === "CHANGELOG.md" ||
    file === "LICENSE" ||
    file === "registry/zodiacs.registry.json" ||
    file === "registry/zodiacs.registry.sha256" ||
    /^assets\/zodiac-icons\/circle\/[a-z]+\.png$/u.test(file) ||
    /^dist\/[^/]+\.(d\.ts|js)$/u.test(file)
  );
}

function isForbiddenPackagePath(file) {
  return (
    /(^|\/)(src|scripts|test|tests|__tests__|__snapshots__)(\/|$)/u.test(file) ||
    /\.(snap|tsbuildinfo)$/u.test(file) ||
    /\.(test|spec)\.(d\.ts|js|ts|tsx)$/u.test(file) ||
    (/\.ts$/u.test(file) && !/\.d\.ts$/u.test(file)) ||
    /\.(map|bak|tmp)$/u.test(file) ||
    /(^|\/)(\.DS_Store|coverage|node_modules|\.next|\.turbo)(\/|$)/u.test(file)
  );
}
