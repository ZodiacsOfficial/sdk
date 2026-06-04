# React Hooks Guide

React hooks are optional and SSR-safe. They require clients and owners as parameters and do not create wallet
clients or request signatures.

```tsx
import { useBaseZodiacsOwnership, useZodiacIdentityContext } from "@zodiacs/sdk/react";

export function ReadOnlyProfile({ publicClient, address }) {
  const ownership = useBaseZodiacsOwnership(publicClient, address, { blockTag: "safe" });
  const context = useZodiacIdentityContext(ownership.data ?? { holdings: [] });

  return <pre>{JSON.stringify({ loading: ownership.loading, context }, null, 2)}</pre>;
}
```

Async hooks expose `{ data, error, loading, refetch }`.

Pure hooks:

- `useZodiacIdentityContext`
- `useIdentityReceiptData`
- `useZodiacWheelData`
- `useCompatibilityContext`
- `useCurrentZodiacSeason`
