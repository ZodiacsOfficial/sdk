"use client";

import { SIGN_GLYPHS } from "../../lib/zodiac";
import type { ZodiacSign } from "../../lib/zodiac";
import type { MarketSnapshotLite } from "../../lib/market";

function formatPrice(price: number | null): string {
  if (price === null) {
    return "—";
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toPrecision(3)}`;
}

function formatCompact(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function TokenRow({
  sign,
  snapshot,
  onTrade
}: {
  sign: ZodiacSign;
  snapshot: MarketSnapshotLite | null;
  onTrade: () => void;
}) {
  const change = snapshot?.change24h ?? null;
  return (
    <div className="card row spread">
      <div className="row">
        <span className="glyph">{SIGN_GLYPHS[sign]}</span>
        <div>
          <div style={{ textTransform: "capitalize", fontWeight: 600 }}>{sign}</div>
          <div className="muted">24h vol {formatCompact(snapshot?.volume24h ?? null)}</div>
        </div>
      </div>
      <div className="row">
        <div style={{ textAlign: "right" }}>
          <div>{formatPrice(snapshot?.priceUsd ?? null)}</div>
          <div className={change === null ? "muted" : change >= 0 ? "up" : "down"}>
            {change === null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
          </div>
        </div>
        <button className="primary" onClick={onTrade}>
          Trade
        </button>
      </div>
    </div>
  );
}
