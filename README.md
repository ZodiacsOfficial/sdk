# Zodiacs SDK

[![SDK version](https://img.shields.io/badge/sdk-1.0.0-blue)](packages/sdk/package.json)
[![Registry version](https://img.shields.io/badge/registry-0.2.0-6f42c1)](packages/sdk/registry/zodiacs.registry.json)
[![React peer](https://img.shields.io/badge/react-optional%20peer-61dafb)](packages/sdk/package.json)
[![Posture](https://img.shields.io/badge/posture-read--only-2ea44f)](#security-posture)

Zodiacs SDK is the official read-only TypeScript interface for the canonical
Zodiacs.org registry. The native Zodiacs assets are SPL tokens on Solana. The
SDK also recognizes official bridged ERC-20 representations on Base, created to
make the original Solana Zodiacs accessible in Coinbase's Base ecosystem.

Apps can use the SDK to verify official Zodiacs addresses, read public
ownership state, render sign metadata, and build cultural identity interfaces.

## Official Zodiacs.org Registry

The registry models the twelve signs as one canonical asset universe:

- one asset identity per sign
- one native Solana SPL mint per sign
- one official bridged Base ERC-20 representation per sign
- provenance from every Base representation back to its Solana origin

Always verify official addresses against the published Zodiacs.org registry.
The SDK exposes the official registry for apps and clients, but downstream
interfaces should display chain and representation provenance clearly.

Machine-readable registry artifact:

```txt
packages/sdk/registry/zodiacs.registry.json
```

## Resources

- Registry JSON package subpath: `@zodiacs/sdk/registry/zodiacs.registry.json`
- Registry JSON source: [packages/sdk/registry/zodiacs.registry.json](packages/sdk/registry/zodiacs.registry.json)
- GitHub repository: [ZodiacsOfficial/sdk](https://github.com/ZodiacsOfficial/sdk)
- Next.js example app: [examples/nextjs](examples/nextjs)

## Install

```sh
pnpm add @zodiacs/sdk
```

For Base read-only balance helpers, the SDK uses `viem` public clients. Solana
read-only helpers accept an RPC URL string or any compatible read-only
connection object with `getParsedTokenAccountsByOwner`.

Prefer subpath imports for new apps:

```ts
import { getZodiacIdentityContext } from "@zodiacs/sdk/core";
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";
import { useBaseZodiacsOwnership } from "@zodiacs/sdk/react";
import { ProfileSummaryCard } from "@zodiacs/sdk/ui";
import { createMockOwnership } from "@zodiacs/sdk/testing";
```

The package ships granular entry points:

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
[root](packages/sdk/src/index.ts),
[core](packages/sdk/src/core/index.ts),
[registry](packages/sdk/src/registry.ts),
[base](packages/sdk/src/base.ts),
[solana](packages/sdk/src/solana.ts),
[identity](packages/sdk/src/identity.ts),
[market](packages/sdk/src/market/index.ts),
[react](packages/sdk/src/react/index.ts), and
[ui](packages/sdk/src/ui/index.ts).

## Verify an Address

```ts
import {
  getNativeCounterpart,
  getRepresentationByAddress,
  isOfficialZodiacAddress
} from "@zodiacs/sdk";

const address = "0x3ffB5282F5891Dd8c813E64059EdB0607537eC91";

const isOfficial = isOfficialZodiacAddress(address);
const representation = getRepresentationByAddress(address);
const native = getNativeCounterpart(address);

console.log(isOfficial);
console.log(representation?.kind); // "bridged"
console.log(native?.chain); // "solana"
```

Unknown addresses return `false` or `null`. Assertion helpers throw typed
errors only when an app explicitly asks for assertion behavior.
The example address above is the official bridged Base representation for
Aries.

## Get a Zodiac Asset

```ts
import {
  getBaseZodiacRepresentation,
  getSolanaZodiacRepresentation,
  getZodiacAsset
} from "@zodiacs/sdk";

const aries = getZodiacAsset("aries");
const native = getSolanaZodiacRepresentation("aries");
const bridged = getBaseZodiacRepresentation("aries");

console.log(aries.displayName);
console.log(native.address);
console.log(bridged.originAddress === native.address);
```

## Read Solana Holdings

```ts
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk";

const ownership = await getSolanaZodiacsOwnership(
  "https://api.mainnet-beta.solana.com",
  "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ"
);
```

Replace the owner address with any public Solana wallet address to inspect its
Zodiacs holdings.

Compatibility aliases remain available:

- `getZodiacBalance`
- `getZodiacsOwnership`
- `getHeldZodiacs`

These default to the native Solana representation. New integrations should
prefer the explicit `getSolana*` names.

## Read Base Holdings

```ts
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { getBaseZodiacsOwnership } from "@zodiacs/sdk";

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

const ownership = await getBaseZodiacsOwnership(
  publicClient,
  "0x1111111111111111111111111111111111111111",
  { blockTag: "safe", onPartialFailure: "warn" }
);
```

Replace the owner address with any public Base wallet address to inspect its
Zodiacs holdings.

Base helpers use `PublicClient` only. They read ERC-20 `balanceOf` and
`decimals`; they do not construct transactions or require wallet clients.
Ownership reads batch `balanceOf` calls with `readContracts` when available and
cache decimals per client, chain, and token address.

Formatting helpers preserve raw-token precision. `formatTokenAmount` truncates
when `maximumFractionDigits` is set unless `roundingMode: "round"` is passed.

## Build a Cross-Chain Zodiac Shelf

```ts
import { getCrossChainZodiacsOwnership, getUnifiedZodiacShelf } from "@zodiacs/sdk";

const ownershipByChain = await getCrossChainZodiacsOwnership({
  solana: {
    connection: "https://api.mainnet-beta.solana.com",
    ownerAddress: "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ"
  },
  base: { publicClient, ownerAddress: "0x1111111111111111111111111111111111111111" }
});

const shelf = await getUnifiedZodiacShelf({
  solana: {
    connection: "https://api.mainnet-beta.solana.com",
    ownerAddress: "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ"
  },
  base: { publicClient, ownerAddress: "0x1111111111111111111111111111111111111111" }
});

console.log(shelf.label); // "combined wallet holdings across official representations"
console.log(ownershipByChain.base?.heldSigns);
```

Cross-chain helpers expose per-chain holdings first. They do not treat bridged
Base balances as independent new supply.

## Identity Context

The SDK provides computed symbolic context from verified registry metadata and
public ownership state. Downstream apps can use these display-ready facts to
build readings, receipts, profiles, seasonal context, and other identity
surfaces without depending on market data.

```ts
import {
  getCurrentZodiacSeason,
  getIdentityReceiptData,
  getZodiacIdentityContext
} from "@zodiacs/sdk/identity";

const season = getCurrentZodiacSeason(new Date("2026-03-22T00:00:00.000Z"));
const context = getZodiacIdentityContext(ownership, {
  date: new Date("2026-03-22T00:00:00.000Z"),
  sunSign: "aries"
});
const receipt = getIdentityReceiptData(ownership);

console.log(season.sign); // "aries"
console.log(context.currentSeasonHeld);
console.log(receipt.wheelCoverage);
```

Identity helpers return facts such as held signs, confirmed absent signs, element mix,
modality mix, current season, wheel coverage, and optional manual placement
alignment. They do not generate horoscopes or recommend asset acquisition,
disposal, exchange, or retention. The SDK remains read-only.

React integrations can use `useCurrentZodiacSeason`, `useZodiacIdentityContext`,
and `useIdentityReceiptData` as thin deterministic wrappers around the same
helpers.

Additional app helpers include `getZodiacWheelData`,
`getCompatibilityContext`, `getSeasonalContext`, and
`mergeZodiacsOwnership`.

## React Components

```tsx
import { OfficialZodiacBadge, ZodiacAddressVerifier } from "@zodiacs/sdk/ui";
import { ZodiacsProvider } from "@zodiacs/sdk/react";

export function RegistrySurface() {
  return (
    <ZodiacsProvider rpcUrl="https://api.mainnet-beta.solana.com">
      <OfficialZodiacBadge address="0x3ffB5282F5891Dd8c813E64059EdB0607537eC91" />
      <ZodiacAddressVerifier address="0x3ffB5282F5891Dd8c813E64059EdB0607537eC91" />
    </ZodiacsProvider>
  );
}
```

Verifier UI distinguishes:

- Official native Zodiacs.org asset on Solana
- Official bridged Zodiacs.org asset on Base
- Not found in the official Zodiacs.org registry

For a complete app integration, see the
[Next.js example app](examples/nextjs).

## Optional Market Context

Market data is optional display context. It is not required by the registry,
verifier, ownership, or identity helpers. DEX Screener and Jupiter endpoints
are upstream-controlled; adapters accept `config.endpoint` for integrations
that need to pin or replace an upstream URL.

Market helpers are representation-aware, so apps can request context for a
Solana native representation or a Base bridged representation without implying
one universal cross-chain price.

Import market adapters explicitly from `@zodiacs/sdk/market`. They are not
exported from the root package.

## Security Posture

Zodiacs SDK is read-only infrastructure. It does not request private keys, sign
messages, connect wallets, submit transactions, provide custody, or provide
transaction approval helpers.

The package is intended for verification, public balance reads, metadata, and
identity surfaces.

## Guides

- `docs/api-reference.md`
- `docs/registry.md`
- `docs/base-integration.md`
- `docs/solana-integration.md`
- `docs/react-hooks.md`
- `docs/ui-components.md`
- `docs/base-app-starter.md`
- `docs/ios-react-native.md`
- `docs/native-ios.md`
- `docs/zodiacs-readonly-api.md`
- `docs/threat-model.md`
- `docs/performance.md`
- `docs/migration.md`

## What This SDK Does Not Do

The SDK does not provide asset movement, exchange, staking, claim, or crypto-incentive
flows. It does not provide financial guarantees, rankings, or promotional
claims.

## Versioning

`@zodiacs/sdk` follows semver. The canonical registry has its own version field
inside `ZODIACS_REGISTRY` and `packages/sdk/registry/zodiacs.registry.json`.
The `1.0.0` release keeps the root entry point React-free and requires explicit
subpath imports for React, UI, market, Base, Solana, registry, identity, and
testing helpers.

## Contributing

Keep changes app-neutral and read-only. Registry changes should preserve the
model that Solana SPL mints are the native originals and Base ERC-20 addresses
are official bridged representations.
