# Migration Notes

Existing Solana read APIs remain available:

- `getZodiacBalance`
- `getZodiacsOwnership`
- `getHeldZodiacs`
- `useZodiacBalance` from `@zodiacs/sdk/react`
- `useZodiacMarket` from `@zodiacs/sdk/react`
- `useZodiacToken` from `@zodiacs/sdk/react`

These compatibility helpers continue to read native Solana SPL assets.

The root `@zodiacs/sdk` entry point is now React-free. React hooks should be
imported from `@zodiacs/sdk/react`; UI components should be imported from
`@zodiacs/sdk/ui`.

New integrations should prefer explicit names:

- `getSolanaZodiacBalance`
- `getSolanaZodiacsOwnership`
- `getBaseZodiacBalance`
- `getBaseZodiacsOwnership`
- `getCrossChainZodiacsOwnership`

The key model change is that the SDK now exposes a canonical multi-chain
registry. Solana SPL mints are the native originals. Base ERC-20 addresses are
official bridged representations that point back to the Solana mint for the
same sign.
