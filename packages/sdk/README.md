# Zodiacs SDK

Official read-only TypeScript SDK for the canonical Zodiacs.org registry,
native Solana SPL Zodiacs assets, and official bridged Base ERC-20
representations.

```sh
pnpm add @zodiacs/sdk
```

## Entry Points

The package ships granular entry points. The root, core, and market entry
points do not require React:

- `@zodiacs/sdk` — registry, reads, identity, and market adapters (no React)
- `@zodiacs/sdk/core` — registry, verification, balances, identity (no React)
- `@zodiacs/sdk/market` — optional market adapters (no React)
- `@zodiacs/sdk/react` — React hooks and `ZodiacsProvider`
- `@zodiacs/sdk/ui` — React UI components

`react` is an optional peer dependency that is required only when importing
`@zodiacs/sdk/react` or `@zodiacs/sdk/ui`.

```ts
import {
  getRepresentationByAddress,
  getSolanaZodiacRepresentation,
  getBaseZodiacRepresentation
} from "@zodiacs/sdk";

const representation = getRepresentationByAddress(
  "0x3ffB5282F5891Dd8c813E64059EdB0607537eC91"
);

console.log(representation?.kind); // "bridged"
console.log(getSolanaZodiacRepresentation("aries").chain); // "solana"
console.log(getBaseZodiacRepresentation("aries").originChain); // "solana"
```

Identity context helpers provide computed symbolic context from registry
metadata and public ownership state:

```ts
import { getCurrentZodiacSeason, getZodiacIdentityContext } from "@zodiacs/sdk";

const season = getCurrentZodiacSeason();
const context = getZodiacIdentityContext(ownership, {
  sunSign: "aries"
});

console.log(season.displayName);
console.log(context.heldSigns);
console.log(context.currentSeasonHeld);
```

The SDK is read-only. It provides registry verification, public balance reads,
metadata, computed symbolic context, React hooks, and UI components. It does
not request private keys, sign messages, submit transactions, provide custody,
or provide transaction approval helpers. It does not generate horoscopes or
recommend asset acquisition, disposal, exchange, or retention.

Formatting helpers preserve raw-token precision. `formatTokenAmount` truncates
when `maximumFractionDigits` is set unless `roundingMode: "round"` is passed.

Always verify official addresses against the published Zodiacs.org registry.
The SDK exposes the official registry for apps and clients, but downstream
interfaces should display chain and representation provenance clearly.
