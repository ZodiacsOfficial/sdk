# Native iOS Integration Guide

Native iOS apps should consume Zodiacs through a small read-only backend API
that imports `@zodiacs/sdk`. Swift and SwiftUI code should call that backend
over HTTPS and should not import the TypeScript SDK directly.

Wallet context is optional. A public address can add optional symbolic context
when verified zodiac holdings appear in the official registry. Wallet ownership
must not control paid digital features or core app access through this SDK.

## Architecture

```txt
Native SwiftUI app
-> Swift protocols
-> read-only backend API
-> @zodiacs/sdk on server
-> public Solana/Base reads
-> normalized JSON response
```

The backend accepts public addresses only. It never accepts wallet secrets,
never creates wallet clients, never signs messages, and never submits
transactions.

## Product Rules

- No wallet required.
- Wallet context disabled by default.
- Public ownership context is optional symbolic context.
- Wallet ownership must not control paid digital features or readings.
- No valuation, exchange, performance, or asset-acquisition flows.
- No wallet secrets, signatures, approvals, asset movement, custody, or on-chain
  action helpers.
- Treat Zodiacs as cultural assets and symbolic identity context.

## Recommended Swift Protocols

```swift
public protocol WalletReadOnlyProvider {
    var publicAddress: String? { get }
    var chain: String? { get }
}

public protocol ZodiacsIdentityProvider {
    func fetchZodiacsContext(
        wallet: WalletReadOnlyProvider?
    ) async throws -> ZodiacsContextResponse
}

public protocol ZodiacsReadOnlyAPIClient {
    func signs() async throws -> [ZodiacSign]
    func solanaOwnership(address: String) async throws -> ZodiacsOwnership
    func baseOwnership(address: String) async throws -> ZodiacsOwnership
    func context(request: ZodiacsContextRequest) async throws -> ZodiacsContextResponse
}
```

## Minimal Models

```swift
public struct ZodiacsContextResponse: Decodable, Sendable {
    public let readOnly: Bool
    public let walletRequired: Bool
    public let headline: String
    public let description: String
    public let verifiedZodiacHoldings: [String]
    public let optionalContextFacts: [ZodiacFact]
}

public struct ZodiacFact: Decodable, Sendable {
    public let label: String
    public let value: String
}
```

## Backend SDK Usage

```ts
import { getBaseZodiacsOwnership } from "@zodiacs/sdk/base";
import { getConsumerSafeWalletContext } from "@zodiacs/sdk/identity";
import { getSolanaZodiacsOwnership } from "@zodiacs/sdk/solana";

const solana = solanaAddress
  ? await getSolanaZodiacsOwnership(solanaConnection, solanaAddress)
  : undefined;
const base = baseAddress ? await getBaseZodiacsOwnership(basePublicClient, baseAddress) : undefined;

return getConsumerSafeWalletContext(
  { solana, base },
  {
    publicAddress: baseAddress ?? solanaAddress
  }
);
```

## App Review Notes

Viewing publicly owned cultural assets can be framed as identity/profile
context. Keep wallet ownership optional, read-only, and separate from paid
digital access. Keep exchange, custody, asset movement, and crypto-incentive
flows outside SDK-backed experiences.
