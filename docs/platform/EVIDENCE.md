# GeoNames candidate evidence

The baseline was SDK `03bf77990f3014b9125eed4976d7a41200aac80d`. A failed
index/shard fetch stayed cached as a rejected promise, preventing a later
explicit retry. Eight regressions failed on baseline (network rejection,
HTTP 503, malformed JSON and injected fetch abortion at both levels); two
controls passed. The bounded catch cleanup evicts only the matching rejected
entry and rethrows the original reason. Concurrent callers continue sharing
work; successful and unrelated caches survive. There is no automatic request
loop, timer, backoff or new cancellation API.

[Baseline failures](evidence/geo-reproduction-red.log),
[50 focused passing tests](evidence/geo-reproduction-green.log),
[independent review](evidence/geo-independent-REVIEW.md),
[11 strict-unhandled probes](evidence/geo-independent-review-tests.log),
[review receipt](evidence/geo-independent-review-result.json). The review used
frozen temporary source copies; it did not certify a package or a live endpoint.
Its absolute temporary reproduction paths describe those actual executions.
Structurally invalid fulfilled JSON remains cached in both versions; this fix
covers rejected transport, unsuccessful HTTP and JSON-parsing operations only.

## Integrated validation

On candidate source `0da0941e23035df3be95e5aa40f4f270222b57dd` with Node
22.23.2, pnpm 9.15.0 and installed locked dependencies, the following actual
repository commands all passed. Build emitted existing optional dependency
warnings, without failure; no root dependency or lockfile was changed.

```sh
corepack pnpm docs:engine
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm format:check
corepack pnpm registry:checksum
corepack pnpm test
corepack pnpm build
corepack pnpm exports:smoke
corepack pnpm pack:dry-run
corepack pnpm package:contents
corepack pnpm neutrality:guard
```

Full suite: **305 tests / 27 files**, 5.53s on Node 22 and 5.41s on Node
20.20.2. [Node 22](evidence/geo-tests.log),
[Node 20](evidence/geo-tests-node20.log), [build](evidence/geo-build.log),
[types](evidence/geo-typecheck.log), [format](evidence/geo-format.log),
[exports](evidence/geo-exports.log), [contents](evidence/geo-contents.log),
[neutrality](evidence/geo-neutrality.log). All other command logs are adjacent;
[normalization and raw/stored hashes](evidence/geo-log-normalization.json).

## Frozen package and clean consumers

Packed the already-built committed source with
`npm pack --ignore-scripts --json --pack-destination <new-directory>` from
`packages/engine`. The frozen archive has 18 files, 21,946 packed bytes and
72,108 unpacked bytes. [Pack inventory](evidence/geo-pack.json).

- Version: `@zodiacs/engine@0.1.1-rc.2`.
- SHA-256: `b5c0c63bddc8c1ccfc717551bdd57b1bfe7c439568851780575c8586456e0826`.
- Integrity: `sha512-0ckExYLD5vAUwX+aBy+0fcOqonz4l62f4tHholyAcSmOAEdkI8PFyNZSQt0kWi8AcMtDw7KFAiS7DPy/jakidg==`.

Run `node packages/engine/scripts/verify-packed-consumer.mjs /absolute/path/to/zodiacs-engine-0.1.1-rc.2.tgz`.
This was executed with separate isolated npm configurations/caches on both Node
22 and Node 20. It creates a real consumer without workspace links, installs
only the archive's dependencies and TypeScript 5.9.3 with lifecycle scripts
ignored, compiles public imports, checks notices and optional-dependency
isolation, and runs public examples plus index/shard retry through the packed
geo export. Core calculation cannot call fetch; geo uses an explicitly synthetic
injected transport. [Node 22 receipt](evidence/geo-consumer22.json),
[Node 20 receipt](evidence/geo-consumer20.json). The isolated Node 22 consumer's
actual npm audit found **zero** advisories: [audit](evidence/geo-consumer-audit.json).
This does not clear the separately recorded SDK app/example dependency findings.

Ninety-six synthetic public natal-chart combinations (three instants, four
latitudes, two longitudes, two requested house systems and known/unknown time)
were compared with the site's unchanged rc.1 package. All mathematical fields
are exactly equal after excluding engineVersion.
[Finite parity receipt](evidence/geo-numerical-parity.json). This uses two
versions of the same engine; it is not independent accuracy evidence.

No publication, production operation, outreach, account access or live GeoNames
request occurred. Review/publication holds persist. A future site upgrade must
be a separate reviewed pin/reference/provenance change; it must not overwrite
rc.1 or silently alter saved calculation receipts.
