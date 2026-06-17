"use client";

import { getZodiacToken } from "@zodiacs/sdk/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { MarketPayload, MarketSnapshotLite } from "../../lib/market";
import type { SocialFeedPayload } from "../../lib/social";
import { SIGN_GLYPHS, type ZodiacSign } from "../../lib/zodiac";
import { EmptyState } from "../EmptyState";
import { ShareButton } from "../ShareButton";
import { SignIcon } from "../SignIcon";
import { SocialCastRow } from "../social/SocialCastRow";
import { SwapSheet } from "./SwapSheet";

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return "-";
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toPrecision(3)}`;
}

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatChange(change: number | null | undefined): string {
  if (change === null || change === undefined) {
    return "-";
  }
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}

function primaryCashtag(sign: ZodiacSign): string {
  if (sign === "sagittarius") {
    return "$SAGIT";
  }
  return `$${getZodiacToken(sign).ticker}`;
}

function useMarketSnapshot(sign: ZodiacSign): {
  snapshot: MarketSnapshotLite | null;
  isLoading: boolean;
} {
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

  return {
    snapshot: data?.snapshots.find((entry) => entry.sign === sign) ?? null,
    isLoading
  };
}

function useSocialFeed(sign: ZodiacSign) {
  return useInfiniteQuery({
    queryKey: ["social-feed", sign],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ sign, limit: "25" });
      if (typeof pageParam === "string" && pageParam) {
        params.set("cursor", pageParam);
      }
      const response = await fetch(`/api/social/feed?${params.toString()}`);
      if (!response.ok) {
        throw new Error("social feed unavailable");
      }
      return (await response.json()) as SocialFeedPayload;
    },
    getNextPageParam: (lastPage: SocialFeedPayload) => lastPage.nextCursor ?? undefined,
    refetchInterval: 15000
  });
}

export function TokenDetail({ sign }: { sign: ZodiacSign }) {
  const [swapOpen, setSwapOpen] = useState(false);
  const token = getZodiacToken(sign);
  const cashtag = primaryCashtag(sign);
  const { snapshot, isLoading: marketLoading } = useMarketSnapshot(sign);
  const feed = useSocialFeed(sign);
  const pages = feed.data?.pages ?? [];
  const casts = useMemo(() => pages.flatMap((page) => page.casts), [pages]);
  const feedDisabled = pages.some((page) => page.disabled);
  const change = snapshot?.change24h ?? null;

  return (
    <div className="token-detail-shell">
      <section className="card token-sticky-card">
        <div className="token-detail-topline">
          <Link href="/exchange" className="detail-back">
            &lt; Exchange
          </Link>
          <span className="live-pill">
            <span aria-hidden />
            Live feed
          </span>
        </div>

        <div className="token-hero-line">
          <SignIcon sign={sign} size={54} />
          <div className="token-heading">
            <span className="eyebrow">Base Zodiac</span>
            <h1>{token.name}</h1>
            <p>
              {SIGN_GLYPHS[sign]} {cashtag}
            </p>
          </div>
          <button className="primary" onClick={() => setSwapOpen(true)}>
            Buy/Sell
          </button>
        </div>

        <div className="token-metrics" aria-label="Market snapshot">
          <div>
            <span>Price</span>
            <strong>{marketLoading ? "..." : formatPrice(snapshot?.priceUsd)}</strong>
          </div>
          <div>
            <span>24h</span>
            <strong className={change === null ? "" : change >= 0 ? "up" : "down"}>
              {marketLoading ? "..." : formatChange(change)}
            </strong>
          </div>
          <div>
            <span>Volume</span>
            <strong>{marketLoading ? "..." : formatCompact(snapshot?.volume24h)}</strong>
          </div>
        </div>

        <div className="token-action-row">
          <ShareButton
            label={`Cast about ${cashtag}`}
            text={`${cashtag} ${token.name} is live on Zodia.`}
            embedPath={`/exchange/${sign}`}
          />
        </div>
      </section>

      <section className="social-feed-section" aria-label={`${token.name} Farcaster feed`}>
        <div className="social-feed-header">
          <h2>Farcaster casts</h2>
          <span>refreshes every 15s</span>
        </div>

        {feedDisabled ? (
          <div className="card feed-state">
            <p className="empty-state-title">Social feed needs Neynar</p>
            <p className="empty-state-hint">Add NEYNAR_API_KEY to show public casts here.</p>
          </div>
        ) : feed.isError ? (
          <div className="card feed-state">
            <p className="empty-state-title">Social feed unavailable</p>
            <p className="empty-state-hint">
              The token page still works; casts can retry on refresh.
            </p>
          </div>
        ) : feed.isLoading ? (
          <div className="list" aria-hidden>
            <div className="skeleton" style={{ height: 132 }} />
            <div className="skeleton" style={{ height: 132 }} />
            <div className="skeleton" style={{ height: 132 }} />
          </div>
        ) : casts.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<span aria-hidden>{SIGN_GLYPHS[sign]}</span>}
              title="No recent casts for this sign yet."
              hint={`Start one with ${cashtag}.`}
            />
          </div>
        ) : (
          <>
            <div className="social-feed-list">
              {casts.map((cast) => (
                <SocialCastRow key={cast.id} cast={cast} />
              ))}
            </div>
            {feed.hasNextPage ? (
              <button
                className="ghost load-more"
                disabled={feed.isFetchingNextPage}
                onClick={() => void feed.fetchNextPage()}
              >
                {feed.isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            ) : null}
          </>
        )}
      </section>

      {swapOpen ? (
        <SwapSheet
          sign={sign}
          priceUsd={snapshot?.priceUsd ?? null}
          onClose={() => setSwapOpen(false)}
        />
      ) : null}
    </div>
  );
}
