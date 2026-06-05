# Zodiacs SDK

[![SDK version](https://img.shields.io/badge/sdk-1.0.0-blue)](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/package.json)
[![Registry version](https://img.shields.io/badge/registry-0.2.0-6f42c1)](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/registry/zodiacs.registry.json)
[![React peer](https://img.shields.io/badge/react-optional%20peer-61dafb)](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/package.json)
[![Posture](https://img.shields.io/badge/posture-read--only-2ea44f)](https://github.com/ZodiacsOfficial/sdk#security-posture)

Official read-only TypeScript SDK for the canonical Zodiacs.org registry,
native Solana SPL Zodiacs assets, and official bridged Base ERC-20
representations.

```sh
pnpm add @zodiacs/sdk
```

## Entry Points

The package ships granular entry points. React and UI code load only from their
explicit subpaths:

- `@zodiacs/sdk` — registry, reads, and identity helpers (no React)
- `@zodiacs/sdk/core` — core registry, verification, reads, and identity helpers (no React)
- `@zodiacs/sdk/registry` — registry artifact helpers (no React)
- `@zodiacs/sdk/base` — Base public ownership reads (no React)
- `@zodiacs/sdk/solana` — Solana public ownership reads (no React)
- `@zodiacs/sdk/identity` — symbolic identity context helpers (no React)
- `@zodiacs/sdk/testing` — typed fixtures for downstream tests (no React)
- `@zodiacs/sdk/market` — optional market adapters (no React)
- `@zodiacs/sdk/react` — React hooks and `ZodiacsProvider`
- `@zodiacs/sdk/ui` — React UI components

`react` is an optional peer dependency that is required only when importing
`@zodiacs/sdk/react` or `@zodiacs/sdk/ui`.

Core-only consumers do not need to install React. `viem` ships as a regular SDK
dependency because Base read helpers use public clients from that ecosystem.
Solana RPC URL reads use the SDK's internal read-only JSON-RPC adapter.

Market adapters require explicit import from `@zodiacs/sdk/market`; they are
not exported from the root package.

## Resources

- Registry JSON package subpath: `@zodiacs/sdk/registry/zodiacs.registry.json`
- Registry JSON source: [packages/sdk/registry/zodiacs.registry.json](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/registry/zodiacs.registry.json)
- GitHub repository: [ZodiacsOfficial/sdk](https://github.com/ZodiacsOfficial/sdk)
- Next.js example app: [examples/nextjs](https://github.com/ZodiacsOfficial/sdk/tree/main/examples/nextjs)

## Common Core APIs

| Need                        | Start with                                                          |
| --------------------------- | ------------------------------------------------------------------- |
| Verify an official address  | `isOfficialZodiacAddress`, `getRepresentationByAddress`             |
| Load sign metadata          | `getZodiacAsset`, `getZodiacMetadata`, `listZodiacMetadata`         |
| Read Solana holdings        | `getSolanaZodiacsOwnership`, `getSolanaZodiacBalance`               |
| Read Base holdings          | `getBaseZodiacsOwnership`, `getBaseZodiacBalance`                   |
| Build a cross-chain shelf   | `getCrossChainZodiacsOwnership`, `getUnifiedZodiacShelf`            |
| Build identity surfaces     | `getZodiacIdentityContext`, `getIdentityReceiptData`                |
| Show season context         | `getCurrentZodiacSeason`, `getZodiacSeasonProgress`                 |
| Format balances safely      | `formatTokenAmount`, `formatZodiacBalance`                          |
| Add optional market context | import `getZodiacMarketByRepresentation` from `@zodiacs/sdk/market` |

Full export maps live in the source barrels:
[root](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/index.ts),
[core](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/core/index.ts),
[registry](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/registry.ts),
[base](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/base.ts),
[solana](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/solana.ts),
[identity](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/identity.ts),
[market](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/market/index.ts),
[react](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/react/index.ts), and
[ui](https://github.com/ZodiacsOfficial/sdk/blob/main/packages/sdk/src/ui/index.ts).

```ts
import { getZodiacIdentityContext } from "@zodiacs/sdk/core";
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";
```

```ts
import {
  getBaseZodiacRepresentation,
  getRepresentationByAddress,
  getSolanaZodiacRepresentation
} from "@zodiacs/sdk/core";

const representation = getRepresentationByAddress("0x3ffB5282F5891Dd8c813E64059EdB0607537eC91");

console.log(representation?.kind); // "bridged"
console.log(getSolanaZodiacRepresentation("aries").chain); // "solana"
console.log(getBaseZodiacRepresentation("aries").originChain); // "solana"
```

The address above is the official bridged Base representation for Aries.

Identity context helpers provide computed symbolic context from registry
metadata and public ownership state:

```ts
import { getCurrentZodiacSeason, getZodiacIdentityContext } from "@zodiacs/sdk/identity";

const season = getCurrentZodiacSeason();
const context = getZodiacIdentityContext(ownership, {
  sunSign: "aries"
});

console.log(season.displayName);
console.log(context.heldSigns);
console.log(context.currentSeasonHeld);
```

The SDK is read-only. The root and core entrypoints provide registry
verification, public balance reads, metadata, and computed symbolic context.
React hooks and UI components are optional through `@zodiacs/sdk/react` and
`@zodiacs/sdk/ui`. Market context remains explicit through
`@zodiacs/sdk/market`.

The SDK does not request private keys, sign messages, submit transactions,
provide custody, or provide transaction approval helpers. It does not generate
horoscopes or recommend asset acquisition, disposal, exchange, or retention.

Formatting helpers preserve raw-token precision. `formatTokenAmount` truncates
when `maximumFractionDigits` is set unless `roundingMode: "round"` is passed.

Always verify official addresses against the published Zodiacs.org registry.
The SDK exposes the official registry for apps and clients, but downstream
interfaces should display chain and representation provenance clearly.
