"use client";

import { SIGN_GLYPHS } from "../../lib/zodiac";
import type { ZodiacSign } from "../../lib/zodiac";

export function HoroscopeCard({
  sign,
  reading
}: {
  sign: ZodiacSign;
  reading: { vibe: string; note: string; moodScore: number };
}) {
  const score = Math.max(0, Math.min(100, Math.round(reading.moodScore)));
  return (
    <section className="card">
      <div className="row">
        <span className="glyph">{SIGN_GLYPHS[sign]}</span>
        <div>
          <h2 style={{ margin: 0, textTransform: "capitalize" }}>{sign}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {reading.vibe}
          </p>
        </div>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.5 }}>{reading.note}</p>
      <div className="row spread">
        <span className="muted">Cosmic mood</span>
        <span className="muted">{score}/100</span>
      </div>
      <div className="mood-meter">
        <div style={{ width: `${score}%` }} />
      </div>
    </section>
  );
}
