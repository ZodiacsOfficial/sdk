# Receipt draft documentation and browser evidence

The owned repository files are `docs/platform/receipt-draft-v1.md` and the two
`docs/platform/fixtures/natal-envelope-draft-v1-*.json` files. No runtime source,
package configuration, build, Git operation, or archive was changed by this task.

`generation-result.json` records generation through built `dist/index.js` and
`dist/receipt.js` on Node 22.23.2. Its fixture byte hashes precede formatting.
**`fixture-verification.json` records the final formatted fixture hashes** and
proves those files still exactly match newly generated envelope values, parse and
serialize without semantic loss, and recalculate identically in the same build
for these two synthetic inputs. It also records the final reference/source/dist
hashes. The receipt source includes the integrator's `moonNodes` convention rename.

Commands run from the SDK repository, with the already-built current candidate:

```sh
/private/tmp/zodiacs-platform-runtime/node_modules/node/bin/node \
  /private/tmp/zodiacs-platform-receipt-docs/verify-fixtures.mjs
/private/tmp/zodiacs-platform-runtime/node_modules/node/bin/node \
  node_modules/prettier/bin/prettier.cjs --check \
  docs/platform/receipt-draft-v1.md \
  docs/platform/fixtures/natal-envelope-draft-v1-polar.json \
  docs/platform/fixtures/natal-envelope-draft-v1-unknown-0830.json
/private/tmp/zodiacs-platform-runtime/node_modules/node/bin/node \
  /private/tmp/zodiacs-platform-receipt-docs/browser-probe.mjs
```

The literal shell-fenced Node round-trip snippet in the reference was also
extracted and executed without alteration. `reference-roundtrip.log` contains:

```text
polar: round trip passed
unknown-0830: round trip passed
```

`browser-result.json`, `browser-probe.log`, and `browser-probe.png` record 23
passing assertions in actual headless Chrome 152.0.7977.83. The probe served an
exact allowlist on loopback, imported the rebuilt receipt entry and its two local
lightweight dependencies with Intl/storage blocked, then used all five codec
operations with Playwright offline. No ephemeris module was imported or run.
There were zero network requests during functions, zero blocked capability
attempts, zero cookies, and zero page errors. Fixtures were transferred directly
through the test harness, not placed into URLs or form requests. Context, owned
browser process, and server were closed in `finally`.

Two harness/environment attempts were retained for transparency:

- `browser-sandbox-failure.log`: the restricted execution environment initially
  rejected the loopback bind with EPERM. The approved local probe subsequently
  ran with escalation.
- `browser-harness-initialization-failure.log`: blocking Intl before Playwright
  initialized its own evaluation transport prevented the test from starting.
  The corrected harness initializes that transport first, then blocks Intl
  **before importing any tested module**. No receipt-source change was made.

This evidence is a local synthetic codec exercise. Same-build numerical
recalculation in Node is not an independent astronomical reference. Browser
creation reconstitutes a Chart from validated fixture values; it does not execute
the ephemeris. No external adoption, cross-runtime astronomical equality,
cross-version compatibility, package publication, deployment, or human approval
is claimed.
