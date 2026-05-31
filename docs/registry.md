# Official Zodiacs.org Registry

The Zodiacs SDK exposes the official Zodiacs.org registry as neutral
infrastructure for downstream apps, clients, interfaces, and integrators.

The registry models one canonical asset universe:

- each sign is one asset identity
- each sign has one native Solana SPL mint
- each sign has one official bridged Base ERC-20 representation
- every Base representation points back to its Solana origin

The registry does not claim ownership over astrology, zodiac signs, or zodiac
glyphs. It identifies the official Zodiacs.org representations so apps can
verify addresses and render official cultural asset metadata safely.

Always verify official addresses against the published Zodiacs.org registry.
The SDK exposes the official registry for apps and clients, but downstream
interfaces should display chain and representation provenance clearly.

Machine-readable artifact:

```txt
packages/sdk/registry/zodiacs.registry.json
```

Primary helpers:

- `getZodiacsRegistry`
- `getZodiacAsset`
- `getRepresentationByAddress`
- `isOfficialZodiacAddress`
- `getNativeCounterpart`
- `getBridgedCounterpart`

## Identity Context

The registry also supports deterministic identity context for downstream apps.
Helpers such as `getCurrentZodiacSeason`, `getZodiacIdentityContext`, and
`getCosmicReceiptData` combine official sign metadata with public ownership
state to produce display-ready facts: held signs, missing signs, element mix,
modality mix, seasonal context, wheel coverage, and native/bridged summaries
when cross-chain ownership is supplied.

These helpers do not generate horoscopes or recommend asset acquisition,
disposal, exchange, or retention. They are read-only building blocks for
profiles, receipts, seasonal experiences, and other identity surfaces.
