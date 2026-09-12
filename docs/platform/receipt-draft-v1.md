# Zodiacs natal envelope draft v1

This is a Zodiacs-owned development proposal implemented by the optional
`@zodiacs/engine/receipt` entry point in the `0.1.1-rc.3` candidate. It covers one
fresh natal `Chart`. It is not an industry standard, a published npm release, an
account-storage migration, or evidence of adoption by another integrator. See the
[release checkpoint](STATUS.md) for the candidate's actual delivery state.

The executable contract is defined by [receipt.ts](../../packages/engine/src/receipt.ts),
its bounded [JSON preflight](../../packages/engine/src/receipt-json.ts), and the
shared [Chart types](../../packages/engine/src/types.ts). This reference describes
that contract; it does not introduce a second independently maintained JSON Schema
or validator. The [codec tests](../../packages/engine/src/receipt.test.ts) and
[JSON tests](../../packages/engine/src/receipt-json.test.ts) exercise rejection and
round-trip behavior. Future schema changes require explicit compatibility review.

## Envelope shape

All listed fields are required unless marked optional. Unknown fields outside
`extensions` are rejected. `null` is an explicit unavailable or absent value.
Optional JavaScript properties must be omitted, rather than set to `undefined`.

| Field              | Contract                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `schema`           | Exactly `zodiacs.natal-envelope.draft-v1`.                                 |
| `requiredFeatures` | An empty array. This draft supports no additional required features.       |
| `receipt`          | The calculation assumptions and reported provenance below.                 |
| `result`           | Full numeric `bodies`, `angles`, `houses`, and `aspects` from one `Chart`. |
| `extensions`       | Optional bounded JSON object for unknown optional data.                    |

The receipt contains no generation timestamp, display locale, name, account,
wallet, device identifier, or birthplace label. The numeric result is separate
from presentation and from the receipt. No identity or interpretation extension
is required.

## Receipt fields

| Field             | Contract                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `schema`          | Exactly `zodiacs.calculation-receipt.draft-v1`.                                                                           |
| `instant`         | Valid canonical UTC `Date.toISOString()` spelling, including milliseconds.                                                |
| `sourceInstant`   | Captured original ISO date or offset-bearing date-time spelling, or `null`. It must resolve to `instant`.                 |
| `timeKnown`       | Boolean supplied by the caller; it does not certify a person's birth-time precision.                                      |
| `reference`       | `supplied-instant`, `utc-noon`, or `local-noon`, with the conditions below.                                               |
| `localResolution` | Captured wall-time resolution record, or `null` when unavailable.                                                         |
| `coordinates`     | `{ latitude, longitude }` in degrees, or `null` when unavailable. Latitude is in `[-90, 90]`; longitude in `[-180, 180]`. |
| `houses`          | `{ requested, actual, absenceReason }`, preserving the request even when calculation falls back.                          |
| `inputFlags`      | Distinct caller-supplied time-resolution flags: `dst-gap`, `dst-fold`, and `lmt`.                                         |
| `resultFlags`     | Distinct time-resolution flags plus the consistently derived `no-time` and `polar-fallback` flags.                        |
| `engine`          | `{ name: "@zodiacs/engine", version }`. The bounded version string is a claim, not an authenticity check.                 |
| `provenance`      | Supplied source, artifact, runtime, or ephemeris claims with `status: "claimed"`; otherwise `null`.                       |
| `conventions`     | Fixed fields and literals from the executable contract, described below.                                                  |
| `coverage`        | Fixed limitations from the executable contract, described below.                                                          |

### Requested and actual houses

`requested` is `whole` or `placidus`. `actual` is the calculated system or `null`.
It must agree with `result.houses.system` when houses exist. A Placidus request
that produces whole-sign houses retains `requested: "placidus"`, sets
`actual: "whole"`, and includes `polar-fallback` in `resultFlags`. A whole-sign
request cannot declare a Placidus result.

When `timeKnown` is false, `angles` and `houses` are `null`, the absence reason is
`unknown-time`, and `resultFlags` includes `no-time`. Otherwise, missing coordinates
produce null angles/houses and `missing-location`, without `no-time`. Known time
and coordinates require angles and houses, with a null absence reason. Known-time
inputs at either exact geographic pole are unsupported by this draft. Unknown-time
inputs at those coordinates can be represented without angles or houses.

Only time-resolution flags may appear in `inputFlags`. The creator rejects
caller-forged `no-time` or `polar-fallback` input flags, inconsistent result flags,
duplicate flags, and simultaneous `dst-gap` and `dst-fold` assertions. It does not
infer an old record's requested house system from a historical fallback result.

### Instants and time resolution

The default reference is `supplied-instant`. An unknown-time chart calculated at
08:30 remains an 08:30 reference; neither the hour nor a false `timeKnown` value
implies noon. `utc-noon` requires unknown time and exactly `12:00:00.000Z`.
`local-noon` requires unknown time and an explicit matching `localResolution`
whose captured wall time is `12:00`. Noon conventions must be supplied deliberately.

`sourceInstant` uses the same strict calendar and offset parser as the public
engine. Date-only input means UTC midnight; date-times require `Z` or an explicit
numeric offset. Exact validated source spelling is retained, including `Z`,
`+00:00`, or `-00:00`; the codec does not attach extra timezone or uncertainty
meaning to those spellings. Missing source spelling stays `null`. Invalid civil
dates, offset-free date-times, and a spelling that resolves to a different instant
are rejected. Syntactically supported years are not an astronomical accuracy range.

When available, `localResolution` has exactly these fields:

| Field             | Contract                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `date`            | A real proleptic Gregorian date with exact `YYYY-MM-DD` shape, years `0000` through `9999`.                                     |
| `time`            | Exact `HH:MM`, from `00:00` through `23:59`.                                                                                    |
| `timeZone`        | Bounded identifier-shaped string, at most 128 UTF-16 code units. Syntax does not prove IANA recognition or historical validity. |
| `offsetMinutes`   | Finite resolved-instant offset east of UTC, in `[-1440, 1440]`; fractional minutes can preserve historical offset seconds.      |
| `gapShiftMinutes` | Finite forward wall-clock shift in `[0, 2880]`; positive exactly when `inputFlags` contains `dst-gap`.                          |
| `policy`          | Exactly `{ fold: "earlier", gap: "shift-forward" }`.                                                                            |

The arithmetic invariant is `wall time + gap shift - resolved offset = instant`.
The wall date is interpreted with its full Gregorian year, without JavaScript's
`Date.UTC` remapping of years 0–99. Offset and shift must represent integral
milliseconds, allowing a small floating-representation residue. In this draft,
the `lmt` flag and a fractional-minute offset must agree when local context is
supplied. `offsetMinutes` describes the offset at the resolved instant, including
after a gap shift.

These are captured assertions, checked for consistency. The codec never consults
the current host's `Intl`, resolves a zone again, identifies a fold or gap, proves
the claimed policy was followed, or invents a tzdb version. Unavailable context
stays `null`; do not fill it from current timezone behavior and describe it as a
historical fact.

### Provenance and calculation scope

`provenance` accepts any nonempty combination of the following supplied records:

| Record      | Fields                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `source`    | `repository` and `commit` identifying claimed engine source.                                                                             |
| `artifact`  | `sha256` and `packageVersion`; optional paired `distributionRepository` and `distributionCommit` for the artifact's distribution source. |
| `runtime`   | `name`; optional `version`, `icuVersion`, and `tzdbVersion`.                                                                             |
| `ephemeris` | `name: "astronomy-engine"` and `version`.                                                                                                |

Repository values must be bounded HTTPS URLs without credentials, query, or
fragment. Commits are lowercase 40- or 64-digit hex strings; artifact SHA-256 is
64 lowercase hex digits. Artifact package version must match `engine.version`.
Engine, artifact, and ephemeris versions use the codec's bounded version grammar.
Runtime values are bounded strings. The creator adds `status: "claimed"`.
None of these values is fetched, verified against a registry, authenticated, or
trusted merely because parsing succeeded. Omit facts that were not captured.

The fixed conventions identify the proleptic Gregorian calendar, tropical zodiac,
apparent geocentric planetary ecliptic positions of date, Astronomy Engine's
geocentric Moon path, instantaneous geocentric Moon-orbit-plane nodes
(`moonNodes: "instantaneous-geocentric-moon-orbit-plane"`), GAST and mean-obliquity
angles, degrees in `[0, 360)`, central-difference speed at plus/minus 0.25 day, and
major aspects among the Sun, Moon, and eight planets with nodes excluded. Exact
field names and literals are in the executable contract and generated fixtures.
Changing those literals is unsupported by this draft.

Coverage is explicitly `finite-reference-cases-only` and `not-certified` for a
broad date range. Exact geographic poles and ecliptic/horizon coincidence are
excluded for angles. The codec rejects the directly identifiable known-time pole
case; it does not perform astronomy to detect every geometric singularity.
Acceptance of input syntax is not evidence of astronomical accuracy.

## Numeric result and validation limits

The result retains JavaScript finite number values without display rounding.
There must be exactly 12 distinct named bodies: Sun, Moon, Mercury, Venus, Mars,
Jupiter, Saturn, Uranus, Neptune, Pluto, North Node, and South Node. Longitudes are
in `[0, 360)`, latitudes in `[-90, 90]`, and sign degrees in `[0, 30)`. Sign and
degree must agree with longitude; `retrograde` must agree with negative speed.

Angles and houses must both be absent or both present. Ascendant/descendant and
MC/IC are opposites. Present houses have 12 distinct cusp longitudes. Whole-sign
cusps follow the ascendant's sign; Placidus cusps match the ASC/MC anchors and
opposite cusps. There are at most 45 distinct unordered aspect pairs among the ten
non-node bodies. Types, orb caps, and position/orb consistency use the shared
[aspect definitions](../../packages/engine/src/aspects.ts). Declared angular
consistency comparisons allow `1e-8` degree; this is a validator tolerance, not an
ephemeris accuracy claim. `applying` is a boolean declaration.

Validation does not recalculate positions, prove speeds or applying states,
establish completeness of the aspect list, or authenticate a result. A forged
but internally consistent result may pass. Use a separately trusted engine when
astronomical recomputation is required.

The entire JSON input, including whitespace and extensions, is limited to 65,536
UTF-8 bytes. Maximum value depth is 12 with the root at depth zero; maximum value
count is 4,096, including containers and scalar values. Imports reject duplicate
decoded object keys, including escaped-equivalent spellings, before full parsing.
Nonfinite numbers, invalid schema shapes, dangerous property names (`__proto__`,
`prototype`, `constructor`), and unsupported versions/features are rejected.
JavaScript object APIs also reject accessors, sparse arrays, functions, symbols,
cycles, and unsupported prototypes. They validate and clone before serialization;
they do not call supplied getters or `toJSON`. Proxy introspection can itself run
caller code, so these APIs are not a sandbox for arbitrary JavaScript objects.

Unknown optional data is allowed only inside `extensions`. It remains bounded,
inert JSON and survives parse/serialize; it is never used for calculation, replay,
network requests, or rendering. Consumers must separately escape text before
display and must not execute extension content. Unknown schema versions and any
nonempty `requiredFeatures` fail closed instead of being silently downgraded.

## API, replay, and diagnostics

After obtaining the reviewed candidate package, use explicit imports:

```js
import { natalChart } from "@zodiacs/engine";
import {
  createNatalEnvelope,
  parseNatalEnvelope,
  serializeNatalEnvelope,
  natalReplayInput,
  redactNatalEnvelope
} from "@zodiacs/engine/receipt";

const chart = natalChart({
  utc: "2001-12-21T08:30:00Z", // synthetic reference
  timeKnown: false,
  latitude: 78.2232,
  longitude: 15.6267,
  houseSystem: "placidus"
});
const envelope = createNatalEnvelope(chart);
const parsed = parseNatalEnvelope(serializeNatalEnvelope(envelope));
if (parsed.ok) {
  const request = natalReplayInput(parsed.envelope);
  const diagnostic = redactNatalEnvelope(parsed.envelope);
  // request retains 08:30, unknown time, and the Placidus request.
  // diagnostic contains only the fixed redaction allowlist.
}
```

`createNatalEnvelope` accepts a fresh full `Chart`, plus optional `reference`,
`sourceInstant`, `localResolution`, `provenance`, and `extensions` context. A legacy
summary with ambiguous requested settings is not a supported creator input.
There is no migration of site account/storage v1, receipt backfill, hosted
execution, or proprietary-format importer in this change.

`parseNatalEnvelope` returns `{ ok: true, envelope }` or `{ ok: false, code }`.
Other operations throw `NatalEnvelopeError` with a fixed `code` and generic
message on rejection. Codes are `invalid_json`, `invalid_shape`, `invalid_value`,
`inconsistent_result`, `invalid_context`, `size_limit`, `complexity_limit`,
`unsupported_version`, and `unsupported_feature`. Error text does not echo input,
parser exceptions, or caller-supplied exception messages. Use the code for a safe
error presentation; do not log the rejected payload.

Serialization sorts object keys deterministically using code-unit ordering,
retains array order and finite number precision, and normalizes negative zero.
Pretty JSON is accepted, but serialization does not preserve whitespace or
arbitrary numeric spelling. This is not an adopted cross-language canonical JSON
or signing standard.

`natalReplayInput` returns the requested house system and recorded normalized
instant/reference semantics as a `BirthInput`, including time-known status,
coordinates when present, and input flags. It does not use the actual fallback
system as the request, re-resolve historical time, or automatically attach all
receipt context to a new result. To describe a recalculation as reproducible,
callers must independently verify matching trusted engine, artifact, ephemeris,
settings, and relevant runtime facts. Parsing a different engine version is not
proof of compatibility. No equality guarantee applies across versions or
runtimes; retain both receipts and report an unresolved comparison when matching
provenance cannot be established.

Full envelopes can contain sensitive birth instants, coordinates, and local-time
details. Keep raw fixtures synthetic and make export/storage decisions explicit.
`redactNatalEnvelope` constructs a fresh object containing only the fixed schema
`zodiacs.natal-diagnostic.draft-v1`, `status: "redacted-not-anonymous"`, `timeKnown`,
house-system/absence enums, and flag enums. It excludes all dates, offsets, zones,
coordinates, numeric results, extensions, arbitrary strings, and claimed versions,
hashes, or identifiers. This is redaction, not anonymity; even the remaining
categories can disclose context. No input hash or stable diagnostic identifier
is generated.

## Synthetic fixtures and round trips

The fixtures were generated through the current built public root and optional
receipt modules. They contain `provenance: null`; no source, artifact, runtime,
or ephemeris facts have been invented inside them.

| Fixture                                                             | Expected behavior                                                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Polar fallback](fixtures/natal-envelope-draft-v1-polar.json)       | Synthetic `2001-12-21T09:00:00Z` at latitude `78.2232`, longitude `15.6267`; requested Placidus, actual whole-sign, `polar-fallback`, ASC approximately `23.871984112302016` degrees. |
| [Unknown 08:30](fixtures/natal-envelope-draft-v1-unknown-0830.json) | Synthetic `2001-12-21T08:30:00Z` at the same coordinates; unknown time, `supplied-instant`, null angles/houses, `no-time`; no noon inference.                                         |

Both preserve captured `sourceInstant` spelling. Local wall-time resolution was
not performed for these inputs, so `localResolution` is `null`. The results are
examples and regression material, not independent astronomical reference values
or evidence of broad date-range accuracy.

With this source tree's current engine already built, run this bounded check from
the repository root on Node 22:

```sh
node --input-type=module <<'JS'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseNatalEnvelope,
  serializeNatalEnvelope,
  natalReplayInput
} from "./packages/engine/dist/receipt.js";

for (const name of ["polar", "unknown-0830"]) {
  const json = await readFile(
    `docs/platform/fixtures/natal-envelope-draft-v1-${name}.json`, "utf8"
  );
  const first = parseNatalEnvelope(json);
  assert.equal(first.ok, true);
  if (!first.ok) throw new Error("Synthetic fixture rejected");
  const second = parseNatalEnvelope(serializeNatalEnvelope(first.envelope));
  assert.deepEqual(second, first);
  assert.equal(natalReplayInput(first.envelope).houseSystem, "placidus");
  console.log(`${name}: round trip passed`);
}
JS
```

Integrators can test these synthetic round trips and report fixed error codes or
redacted diagnostics through the repository's existing issue process. Feedback,
human review, external interoperability testing, and release approval remain
separate gates; this document claims none of them as completed.
