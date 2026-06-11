"use client";

import type { BoardResponse } from "../../lib/trades/leaderboard";

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
        <p className="muted">No entries yet. Be the first constellation on the board.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <table className="board">
        <tbody>
          {response.entries.map((entry) => (
            <tr key={entry.fid}>
              <td className="muted" style={{ width: 32 }}>
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
                style={{ textAlign: "right" }}
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
