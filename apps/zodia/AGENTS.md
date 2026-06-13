# AGENTS.md — Zodia app workspace

This directory contains **Zodia**, the Base App mini app. It is a consumer application that
*uses* `@zodiacs/sdk`; it is not part of the SDK.

## Boundary rules

The division between this app and the rest of the repository is strict:

- **Never modify `packages/sdk/**`, `docs/**`, or `examples/**` as part of Zodia work.** The
  SDK is read-only, app-neutral infrastructure with its own release gates (AGENTS.md at the
  repo root). Trading, leaderboard, prediction, reward, and social code exists only here.
- Zodia work may touch, outside this directory, only: `pnpm-workspace.yaml` (workspace list),
  the root `vitest.config.ts` `apps/**` exclusion, `.github/workflows/app-ci.yml`, and
  `pnpm-lock.yaml`. Anything beyond that list needs explicit maintainer sign-off.
- App CI is `.github/workflows/app-ci.yml`, path-filtered to `apps/**`. The SDK's `ci.yml`
  gates must pass untouched — this app must never be added to the root `build`/`typecheck`/
  `test` script chain.
- Repo-wide checks still apply to files in this directory: Prettier (`format:check`) and the
  neutrality guard, which blocks certain brand substrings. Practical consequence: write
  "moon phase" or "moon cycle"; never use the moon adjective ending in "-ar" anywhere in this
  app, including dependencies whose names would enter the lockfile.

## Product rules

- Astrology content is entertainment only — never financial advice, price predictions, or
  acquisition prompts. Keep the disclaimers in place.
- Leaderboards and the Season Cup carry no prizes or rewards; only app-initiated, on-chain
  verified swaps are credited, and the UI must keep saying so.
- The SDK package supplies the registry, ownership reads, identity context, market adapters,
  UI components, and the official sign icons. Never hardcode token addresses or re-implement
  what the SDK exports.

## Working here

See `README.md` in this directory for develop/test/build commands, environment variables,
the trade-verification design, and the publishing checklist.
