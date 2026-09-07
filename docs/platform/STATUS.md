# SDK platform checkpoint

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
Review delivery and anonymous artifact verification follow this checkpoint.
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
