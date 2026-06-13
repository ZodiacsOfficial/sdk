import { describe, expect, it } from "vitest";
import { getBaseZodiacRepresentation } from "@zodiacs/sdk/core";
import { buildLegs, netZodiacDeltas } from "./verify";
import type { TransferLogLike } from "./verify";

const WALLET = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";
const ROUTER = "0x3333333333333333333333333333333333333333";
const ARIES = getBaseZodiacRepresentation("aries").address;
const LEO = getBaseZodiacRepresentation("leo").address;

function transfer(token: string, from: string, to: string, value: bigint): TransferLogLike {
  return { address: token, args: { from, to, value } };
}

describe("netZodiacDeltas", () => {
  it("nets a buy from router transfer logs", () => {
    const deltas = netZodiacDeltas([transfer(ARIES, ROUTER, WALLET, 5_000_000n)], WALLET);
    expect(deltas.get("aries")).toBe(5_000_000n);
  });

  it("ignores transfers that do not involve the wallet", () => {
    const deltas = netZodiacDeltas([transfer(ARIES, ROUTER, OTHER, 5_000_000n)], WALLET);
    expect(deltas.size).toBe(0);
  });

  it("ignores non-official token contracts", () => {
    const fake = "0x4444444444444444444444444444444444444444";
    const deltas = netZodiacDeltas([transfer(fake, ROUTER, WALLET, 5_000_000n)], WALLET);
    expect(deltas.size).toBe(0);
  });

  it("is case-insensitive on wallet and token addresses", () => {
    const deltas = netZodiacDeltas(
      [transfer(ARIES.toLowerCase(), ROUTER, WALLET.toUpperCase().replace("0X", "0x"), 7n)],
      WALLET
    );
    expect(deltas.get("aries")).toBe(7n);
  });

  it("nets multi-hop transfers within one tx", () => {
    const deltas = netZodiacDeltas(
      [
        transfer(ARIES, ROUTER, WALLET, 5_000_000n),
        transfer(ARIES, WALLET, OTHER, 2_000_000n),
        transfer(LEO, WALLET, ROUTER, 3_000_000n)
      ],
      WALLET
    );
    expect(deltas.get("aries")).toBe(3_000_000n);
    expect(deltas.get("leo")).toBe(-3_000_000n);
  });
});

describe("buildLegs", () => {
  it("builds buy and sell legs and uses the max leg as volume", () => {
    const deltas = new Map([
      ["aries" as const, 4_000_000n],
      ["leo" as const, -2_000_000n]
    ]);
    const built = buildLegs(deltas, { aries: 1.5, leo: 4 });
    expect(built).not.toBeNull();
    const legs = built!.legs;
    const aries = legs.find((leg) => leg.sign === "aries");
    const leo = legs.find((leg) => leg.sign === "leo");
    expect(aries?.direction).toBe("buy");
    expect(aries?.usdMicros).toBe("6000000");
    expect(leo?.direction).toBe("sell");
    expect(leo?.usdMicros).toBe("8000000");
    expect(built!.volumeUsdMicros).toBe(8_000_000n);
  });

  it("fails when a traded sign has no price", () => {
    const deltas = new Map([["aries" as const, 1_000_000n]]);
    expect(buildLegs(deltas, { aries: null })).toBeNull();
    expect(buildLegs(deltas, {})).toBeNull();
  });
});
