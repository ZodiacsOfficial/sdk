# Independent review: GeoNames rejection cleanup

Verdict: no blocking defect found in the bounded rejection-cleanup patch.
Reasonable to integrate as a source-only draft stacked on SDK #6, after the
integrator verifies the branch base and runs the required integrated gates.
This review is not a human review, publication approval, a new package release,
or verification of a live GeoNames endpoint. Existing candidate bytes stay frozen.

Reviewed patch SHA256:
`b564ad847dc99f1b7fb6dba0914dad15b791ff72562f16ddfa531302332fb73c`.
Baseline SDK commit: `03bf77990f3014b9125eed4976d7a41200aac80d`.
Read root SDK AGENTS.md, current GeoNames source/API, existing geo tests, patch,
and patch author's README/results. This review changed no active site/SDK source
or archive. The integrator began its SDK changes concurrently after this review.

## Rejection and race analysis

- `fetchJson` is async, so even a synchronous injected fetch/JSON-method throw
  becomes a promise rejection. The catch callback executes after the cached
  promise binding has been assigned; its self-reference is not a TDZ race.
- The promise returned by `.catch` is the cached and awaited promise. Rethrowing
  propagates the original reason through each public caller; there is no detached
  rejection-producing cleanup branch. Handled callers produced no unhandled
  rejection in strict Node execution. An ignored public rejected promise remains
  the caller's responsibility; the patch does not claim otherwise.
- Cleanup occurs before public rejection handlers retry. Fifty callers retrying
  directly from their catch handlers share one new request. Ten consecutive
  failure generations each coalesced fifty waiting callers without background
  retry work. This does not add rate limiting to application-driven retry loops.
- Each shard cleanup addresses only its own map entry. A successful retried
  north shard remained cached while an independent pending south shard failed.
- The identity guard matters: a deliberately reentrant injected fetch can start
  an inner preload before the outer request is installed in the cache. The
  superseded inner request's later rejection did not evict the active outer
  request. Ordinary fetches do not reenter; this synthetic case exercises stale
  cleanup through public methods without exposing private cache internals.

## Confirmed existing limitation, not a patch regression

Valid JSON with an invalid GeoNames structure still poisons a successful cache:

1. Fetch returns JSON `null` for index.json. `fetchJson` fulfills and is cached.
2. `preload()` throws `TypeError` while reading the null metadata.
3. Switch the injected transport to a valid index and call preload again.
   It throws again; the transport has still been called only once.

A valid index followed by JSON `{}` for a shard behaves similarly: both searches
throw when iterating rows, and the bad shard is fetched only once. The same test
reproduced both outcomes against baseline and patched sources.

This patch handles fetch rejection, HTTP failure, and syntactic JSON parsing
failure. Describe that scope precisely rather than claiming recovery from every
preload/search failure. A follow-up should decide schema validation and cache
policy explicitly; widening this patch to clear caches after arbitrary search
errors could discard healthy shared data because of caller errors.

## Actual tests

All tools ran locally on Node 22.23.2, without network or account access. The
patch was applied only to a separate temporary source copy; installed dependency
directories were linked read-only for the Vitest run, with its cache disabled.

- Patch regressions plus existing geo tests: **50 passed / 2 files** (Vitest2.1.9).
- Independent `adversarial-review.test.mjs`: **11 passed** under native Node with
  `--unhandled-rejections=strict --experimental-strip-types`. See `review-tests.log`.
  Includes synchronous fetch and JSON-method throws, delayed body parsing,
  concurrent retry generations, reentrant stale cleanup, isolated shard failure,
  rejection reasons undefined/null/0/empty string, and the existing malformed-
  structure limitation against both versions.

The baseline comparison is frozen in `baseline-geonames.ts`, extracted with
`git show` from the named baseline commit. The final strict run uses this
snapshot, so subsequent integrator working-tree changes cannot alter the probe's
baseline. `review-result.json` records exact reviewed-source and probe hashes.

No full workspace typecheck/build, packed-consumer test, browser run, real aborting
network transport, live endpoint, branch push, PR operation, or release was
performed by this review. Finite synthetic scheduling cases on one runtime are
not a proof of every custom transport or execution environment.
