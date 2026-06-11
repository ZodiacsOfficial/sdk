import { describe, expect, it } from "vitest";
import {
  applyBuy,
  applySell,
  emptyPosition,
  microsToUsd,
  positionFromJson,
  positionToJson,
  unrealizedMicros,
  usdMicrosForAmount
} from "./pnl";

const DECIMALS = 6;
const ONE_TOKEN = 10n ** 6n;

describe("pnl accounting", () => {
  it("computes usd micros from raw amounts", () => {
    expect(usdMicrosForAmount(ONE_TOKEN, DECIMALS, 2.5)).toBe(2_500_000n);
    expect(usdMicrosForAmount(ONE_TOKEN / 2n, DECIMALS, 2.5)).toBe(1_250_000n);
  });

  it("realizes profit on a sell at a higher price", () => {
    let position = emptyPosition();
    position = applyBuy(
      position,
      100n * ONE_TOKEN,
      usdMicrosForAmount(100n * ONE_TOKEN, DECIMALS, 1)
    );
    const sale = applySell(
      position,
      50n * ONE_TOKEN,
      usdMicrosForAmount(50n * ONE_TOKEN, DECIMALS, 2)
    );
    expect(microsToUsd(sale.realizedDeltaMicros)).toBeCloseTo(50, 6);
    expect(sale.position.qtyRaw).toBe(50n * ONE_TOKEN);
    expect(microsToUsd(sale.position.costUsdMicros)).toBeCloseTo(50, 6);
  });

  it("realizes losses symmetrically", () => {
    let position = emptyPosition();
    position = applyBuy(
      position,
      10n * ONE_TOKEN,
      usdMicrosForAmount(10n * ONE_TOKEN, DECIMALS, 4)
    );
    const sale = applySell(
      position,
      10n * ONE_TOKEN,
      usdMicrosForAmount(10n * ONE_TOKEN, DECIMALS, 3)
    );
    expect(microsToUsd(sale.realizedDeltaMicros)).toBeCloseTo(-10, 6);
    expect(sale.position.qtyRaw).toBe(0n);
    expect(sale.position.costUsdMicros).toBe(0n);
  });

  it("only credits the tracked portion of an oversized sell", () => {
    let position = emptyPosition();
    position = applyBuy(
      position,
      10n * ONE_TOKEN,
      usdMicrosForAmount(10n * ONE_TOKEN, DECIMALS, 1)
    );
    const sale = applySell(
      position,
      40n * ONE_TOKEN,
      usdMicrosForAmount(40n * ONE_TOKEN, DECIMALS, 2)
    );
    expect(sale.creditedRaw).toBe(10n * ONE_TOKEN);
    expect(microsToUsd(sale.realizedDeltaMicros)).toBeCloseTo(10, 6);
    expect(sale.position.qtyRaw).toBe(0n);
  });

  it("ignores sells with no tracked position", () => {
    const sale = applySell(emptyPosition(), ONE_TOKEN, 1_000_000n);
    expect(sale.creditedRaw).toBe(0n);
    expect(sale.realizedDeltaMicros).toBe(0n);
  });

  it("caps unrealized PnL by the on-chain balance", () => {
    let position = emptyPosition();
    position = applyBuy(
      position,
      100n * ONE_TOKEN,
      usdMicrosForAmount(100n * ONE_TOKEN, DECIMALS, 1)
    );
    const full = unrealizedMicros(position, null, DECIMALS, 2);
    expect(microsToUsd(full)).toBeCloseTo(100, 6);
    const capped = unrealizedMicros(position, 25n * ONE_TOKEN, DECIMALS, 2);
    expect(microsToUsd(capped)).toBeCloseTo(25, 6);
    expect(unrealizedMicros(position, 0n, DECIMALS, 2)).toBe(0n);
  });

  it("returns zero unrealized without a price", () => {
    let position = emptyPosition();
    position = applyBuy(position, ONE_TOKEN, 1_000_000n);
    expect(unrealizedMicros(position, null, DECIMALS, null)).toBe(0n);
  });

  it("round-trips through json", () => {
    let position = emptyPosition();
    position = applyBuy(position, 7n * ONE_TOKEN, 3_500_000n);
    expect(positionFromJson(positionToJson(position))).toEqual(position);
    expect(positionFromJson(null)).toEqual(emptyPosition());
  });
});
