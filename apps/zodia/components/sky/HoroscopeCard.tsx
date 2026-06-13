"use client";

import type { CSSProperties } from "react";
import type { ZodiacSign } from "../../lib/zodiac";
import { SignIcon } from "../SignIcon";
import { SIGN_COLORS } from "../signTheme";

export function HoroscopeCard({
  sign,
  reading
}: {
  sign: ZodiacSign;
  reading: { vibe: string; note: string; moodScore: number };
}) {
  const score = Math.max(0, Math.min(100, Math.round(reading.moodScore)));
  return (
    <section
      className="card hero-card"
      style={{ "--sign-accent": SIGN_COLORS[sign] } as CSSProperties}
    >
      <div className="row" style={{ gap: 14 }}>
        <SignIcon sign={sign} size={64} />
        <div>
          <h2 style={{ margin: 0, fontSize: 24, textTransform: "capitalize" }}>{sign}</h2>
          <p className="vibe">{reading.vibe}</p>
        </div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.55, margin: "12px 0" }}>{reading.note}</p>
      <div className="row spread">
        <span className="muted">Cosmic mood</span>
        <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
          {score}/100
        </span>
      </div>
      <div className="mood-meter" style={{ marginTop: 6 }}>
        <div style={{ width: `${score}%` }} />
      </div>
    </section>
  );
}
