# Zodiacs SDK Next.js Example

Minimal read-only integration demo for the Zodiacs SDK. The example presents
Zodiacs.org cultural assets as symbolic identity and ownership surfaces with
optional market context.

## Setup

Install dependencies from the repository root:

```sh
corepack pnpm install
```

Create an environment file for the example:

```sh
cp examples/nextjs/.env.example examples/nextjs/.env.local
```

Or provide the variable inline when running the app:

```sh
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

## Run

```sh
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com" corepack pnpm --filter zodiacs-sdk-nextjs-example dev
```

Open the local Next.js URL, enter a Solana wallet public key, select a zodiac
asset, and run a read-only balance lookup. The app passes
`NEXT_PUBLIC_SOLANA_RPC_URL` to `ZodiacsProvider` as `rpcUrl`, so React balance
hooks can use the first-party read-only Solana reader.

The example does not request private keys, sign messages, execute swaps, execute
trades, submit transactions, provide custody, or show buy or sell buttons. It
uses `NEXT_PUBLIC_SOLANA_RPC_URL` for Solana RPC access.

## What It Shows

- Local Zodiacs token metadata from `@zodiacs/sdk`
- `ZodiacAssetCard` and `ZodiacsPanel` from `@zodiacs/sdk/ui`
- Read-only balance lookup with `getZodiacBalance`
- React balance hooks through `ZodiacsProvider rpcUrl` from `@zodiacs/sdk/react`
- Ownership summary with `getZodiacsOwnership` from `@zodiacs/sdk`
- Placeholder market context through `useZodiacMarket` from `@zodiacs/sdk/react`

Market data is optional. Adapter failures surface as unavailable market context
without blocking metadata or ownership UI.
