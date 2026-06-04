import { describe, expect, it } from "vitest";
import {
  getIdentityReceiptData,
  getIdentityReceiptFacts,
  getCompatibilityContext,
  getCrossChainZodiacShelf,
  getDominantElement,
  getDominantModality,
  getElementComposition,
  getSeasonalContext,
  getShareCardContext,
  getZodiacIdentityContext,
  getZodiacReadingContext,
  getModalityComposition,
  getZodiacWheelData,
  mergeZodiacsOwnership,
  getNativeAndBridgedSummary,
  getOwnSignStatus,
  getTotalHeld,
  getConsumerSafeWalletContext,
  getZodiacWheelState
} from "./index.js";

const ownership = {
  holdings: [
    { sign: "aries", held: true },
    { sign: "taurus", held: false },
    { sign: "gemini", held: true }
  ]
} as const;

const emptyOwnership = {
  holdings: []
} as const;

const fullWheelOwnership = {
  holdings: [
    { sign: "aries", held: true },
    { sign: "taurus", held: true },
    { sign: "gemini", held: true },
    { sign: "cancer", held: true },
    { sign: "leo", held: true },
    { sign: "virgo", held: true },
    { sign: "libra", held: true },
    { sign: "scorpio", held: true },
    { sign: "sagittarius", held: true },
    { sign: "capricorn", held: true },
    { sign: "aquarius", held: true },
    { sign: "pisces", held: true }
  ]
} as const;

describe("identity composition helpers", () => {
  it("computes element, modality, total, own-sign, and wheel state", () => {
    expect(getElementComposition(ownership)).toMatchObject({ fire: 1, air: 1 });
    expect(getModalityComposition(ownership)).toMatchObject({ cardinal: 1, mutable: 1 });
    expect(getTotalHeld(ownership)).toBe(2);
    expect(getOwnSignStatus(ownership, "aries")).toMatchObject({ held: true, label: "held" });
    expect(getZodiacWheelState(ownership)).toHaveLength(12);
  });

  it("builds receipt and cross-chain shelf data without market data", () => {
    expect(getIdentityReceiptData(ownership)).toMatchObject({
      label: "public Zodiacs shelf",
      heldSigns: ["aries", "gemini"],
      totalHeld: 2,
      wheelCoverage: 16.67,
      wheelState: expect.arrayContaining([
        { sign: "aries", held: true },
        { sign: "taurus", held: false }
      ])
    });

    const ownershipByChain = {
      solana: {
        walletAddress: "solana-wallet",
        chain: "solana",
        status: "available",
        holdings: [{ sign: "aries", held: true }],
        heldSigns: ["aries"],
        totalHeld: 1,
        errors: []
      } as never,
      base: {
        ownerAddress: "0x1111111111111111111111111111111111111111",
        chain: "base",
        status: "available",
        holdings: [{ sign: "taurus", held: true }],
        heldSigns: ["taurus"],
        totalHeld: 1,
        errors: []
      } as never
    };
    const shelf = getCrossChainZodiacShelf(ownershipByChain);

    expect(shelf.label).toBe("combined wallet holdings across official representations");
    expect(shelf.heldSigns).toEqual(["aries", "taurus"]);
    expect(getNativeAndBridgedSummary(ownershipByChain)).toMatchObject({
      nativeHeld: 1,
      bridgedHeld: 1,
      combinedHeld: 2
    });
  });

  it("builds deterministic identity context with held, confirmed absent, season, and manual placements", () => {
    const context = getZodiacIdentityContext(ownership, {
      date: new Date("2026-03-22T00:00:00.000Z"),
      sunSign: "aries",
      moonSign: "taurus",
      risingSign: "gemini"
    });

    expect(context).toMatchObject({
      heldSigns: ["aries", "gemini"],
      confirmedAbsentSigns: expect.arrayContaining(["taurus", "cancer"]),
      missingSigns: expect.arrayContaining(["taurus", "cancer"]),
      totalHeld: 2,
      totalUniqueSigns: 2,
      wheelCoverage: 16.67,
      elementComposition: { fire: 1, earth: 0, air: 1, water: 0 },
      modalityComposition: { cardinal: 1, fixed: 0, mutable: 1 },
      nativeCount: 2,
      bridgedCount: 0,
      currentSeason: {
        sign: "aries",
        startDate: "2026-03-21",
        endDate: "2026-04-19"
      },
      currentSeasonHeld: true,
      dominantElement: null,
      dominantModality: null,
      shareTitle: "2 verified Zodiacs signs",
      alignments: [
        { placement: "sun", sign: "aries", held: true },
        { placement: "moon", sign: "taurus", held: false },
        { placement: "rising", sign: "gemini", held: true }
      ]
    });
    expect(context.confirmedAbsentSigns).toHaveLength(10);
    expect(context.missingSigns).toHaveLength(10);
    expect(context.receiptFacts.map((fact) => fact.label)).toContain("Wheel coverage");
  });

  it("reports when the current-season sign is not held", () => {
    expect(
      getZodiacReadingContext(ownership, {
        date: new Date("2026-04-21T00:00:00.000Z")
      })
    ).toMatchObject({
      currentSeason: { sign: "taurus" },
      currentSeasonHeld: false
    });
  });

  it("includes native and bridged summary for cross-chain input", () => {
    const ownershipByChain = {
      solana: {
        walletAddress: "solana-wallet",
        chain: "solana",
        status: "available",
        holdings: [{ sign: "aries", held: true }],
        heldSigns: ["aries"],
        totalHeld: 1,
        errors: []
      } as never,
      base: {
        ownerAddress: "0x1111111111111111111111111111111111111111",
        chain: "base",
        status: "available",
        holdings: [{ sign: "taurus", held: true }],
        heldSigns: ["taurus"],
        totalHeld: 1,
        errors: []
      } as never
    };

    expect(
      getZodiacIdentityContext(ownershipByChain, {
        date: new Date("2026-04-21T00:00:00.000Z")
      })
    ).toMatchObject({
      heldSigns: ["aries", "taurus"],
      currentSeason: { sign: "taurus" },
      currentSeasonHeld: true,
      nativeBridgedSummary: {
        nativeHeld: 1,
        bridgedHeld: 1,
        combinedHeld: 2,
        heldSigns: ["aries", "taurus"]
      }
    });
  });

  it("handles empty wallets with display-ready receipt facts", () => {
    const context = getZodiacIdentityContext(emptyOwnership, {
      date: new Date("2026-03-21T00:00:00.000Z")
    });

    expect(context).toMatchObject({
      heldSigns: [],
      confirmedAbsentSigns: expect.arrayContaining(["aries", "pisces"]),
      missingSigns: expect.arrayContaining(["aries", "pisces"]),
      totalUniqueSigns: 0,
      wheelCoverage: 0,
      nativeCount: 0,
      bridgedCount: 0,
      dominantElement: null,
      dominantModality: null,
      currentSeasonHeld: false,
      shareTitle: "No verified Zodiacs holdings"
    });
    expect(context.receiptFacts).toContainEqual({ label: "Held signs", value: "0" });
  });

  it("does not treat unavailable ownership reads as confirmed absent", () => {
    const context = getZodiacIdentityContext({
      holdings: [
        { sign: "aries", held: false },
        { sign: "taurus", held: false }
      ],
      unavailableSigns: ["aries"],
      confirmedAbsentSigns: ["taurus"]
    });

    expect(context.confirmedAbsentSigns).toEqual(["taurus"]);
    expect(context.missingSigns).toEqual(["taurus"]);
  });

  it("handles one sign and full wheel coverage", () => {
    expect(
      getZodiacIdentityContext(
        {
          holdings: [{ sign: "leo", held: true }]
        },
        {
          date: new Date("2026-07-24T00:00:00.000Z")
        }
      )
    ).toMatchObject({
      heldSigns: ["leo"],
      wheelCoverage: 8.33,
      dominantElement: "fire",
      dominantModality: "fixed",
      currentSeasonHeld: true
    });

    expect(getZodiacIdentityContext(fullWheelOwnership)).toMatchObject({
      totalUniqueSigns: 12,
      wheelCoverage: 100,
      shareTitle: "12 verified Zodiacs signs"
    });
  });

  it("deduplicates duplicated signs across Solana and Base", () => {
    const ownershipByChain = {
      solana: {
        walletAddress: "solana-wallet",
        chain: "solana",
        status: "available",
        holdings: [{ sign: "aries", held: true }],
        heldSigns: ["aries"],
        totalHeld: 1,
        errors: []
      } as never,
      base: {
        ownerAddress: "0x1111111111111111111111111111111111111111",
        chain: "base",
        status: "available",
        holdings: [
          { sign: "aries", held: true },
          { sign: "taurus", held: true }
        ],
        heldSigns: ["aries", "taurus"],
        totalHeld: 2,
        errors: []
      } as never
    };

    expect(mergeZodiacsOwnership(ownershipByChain).heldSigns).toEqual(["aries", "taurus"]);
    expect(getZodiacIdentityContext(ownershipByChain)).toMatchObject({
      heldSigns: ["aries", "taurus"],
      totalUniqueSigns: 2,
      nativeCount: 1,
      bridgedCount: 2,
      nativeBridgedSummary: {
        nativeHeld: 1,
        bridgedHeld: 2,
        combinedHeld: 2
      }
    });
  });

  it("returns wheel, seasonal, and compatibility context", () => {
    const wheel = getZodiacWheelData(ownership);
    const seasonal = getSeasonalContext(ownership, {
      date: new Date("2026-04-19T23:59:59.000Z")
    });
    const nextSeason = getSeasonalContext(ownership, {
      date: new Date("2026-04-20T00:00:00.000Z")
    });
    const compatibility = getCompatibilityContext(ownership, {
      holdings: [
        { sign: "aries", held: true },
        { sign: "cancer", held: true }
      ]
    });

    expect(wheel).toMatchObject({
      heldSigns: ["aries", "gemini"],
      missingSigns: expect.arrayContaining(["taurus"]),
      coverage: 16.67,
      totalUniqueSigns: 2
    });
    expect(wheel.items).toHaveLength(12);
    expect(seasonal).toMatchObject({
      seasonSign: "aries",
      currentSeasonHeld: true,
      nextSeason: { sign: "taurus" }
    });
    expect(nextSeason).toMatchObject({
      seasonSign: "taurus",
      currentSeasonHeld: false
    });
    expect(compatibility).toMatchObject({
      sharedSigns: ["aries"],
      firstOnlySigns: ["gemini"],
      secondOnlySigns: ["cancer"],
      overlapCount: 1,
      overlapPercentage: 50,
      combinedCoverage: 25
    });
  });

  it("exposes dominant, receipt, share card, and consumer-safe context helpers", () => {
    const consumerSafe = getConsumerSafeWalletContext(ownership, {
      date: new Date("2026-03-22T00:00:00.000Z"),
      publicAddress: "0x1111111111111111111111111111111111111111"
    });
    const serialized = JSON.stringify(consumerSafe);

    expect(getDominantElement({ holdings: [{ sign: "leo", held: true }] })).toBe("fire");
    expect(getDominantModality({ holdings: [{ sign: "leo", held: true }] })).toBe("fixed");
    expect(getIdentityReceiptFacts(ownership)).toEqual(
      getZodiacIdentityContext(ownership).receiptFacts
    );
    expect(getShareCardContext(ownership)).toMatchObject({
      title: "2 verified Zodiacs signs",
      heldSigns: ["aries", "gemini"]
    });
    expect(consumerSafe).toMatchObject({
      connectedWalletLabel: "Connected wallet",
      readOnly: true,
      walletRequired: false,
      verifiedZodiacHoldings: ["aries", "gemini"],
      currentSeasonAppearsInWallet: true,
      headline: "Optional Zodiacs context"
    });
    expect(serialized).not.toMatch(
      /buy|sell|swap|invest|portfolio|market cap|profit|complete your wheel|missing sign|unlock|reward|token-gated/iu
    );
  });
});
