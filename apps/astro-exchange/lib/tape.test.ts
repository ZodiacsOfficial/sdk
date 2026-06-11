import { describe, expect, it } from "vitest";
import { primaryLeg, relativeTime } from "./tape";
import type { TradeTapeItem } from "./tape";

function trade(legs: TradeTapeItem["legs"]): TradeTapeItem {
  return {
    type: "trade",
    id: "t",
    ts: 0,
    fid: 1,
    username: null,
    pfpUrl: null,
    txHash: "0x0",
    legs,
    volumeUsd: 0
  };
}

describe("primaryLeg", () => {
  it("picks the largest leg by usd", () => {
    const item = trade([
      { sign: "aries", direction: "buy", usd: 10 },
      { sign: "leo", direction: "sell", usd: 25 }
    ]);
    expect(primaryLeg(item)?.sign).toBe("leo");
  });

  it("returns null when there are no legs", () => {
    expect(primaryLeg(trade([]))).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = 1_000_000_000_000;
  it("formats seconds, minutes, hours, and days", () => {
    expect(relativeTime(now - 20_000, now)).toBe("now");
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5m");
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe("3h");
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe("2d");
  });

  it("never goes negative for future timestamps", () => {
    expect(relativeTime(now + 60_000, now)).toBe("now");
  });
});
