"use client";

import type { BoardResponse } from "../../lib/trades/leaderboard";
import { EmptyState } from "../EmptyState";

function formatScore(board: "volume" | "pnl", score: number): string {
  const formatted = Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(Math.abs(score));
  if (board === "volume") {
    return `$${formatted}`;
  }
  return `${score < 0 ? "-" : "+"}$${formatted}`;
}

export function LeaderboardTable({ response }: { response: BoardResponse }) {
  if (response.entries.length === 0) {
    return (
      <section className="card">
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
              <rect x="9.25" y="6" width="5.5" height="14" rx="1.4" />
              <rect x="3" y="11" width="5.5" height="9" rx="1.4" />
              <rect x="15.5" y="9" width="5.5" height="11" rx="1.4" />
            </svg>
          }
          title="No rankings yet"
          hint="Swaps made inside the app appear here once they confirm on Base."
        />
      </section>
    );
  }

  return (
    <section className="card">
      <table className="board">
        <tbody>
          {response.entries.map((entry) => (
            <tr key={entry.fid}>
              <td className="muted" style={{ width: 32, fontVariantNumeric: "tabular-nums" }}>
                {entry.rank}
              </td>
              <td>
                <span className="row">
                  {entry.pfpUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="avatar" src={entry.pfpUrl} alt="" />
                  ) : null}
                  {entry.username ?? `fid ${entry.fid}`}
                </span>
              </td>
              <td
                style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                className={response.board === "pnl" ? (entry.score >= 0 ? "up" : "down") : ""}
              >
                {formatScore(response.board, entry.score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {response.me && !response.entries.some((entry) => entry.fid === response.me?.fid) ? (
        <p className="muted">
          You: #{response.me.rank} · {formatScore(response.board, response.me.score)}
        </p>
      ) : null}
    </section>
  );
}
