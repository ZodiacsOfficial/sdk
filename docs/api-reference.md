# API Reference

Use subpath imports for tree-shakable apps:

```ts
import { getZodiacIdentityContext } from "@zodiacs/sdk/core";
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";
import { getConsumerSafeWalletContext } from "@zodiacs/sdk/identity";
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
- `@zodiacs/sdk/market`: optional market context adapters.
- `@zodiacs/sdk/react`: optional React hooks.
- `@zodiacs/sdk/ui`: optional React UI primitives.
- `@zodiacs/sdk/testing`: typed fixtures and mock clients.

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
- `missingSigns`: deprecated compatibility field for older pre-1.0 consumers;
  use `confirmedAbsentSigns` for neutral display language.

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
