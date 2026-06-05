# @zodiacs/sdk Changelog

## 1.0.0

- Published the first stable SDK release.
- Removed the Solana Web3 production dependency in favor of an internal
  read-only JSON-RPC adapter for RPC URL reads.
- Removed the pre-1.0 deprecated `missingSigns` compatibility alias from public
  ownership and identity outputs.
- Kept market context explicit through `@zodiacs/sdk/market`; root remains
  React-free and market-adapter-free.

## 1.0.0-rc.1

- Promoted the SDK package metadata for the first v1 release candidate.
- Kept the root `@zodiacs/sdk` entry point React-free and market-adapter-free.
- Added explicit subpath entrypoints for core, registry, Base, Solana, identity,
  market, React, UI, and testing.
- Added a release-audit regression for Base fallback `readContract` block option
  pass-through.
- Confirmed subpath exports, React isolation, market isolation, registry
  checksum, Base/Solana read optimization, testing fixtures, docs, examples, and
  package contents.
- Renamed pre-1.0 app-specific identity helpers to neutral consumer-safe and
  identity-receipt APIs.
- Added `unavailableSigns` and tightened `confirmedAbsentSigns` so failed reads
  are not presented as checked absence.
- Reconciled native, bridged, dual-representation, unique-sign, and
  representation-position counts across generic and cross-chain identity
  helpers.

## 0.3.0

- Made the root `@zodiacs/sdk` entry point React-free. Import React hooks from
  `@zodiacs/sdk/react` and UI components from `@zodiacs/sdk/ui`.
- Marked `react` as an optional peer dependency for non-React consumers.
- Added package posture tests for root, core, market, React, and UI entry
  points.
- Added controlled `ZodiacAssetCard` behavior so supplied balance props disable
  internal reads.
- Added `enabled` support to `useZodiacBalance`.
- Replaced the address-only `isOfficialZodiacRepresentation` alias with a real
  representation predicate.
- Added explicit `formatTokenAmount` rounding semantics with
  `roundingMode: "round"`.

## 0.2.0

- Added the canonical multi-chain Zodiacs registry with native Solana SPL
  assets and official bridged Base ERC-20 representations.
- Added registry verification, provenance, Base reads, cross-chain ownership,
  identity context helpers, React hooks, UI components, and optional market
  adapters.
