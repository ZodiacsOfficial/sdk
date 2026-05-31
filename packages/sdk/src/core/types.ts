export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces"
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export type ZodiacElement = "fire" | "earth" | "air" | "water";

export type ZodiacModality = "cardinal" | "fixed" | "mutable";

export type ZodiacChain = "solana" | "base";

export type ZodiacRepresentationKind = "native" | "bridged";

export type ZodiacTokenStandard = "SPL" | "ERC20";

export interface ZodiacBridgeMetadata {
  readonly status: "official-bridged";
  readonly protocol?: "wormhole";
  readonly sourceChain: "solana";
  readonly destinationChain: "base";
  readonly notes?: string;
}

export interface ZodiacRepresentation {
  readonly sign: ZodiacSign;
  readonly chain: ZodiacChain;
  readonly chainId?: number;
  readonly kind: ZodiacRepresentationKind;
  readonly tokenStandard: ZodiacTokenStandard;
  readonly address: string;
  readonly decimals?: number;
  readonly symbol?: string;
  readonly name?: string;
  readonly isCanonicalOrigin: boolean;
  readonly isOfficialRepresentation: boolean;
  readonly originChain?: "solana";
  readonly originAddress?: string;
  readonly bridge?: ZodiacBridgeMetadata;
}

export interface ZodiacAssetMetadata {
  readonly element: ZodiacElement;
  readonly modality: ZodiacModality;
  readonly rulingPlanet: string;
  readonly archetype: string;
  readonly dateRange: string;
  readonly shortBio?: string;
}

export interface ZodiacAsset {
  readonly sign: ZodiacSign;
  readonly displayName: string;
  readonly metadata: ZodiacAssetMetadata;
  readonly native: ZodiacRepresentation;
  readonly representations: readonly ZodiacRepresentation[];
}

export interface ZodiacsSupportedChain {
  readonly chain: ZodiacChain;
  readonly chainId?: number;
  readonly kind: ZodiacRepresentationKind;
  readonly tokenStandard: ZodiacTokenStandard;
}

export interface ZodiacsRegistry {
  readonly name: "Zodiacs Official Registry";
  readonly source: "https://zodiacs.org";
  readonly sdk: "@zodiacs/sdk";
  readonly version: string;
  readonly nativeChain: "solana";
  readonly supportedChains: readonly ZodiacsSupportedChain[];
  readonly assets: readonly ZodiacAsset[];
}

export interface ZodiacMarketLinks {
  readonly dexScreener: string;
  readonly jupiter: string;
}

export interface ZodiacDateRange {
  readonly starts: string;
  readonly ends: string;
}

export interface ZodiacMetadata {
  readonly sign: ZodiacSign;
  readonly name: string;
  readonly glyph: string;
  readonly element: ZodiacElement;
  readonly modality: ZodiacModality;
  readonly dateRange: ZodiacDateRange;
  readonly assetLine: string;
}

export interface ZodiacToken {
  readonly sign: ZodiacSign;
  readonly name: string;
  readonly slug: ZodiacSign;
  readonly ticker: string;
  readonly order: number;
  readonly element: ZodiacElement;
  readonly modality: ZodiacModality;
  readonly rulingPlanet: string;
  readonly symbol: string;
  readonly archetype: string;
  readonly shortBio: string;
  readonly decimals: number;
  readonly mintAddress: string;
  readonly marketLinks: ZodiacMarketLinks;
  readonly metadataUri?: string;
  readonly imageUri?: string;
}

export type ZodiacTokenRegistry = ReadonlyMap<ZodiacSign, ZodiacToken>;

export interface ZodiacRegistryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export type ConnectionOrRpcUrl = string | SolanaBalanceConnection;

export interface ParsedTokenAccountAmount {
  readonly amount: string;
  readonly decimals: number;
  readonly uiAmount?: number | null;
  readonly uiAmountString?: string;
}

export interface ParsedTokenAccountResponse {
  readonly value: readonly {
    readonly account: {
      readonly data: {
        readonly parsed?: {
          readonly info?: {
            readonly tokenAmount?: ParsedTokenAccountAmount;
          };
        };
      };
    };
  }[];
}

export interface SolanaBalanceConnection {
  readonly getParsedTokenAccountsByOwner: (
    ownerAddress: unknown,
    filter: { readonly mint: unknown }
  ) => Promise<ParsedTokenAccountResponse>;
}

export interface TokenBalance {
  readonly ownerAddress: string;
  readonly mintAddress: string;
  readonly amountRaw: string;
  readonly decimals: number;
  readonly uiAmount: number | null;
}

export type ZodiacBalanceReadStatus = "ok" | "zero" | "unavailable";

export interface ZodiacBalanceError {
  readonly code: "rpc-error" | "invalid-rpc-response";
  readonly message: string;
}

export interface ZodiacBalance {
  readonly sign: ZodiacSign;
  readonly token: ZodiacToken;
  readonly representation: ZodiacRepresentation;
  readonly chain: "solana";
  readonly kind: "native";
  readonly tokenStandard: "SPL";
  readonly walletAddress: string;
  readonly mintAddress: string;
  readonly rawAmount: string;
  readonly decimals: number;
  readonly uiAmount: number;
  readonly uiAmountString: string;
  readonly status: ZodiacBalanceReadStatus;
  readonly error?: ZodiacBalanceError;
}

export interface ZodiacsHolding {
  readonly sign: ZodiacSign;
  readonly token: ZodiacToken;
  readonly balance: ZodiacBalance;
  readonly held: boolean;
}

export type ZodiacsOwnershipStatus = "available" | "partial" | "unavailable";

export interface ZodiacsOwnership {
  readonly walletAddress: string;
  readonly chain?: "solana";
  readonly status: ZodiacsOwnershipStatus;
  readonly holdings: readonly ZodiacsHolding[];
  readonly heldSigns: readonly ZodiacSign[];
  readonly totalHeld: number;
  readonly errors: readonly ZodiacBalanceError[];
}

export interface ReadonlyZodiacBalanceReader {
  readonly getTokenBalance: (
    ownerAddress: string,
    mintAddress: string,
    token: ZodiacToken
  ) => Promise<TokenBalance | null>;
}

export type ZodiacBalanceStatus = "available" | "missing-mint" | "not-found" | "unavailable";

export interface ZodiacBalanceResult {
  readonly sign: ZodiacSign;
  readonly token: ZodiacToken;
  readonly balance: TokenBalance | null;
  readonly status: ZodiacBalanceStatus;
  readonly reason?: string;
}

export interface ReadZodiacBalanceOptions {
  readonly ownerAddress: string;
  readonly sign: ZodiacSign;
  readonly reader: ReadonlyZodiacBalanceReader;
  readonly registry?: ZodiacTokenRegistry;
}

export interface ReadZodiacsBalancesOptions {
  readonly ownerAddress: string;
  readonly reader: ReadonlyZodiacBalanceReader;
  readonly registry?: ZodiacTokenRegistry;
}

export interface ZodiacSerializableError {
  readonly code: string;
  readonly message: string;
}

export interface BaseZodiacBalance {
  readonly sign: ZodiacSign;
  readonly ownerAddress: string;
  readonly representation: ZodiacRepresentation;
  readonly chain: "base";
  readonly kind: "bridged";
  readonly tokenStandard: "ERC20";
  readonly rawAmount: string;
  readonly uiAmountString: string;
  readonly decimals: number;
  readonly status: ZodiacBalanceReadStatus;
  readonly error?: ZodiacSerializableError;
}

export interface BaseZodiacsHolding {
  readonly sign: ZodiacSign;
  readonly representation: ZodiacRepresentation;
  readonly balance: BaseZodiacBalance;
  readonly held: boolean;
}

export interface BaseZodiacsOwnership {
  readonly ownerAddress: string;
  readonly chain: "base";
  readonly status: ZodiacsOwnershipStatus;
  readonly holdings: readonly BaseZodiacsHolding[];
  readonly heldSigns: readonly ZodiacSign[];
  readonly totalHeld: number;
  readonly errors: readonly ZodiacSerializableError[];
}

export interface CrossChainZodiacsOwnership {
  readonly solana?: ZodiacsOwnership;
  readonly base?: BaseZodiacsOwnership;
}

export interface UnifiedZodiacShelfItem {
  readonly sign: ZodiacSign;
  readonly held: boolean;
  readonly nativeHeld: boolean;
  readonly bridgedHeld: boolean;
  readonly representations: readonly ZodiacRepresentation[];
}

export interface UnifiedZodiacShelf {
  readonly label: "combined wallet holdings across official representations";
  readonly items: readonly UnifiedZodiacShelfItem[];
  readonly heldSigns: readonly ZodiacSign[];
  readonly totalHeld: number;
}

export type ZodiacComposition = Record<ZodiacElement | ZodiacModality, number>;

export interface ZodiacSeason {
  readonly sign: ZodiacSign;
  readonly displayName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
}

export interface ZodiacSeasonProgress extends ZodiacSeason {
  readonly progress: number;
}

export interface ZodiacIdentityAlignmentInput {
  readonly sunSign?: ZodiacSign;
  readonly moonSign?: ZodiacSign;
  readonly risingSign?: ZodiacSign;
}

export interface ZodiacIdentityAlignment {
  readonly placement: "sun" | "moon" | "rising";
  readonly sign: ZodiacSign;
  readonly held: boolean;
}

export interface ZodiacNativeBridgedSummary {
  readonly nativeHeld: number;
  readonly bridgedHeld: number;
  readonly combinedHeld: number;
  readonly heldSigns: readonly ZodiacSign[];
}

export interface ZodiacIdentityContext {
  readonly heldSigns: readonly ZodiacSign[];
  readonly missingSigns: readonly ZodiacSign[];
  readonly totalHeld: number;
  readonly wheelCoverage: number;
  readonly elementComposition: Record<ZodiacElement, number>;
  readonly modalityComposition: Record<ZodiacModality, number>;
  readonly currentSeason: ZodiacSeason;
  readonly currentSeasonHeld: boolean;
  readonly nativeBridgedSummary?: ZodiacNativeBridgedSummary;
  readonly alignments: readonly ZodiacIdentityAlignment[];
}

export interface CosmicReceiptData extends ZodiacIdentityContext {
  readonly label: string;
  readonly wheelState: readonly {
    readonly sign: ZodiacSign;
    readonly held: boolean;
  }[];
}
