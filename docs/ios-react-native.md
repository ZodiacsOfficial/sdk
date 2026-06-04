# iOS and React Native Guide

Zodiacs SDK is safe to use as a read-only identity and registry layer in mobile apps. Keep wallet
connection, signing, transaction submission, swaps, rewards, and custody outside the core SDK.

## Recommended Architecture

### A. React Native / Expo First

Use React Native or Expo for the first iOS experience when you want to share TypeScript models with web.

```ts
import { getIdentityReceiptData, getZodiacIdentityContext } from "@zodiacs/sdk/core";
import { createMockOwnership } from "@zodiacs/sdk/testing";

const ownership = createMockOwnership({ heldSigns: ["aries", "gemini"] });
const context = getZodiacIdentityContext(ownership);
const receipt = getIdentityReceiptData(ownership);
```

For production reads, prefer a small backend API that performs Base and Solana RPC calls server-side, then
returns JSON to the app. This avoids shipping RPC-provider details in the mobile binary and makes caching,
rate limiting, and abuse handling easier.

### B. Native Swift App With Backend JSON

For a later native Swift app, expose a compact JSON API from a TypeScript/Node service:

- Swift calls HTTPS endpoints.
- Backend uses `@zodiacs/sdk/base`, `@zodiacs/sdk/solana`, and `@zodiacs/sdk/core`.
- Swift renders typed JSON into native views.
- Wallet signing and transaction flows remain separate app-layer integrations.

### C. PWA / WKWebView Wrapper

A PWA or WKWebView wrapper can work for a low-priority path, but use it only when the product can tolerate
web-view constraints and App Store review expectations. Do not use a wrapper to bypass platform policy.

## Minimal JSON API

Example route shape:

```txt
GET /api/zodiacs/base/:address
GET /api/zodiacs/solana/:address
GET /api/zodiacs/context?baseAddress=&solanaAddress=
```

Example Next.js route for Base:

```ts
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { getZodiacIdentityContext } from "@zodiacs/sdk/core";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL)
});

export async function GET(_request: Request, context: { params: Promise<{ address: string }> }) {
  const { address } = await context.params;
  const ownership = await getBaseZodiacsOwnership(publicClient, address, {
    blockTag: "safe",
    onPartialFailure: "warn"
  });

  return Response.json({
    ownership,
    identity: getZodiacIdentityContext(ownership)
  });
}
```

Example Solana route:

```ts
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";
import { Connection } from "@solana/web3.js";

const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");

export async function GET(_request: Request, context: { params: Promise<{ address: string }> }) {
  const { address } = await context.params;
  return Response.json(await getSolanaZodiacsOwnership(connection, address));
}
```

Example combined context route:

```ts
import {
  getCrossChainZodiacsOwnership,
  getZodiacIdentityContext,
  getIdentityReceiptData
} from "@zodiacs/sdk/core";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseAddress = url.searchParams.get("baseAddress");
  const solanaAddress = url.searchParams.get("solanaAddress");

  const ownership = await getCrossChainZodiacsOwnership({
    ...(baseAddress ? { base: { publicClient, ownerAddress: baseAddress } } : {}),
    ...(solanaAddress ? { solana: { connection, ownerAddress: solanaAddress } } : {})
  });

  return Response.json({
    ownership,
    identity: getZodiacIdentityContext(ownership),
    receipt: getIdentityReceiptData(ownership)
  });
}
```

## App Store-Safe Product Guidance

- Viewing owned Zodiacs as identity, profile, provenance, public collection, or share-card context is the
  intended SDK use.
- Do not use token ownership to unlock paid digital features unless your app’s in-app purchase and external
  purchase flows comply with App Store rules.
- Avoid in-app asset exchange, trading, securities, derivatives, or custody flows unless the app is properly
  licensed, region-scoped, and reviewed for that purpose.
- Do not incentivize users with crypto or tokens for app downloads, invites, social posting, or similar tasks.
- Clearly label Solana-native assets and Base-bridged official representations.
- Do not imply unofficial assets are official.

## Guardrails

The SDK is for recognition, verification, public reads, metadata, and identity context. It is not financial
advice, not a wallet SDK, not a trading SDK, and not a custody product. It does not sign messages, request
private keys, approve transfers, submit transactions, exchange assets, trade, or move assets.
