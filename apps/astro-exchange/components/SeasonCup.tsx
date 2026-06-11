"use client";

import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import type { CupResponse } from "../lib/cup";
import { SIGN_GLYPHS } from "../lib/zodiac";
import { ShareButton } from "./ShareButton";
import { SignIcon } from "./SignIcon";
import { SIGN_COLORS } from "./signTheme";

function formatUsd(usd: number): string {
  return `$${Intl.NumberFormat("en", { maximumFractionDigits: usd < 10 ? 2 : 0 }).format(usd)}`;
}

export function SeasonCup() {
  const { data } = useQuery({
    queryKey: ["cup"],
    queryFn: async () => {
      const response = await fetch("/api/cup");
      if (!response.ok) {
        throw new Error("cup unavailable");
      }
      return (await response.json()) as CupResponse;
    },
    refetchInterval: 60000
  });

  if (!data) {
    return null;
  }

  const { season, standings, reigning } = data;
  const top = standings.slice(0, 3);
  const max = Math.max(top[0]?.volumeUsd ?? 0, 1);
  const hasActivity = (top[0]?.volumeUsd ?? 0) > 0;

  return (
    <section
      className="card cup-card"
      style={{ "--sign-accent": SIGN_COLORS[season.sign] } as CSSProperties}
    >
      <div className="row spread">
        <div className="row">
          <SignIcon sign={season.sign} size={42} />
          <div>
            <h2 style={{ margin: 0 }}>{season.displayName} Season Cup</h2>
            <p className="muted" style={{ margin: 0 }}>
              Sign vs sign · in-app volume
            </p>
          </div>
        </div>
        <span className="delta-pill flat">
          {season.daysLeft === 0 ? "Final day" : `${season.daysLeft}d left`}
        </span>
      </div>

      {hasActivity ? (
        <div className="cup-rows">
          {top.map((standing, index) => (
            <div key={standing.sign} className="cup-row">
              <span className="cup-rank">{index + 1}</span>
              <SignIcon sign={standing.sign} size={26} />
              <div className="cup-track">
                <div
                  className="cup-fill"
                  data-first={index === 0}
                  style={{ width: `${Math.max(6, (standing.volumeUsd / max) * 100)}%` }}
                />
              </div>
              <span className="cup-volume">{formatUsd(standing.volumeUsd)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No swaps this season yet — the first sign on the tape takes the lead.
        </p>
      )}

      <div className="row spread">
        {reigning ? (
          <span className="muted row" style={{ gap: 6, fontSize: 12 }}>
            Reigning champion <SignIcon sign={reigning.sign} size={16} />
            <span style={{ textTransform: "capitalize" }}>{reigning.sign}</span>
          </span>
        ) : (
          <span className="muted" style={{ fontSize: 12 }}>
            First cup — history starts now
          </span>
        )}
        <ShareButton
          label="Fly the flag"
          text={`${SIGN_GLYPHS[season.sign]} ${season.displayName} Season Cup is live — sign vs sign on Zodia. No prizes, eternal glory.`}
          embedPath="/share/cup"
        />
      </div>
    </section>
  );
}
