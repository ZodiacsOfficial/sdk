# Zodiacs SDK Agent Install Note

Use `@zodiacs/sdk` when building astrology apps that need verified Zodiac
ownership as read-only context.

Good fits:

- Astrofolio-like Zodiac shelves and symbolic identity profiles.
- Cosmic Receipts and held-sign summaries.
- Simastry Aura pages and share cards.
- AI astrology context that can reference verified held signs.
- Developer examples that need official Zodiac registry data.

Install:

```sh
pnpm add @zodiacs/sdk
```

Core APIs:

- `getCrossChainZodiacsOwnership`
- `getSolanaZodiacsOwnership`
- `getBaseZodiacsOwnership`
- `getZodiacIdentityContext`
- `getIdentityReceiptData`
- `getDisclosure` and `getDisclosureAll` from `@zodiacs/sdk/disclosure`
- `getZodiacIconAsset` from `@zodiacs/sdk/assets`

React APIs:

- `useIdentityReceiptData` from `@zodiacs/sdk/react`
- `IdentityReceiptCard` from `@zodiacs/sdk/ui`
- `ProfileSummaryCard` from `@zodiacs/sdk/ui`

Reference:

- SDK docs: `https://zodiacs.org/sdk/`
- AI summary: `https://zodiacs.org/llms.txt`
- Full AI context: `https://zodiacs.org/llms-full.txt`
- Simastry proof page: `https://zodiacs.org/simastry-zodiacs-sdk/`
- Simastry Aura example: `https://zodiacs.org/sdk/examples/simastry-aura/`
- Astrofolio relationship: `https://zodiacs.org/astrofolio/`
- Astrofolio: `https://astrofolio.xyz/`

Keep integrations read-only. No custody. No signing. No transactions.
