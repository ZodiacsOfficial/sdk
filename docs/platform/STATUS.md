# SDK platform checkpoint

## Public flags and civil settings candidate

Branch `codex/platform-input-flags` starts from delivered SDK #9 at
`84897ffb6e044469875d381bdc0acbd39c995ffb`. Engine `0.1.1-rc.5` preserves all
five typed flag values, checks derived compatibility echoes, produces canonical
metadata once and captures validated public/civil settings before use. Correct
unknown-time and polar echoes now round-trip through the existing receipt schema.
Malformed/private/contradictory flags reject. Supplied Charts receive metadata
consistency checks, not astronomical authentication.

Implemented and locally tested: **562 tests / 31 files** on Node 20 and 22;
all required workspace and TypeDoc gates pass. The final build and typecheck ran
sequentially. The independent reviewer passed 14 additional frozen-source
controls; original-source regressions were 61 failed / 5 passed. Frozen source
`97f5e8d01828f4b85ffa845825dee9acff4695e4` and archive carrier
`333369256af683c560603dd1e6411dd7a07adb1f` are pushed. The 23-file archive
has SHA-256 `1809c1686843a6be148eb185535e32059a20c35896e29ccfc7583a6b2738da65`;
its anonymous public bytes match. Two actual fresh consumers pass types/public
controls; 480 numerical parity and 480 echo controls pass. Actual Chrome passes
26 aggregate packed-browser acceptance checks, including 14 runtime case groups.
The isolated consumer audit is zero. Draft PR delivery is the remaining step. [Exact commands, compatibility and limits](EVIDENCE.md#public-flags-and-civil-settings-candidate).

The site application retains engine rc.1 and standalone starter rc.3 retains
engine rc.3. Previous artifacts, internal calculation formulas, receipt schema,
account/storage protocols and the optional read-only ownership SDK are unchanged.
Fresh remote reads still show SDK #5's explicit hold and no submitted review;
engine/widgets are not npm-published. Source implementation and internal review
are not release authorization, production deployment or external adoption.

## GeoNames schema/cache candidate

Branch `codex/platform-geonames-schema` starts from delivered SDK #8 at
`b0d7f02549187a9c4a0ca5baa97cf3342fc60707`. Candidate `0.1.1-rc.4` validates
compact v1 GeoNames index/shard JSON before cache fulfillment and returns
metadata array snapshots. Malformed successful responses reject with fixed
schema errors and can be retried by a later explicit call. Valid/in-flight
caches, original transport/parser rejections and request paths are preserved.

Implemented and tested: **496 tests / 30 files** on Node 20 and 22; required
workspace lint/typecheck/build/format/checksum/neutrality/export/content/dry-pack
and TypeDoc gates pass. All 33,934 checked-in rows validate, and 27 sampled
query results/metadata/request sequences agree with baseline. Nine independent
strict-unhandled-rejection probes pass. Frozen source is `d190d97c981c7cacc6eb4ab6a49bdb8451ca3459`. The new 22-file
archive is distributed at `9ad6a73984e69b897a6422429fab1970a7c89450`, SHA-256
`0146fdff7abb6b937cf4d66b4cdaf0c80ecf238ea71f1f4f9fb27eae687a0d20`. Its anonymous
public bytes match. Two actual fresh Node 20/22 consumers pass public types,
examples, schema/retry/mutation controls and receipt replay; isolated audit is
zero. All 96 chart parity cases match rc.3 apart from engineVersion. Actual
Chrome passes 20 additional packed-consumer recovery, privacy and isolation
checks with synthetic HTTP responses. Delivered in [draft PR #9](https://github.com/ZodiacsOfficial/sdk/pull/9), stacked
on #8. This artifact is not published to npm. Existing CI targets main PRs only;
passing stacked-PR CI is not claimed.

Schema validation cannot authenticate place facts or detect in-range indices
from the wrong dataset generation; that counterexample is tested and documented.
Custom fetch code is trusted, not sandboxed. No new response-size budget, eager
shard fetch, automatic retry, host-Intl timezone validation or new service is added.

The site application stays on its immutable engine rc.1. Separately, site draft
[#419](https://github.com/ZodiacsOfficial/site/pull/419) delivers standalone
starter rc.3 with engine rc.3 and local receipt portability. This SDK candidate
does not change either pin, account sync, saved records or the optional read-only
ownership SDK. Earlier candidate sections below describe their own checkpoints.

Explicit SDK #5 merge/publication hold and required review remain. No merge,
npm publication, production deployment, external adoption or human certification
is claimed. [Commands, counterexamples and exact evidence](EVIDENCE.md#geonames-schema-and-cache-integrity-candidate).

## Draft natal receipt candidate

Branch `codex/platform-receipt-contract`, based on delivered GeoNames draft #7
at `4f8903415e95a60969e84f7eb91e72f2f61ad315`. Runtime/source and TypeDoc are
committed at `aaade67d0d49e8b10d1bc5c59cf345d6106dc270`. Engine `0.1.1-rc.3`
adds the optional `/receipt` entry, a bounded Zodiacs draft envelope, requested
and actual houses, captured time assumptions, and fixed-field redaction.
[Draft reference and synthetic fixtures](receipt-draft-v1.md).

Implemented, built, packed and locally tested: **429 tests / 29 files** on
Node 20/22; required SDK gates; actual fresh packed consumers on both runtimes;
finite parity with the site's rc.1; and separate tool-backed adversarial review.
The first naming-guard failure and its narrow convention-wording correction
are recorded, with the guard unchanged. [Evidence](EVIDENCE.md#draft-natal-receipt-candidate).

The frozen rc.3 archive has SHA-256
`aeab68793129517abe7498c5f5a17197d387eed7cbdaa9614f3b8cd939b11a17`.
Delivered in [draft PR #8](https://github.com/ZodiacsOfficial/sdk/pull/8), stacked
on #7. Artifact/evidence commit `2000377b1b537c1b08c873889059acc8edacc4fe`
was anonymously downloaded with the exact bytes/digest at 22:05 UTC. A separate
actual Chrome 152 probe also passed 23 codec assertions offline with Intl/storage
blocked, zero network attempts and no ephemeris imports. No stacked SDK CI is
claimed because the workflow currently targets main PRs only.
No older artifact is replaced. Site/starter pins, account sync v1, saved-profile
formats, ownership SDK, Registry data and root dependencies are unchanged.
The account requested/actual compatibility defect remains open in the central
plan. This additive codec does not complete all C02 integration requirements.

No merge, npm publication, production release, external adoption or human
certification is claimed. Explicit SDK #5 do-not-merge/do-not-publish and
owner-reviewed release gates remain. Recalculation needs independently trusted
matching engine/artifact/ephemeris/runtime facts; imported provenance is a claim.

## Delivered GeoNames candidate

The central program plan and decisions remain in the
[site platform ledger](https://github.com/ZodiacsOfficial/site/blob/codex/platform-receipt-contract/docs/platform/STATUS.md).
This SDK checkpoint records the bounded GeoNames follow-up to draft PR #6.

Branch: `codex/platform-geonames-retry`. Source:
`0da0941e23035df3be95e5aa40f4f270222b57dd`, based on immutable SDK #6 source
`03bf77990f3014b9125eed4976d7a41200aac80d`. Candidate `0.1.1-rc.2` is implemented,
packed and locally tested: 305 tests/27 files on Node 20 and 22, required
workspace gates, TypeDoc and clean public-package consumer checks pass.
[Artifact](../../artifacts/zodiacs-engine-0.1.1-rc.2.tgz),
[commands, results, hashes and limitations](EVIDENCE.md).

The site and public starter still consume rc.1; no existing archive is replaced.
Numerical functions are unchanged except their reported package version; 96
synthetic public-chart comparisons agree exactly after excluding that version.
This is parity evidence, not a new astronomical accuracy claim.

A separate tool-backed reviewer passed 11 additional strict-unhandled-rejection
probes. Structurally invalid but parseable GeoNames JSON remains a confirmed
pre-existing limitation requiring a deliberate schema/cache-policy follow-up.
A complete portable receipt contract remains open in the site plan.

Delivered in [draft PR #7](https://github.com/ZodiacsOfficial/sdk/pull/7), stacked
on #6. Archive/evidence commit `abefc7c347ed22708a6743713d58c843d7166d8e`
was anonymously downloaded at 21:15 UTC with the recorded SHA-256 and 21,946
bytes. Existing GitHub CI targets main PRs only, so no stacked-PR CI success
is claimed; the required local gates above were actually run. This candidate is not npm-published,
merged, production-deployed, externally adopted or cleared for unrestricted
release. SDK PR #5's explicit do-not-merge/do-not-publish hold and required
human/external review remain. Ownership SDK, Registry facts, manifests outside
the engine package, lockfile and all read-only restrictions are preserved.
