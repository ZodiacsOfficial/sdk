import { getZodiacAsset } from "./official-registry.js";
import { getCurrentZodiacSeason, getNextZodiacSeason } from "./season.js";
import {
  ZODIAC_SIGNS,
  type BaseZodiacsOwnership,
  type ZodiacCompatibilityContext,
  type IdentityReceiptData,
  type CrossChainZodiacsOwnership,
  type UnifiedZodiacShelf,
  type ZodiacElement,
  type ZodiacIdentityAlignment,
  type ZodiacIdentityAlignmentInput,
  type ZodiacIdentityContext,
  type ZodiacModality,
  type ZodiacNativeBridgedSummary,
  type ZodiacReceiptFact,
  type ZodiacSeasonalContext,
  type ZodiacShareCardContext,
  type ZodiacSign,
  type ZodiacWheelData,
  type ZodiacsOwnership,
  type ConsumerSafeWalletContext
} from "./types.js";

interface HoldingLike {
  readonly sign: ZodiacSign;
  readonly held: boolean;
  readonly representation?: {
    readonly chain?: "solana" | "base";
    readonly kind?: "native" | "bridged";
  };
  readonly balance?: {
    readonly chain?: "solana" | "base";
    readonly kind?: "native" | "bridged";
  };
}

interface OwnershipLike {
  readonly holdings: readonly HoldingLike[];
  readonly zeroBalanceSigns?: readonly ZodiacSign[];
  readonly unavailableSigns?: readonly ZodiacSign[];
  readonly confirmedAbsentSigns?: readonly ZodiacSign[];
}

export type ZodiacIdentityOwnershipInput = OwnershipLike | CrossChainZodiacsOwnership;

export interface ZodiacIdentityContextOptions extends ZodiacIdentityAlignmentInput {
  readonly date?: Date;
}

export interface IdentityReceiptDataOptions extends ZodiacIdentityContextOptions {
  readonly label?: string;
}

export interface ConsumerSafeWalletContextOptions extends ZodiacIdentityContextOptions {
  readonly publicAddress?: string;
}

export function getZodiacShelf<T extends OwnershipLike>(ownership: T): readonly HoldingLike[] {
  return ownership.holdings.filter((holding) => holding.held);
}

export function getElementComposition(ownership: OwnershipLike): Record<ZodiacElement, number> {
  return getComposition(toUniqueOwnershipLike(ownership), "element");
}

export function getModalityComposition(ownership: OwnershipLike): Record<ZodiacModality, number> {
  return getComposition(toUniqueOwnershipLike(ownership), "modality");
}

export function getDominantElement(ownership: OwnershipLike): ZodiacElement | null {
  return getDominantCompositionKey(getElementComposition(ownership));
}

export function getDominantModality(ownership: OwnershipLike): ZodiacModality | null {
  return getDominantCompositionKey(getModalityComposition(ownership));
}

export function getTotalHeld(ownership: OwnershipLike): number {
  return getZodiacShelf(ownership).length;
}

export function getHeldElements(ownership: OwnershipLike): readonly ZodiacElement[] {
  return unique(
    getZodiacShelf(ownership).map((holding) => getZodiacAsset(holding.sign).metadata.element)
  );
}

export function getHeldModalities(ownership: OwnershipLike): readonly ZodiacModality[] {
  return unique(
    getZodiacShelf(ownership).map((holding) => getZodiacAsset(holding.sign).metadata.modality)
  );
}

export function getOwnSignStatus(
  ownership: OwnershipLike,
  sunSign: ZodiacSign
): {
  readonly sign: ZodiacSign;
  readonly held: boolean;
  readonly label: "held" | "not-held";
} {
  const held = ownership.holdings.some((holding) => holding.sign === sunSign && holding.held);
  return {
    sign: sunSign,
    held,
    label: held ? "held" : "not-held"
  };
}

export function getZodiacWheelState(ownership: OwnershipLike): readonly {
  readonly sign: ZodiacSign;
  readonly held: boolean;
}[] {
  const heldSigns = getHeldSigns(ownership);

  return ZODIAC_SIGNS.map((sign) => ({
    sign,
    held: heldSigns.includes(sign)
  }));
}

export function getZodiacWheelData(ownership: ZodiacIdentityOwnershipInput): ZodiacWheelData {
  const crossChain = isCrossChainOwnership(ownership) ? ownership : null;
  const normalizedOwnership = toOwnershipLike(ownership);
  const heldSigns = getHeldSigns(normalizedOwnership);
  const confirmedAbsentSigns = getConfirmedAbsentSigns(ownership);

  return {
    items: ZODIAC_SIGNS.map((sign) => {
      const asset = getZodiacAsset(sign);
      return {
        sign,
        displayName: asset.displayName,
        glyph: asset.native.symbol ?? asset.displayName,
        held: heldSigns.includes(sign),
        nativeHeld: crossChain
          ? isHeld(crossChain.solana, sign)
          : isHeldByRepresentation(normalizedOwnership, sign, "native"),
        bridgedHeld: crossChain
          ? isHeld(crossChain.base, sign)
          : isHeldByRepresentation(normalizedOwnership, sign, "bridged"),
        element: asset.metadata.element,
        modality: asset.metadata.modality
      };
    }),
    heldSigns,
    confirmedAbsentSigns,
    coverage: getWheelCoverage(heldSigns.length),
    totalUniqueSigns: heldSigns.length
  };
}

export function getIdentityReceiptData(
  ownership: ZodiacIdentityOwnershipInput,
  options: IdentityReceiptDataOptions = {}
): IdentityReceiptData {
  const context = getZodiacIdentityContext(ownership, options);

  return {
    label: options.label ?? "public Zodiacs shelf",
    ...context,
    wheelState: getZodiacWheelState(toOwnershipLike(ownership))
  };
}

export function getIdentityReceiptFacts(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): readonly ZodiacReceiptFact[] {
  return getZodiacIdentityContext(ownership, options).receiptFacts;
}

export function getShareCardContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacShareCardContext {
  const context = getZodiacIdentityContext(ownership, options);

  return {
    title: context.shareTitle,
    description: context.shareDescription,
    heldSigns: context.heldSigns,
    wheelCoverage: context.wheelCoverage,
    currentSeason: context.currentSeason,
    currentSeasonHeld: context.currentSeasonHeld,
    facts: context.receiptFacts
  };
}

export function getConsumerSafeWalletContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ConsumerSafeWalletContextOptions = {}
): ConsumerSafeWalletContext {
  const normalizedOwnership = toOwnershipLike(ownership);
  const heldSigns = getHeldSigns(normalizedOwnership);
  const currentSeason = getCurrentZodiacSeason(options.date);
  const currentSeasonAppearsInWallet = heldSigns.includes(currentSeason.sign);
  const dominantElement = getDominantElement(normalizedOwnership);
  const dominantModality = getDominantModality(normalizedOwnership);

  return {
    connectedWalletLabel: options.publicAddress ? "Connected wallet" : "Optional wallet context",
    readOnly: true,
    walletRequired: false,
    ...(options.publicAddress ? { publicAddress: options.publicAddress } : {}),
    verifiedZodiacHoldings: heldSigns,
    currentSeason,
    currentSeasonAppearsInWallet,
    optionalContextFacts: [
      { label: "Public address", value: options.publicAddress ? "connected" : "not connected" },
      { label: "Read-only", value: "yes" },
      { label: "Verified zodiac holdings", value: String(heldSigns.length) },
      {
        label: "Current season",
        value: `${currentSeason.displayName}${currentSeasonAppearsInWallet ? " appears in your connected wallet" : ""}`
      },
      { label: "Dominant element", value: dominantElement ?? "subtle balance" },
      { label: "Dominant modality", value: dominantModality ?? "subtle balance" }
    ],
    headline: heldSigns.length > 0 ? "Optional Zodiacs context" : "Optional read-only context",
    description:
      heldSigns.length > 0
        ? "Verified zodiac holdings add a subtle layer to this connected wallet."
        : "A public address can add optional context when verified zodiac holdings appear.",
    emptyState: "No wallet required. Zodiacs context stays optional.",
    provenanceNote:
      "Verified against the official Zodiacs.org registry using public address reads only.",
    safetyNote: "This context is read-only and never asks for wallet secrets or on-chain actions."
  };
}

export function getZodiacIdentityContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacIdentityContext {
  const normalizedOwnership = toOwnershipLike(ownership);
  const heldSigns = getHeldSigns(normalizedOwnership);
  const currentSeason = getCurrentZodiacSeason(options.date);
  const nativeBridgedSummary = isCrossChainOwnership(ownership)
    ? getNativeAndBridgedSummary(ownership)
    : getNativeAndBridgedSummaryFromOwnership(normalizedOwnership);
  const elementComposition = getElementComposition(normalizedOwnership);
  const modalityComposition = getModalityComposition(normalizedOwnership);
  const dominantElement = getDominantCompositionKey(elementComposition);
  const dominantModality = getDominantCompositionKey(modalityComposition);
  const currentSeasonHeld = heldSigns.includes(currentSeason.sign);
  const totalUniqueSigns = heldSigns.length;
  const confirmedAbsentSigns = getConfirmedAbsentSigns(ownership);

  return {
    heldSigns,
    confirmedAbsentSigns,
    totalHeld: totalUniqueSigns,
    wheelCoverage: getWheelCoverage(totalUniqueSigns),
    elementComposition,
    modalityComposition,
    nativeHeldSigns: nativeBridgedSummary.nativeHeldSigns,
    bridgedHeldSigns: nativeBridgedSummary.bridgedHeldSigns,
    dualRepresentationSigns: nativeBridgedSummary.dualRepresentationSigns,
    nativeCount: nativeBridgedSummary.nativeCount,
    bridgedCount: nativeBridgedSummary.bridgedCount,
    dualRepresentationCount: nativeBridgedSummary.dualRepresentationCount,
    totalUniqueSigns,
    totalRepresentationPositions: nativeBridgedSummary.totalRepresentationPositions,
    currentSeason,
    currentSeasonHeld,
    dominantElement,
    dominantModality,
    shareTitle: getIdentityShareTitle(totalUniqueSigns),
    shareDescription: getIdentityShareDescription(
      totalUniqueSigns,
      currentSeason.displayName,
      currentSeasonHeld
    ),
    receiptFacts: getReceiptFacts({
      heldSigns,
      wheelCoverage: getWheelCoverage(totalUniqueSigns),
      currentSeasonDisplayName: currentSeason.displayName,
      currentSeasonHeld,
      dominantElement,
      dominantModality,
      nativeCount: nativeBridgedSummary.nativeCount,
      bridgedCount: nativeBridgedSummary.bridgedCount,
      dualRepresentationCount: nativeBridgedSummary.dualRepresentationCount,
      totalUniqueSigns: nativeBridgedSummary.totalUniqueSigns,
      totalRepresentationPositions: nativeBridgedSummary.totalRepresentationPositions
    }),
    nativeBridgedSummary,
    alignments: getIdentityAlignments(heldSigns, options)
  };
}

export function getZodiacReadingContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacIdentityContext {
  return getZodiacIdentityContext(ownership, options);
}

export function getCrossChainZodiacShelf(
  ownershipByChain: CrossChainZodiacsOwnership
): UnifiedZodiacShelf {
  const items = ZODIAC_SIGNS.map((sign) => {
    const nativeHeld = isHeld(ownershipByChain.solana, sign);
    const bridgedHeld = isHeld(ownershipByChain.base, sign);

    return {
      sign,
      held: nativeHeld || bridgedHeld,
      nativeHeld,
      bridgedHeld,
      representations: [
        getZodiacAsset(sign).native,
        ...getZodiacAsset(sign).representations.filter(
          (representation) => representation.kind === "bridged"
        )
      ]
    };
  });
  const heldSigns = items.filter((item) => item.held).map((item) => item.sign);

  return {
    label: "combined wallet holdings across official representations",
    items,
    heldSigns,
    totalHeld: heldSigns.length
  };
}

export const mergeZodiacsOwnership = getCrossChainZodiacShelf;

export function getNativeAndBridgedSummary(
  ownershipByChain: CrossChainZodiacsOwnership
): ZodiacNativeBridgedSummary {
  const shelf = getCrossChainZodiacShelf(ownershipByChain);

  return buildNativeBridgedSummary(
    shelf.items.filter((item) => item.nativeHeld).map((item) => item.sign),
    shelf.items.filter((item) => item.bridgedHeld).map((item) => item.sign)
  );
}

export function getSeasonalContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacSeasonalContext {
  const heldSigns = getHeldSigns(toOwnershipLike(ownership));
  const currentSeason = getCurrentZodiacSeason(options.date);

  return {
    currentSeason,
    nextSeason: getNextZodiacSeason(options.date),
    currentSeasonHeld: heldSigns.includes(currentSeason.sign),
    seasonSign: currentSeason.sign,
    seasonDisplayName: currentSeason.displayName,
    heldSigns
  };
}

export function getCompatibilityContext(
  first: ZodiacIdentityOwnershipInput,
  second: ZodiacIdentityOwnershipInput
): ZodiacCompatibilityContext {
  const firstHeldSigns = getHeldSigns(toOwnershipLike(first));
  const secondHeldSigns = getHeldSigns(toOwnershipLike(second));
  const secondSet = new Set(secondHeldSigns);
  const firstSet = new Set(firstHeldSigns);
  const sharedSigns = firstHeldSigns.filter((sign) => secondSet.has(sign));
  const firstOnlySigns = firstHeldSigns.filter((sign) => !secondSet.has(sign));
  const secondOnlySigns = secondHeldSigns.filter((sign) => !firstSet.has(sign));
  const combinedUniqueSigns = ZODIAC_SIGNS.filter(
    (sign) => firstSet.has(sign) || secondSet.has(sign)
  );
  const sharedElements = unique(sharedSigns.map((sign) => getZodiacAsset(sign).metadata.element));
  const sharedModalities = unique(
    sharedSigns.map((sign) => getZodiacAsset(sign).metadata.modality)
  );
  const overlapPercentage =
    firstHeldSigns.length === 0 && secondHeldSigns.length === 0
      ? 100
      : getWheelCoverage(
          sharedSigns.length,
          Math.max(firstHeldSigns.length, secondHeldSigns.length, 1)
        );

  return {
    firstHeldSigns,
    secondHeldSigns,
    sharedSigns,
    firstOnlySigns,
    secondOnlySigns,
    overlapCount: sharedSigns.length,
    overlapPercentage,
    combinedUniqueSigns,
    combinedCoverage: getWheelCoverage(combinedUniqueSigns.length),
    sharedElements,
    sharedModalities,
    shareTitle:
      sharedSigns.length > 0
        ? `${sharedSigns.length} shared Zodiacs signs`
        : "No shared Zodiacs signs",
    shareDescription:
      sharedSigns.length > 0
        ? `Both shelves include ${formatSignList(sharedSigns)}.`
        : "These shelves do not currently overlap in the official Zodiacs registry."
  };
}

function getComposition<T extends ZodiacElement | ZodiacModality>(
  ownership: OwnershipLike,
  field: "element" | "modality"
): Record<T, number> {
  const initial =
    field === "element"
      ? { fire: 0, earth: 0, air: 0, water: 0 }
      : { cardinal: 0, fixed: 0, mutable: 0 };

  return getZodiacShelf(ownership).reduce<Record<string, number>>((counts, holding) => {
    const key = getZodiacAsset(holding.sign).metadata[field];
    return {
      ...counts,
      [key]: (counts[key] ?? 0) + 1
    };
  }, initial) as Record<T, number>;
}

function unique<T>(items: readonly T[]): readonly T[] {
  return [...new Set(items)];
}

function getHeldSigns(ownership: OwnershipLike): readonly ZodiacSign[] {
  const heldSet = new Set(getZodiacShelf(ownership).map((holding) => holding.sign));
  return ZODIAC_SIGNS.filter((sign) => heldSet.has(sign));
}

function isHeld(
  ownership: ZodiacsOwnership | BaseZodiacsOwnership | undefined,
  sign: ZodiacSign
): boolean {
  return ownership?.holdings.some((holding) => holding.sign === sign && holding.held) ?? false;
}

function toOwnershipLike(ownership: ZodiacIdentityOwnershipInput): OwnershipLike {
  if (!isCrossChainOwnership(ownership)) {
    return ownership;
  }

  const shelf = getCrossChainZodiacShelf(ownership);

  return {
    holdings: shelf.items.map((item) => ({
      sign: item.sign,
      held: item.held
    })),
    confirmedAbsentSigns: getConfirmedAbsentSigns(ownership)
  };
}

function getConfirmedAbsentSigns(ownership: ZodiacIdentityOwnershipInput): readonly ZodiacSign[] {
  if (!isCrossChainOwnership(ownership)) {
    return getConfirmedAbsentSignsFromOwnership(ownership);
  }

  const checkedOwnerships = [ownership.solana, ownership.base].filter(
    (chainOwnership): chainOwnership is ZodiacsOwnership | BaseZodiacsOwnership =>
      chainOwnership !== undefined
  );

  if (checkedOwnerships.length === 0) {
    return [];
  }

  return ZODIAC_SIGNS.filter((sign) => {
    if (checkedOwnerships.some((chainOwnership) => isHeld(chainOwnership, sign))) {
      return false;
    }

    return checkedOwnerships.every((chainOwnership) =>
      getConfirmedAbsentSignsFromOwnership(chainOwnership).includes(sign)
    );
  });
}

function getConfirmedAbsentSignsFromOwnership(ownership: OwnershipLike): readonly ZodiacSign[] {
  if (ownership.confirmedAbsentSigns) {
    return ownership.confirmedAbsentSigns;
  }

  if (ownership.zeroBalanceSigns) {
    return ownership.zeroBalanceSigns;
  }

  const heldSigns = getHeldSigns(ownership);
  return ZODIAC_SIGNS.filter((sign) => !heldSigns.includes(sign));
}

function toUniqueOwnershipLike(ownership: OwnershipLike): OwnershipLike {
  const heldSigns = new Set(getHeldSigns(ownership));

  return {
    holdings: ZODIAC_SIGNS.map((sign) => ({
      sign,
      held: heldSigns.has(sign)
    }))
  };
}

function isCrossChainOwnership(
  ownership: ZodiacIdentityOwnershipInput
): ownership is CrossChainZodiacsOwnership {
  return "solana" in ownership || "base" in ownership;
}

function getWheelCoverage(totalHeld: number, denominator: number = ZODIAC_SIGNS.length): number {
  return Math.round((totalHeld / denominator) * 10000) / 100;
}

function getIdentityAlignments(
  heldSigns: readonly ZodiacSign[],
  options: ZodiacIdentityAlignmentInput
): readonly ZodiacIdentityAlignment[] {
  const placements: readonly {
    readonly placement: ZodiacIdentityAlignment["placement"];
    readonly sign: ZodiacSign | undefined;
  }[] = [
    { placement: "sun", sign: options.sunSign },
    { placement: "moon", sign: options.moonSign },
    { placement: "rising", sign: options.risingSign }
  ];

  return placements.flatMap(({ placement, sign }) => {
    if (!sign) {
      return [];
    }

    return [
      {
        placement,
        sign,
        held: heldSigns.includes(sign)
      }
    ];
  });
}

function isHeldByRepresentation(
  ownership: OwnershipLike,
  sign: ZodiacSign,
  kind: "native" | "bridged"
): boolean {
  return ownership.holdings.some((holding) => {
    if (holding.sign !== sign || !holding.held) {
      return false;
    }

    return getHoldingRepresentationKind(holding) === kind;
  });
}

function getNativeAndBridgedSummaryFromOwnership(
  ownership: OwnershipLike
): ZodiacNativeBridgedSummary {
  const held = getZodiacShelf(ownership);
  const nativeHeldSigns: ZodiacSign[] = [];
  const bridgedHeldSigns: ZodiacSign[] = [];

  for (const sign of getHeldSigns(ownership)) {
    const signHoldings = held.filter((holding) => holding.sign === sign);
    const heldKinds = new Set(signHoldings.map((holding) => getHoldingRepresentationKind(holding)));

    if (heldKinds.has("native")) {
      nativeHeldSigns.push(sign);
    }

    if (heldKinds.has("bridged")) {
      bridgedHeldSigns.push(sign);
    }
  }

  return buildNativeBridgedSummary(nativeHeldSigns, bridgedHeldSigns);
}

function getHoldingRepresentationKind(holding: HoldingLike): "native" | "bridged" {
  const kind = holding.representation?.kind ?? holding.balance?.kind;

  if (kind) {
    return kind;
  }

  const chain = holding.representation?.chain ?? holding.balance?.chain;

  return chain === "base" ? "bridged" : "native";
}

function buildNativeBridgedSummary(
  nativeHeldSignsInput: readonly ZodiacSign[],
  bridgedHeldSignsInput: readonly ZodiacSign[]
): ZodiacNativeBridgedSummary {
  const nativeHeldSigns = orderSigns(nativeHeldSignsInput);
  const bridgedHeldSigns = orderSigns(bridgedHeldSignsInput);
  const nativeSet = new Set(nativeHeldSigns);
  const bridgedSet = new Set(bridgedHeldSigns);
  const heldSigns = ZODIAC_SIGNS.filter((sign) => nativeSet.has(sign) || bridgedSet.has(sign));
  const dualRepresentationSigns = ZODIAC_SIGNS.filter(
    (sign) => nativeSet.has(sign) && bridgedSet.has(sign)
  );
  const nativeCount = nativeHeldSigns.length;
  const bridgedCount = bridgedHeldSigns.length;
  const dualRepresentationCount = dualRepresentationSigns.length;
  const totalUniqueSigns = heldSigns.length;
  const totalRepresentationPositions = nativeCount + bridgedCount;

  return {
    nativeHeldSigns,
    bridgedHeldSigns,
    dualRepresentationSigns,
    nativeCount,
    bridgedCount,
    dualRepresentationCount,
    totalUniqueSigns,
    totalRepresentationPositions,
    nativeHeld: nativeCount,
    bridgedHeld: bridgedCount,
    combinedHeld: totalUniqueSigns,
    heldSigns
  };
}

function orderSigns(signs: readonly ZodiacSign[]): readonly ZodiacSign[] {
  const signSet = new Set(signs);
  return ZODIAC_SIGNS.filter((sign) => signSet.has(sign));
}

function getDominantCompositionKey<T extends string>(composition: Record<T, number>): T | null {
  let dominant: T | null = null;
  let dominantCount = 0;
  let tied = false;

  for (const [key, count] of Object.entries(composition) as [T, number][]) {
    if (count > dominantCount) {
      dominant = key;
      dominantCount = count;
      tied = false;
      continue;
    }

    if (count === dominantCount && count > 0) {
      tied = true;
    }
  }

  return dominantCount === 0 || tied ? null : dominant;
}

function getIdentityShareTitle(totalUniqueSigns: number): string {
  if (totalUniqueSigns === 0) {
    return "No verified Zodiacs holdings";
  }

  if (totalUniqueSigns === ZODIAC_SIGNS.length) {
    return "12 verified Zodiacs signs";
  }

  return `${totalUniqueSigns} verified Zodiacs signs`;
}

function getIdentityShareDescription(
  totalUniqueSigns: number,
  currentSeasonDisplayName: string,
  currentSeasonHeld: boolean
): string {
  if (totalUniqueSigns === 0) {
    return `The official registry shows no verified Zodiacs holdings for ${currentSeasonDisplayName} season context.`;
  }

  const seasonStatus = currentSeasonHeld ? "includes" : "does not include";
  return `This public shelf covers ${totalUniqueSigns} of 12 signs and ${seasonStatus} the current ${currentSeasonDisplayName} season.`;
}

function getReceiptFacts(input: {
  readonly heldSigns: readonly ZodiacSign[];
  readonly wheelCoverage: number;
  readonly currentSeasonDisplayName: string;
  readonly currentSeasonHeld: boolean;
  readonly dominantElement: ZodiacElement | null;
  readonly dominantModality: ZodiacModality | null;
  readonly nativeCount: number;
  readonly bridgedCount: number;
  readonly dualRepresentationCount: number;
  readonly totalUniqueSigns: number;
  readonly totalRepresentationPositions: number;
}): readonly ZodiacReceiptFact[] {
  return [
    { label: "Held signs", value: String(input.heldSigns.length) },
    { label: "Wheel coverage", value: `${input.wheelCoverage}%` },
    { label: "Current season", value: input.currentSeasonDisplayName },
    { label: "Season held", value: input.currentSeasonHeld ? "yes" : "no" },
    { label: "Dominant element", value: input.dominantElement ?? "balanced" },
    { label: "Dominant modality", value: input.dominantModality ?? "balanced" },
    { label: "Solana-native signs", value: String(input.nativeCount) },
    { label: "Base-bridged signs", value: String(input.bridgedCount) },
    { label: "Dual representation signs", value: String(input.dualRepresentationCount) },
    { label: "Representation positions", value: String(input.totalRepresentationPositions) }
  ];
}

function formatSignList(signs: readonly ZodiacSign[]): string {
  return signs.map((sign) => getZodiacAsset(sign).displayName).join(", ");
}
