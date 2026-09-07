# SDK platform checkpoint

The central program plan and decisions remain in the
[site platform ledger](https://github.com/ZodiacsOfficial/site/blob/codex/platform-civil-inputs/docs/platform/STATUS.md).
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
