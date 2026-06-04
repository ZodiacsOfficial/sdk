# Base Integration Guide

Base helpers read official bridged Zodiacs ERC-20 balances on Base mainnet. They use a viem-compatible
public client and never create wallet clients.

```ts
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org")
});

const ownership = await getBaseZodiacsOwnership(
  publicClient,
  "0x1111111111111111111111111111111111111111",
  {
    blockTag: "safe",
    onPartialFailure: "warn"
  }
);
```

The ownership reader batches `balanceOf` reads with `readContracts` when available and caches token decimals
per client, chain, and token address. It returns held signs, confirmed absent signs, per-sign balances, checked time,
representations, errors, warnings, and block number when available.

Wallet connection, Base Account, Builder Codes, transaction attribution, and notifications belong in app code
or examples, not SDK core.
