import { describe, expect, it } from "vitest";
import {
  formatCompactNumber,
  formatCurrency,
  formatPercentChange,
  formatTokenAmount,
  formatZodiacBalance,
  getZodiacToken,
  rawAmountToNumber,
  type TokenBalance
} from "./index.js";

const token = getZodiacToken("aries");

function tokenBalance(overrides: Partial<TokenBalance> = {}): TokenBalance {
  return {
    ownerAddress: "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ",
    mintAddress: token.mintAddress,
    amountRaw: "2500000",
    decimals: 6,
    uiAmount: 2.5,
    ...overrides
  };
}

describe("formatTokenAmount", () => {
  it("formats raw integer amounts using token decimals", () => {
    expect(formatTokenAmount("2500000", 6)).toBe("2.5");
    expect(formatTokenAmount("4000000", 6)).toBe("4");
    expect(formatTokenAmount("0", 6)).toBe("0");
  });

  it("stays exact for very large amounts via string and bigint math", () => {
    expect(formatTokenAmount("1234500000000000000000000", 6)).toBe("1234500000000000000");
    expect(formatTokenAmount(1234500000000000000000000n, 6)).toBe("1234500000000000000");
  });

  it("keeps leading fractional zeros and trims trailing zeros", () => {
    expect(formatTokenAmount("100", 5)).toBe("0.001");
    expect(formatTokenAmount("123", 0)).toBe("123");
  });

  it("honors minimum and maximum fraction digit options", () => {
    expect(formatTokenAmount("1000000", 6, { minimumFractionDigits: 2 })).toBe("1.00");
    expect(formatTokenAmount("1250000", 6, { maximumFractionDigits: 1 })).toBe("1.2");
  });

  it("rounds only when explicitly requested", () => {
    expect(formatTokenAmount("1250000", 6, { maximumFractionDigits: 1 })).toBe("1.2");
    expect(
      formatTokenAmount("1250000", 6, { maximumFractionDigits: 1, roundingMode: "round" })
    ).toBe("1.3");
    expect(
      formatTokenAmount("999999", 6, { maximumFractionDigits: 0, roundingMode: "round" })
    ).toBe("1");
  });

  it("rejects malformed amounts and out-of-range decimals", () => {
    expect(() => formatTokenAmount("-5", 6)).toThrow();
    expect(() => formatTokenAmount("1.5", 6)).toThrow();
    expect(() => formatTokenAmount("100", 19)).toThrow();
    expect(() => formatTokenAmount("100", -1)).toThrow();
    expect(() =>
      formatTokenAmount("100", 6, { minimumFractionDigits: 3, maximumFractionDigits: 2 })
    ).toThrow();
  });
});

describe("rawAmountToNumber", () => {
  it("converts raw amounts to UI numbers", () => {
    expect(rawAmountToNumber("2500000", 6)).toBe(2.5);
    expect(rawAmountToNumber("0", 6)).toBe(0);
    expect(rawAmountToNumber("100", 0)).toBe(100);
    expect(rawAmountToNumber(2500000n, 6)).toBe(2.5);
  });
});

describe("formatCurrency", () => {
  it("formats finite values with adaptive precision", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(0.5)).toBe("$0.50");
  });

  it("returns Unavailable for nullish or non-finite input", () => {
    expect(formatCurrency(null)).toBe("Unavailable");
    expect(formatCurrency(undefined)).toBe("Unavailable");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("Unavailable");
    expect(formatCurrency(Number.NaN)).toBe("Unavailable");
  });
});

describe("formatPercentChange", () => {
  it("formats signed percentages", () => {
    expect(formatPercentChange(2.5)).toBe("+2.5%");
    expect(formatPercentChange(-1.25)).toBe("-1.25%");
    expect(formatPercentChange(0)).toBe("0%");
  });

  it("returns Unavailable for nullish or non-finite input", () => {
    expect(formatPercentChange(null)).toBe("Unavailable");
    expect(formatPercentChange(Number.NaN)).toBe("Unavailable");
  });
});

describe("formatCompactNumber", () => {
  it("formats large numbers compactly", () => {
    expect(formatCompactNumber(1234567)).toBe("1.23M");
    expect(formatCompactNumber(999)).toBe("999");
  });
});

describe("formatZodiacBalance", () => {
  it("returns a zero balance label when no balance is present", () => {
    expect(formatZodiacBalance(null, token)).toBe("0 ARIES");
  });

  it("formats the UI amount when available", () => {
    expect(formatZodiacBalance(tokenBalance(), token)).toBe("2.5 ARIES");
  });

  it("falls back to string formatting when uiAmount is null", () => {
    expect(formatZodiacBalance(tokenBalance({ uiAmount: null }), token)).toBe("2.5 ARIES");
  });

  it("honors raw amount rounding options even when uiAmount is present", () => {
    const balance = tokenBalance({ amountRaw: "1250000", uiAmount: 1.25 });

    expect(formatZodiacBalance(balance, token, { maximumFractionDigits: 1 })).toBe("1.2 ARIES");
    expect(
      formatZodiacBalance(balance, token, {
        maximumFractionDigits: 1,
        roundingMode: "round"
      })
    ).toBe("1.3 ARIES");
  });
});
