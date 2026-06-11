"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { appUrl } from "../minikit.config";
import { primaryLeg, relativeTime } from "../lib/tape";
import type { TapeItem, TradeTapeItem } from "../lib/tape";
import { EmptyState } from "./EmptyState";
import { SignIcon } from "./SignIcon";

function formatUsd(usd: number): string {
  return `$${Intl.NumberFormat("en", { maximumFractionDigits: usd < 10 ? 2 : 0 }).format(usd)}`;
}

async function castTrade(item: TradeTapeItem) {
  const leg = primaryLeg(item);
  if (!leg) {
    return;
  }
  const who = item.username ?? "A stargazer";
  try {
    await sdk.actions.composeCast({
      text: `${who} just made a ${formatUsd(leg.usd)} move on ${leg.sign} via Zodia ✦`,
      embeds: [`${appUrl}/share/trade/${item.txHash}`]
    });
  } catch {
    // Casting only works inside a mini app host.
  }
}

function TradeLine({ item }: { item: TradeTapeItem }) {
  const leg = primaryLeg(item);
  if (!leg) {
    return null;
  }
  return (
    <div className="tape-item">
      <SignIcon sign={leg.sign} size={28} />
      <span className="tape-text">
        <strong>{item.username ?? `fid ${item.fid}`}</strong>{" "}
        {leg.direction === "buy" ? "bought" : "sold"}{" "}
        <span style={{ textTransform: "capitalize" }}>{leg.sign}</span>
        {item.legs.length > 1 ? " +" : ""} · {formatUsd(item.volumeUsd)}
      </span>
      <span className="tape-end">
        <button className="tape-cast" aria-label="Cast this" onClick={() => void castTrade(item)}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </button>
        <span className="tape-time">{relativeTime(item.ts)}</span>
      </span>
    </div>
  );
}

function SkyLine({ item }: { item: Extract<TapeItem, { type: "sky" }> }) {
  return (
    <div className="tape-item">
      <span className="tape-spark" aria-hidden>
        ✦
      </span>
      <span className="tape-text">
        <strong>Daily sky</strong> · {item.headline}
      </span>
      <span className="tape-end">
        <span className="tape-time">{relativeTime(item.ts)}</span>
      </span>
    </div>
  );
}

function useTape() {
  return useQuery({
    queryKey: ["tape"],
    queryFn: async () => {
      const response = await fetch("/api/tape?limit=50");
      if (!response.ok) {
        throw new Error("tape unavailable");
      }
      return (await response.json()) as { items: TapeItem[] };
    },
    refetchInterval: 15000
  });
}

function TapeLines({ items }: { items: readonly TapeItem[] }) {
  return (
    <div className="tape-list">
      {items.map((item) =>
        item.type === "trade" ? (
          <TradeLine key={item.id} item={item} />
        ) : (
          <SkyLine key={item.id} item={item} />
        )
      )}
    </div>
  );
}

/** Compact card for the Exchange tab: hides itself entirely while the tape is empty. */
export function TapeTickerCard() {
  const { data } = useTape();
  const items = (data?.items ?? []).slice(0, 3);
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="card">
      <div className="row spread" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Cosmic Tape</h2>
        <Link href="/board" className="muted" style={{ fontSize: 12 }}>
          Full tape →
        </Link>
      </div>
      <TapeLines items={items} />
    </section>
  );
}

export function TapeFeed({ limit = 30 }: { limit?: number }) {
  const { data } = useTape();
  const items = (data?.items ?? []).slice(0, limit);

  if (data && items.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h3l2.5-6 4 12 2.5-6h6" />
          </svg>
        }
        title="The tape is quiet"
        hint="Verified swaps and daily sky drops appear here live."
      />
    );
  }

  return <TapeLines items={items} />;
}
