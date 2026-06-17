"use client";

import Link from "next/link";
import type { ZodiacSign } from "../../lib/zodiac";
import type { MarketSnapshotLite } from "../../lib/market";
import { SignIcon } from "../SignIcon";

function formatPrice(price: number | null): string {
  if (price === null) {
    return "—";
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toPrecision(3)}`;
}

function formatCompact(value: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function TokenRow({
  sign,
  snapshot
}: {
  sign: ZodiacSign;
  snapshot: MarketSnapshotLite | null;
}) {
  const change = snapshot?.change24h ?? null;
  const volume = snapshot?.volume24h ?? null;
  return (
    <Link className="list-row" href={`/exchange/${sign}`}>
      <SignIcon sign={sign} size={40} />
      <span className="grow">
        <span className="name">{sign}</span>
        <span className="sub" style={{ display: "block" }}>
          {volume !== null ? `Vol ${formatCompact(volume)} · 24h` : "No market data yet"}
        </span>
      </span>
      <span className="end">
        <span className="price">{formatPrice(snapshot?.priceUsd ?? null)}</span>
        <span className={`delta-pill ${change === null ? "flat" : change >= 0 ? "up" : "down"}`}>
          {change === null ? "·" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
        </span>
      </span>
      <span className="chev">›</span>
    </Link>
  );
}
