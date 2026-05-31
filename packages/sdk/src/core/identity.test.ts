import { describe, expect, it } from "vitest";
import {
  getCosmicReceiptData,
  getCrossChainZodiacShelf,
  getElementComposition,
  getZodiacIdentityContext,
  getZodiacReadingContext,
  getModalityComposition,
  getNativeAndBridgedSummary,
  getOwnSignStatus,
  getTotalHeld,
  getZodiacWheelState
} from "./index.js";

const ownership = {
  holdings: [
    { sign: "aries", held: true },
    { sign: "taurus", held: false },
    { sign: "gemini", held: true }
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
    expect(getCosmicReceiptData(ownership)).toMatchObject({
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

  it("builds deterministic identity context with held, missing, season, and manual placements", () => {
    const context = getZodiacIdentityContext(ownership, {
      date: new Date("2026-03-22T00:00:00.000Z"),
      sunSign: "aries",
      moonSign: "taurus",
      risingSign: "gemini"
    });

    expect(context).toMatchObject({
      heldSigns: ["aries", "gemini"],
      missingSigns: expect.arrayContaining(["taurus", "cancer"]),
      totalHeld: 2,
      wheelCoverage: 16.67,
      elementComposition: { fire: 1, earth: 0, air: 1, water: 0 },
      modalityComposition: { cardinal: 1, fixed: 0, mutable: 1 },
      currentSeason: {
        sign: "aries",
        startDate: "2026-03-21",
        endDate: "2026-04-19"
      },
      currentSeasonHeld: true,
      alignments: [
        { placement: "sun", sign: "aries", held: true },
        { placement: "moon", sign: "taurus", held: false },
        { placement: "rising", sign: "gemini", held: true }
      ]
    });
    expect(context.missingSigns).toHaveLength(10);
  });

  it("reports when the current-season sign is not held", () => {
    expect(getZodiacReadingContext(ownership, {
      date: new Date("2026-04-21T00:00:00.000Z")
    })).toMatchObject({
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

    expect(getZodiacIdentityContext(ownershipByChain, {
      date: new Date("2026-04-21T00:00:00.000Z")
    })).toMatchObject({
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
});
