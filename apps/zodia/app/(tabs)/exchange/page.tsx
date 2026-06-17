"use client";

import { useQuery } from "@tanstack/react-query";
import { ZODIAC_SIGNS } from "../../../lib/zodiac";
import type { MarketPayload } from "../../../lib/market";
import { AppHeader, FooterNote, SkeletonRows } from "../../../components/AppHeader";
import { TokenRow } from "../../../components/exchange/TokenRow";

export default function ExchangePage() {
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

      {isLoading ? <SkeletonRows count={6} /> : null}

      <div className="list">
        {ZODIAC_SIGNS.map((sign) => (
          <TokenRow
            key={sign}
            sign={sign}
            snapshot={data?.snapshots.find((snapshot) => snapshot.sign === sign) ?? null}
          />
        ))}
      </div>

      <FooterNote>
        Swaps open and execute in your wallet. Tokens can be volatile and illiquid — not investment
        advice.
      </FooterNote>
    </>
  );
}
