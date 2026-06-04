import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const repoRoot = resolve(packageRoot, "../..");
const tscBin = join(repoRoot, "node_modules/typescript/bin/tsc");
const distCore = join(packageRoot, "dist/core.js");

if (!existsSync(distCore)) {
  throw new Error("Build @zodiacs/sdk before running module-resolution smoke tests.");
}

const tmp = mkdtempSync(join(tmpdir(), "zodiacs-sdk-resolution-"));
const scopedModules = join(tmp, "node_modules/@zodiacs");
mkdirSync(scopedModules, { recursive: true });
symlinkSync(packageRoot, join(scopedModules, "sdk"), "dir");

writeFileSync(join(tmp, "package.json"), JSON.stringify({ type: "module" }, null, 2));
writeFileSync(
  join(tmp, "index.ts"),
  [
    'import type { ZodiacIdentityContext } from "@zodiacs/sdk/core";',
    'import type { ZodiacsRegistry } from "@zodiacs/sdk/registry";',
    'import type { BaseZodiacsOwnership } from "@zodiacs/sdk/base";',
    'import type { ZodiacsOwnership } from "@zodiacs/sdk/solana";',
    'import type { ConsumerSafeWalletContext } from "@zodiacs/sdk/identity";',
    'import { ZODIAC_SIGNS, getZodiacIdentityContext } from "@zodiacs/sdk/core";',
    'import { getZodiacsRegistry } from "@zodiacs/sdk/registry";',
    'import { getBaseZodiacRepresentation } from "@zodiacs/sdk/base";',
    'import { getSolanaZodiacRepresentation } from "@zodiacs/sdk/solana";',
    'import { getConsumerSafeWalletContext } from "@zodiacs/sdk/identity";',
    'import { createPlaceholderMarketAdapter } from "@zodiacs/sdk/market";',
    'import { createMockOwnership } from "@zodiacs/sdk/testing";',
    "",
    "const ownership = createMockOwnership({ heldSigns: ['aries'] });",
    "const context = getZodiacIdentityContext(ownership);",
    "const consumerSafe = getConsumerSafeWalletContext(ownership);",
    "const registry = getZodiacsRegistry();",
    "const base = getBaseZodiacRepresentation('aries');",
    "const solana = getSolanaZodiacRepresentation('aries');",
    "const market = createPlaceholderMarketAdapter();",
    "const typedContext: ZodiacIdentityContext = context;",
    "const typedRegistry: ZodiacsRegistry = registry;",
    "const typedBaseOwnership: BaseZodiacsOwnership | null = null;",
    "const typedSolanaOwnership: ZodiacsOwnership = ownership;",
    "const typedConsumerSafe: ConsumerSafeWalletContext = consumerSafe;",
    "",
    "void typedContext;",
    "void typedRegistry;",
    "void typedBaseOwnership;",
    "void typedSolanaOwnership;",
    "void typedConsumerSafe;",
    "console.log(ZODIAC_SIGNS.length, context.totalUniqueSigns, consumerSafe.readOnly, registry.assets.length, base.chain, solana.chain, Boolean(market));"
  ].join("\n")
);

const configs = [
  {
    name: "node16",
    compilerOptions: {
      module: "Node16",
      moduleResolution: "Node16"
    }
  },
  {
    name: "nodenext",
    compilerOptions: {
      module: "NodeNext",
      moduleResolution: "NodeNext"
    }
  },
  {
    name: "bundler",
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "Bundler"
    }
  }
];

for (const config of configs) {
  const tsconfigPath = join(tmp, `tsconfig.${config.name}.json`);
  writeFileSync(
    tsconfigPath,
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          ...config.compilerOptions
        },
        include: ["index.ts"]
      },
      null,
      2
    )
  );

  execFileSync(process.execPath, [tscBin, "--project", tsconfigPath], {
    cwd: tmp,
    stdio: "inherit"
  });
}

execFileSync(
  process.execPath,
  [
    "--input-type=module",
    "--eval",
    "const core = await import('@zodiacs/sdk/core'); const identity = await import('@zodiacs/sdk/identity'); console.log(core.ZODIAC_SIGNS.length, typeof identity.getConsumerSafeWalletContext);"
  ],
  {
    cwd: tmp,
    stdio: "inherit"
  }
);

console.log("Module resolution smoke tests passed for Node16, NodeNext, and Bundler.");
