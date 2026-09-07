# SDK platform evidence

## Draft natal receipt candidate

Runtime source `aaade67d0d49e8b10d1bc5c59cf345d6106dc270` is based on delivered
GeoNames draft #7 (`4f8903415e95a60969e84f7eb91e72f2f61ad315`). The additive
`@zodiacs/engine/receipt` export captures one fresh natal result at full precision,
including requested versus actual houses, explicit absent-house reasons,
original ISO spelling when captured, unknown-time reference conventions, and
optional arithmetically checked local-time context. It never re-resolves today's
timezone data or authenticates supplied provenance. The [draft reference](receipt-draft-v1.md)
and its two actual generated synthetic fixtures document the executable contract.

Inputs are bounded to 64 KiB UTF-8, depth 12, 4,096 values, fixed body/aspect arrays,
and checked enums/geometry/flag consistency. Unknown versions or required
features reject. The iterative JSON preflight rejects duplicate decoded keys
before native last-member-wins parsing. Data-only extensions survive but are
omitted from fixed diagnostic fields, together with dates, offsets, zones,
coordinates, numeric results, arbitrary strings and stable hashes. Redacted is
not anonymous. Same-realm proxy introspection is not a JavaScript sandbox;
caught exception text is sanitized. Account sync/storage v1 are untouched.

The independent tool-backed [review](evidence/receipt/independent-REVIEW.md)
found known-time exact-pole and duplicate-key counterexamples; both were fixed.
It passed 60 receipt/temporal/privacy/order controls, 88 JSON unit cases and
21,500 deterministic JSON differential cases. This is finite internal
model-assisted evidence, not human/external expert certification or broad
astronomical/tzdb accuracy. The integrator then reran all 60 controls, three
fixed counterexamples and JSON differential probes after the sole convention
wording change; see `integrator-*.json` in the [evidence directory](evidence/receipt/).
Source hashes distinguish the original independent review and final root reruns.

All required workspace lint/typecheck/format/checksum/test/build/export/pack/
contents/neutrality commands and TypeDoc generation were actually run. Final
suite: **429 tests / 29 files** on Node 22.23.2 and Node 20.20.2, using Bangkok
and UTC host zones respectively. [Node 22](evidence/receipt/receipt-tests-final.log),
[Node 20](evidence/receipt/receipt-node20-final.log),
[initial complete gate record](evidence/receipt/receipt-gates.json).
The initial naming guard matched a substring inside the new scientific
convention name. It remains unchanged; the unreleased convention now uses
`moonNodes` and `instantaneous-geocentric-moon-orbit-plane`. Rebuild, TypeDoc,
focused/full tests, types, exports, contents and the naming guard were rerun.
All final logs and their normalized/raw hashes are retained alongside the
initial failure. The existing optional dependency build warning remains explicit.

Ninety-six synthetic public natal cases exactly match site rc.1 mathematical
output, with only engineVersion excluded. Same-candidate receipt replay also
matches, after treating absent optional input.flags and an empty flag list as
equivalent. The initial harness incorrectly required those representations to be
structurally identical; that assertion was corrected without changing production
code or rounding values. [Parity receipt](evidence/receipt/receipt-numerical-parity.json).

The already-built committed source was packed once using
`npm pack --ignore-scripts --json --pack-destination <fresh-directory>`.
Candidate **0.1.1-rc.3** has **22 files, 32,079 packed bytes, 107,847 unpacked bytes**.
[Inventory](evidence/receipt/receipt-pack.json).
SHA-256: `aeab68793129517abe7498c5f5a17197d387eed7cbdaa9614f3b8cd939b11a17`.
Integrity: `sha512-1HjeWUCI3i+u+UBoCQxqJaLml6ihktiRLUC7lDFO8PGsUzsi8iplC5UH7uwKtwifkgyG/LiErgyxdrIRMOJTyw==`.

Actual fresh consumers installed this archive and public dependencies with
isolated npm configs/caches and ignored lifecycle scripts on Node 20/22. Both
compile public TypeScript 5.9.3 imports and pass core examples, dependency
isolation, notices, GeoNames retry, receipt replay and diagnostic privacy checks.
[Node 22](evidence/receipt/receipt-consumer22.json),
[Node 20](evidence/receipt/receipt-consumer20.json). The built optional receipt
graph has no external imports; no ephemeris, ownership or UI dependency is
needed to parse a receipt. This does not imply another engine/runtime reproduces
an imported result merely because its version label matches.

The isolated Node 22 consumer's [public advisory check](evidence/receipt/receipt-consumer-audit.json)
returned zero advisories. This does not clear the previously recorded broader
SDK app/example dependency findings.

The site/starter retain immutable rc.1; rc.2 is also preserved. Broader date/range
and degenerate-angle policy, versioned account payload/downgrade safety and site
integration remain open. Site main `7f953e3fca0e7d5009e5602a1dad69edff0f54cc`,
SDK main `b49e0f14f9f17bc84db39486f2c4bb075e0ae3ff`, and held draft #5 source
`cced011659d48877b8b73b8a85796815234cf741` were refreshed at 21:55 UTC: unchanged,
no submitted #5 reviews, explicit do-not-merge/do-not-publish remains. No
publication, production operation, outreach, spending, access change, account
operation or migration was performed.

## GeoNames candidate evidence

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
