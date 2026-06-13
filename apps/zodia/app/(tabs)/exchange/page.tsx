"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ZODIAC_SIGNS } from "../../../lib/zodiac";
import type { ZodiacSign } from "../../../lib/zodiac";
import type { MarketPayload } from "../../../lib/market";
import { AppHeader, FooterNote, SkeletonRows } from "../../../components/AppHeader";
import { SwapSheet } from "../../../components/exchange/SwapSheet";
import { TapeTickerCard } from "../../../components/TapeFeed";
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
      <AppHeader title="Exchange" subtitle="The twelve official Zodiacs on Base" />

      <TapeTickerCard />

      {isLoading ? <SkeletonRows count={6} /> : null}

      <div className="list">
        {ZODIAC_SIGNS.map((sign) => (
          <TokenRow
            key={sign}
            sign={sign}
            snapshot={data?.snapshots.find((snapshot) => snapshot.sign === sign) ?? null}
            onTrade={() => setActive(sign)}
          />
        ))}
      </div>

      <FooterNote>
        Swaps open and execute in your wallet. Tokens can be volatile and illiquid — not investment
        advice.
      </FooterNote>

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
