import { getZodiacAsset } from "./official-registry.js";
import { getCurrentZodiacSeason } from "./season.js";
import {
  ZODIAC_SIGNS,
  type BaseZodiacsOwnership,
  type CosmicReceiptData,
  type CrossChainZodiacsOwnership,
  type UnifiedZodiacShelf,
  type ZodiacElement,
  type ZodiacIdentityAlignment,
  type ZodiacIdentityAlignmentInput,
  type ZodiacIdentityContext,
  type ZodiacModality,
  type ZodiacNativeBridgedSummary,
  type ZodiacSign,
  type ZodiacsOwnership
} from "./types.js";

interface HoldingLike {
  readonly sign: ZodiacSign;
  readonly held: boolean;
}

interface OwnershipLike {
  readonly holdings: readonly HoldingLike[];
}

export type ZodiacIdentityOwnershipInput = OwnershipLike | CrossChainZodiacsOwnership;

export interface ZodiacIdentityContextOptions extends ZodiacIdentityAlignmentInput {
  readonly date?: Date;
}

export interface CosmicReceiptDataOptions extends ZodiacIdentityContextOptions {
  readonly label?: string;
}

export function getZodiacShelf<T extends OwnershipLike>(ownership: T): readonly HoldingLike[] {
  return ownership.holdings.filter((holding) => holding.held);
}

export function getElementComposition(ownership: OwnershipLike): Record<ZodiacElement, number> {
  return getComposition(ownership, "element");
}

export function getModalityComposition(ownership: OwnershipLike): Record<ZodiacModality, number> {
  return getComposition(ownership, "modality");
}

export function getTotalHeld(ownership: OwnershipLike): number {
  return getZodiacShelf(ownership).length;
}

export function getHeldElements(ownership: OwnershipLike): readonly ZodiacElement[] {
  return unique(getZodiacShelf(ownership).map((holding) => getZodiacAsset(holding.sign).metadata.element));
}

export function getHeldModalities(ownership: OwnershipLike): readonly ZodiacModality[] {
  return unique(getZodiacShelf(ownership).map((holding) => getZodiacAsset(holding.sign).metadata.modality));
}

export function getOwnSignStatus(ownership: OwnershipLike, sunSign: ZodiacSign): {
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
  return ZODIAC_SIGNS.map((sign) => ({
    sign,
    held: ownership.holdings.some((holding) => holding.sign === sign && holding.held)
  }));
}

export function getCosmicReceiptData(
  ownership: ZodiacIdentityOwnershipInput,
  options: CosmicReceiptDataOptions = {}
): CosmicReceiptData {
  const context = getZodiacIdentityContext(ownership, options);

  return {
    label: options.label ?? "public Zodiacs shelf",
    ...context,
    wheelState: getZodiacWheelState(toOwnershipLike(ownership))
  };
}

export function getZodiacIdentityContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacIdentityContext {
  const normalizedOwnership = toOwnershipLike(ownership);
  const heldSigns = getZodiacShelf(normalizedOwnership).map((holding) => holding.sign);
  const currentSeason = getCurrentZodiacSeason(options.date);

  return {
    heldSigns,
    missingSigns: ZODIAC_SIGNS.filter((sign) => !heldSigns.includes(sign)),
    totalHeld: heldSigns.length,
    wheelCoverage: getWheelCoverage(heldSigns.length),
    elementComposition: getElementComposition(normalizedOwnership),
    modalityComposition: getModalityComposition(normalizedOwnership),
    currentSeason,
    currentSeasonHeld: heldSigns.includes(currentSeason.sign),
    ...(isCrossChainOwnership(ownership)
      ? { nativeBridgedSummary: getNativeAndBridgedSummary(ownership) }
      : {}),
    alignments: getIdentityAlignments(heldSigns, options)
  };
}

export function getZodiacReadingContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacIdentityContext {
  return getZodiacIdentityContext(ownership, options);
}

export function getCrossChainZodiacShelf(ownershipByChain: CrossChainZodiacsOwnership): UnifiedZodiacShelf {
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
        ...getZodiacAsset(sign).representations.filter((representation) => representation.kind === "bridged")
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

export function getNativeAndBridgedSummary(ownershipByChain: CrossChainZodiacsOwnership): {
  readonly nativeHeld: number;
  readonly bridgedHeld: number;
  readonly combinedHeld: number;
  readonly heldSigns: readonly ZodiacSign[];
} {
  const shelf = getCrossChainZodiacShelf(ownershipByChain);

  return {
    nativeHeld: shelf.items.filter((item) => item.nativeHeld).length,
    bridgedHeld: shelf.items.filter((item) => item.bridgedHeld).length,
    combinedHeld: shelf.totalHeld,
    heldSigns: shelf.heldSigns
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

function isHeld(ownership: ZodiacsOwnership | BaseZodiacsOwnership | undefined, sign: ZodiacSign): boolean {
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
    }))
  };
}

function isCrossChainOwnership(ownership: ZodiacIdentityOwnershipInput): ownership is CrossChainZodiacsOwnership {
  return "solana" in ownership || "base" in ownership;
}

function getWheelCoverage(totalHeld: number): number {
  return Math.round((totalHeld / ZODIAC_SIGNS.length) * 10000) / 100;
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

    return [{
      placement,
      sign,
      held: heldSigns.includes(sign)
    }];
  });
}
