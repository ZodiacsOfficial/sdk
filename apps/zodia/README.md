# Zodia

A Base App mini app built on `@zodiacs/sdk`: daily horoscopes generated from real planetary
events, the twelve official Zodiac tokens on Base with host-native swaps, a volume/PnL
leaderboard for app-initiated trades, a trollbox, and share cards for the social feed.

Astrology content is entertainment only. Nothing in this app is investment advice, and the
leaderboard carries no prizes or rewards.

## How it fits the monorepo

**This workspace is the Zodia Base App, fully separated from the SDK.** The boundary, also
codified in this directory's `AGENTS.md`:

- Zero changes to `packages/sdk/**`, `docs/**`, or `examples/**` — the SDK stays read-only and
  app-neutral, and its release gates are unaffected.
- The only repo-level files the app touches are `pnpm-workspace.yaml` (registers `apps/*`),
  the root `vitest.config.ts` (excludes `apps/**` from SDK test gates), the separate
  path-filtered `.github/workflows/app-ci.yml`, and the shared `pnpm-lock.yaml`.
- `@zodiacs/sdk` is consumed read-only: registry addresses, ownership reads, identity context,
  market adapters, UI components, official icons. All trading, scoring, and social code stays
  in this app.
- Wording note: repo guard scripts block a few terms; for anything moon-related say
  "moon phase" or "moon cycle" (never the moon word ending in "-ar").

## Stack

Next.js App Router, MiniKitProvider (`@coinbase/onchainkit/minikit`), `@farcaster/miniapp-sdk`
(swapToken, composeCast, quickAuth, addMiniApp), wagmi + viem on Base mainnet, Upstash Redis,
`astronomy-engine` for ephemeris, Claude (`@anthropic-ai/sdk`) for daily copy with a
deterministic template fallback.

## Develop

```sh
corepack pnpm install
corepack pnpm --filter @zodiacs/sdk build   # the app imports the built SDK at runtime
corepack pnpm --filter zodia dev
```

Copy `.env.example` to `.env.local` and fill in at least the Upstash values. Without Redis the
Sky tab still works (computed fallback); trades, boards, chat, and notifications need Redis.

Quick Auth verifies against the canonical `NEXT_PUBLIC_URL` domain, so authenticated routes
only verify on the deployed domain (or with `DEV_FID` set during local development).

## Test, typecheck, build

```sh
corepack pnpm --filter zodia test
corepack pnpm --filter zodia typecheck
corepack pnpm --filter zodia build
```

## How leaderboard credit works

`swapToken` returns the executed transaction hashes. The client posts them to `/api/trades`
with a Quick Auth JWT; the server verifies each receipt on Base (success, fresh, confirmed),
reads ERC-20 Transfer logs, keeps only official registry addresses, and nets the deltas for the
claimed wallet — never trusting `tx.from`, which is usually a 4337 bundler in Base App. Buys
and sells update an average-cost position per sign; volume and realized PnL go to weekly and
all-time boards; unrealized PnL is marked to market and capped by current on-chain balances.
Only swaps started inside the app can be attributed, and the UI says so.

## Publishing checklist

- Add real `public/icon.png` (1024×1024), `public/splash.png` (200×200), and
  `public/hero.png` (1200×630) — the manifest references them.
- Generate the account association (Base Build / manifest tool) and set the
  `FARCASTER_ASSOCIATION_*` env vars.
- Set `NEXT_PUBLIC_APP_ENV=production` to drop `noindex`.
- Set `FARCASTER_HUB_URL` (or `NEYNAR_API_KEY`) so `/api/webhook` can verify signatures.
- Register the app on Base.dev for discovery; review the featured guidelines.
- Vercel: set env vars from `.env.example`, plus `CRON_SECRET`; crons are defined in
  `vercel.json`.
