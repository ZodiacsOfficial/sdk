# Changelog

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
