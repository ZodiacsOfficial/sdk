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

Delivery: [draft #8](https://github.com/ZodiacsOfficial/sdk/pull/8), stacked on #7.
The exact [immutable archive](https://raw.githubusercontent.com/ZodiacsOfficial/sdk/2000377b1b537c1b08c873889059acc8edacc4fe/artifacts/zodiacs-engine-0.1.1-rc.3.tgz)
was anonymously downloaded at 22:05 UTC with matching size/SHA-256.
[Public-download receipt](evidence/receipt/public-artifact.json). Existing SDK CI
only triggers for main-targeting PRs, so no successful stacked CI is claimed.

An actual Chrome 152.0.7977.83 probe passed **23 assertions** using the rebuilt
receipt ESM and its two local lightweight chunks. Intl and storage were blocked
before module import; all five codec operations worked with the browser offline,
zero network/capability attempts, zero cookies and zero page errors. The browser
recreated Charts from synthetic fixture values; it did not execute the ephemeris
or prove cross-runtime astronomical equality. [Browser result](evidence/receipt/browser-result.json),
[exact commands and environment/harness corrections](evidence/receipt/browser-README.md).
The [final formatted-fixture verification](evidence/receipt/fixture-verification.json)
supersedes pre-format fixture byte hashes in the generation record; semantic
values and same-build recalculation still match. Owned browser/server resources
were closed and all fixtures remain synthetic.

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

## GeoNames schema and cache integrity candidate

Candidate rc.4 is based on SDK #8 `b0d7f025`; it changes the optional GeoNames
client, tests and documentation. Numerical algorithms, Registry/ownership
behavior, root dependencies and all existing archives are unchanged. Only the
reported engine version changes for calculations. Central dependency/decision
records remain in the site platform ledger.

Before implementation, temporary HTTP-200 error envelopes and incomplete
index/shard objects stayed fulfilled in the internal request cache. Three
explicit caller attempts made only one failing resource fetch. A string
`__proto__` table index escaped as an array-valued region, and mutating arrays
returned by `preload()` changed later metadata/search. Baseline regressions:
**59 failed / 4 valid controls passed**.
[Observed counterexamples](evidence/geo-schema/baseline-probe.json.log),
[initial regression failures](evidence/geo-schema/red-schema.log).

The final client validates the generator's v1 shape inside the cached promise,
so schema rejection follows the existing identity-guarded eviction path. It
copies index tables/rows at validation and exposes fresh metadata arrays. The
whole requested shard is checked before results; other successful/in-flight
requests are preserved. Fixed schema errors contain no supplied body values.
It accepts empty region/country labels, Unicode names, exact geographical
endpoints and nonempty timezone strings independent of today's host ICU.

The agent's isolated source suite passes **377 engine tests / 10 files**. Root's
versioned integration passes the full **496 tests / 30 files** on Node 20.20.2
and Node 22.23.2. Required lint, typecheck, registry checksum, neutrality, full
workspace/example build, TypeDoc, module-resolution exports, package contents,
dry-pack and format gates all pass. Initial build/typecheck were inadvertently
started concurrently although example typecheck removes `.next`; both exited
successfully, but they are superseded by the recorded **sequential** final build
and typecheck before subsequent gates. No shared-output concurrency is relied on.

All **33,934 checked-in rows in 27 shards** validate. A fixed 27-query comparison
retains exact metadata, results and request ordering, with 28 requests per
client. This is dataset compatibility, not independent verification of place
facts. Nine independent Node 22 probes with strict unhandled-rejection handling
pass on geo source SHA-256
`fd4363799fb26f3682b8c54054afc07761d7c301cdb798e6afc40965df150437`: catch-triggered
retry races, unrelated pending work, caller mutation, zero scalar coercions,
27 table-index traps, full-shard rejection and eight baseline query comparisons.
The reviewer did not author this implementation or repeat the full corpus.

[Source implementation review](evidence/geo-schema/REVIEW.md.log),
[corpus evidence](evidence/geo-schema/corpus.json.log),
[independent review](evidence/geo-schema/independent-REVIEW.md.log),
[independent probe](evidence/geo-schema/independent-probe.mjs.log),
[exact input paths and hashes](evidence/geo-schema/inputs.json.log).

A tested counterexample pairs a structurally valid shard with a differently
ordered cached index: in-range indices silently choose the wrong country/zone.
The v1 format has no content/generation identity to detect this. No aggregate
count check across unrequested shards or successful-cache refresh is claimed.
Caller-supplied fetch code and its accessors/iterators are not sandboxed. No new
response-size budget is introduced. All network responses in source probes are
synthetic; real browser/public packed-consumer acceptance is still pending.
SDK #5's explicit do-not-merge/do-not-publish and required review remain.

### Frozen rc.4 archive and actual consumers

Source commit **`d190d97c981c7cacc6eb4ab6a49bdb8451ca3459`** precedes packing.
Distribution commit **`9ad6a73984e69b897a6422429fab1970a7c89450`** contains
`zodiacs-engine-0.1.1-rc.4.tgz`: **22 files, 33,669 packed bytes, 112,949
unpacked bytes**, SHA-256
`0146fdff7abb6b937cf4d66b4cdaf0c80ecf238ea71f1f4f9fb27eae687a0d20`.
The [immutable public archive](https://raw.githubusercontent.com/ZodiacsOfficial/sdk/9ad6a73984e69b897a6422429fab1970a7c89450/artifacts/zodiacs-engine-0.1.1-rc.4.tgz)
was downloaded without credentials at **23:08 UTC** and matches exactly. No
previous version's bytes were replaced. Pack stdout includes tsup prepack logs;
the original is retained and its trailing single-package JSON inventory is
separately parsed, not mislabeled as a JSON-only raw command response.

Actual fresh consumers on **Node 20.20.2 and 22.23.2**, with TypeScript 5.9.3,
pass root/geo/receipt imports, ordinary calculations, errors, optional dependency
isolation, rejected fetch/parser recovery, malformed HTTP-200 schema recovery,
shared rejection identity, cache mutation protection and receipt/redaction
controls. Separate empty npm configuration and caches were used; installed
engine trees are real local consumers, not workspace links. Isolated consumer
advisory audit reports zero.
[Node 20](evidence/geo-schema/consumer20.log),
[Node 22](evidence/geo-schema/consumer22.log),
[audit](evidence/geo-schema/consumer-audit.json.log).

The exact installed packages rc.3 and rc.4 match in **96 synthetic chart cases**
after excluding only `engineVersion`; ephemeris is 2.1.19 on both. Current-version
receipt replay also matches, with absent optional input flags normalized to an
empty array. No numerical rounding or new astronomical-accuracy claim.
[Probe](evidence/geo-schema/packed-parity.mjs.log),
[result](evidence/geo-schema/packed-parity.json.log).

Actual **Chrome 152.0.7977.83** passes **20 checks** against the fresh rc.4 consumer,
after comparing all 22 installed engine files with the archive. With six
synthetic intercepted HTTP-200 asset requests, index/shard failures recover on
explicit retry, pending/success caches deduplicate, caller mutation is isolated
and cached operation remains available offline. Tested requests are GET-only
fixed resource paths, with no full search/birth sentinels, body or query string.
The shard path necessarily reveals a normalized initial; this is not a claim
of zero search information. Tested storage/Intl/other-network attempts and
cookies are zero, with separate controls proving observers are armed. The
optional geo graph excludes root/ephemeris/ownership; a separate root graph
excludes GeoNames. No browser ephemeris calculation or live GeoNames response
is implied. Owned browser/server are closed.

The initial harness stopped before browser execution because esbuild's virtual
stdin module key was a normalized relative path; the comparison was corrected
to resolve it. Original script/log and the successful final source are retained.
[Browser methodology](evidence/geo-schema/browser/README.md.log),
[20-check result](evidence/geo-schema/browser/browser-result.json.log),
[exact delivery evidence inputs](evidence/geo-schema/delivery-inputs.json.log).

Fresh release reads at 23:08 UTC still show site main `7f953e3f`, SDK main
`b49e0f14`, SDK #5 OPEN/draft at `cced0116`, zero reviews and its explicit hold.
Public npm engine/widgets lookups return 404; ownership remains 1.0.1. These
are reviewed-by-model/local-testing facts, not required human review or release
authorization. Draft PR, npm publication, production and external adoption are
tracked independently.

Delivered as [draft PR #9](https://github.com/ZodiacsOfficial/sdk/pull/9), stacked
on #8, with source `d190d97c981c7cacc6eb4ab6a49bdb8451ca3459`, archive carrier
`9ad6a73984e69b897a6422429fab1970a7c89450` and final browser/evidence checkpoint
`ef846c82dd284559f1574f69ee901a221a7a722a`. All required local gates above were
executed. The existing GitHub workflow targets main PRs, so no passing CI for
this stacked draft is claimed. No merge, npm publication, production release
or external adoption was performed.

## Public flags and civil settings candidate

SDK branch `codex/platform-input-flags` is based on delivered #9 at `84897ffb`.
The bounded seven-file patch was reproduced and reviewed in an isolated checkout
of runtime source `d190d97c`. Root integrated patch SHA-256
`33f03b34d580b042ee35337d44a62c6ce112980c924c1017a9713db6fbc6f12a`, then changed
only candidate version identity, changelog, consumer verification and generated
TypeDoc in addition to that patch. Numerical formulas, internal computation,
receipt implementation, dependency lockfile, ownership/Registry and old archives
are unchanged. Site and starter pins remain separate.

Before: correct typed `no-time` and `polar-fallback` echoes duplicated result
flags and failed receipt creation; private/malformed/contradictory inputs could
become result metadata. Civil settings admitted values rejected downstream and
public settings could be reread after validation. Final original-source suite:
**61 failed / 5 passed**, with 18 birth and 12 civil observational cases.
The initial baseline Intl constructor spy was faulty; the original output is
retained and explicitly superseded by the forwarding-constructor final suite.
[Implementation rationale and limits](evidence/input-flags/REVIEW.md.log),
[baseline probe](evidence/input-flags/baseline.json.log),
[final baseline suite](evidence/input-flags/red-final-suite.log),
[before/after harness](evidence/input-flags/probe.mjs.log).

The existing five-value public type is preserved. At most 64 raw own data slots
are snapshotted without custom iteration or scalar coercion; known duplicates
collapse, and invalid/private/gap-plus-fold contradictions reject with fixed
errors. Time flags remain unauthenticated historical assertions. Derived echoes
must agree with actual calculation; canonical `chart.input.flags` holds only
time assertions. Raw submitted arrays are not preserved. A supplied Chart gets
metadata consistency checks only; canonical identity and numerical references
are preserved, with shallow metadata normalization when needed. Changed body
longitudes are deliberately accepted as caller claims: no numerical
recomputation/authentication is asserted. Objects remain caller-owned and
same-realm executable getters/proxies are not sandboxed.

Shared public/civil settings use a single validated snapshot. Ordinary Saturn
input adds zero natal computations; an explicit raw polar assertion adds one
calculation to verify actual fallback before scanning. Supplied Chart paths
never add a natal calculation. Independent frozen-source review passes **14/14**
controls, including exact call counts, getter substitution, flag slot/length
traps, correct echoes/receipts, 08:30 unknown time, missing result metadata and
identity/immutability. The reviewer did not author the runtime patch or repeat
its full suite. Harness corrections are retained and no human sign-off is claimed.
[Independent report](evidence/input-flags/independent-REVIEW.md.log),
[executed independent tests](evidence/input-flags/independent-probe.test.ts.log),
[source hashes and raw input mapping](evidence/input-flags/source-inputs.json.log).

Root's actual versioned integration passes **562 tests / 31 files** on
Node 20.20.2 and Node 22.23.2. Required workspace build, typecheck, lint,
registry checksum, neutrality, export smoke, package contents, dry-pack,
TypeDoc and format checks all pass. Build → typecheck → other gates were
executed sequentially; the independent Node 20 test run writes no build output.
[Sequential gate results](evidence/input-flags/release-gates.json.log),
[Node 20 test](evidence/input-flags/release-test20.log),
[Node 22 test](evidence/input-flags/release-test.log),
[exact release check mapping](evidence/input-flags/release-inputs.json.log).

Refresh at **2026-09-07 23:41 UTC**: site main `7f953e3f`, SDK main `b49e0f14`,
SDK #5 OPEN/draft at `cced0116` with zero submitted reviews and explicit
**do not merge / do not publish**. Engine/widgets registry lookups remain 404;
optional ownership SDK remains 1.0.1. Production `zodiacs.org` remains READY
`dpl_BrntzbFYa2gzetKWgeq91GFeaM6W` at site main. New rc.5 archive/consumer/browser
acceptance and draft delivery are pending at this source checkpoint. No npm
publication, merge, production operation, outreach, spending or account action.

### Frozen rc.5 archive and consumer acceptance

Source **`97f5e8d01828f4b85ffa845825dee9acff4695e4`** precedes packing.
Archive carrier **`333369256af683c560603dd1e6411dd7a07adb1f`** contains the
new immutable **23-file, 36,065-byte** package (121,212 unpacked bytes), SHA-256
`1809c1686843a6be148eb185535e32059a20c35896e29ccfc7583a6b2738da65` and integrity
`sha512-XUmtZ+mOwMJxElr6hbhQ59cPatvsPa8/XrLfihZfdsQnMZgptlTZSV6YBRVr+Nqps0No64HUpYLXNhUoeCVzNA==`.
All members match the frozen source/build files, notices and sole ephemeris
dependency are retained, and SHA-512 integrity agrees. At **23:49:36 UTC**, the
[anonymous public download](https://raw.githubusercontent.com/ZodiacsOfficial/sdk/333369256af683c560603dd1e6411dd7a07adb1f/artifacts/zodiacs-engine-0.1.1-rc.5.tgz)
matched every local byte. Older archives are unchanged.

The first pack built successfully but failed with inherited npm cache EPERM
before producing any archive. No cache ownership/configuration was changed.
The attempted inventory extraction then found no package inventory. Packing was
repeated with isolated empty npm configs and a writable temporary cache; it
succeeded without source changes. Original failure output is retained. Raw pack
stdout includes prepack build logs, with its trailing JSON inventory parsed
separately. [Original pack failure](evidence/input-flags/delivery-pack-attempt-1.log),
[successful raw output](evidence/input-flags/delivery-pack.log),
[public download receipt](evidence/input-flags/delivery-public-artifact.json.log).

Two actual fresh consumers on Node 20.20.2 and 22.23.2 use no workspace links.
They pass TypeScript 5.9.3 public imports, all five typed flags, good echo/replay,
precomputed identity/shallow normalization, malformed/private claims, scalar
snapshots and civil settings rejected before Intl, in addition to earlier
GeoNames, receipt, error, notice and optional-dependency controls. The isolated
consumer audit is zero. Actual installed rc.4 and rc.5 packages match all
mathematical fields in **480 synthetic chart cases**, excluding only
engineVersion, with ephemeris 2.1.19 on both. Another **480 valid duplicate/result
flag echo controls** match canonical input, unchanged-schema receipt replay
matches, and canonical supplied Chart identity survives. This is finite
compatibility evidence, not an independent astronomical reference.
[Node 20](evidence/input-flags/delivery-consumer20.log),
[Node 22](evidence/input-flags/delivery-consumer22.log),
[audit](evidence/input-flags/delivery-consumer-audit.json.log),
[executed parity probe](evidence/input-flags/delivery-packed-parity.mjs.log),
[parity result](evidence/input-flags/delivery-packed-parity.json.log),
[raw delivery mapping](evidence/input-flags/delivery-inputs.json.log).

Actual packed-browser acceptance and draft delivery remain pending at this
artifact checkpoint. No merge, npm publication, production deployment or
external adoption is claimed.

### Final rc.5 browser acceptance

Actual **Chrome 152.0.7977.83** passes **26/26 aggregate acceptance checks**,
including **14 browser API groups**, against the fresh consumer's exact 23
archive members. Core/geo/receipt were bundled from installed public exports,
with every graph input hashed: optional geo/receipt omit ephemeris/ownership;
core omits optional implementation. Browser groups cover invalid civil settings
before Intl, malformed/private flags, 64/65 boundaries, no iterator/coercion,
derived echo/receipt replay, unknown 08:30, Chart identity/shallow normalization,
40 contradiction paths, getter snapshots, early Gregorian years, modern gap/fold,
historical fractional LMT, local-resolution receipt and actual Saturn parity.
Saturn internal invocation counts were not instrumented in browser; source
review provides that separate evidence.

Observers were installed before module import and proven with negative controls.
Acceptance requested only four static GET resources (`/`, `/root.js`, `/geo.js`,
`/receipt.js`), without query or body. Module import attempted no fetch/storage/
Intl access; all API groups ran offline with zero observed fetch, storage or
other network capability attempts, zero cookies and zero browser/console/CSP
errors. Valid civil tests intentionally constructed Intl six times. These are
finite local controls, not a sandbox or universal historical-time guarantee.
Owned browser/context/agent session/server were closed.

The initial harness exceeded macOS's Unix-socket name-length limit before any
candidate module ran. Archive/graph checks had passed; the only correction was
a shorter owned session name. Both attempts and exact scripts/logs/graphs/
results/captures/trace are retained without source changes.
[Browser methodology](evidence/input-flags/browser/README.md.log),
[compact result](evidence/input-flags/browser/summary.json.log),
[complete result](evidence/input-flags/browser/run-1788825287747-62400/browser-result.json.log),
[exact retained input mapping](evidence/input-flags/browser/inputs.json.log).

All authorized local package acceptance is complete for this bounded candidate.
Required external/human review and SDK #5's explicit release hold are unchanged.
No npm publication, merge, production deployment or external adoption occurred.

Delivered as [draft PR #10](https://github.com/ZodiacsOfficial/sdk/pull/10),
stacked on #9, at acceptance checkpoint
`785e3ea154c28e890ecc97ce2284ee3e9f48a4a7`. The existing CI workflow only targets
main PRs; the required local gates above were executed and no passing stacked
CI is claimed. The central site ledger tracks its separate artifact adoption
and account compatibility work. This delivery does not lift SDK #5's hold.

## Historical local-time precision candidate

Base is actual SDK #10 head `224863ebea0ab62d0eff721a53f5ab2a1bfc756f`, freshly
read alongside SDK #5's body/reviews. Root is author/integrator; the real
`/root/adoption_review/time_context_edges` agent independently copied and tested
frozen source, without using root's generated build output.

Actual Manaus `1914-01-01 00:00` resolves to `04:00:04Z` with a four-second
forward shift. The previous minute-only match omitted `dst-gap`, and the next
minute/noon received false `dst-fold`. Root's first 14 regression tests produce
10 failures / 4 passes against unchanged source. The corrected comparator
passes the expanded 17 regressions, including Caracas's fractional final offset,
Dawson Creek's 56-second gap and Denver's genuine four-second fold.

Decision: keep Gregorian wall formatting and match full seconds/milliseconds
against the explicit `HH:MM:00.000` input. An integer-offset arithmetic comparator
was considered and independently checked 834 times, but retaining the formatted
comparison preserves the existing independent wall/offset agreement with a
smaller structural change. Round only floating-point offset conversion to integer
milliseconds; never remove historical seconds or invent flags in an adapter.
Keep strict guards, requested settings, earlier-fold and shift-forward policies,
and the existing ±36-hour candidate sampling. A synthetic two-transition model
shows why precision alone cannot prove that the samples discover every offset.

Root full acceptance: **579 tests / 32 files on Node 22.23.2 and Node 24.19.0**;
all eleven required sequential workspace gates and generated TypeDoc pass.
[Raw commands/exits](evidence/time-seconds/implementation/release/gates.json.log),
[29-record implementation manifest](evidence/time-seconds/implementation/manifest.json).
The first pack command could not write the preconfigured cache outside the
sandbox. It was repeated using a dedicated temporary cache; no ownership or
permissions were changed. Both fresh consumer installs/types/runtime checks
pass against the same actual archive. Archive version **0.1.1-rc.6**, 23 files,
36,591 packed bytes / 122,552 unpacked bytes, SHA-256
`09c3e63432f8ba2e9df05af137c42f65ab039740a207a89418d9e6470ea3db3e`.

Independent Node review: **278** transition/guard cases, **140** expected flag
corrections and zero changed tested instants/offsets. Independent Chrome 152:
**37** selected cases, **15** expected flag corrections, zero changed instants.
Both runtimes pass six settings controls, seventeen invalid settings controls,
and seven actual receipt serialization/parse/replay comparisons against rc.5
numerical results. Browser fetch/XHR/beacon/storage/IndexedDB and external request
observations are zero; local resolution legitimately uses Intl. Browser ICU/tzdb
versions are not inferred. Actual source and dependency hashes are retained.
[Independent review](evidence/time-seconds/independent-review/REVIEW.md.log),
[93-record manifest](evidence/time-seconds/independent-review/manifest.json), SHA-256
`5f6565e6ca0b04059dff727931abd09438b3b9fd3b095a746a855cda5432d282`.
Two reviewer-harness mistakes (replay instant type and JSON key-order comparison)
are retained and distinguished from product failures. All six frozen source
hashes match after review; generated documentation is separately root-verified.

The exact source is implemented/tested, not yet claimed pushed or available as
public artifact bytes by this entry. Existing release hold, human/expert/legal
review and production authority remain. The separate site endpoint defects
require a first-existing-instant-of-date policy and explicit skipped-date handling;
neither is silently folded into birth-time gap resolution here. Broader numerical
range, degenerate angles, historical data authenticity and complete transition
discovery remain outside this finite acceptance. No old receipt is rewritten,
no package is published to npm, and no live site or ownership SDK is changed.

### rc.6 draft and anonymous artifact verification

Draft [#11](https://github.com/ZodiacsOfficial/sdk/pull/11) is created and its
actual base/head/files inspected. Source commit is
`fb57af7a2cd7c30983cc8fb655183d5a11f9cf30`; archive carrier is
`51129a197cd3f2a2a8c966fb797ea4da1e147b3d`. An unauthenticated fetch of
[the immutable rc.6 archive](https://raw.githubusercontent.com/ZodiacsOfficial/sdk/51129a197cd3f2a2a8c966fb797ea4da1e147b3d/artifacts/zodiacs-engine-0.1.1-rc.6.tgz)
returns exactly 36,591 bytes and SHA-256
`09c3e63432f8ba2e9df05af137c42f65ab039740a207a89418d9e6470ea3db3e`, matching
the two tested consumer archives. [Public-byte receipt](evidence/time-seconds/public/verification.json.log),
[actual draft/file receipt](evidence/time-seconds/public/draft-pr.json.log).
Existing SDK CI only targets main-based PRs; no passing stacked CI is claimed.
No hold is cleared, package published, site adopted/deployed or outside user
claimed. Later documentation-only heads are distinct from the tested source.
