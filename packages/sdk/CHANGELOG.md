# @zodiacs/sdk Changelog

## 0.3.0

- Made the root `@zodiacs/sdk` entry point React-free. Import React hooks from
  `@zodiacs/sdk/react` and UI components from `@zodiacs/sdk/ui`.
- Marked `react` as an optional peer dependency for non-React consumers.
- Added package posture tests for root, core, market, React, and UI entry
  points.
- Hardened package publishing so typecheck cannot emit into `dist`, prepack
  performs a clean build, and the published file list excludes nested test
  artifacts.
- Added controlled `ZodiacAssetCard` behavior so supplied balance and market
  props disable internal reads.
- Added `enabled` support to `useZodiacBalance`.
- Reduced Base balance reads by using registry decimals, with on-chain
  `decimals` retained as a fallback.
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
