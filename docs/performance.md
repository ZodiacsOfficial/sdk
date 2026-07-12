# Performance Notes

## Base

`getBaseZodiacsOwnership` uses viem `readContracts` when present. It batches ERC-20 `balanceOf` calls and
caches ERC-20 decimals per public client, chain, and token address. Pass `blockTag: "safe"` for consumer UI
that prefers safer chain state over pending data.

## Solana

`getSolanaZodiacsOwnership` uses wallet-level SPL token account discovery and maps token accounts to official
registry mints. It avoids one RPC request per sign for ownership reads.

If an RPC does not support the parsed wallet-level scan, the SDK falls back to per-mint reads so apps still get
a typed ownership result. Keep network functions injected through a connection object in tests so this fallback
is easy to mock.

Disclosure verification intentionally performs three sequential reads per sign
and uses 300 millisecond pacing by default. It favors a reproducible public-RPC
audit over interactive latency; use `getDisclosure` when only one sign is needed.

## UI

Core, registry, Base, Solana, and disclosure entrypoints do not import React. React hooks and UI components are imported
only from explicit `react` and `ui` subpaths.
