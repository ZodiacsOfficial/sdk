# Security Posture

Zodiacs SDK is read-only infrastructure.

It does not:

- request private keys
- sign messages
- connect wallets
- submit transactions
- provide custody
- provide transaction approval helpers
- provide asset movement helpers
- provide claim or crypto-incentive flows
- provide financial guarantees

The SDK is designed for registry verification, public balance reads, metadata,
React hooks, and UI surfaces. Base helpers use `viem` `PublicClient` only.
Solana helpers use read-only connection methods.

Consumer apps should show provenance clearly and avoid implying unofficial
assets are official. Do not use SDK UI for asset acquisition, asset disposal, asset exchange, crypto incentives, claim,
approval, or price-prediction flows.
