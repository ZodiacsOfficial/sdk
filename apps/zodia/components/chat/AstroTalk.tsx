"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { AstroTalkFeedPayload } from "../../lib/social";
import { EmptyState } from "../EmptyState";
import { ShareButton } from "../ShareButton";
import { SocialCastRow } from "../social/SocialCastRow";

function useAstroTalkFeed() {
  return useInfiniteQuery({
    queryKey: ["social-feed", "astrotalk"],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "25" });
      if (typeof pageParam === "string" && pageParam) {
        params.set("cursor", pageParam);
      }
      const response = await fetch(`/api/social/astrotalk?${params.toString()}`);
      if (!response.ok) {
        throw new Error("astrotalk unavailable");
      }
      return (await response.json()) as AstroTalkFeedPayload;
    },
    getNextPageParam: (lastPage: AstroTalkFeedPayload) => lastPage.nextCursor ?? undefined,
    refetchInterval: 15000
  });
}

export function AstroTalk() {
  const feed = useAstroTalkFeed();
  const pages = feed.data?.pages ?? [];
  const casts = useMemo(() => pages.flatMap((page) => page.casts), [pages]);
  const feedDisabled = pages.some((page) => page.disabled);

  return (
    <section className="astrotalk-shell">
      <div className="card astrotalk-hero">
        <div>
          <span className="eyebrow">Farcaster window</span>
          <h2>AstroTalk</h2>
          <p>Public casts about Zodia, refreshed for the Base app.</p>
        </div>
        <div className="astrotalk-actions">
          <span className="live-pill">
            <span aria-hidden />
            refreshes every 15s
          </span>
          <ShareButton
            label="Cast in AstroTalk"
            text="Talking Zodia on AstroTalk."
            embedPath="/chat"
          />
        </div>
      </div>

      {feedDisabled ? (
        <div className="card feed-state">
          <p className="empty-state-title">AstroTalk needs Neynar</p>
          <p className="empty-state-hint">Add NEYNAR_API_KEY to show public casts here.</p>
        </div>
      ) : feed.isError ? (
        <div className="card feed-state">
          <p className="empty-state-title">AstroTalk unavailable</p>
          <p className="empty-state-hint">Farcaster casts can retry on refresh.</p>
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
            icon={<span aria-hidden>AT</span>}
            title="No recent Farcaster casts about Zodia yet."
            hint="Start the conversation from AstroTalk."
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
  );
}
