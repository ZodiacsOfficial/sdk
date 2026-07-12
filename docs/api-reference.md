# API Reference

Use subpath imports for tree-shakable apps:

```ts
import { getZodiacIdentityContext } from "@zodiacs/sdk/core";
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";
import { getConsumerSafeWalletContext } from "@zodiacs/sdk/identity";
import { getDisclosureAll } from "@zodiacs/sdk/disclosure";
import { getZodiacIconAsset } from "@zodiacs/sdk/assets";
import { useBaseZodiacsOwnership } from "@zodiacs/sdk/react";
import { ProfileSummaryCard } from "@zodiacs/sdk/ui";
```

## Entrypoints

- `@zodiacs/sdk`: compatibility root export.
- `@zodiacs/sdk/core`: registry, verification, identity, seasons, cross-chain helpers.
- `@zodiacs/sdk/registry`: registry/provenance/address verification helpers.
- `@zodiacs/sdk/base`: Base bridged ERC-20 read helpers.
- `@zodiacs/sdk/solana`: Solana native SPL read helpers.
- `@zodiacs/sdk/identity`: identity, receipt, wheel, share-card, seasonal, compatibility, and consumer-safe helpers.
- `@zodiacs/sdk/disclosure`: native Solana supply, authority, and token-account disclosure reads.
- `@zodiacs/sdk/market`: optional market context adapters.
- `@zodiacs/sdk/react`: optional React hooks.
- `@zodiacs/sdk/ui`: optional React UI primitives.
- `@zodiacs/sdk/testing`: typed fixtures and mock clients.
- `@zodiacs/sdk/assets`: official display asset metadata and packaged icon paths.

## Read APIs

- `getBaseZodiacsOwnership(publicClient, owner, options)`
- `getBaseZodiacsOwnershipBatched(publicClient, owner, options)`
- `getSolanaZodiacsOwnership(connection, owner)`
- `getSolanaZodiacsOwnershipBatched(connection, owner)`
- `getCrossChainZodiacsOwnership({ base, solana })`

Base options include `includeZeroBalances`, `minBalance`, `blockNumber`, `blockTag`, `signal`, and
`onPartialFailure`.

Ownership responses distinguish checked absence from read failures:

- `heldSigns`: signs with balances that satisfy the read threshold.
- `confirmedAbsentSigns`: signs that were checked and had zero balance.
- `unavailableSigns`: signs that could not be checked because an RPC or parsing
  step failed.

## Disclosure APIs

- `getDisclosure(sign, { rpcUrl? })`
- `getDisclosureAll({ rpcUrl?, paceMs? })`

Both functions source native mint addresses and decimals from the canonical
registry carried by the SDK. Each supply, authority, or top-ten field is a
discriminated `DisclosureRead`: `{ ok: true, value, slot }` or
`{ ok: false, reason }`. A null authority in a successfully parsed mint account
is rendered as `renounced`; a missing account or field is unavailable instead.
Each sign result also carries the canonical mint address, registry decimals,
and an ISO `readAt` timestamp. Successful authority values expose both the raw
address-or-null field and their rendered summary.

`getDisclosureAll` reads the twelve signs sequentially, spaces requests by 300
milliseconds by default, and retries rate-limit and server failures with bounded
backoff. An aggregate field is produced only when all twelve corresponding sign
fields succeeded. Top-ten percentages sum the ten largest SPL token accounts,
not wallets; pools and exchanges are accounts.

## Identity APIs

- `getZodiacIdentityContext`
- `getIdentityReceiptData`
- `getIdentityReceiptFacts`
- `getDominantElement`
- `getDominantModality`
- `getZodiacWheelData`
- `getShareCardContext`
- `getCompatibilityContext`
- `getSeasonalContext`
- `getConsumerSafeWalletContext`
- `mergeZodiacsOwnership`

These return display-ready facts, not horoscopes, price predictions, or financial advice.

## Asset APIs

- `getAllZodiacIconAssets()`
- `getZodiacIconAsset(sign)`
- `getZodiacIconAssetPath(sign)`

The package also exports direct PNG subpaths such as
`@zodiacs/sdk/assets/zodiac-icons/circle/leo.png` for bundlers and build
pipelines that copy image assets.

## Use-Case Guides

- [Symbolic resonance](./symbolic-resonance.md): app-side aura, tooltip, and
  share-card patterns powered by verified Zodiacs holdings.
