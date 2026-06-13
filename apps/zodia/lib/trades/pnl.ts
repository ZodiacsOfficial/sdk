/**
 * Average-cost-basis accounting for app-tracked positions. Token quantities are raw bigints;
 * USD values are bigint micro-dollars to keep incremental updates exact.
 */

export interface Position {
  readonly qtyRaw: bigint;
  readonly costUsdMicros: bigint;
  readonly realizedUsdMicros: bigint;
}

export function emptyPosition(): Position {
  return { qtyRaw: 0n, costUsdMicros: 0n, realizedUsdMicros: 0n };
}

export function priceToMicros(priceUsd: number): bigint {
  return BigInt(Math.round(priceUsd * 1_000_000));
}

export function usdMicrosForAmount(amountRaw: bigint, decimals: number, priceUsd: number): bigint {
  return (amountRaw * priceToMicros(priceUsd)) / 10n ** BigInt(decimals);
}

export function microsToUsd(micros: bigint): number {
  return Number(micros) / 1_000_000;
}

export function applyBuy(position: Position, amountRaw: bigint, usdMicros: bigint): Position {
  return {
    qtyRaw: position.qtyRaw + amountRaw,
    costUsdMicros: position.costUsdMicros + usdMicros,
    realizedUsdMicros: position.realizedUsdMicros
  };
}

export interface SellResult {
  readonly position: Position;
  readonly realizedDeltaMicros: bigint;
  readonly creditedRaw: bigint;
}

/**
 * Sells against tracked basis only: the portion of the sale exceeding the tracked quantity has
 * no cost basis (acquired outside the app) and does not affect realized PnL.
 */
export function applySell(position: Position, amountRaw: bigint, usdMicros: bigint): SellResult {
  if (amountRaw <= 0n || position.qtyRaw <= 0n) {
    return { position, realizedDeltaMicros: 0n, creditedRaw: 0n };
  }
  const creditedRaw = amountRaw < position.qtyRaw ? amountRaw : position.qtyRaw;
  const proportionalCost = (position.costUsdMicros * creditedRaw) / position.qtyRaw;
  const creditedProceeds = (usdMicros * creditedRaw) / amountRaw;
  const realizedDeltaMicros = creditedProceeds - proportionalCost;
  return {
    position: {
      qtyRaw: position.qtyRaw - creditedRaw,
      costUsdMicros: position.costUsdMicros - proportionalCost,
      realizedUsdMicros: position.realizedUsdMicros + realizedDeltaMicros
    },
    realizedDeltaMicros,
    creditedRaw
  };
}

/**
 * Mark-to-market on the tracked position, capped by the wallet's current on-chain balance so
 * tokens transferred out stop counting. Basis scales proportionally with the capped quantity.
 */
export function unrealizedMicros(
  position: Position,
  onChainBalanceRaw: bigint | null,
  decimals: number,
  priceUsd: number | null
): bigint {
  if (position.qtyRaw <= 0n || priceUsd === null) {
    return 0n;
  }
  const effectiveQty =
    onChainBalanceRaw !== null && onChainBalanceRaw < position.qtyRaw
      ? onChainBalanceRaw
      : position.qtyRaw;
  if (effectiveQty <= 0n) {
    return 0n;
  }
  const scaledCost = (position.costUsdMicros * effectiveQty) / position.qtyRaw;
  const value = (effectiveQty * priceToMicros(priceUsd)) / 10n ** BigInt(decimals);
  return value - scaledCost;
}

export interface PositionJson {
  readonly q: string;
  readonly c: string;
  readonly r: string;
}

export function positionToJson(position: Position): PositionJson {
  return {
    q: position.qtyRaw.toString(),
    c: position.costUsdMicros.toString(),
    r: position.realizedUsdMicros.toString()
  };
}

export function positionFromJson(json: PositionJson | null | undefined): Position {
  if (!json) {
    return emptyPosition();
  }
  return {
    qtyRaw: BigInt(json.q),
    costUsdMicros: BigInt(json.c),
    realizedUsdMicros: BigInt(json.r)
  };
}
