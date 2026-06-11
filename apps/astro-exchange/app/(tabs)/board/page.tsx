"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { authHeaders } from "../../../lib/clientApi";
import type { BoardResponse } from "../../../lib/trades/leaderboard";
import { AppHeader, FooterNote } from "../../../components/AppHeader";
import { LeaderboardTable } from "../../../components/board/LeaderboardTable";
import { Segmented } from "../../../components/Segmented";
import { TapeFeed } from "../../../components/TapeFeed";

export default function BoardPage() {
  const [board, setBoard] = useState<"volume" | "pnl">("volume");
  const [window, setWindow] = useState<"weekly" | "alltime">("weekly");

  const { data, isLoading } = useQuery({
    queryKey: ["board", board, window],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?board=${board}&window=${window}`, {
        headers: await authHeaders()
      });
      if (!response.ok) {
        throw new Error("board unavailable");
      }
      return (await response.json()) as BoardResponse;
    },
    refetchInterval: 60000
  });

  return (
    <>
      <AppHeader title="Leaderboard" subtitle="In-app swaps only · no prizes" />

      <Segmented
        value={board}
        onChange={setBoard}
        options={[
          { value: "volume", label: "Volume" },
          { value: "pnl", label: "PnL" }
        ]}
      />
      <Segmented
        value={window}
        onChange={setWindow}
        options={[
          { value: "weekly", label: "This week" },
          { value: "alltime", label: "All time" }
        ]}
      />

      {isLoading ? <p className="muted">Loading rankings…</p> : null}
      {data ? <LeaderboardTable response={data} /> : null}

      <section className="card">
        <div className="row spread" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Cosmic Tape</h2>
          <span className="row" style={{ gap: 6 }}>
            <span className="live-dot" />
            <span className="muted">live</span>
          </span>
        </div>
        <TapeFeed limit={30} />
      </section>

      <FooterNote>
        Ranks count only swaps started inside this app, valued in USD at credit time. Entertainment
        leaderboard — nothing redeemable.
      </FooterNote>
    </>
  );
}
