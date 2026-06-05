# Solana Integration Guide

Solana helpers read native SPL Zodiacs mints. Ownership reads use one wallet-level token account query where
possible, then map token accounts back to the official registry mints.

```ts
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";

const ownership = await getSolanaZodiacsOwnership(
  "https://api.mainnet-beta.solana.com",
  "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ"
);
```

Single-sign compatibility helpers such as `getZodiacBalance` remain available
and read by mint. Ownership helpers avoid one RPC call per sign by querying SPL
token accounts by owner and token program. Unknown token accounts are ignored;
malformed official token accounts become typed unavailable balances. Apps that
already use Solana client libraries may pass any compatible read-only connection
object with `getParsedTokenAccountsByOwner`.
