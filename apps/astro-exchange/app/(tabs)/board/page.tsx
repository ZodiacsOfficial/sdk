"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { authHeaders } from "../../../lib/clientApi";
import type { BoardResponse } from "../../../lib/trades/leaderboard";
import { LeaderboardTable } from "../../../components/board/LeaderboardTable";

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
      <section className="card">
        <h2>Cosmic leaderboard</h2>
        <div className="chips">
          <button
            className="chip"
            data-active={board === "volume"}
            onClick={() => setBoard("volume")}
          >
            Volume
          </button>
          <button className="chip" data-active={board === "pnl"} onClick={() => setBoard("pnl")}>
            PnL
          </button>
          <button
            className="chip"
            data-active={window === "weekly"}
            onClick={() => setWindow("weekly")}
          >
            This week
          </button>
          <button
            className="chip"
            data-active={window === "alltime"}
            onClick={() => setWindow("alltime")}
          >
            All time
          </button>
        </div>
        {board === "pnl" && window === "weekly" ? (
          <p className="muted">Weekly PnL counts realized results inside the week.</p>
        ) : null}
      </section>

      {isLoading ? <p className="muted">Summoning the rankings…</p> : null}
      {data ? <LeaderboardTable response={data} /> : null}

      <p className="disclaimer">
        Boards rank only swaps started inside this app, valued in USD at credit time. Entertainment
        leaderboard — no prizes, no rewards, nothing redeemable. Not investment advice.
      </p>
    </>
  );
}
