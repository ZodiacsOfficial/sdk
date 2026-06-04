# Zodiacs Base App Example

Mobile-first Next.js example for a read-only Base profile on Base.

It demonstrates:

- Base mainnet and Base Sepolia wagmi config
- Base Account connector placeholder
- viem public clients and TanStack Query
- `@zodiacs/sdk/base`, `@zodiacs/sdk/react`, and `@zodiacs/sdk/ui`
- read-only Base ownership lookup
- wheel coverage, receipt facts, provenance labels, and share-card preview
- Builder Code `dataSuffix` configuration without adding transaction UI
- notification integration placeholder for future app-layer messaging

## Local Dev

```sh
corepack pnpm install
corepack pnpm --filter zodiacs-base-app-example dev
```

Copy `.env.example` to `.env.local` if you want to override public RPC endpoints.

## Environment Variables

```txt
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_APP_NAME="Zodiacs Base Read-Only Example"
NEXT_PUBLIC_BASE_BUILDER_CODE=
```

No private keys or RPC secrets are required. Use a dedicated RPC provider for production.

## Base Account And App Metadata

Register the app in Base developer tools, configure app metadata, and use the Base Account connector in
`config/wagmi.ts`. The example follows Base’s current wagmi pattern with `baseAccount({ appName })`, SSR
cookie storage, and `base` / `baseSepolia` transports.

## Builder Codes

The Base App can automatically attribute registered app activity. For web or outside-Base-App clients,
Base documents client-level `dataSuffix` configuration. This example reads `NEXT_PUBLIC_BASE_BUILDER_CODE`
and uses `Attribution.toDataSuffix` from `ox/erc8021`.

This example does not include transaction buttons. If your app later adds transaction flows outside the SDK,
configure attribution in the app layer, not in `@zodiacs/sdk` core.

## Notifications

Notification support should be added in the app layer after registering app
metadata and choosing an approved notification provider. Keep seasonal
messages informational, optional, and read-only. Do not use notifications for
wallet ownership access rules, crypto incentives, acquisition prompts, exchange flows, or
asset movement.

## Base Sepolia

Base Sepolia is included in wagmi config for wallet connection and app testing. The official Zodiacs Base
representations in the SDK registry are Base mainnet ERC-20 contracts, so the Base Read-Only Profile read target is
Base mainnet. For Sepolia-only testing, use app-local mock contracts or mocked SDK fixtures.

## Deploy

Deploy like any Next.js app. Set public environment variables in your hosting provider and keep all signing,
wallet, and transaction behavior outside the SDK core package.

## Intentionally Not Included

- private keys
- wallet clients created by the SDK
- signing, approvals, asset exchange, token transfers, or transaction submission
- wallet ownership access control
- fake production RPC secrets
- valuation or asset-promotion language
