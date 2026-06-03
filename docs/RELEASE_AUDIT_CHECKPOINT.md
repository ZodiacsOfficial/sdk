# Zodiacs SDK Release Audit Checkpoint

This checkpoint documents the current public repository state for the Zodiacs
SDK canonical registry and read-only integration layer.

## Package Structure

- `@zodiacs/sdk` package version `0.3.0` in `packages/sdk`
- machine-readable registry artifact at `packages/sdk/registry/zodiacs.registry.json`
- generic Next.js integration example in `examples/nextjs`
- root, core, and market entry points are React-free; React hooks and UI live
  behind explicit `/react` and `/ui` subpaths

The workspace is managed with pnpm through `pnpm-workspace.yaml`.

## Implemented Features

- Official Zodiacs.org registry with exactly twelve assets.
- Native Solana SPL representation for every sign, using the existing Solana mint registry.
- Official bridged Base ERC-20 representation for every sign.
- Address verification helpers for Solana mints and Base ERC-20 addresses.
- Bridge provenance helpers that point Base representations back to Solana origins.
- Read-only Solana balance helpers and explicit Solana aliases.
- Read-only Base balance helpers using `viem` `PublicClient` only.
- Cross-chain ownership and public shelf helpers.
- Identity context helpers for held signs, missing signs, element mix, modality mix, wheel state, seasonal context, and receipt data.
- React hooks and UI components for registry verification, ownership, and identity surfaces.
- Optional market context adapters for DEX Screener, Jupiter, and placeholder data.

## Registry Behavior

- The sign is the asset identity.
- Solana SPL mints are native canonical origins.
- Base ERC-20 addresses are official bridged representations.
- Base representations are not independent originals.
- Every Base representation includes Wormhole bridge metadata and an `originAddress` matching the native Solana mint.
- Unknown addresses return `false` or `null`; assertion helpers throw typed errors.
- EVM lookup is case-insensitive.

## Read Behavior

- Solana reads use public wallet addresses and token mint addresses.
- Base reads use `PublicClient.readContract` for ERC-20 `balanceOf`; registry
  decimals are used when present, with on-chain `decimals` as a fallback.
- Read failures return typed unavailable states per token.
- Cross-chain helpers expose per-chain holdings before any unified shelf view.
- Large Base raw balances are formatted through string/bigint-safe helpers.

## Market Adapter Behavior

- Market data is optional display context.
- Placeholder market data returns an unavailable snapshot by design.
- DEX Screener and Jupiter adapters return normalized snapshots when usable data is available.
- The default Jupiter adapter uses Jupiter Price API V3 through `https://lite-api.jup.ag/price/v3`.
- DEX Screener and Jupiter endpoints are overridable through adapter config.
- Network failures, non-OK HTTP responses, JSON parse failures, missing markets, and malformed payloads return unavailable snapshots.

## Environment Variables

- `NEXT_PUBLIC_SOLANA_RPC_URL` enables read-only Solana balance lookup in the generic Next.js example.
- The SDK does not require private keys or secret environment variables.
- No `.env` file should be included in a source release.

## Test And Build Commands

```sh
corepack pnpm install
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

Optional release dry-runs:

```sh
npm pack --dry-run --json
corepack pnpm publish --recursive --dry-run --no-git-checks --ignore-scripts --access public
```

Run package dry-runs from `packages/sdk`.

## Known Limitations

- Market context is optional and may be unavailable.
- Balance reads depend on the configured Solana RPC endpoint or Base RPC transport.
- Public RPC endpoints may rate-limit or return transient failures.
- Mint and bridge address changes must be handled as explicit registry updates with tests.
- The public SDK repository is `https://github.com/ZodiacsOfficial/sdk`.

## Read-Only And Security Posture

The SDK is read-only. It does not request private keys, sign messages, connect
wallets, submit transactions, provide custody, provide transaction approval
helpers, or provide asset movement helpers. It is built around official
registry verification, cultural assets, symbolic identity, public ownership
state, market context, scarcity, and symbolic endurance.

## Recommended Next Audit Prompt

```text
Audit the Zodiacs SDK for release readiness. Confirm canonical registry integrity, Solana native representations, Base bridged representations, address verification helpers, TypeScript declarations, ESM compatibility, build output, tests, React hooks, Base and Solana read-only balance logic, README accuracy, npm publishing readiness, no private keys, no signing, no swaps or trading, no custody, no transaction submission, no approval helpers, no financial-promotional claims, app-neutral language, and premium Zodiacs.org tone. Return blockers, non-blocking improvements, exact files needing changes, and a release readiness score.
```
