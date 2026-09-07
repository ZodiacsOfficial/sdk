# Additive natal receipt codec — bounded independent review

Observed 2026-09-07T21:51:58.049393+00:00. Review performed by a separate model agent using actual source and synthetic scratch probes. This is not human review, protocol adoption, a package publication, or a deployment.

## Result

No remaining concrete blocking finding in the inspected scope. The earlier probes accepted a known-time exact-pole receipt with houses, and duplicate JSON `requiredFeatures`/`schema` members allowed native last-member-wins interpretation. The codec owner added the pole exclusion; the new `receipt-json.ts` preflight rejects decoded duplicate keys before native full parsing. All three counterexamples now reject in `counterexamples.json`. The original red observations were reported in task messages; this directory's counterexample report records the latest post-fix run.

The preflight is iterative and checks strict JSON grammar, per-object decoded-key uniqueness, root/child depth and value count. Root depth is zero; member names do not add value nodes. It accepts scalar JSON for the outer envelope-shape validator to reject. It preserves native JSON values, including a numeric token that overflows to Infinity; the outer codec rejects nonfinite values. Byte limits remain the outer codec's responsibility. No dependency was added.

## Evidence

- `json-helper-tests.log`: 88 helper tests passed, including escaped-equivalent duplicates, nested duplicates, formatted JSON, string escapes/controls, grammar near misses, prototype-data safety, and exact complexity edges.
- `json-helper-format.log` and `json-helper-typecheck-final.log`: helper formatting and full engine typecheck passed. The earlier typecheck log retains transient work-in-progress errors; it is superseded by the final passing log.
- `json-differential.json`: 1,500 generated valid documents and 20,000 deterministic grammar mutations compared against native JSON parsing, zero failures. Duplicate-key policy has dedicated unit tests.
- `probe.json`: 21 baseline precision/replay/input/extension/privacy controls passed.
- `temporal.json`: 17 controls passed for astronomical year zero, year 0099, boundary crossing into negative year, original offset spelling including `-00:00`, historical LMT seconds, DST gap/fold, Lord Howe's half-hour gap, Apia's skipped day, and explicit noon accuracy. A probe with Intl/fetch disabled confirms codec replay does not consult those services.
- `error-probes.json`: 22 error-spoof and canonical-order controls passed. Proxy traps throwing private-text errors, mutated branded errors and forged code getters returned fixed errors across create/serialize/replay/redact. Sorting was identical with locale services disabled.
- `counterexamples.json`: three earlier counterexamples now reject.

Each source-loading report records its source hashes; `review-summary.json` records the final inspected source identity. Scripts in this directory reproduce the probes without modifying repository source/tests or running a package build. They transpile actual TypeScript into an isolated module loader; root owns packaged-artifact and complete-release verification.

## Limits and integration boundary

This is a finite corpus, not proof of all dates, all imported documents, ephemeris truth, or historical tzdb correctness. Temporal cases use the recorded Node/ICU runtime. Provenance and local-resolution metadata are supplied claims, checked for shape and arithmetic consistency; they are not authenticated. The codec is not a sandbox for arbitrary same-realm JavaScript: proxy traps can execute during object inspection, while caught errors are sanitized. It does not fetch, render, or execute extension data.

Requested and actual houses are preserved for fresh full charts. No legacy user intent is inferred. Account sync v1, saved-profile bytes and migration logic remain outside this additive slice. The original compatibility counterexample and its boundary analysis are preserved in the site's new `docs/platform/evidence/c02-house-compatibility.md` and `.json` records.

## Final source hashes

- `packages/engine/src/receipt.ts`: `fe1d63d46031dc439728754c319ee291a78ccd5254adb3f085ef53726651b725`
- `packages/engine/src/receipt-json.ts`: `da5627224b593769eea8f1d434815ad34f422f44e1ef38a6687f86d8ccf8dd5c`
- `packages/engine/src/receipt-json.test.ts`: `9771c80a0e64e93612b1f345ec865ee238d34491f21031dc025761410740faf6`
