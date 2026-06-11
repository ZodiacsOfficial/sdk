"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ZODIAC_SIGNS } from "../../../lib/zodiac";
import type { ZodiacSign } from "../../../lib/zodiac";
import type { MarketPayload } from "../../../lib/market";
import { SwapSheet } from "../../../components/exchange/SwapSheet";
import { TokenRow } from "../../../components/exchange/TokenRow";

export default function ExchangePage() {
  const [active, setActive] = useState<ZodiacSign | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["market"],
    queryFn: async () => {
      const response = await fetch("/api/market");
      if (!response.ok) {
        throw new Error("market unavailable");
      }
      return (await response.json()) as MarketPayload;
    },
    refetchInterval: 30000
  });

  return (
    <>
      <section className="card">
        <h2>The twelve, on Base</h2>
        <p className="muted">
          Official bridged representations from the Zodiacs.org registry. Swaps open in your
          wallet's native swap sheet.
        </p>
      </section>

      {isLoading ? <p className="muted">Reading the tape…</p> : null}

      <div style={{ display: "grid", gap: 8 }}>
        {ZODIAC_SIGNS.map((sign) => (
          <TokenRow
            key={sign}
            sign={sign}
            snapshot={data?.snapshots.find((snapshot) => snapshot.sign === sign) ?? null}
            onTrade={() => setActive(sign)}
          />
        ))}
      </div>

      <p className="disclaimer">
        Nothing here is investment advice. Tokens can be volatile and illiquid; only swap what you
        can afford to lose. Swaps execute in your wallet, not in this app.
      </p>

      {active ? (
        <SwapSheet
          sign={active}
          priceUsd={data?.snapshots.find((snapshot) => snapshot.sign === active)?.priceUsd ?? null}
          onClose={() => setActive(null)}
        />
      ) : null}
    </>
  );
}
