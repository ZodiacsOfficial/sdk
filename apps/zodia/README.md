# Zodia

A Base-first web app built on `@zodiacs/sdk`: daily horoscopes generated from real planetary
events, the twelve official Zodiac tokens on Base, one live Farcaster feed per zodiac, a
volume/PnL leaderboard for verified trades, AstroTalk, and share cards for social distribution.

Farcaster remains an optional distribution layer. AstroTalk is a public Farcaster window; wallet
auth, trade crediting, profiles, and standard web usage are Base/wallet-first.

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

Next.js App Router, MiniKitProvider (`@coinbase/onchainkit/minikit`), wagmi + viem on Base
mainnet, Base Account wallet connection, wallet-signed sessions for app writes, Upstash Redis,
Neynar cast search for optional public social feeds, optional Farcaster Mini App actions when
the host supports them, `astronomy-engine` for ephemeris, and Claude (`@anthropic-ai/sdk`) for
daily copy with a deterministic template fallback.

## Develop

```sh
corepack pnpm install
corepack pnpm --filter @zodiacs/sdk build   # the app imports the built SDK at runtime
corepack pnpm --filter zodia dev
```

Copy `.env.example` to `.env.local` and fill in at least the Upstash values. Without Redis the
Sky tab and social-feed disabled states still work; trade crediting, boards, wallet sessions,
and optional Farcaster notifications need Redis.

Wallet sessions require `AUTH_SECRET` in production. Farcaster Quick Auth is still accepted as
optional metadata when a Farcaster Mini App host provides it, and verifies against the canonical
`NEXT_PUBLIC_URL` domain.

## Test, typecheck, build

```sh
corepack pnpm --filter zodia test
corepack pnpm --filter zodia typecheck
corepack pnpm --filter zodia build
```

## How leaderboard credit works

On the standard web path, the app opens the Base market for the selected zodiac and lets the
user paste the completed Base transaction hash. In supported Farcaster Mini App hosts, the
legacy `swapToken` action can still return executed transaction hashes directly. Either way,
the client posts hashes to `/api/trades` with a wallet-signed app session when available; the
server verifies each receipt on Base (success, fresh, confirmed), reads ERC-20 Transfer logs,
keeps only official registry addresses, and nets the deltas for the claimed wallet. Buys and
sells update an average-cost position per sign; volume and realized PnL go to weekly and
all-time boards; unrealized PnL is marked to market and capped by current on-chain balances.

## Publishing checklist

- Add real `public/icon.png` (1024×1024), `public/splash.png` (200×200), and
  `public/hero.png` (1200×630) — the manifest references them.
- Generate the account association (Base Build / manifest tool) and set the
  `FARCASTER_ASSOCIATION_*` env vars.
- Set `NEXT_PUBLIC_APP_ENV=production` to drop `noindex`.
- Set `AUTH_SECRET` for wallet sessions.
- Set `NEXT_PUBLIC_BASE_APP_ID` and `NEXT_PUBLIC_BASE_BUILDER_CODE` from Base Dashboard.
- Set `FARCASTER_HUB_URL` (or `NEYNAR_API_KEY`) so `/api/webhook` can verify signatures.
- Set `NEYNAR_API_KEY` to enable AstroTalk and the twelve per-zodiac public Farcaster feeds.
- Register the app on Base.dev for discovery as a standard web app; review the featured
  guidelines.
- Vercel: set env vars from `.env.example`, plus `CRON_SECRET`; crons are defined in
  `vercel.json`.
