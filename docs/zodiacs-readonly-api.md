# Zodiacs Read-Only API Contract

Native iOS apps should consume Zodiacs through a small read-only backend that
uses `@zodiacs/sdk`. A SwiftUI app should not import the TypeScript SDK
directly. The backend accepts public addresses only and returns registry,
ownership, and optional symbolic identity context.

The API never accepts private keys, seed phrases, wallet secrets, signatures,
or transaction payloads. It never signs messages, submits transactions, moves
assets, returns valuation data, or returns holdings-value data.

## GET /v1/zodiacs/signs

Returns the official registry signs and their canonical Solana-native and
Base-bridged representations.

```json
{
  "registryVersion": "0.2.0",
  "signs": [
    {
      "sign": "aries",
      "displayName": "Aries",
      "element": "fire",
      "modality": "cardinal",
      "representations": [
        { "chain": "solana", "kind": "native", "address": "..." },
        { "chain": "base", "kind": "bridged", "address": "...", "originChain": "solana" }
      ]
    }
  ]
}
```

## GET /v1/zodiacs/solana/:address

Reads public Solana SPL token accounts for a wallet address and maps official
Zodiacs mints through the registry.

```json
{
  "walletAddress": "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ",
  "chain": "solana",
  "heldSigns": ["aries"],
  "totalHeld": 1,
  "errors": []
}
```

## GET /v1/zodiacs/base/:address

Reads public Base ERC-20 balances for official bridged Zodiacs
representations. Implementations should use a viem public client and batched
reads when available.

```json
{
  "owner": "0x1111111111111111111111111111111111111111",
  "ownerAddress": "0x1111111111111111111111111111111111111111",
  "chain": "base",
  "heldSigns": ["taurus"],
  "balancesBySign": {},
  "errors": [],
  "warnings": []
}
```

## POST /v1/zodiacs/context

Combines optional public Solana and Base ownership reads and returns
display-ready identity context.

Request:

```json
{
  "solanaAddress": "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ",
  "baseAddress": "0x1111111111111111111111111111111111111111"
}
```

Response:

```json
{
  "heldSigns": ["aries", "taurus"],
  "wheelCoverage": 16.67,
  "currentSeasonHeld": true,
  "receiptFacts": [{ "label": "Verified zodiac holdings", "value": "2" }],
  "consumerSafe": {
    "readOnly": true,
    "walletRequired": false,
    "headline": "Optional Zodiacs context"
  }
}
```

## Backend Rules

- Accept public addresses only.
- Validate addresses before RPC reads.
- Use `getSolanaZodiacsOwnership` for Solana.
- Use `getBaseZodiacsOwnership` for Base.
- Use `getZodiacIdentityContext` or `getConsumerSafeWalletContext` for display
  context.
- Return provenance labels for Solana-native and Base-bridged representations.
- Do not accept private keys, seed phrases, signatures, or transaction data.
- Do not sign, approve, submit, exchange, transfer, or custody assets.
- Do not return valuation, performance, capitalization, or holdings-value data.
