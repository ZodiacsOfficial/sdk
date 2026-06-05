# Changelog

## 1.0.0

- Published the first stable SDK release.
- Removed the Solana Web3 production dependency in favor of an internal
  read-only JSON-RPC adapter for RPC URL reads.
- Removed the pre-1.0 deprecated `missingSigns` compatibility alias from public
  ownership and identity outputs.
- Kept market context explicit through `@zodiacs/sdk/market`; root remains
  React-free and market-adapter-free.

## 1.0.0-rc.1

- Added SDK subpath exports for core, registry, Base, Solana, React, UI, and testing.
- Added runtime registry validation, normalization, invariant tests, and checksum tooling.
- Optimized Base and Solana ownership reads.
- Expanded identity context, receipt, wheel, compatibility, and seasonal helpers.
- Added optional UI primitives, testing fixtures, Base App starter, and iOS/React Native guidance.
- Renamed app-specific pre-1.0 identity helpers to neutral consumer-safe and
  identity-receipt APIs.
- Added explicit unavailable-sign reporting so failed reads are not treated as
  confirmed absent holdings.
- Reconciled native, bridged, dual-representation, unique-sign, and
  representation-position counts across generic and cross-chain identity
  helpers.
