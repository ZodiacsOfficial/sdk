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
            readonly mint?: string;
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
    filter: { readonly mint: unknown } | { readonly programId: unknown }
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
  readonly owner?: string;
  readonly walletAddress: string;
  readonly chain?: "solana";
  readonly checkedAt?: string;
  readonly status: ZodiacsOwnershipStatus;
  readonly holdings: readonly ZodiacsHolding[];
  readonly heldSigns: readonly ZodiacSign[];
  readonly zeroBalanceSigns?: readonly ZodiacSign[];
  readonly balancesBySign?: Readonly<Record<ZodiacSign, ZodiacBalance>>;
  readonly representations?: readonly ZodiacRepresentation[];
  readonly totalHeld: number;
  readonly errors: readonly ZodiacBalanceError[];
  readonly warnings?: readonly ZodiacSerializableError[];
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
  readonly warning?: ZodiacSerializableError;
}

export interface BaseZodiacsHolding {
  readonly sign: ZodiacSign;
  readonly representation: ZodiacRepresentation;
  readonly balance: BaseZodiacBalance;
  readonly held: boolean;
}

export interface BaseZodiacsOwnership {
  readonly owner: string;
  readonly ownerAddress: string;
  readonly chain: "base";
  readonly checkedAt?: string;
  readonly blockNumber?: bigint;
  readonly status: ZodiacsOwnershipStatus;
  readonly holdings: readonly BaseZodiacsHolding[];
  readonly heldSigns: readonly ZodiacSign[];
  readonly zeroBalanceSigns?: readonly ZodiacSign[];
  readonly confirmedAbsentSigns?: readonly ZodiacSign[];
  /** @deprecated Use confirmedAbsentSigns for neutral display language. */
  readonly missingSigns?: readonly ZodiacSign[];
  readonly balancesBySign?: Readonly<Record<ZodiacSign, BaseZodiacBalance>>;
  readonly representations?: readonly ZodiacRepresentation[];
  readonly totalHeld: number;
  readonly errors: readonly ZodiacSerializableError[];
  readonly warnings?: readonly ZodiacSerializableError[];
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

export interface ZodiacReceiptFact {
  readonly label: string;
  readonly value: string;
}

export interface ZodiacWheelDataItem {
  readonly sign: ZodiacSign;
  readonly displayName: string;
  readonly glyph?: string;
  readonly held: boolean;
  readonly nativeHeld: boolean;
  readonly bridgedHeld: boolean;
  readonly element: ZodiacElement;
  readonly modality: ZodiacModality;
}

export interface ZodiacWheelData {
  readonly items: readonly ZodiacWheelDataItem[];
  readonly heldSigns: readonly ZodiacSign[];
  readonly confirmedAbsentSigns: readonly ZodiacSign[];
  /** @deprecated Use confirmedAbsentSigns for neutral display language. */
  readonly missingSigns: readonly ZodiacSign[];
  readonly coverage: number;
  readonly totalUniqueSigns: number;
}

export interface ZodiacSeasonalContext {
  readonly currentSeason: ZodiacSeason;
  readonly nextSeason: ZodiacSeason;
  readonly currentSeasonHeld: boolean;
  readonly seasonSign: ZodiacSign;
  readonly seasonDisplayName: string;
  readonly heldSigns: readonly ZodiacSign[];
}

export interface ZodiacCompatibilityContext {
  readonly firstHeldSigns: readonly ZodiacSign[];
  readonly secondHeldSigns: readonly ZodiacSign[];
  readonly sharedSigns: readonly ZodiacSign[];
  readonly firstOnlySigns: readonly ZodiacSign[];
  readonly secondOnlySigns: readonly ZodiacSign[];
  readonly overlapCount: number;
  readonly overlapPercentage: number;
  readonly combinedUniqueSigns: readonly ZodiacSign[];
  readonly combinedCoverage: number;
  readonly sharedElements: readonly ZodiacElement[];
  readonly sharedModalities: readonly ZodiacModality[];
  readonly shareTitle: string;
  readonly shareDescription: string;
}

export interface ZodiacShareCardContext {
  readonly title: string;
  readonly description: string;
  readonly heldSigns: readonly ZodiacSign[];
  readonly wheelCoverage: number;
  readonly currentSeason: ZodiacSeason;
  readonly currentSeasonHeld: boolean;
  readonly facts: readonly ZodiacReceiptFact[];
}

export interface ConsumerSafeWalletContext {
  readonly connectedWalletLabel: string;
  readonly readOnly: true;
  readonly walletRequired: false;
  readonly publicAddress?: string;
  readonly verifiedZodiacHoldings: readonly ZodiacSign[];
  readonly currentSeason: ZodiacSeason;
  readonly currentSeasonAppearsInWallet: boolean;
  readonly optionalContextFacts: readonly ZodiacReceiptFact[];
  readonly headline: string;
  readonly description: string;
  readonly emptyState: string;
  readonly provenanceNote: string;
  readonly safetyNote: string;
}

export interface ZodiacIdentityContext {
  readonly heldSigns: readonly ZodiacSign[];
  readonly confirmedAbsentSigns: readonly ZodiacSign[];
  /** @deprecated Use confirmedAbsentSigns for neutral display language. */
  readonly missingSigns: readonly ZodiacSign[];
  readonly totalHeld: number;
  readonly wheelCoverage: number;
  readonly elementComposition: Record<ZodiacElement, number>;
  readonly modalityComposition: Record<ZodiacModality, number>;
  readonly nativeCount: number;
  readonly bridgedCount: number;
  readonly totalUniqueSigns: number;
  readonly currentSeason: ZodiacSeason;
  readonly currentSeasonHeld: boolean;
  readonly dominantElement: ZodiacElement | null;
  readonly dominantModality: ZodiacModality | null;
  readonly shareTitle: string;
  readonly shareDescription: string;
  readonly receiptFacts: readonly ZodiacReceiptFact[];
  readonly nativeBridgedSummary?: ZodiacNativeBridgedSummary;
  readonly alignments: readonly ZodiacIdentityAlignment[];
}

export interface IdentityReceiptData extends ZodiacIdentityContext {
  readonly label: string;
  readonly wheelState: readonly {
    readonly sign: ZodiacSign;
    readonly held: boolean;
  }[];
}
