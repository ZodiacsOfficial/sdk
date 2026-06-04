# Release Discipline

This repository ships the official read-only integration layer for the Zodiacs.org registry. Release work should preserve the SDK's role as public registry, provenance, ownership, and symbolic identity infrastructure.

## Release Readiness

Before cutting a release:

- Confirm the package version in `packages/sdk/package.json`.
- Confirm root imports stay React-free and do not export market adapters.
- Confirm React hooks are only available through `@zodiacs/sdk/react`.
- Confirm UI primitives are only available through `@zodiacs/sdk/ui`.
- Confirm market context is only available through `@zodiacs/sdk/market`.
- Confirm core, registry, Base, Solana, identity, and testing modules do not import React.
- Confirm no SDK core module creates wallet clients, signs messages, signs transactions, submits transactions, requests private keys, or moves assets.
- Confirm registry JSON and TypeScript registry exports stay in sync.
- Confirm the registry checksum is current.

## Required Commands

Run from the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm registry:checksum
corepack pnpm test
corepack pnpm build
corepack pnpm exports:smoke
corepack pnpm pack:dry-run
```

## npm Publishing Checklist

- Review `npm --prefix packages/sdk pack --dry-run` output and verify it contains only package files needed by downstream consumers.
- Verify `dist/*.d.ts` exists for every exported subpath.
- Verify `packages/sdk/registry/zodiacs.registry.json` and `zodiacs.registry.sha256` are included.
- Verify `README.md`, `CHANGELOG.md`, `LICENSE`, and package metadata are included.
- Publish only from a clean release branch after CI is green.

## GitHub Release Checklist

- Link the merged pull request.
- Include compatibility notes for root and subpath imports.
- Mention any migration notes for explicit market imports.
- Mention registry checksum status.
- Mention examples and docs added or changed.
- Do not include asset-promotion, trading, crypto-incentive, or wallet ownership access control language.

## 1.0 Candidate Criteria

A 1.0 release candidate should have:

- Batched Base ownership reads with fallback coverage.
- Wallet-level Solana token account discovery with fallback coverage.
- Module-resolution smoke tests for Node16, NodeNext, and Bundler.
- Fixture exports for app test suites.
- Native iOS read-only API docs.
- Base app starter checks in CI.
- Clear security posture and read-only threat model docs.
