# SDK release integration candidate

Checkpoint: 2026-09-12 UTC. This is the SDK half of the owner's bounded R3
release integration. It combines the already accepted draft stack for review
against current main. It adds no numerical implementation or later feature.
Concurrent verification work remains separate. **Do not merge or publish:** SDK #5's explicit
hold and owner, practitioner and licensing review gates remain in force.

## Exact starting identities

| Role                          | Source                                     |
| ----------------------------- | ------------------------------------------ |
| Refreshed SDK main            | `b49e0f14f9f17bc84db39486f2c4bb075e0ae3ff` |
| Selected cumulative draft #11 | `ac27761e6dea138842e6ef5c2c69129ead7af636` |
| Held draft #5                 | `cced011659d48877b8b73b8a85796815234cf741` |
| Engine rc.6 source            | `fb57af7a2cd7c30983cc8fb655183d5a11f9cf30` |
| Immutable archive carrier     | `51129a197cd3f2a2a8c966fb797ea4da1e147b3d` |

Fresh main is already an ancestor of draft #11. The integration branch retains
the complete accepted #5–#11 history; no conflict resolution, cherry-pick,
runtime modification, lockfile update or artifact replacement is needed.
Its selected cumulative delta is 532 paths, including 75 non-documentation
paths. New integration changes are limited to the root release notice and
this evidence record. Actual heads, bodies and review state are retained in
[starting-heads.json.log](starting-heads.json.log); the complete non-documentation
scope is in [non-doc-paths.json.log](non-doc-paths.json.log).

All applications, examples, hosted workflows, canonical Registry data and
ownership SDK runtime/package declarations match fresh main. The inherited
ownership SDK changes are only its sibling-package README paragraph and a
test's portable file-URL conversion. The optional React/market/UI imports and
read-only ownership boundary are unchanged. The exact engine source and
all prior candidate archives match their accepted identities.

## Artifact and compatibility

The 23-file engine archive remains 36,591 bytes, with 122,552 unpacked bytes:

`09c3e63432f8ba2e9df05af137c42f65ab039740a207a89418d9e6470ea3db3e`

Its SHA-512 integrity, member types, paths and individual file digests match
the committed manifest. A fresh build and pack reproduce the archive byte for
byte. Anonymous retrieval from the exact carrier commit matches those bytes.
The accepted site uses `file:vendor/zodiacs-engine-0.1.1-rc.6.tgz`; its declared
pin, lock integrity and actual vendored bytes agree. The standalone starter's
older candidate stays immutable and is not silently advanced by this task.

A new isolated consumer installs this exact archive with lifecycle scripts
disabled. Public runtime imports, TypeScript 5.9.3, examples, optional-package
isolation, GeoNames recovery, flag/settings rejection, receipt replay and
diagnostic redaction pass on Node 22.23.2. Its production audit reports zero
findings. This is candidate usability, not npm publication or external adoption.

Fresh npm reads report `@zodiacs/sdk` latest `1.0.1`; engine and widgets each
return HTTP 404. The packaged README statements about separate publication
and historical site versions are retained as part of the immutable candidate
source, not taken as current publication evidence. No existing candidate is
repacked under changed bytes or republished.

## Verification and evidence reuse

Fresh local checks pass for the three package builds, export smoke, package
contents, Registry checksum and neutrality guard. Package reproducibility,
actual installed build-tool versions, anonymous artifact bytes and the clean
consumer are verified independently of the previous workspace build output.

The complete selected source, lock and test tree are unchanged. The existing
579-test Node 22/24 suites, workspace build/lint/typecheck/format/dry-pack and
TypeDoc records remain valid within their original scope. The independent
278 Node and 37 actual Chrome controls are reused with their original finite
historical-time and numerical limitations. See the retained
[rc.6 implementation evidence](../evidence/time-seconds/implementation/release/gates.json.log)
and [independent review](../evidence/time-seconds/independent-review/REVIEW.md.log).
Required hosted workflows will run for this main-target integration draft;
earlier stacked drafts did not trigger that workflow and do not substitute
for this result. Hosted CI and preview results will be attached to the exact
draft head before completion is claimed.

The first main-target run passed 578 of 579 tests. Its only failure was the
neutral SDK documentation guard rejecting a named application in this new
record. The sentence now refers to concurrent verification work without
application framing; the test and its forbidden-word policy are unchanged.
The affected documentation test and format check pass after correction.

The first integration head's `sdk-zodia` preview is READY. The separate
`sdk-zodia-launch` project fails with `STATIC_BUILD_NO_OUT_DIR`: its root
configuration expects a `public` directory after the workspace build. That
project also failed on prior drafts. The error is retained as an external
configuration gate, not counted as a passing preview or silently bypassed.
Project settings and production are untouched; the owner must decide how
that extra deployment target belongs in the release process.

The first fresh install stopped at disk exhaustion. Only the new partial
installation was removed; the exact prior frozen installation was copied
using APFS copy-on-write, with declarations, lockfile, metadata and actual
versions checked. An initial content check hit the host's unrelated npm cache
permission; the check passes using an owned temporary cache. The first pin
proof incorrectly expected a remote URL where the accepted site intentionally
uses a vendored file; the corrected assertion checks the actual pin and bytes.
All three setup failures remain recorded. No permission, package gate,
freshness rule, provenance assertion or budget was relaxed.

## Rollback and approval

A separate temporary Git index applies the cumulative reverse patch and
reconstructs the exact refreshed main tree
`6d78b97ce13ee2c1feef584bb2397f207e14c86c`. This verifies a source rollback,
not a deployment rollback. Current worktree files, prior archives and receipts
remain retained. SDK main is never changed by the exercise.

For a later authorized release, select the exact SDK and site integration
commits together. A site engine rollback restores its package pin, matching
resolver and receipt-context adapters together; changing only the package
can create a mismatched contract. Prior rc.5 source is
`224863ebea0ab62d0eff721a53f5ab2a1bfc756f`, with its immutable artifact retained.
Restoring ownership-only main removes the unreleased sibling packages from
that source tree; it does not delete their committed review artifacts.

Before release, the owner must approve the exact merge sequence and any npm
publication or production actions, explicitly resolve the SDK #5 hold and
obtain the required human reviews. After approval, verify actual public
package bytes, production behavior and rollback. This task claims neither
merge, npm publication, production deployment nor external adoption.

## Record index

- [Preservation and archive-member proof](preservation-proof.json.log)
- [Frozen dependency reuse](dependency-reuse.json.log)
- [Installed versions and consumer audit](installed-and-consumer.json.log)
- [Artifacts, paired site pin and rollback identities](artifacts-pins-rollback.json.log)
- [Fresh local gate commands and results](local-gates.json.log)
- [Byte-identical rebuilt archive and clean consumer](reproducibility.json.log)
- [Current npm availability](registry-state.json.log)
- [Source rollback reconstruction](rollback-reconstruction.json.log)
- [Evidence file identities](manifest.json)
